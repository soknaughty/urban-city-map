'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bone, Mail, Loader2, ArrowRight } from "lucide-react";

const API_BASE = "https://urbandog-production.up.railway.app/api/v1";
const PORTAL_TOKEN_KEY = "urbandog_portal_token";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "authenticating">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 1. Use Next.js native hook to catch the token safely
    const urlToken = searchParams.get("token");

    if (urlToken) {
      setStatus("authenticating");
      try {
        localStorage.setItem(PORTAL_TOKEN_KEY, urlToken);
      } catch (e) {
        console.warn("Local storage unavailable.");
      }
      // Bounce them straight to the dashboard, carrying the token just in case!
      router.replace(`/portal/dashboard?token=${urlToken}`);
      return;
    }

    // 2. If already logged in, forward to dashboard
    try {
      const existingToken = localStorage.getItem(PORTAL_TOKEN_KEY);
      if (existingToken) {
        router.replace("/portal/dashboard");
      }
    } catch (e) {}
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "We couldn't find a partner account with that email.");
      }

      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "authenticating") {
    return (
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
        <p className="text-[#1B4332] font-semibold text-lg animate-pulse">Unlocking your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] shadow-md">
          <Bone className="h-7 w-7 text-white" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Partner Portal</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address to receive a secure login link. No password required.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-xl bg-green-50 p-6 border border-green-200 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-900">Check your inbox</h3>
          <p className="mt-2 text-sm text-green-800">
            We sent a secure magic link to <span className="font-semibold">{email}</span>. Click the link inside to instantly access your dashboard.
          </p>
          <button 
            onClick={() => { setStatus("idle"); setEmail(""); }}
            className="mt-6 text-sm font-medium text-[#1B4332] hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-xl border-gray-300 px-4 py-4 text-gray-900 placeholder-gray-400 focus:border-[#1B4332] focus:outline-none focus:ring-[#1B4332] sm:text-sm border shadow-sm transition-colors"
              placeholder="partner@business.com"
            />
          </div>

          {status === "error" && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg text-center font-medium">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !email}
            className="group relative flex w-full justify-center rounded-xl border border-transparent bg-[#1B4332] px-4 py-4 text-sm font-bold text-white hover:bg-[#153424] focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 disabled:opacity-70 transition-all shadow-md"
          >
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Send Magic Link
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// 3. Wrap everything in Suspense to make Next.js happy
export default function PortalLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}