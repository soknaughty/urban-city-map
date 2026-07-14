'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bone, MapPin, Store, LogOut, Loader2 } from "lucide-react";

// Adjust this base URL depending on your local vs prod environment
const API_BASE = "https://urbandog-production.up.railway.app/api/v1";

// Ensure this matches the exact key you set when the magic link logs them in
const PORTAL_TOKEN_KEY = "urbandog_portal_token"; 

export default function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(PORTAL_TOKEN_KEY);
    
    if (!token) {
      router.push("/portal/login");
      return;
    }

    // Fetches the partner profile data using their secure token
    fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Session expired or invalid.");
        return res.json();
      })
      .then(data => {
        setPartnerData(data);
      })
      .catch(err => {
        setError(err.message);
        localStorage.removeItem(PORTAL_TOKEN_KEY);
        router.push("/portal/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
      </div>
    );
  }

  if (error || !partnerData) {
    return null; // The useEffect will catch this and route them back to login
  }

  // Identify partner type based on the JSON payload structure
  const isDistributor = partnerData.slug !== undefined;
  const isAdvertiser = partnerData.business_name !== undefined;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar Navigation */}
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
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
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
              {/* Dynamic View: Distributor */}
              {isDistributor && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Brand Name</label>
                    <p className="text-base text-gray-900">{partnerData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Your Custom Map URL</label>
                    <a 
                      href={`https://${partnerData.slug}.furstops.com`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[#1B4332] hover:underline font-medium"
                    >
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

              {/* Dynamic View: Advertiser */}
              {isAdvertiser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Business Name</label>
                    <p className="text-base text-gray-900">{partnerData.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Category Classification</label>
                    <p className="text-base capitalize text-gray-900">{partnerData.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Physical Address</label>
                    <p className="text-base text-gray-900">{partnerData.address_string}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Active Insider Tip</label>
                    <p className="text-base text-gray-900 italic">"{partnerData.insider_tip || "No tip provided yet."}"</p>
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