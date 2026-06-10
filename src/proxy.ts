import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret-change-in-prod"
);

const protectedPaths = ["/dashboard", "/admin"];
const adminPaths = ["/admin"];
const authPaths = ["/auth/signin", "/auth/signup"];
const verifyPath = "/auth/verify-email";

const adminRoles = ["super_admin", "admin"];

interface ProxyTokenPayload {
  sub?: string;
  role?: string;
  emailVerified?: boolean;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check both legacy session token and new JWT access token
  const accessToken = request.cookies.get("access_token")?.value;
  const legacySessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const hasSession = !!accessToken || !!legacySessionToken;

  let tokenPayload: ProxyTokenPayload | null = null;
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      tokenPayload = payload as unknown as ProxyTokenPayload;
    } catch {
      // Expired/invalid token — clear it
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
  const isVerifyPage = pathname.startsWith(verifyPath);

  // Redirect unauthenticated users from protected pages
  if (isProtected && !hasSession) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Enforce email verification for protected areas
  if (isProtected && tokenPayload && !tokenPayload.emailVerified && !isVerifyPage) {
    return NextResponse.redirect(new URL("/auth/verify-email", request.url));
  }

  // Enforce admin role for admin paths
  if (isAdminPath && tokenPayload && !adminRoles.includes(tokenPayload.role || "")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
