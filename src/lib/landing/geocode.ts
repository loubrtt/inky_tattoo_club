import "server-only";
import type { Geo } from "@/lib/landing/transit";

// Adresse publique du studio -> coordonnées, via Nominatim (OpenStreetMap).
// Appelé seulement à l'enregistrement du site quand l'adresse change ; jamais bloquant :
// en cas d'échec, la landing affiche les liens d'itinéraire sans la carte.
export async function geocodeAddress(address: string, city: string | null): Promise<Geo | null> {
  const q = [address, city, "France"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "inky-client-landing/1.0", "Accept-Language": "fr" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[geocode] réponse", res.status);
      return null;
    }
    const data: unknown = await res.json();
    const first = Array.isArray(data) ? (data[0] as { lat?: unknown; lon?: unknown }) : null;
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  } catch (e) {
    console.error("[geocode] échec", e instanceof Error ? e.name : "inconnu");
    return null;
  }
}
