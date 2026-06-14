"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Star,
  Users,
  Shield,
} from "lucide-react";

type PageState = "verifying" | "verified" | "otp-entry" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-160px)] flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const prefilledCode = searchParams.get("code");

  const [state, setState] = useState<PageState>(
    token ? "verifying" : email ? "otp-entry" : "error"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState<string[]>(
    prefilledCode && prefilledCode.length === 6
      ? prefilledCode.split("")
      : ["", "", "", "", "", ""]
  );
  const [showCodeHint, setShowCodeHint] = useState(!!prefilledCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoRequesting, setAutoRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasVerified = useRef(false);

  // Auto-verify token on mount
  const verifyToken = useCallback(async () => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;
    setState("verifying");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || "Verification failed. The link may have expired.");
        setState("error");
        return;
      }
      setState("verified");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-request OTP on mount when no code is prefilled
  const hasRequested = useRef(false);
  useEffect(() => {
    if (state !== "otp-entry" || !email || hasRequested.current) return;
    if (prefilledCode && prefilledCode.length === 6) return;
    hasRequested.current = true;
    setAutoRequesting(true);
    setStatusMessage("Requesting verification code...");
    fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "email_verification" }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.data?.otp) {
          const digits = result.data.otp.split("");
          setOtp(digits);
          setShowCodeHint(true);
          setStatusMessage("Code received, verifying...");
        } else {
          setStatusMessage("Code sent to your email");
          setAutoRequesting(false);
        }
      })
      .catch(() => {
        setStatusMessage("");
        setAutoRequesting(false);
      });
  }, [state, email, prefilledCode]);

  // Auto-submit prefilled OTP (from URL or auto-request)
  const hasAutoSubmitted = useRef(false);
  useEffect(() => {
    const code = otp.join("");
    if (code.length !== 6 || !email || state !== "otp-entry" || hasAutoSubmitted.current || isSubmitting) return;
    if (!prefilledCode && !showCodeHint) return;
    hasAutoSubmitted.current = true;
    setIsSubmitting(true);
    setStatusMessage("Verifying code...");
    fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, type: "email_verification" }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          setErrorMessage(result.error);
          setOtp(["", "", "", "", "", ""]);
          setShowCodeHint(false);
          hasAutoSubmitted.current = false;
          setStatusMessage("");
          setAutoRequesting(false);
        } else {
          setStatusMessage("Verified! Redirecting...");
          window.location.href = "/dashboard";
        }
      })
      .catch(() => {
        setErrorMessage("Something went wrong. Please try again.");
        hasAutoSubmitted.current = false;
        setStatusMessage("");
        setAutoRequesting(false);
      })
      .finally(() => setIsSubmitting(false));
  }, [otp, email, state, prefilledCode, showCodeHint, isSubmitting]);

  // No token or email provided
  useEffect(() => {
    if (!token && !email) {
      setErrorMessage("Invalid verification link. Please check your email and try again.");
    }
  }, [token, email]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      digits.forEach((d, i) => {
        if (i + index < 6) newOtp[i + index] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type: "email_verification" }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || "Invalid code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    setStatusMessage("Requesting verification code...");
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "email_verification" }),
      });
      const result = await res.json();
      if (result.data?.otp) {
        const digits = result.data.otp.split("");
        hasAutoSubmitted.current = false;
        setOtp(digits);
        setShowCodeHint(true);
        setStatusMessage("Code received, verifying...");
      } else {
        setStatusMessage("Code sent to your email");
      }
      setResendCooldown(60);
    } catch {
      setErrorMessage("Failed to resend code. Please try again.");
      setStatusMessage("");
    }
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex">
      {/* Left: Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-8">
          {/* Verifying state */}
          {state === "verifying" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <span className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy">
                  Verifying your email
                </h1>
                <p className="mt-2 text-gray-500">
                  Please wait while we verify your email address...
                </p>
              </div>
            </div>
          )}

          {/* Verified state */}
          {state === "verified" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy">
                  Email verified
                </h1>
                <p className="mt-2 text-gray-500">
                  Your email address has been successfully verified. You can now
                  access all features of your account.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                Continue to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* OTP entry state */}
          {state === "otp-entry" && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {autoRequesting ? (
                    <span className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                      <Mail className="h-8 w-8 text-brand" />
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-navy">
                  {autoRequesting ? "Verifying your email" : "Check your email"}
                </h1>
                {statusMessage && (
                  <p className="mt-2 text-sm font-medium text-brand">{statusMessage}</p>
                )}
                {!autoRequesting && (
                  <p className="mt-2 text-gray-500">
                    {showCodeHint
                      ? "Your verification code has been auto-filled below. Click Verify to continue."
                      : "We sent a verification code to"}
                  </p>
                )}
                {!showCodeHint && !autoRequesting && (
                  <p className="mt-1 font-medium text-navy">{email}</p>
                )}
                {showCodeHint && !autoRequesting && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    Email delivery is not configured yet. Once you add your RESEND_API_KEY, codes will be emailed automatically.
                  </p>
                )}
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* OTP inputs */}
                <div>
                  <label className="block text-sm font-medium text-navy text-center mb-3">
                    Enter verification code
                  </label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                          if (pasted) handleOtpChange(i, pasted);
                        }}
                        className="h-14 w-12 rounded-lg border border-gray-200 bg-white text-center text-xl font-semibold text-navy shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg bg-danger/5 border border-danger/20 px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                    <p className="text-sm text-danger">{errorMessage}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || otp.join("").length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Verify
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Didn&apos;t receive the code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy">
                  Verification failed
                </h1>
                <p className="mt-2 text-gray-500">
                  {errorMessage || "Something went wrong during verification."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                {token && (
                  <button
                    type="button"
                    onClick={() => {
                      hasVerified.current = false;
                      verifyToken();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                )}
                <Link
                  href="/auth/signin"
                  className="text-sm font-semibold text-brand hover:text-brand-dark transition"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Marketing panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-navy px-12">
        <div className="max-w-md space-y-8 text-white">
          <h2 className="text-3xl font-bold leading-tight">
            You&apos;re almost there
          </h2>
          <p className="text-lg text-gray-300">
            Verify your email to unlock the full power of AgencyHub and start
            connecting with top-rated agencies.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: Star,
                title: "50,000+ Verified Reviews",
                desc: "Real feedback from real clients to guide your decision.",
              },
              {
                icon: Users,
                title: "10,000+ Agencies Listed",
                desc: "The largest curated directory of marketing agencies.",
              },
              {
                icon: Shield,
                title: "Secure & Trusted",
                desc: "Your data is protected with enterprise-grade security.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-5 w-5 text-brand-light" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-white/5 p-5 border border-white/10">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-warning text-warning"
                />
              ))}
            </div>
            <p className="text-sm text-gray-300 italic">
              &ldquo;AgencyHub saved us weeks of research. We found the perfect
              SEO agency within days and our organic traffic has doubled.&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium">
              Sarah M.{" "}
              <span className="text-gray-400">— VP Marketing, TechCorp</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
