"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Building2,
  Shield,
  AlertTriangle,
} from "lucide-react";

type Step = "email" | "verify" | "account" | "success";

interface AgencyInfo {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  claim_status: string;
}

function ClaimContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agency, setAgency] = useState<AgencyInfo | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch(`/api/agencies/${slug}/claim-info`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Agency not found");
        }
        const json = await res.json();
        setAgency(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agency");
      } finally {
        setPageLoading(false);
      }
    }
    fetchAgency();
  }, [slug]);

  const handleSendCode = async () => {
    if (!agency) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agencies/claim/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency.id, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send code");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    if (!agency) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agencies/claim/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          email,
          code,
          password,
          name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-navy">Agency Not Found</h1>
          <p className="mt-2 text-gray-600">{error || "This agency does not exist or cannot be claimed."}</p>
          <Link href="/agencies" className="inline-flex items-center gap-2 mt-6 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors">
            Browse Agencies
          </Link>
        </div>
      </div>
    );
  }

  if (agency.claim_status === "claimed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-navy">Already Claimed</h1>
          <p className="mt-2 text-gray-600">This agency has already been claimed by its owner.</p>
          <Link href={`/agencies/${slug}`} className="inline-flex items-center gap-2 mt-6 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors">
            View Agency Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Claim Your Agency</h1>
          <p className="mt-2 text-gray-600">
            Verify ownership of <strong>{agency.name}</strong> and manage your profile.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["email", "verify", "account"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-brand text-white"
                    : step === "success" || (["email", "verify", "account"].indexOf(step) > i)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step === "success" || (["email", "verify", "account"].indexOf(step) > i) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-navy mb-1">Verify Your Email</h2>
            <p className="text-sm text-gray-500 mb-6">
              {agency.website
                ? `Enter your company email address (must match @${new URL(agency.website.startsWith("http") ? agency.website : `https://${agency.website}`).hostname.replace(/^www\./, "")}).`
                : "Enter your business email address to verify ownership."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <button
                onClick={handleSendCode}
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600">
                  We verify ownership by sending a code to your company email. This ensures only authorized representatives can claim an agency profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === "verify" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-navy mb-1">Enter Verification Code</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (code.length === 6) {
                    setError(null);
                    setStep("account");
                  } else {
                    setError("Please enter the full 6-digit code");
                  }
                }}
                disabled={code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("email"); setCode(""); setError(null); }}
                  className="text-sm text-gray-500 hover:text-navy flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-sm text-brand hover:text-brand-dark font-medium"
                >
                  {loading ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Create Account */}
        {step === "account" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-navy mb-1">Set Up Your Account</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create your account to manage <strong>{agency.name}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyAndCreate}
                disabled={loading || !name || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Claim Agency & Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => { setStep("verify"); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-navy flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to verification
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-navy">Agency Claimed Successfully!</h2>
            <p className="mt-2 text-gray-600">
              You are now the owner of <strong>{agency.name}</strong>. You can manage your agency profile from your dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href={`/agencies/${slug}`}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-navy py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                View Public Profile
              </Link>
            </div>
          </div>
        )}

        {/* Back link */}
        {step !== "success" && (
          <div className="mt-6 text-center">
            <Link href={`/agencies/${slug}`} className="text-sm text-gray-500 hover:text-navy">
              &larr; Back to agency profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
