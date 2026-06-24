"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2, Phone } from "lucide-react";

export interface LocationItem {
  label?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  isHeadquarters?: boolean;
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Load Leaflet from CDN once (free, no API key). Returns the global L.
function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).L));
      existing.addEventListener("error", reject);
      if ((window as any).L) resolve((window as any).L);
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function LocationMap({ locations }: { locations: LocationItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [active, setActive] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  const withCoords = locations.filter(
    (l) => l.latitude != null && l.longitude != null && !Number.isNaN(Number(l.latitude)) && !Number.isNaN(Number(l.longitude))
  );

  useEffect(() => {
    let cancelled = false;
    if (!mapRef.current || withCoords.length === 0) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;
        if (mapInstance.current) return;

        const first = withCoords[0];
        const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(
          [Number(first.latitude), Number(first.longitude)],
          withCoords.length > 1 ? 4 : 11
        );
        mapInstance.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const markers: any[] = [];
        withCoords.forEach((loc) => {
          const marker = L.marker([Number(loc.latitude), Number(loc.longitude)]).addTo(map);
          const title = loc.label || (loc.isHeadquarters ? "Headquarters" : "Office");
          const addr = [loc.address, loc.city, loc.country].filter(Boolean).join(", ");
          marker.bindPopup(`<strong>${title}</strong><br/>${addr}`);
          markers.push(marker);
        });

        if (markers.length > 1) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.3));
        }
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan to active location when selected
  useEffect(() => {
    const loc = withCoords[active];
    if (mapInstance.current && loc && loc.latitude != null && loc.longitude != null) {
      mapInstance.current.setView([Number(loc.latitude), Number(loc.longitude)], 12, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (locations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-navy">Location</h2>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Locations ({locations.length})
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {locations.map((loc, i) => {
              const title = loc.label || (loc.isHeadquarters ? "Headquarters" : loc.city || "Office");
              const addr = [loc.address, [loc.city, loc.country].filter(Boolean).join(", ")].filter(Boolean);
              const isActive = i === active && (loc.latitude != null);
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isActive ? "border-brand bg-brand/5" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-semibold text-navy text-sm">{title}</span>
                    {loc.isHeadquarters && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  {addr.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{addr.join(" · ")}</p>
                  )}
                  {loc.phone && (
                    <a
                      href={`tel:${loc.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
                    >
                      <Phone className="w-3 h-3" /> {loc.phone}
                    </a>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          {withCoords.length > 0 && !mapFailed ? (
            <div
              ref={mapRef}
              className="w-full h-80 lg:h-full min-h-[20rem] rounded-lg border border-gray-200 overflow-hidden z-0"
            />
          ) : (
            <div className="w-full h-80 lg:h-full min-h-[20rem] rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
              <MapPin className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                {mapFailed ? "Map could not be loaded." : "Map view unavailable for these locations."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
