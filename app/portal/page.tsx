"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PortalGatewayContent() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. The Token Catcher: Intercepts token from the URL and saves it
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("partner_token", token);
      router.push("/portal/dashboard");
    }
  }, [searchParams, router]);

  // 2. The Login Gateway: Triggers the FastAPI Resend endpoint
  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Adjust this URL to match how your frontend normally calls your backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to request link");
      
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Partner Portal</h1>
        <p className="mb-6 text-sm text-gray-600">Enter your email to receive a secure login link.</p>

        {status === "success" ? (
          <div className="rounded border border-green-200 bg-green-50 p-4 text-green-800">
            If that email exists in our system, a login link has been sent to your inbox.
          </div>
        ) : (
          <form onSubmit={requestMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="partner@business.com"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-md bg-[#1B4332] px-4 py-2 text-white hover:bg-[#122e22] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send Magic Link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function PartnerPortalGateway() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PortalGatewayContent />
    </Suspense>
  );
}