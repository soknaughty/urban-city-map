'use client';
import { useState } from "react";
import { Bone } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: "error" | "success", text: string} | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("https://urbandog-production.up.railway.app/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error("Request failed.");
      setMsg({ type: "success", text: "If that email exists in our system, a reset link has been generated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#1B4332" }}>
            <Bone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your email to receive a reset link</p>
        </div>
        
        {msg && (
          <div className={`p-3 rounded-lg text-sm border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin Email"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#1B4332" }}
        >
          {loading ? "Sending..." : "Send Reset Request"}
        </button>
        <div className="text-center mt-4">
          <a href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}