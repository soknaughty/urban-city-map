'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TOKEN_KEY = "urbandog_admin_token";
const API_BASE = "https://urbandog-production.up.railway.app/api/v1";

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
};

type Section = "dashboard" | "distributors" | "advertisers" | "subscribers" | "alerts";

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
};

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
          <Link href="/forgot-password" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Forgot password?
          </Link>
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
  ];

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8 md:py-5">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-gray-300 px-2 py-1 text-sm md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold capitalize md:text-2xl">{section}</h1>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {section === "dashboard" && <DashboardSection />}
          {section === "distributors" && <DistributorsSection />}
          {section === "advertisers" && <AdvertisersSection />}
          {section === "subscribers" && <SubscribersSection />}
          {section === "alerts" && <AlertsSection />}
        </div>
      </main>
    </div>
  );
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
  return arr.map((it) =>
    it && typeof it === "object" && "is_active" in it && !("active" in it)
      ? { ...it, active: (it as any).is_active }
      : it,
  ) as T[];
}

function StatCard({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "—" : value}</p>
    </div>
  );
}

type StatsResponse = {
  total_distributors: number;
  active_distributors: number;
  total_advertisers: number;
  total_subscribers: number;
  recent_subscribers: Array<{ email: string; distributor_id?: string; created_at?: string }>;
};

function AlertRow({ a }: { a: Alert }) {
  const hasSponsor = !!(a.sponsor_name && a.sponsor_name.trim());
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{a.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatDateShort(a.start_date)} → {formatDateShort(a.end_date)}
        </p>
      </div>
      {hasSponsor ? (
        <span className="text-sm text-gray-700">{a.sponsor_name}</span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-900 ring-1 ring-yellow-400">
          Unsold Opportunity
        </span>
      )}
    </li>
  );
}

function DashboardSection() {
  const { data, loading, error } = useFetch<StatsResponse>("/stats/");
  const { data: upcomingData, loading: upcomingLoading, error: upcomingError } = useFetch<any>("/alerts/upcoming");
  const [showAll, setShowAll] = useState(false);
  
  const upcoming = asArray<Alert>(upcomingData)
    .slice()
    .sort((a, b) => {
      const ad = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bd = b.start_date ? new Date(b.start_date).getTime() : 0;
      return ad - bd;
    });

  const now = Date.now();
  const in30Days = now + 30 * 24 * 60 * 60 * 1000;
  const next30 = upcoming.filter((a) => {
    const t = a.start_date ? new Date(a.start_date).getTime() : 0;
    return t >= now - 24 * 60 * 60 * 1000 && t <= in30Days;
  });
  const preview = upcoming.slice(0, 3);

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
        {upcomingError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{upcomingError}</div>
        )}
        <ul className="divide-y divide-gray-100">
          {upcomingLoading && <li className="px-5 py-4 text-sm text-gray-500">Loading…</li>}
          {!upcomingLoading && preview.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-500">No upcoming alerts.</li>
          )}
          {preview.map((a) => <AlertRow key={a.id} a={a} />)}
        </ul>
        <div className="border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowAll(true)}
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
              {next30.map((a) => <AlertRow key={a.id} a={a} />)}
            </ul>
          </div>
        </div>
      )}
    </div>
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

function DistributorsSection() {
  const { data, loading, error, refetch } = useFetch<any>("/distributors/");
  const distributors = asArray<Distributor>(data);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (d: Distributor) => {
    setBusyId(d.id);
    try {
      await authFetch(`/distributors/${d.id}/activate?is_active=${!d.active}`, { method: "PATCH" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{distributors.length} total</p>
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
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && distributors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No distributors.
                </td>
              </tr>
            )}
            {distributors.map((d) => {
              const anyD = d as any;
              const status = String(anyD.health_status || "").toLowerCase();
              const dotColor =
                status === "green" ? "#16a34a" : status === "yellow" ? "#eab308" : status === "red" ? "#dc2626" : "#d1d5db";
              const slug = anyD.slug;
              
              // FIXED: Dynamic environment check turns relative path into absolute tenant domain link
              const mapHref = slug
                ? typeof window !== "undefined" && window.location.hostname.includes("localhost")
                  ? `http://${slug}.localhost:3000`
                  : `https://${slug}.furstops.com`
                : "";

              return (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: dotColor }}
                    title={
                      status
                        ? `Status: ${status}\nAdvertisers: ${anyD.advertiser_count ?? 0}\nSubscribers: ${anyD.subscriber_count ?? 0}`
                        : "No health data"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge active={!!d.active} />
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(d.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(d)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50"
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      disabled={busyId === d.id}
                      onClick={() => toggle(d)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {d.active ? "Deactivate" : "Activate"}
                    </button>
                    {mapHref ? (
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        View Map
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic px-3 py-1">No map</span>
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
        <EditDistributorForm
          distributor={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl text-black">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black bg-white outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function DistributorForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    website_url: "",
    logo_url: "",
    brand_color: "#1B4332",
  });
  const slug = slugify(form.name);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        slug,
        address_string: form.address,
        brand_color: form.brand_color,
      };
      if (form.website_url) body.website_url = form.website_url;
      if (form.logo_url) body.logo_url = form.logo_url;
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
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Slug">
          <input className={inputClass + " bg-gray-50 text-gray-500"} value={slug} readOnly tabIndex={-1} />
        </Field>
        <Field label="Address">
          <input
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </Field>
        <Field label="Website URL">
          <input
            className={inputClass}
            type="url"
            value={form.website_url}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
          />
        </Field>
        <Field label="Logo URL">
          <input
            className={inputClass}
            type="url"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Brand Color">
          <input
            className={inputClass + " h-10 p-1"}
            type="color"
            value={form.brand_color}
            onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
          />
        </Field>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#1B4332" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
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
    is_active: !!distributor.active,
  };
  const [form, setForm] = useState(initial);
  const slug = slugify(form.name);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {};
      if (form.name !== initial.name) {
        body.name = form.name;
        if (slug !== distributor.slug) body.slug = slug;
      }
      if (form.address !== initial.address) body.address_string = form.address;
      if (form.website_url !== initial.website_url) body.website_url = form.website_url;
      if (form.logo_url !== initial.logo_url) body.logo_url = form.logo_url;
      if (form.brand_color !== initial.brand_color) body.brand_color = form.brand_color;
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
      setSaving