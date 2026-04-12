"use client";

import { useEffect, useRef } from "react";

type Zone = {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius: number;
  isActive: boolean;
};

type ActiveEmployee = {
  id: number;
  name: string;
  workerTag?: string | null;
  lastCheckState: number; // 1=in, 2=out
  lastCheckTime?: number | null;
};

interface MeckanoMapProps {
  zones: Zone[];
  activeEmployees: ActiveEmployee[];
}

// Geocode an address using Nominatim (free, no key required)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=il`;
    const res = await fetch(url, { headers: { "Accept-Language": "he" } });
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* silently fail */ }
  return null;
}

export default function MeckanoMap({ zones, activeEmployees }: MeckanoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet (SSR-safe)
    import("leaflet").then((L) => {
      // Fix default icon URLs (webpack breaks them)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center: Jerusalem
      const map = L.map(mapRef.current!, {
        center: [31.7767, 35.2345],
        zoom: 13,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];

      // Count employees checked-in today by computing from lastCheckState
      const now = Date.now() / 1000;
      const checkedInEmployees = activeEmployees.filter(
        (e) => e.lastCheckState === 1 && e.lastCheckTime && now - e.lastCheckTime < 86400
      );

      // Add zone circles and markers
      const addZone = (zone: Zone, lat: number, lng: number) => {
        bounds.push([lat, lng]);

        // Circle for radius
        L.circle([lat, lng], {
          radius: zone.radius,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);

        // Custom colored icon
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:#2563eb;color:#fff;
            width:32px;height:32px;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);display:flex;align-items:center;
            justify-content:center;font-size:11px;font-weight:bold;
            border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">
            <span style="transform:rotate(45deg)">${zone.radius}m</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const checkedInCount = checkedInEmployees.length; // We don't have per-zone data, show total
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div dir="rtl" style="font-family:system-ui;min-width:180px">
            <p style="font-weight:900;font-size:14px;margin:0 0 4px">${zone.name}</p>
            <p style="color:#555;font-size:12px;margin:0 0 6px">${zone.address}</p>
            ${zone.description ? `<p style="color:#777;font-size:11px;margin:0 0 6px">${zone.description}</p>` : ""}
            <p style="font-size:11px;margin:0;color:#555">רדיוס: <b>${zone.radius}מ׳</b> · נוכחים: <b>${checkedInCount}</b></p>
          </div>
        `);
      };

      // Process zones — geocode those without lat/lng
      const processZones = async () => {
        for (const zone of zones.filter((z) => z.isActive)) {
          if (zone.lat && zone.lng) {
            addZone(zone, zone.lat, zone.lng);
          } else {
            const coords = await geocodeAddress(zone.address);
            if (coords) addZone(zone, coords.lat, coords.lng);
          }
        }

        // Add employee markers (green = checked in, gray = out/unknown)
        for (const emp of activeEmployees) {
          const isIn = emp.lastCheckState === 1;
          const icon = L.divIcon({
            className: "",
            html: `<div style="
              background:${isIn ? "#16a34a" : "#94a3b8"};color:#fff;
              width:28px;height:28px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:10px;font-weight:bold;
              border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);
            ">${(emp.name.charAt(0))}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          // Place employee near Jerusalem center + random offset (no actual GPS)
          const randLat = 31.7767 + (Math.random() - 0.5) * 0.02;
          const randLng = 35.2345 + (Math.random() - 0.5) * 0.02;

          const empMarker = L.marker([randLat, randLng], { icon }).addTo(map);
          const checkLabel = isIn ? "✅ מחותם (כניסה)" : "⬜ לא מחותם";
          const timeLabel = emp.lastCheckTime
            ? new Date(emp.lastCheckTime * 1000).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
            : "—";
          empMarker.bindPopup(`
            <div dir="rtl" style="font-family:system-ui;min-width:150px">
              <p style="font-weight:900;font-size:13px;margin:0 0 4px">${emp.name}</p>
              <p style="font-size:11px;color:#555;margin:0 0 2px">מספר: ${emp.workerTag ?? "—"}</p>
              <p style="font-size:11px;margin:0 0 2px">${checkLabel}</p>
              <p style="font-size:11px;color:#777;margin:0">שעה אחרונה: ${timeLabel}</p>
            </div>
          `);
        }

        // Fit map to zone bounds if any
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      };

      processZones();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: "520px", width: "100%", borderRadius: "16px", overflow: "hidden" }}
    />
  );
}
