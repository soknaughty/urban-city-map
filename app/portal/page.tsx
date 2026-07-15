'use client';

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const PORTAL_TOKEN_KEY = "urbandog_portal_token";

function PortalGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Snatch the token from the email link
    const urlToken = searchParams.get("token");

    if (urlToken) {
      try {
        // Save it to the mobile device using the CORRECT key!
        localStorage.setItem(PORTAL_TOKEN_KEY, urlToken);
      } catch (e) {
        console.warn("Local storage unavailable.");
      }
      // Instantly bounce them through the correct door to the dashboard
      router.replace("/portal/dashboard");
    } else {
      // If they just typed /portal manually without a link, send them to the sleek login page
      router.replace("/portal/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
      <p className="text-[#1B4332] font-semibold text-lg animate-pulse">Verifying secure link...</p>
    </div>
  );
}

export default function PortalGateway() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
      </div>
    }>
      <PortalGatewayContent />
    </Suspense>
  );
}