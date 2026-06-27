'use client';
import { useState, useEffect } from "react";
import { Bone } from "lucide-react";

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: "error" | "success", text: string} | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token"));
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (!token) {
      setMsg({ type: "error", text: "Invalid or missing reset token." });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("https://urbandog-production.up.railway.app/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || "Reset failed. Token may be expired.");
      }
      setMsg({ type: "success", text: "Password reset successful! You can now log in." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Password</h1>
        </div>
        
        {msg && (
          <div className={`p-3 rounded-lg text-sm border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}>
            {msg.text}
          </div>
        )}

        {!msg || msg.type === "error" ? (
          <>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm New Password"
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
              {loading ? "Saving..." : "Save Password"}
            </button>
          </>
        ) : null}

        <div className="text-center mt-4">
          <a href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}