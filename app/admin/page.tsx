'use client';

import { useEffect, useState, useMemo } from "react";
import { 
  Bone, 
  UserPlus, 
  Building2, 
  ClipboardCheck, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Search 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TOKEN_KEY = "urbandog_admin_token";
const API_BASE = "https://urbandog-production.up.railway.app/api/v1";

// Moved to the top to resolve all block-scope declaration errors
const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors";

// 💡 Environment gate mapping per spec layout logic
const STRIPE_ENV = process.env.NEXT_PUBLIC_STRIPE_ENV === "live" ? "live" : "test";

const STRIPE_LINKS: Record<string, Record<string, Record<string, string>>> = {
  test: {
    "ad_cfs_z": {
      usd: "https://buy.stripe.com/test_14A8wO4Mn1RlcTtaND5ZC03",
      cad: "https://buy.stripe.com/test_00w4gy1AbanR9Hh2h75ZC02"
    },
    "ad_cfs_x": {
      usd: "https://buy.stripe.com/test_fZucN4baL3Zt7z908Z5ZC07",
      cad: "https://buy.stripe.com/test_5kQ4gyemX0Nh9Hh4pf5ZC08"
    },
    "ad_grm_z": {
      usd: "https://buy.stripe.com/test_4gM7sKcePdA306H2h75ZC09",
      cad: "https://buy.stripe.com/test_7sYeVc7YzfIb06H8Fv5ZC01"
    },
    "ad_grm_x": {
      usd: "https://buy.stripe.com/test_7sY14m92DbrVg5Fg7X5ZC0a",
      cad: "https://buy.stripe.com/test_00weVc7Yz8fJ1aLaND5ZC0b"
    },
    "bnr_wk": {
      usd: "https://buy.stripe.com/test_5kQ28q4MnfIb2eP08Z5ZC06",
      cad: "https://buy.stripe.com/test_fZu8wO1AbanRcTtcVL5ZC04"
    },
    "furstops_license": {
      usd: "https://buy.stripe.com/test_9B67sK5Qr0Nhf1Bf3T5ZC0c",
      cad: "https://buy.stripe.com/test_4gM8wOa6HdA3f1B6xn5ZC00"
    }
  },
  live: {
    // Cafe & Patio / Dining — GOLD Tier
    "ad_cfs_z": {
      usd: "https://buy.stripe.com/cNi3cx8TOdew7k6dP7grS01",
      cad: "https://buy.stripe.com/6oU00l3zu6Q80VI12lgrS0b"
    },
    // Cafe & Patio / Dining — SILVER Tier
    "ad_cfs_x": {
      usd: "https://buy.stripe.com/6oUeVf4DygqI47Uh1jgrS02",
      cad: "https://buy.stripe.com/3cI14p8TO8Yg6g2cL3grS06"
    },
    // Groomers & Sitters — GOLD Tier
    "ad_grm_z": {
      usd: "https://buy.stripe.com/dRm7sNc607UcdIu7qJgrS05",
      cad: "https://buy.stripe.com/fZu6oJ6LG0rK8oadP7grS08"
    },
    // Groomers & Sitters — SILVER Tier
    "ad_grm_x": {
      usd: "https://buy.stripe.com/9B67sNfic7UcdIubGZgrS03",
      cad: "https://buy.stripe.com/fZuaEZfic6Q833Q4exgrS0a"
    },
    // Seasonal Map Banners (Weekly)
    "bnr_wk": {
      usd: "https://buy.stripe.com/dRmaEZda43DWfQC5iBgrS07",
      cad: "https://buy.stripe.com/8x2cN77PK7Uc8oa7qJgrS04"
    },
    // Pet Store Map Franchise License (Distributor)
    "furstops_license": {
      usd: "https://buy.stripe.com/4gM8wR0ni5M4awih1jgrS0c",
      cad: "https://buy.stripe.com/eVq6oJ8TOb6o1ZMeTbgrS0d"
    },
    // Live Test Only (Distributor)
    "live_test": {
      cad: "https://buy.stripe.com/4gMeVfgmgfmE5bY5iBgrS0f"
    }
  }
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const t = getToken();
  const h: Record<string, string> = { ...(extra || {}) };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

function authFetch(path: string, init: RequestInit = {}) {
  const headers = { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) };
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function apiGet<T>(path: string): Promise<T> {
  const r = await authFetch(path);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function useFetch<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<T>(path)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message || e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const refetch = async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const fresh = await apiGet<T>(path);
      setData(null);
      setData(fresh);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

function asArray<T>(v: any): T[] {
  let arr: any[] = [];
  if (Array.isArray(v)) arr = v;
  else if (v && Array.isArray(v.items)) arr = v.items;
  else if (v && Array.isArray(v.results)) arr = v.results;
  else if (v && Array.isArray(v.data)) arr = v.data;
  else if (v && Array.isArray(v.subscribers)) arr = v.subscribers;
  return arr.map((it) =>
    it && typeof it === "object" && "is_active" in it && !("active" in it)
      ? { ...it, active: (it as any).is_active }
      : it,
  ) as T[];
}

type Distributor = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at?: string;
  website_url?: string;
  brand_color?: string;
  center_lat?: number;
  center_lng?: number;
  map_url?: string;
  logo_url?: string;
  phone?: string;
  map_title?: string;        
  promo_button_text?: string;
  hq_greeting?: string; 
};

type Advertiser = {
  id: string;
  business_name: string;
  category: string;
  address: string;
  active: boolean;
  distributor_id?: string;
  tier?: string;
};

type Subscriber = {
  id: string;
  email: string;
  distributor_id?: string;
  distributor_name?: string;
  visit_count?: number;
  first_seen?: string;
  last_seen?: string;
  created_at?: string;
  is_archived?: boolean;
};

type Section = "dashboard" | "distributors" | "advertisers" | "subscribers" | "alerts" | "onboard-ad" | "onboard-dis" | "security";

type Alert = {
  id: string;
  title: string;
  body?: string;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  start_date?: string;
  end_date?: string;
  scope?: string;
  active?: boolean;
  is_active?: boolean;
  distributor_id?: string;
};

type StatsResponse = {
  total_distributors: number;
  active_distributors: number;
  total_advertisers: number;
  total_subscribers: number;
  recent_subscribers: Array<{ email: string; distributor_id?: string; created_at?: string }>;
};

const ADVERTISER_CATEGORIES: { value: string; label: string }[] = [
  { value: "dining", label: "Cafe & Patio" },
  { value: "parks", label: "Parks & Fields" },
  { value: "emergency_vet", label: "Emergency Vet (24/7)" },
  { value: "veterinarian", label: "Veterinarian" },
  { value: "groomer", label: "Groomers & Sitters" },
  { value: "daycare", label: "Doggie Daycare" },
];

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthed(!!localStorage.getItem(TOKEN_KEY));
      setChecked(true);
    }
  }, []);

  if (!checked) return null;
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;

  return (
    <Dashboard
      onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthed(false);
      }}
    />
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!r.ok) {
        setError("Invalid email or password");
        return;
      }
      const data = await r.json().catch(() => null);
      const token = data?.access_token;
      if (!token) {
        setError("Invalid email or password");
        return;
      }
      localStorage.setItem(TOKEN_KEY, token);
      onSuccess();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#1B4332" }}
          >
            <Bone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FurStops Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="Email"
            autoFocus
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(null);
            }}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#1B4332" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div className="text-center">
          <a href="/forgot-password" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Forgot password?
          </a>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav: { key: Section; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "distributors", label: "Distributors", icon: "🏪" },
    { key: "advertisers", label: "Advertisers", icon: "📍" },
    { key: "subscribers", label: "Subscribers", icon: "👥" },
    { key: "alerts", label: "Alerts", icon: "🔔" },
    { key: "onboard-ad", label: "Onboard - Ad", icon: "📝" },
    { key: "onboard-dis", label: "Onboard - Dis", icon: "📋" },
    { key: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform flex-col text-white transition-transform md:static md:flex md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#1B4332" }}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <Bone className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">FurStops</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                setSection(n.key);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                section === n.key ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8 md:py-5">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-gray-300 px-2 py-1 text-sm md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold md:text-2xl capitalize">
              {section === "onboard-ad" ? "Onboard - Ad" : section === "onboard-dis" ? "Onboard - Dis" : section}
            </h1>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {section === "dashboard" && <DashboardSection />}
          {section === "distributors" && <DistributorsSection />}
          {section === "advertisers" && <AdvertisersSection />}
          {section === "subscribers" && <SubscribersSection />}
          {section === "alerts" && <AlertsSection />}
          {section === "onboard-ad" && <OnboardAdSection />}
          {section === "onboard-dis" && <OnboardDisSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </main>
    </div>
  );
}

function OnboardAdSection() {
  const { data: distData } = useFetch<any>("/distributors/");
  const distributors = asArray<Distributor>(distData);
  const [form, setForm] = useState({
    business_name: "",
    category: "dining",
    address: "",
    phone: "",
    website_url: "",
    insider_tip: "",
    distributor_id: "",
    tier: "silver",
    currency: "usd",
  });
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const advertiserPayload = {
        business_name: form.business_name,
        category: form.category,
        address_string: form.address,
        phone: form.phone || undefined,
        website_url: form.website_url || undefined,
        email: email || null, 
        insider_tip: form.insider_tip || undefined,
        tier: form.tier,
      };
      const res = await authFetch("/advertisers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(advertiserPayload),
      });
      if (!res.ok) throw new Error(`Onboarding execution failed with status: ${res.status}`);
      const savedAdvertiser = await res.json();
      const newId = savedAdvertiser?.id;
      if (newId && form.distributor_id) {
        const assignRes = await authFetch("/maps/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            distributor_id: form.distributor_id,
            advertiser_id: newId,
          }),
        });
        if (!assignRes.ok) console.warn("Optional network link attachment failed.");
      }

      const isGold = form.tier === "gold";
      const isGroomer = form.category === "groomer";
      
      let skuKey = "";
      if (isGroomer) {
        skuKey = isGold ? "ad_grm_z" : "ad_grm_x"; 
      } else {
        skuKey = isGold ? "ad_cfs_z" : "ad_cfs_x"; 
      }
      
      // 💡 Context-driven Stripe layer lookup dynamically references STRIPE_ENV
      const targetUrl = STRIPE_LINKS[STRIPE_ENV][skuKey]?.[form.currency];
      if (!targetUrl) {
         throw new Error("No secure Stripe checkout link configuration exists for this combination.");
      }
      
      const url = new URL(targetUrl);
      url.searchParams.set("client_reference_id", newId);
      window.open(url.toString(), '_blank');
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected processing fault occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start text-sm text-slate-700">
        <UserPlus className="h-5 w-5 text-[#1B4332] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Direct Advertiser Core Placement Workspace</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {success && (
        <div className="p-5 bg-green-50 border border-green-200 text-green-900 rounded-xl flex flex-col gap-2 shadow-sm">
          <p className="font-bold text-base flex items-center gap-2">
            ✅ Advertiser Initialized
          </p>
          <p className="text-sm text-green-800">
            The secure Stripe checkout has opened in a new tab. Once the payment clears, their map pin will automatically activate on the network.
          </p>
          <button 
            type="button" 
            onClick={() => {
              setForm({ business_name: "", category: "dining", address: "", phone: "", website_url: "", insider_tip: "", distributor_id: "", tier: "silver", currency: "usd" });
              setEmail("");
              setSuccess(false);
            }} 
            className="mt-3 w-fit rounded-md bg-white border border-green-300 px-4 py-2 text-sm font-semibold hover:bg-green-100 transition-colors"
          >
            Clear Form for Next Advertiser
          </button>
        </div>
      )}

      <form onSubmit={handleOnboardSubmit} className="border border-gray-200 bg-white rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business Name">
            <input required className={inputClass} value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} placeholder="e.g., Central Park Coffee" />
          </Field>
          <Field label="Target Category (Dropdown Menu)">
            <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {ADVERTISER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Physical Address Location">
          <input required className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address, City, State/Province, Postal Code" />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Campaign Premium Tier (Dropdown Menu)">
            <select className={inputClass} value={form.tier} onChange={e => setForm({...form, tier: e.target.value})}>
              <option value="silver">Silver Tier Placement</option>
              <option value="gold">Gold Tier Placement</option>
            </select>
          </Field>
          <Field label="Assigned Map Host Distributor (Dropdown Menu)">
            <select className={inputClass} value={form.distributor_id} onChange={e => setForm({...form, distributor_id: e.target.value})}>
              <option value="">— Unassigned / Direct Global Root —</option>
              {distributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.slug})</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Contact Phone (Optional)">
            <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000" />
          </Field>
          <Field label="Website URL link (Optional)">
            <input className={inputClass} type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://example.com" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ad-email" className="block text-sm font-medium text-gray-700">
              Partner Email Address (For Portal Login)
            </label>
            <input
              id="ad-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="advertiser@business.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Community Insider Recommendation Tip Context">
            <input className={inputClass} value={form.insider_tip} onChange={e => setForm({...form, insider_tip: e.target.value})} placeholder="Secret patio entrance, treats..." />
          </Field>
          <Field label="Target Stripe Currency Base">
            <select className={inputClass} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              <option value="usd">USD (United States Dollar)</option>
              <option value="cad">CAD (Canadian Dollar)</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 text-white font-bold rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-md" style={{ backgroundColor: "#1B4332" }}>
          Forwarding to Stripe Payment Desk... : Deploy Advertiser Account Structure
        </button>
      </form>
    </div>
  );
}

function OnboardDisSection() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    website_url: "",
    logo_url: "",
    brand_color: "#1B4332",
    currency: "usd",
    phone: "", 
    map_title: "",        
    promo_button_text: "",
    hq_greeting: "", 
  });
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const computedSlug = slugify(form.name);

  const handleDisOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessUrl(null);
    setCopied(false);

    try {
      const distributorPayload = {
        name: form.name,
        slug: computedSlug,
        address_string: form.address,
        brand_color: form.brand_color,
        website_url: form.website_url || undefined,
        logo_url: form.logo_url || undefined,
        phone: form.phone || undefined, 
        email: email || null, 
        map_title: form.map_title || undefined,               
        promo_button_text: form.promo_button_text || undefined,
        hq_greeting: form.hq_greeting || undefined,
      };
      const res = await authFetch("/distributors/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(distributorPayload),
      });
      if (!res.ok) throw new Error(`Distributor save processing failed with code: ${res.status}`);
      const savedDistributor = await res.json();
      
      // 💡 Context-driven Stripe layer lookup dynamically nests down through STRIPE_ENV
      const targetUrl = STRIPE_LINKS[STRIPE_ENV]["furstops_license"]?.[form.currency];
      if (!targetUrl) {
         throw new Error("No secure checkout routing configured for this currency.");
      }
      
      const url = new URL(targetUrl);
      url.searchParams.set("client_reference_id", savedDistributor.id);
      window.open(url.toString(), '_blank');
      
      const mapDomain = typeof window !== "undefined" && window.location.hostname.includes("localhost")
        ? `http://${computedSlug}.localhost:3000`
        : `https://${computedSlug}.furstops.com`;
      
      setSuccessUrl(mapDomain);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!successUrl) return;
    const el = document.createElement('textarea');
    el.value = successUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start text-sm text-slate-700">
        <Building2 className="h-5 w-5 text-[#1B4332] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Partner Host Distributor Onboarding Center</p>
        </div>
      </div>

      {successUrl && (
        <div className="p-5 bg-green-50 border border-green-200 text-green-900 rounded-xl flex flex-col gap-2 shadow-sm">
          <p className="font-bold text-base flex items-center gap-2">
            ✅ Distributor Initialized
          </p>
          <p className="text-sm text-green-800">
            The secure Stripe checkout has opened in a new tab. Once the payment clears, their custom map layout will be activated at:
          </p>
          
          <div className="flex items-center gap-2 mt-1">
            <a href={successUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sm font-medium text-[#1B4332] hover:underline bg-white px-3 py-2 border border-green-200 rounded-md truncate max-w-[85%]">
              {successUrl}
            </a>
            <button 
              type="button" 
              onClick={copyToClipboard}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-green-200 bg-white text-green-700 hover:bg-green-100 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              )}
            </button>
          </div>

          <button 
            type="button" 
            onClick={() => {
              setForm({ 
                name: "", 
                address: "", 
                website_url: "", 
                logo_url: "", 
                brand_color: "#1B4332", 
                currency: "usd", 
                phone: "", 
                map_title: "", 
                promo_button_text: "",
                hq_greeting: "" // 💡 Added the missing property here
              });
              setEmail("");
              setSuccessUrl(null);
              setCopied(false);
            }} 
            className="mt-3 w-fit rounded-md bg-white border border-green-300 px-4 py-2 text-sm font-semibold hover:bg-green-100 transition-colors"
          >
            Clear Form for Next Partner
          </button>
        </div>
      )}

      <form onSubmit={handleDisOnboard} className="border border-gray-200 bg-white rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Distributor Brand Hub Name">
            <input required className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Paws & Claws Boutique" />
          </Field>
          <Field label="Generated System Subdomain Routing String Slug">
            <input readOnly className={`${inputClass} bg-slate-50 text-slate-500 font-mono`} value={computedSlug || "automatic-slug"} tabIndex={-1} />
          </Field>
        </div>

        <Field label="Primary Flagship Storefront Address">
          <input required className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full physical base address coordinates string" />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Corporate Website Link (Optional)">
            <input className={inputClass} type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://partnerbrand.com" />
          </Field>
          <Field label="Custom Branded Theme Accent Hex Color Picker">
            <div className="flex gap-2">
              <input type="color" className="w-12 h-10 p-1 border border-gray-300 rounded-md bg-white cursor-pointer" value={form.brand_color} onChange={e => setForm({...form, brand_color: e.target.value})} />
              <input className={inputClass} value={form.brand_color} onChange={(e) => setForm({...form, brand_color: e.target.value})} placeholder="#1B4332" maxLength={7} />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Brand Logo Image Vector Asset URL Link (Optional)">
            <input className={inputClass} type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://assets.domain/logo.png" />
          </Field>
          <Field label="Target Stripe Currency Base">
            <select className={inputClass} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              <option value="usd">USD (United States Dollar)</option>
              <option value="cad">CAD (Canadian Dollar)</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Corporate Contact Phone Number (Optional)">
            <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000" />
          </Field>
          <div>
            <label htmlFor="dis-email" className="block text-sm font-medium text-gray-700">
              Partner Email Address (For Portal Login)
            </label>
            <input
              id="dis-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="distributor@business.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Custom Map Title (Optional)">
            <input className={inputClass} value={form.map_title} onChange={e => setForm({...form, map_title: e.target.value})} placeholder="e.g., Downtown Dog Guide" />
          </Field>
          <Field label="Promo Button Text (Optional)">
            <input className={inputClass} value={form.promo_button_text} onChange={e => setForm({...form, promo_button_text: e.target.value})} placeholder="e.g., Get 15% Off" />
          </Field>
        </div>

          <Field label="HQ Map Greeting Message (Optional)">
            <textarea className={inputClass} rows={2} value={form.hq_greeting} onChange={e => setForm({...form, hq_greeting: e.target.value})} placeholder="Welcome to our partner headquarters! Drop in to..." />
          </Field>

        <button type="submit" disabled={loading} className="w-full py-3 text-white font-bold rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-md" style={{ backgroundColor: "#1B4332" }}>
          {loading ? "Connecting to Payment Gateway..." : "Authorize and Allocate Map Subdomain Space"}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "—" : value}</p>
    </div>
  );
}

function AlertRow({ a, onEdit }: { a: Alert; onEdit: () => void }) {
  const hasSponsor = !!(a.sponsor_name && a.sponsor_name.trim());
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{a.title}</p>
          <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${a.scope === "local" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
            {a.scope || "global"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatDateShort(a.start_date)} → {formatDateShort(a.end_date)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {hasSponsor ? (
          <span className="text-sm text-gray-700">{a.sponsor_name}</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-900 ring-1 ring-yellow-400">
            Unsold Opportunity
          </span>
        )}
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="text-xs text-gray-500 hover:text-gray-900 font-semibold underline"
        >
          Edit
        </button>
      </div>
    </li>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function formatDateShort(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function DashboardSection() {
  const { data, loading, error } = useFetch<StatsResponse>("/stats/");
  const { data: alertsData, loading: alertsLoading, error: alertsError, refetch: refetchAlerts } = useFetch<any>("/alerts/");
  const distQ = useFetch<any>("/distributors/");
  const distributors = asArray<Distributor>(distQ.data);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [showAll, setShowAll] = useState(false);
  const upcoming = asArray<Alert>(alertsData)
    .slice()
    .sort((a, b) => {
      const ad = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bd = b.start_date ? new Date(b.start_date).getTime() : 0;
      return ad - bd;
    });
  const now = Date.now();
  
  const next30 = upcoming.filter((a) => {
    const endT = a.end_date ? new Date(a.end_date).getTime() : Infinity;
    return endT >= now - (24 * 60 * 60 * 1000);
  });
  const preview = next30.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Distributors" value={data?.total_distributors ?? 0} loading={loading} />
        <StatCard label="Active Distributors" value={data?.active_distributors ?? 0} loading={loading} />
        <StatCard label="Total Advertisers" value={data?.total_advertisers ?? 0} loading={loading} />
        <StatCard label="Total Subscribers" value={data?.total_subscribers ?? 0} loading={loading} />
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming Alerts Calendar</h2>
        </div>
        {alertsError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{alertsError}</div>
        )}
        <ul className="divide-y divide-gray-100">
          {alertsLoading && <li className="px-5 py-4 text-sm text-gray-500">Loading…</li>}
          {!alertsLoading && preview.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-500">No upcoming alerts.</li>
          )}
          {preview.map((a) => <AlertRow key={a.id} a={a} onEdit={() => setEditingAlert(a)} />)}
        </ul>
        <div className="border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={() => { setShowAll(true); }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View All
          </button>
        </div>
      </div>

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Alerts — Next 30 Days</h3>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {next30.length === 0 && (
                <li className="px-5 py-4 text-sm text-gray-500">No upcoming alerts in the next 30 days.</li>
              )}
              {next30.map((a) => <AlertRow key={a.id} a={a} onEdit={() => setEditingAlert(a)} />)}
            </ul>
          </div>
        </div>
      )}

      {editingAlert && (
        <EditAlertForm
          alert={editingAlert}
          distributors={distributors}
          onClose={() => setEditingAlert(null)}
          onSaved={() => {
            setEditingAlert(null);
            refetchAlerts();
          }}
        />
      )}
    </div>
  );
}

function DistributorsSection() {
  const { data, loading, error, refetch } = useFetch<any>("/distributors/");
  const distributors = asArray<Distributor>(data);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggle = async (d: Distributor) => {
    setBusyId(d.id);
    try {
      await authFetch(`/distributors/${d.id}/activate?is_active=${!d.active}`, { method: "PATCH" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = (slug: string, id: string) => {
    const url = typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? `http://${slug}.localhost:3000`
      : `https://${slug}.furstops.com`;
    
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDistributors = useMemo(() => {
    if (!searchQuery.trim()) return distributors;
    const query = searchQuery.toLowerCase().trim();
    return distributors.filter((d) => {
      const nameMatch = d.name?.toLowerCase().includes(query);
      const slugMatch = d.slug?.toLowerCase().includes(query);
      const addressMatch = (d as any).address_string?.toLowerCase().includes(query) || (d as any).address?.toLowerCase().includes(query);
      return nameMatch || slugMatch || addressMatch;
    });
  }, [distributors, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold">{filteredDistributors.length}</span> displayed ({distributors.length} total)
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, address..."
              className="pl-9 pr-4 py-2 w-64 rounded-md border border-gray-300 bg-white text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors text-black"
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: "#1B4332" }}
        >
          + Add Distributor
        </button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Subscriber Link</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && filteredDistributors.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No distributors matching search query found.</td>
              </tr>
            )}
            {filteredDistributors.map((d) => {
              const anyD = d as any;
              const status = String(anyD.health_status || "").toLowerCase();
              const dotColor = status === "green" ? "#16a34a" : status === "yellow" ? "#eab308" : status === "red" ? "#dc2626" : "#d1d5db";
              const slug = anyD.slug;
              const subUrl = slug
                ? typeof window !== "undefined" && window.location.hostname.includes("localhost")
                  ? `http://${slug}.localhost:3000`
                  : `https://${slug}.furstops.com`
                : "";
              const mapHref = slug
                ? typeof window !== "undefined" && window.location.hostname.includes("localhost")
                  ? `http://${slug}.localhost:3000?admin=1`
                  : `https://${slug}.furstops.com?admin=1`
                : "";
              return (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.slug}</td>
                <td className="px-4 py-3">
                  {subUrl ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-gray-500 truncate max-w-[150px]" title={subUrl}>
                        {subUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <button
                        onClick={() => handleCopyLink(slug, d.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Copy subscriber login link"
                      >
                        {copiedId === d.id ? (
                          <span className="text-xs font-bold text-green-600">✓</span>
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No Link</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: dotColor }}
                    title={status ? `Status: ${status}\nAdvertisers: ${anyD.advertiser_count ?? 0}\nSubscribers: ${anyD.subscriber_count ?? 0}` : "No operational log entries recorded"}
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge active={!!d.active} />
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(d.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(d)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 text-slate-700 bg-white transition-all">✏️ Edit</button>
                    <button disabled={busyId === d.id} onClick={() => toggle(d)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">{d.active ? "Deactivate" : "Activate"}</button>
                    {mapHref ? (
                      <a href={mapHref} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1B4332] bg-emerald-50 hover:bg-emerald-100 transition-all">View Map</a>
                    ) : (
                      <span className="text-xs text-gray-400 italic px-3 py-1">No Map</span>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <DistributorForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {editing && (
        <EditDistributorForm distributor={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}
    </div>
  );
}

function DistributorForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    website_url: "",
    logo_url: "",
    brand_color: "#1B4332",
    phone: "", 
    map_title: "",        
    promo_button_text: "",
    hq_greeting: "", 
  });
  const [email, setEmail] = useState(""); 
  const slug = slugify(form.name);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, any> = {
        name: form.name,
        slug,
        address_string: form.address,
        brand_color_hex: form.brand_color,
        email: email || null, 
      };
      if (form.website_url) body.website_url = form.website_url;
      if (form.logo_url) body.logo_url = form.logo_url;
      if (form.phone) body.phone = form.phone;
      if (form.map_title) body.map_title = form.map_title;                 
      if (form.promo_button_text) body.promo_button_text = form.promo_button_text;
      if (form.hq_greeting) body.hq_greeting = form.hq_greeting; 

      const r = await authFetch(`/distributors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Add Distributor" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Slug">
          <input className={inputClass + " bg-gray-50 text-gray-500"} value={slug} readOnly tabIndex={-1} />
        </Field>
        <Field label="Address">
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </Field>
        <Field label="Website URL">
          <input className={inputClass} type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
        </Field>
        <Field label="Phone (Optional)">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" />
        </Field>
        
        <div>
          <label htmlFor="form-dis-email" className="block text-sm font-medium text-gray-700">
            Partner Email Address (For Portal Login)
          </label>
          <input
            id="form-dis-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            placeholder="distributor@business.com"
          />
        </div>

        <Field label="Logo URL">
          <input className={inputClass} type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Brand Color">
          <input className={inputClass + " h-10 p-1"} type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} />
        </Field>

        <Field label="Custom Map Title (Optional)">
          <input className={inputClass} value={form.map_title} onChange={(e) => setForm({ ...form, map_title: e.target.value })} placeholder="Downtown Dog Guide" />
        </Field>
        <Field label="Promo Button Text (Optional)">
          <input className={inputClass} value={form.promo_button_text} onChange={(e) => setForm({ ...form, promo_button_text: e.target.value })} placeholder="Get 15% Off" />
        </Field>

        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdvertisersSection() {
  const { data, loading, error, refetch } = useFetch<any>("/advertisers/");
  const distQ = useFetch<any>("/distributors/");
  const rawAdvertisers = asArray<any>(data);
  
  const advertisers: Advertiser[] = rawAdvertisers.map((a: any) => {
    const distributor_id = a.distributor_id ?? a.distributor?.id ?? (Array.isArray(a.distributor_ids) ? a.distributor_ids[0] : undefined) ?? (Array.isArray(a.distributors) ? (a.distributors[0]?.id ?? a.distributors[0]) : undefined);
    return {
      ...a,
      address: a.address ?? a.address_string ?? "",
      address_string: a.address_string ?? a.address ?? "",
      distributor_id: distributor_id ? String(distributor_id) : undefined,
    };
  });
  const distributors = asArray<Distributor>(distQ.data);
  const [showForm, useStateForm] = useState(false);
  const [showMiscForm, setShowMiscForm] = useState(false);
  const [editing, setEditing] = useState<Advertiser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");

  // Bulk & Import State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDistributorId, setBulkDistributorId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const distMap = new Map<string, Distributor>();
  distributors.forEach((d) => distMap.set(String(d.id), d));

  const getDistributorsFor = (a: Advertiser): Distributor[] => {
    const ids: string[] = [];
    const anyA = a as any;
    if (Array.isArray(anyA.distributor_ids)) ids.push(...anyA.distributor_ids.map(String));
    else if (Array.isArray(anyA.distributors)) ids.push(...anyA.distributors.map((x: any) => String(x.id ?? x)));
    else if (a.distributor_id) ids.push(String(a.distributor_id));
    return ids.map((id) => distMap.get(id)).filter(Boolean) as Distributor[];
  };

  const toggle = async (a: Advertiser) => {
    setBusyId(a.id);
    try {
      await authFetch(`/advertisers/${a.id}/activate?is_active=${!a.active}`, { method: "PATCH" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const deleteAdvertiser = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this map location? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await authFetch(`/advertisers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record.");
      setActionMessage({ type: "success", text: "Location deleted successfully." });
      refetch();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e: any) {
      setActionMessage({ type: "error", text: e.message || "Failed to delete location." });
    } finally {
      setBusyId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setActionMessage(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Intentionally omitting Content-Type so the browser sets the multi-part boundary correctly
      const res = await authFetch("/advertisers/bulk-import", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Import failed.");
      
      setActionMessage({ type: "success", text: `Successfully imported ${data.imported_count || 0} locations.` });
      refetch();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "An error occurred during import." });
    } finally {
      setIsImporting(false);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0 || !bulkDistributorId) return;
    setIsBulkUpdating(true);
    setActionMessage(null);
    try {
      const res = await authFetch("/advertisers/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiser_ids: Array.from(selectedIds),
          distributor_id: bulkDistributorId
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Bulk update failed.");

      setActionMessage({ type: "success", text: `Successfully activated and assigned ${data.activated_count || 0} locations.` });
      setSelectedIds(new Set());
      setBulkDistributorId("");
      refetch();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Bulk update failed." });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAdvertisers.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredAdvertisers = useMemo(() => {
    if (selectedDistributor === "") return advertisers;
    if (selectedDistributor === "unassigned") {
      return advertisers.filter((a) => !a.distributor_id && getDistributorsFor(a).length === 0);
    }
    return advertisers.filter((a) => {
      if (a.distributor_id === selectedDistributor) return true;
      const associatedDists = getDistributorsFor(a);
      return associatedDists.some((d) => d.id === selectedDistributor);
    });
  }, [advertisers, selectedDistributor]);

  const allSelected = filteredAdvertisers.length > 0 && selectedIds.size === filteredAdvertisers.length;

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div className={`p-4 rounded-lg text-sm font-medium ${actionMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 whitespace-nowrap">
            <span className="font-semibold">{filteredAdvertisers.length}</span> listed
          </p>
          <select
            value={selectedDistributor}
            onChange={(e) => setSelectedDistributor(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1B4332] focus:outline-none text-black min-w-[200px]"
          >
            <option value="">All Distributors (Global)</option>
            <option value="unassigned">Unassigned / Inactive</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center min-w-[120px]">
            {isImporting ? "Importing..." : "⬇️ Import CSV"}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
          </label>
          <button onClick={() => setShowMiscForm(true)} className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors shadow-sm">
            + Quick Add
          </button>
          <button onClick={() => useStateForm(true)} className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-sm" style={{ backgroundColor: "#1B4332" }}>
            + Full Onboard
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="text-sm font-semibold text-amber-900">
            {selectedIds.size} locations selected
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none text-black w-64"
              value={bulkDistributorId}
              onChange={(e) => setBulkDistributorId(e.target.value)}
            >
              <option value="">— Select Target Map Distributor —</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button 
              onClick={handleBulkActivate}
              disabled={isBulkUpdating || !bulkDistributorId}
              className="rounded-md bg-amber-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isBulkUpdating ? "Activating..." : "Assign & Activate"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={(e) => toggleSelectAll(e.target.checked)} className="rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]" />
              </th>
              <th className="px-4 py-3">Business Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Distributor</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading map directory...</td>
              </tr>
            )}
            {!loading && filteredAdvertisers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No locations found.</td>
              </tr>
            )}
            {filteredAdvertisers.map((a) => {
              const advDists = getDistributorsFor(a);
              const distributorSlug = (a as any).distributor_slug || advDists.find((d) => d.slug)?.slug || "";
              const mapHref = distributorSlug
                ? typeof window !== "undefined" && window.location.hostname.includes("localhost")
                  ? `http://${distributorSlug}.localhost:3000?admin=1`
                  : `https://${distributorSlug}.furstops.com?admin=1`
                : "";

              return (
                <tr key={a.id} className={selectedIds.has(a.id) ? "bg-amber-50/50" : "hover:bg-slate-50 transition-colors"}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(a.id)} 
                      onChange={() => toggleSelectOne(a.id)}
                      className="rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]" 
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.business_name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.category}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={a.address}>
                    {a.address || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(a as any).distributor_name && (a as any).distributor_name !== "Unassigned" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {(a as any).distributor_name}
                      </span>
                    ) : advDists.length > 0 ? (
                      advDists.map((d) => (
                        <span key={d.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mr-1 mb-1">
                          {d.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge active={!!a.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button disabled={busyId === a.id} onClick={() => toggle(a)} className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 text-gray-700 bg-white">
                        {a.active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => setEditing(a)} className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 text-gray-700 bg-white">Edit</button>
                      {mapHref && (
                        <a href={mapHref} target="_blank" rel="noopener noreferrer" className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-emerald-50 text-[#1B4332] bg-white">Map</a>
                      )}
                      <button 
                        disabled={busyId === a.id} 
                        onClick={() => deleteAdvertiser(a.id)} 
                        className="rounded border border-red-200 px-2 py-1 text-xs font-medium hover:bg-red-50 disabled:opacity-50 text-red-600 bg-white transition-colors"
                        title="Delete Permanently"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AdvertiserForm distributors={distributors} onClose={() => useStateForm(false)} onSaved={() => { useStateForm(false); refetch(); }} />
      )}

      {showMiscForm && (
        <MiscellaneousForm distributors={distributors} onClose={() => setShowMiscForm(false)} onSaved={() => { setShowMiscForm(false); refetch(); }} />
      )}

      {editing && (
        <AdvertiserForm distributors={distributors} advertiser={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}
    </div>
  );
}

function EditDistributorForm({
  distributor,
  onClose,
  onSaved,
}: {
  distributor: Distributor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = {
    name: distributor.name ?? "",
    address: (distributor as any).address_string ?? (distributor as any).address ?? "",
    website_url: distributor.website_url ?? "",
    logo_url: distributor.logo_url ?? "",
    brand_color: distributor.brand_color ?? "#1B4332",
    phone: (distributor as any).phone ?? "", 
    map_title: distributor.map_title ?? "",               
    promo_button_text: distributor.promo_button_text ?? "",
    hq_greeting: distributor.hq_greeting ?? "", 
    is_active: !!distributor.active,
  };
  const [form, setForm] = useState(initial);
  const [email, setEmail] = useState((distributor as any).email ?? ""); 
  const slug = slugify(form.name);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, any> = {};
      if (form.name !== initial.name) {
        body.name = form.name;
        if (slug !== distributor.slug) body.slug = slug;
      }
      if (form.address !== initial.address) body.address_string = form.address;
      if (form.website_url !== initial.website_url) body.website_url = form.website_url;
      if (form.logo_url !== initial.logo_url) body.logo_url = form.logo_url;
      if (form.brand_color !== initial.brand_color) body.brand_color_hex = form.brand_color;
      if (form.phone !== initial.phone) body.phone = form.phone;
      if (email !== ((distributor as any).email ?? "")) body.email = email || null; 
      if (form.map_title !== initial.map_title) body.map_title = form.map_title;                 
      if (form.promo_button_text !== initial.promo_button_text) body.promo_button_text = form.promo_button_text; 
      if (form.hq_greeting !== initial.hq_greeting) body.hq_greeting = form.hq_greeting;
      if (form.is_active !== initial.is_active) body.is_active = form.is_active;

      if (Object.keys(body).length === 0) {
        onSaved();
        return;
      }
      const r = await authFetch(`/distributors/${distributor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Distributor Details" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Slug">
          <input className={inputClass + " bg-gray-50 text-gray-500"} value={slug} readOnly tabIndex={-1} />
        </Field>
        <Field label="Address">
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </Field>
        <Field label="Website URL">
          <input className={inputClass} type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
        </Field>
        <Field label="Phone (Optional)">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" />
        </Field>

        <div>
          <label htmlFor="edit-dis-email" className="block text-sm font-medium text-gray-700">
            Partner Email Address (For Portal Login)
          </label>
          <input
            id="edit-dis-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            placeholder="distributor@business.com"
          />
        </div>

        <Field label="Logo URL">
          <input className={inputClass} type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Brand Color">
          <input className={inputClass + " h-10 p-1"} type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} />
        </Field>

        <Field label="Custom Map Title (Optional)">
          <input className={inputClass} value={form.map_title} onChange={(e) => setForm({ ...form, map_title: e.target.value })} placeholder="Downtown Dog Guide" />
        </Field>
        <Field label="Promo Button Text (Optional)">
          <input className={inputClass} value={form.promo_button_text} onChange={(e) => setForm({ ...form, promo_button_text: e.target.value })} placeholder="Get 15% Off" />
        </Field>
        <Field label="HQ Map Greeting Message (Optional)">
          <textarea className={inputClass} rows={2} value={form.hq_greeting} onChange={(e) => setForm({ ...form, hq_greeting: e.target.value })} placeholder="Welcome to our partner headquarters!..." />
        </Field>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Is Active Record
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Saving Changes…" : "Commit Structure Mod"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdvertiserForm({
  distributors,
  advertiser,
  onClose,
  onSaved,
}: {
  distributors: Distributor[];
  advertiser?: Advertiser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!advertiser;
  const initial = {
    business_name: advertiser?.business_name || "",
    category: advertiser?.category || ADVERTISER_CATEGORIES[0].value,
    address: (advertiser as any)?.address || (advertiser as any)?.address_string || "",
    phone: (advertiser as any)?.phone || "",
    website_url: (advertiser as any)?.website_url || "",
    insider_tip: (advertiser as any)?.insider_tip || "",
    distributor_id: advertiser?.distributor_id || (isEdit ? "" : distributors[0]?.id || ""),
    tier: advertiser?.tier || "silver",
  };
  const [form, setForm] = useState(initial);
  const [email, setEmail] = useState((advertiser as any)?.email || ""); 
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const toPayloadKey = (k: string) => (k === "address" ? "address_string" : k);
      let body: any;
      let skipSave = false;
      if (isEdit) {
        body = {};
        (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
          if (k === "distributor_id") return;
          if (form[k] !== (initial as any)[k]) {
            body[toPayloadKey(k as string)] = form[k];
          }
        });
        if (email !== ((advertiser as any)?.email || "")) body.email = email || null; 
        if (Object.keys(body).length === 0) {
          skipSave = true;
        }
      } else {
        body = {
          business_name: form.business_name,
          category: form.category,
          address_string: form.address,
          phone: form.phone || undefined,
          website_url: form.website_url || undefined,
          email: email || null, 
          insider_tip: form.insider_tip || undefined,
          tier: form.tier,
        };
      }

      let savedId: string | undefined = advertiser?.id;
      if (!skipSave) {
        const r = await authFetch(isEdit ? `/advertisers/${advertiser!.id}` : `/advertisers/`, {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`Save failed: ${r.status}`);
        
        try {
          const saved = await r.json();
          savedId = saved?.id ?? savedId;
        } catch {
          // ignore
        }
      }

      const distributorChanged = !isEdit || form.distributor_id !== (initial as any).distributor_id;
      if (savedId && distributorChanged) {
        if (form.distributor_id) {
          const ar = await authFetch(`/maps/assignments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              distributor_id: form.distributor_id,
              advertiser_id: savedId,
            }),
          });
          if (!ar.ok) throw new Error(`Assignment failed: ${ar.status}`);
        }
      }

      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Advertiser Settings" : "Deploy Advertiser Instance"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Business Name">
          <input className={inputClass} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
        </Field>
        <Field label="Category Selector Menu">
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} >
            {ADVERTISER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Address">
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Website URL">
            <input className={inputClass} type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
          </Field>
        </div>

        <div>
          <label htmlFor="form-ad-email" className="block text-sm font-medium text-gray-700">
            Partner Email Address (For Portal Login)
          </label>
          <input
            id="form-ad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            placeholder="advertiser@business.com"
          />
        </div>

        <Field label="Host Map Anchor Partner (Dynamic Dropdown)">
          <select className={inputClass} value={form.distributor_id} onChange={(e) => setForm({ ...form, distributor_id: e.target.value })} >
            <option value="">— Unassigned Root Layout —</option>
            {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Community Insider Recommendation Tip Context">
          <input className={inputClass} value={form.insider_tip} onChange={(e) => setForm({ ...form, insider_tip: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Placement Tier">
            <select className={inputClass} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Deploying…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SubscribersSection() {
  const { data: subsData, loading, error, refetch: refetchSubs } = useFetch<any>("/subscribers/");
  const distQ = useFetch<any>("/distributors/");
  const distributors = asArray<Distributor>(distQ.data);
  const distMap = new Map<string, string>();
  distributors.forEach((d) => distMap.set(String(d.id), d.name));

  const allSubscribers = asArray<Subscriber>(subsData);
  const subscribers = allSubscribers.filter(s => !s.is_archived);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [massArchiving, setMassArchiving] = useState(false);
  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber from the dashboard?")) return;
    setArchiving(id);
    try {
      await authFetch(`/subscribers/${id}/archive`, { method: "PATCH" });
      refetchSubs();
    } catch (err) {
      console.error("Failed to archive subscriber", err);
    } finally {
      setArchiving(null);
    }
  };
  const handleMassArchive = async () => {
    if (!confirm(`Are you sure you want to remove ALL ${subscribers.length} currently displayed subscribers from the dashboard?`)) return;
    setMassArchiving(true);
    try {
      await Promise.all(
        subscribers.map((s) => authFetch(`/subscribers/${s.id}/archive`, { method: "PATCH" }))
      );
      refetchSubs();
    } catch (err) {
      console.error("Mass archive failed", err);
    } finally {
      setMassArchiving(false);
    }
  };
  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = ["Email", "Distributor", "Visit Count", "First Seen", "Last Seen"];
    const rows = subscribers.map((s) => {
      const dName = s.distributor_name || (s.distributor_id ? distMap.get(s.distributor_id) : "") || "Unassigned";
      return [
        `"${s.email}"`,
        `"${dName}"`,
        s.visit_count ?? 0,
        `"${s.first_seen || s.created_at || ""}"`,
        `"${s.last_seen || ""}"`
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm font-medium text-gray-700">
          <span className="font-bold">{subscribers.length}</span> total subscribers
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleMassArchive}
            disabled={massArchiving || subscribers.length === 0}
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {massArchiving ? "Clearing..." : "Delete All Displayed"}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#1B4332" }}
          >
            Export to CSV Log
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Distributor</th>
              <th className="px-4 py-3 text-center">Visit Count</th>
              <th className="px-4 py-3">First Seen</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && subscribers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No active subscriber data matching parameters.</td>
              </tr>
            )}
            {subscribers.map((s, i) => {
              const dName = s.distributor_name || (s.distributor_id ? distMap.get(s.distributor_id) : "") || "—";
              return (
                <tr key={s.id || s.email + i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{dName}</td>
                  <td className="px-4 py-3 text-gray-600 text-center">{s.visit_count ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(s.first_seen || s.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleArchive(s.id)}
                      disabled={archiving === s.id}
                      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                    >
                      {archiving === s.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsSection() {
  const { data, loading, error, refetch } = useFetch<any>("/alerts/");
  const distQ = useFetch<any>("/distributors/");
  const alerts = asArray<Alert>(data);
  const distributors = asArray<Distributor>(distQ.data);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (a: Alert) => {
    setBusyId(a.id);
    try {
      await authFetch(`/alerts/${a.id}/activate?is_active=${!a.active}`, { method: "PATCH" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          <span className="font-semibold">{alerts.length}</span> total active broadcast streams
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: "#1B4332" }}
        >
          + Create Live Alert Block
        </button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading operational calendar items…</td>
              </tr>
            )}
            {!loading && alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No alerts found.</td>
              </tr>
            )}
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-gray-600">{a.sponsor_name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(a.start_date)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(a.end_date)}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs uppercase">{a.scope || "—"}</td>
                <td className="px-4 py-3">
                  <Badge active={!!a.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingAlert(a)} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">✏️ Edit</button>
                    <button disabled={busyId === a.id} onClick={() => toggle(a)} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 text-gray-700 bg-white">{a.active ? "Deactivate" : "Activate"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AlertForm
          distributors={distributors}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {editingAlert && (
        <EditAlertForm
          alert={editingAlert}
          distributors={distributors}
          onClose={() => setEditingAlert(null)}
          onSaved={() => {
            setEditingAlert(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function AlertForm({ distributors, onClose, onSaved }: { distributors: Distributor[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    sponsor_name: "",
    sponsor_logo_url: "",
    start_date: "",
    end_date: "",
    scope: "global",
    distributor_id: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        title: form.title,
        body: form.body,
        sponsor_name: form.sponsor_name || undefined,
        sponsor_logo_url: form.sponsor_logo_url || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        scope: form.scope,
        distributor_id: form.scope === "local" && form.distributor_id ? form.distributor_id : undefined,
        is_active: form.is_active,
      };
      const r = await authFetch(`/alerts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Deploy Live Map Broadcast Banner Alert" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Body">
          <textarea className={inputClass} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </Field>
        <Field label="Sponsor Name">
          <input className={inputClass} value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} />
        </Field>
        <Field label="Sponsor Logo URL">
          <input className={inputClass} type="url" value={form.sponsor_logo_url} onChange={(e) => setForm({ ...form, sponsor_logo_url: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input className={inputClass} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          </Field>
          <Field label="End Date">
            <input className={inputClass} type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </Field>
        </div>
        <Field label="Scope Selector">
          <select className={inputClass} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value, distributor_id: e.target.value === "global" ? "" : form.distributor_id })} >
            <option value="global">global</option>
            <option value="local">local</option>
          </select>
        </Field>
        {form.scope === "local" && (
          <Field label="Target Distributor Map">
            <select className={inputClass} value={form.distributor_id} onChange={(e) => setForm({ ...form, distributor_id: e.target.value })} required>
              <option value="">— Select Target Partner —</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.slug})</option>
              ))}
            </select>
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          <span>Active Map Banner</span>
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Saving…" : "Save Live"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditAlertForm({ alert, distributors, onClose, onSaved }: { alert: Alert; distributors: Distributor[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: alert.title || "",
    body: alert.body || "",
    sponsor_name: alert.sponsor_name || "",
    sponsor_logo_url: alert.sponsor_logo_url || "",
    start_date: alert.start_date ? alert.start_date.split("T")[0] : "",
    end_date: alert.end_date ? alert.end_date.split("T")[0] : "",
    scope: alert.scope || "global",
    distributor_id: alert.distributor_id || "",
    is_active: alert.is_active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        title: form.title,
        body: form.body,
        sponsor_name: form.sponsor_name || null,
        sponsor_logo_url: form.sponsor_logo_url || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        scope: form.scope,
        distributor_id: form.scope === "local" && form.distributor_id ? form.distributor_id : null,
        is_active: form.is_active,
      };
      const r = await authFetch(`/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Update failed: ${r.status}`);
      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Edit Broadcast Banner Alert" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Body">
          <textarea className={inputClass} rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </Field>
        <Field label="Sponsor Name">
          <input className={inputClass} value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} />
        </Field>
        <Field label="Sponsor Logo URL">
          <input className={inputClass} type="url" value={form.sponsor_logo_url} onChange={(e) => setForm({ ...form, sponsor_logo_url: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input className={inputClass} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          </Field>
          <Field label="End Date">
            <input className={inputClass} type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </Field>
        </div>
        <Field label="Scope Selector">
          <select className={inputClass} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value, distributor_id: e.target.value === "global" ? "" : form.distributor_id })} >
            <option value="global">global</option>
            <option value="local">local</option>
          </select>
        </Field>
        {form.scope === "local" && (
          <Field label="Target Distributor Map">
            <select className={inputClass} value={form.distributor_id} onChange={(e) => setForm({ ...form, distributor_id: e.target.value })} required>
              <option value="">— Select Target Partner —</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.slug})</option>
              ))}
            </select>
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          <span>Active Map Banner</span>
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Saving Changes…" : "Commit Structure Mod"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl text-black">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SecuritySection() {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false); 
  const [msg, setMsg] = useState<{type: "error" | "success", text: string} | null>(null); 

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return; 
    }
    setLoading(true);
    setMsg(null);
    try {
      const r = await authFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to change password."); 
      }
      setMsg({ type: "success", text: "Password successfully updated." });
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start text-sm text-slate-700">
        <div className="text-xl">🔒</div>
        <div>
          <p className="font-bold text-slate-900">Admin Security Settings</p>
          <p className="mt-1">Update your dashboard login password.</p>
        </div>
      </div>
      {msg && (
        <div className={`p-3 rounded-lg text-sm border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={submit} className="border border-gray-200 bg-white rounded-xl p-6 space-y-4">
        <Field label="Current Password">
          <input type="password" required className={inputClass} value={form.old_password} onChange={e => setForm({...form, old_password: e.target.value})} />
        </Field>
        <Field label="New Password">
          <input type="password" required className={inputClass} value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} /> 
        </Field>
        <Field label="Confirm New Password">
          <input type="password" required className={inputClass} value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})} />
        </Field>
        <button type="submit" disabled={loading} className="w-full py-3 text-white font-bold rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-md" style={{ backgroundColor: "#1B4332" }}>
          {loading ? "Updating..." : "Update Password"} 
        </button>
      </form>
    </div>
  );
}

function MiscellaneousForm({
  distributors,
  advertiser,
  onClose,
  onSaved,
}: {
  distributors: Distributor[];
  advertiser?: Advertiser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!advertiser;
  const initial = {
    business_name: advertiser?.business_name || "",
    category: advertiser?.category || "parks", 
    address: (advertiser as any)?.address || (advertiser as any)?.address_string || "",
    insider_tip: (advertiser as any)?.insider_tip || "",
    distributor_id: advertiser?.distributor_id || (isEdit ? "" : distributors[0]?.id || ""),
  };
  
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const toPayloadKey = (k: string) => (k === "address" ? "address_string" : k);
      let body: any;
      let skipSave = false;

      if (isEdit) {
        body = {};
        (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
          if (k === "distributor_id") return;
          if (form[k as keyof typeof form] !== (initial as any)[k]) {
            body[toPayloadKey(k)] = form[k as keyof typeof form];
          }
        });
        if (Object.keys(body).length === 0) {
          skipSave = true;
        }
      } else {
        body = {
          business_name: form.business_name,
          category: form.category,
          address_string: form.address,
          insider_tip: form.insider_tip || undefined,
          tier: "silver", 
          phone: null,
          website_url: null,
        };
      }

      let savedId: string | undefined = advertiser?.id;
      if (!skipSave) {
        const r = await authFetch(isEdit ? `/advertisers/${advertiser!.id}` : `/advertisers/`, {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`Save failed: ${r.status}`);
        
        try {
          const saved = await r.json();
          savedId = saved?.id ?? savedId;
        } catch {
          // ignore
        }
      }

      const distributorChanged = !isEdit || form.distributor_id !== (initial as any).distributor_id;
      if (savedId && distributorChanged && form.distributor_id) {
        const ar = await authFetch(`/maps/assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            distributor_id: form.distributor_id,
            advertiser_id: savedId,
          }),
        });
        if (!ar.ok) throw new Error(`Assignment failed: ${ar.status}`);
      }

      onSaved();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Miscellaneous Place" : "Deploy Miscellaneous Instance"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Location Name">
          <input className={inputClass} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
        </Field>
        <Field label="Category Selector Menu">
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} >
            {ADVERTISER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Address">
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </Field>
        <Field label="Host Map Anchor Partner (Dynamic Dropdown)">
          <select className={inputClass} value={form.distributor_id} onChange={(e) => setForm({ ...form, distributor_id: e.target.value })} >
            <option value="">— Unassigned Root Layout —</option>
            {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Community Insider Recommendation Tip Context">
          <input className={inputClass} value={form.insider_tip} onChange={(e) => setForm({ ...form, insider_tip: e.target.value })} />
        </Field>
        
        {err && <p className="text-sm text-red-600">{err}</p>}
        
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#1B4332" }}>
            {saving ? "Deploying…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}