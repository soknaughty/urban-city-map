'use client';

import { useEffect, Suspense, useState } from "react";
import { Loader2 } from "lucide-react";

function PortalGatewayContent() {
  const [status, setStatus] = useState("Verifying secure link...");

  useEffect(() => {
    // Bypass Next.js router entirely to stop it from stripping the URL token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setStatus("Token secured! Opening dashboard...");
      localStorage.setItem("urbandog_portal_token", token);
      // Hard navigation to force the dashboard to load fresh
      window.location.href = `/portal/dashboard?token=${token}`;
    } else {
      setStatus("Link expired or invalid. Routing to login...");
      setTimeout(() => {
        window.location.href = "/portal/login";
      }, 1500);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
      <p className="text-[#1B4332] font-semibold text-lg animate-pulse">{status}</p>
    </div>
  );
}

export default function PortalGateway() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-gray-50" />}>
      <PortalGatewayContent />
    </Suspense>
  );
}