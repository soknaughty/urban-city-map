'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import { use } from "react";
import { X, Navigation, Tag, MapPin, Crosshair, Bell, Globe, Phone } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Pin {
  id: string;
  cat: Category;
  name: string;
  distance: string;
  tip: string;
  tip_image_url?: string;
  lng: number;
  lat: number;
  phone?: string;
  website?: string;
  tier?: string;
  logo_url?: string;
  address?: string;
}

const FOREST = "#1B4332";
const GOLD = "#F59E0B";
const SKY = "#3B82F6";
const RED = "#EF4444";
const TEAL = "#0D9488";
const PURPLE = "#8B5CF6";
const ORANGE = "#F97316";

type Category = "patio" | "park" | "vet" | "dvm" | "groomer" | "daycare";

// 💡 REARRANGE THIS ARRAY TO CHANGE THE FILTER BUTTON ORDER ON YOUR SCREEN
const CATEGORIES: {
  key: Category;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "park", label: "Parks & Off-Leash", emoji: "🌳", color: SKY },
  { key: "vet", label: "24/7 Emergency Vets", emoji: "✚", color: RED },
  { key: "dvm", label: "Veterinarians", emoji: "🩺", color: TEAL },
  { key: "groomer", label: "Groomers, Sitters & More", emoji: "✂️", color: PURPLE },
  { key: "daycare", label: "Doggie Daycares", emoji: "🐶", color: ORANGE },
  { key: "patio", label: "Patios & Cafes", emoji: "🐾", color: GOLD },
];

const API_TO_CAT: Record<string, Category> = {
  dining: "patio",
  parks: "park",
  emergency_vet: "vet",
  veterinarian: "dvm",
  groomer: "groomer",
  daycare: "daycare",
};

const GATE_KEY = "bb_email_gate_v1";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default function TenantMapPortal({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.tenant;
  const isRoot = slug === "_root" || !slug;

  const [active, setActive] = useState<Set<Category>>(
    new Set(["patio", "park", "vet", "dvm", "groomer", "daycare"])
  );
  const [selected, setSelected] = useState<Pin | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [metadata, setMetadata] = useState<{
    distributor_name?: string;
    distributor_id?: string;
    brand_color_hex?: string | null;
    map_title?: string | null;          
    promo_button_text?: string | null;  
    address_string?: string | null; 
    hq_greeting?: string | null;    
  }>({});
  const brandColor = metadata.brand_color_hex || FOREST;
  const distributorName = metadata.distributor_name || "Barks & Bones";
  const [isMounted, setIsMounted] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (window.location.search.includes("admin=1")) {
      localStorage.setItem(GATE_KEY, "1");
    }
    
    const subscribed = localStorage.getItem(GATE_KEY) === "1";
    setNeedsEmail(!subscribed);
    setIsMounted(true);
  }, []);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<{
    id?: string;
    title?: string;
    body?: string;
    sponsor_name?: string;
  } | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [alertMounted, setAlertMounted] = useState(false);

  useEffect(() => {
    if (!activeAlert?.id) return;
    const dismissed = localStorage.getItem(`dismissed_alert_${activeAlert.id}`) === "1";
    setAlertDismissed(dismissed);
    setAlertMounted(true);
  }, [activeAlert?.id]);

  const dismissAlert = () => {
    if (activeAlert?.id) {
      try {
        localStorage.setItem(`dismissed_alert_${activeAlert.id}`, "1");
      } catch {}
    }
    setAlertDismissed(true);
  };

  useEffect(() => {
    if (typeof window === "undefined" || isRoot || !slug) return;
    const href = `https://urbandog-production.up.railway.app/api/v1/maps/${slug}/manifest.json`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = href;
    link.crossOrigin = "use-credentials";

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed", err);
      });
    }
  }, [slug, isRoot]);

  useEffect(() => {
    if (!metadata.distributor_id) return;
    let cancelled = false;
    fetch(`https://urbandog-production.up.railway.app/api/v1/alerts/active?distributor_id=${metadata.distributor_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const a = data?.alert ?? null;
        if (a) setActiveAlert(a);
      })
      .catch((e) => console.error("Failed to load alert", e));
    return () => {
      cancelled = true;
    };
  }, [metadata.distributor_id]);

  const emailValid = email.includes("@") && email.includes(".");
  const submitGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || submitting || !metadata.distributor_id) return;
    setSubmitting(true);
    setGateError(null);
    try {
      const res = await fetch("https://urbandog-production.up.railway.app/api/v1/subscribers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          distributor_id: metadata.distributor_id,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setGateError(errData?.error || "Subscription failed. Please try again.");
        setSubmitting(false);
        return;
      }
      localStorage.setItem(GATE_KEY, "1");
      setNeedsEmail(false);
      setSubmitting(false);
    } catch (err) {
      setGateError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (isRoot || !slug) return;
    let cancelled = false;
    fetch(`https://urbandog-production.up.railway.app/api/v1/maps/${slug}/geojson`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMetadata({
          distributor_name: data?.distributor_name ?? data?.metadata?.distributor_name,
          distributor_id: data?.distributor_id ?? data?.metadata?.distributor_id,
          brand_color_hex: data?.brand_color_hex ?? data?.metadata?.brand_color_hex ?? null,
          map_title: data?.map_title ?? data?.metadata?.map_title ?? null,                    
          promo_button_text: data?.promo_button_text ?? data?.metadata?.promo_button_text ?? null, 
          address_string: data?.address_string ?? data?.metadata?.address_string ?? null, 
          hq_greeting: data?.hq_greeting ?? data?.metadata?.hq_greeting ?? null,         
        });
        const cLng = data?.center_lng ?? data?.metadata?.center_lng;
        const cLat = data?.center_lat ?? data?.metadata?.center_lat;
        if (typeof cLng === "number" && typeof cLat === "number") {
          setCenter([cLng, cLat]);
        }
        const features: any[] = data?.features ?? [];
        const mapped: Pin[] = features
          .map((f, i) => {
            try {
              const coords = f?.geometry?.coordinates;
              const props = f?.properties ?? {};
              const cat = API_TO_CAT[props?.category];
              if (!cat || !Array.isArray(coords) || typeof coords[0] !== "number" || typeof coords[1] !== "number") return null;
              return {
                id: String(props?.id ?? i),
                cat,
                name: props?.business_name || "Unnamed",
                distance: "", 
                tip: props?.insider_tip || "",
                tip_image_url: props?.tip_image_url || props?.promo_image_url || undefined,
                lng: coords[0],
                lat: coords[1],
                phone: props?.phone || undefined,
                website: props?.website_url || undefined,
                tier: props?.tier || "silver",
                logo_url: props?.logo_url || props?.logo || undefined,
                address: props?.address || undefined,
              } as Pin;
            } catch (err) {
              return null;
            }
          })
          .filter(Boolean) as Pin[];
        setPins(mapped);
        if (!cLng && mapped.length > 0) {
          setCenter([mapped[0].lng, mapped[0].lat]);
        }
      })
      .catch((e) => console.error("Failed to load map data", e));
    return () => {
      cancelled = true;
    };
  }, [slug, isRoot]);

  useEffect(() => {
    if (needsEmail) return;
    if (!mapContainer.current || mapRef.current || !center) return;
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("Mapbox token environment variable missing.");
      return;
    }
    
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 15.5,
    });
    mapRef.current = map;
    map.on("load", () => {
      map.resize();
      setMapLoaded(true);
    });
  }, [center, needsEmail]);

  useEffect(() => {
    if (needsEmail) return;
    const map = mapRef.current;
    if (!map) return;
    const id = requestAnimationFrame(() => map.resize());
    return () => cancelAnimationFrame(id);
  }, [needsEmail]);

  const toggle = (k: Category) =>
    setActive((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const visible = useMemo(() => pins.filter((p) => active.has(p.cat)), [active, pins]);
  const catMeta = (c: Category) => CATEGORIES.find((x) => x.key === c)!;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (center && !isRoot) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", distributorName);
      const shadow = "0 10px 25px -3px rgba(0,0,0,0.3), 0 0 0 4px #fff";
      el.style.cssText = `display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:9999px;background:${brandColor};color:#fff;box-shadow:${shadow};cursor:pointer;font-size:20px;border:none;z-index:50;transform:translateY(-15px);`;
      el.textContent = "🏪";
      
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // 💡 Clear fallback string so if it's blank in the dashboard, it is truly blank here
        setSelected({
          id: "distributor-hq",
          cat: "patio",
          name: distributorName,
          distance: metadata.address_string || "No address listed", 
          tip: metadata.hq_greeting || "", 
          lng: center[0],
          lat: center[1],
          tier: "gold"
        });
      });

      const distMarker = new mapboxgl.Marker({ element: el })
        .setLngLat(center)
        .addTo(map);
      markersRef.current.push(distMarker);
    }

    visible.forEach((p) => {
      const meta = catMeta(p.cat);
      const isGold = p.tier === "gold";
      const size = isGold ? 56 : 34;
      const ring = isGold ? "#FCD34D" : "#fff";
      const ringWidth = isGold ? 4 : 3;
      const shadow = isGold
        ? "0 10px 24px -4px rgba(252,211,77,0.65),0 0 0 " + ringWidth + "px " + ring
        : "0 4px 10px -3px rgba(0,0,0,0.35),0 0 0 " + ringWidth + "px " + ring;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", p.name);
      el.style.cssText = `display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${meta.color};color:#fff;box-shadow:${shadow};cursor:pointer;font-size:${isGold ? 22 : 14}px;font-weight:800;border:none;transform:translateY(-${size / 3}px);${isGold ? "z-index:2;" : ""}`;
      el.textContent = meta.emoji;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(p);
      });
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [visible, center, isRoot, distributorName, brandColor, mapLoaded, metadata.address_string, metadata.hq_greeting]);

  const openDirections = () => {
    if (!selected) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!isMounted) return null;
  if (isRoot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl">🦴</div>
          <h1 className="text-3xl font-extrabold text-slate-900" style={{ color: FOREST }}>Furstops</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Hyper-local urban dog guides — patios, parks, vets, and community alerts. Each of our partner pet stores has their own guide at their unique link.
          </p>
          <p className="mt-6 text-[13px] font-medium text-slate-500">Ask your local partner pet store for their Furstops link to get started.</p>
        </div>
      </div>
    );
  }

  if (needsEmail) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
            🦴
          </div>
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: brandColor }}>
            Your Downtown Dog Guide
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
            Get instant access to dog-friendly patios, parks, vets and local alerts — brought to you by {distributorName}.
          </p>
          <form onSubmit={submitGate} className="mt-6 space-y-3">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to get access"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!emailValid || submitting || !metadata.distributor_id}
              className="w-full rounded-2xl py-4 text-[15px] font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: brandColor,
                boxShadow: "0 12px 28px -10px rgba(27,67,50,0.55)",
              }}
            >
              {!metadata.distributor_id ? "Loading…" : submitting ? "Getting access…" : "Get Free Access"}
            </button>
            {gateError && (
              <p className="text-[12px] font-medium text-red-600">{gateError}</p>
            )}
          </form>
          <p className="mt-4 text-[12px] font-medium text-slate-500">
            No spam. Just local dog intel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 shadow-lg" style={{ backgroundColor: brandColor }}>
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg ring-1 ring-white/20">🦴</div>
          
          <div className="min-w-0 flex-1 flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              {metadata?.map_title || "DOWNTOWN DOG GUIDE"}
            </span>
            <p className="truncate text-[12px] leading-tight text-white/90">
              Brought to you by <span className="font-bold text-white">{distributorName}</span>
            </p>
          </div>
          
          {metadata?.promo_button_text && (
            <button className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold text-slate-900 shadow-md transition-all hover:scale-[1.04] active:scale-95 bg-amber-400">
              <Tag className="h-3 w-3" />
              {metadata.promo_button_text}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-8 pt-4">
        <div className="relative -mx-4">
          <div className="overflow-x-scroll whitespace-nowrap px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex gap-1.5 pb-2 pr-10">
              {CATEGORIES.map((c) => {
                const on = active.has(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-2 text-[12px] transition-all active:scale-95 ${on ? "font-extrabold scale-[1.03]" : "font-semibold"}`}
                    style={on ? { backgroundColor: c.color, borderColor: c.color, color: "#fff", boxShadow: `0 10px 22px -8px ${c.color}, 0 0 0 3px ${c.color}33` } : { backgroundColor: "#fff", borderColor: "#E2E8F0", color: "#0F172A" }}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold" style={{ backgroundColor: on ? "rgba(255,255,255,0.25)" : c.color + "22", color: on ? "#fff" : c.color }}>{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-white via-white/85 to-transparent" />
        </div>

        {activeAlert && alertMounted && !alertDismissed && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border-2 px-4 py-3" style={{ backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }}>
            <div className="text-xl leading-none pt-0.5">⚠️</div>
            <div className="min-w-0 flex-1">
              {activeAlert.title && <p className="text-[13px] font-extrabold text-slate-900">{activeAlert.title}</p>}
              {activeAlert.body && <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-800">{activeAlert.body}</p>}
              {activeAlert.sponsor_name && <p className="mt-1 text-[11px] font-semibold text-slate-600">Sponsored by {activeAlert.sponsor_name}</p>}
            </div>
            <button type="button" onClick={dismissAlert} aria-label="Dismiss alert" className="shrink-0 rounded-full p-1 text-slate-600 hover:bg-amber-200/60">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="relative mt-4 h-[72vh] min-h-[520px] overflow-hidden rounded-3xl border-2 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.35)]" style={{ borderColor: FOREST + "22", backgroundColor: "#EAF4EE" }}>
          <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            {activeAlert && (
              <button type="button" onClick={() => setAlertDismissed((d) => !d)} aria-label="Toggle sponsor alert" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-4px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 transition-all active:scale-95 hover:scale-105" style={{ color: "#F59E0B" }}>
                <Bell className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}
            {center && (
              <button type="button" onClick={() => { if (mapRef.current && center) { mapRef.current.flyTo({ center, zoom: 15.5, essential: true }); } }} aria-label="Recenter map" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-4px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 transition-all active:scale-95 hover:scale-105" style={{ color: brandColor }}>
                <Crosshair className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] font-medium text-slate-500">Tap a pin to see insider notes from neighbors</p>
      </main>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={() => setSelected(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t-2 animate-in slide-in-from-bottom duration-300 shadow-[0_-25px_60px_-15px_rgba(15,23,42,0.45)]" style={{ backgroundColor: "#fff", borderColor: FOREST + "22" }}>
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="px-6 pb-8 pt-4">
              <div className="flex items-start gap-3">
                {selected.tier === "gold" && selected.logo_url ? (
                  <img src={selected.logo_url} alt={`${selected.name} logo`} className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2" style={{ borderColor: "#FCD34D", boxShadow: "0 6px 16px -4px rgba(252,211,77,0.6)" }} />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-md" style={{ backgroundColor: selected.id === "distributor-hq" ? brandColor : catMeta(selected.cat).color }}>
                    {selected.id === "distributor-hq" ? "🏪" : catMeta(selected.cat).emoji}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                    {selected.id === "distributor-hq" ? "Host Storefront" : catMeta(selected.cat).label}
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold leading-tight text-slate-900">{selected.name}</h2>
                  {(selected.address || selected.distance) && (
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {selected.address || selected.distance}
                    </p>
                  )}
                  {selected.tier === "gold" && (selected.website || selected.phone) && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {selected.website && (
                        <a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                          <Globe className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                      {selected.phone && (
                        <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                          <Phone className="h-3.5 w-3.5" /> {selected.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
              
              {/* 💡 ENHANCED UPSELL RULE: Container completely self-destructs if there is no string greeting text or logo image layout passed */}
              {(selected.tip || selected.tip_image_url) && (selected.id === "distributor-hq" || selected.tier === "gold") && (
                <div className="mt-5 rounded-2xl border-2 p-4" style={{ borderColor: FOREST + "1F", backgroundColor: "#F0FDF4" }}>
                  {selected.tip && <p className="text-[14px] leading-relaxed text-slate-800">{selected.tip}</p>}
                  {selected.tip_image_url && (
                    <img 
                      src={selected.tip_image_url} 
                      alt="Premium promo feature" 
                      className={`${selected.tip ? "mt-3" : ""} w-full h-44 object-cover rounded-xl shadow-sm border border-slate-100`} 
                    />
                  )}
                </div>
              )}
              
              <button onClick={openDirections} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white shadow-lg transition-all active:scale-[0.98]" style={{ backgroundColor: brandColor, boxShadow: "0 12px 28px -10px rgba(27,67,50,0.55)" }}>
                <Navigation className="h-4 w-4" /> Directions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}