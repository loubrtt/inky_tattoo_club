// Lignes de métro et RER de Paris, avec leurs couleurs officielles (charte RATP / IDFM),
// pour les pastilles de la landing.
export const TRANSIT_LINES = [
  { id: "1", bg: "#FFCD00", fg: "#1a1a1a" },
  { id: "2", bg: "#003CA6", fg: "#ffffff" },
  { id: "3", bg: "#837902", fg: "#ffffff" },
  { id: "3bis", bg: "#6EC4E8", fg: "#1a1a1a" },
  { id: "4", bg: "#CF009E", fg: "#ffffff" },
  { id: "5", bg: "#FF7E2E", fg: "#1a1a1a" },
  { id: "6", bg: "#6ECA97", fg: "#1a1a1a" },
  { id: "7", bg: "#FA9ABA", fg: "#1a1a1a" },
  { id: "7bis", bg: "#6ECA97", fg: "#1a1a1a" },
  { id: "8", bg: "#E19BDF", fg: "#1a1a1a" },
  { id: "9", bg: "#B6BD00", fg: "#1a1a1a" },
  { id: "10", bg: "#C9910D", fg: "#1a1a1a" },
  { id: "11", bg: "#704B1C", fg: "#ffffff" },
  { id: "12", bg: "#007852", fg: "#ffffff" },
  { id: "13", bg: "#6EC4E8", fg: "#1a1a1a" },
  { id: "14", bg: "#62259D", fg: "#ffffff" },
  { id: "A", bg: "#E3051C", fg: "#ffffff" },
  { id: "B", bg: "#5291CE", fg: "#ffffff" },
  { id: "C", bg: "#FFCE00", fg: "#1a1a1a" },
  { id: "D", bg: "#00814F", fg: "#ffffff" },
  { id: "E", bg: "#C04191", fg: "#ffffff" },
] as const;

export type TransitLineId = (typeof TRANSIT_LINES)[number]["id"];
export const TRANSIT_LINE_IDS = TRANSIT_LINES.map((l) => l.id) as unknown as readonly [
  TransitLineId,
  ...TransitLineId[],
];

export type TransitStop = { line: TransitLineId; station: string };

export function lineStyle(id: string) {
  return TRANSIT_LINES.find((l) => l.id === id) ?? { id, bg: "#a9a39b", fg: "#121013" };
}

/** Libellé accessible : « Métro 2 » ou « RER B ». */
export function lineLabel(id: string) {
  return /^[A-E]$/.test(id) ? `RER ${id}` : `Métro ${id}`;
}

export type Geo = { lat: number; lng: number };

/** Liens d'itinéraire : coordonnées si connues, sinon l'adresse en texte. */
export function directionsLinks(address: string, geo: Geo | null) {
  const q = encodeURIComponent(address);
  const ll = geo ? `${geo.lat},${geo.lng}` : null;
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${ll ?? q}`,
    waze: ll
      ? `https://waze.com/ul?ll=${ll}&navigate=yes`
      : `https://waze.com/ul?q=${q}&navigate=yes`,
    citymapper: ll
      ? `https://citymapper.com/directions?endcoord=${ll}&endaddress=${q}`
      : `https://citymapper.com/directions?endaddress=${q}`,
  };
}

/** Carte OpenStreetMap intégrable, centrée sur le studio (sans marqueur : la landing pose
 *  son propre cœur au centre). */
export function osmEmbedUrl(geo: Geo) {
  const d = 0.004;
  const bbox = [geo.lng - d * 1.6, geo.lat - d, geo.lng + d * 1.6, geo.lat + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}
