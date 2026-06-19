import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const jwtSecretValue = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const JWT_SECRET = jwtSecretValue ? new TextEncoder().encode(jwtSecretValue) : null;

const protectedPaths = ["/dashboard", "/admin", "/client"];
const adminPaths = ["/admin"];
const authPaths = ["/auth/signin", "/auth/signup"];
const verifyPaths = ["/auth/verify-email", "/auth/verify-otp"];

const adminRoles = ["super_admin", "admin"];
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface ProxyTokenPayload {
  sub?: string;
  role?: string;
  emailVerified?: boolean;
}

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (mutatingMethods.has(request.method) && pathname.startsWith("/api/")) {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const hasSession = !!accessToken;

  let tokenPayload: ProxyTokenPayload | null = null;
  if (accessToken && JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      tokenPayload = payload as unknown as ProxyTokenPayload;
    } catch {
      const response = NextResponse.redirect(new URL("/auth/signin", request.url));
      response.cookies.delete("access_token");
      if (protectedPaths.some((p) => pathname.startsWith(p))) {
        return response;
      }
    }
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));
  const isVerifyPage = verifyPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isProtected && tokenPayload && !tokenPayload.emailVerified && !isVerifyPage) {
    return NextResponse.redirect(new URL("/auth/verify-email", request.url));
  }

  if (isAdminPath && tokenPayload && !adminRoles.includes(tokenPayload.role || "")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthPath && hasSession && !isVerifyPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/client/:path*",
    "/api/:path*",
  ],
};
