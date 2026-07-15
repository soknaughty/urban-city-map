'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bone, MapPin, Store, LogOut, Loader2, AlertCircle } from "lucide-react";

const API_BASE = "https://urbandog-production.up.railway.app/api/v1";
const PORTAL_TOKEN_KEY = "urbandog_portal_token"; 

function DashboardContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      try { localStorage.setItem(PORTAL_TOKEN_KEY, urlToken); } catch (e) {}
      window.history.replaceState(null, '', '/portal/dashboard');
    }

    const token = urlToken || localStorage.getItem(PORTAL_TOKEN_KEY);
    
    if (!token) {
      setError("No authentication token found. Please return to the login page.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setPartnerData(data);
      })
      .catch(err => {
        // 💡 WE REMOVED THE AUTO-REDIRECT HERE SO WE CAN READ THE ERROR!
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    window.location.href = "/portal/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-xl max-w-md text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Connection Blocked</h2>
          <p className="text-red-700 font-medium mb-6">{error}</p>
          <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-red-700">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!partnerData) return null;

  const isDistributor = partnerData.slug !== undefined;
  const isAdvertiser = partnerData.business_name !== undefined;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <aside className="w-64 bg-[#1B4332] text-white flex flex-col hidden md:flex">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <Bone className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">Partner Portal</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 bg-white/10 text-white font-medium">
            {isDistributor ? <Store className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            <span>My Profile</span>
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {isDistributor ? partnerData.name : partnerData.business_name}!
          </h1>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                {isDistributor ? "Distributor Platform Details" : "Advertiser Listing Details"}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {isDistributor && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Brand Name</label>
                    <p className="text-base text-gray-900">{partnerData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Your Custom Map URL</label>
                    <a href={`https://${partnerData.slug}.furstops.com`} target="_blank" rel="noreferrer" className="text-[#1B4332] hover:underline font-medium">
                      https://{partnerData.slug}.furstops.com
                    </a>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${partnerData.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {partnerData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </>
              )}

              {isAdvertiser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Business Name</label>
                    <p className="text-base text-gray-900">{partnerData.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Physical Address</label>
                    <p className="text-base text-gray-900">{partnerData.address_string}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Placement Tier</label>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold uppercase text-yellow-800">
                      {partnerData.tier}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PortalDashboard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-gray-50" />}>
      <DashboardContent />
    </Suspense>
  );
}