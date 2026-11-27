import { directionsLinks, lineLabel, lineStyle, osmEmbedUrl } from "@/lib/landing/transit";
import type { Geo, TransitStop } from "@/lib/landing/transit";

// Boutons en verre fumé posés sur la carte (version C choisie par Lou).
const glass =
  "font-editorial border-bone/15 bg-night/60 hover:border-flash hover:text-flash text-bone flex min-h-11 min-w-0 flex-1 items-center justify-center truncate rounded-xl border px-2 text-[0.95rem] backdrop-blur-md backdrop-saturate-150 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flash";

// Pastilles des lignes de métro / RER proches, aux couleurs officielles.
export function MetroBadges({ metro }: { metro: TransitStop[] }) {
  if (!metro.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Métro et RER à proximité">
      {metro.map((m, i) => {
        const c = lineStyle(m.line);
        return (
          <li key={`${m.line}-${i}`} className="text-bone-dim flex items-center gap-2 text-sm">
            <span
              className="font-label grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-medium"
              style={{ backgroundColor: c.bg, color: c.fg }}
              aria-label={lineLabel(m.line)}
              role="img"
            >
              {m.line.replace("bis", "b")}
            </span>
            <span className="text-bone min-w-0 break-words">{m.station}</span>
          </li>
        );
      })}
    </ul>
  );
}

// Carte OpenStreetMap (aperçu non interactif pour ne pas bloquer le défilement), cœur rose
// sur le studio, boutons d'itinéraire posés dessus. Sans position : les boutons seuls.
export function MapBlock({
  address,
  city,
  geo,
  className = "",
}: {
  address: string | null;
  city: string | null;
  geo: Geo | null;
  className?: string;
}) {
  const full = [address, city].filter(Boolean).join(", ");
  const links = full ? directionsLinks(`${full}, France`, geo) : null;
  if (!links) return null;
  return (
    <div className={`min-w-0 ${className}`}>
      {links && (
        <div
          className={
            geo
              ? "border-bone/12 relative aspect-[4/3] h-full max-w-full overflow-hidden rounded-3xl border md:aspect-auto md:min-h-[32rem]"
              : undefined
          }
        >
          {geo && (
            <>
              <iframe
                title="Plan d’accès au studio (OpenStreetMap)"
                src={osmEmbedUrl(geo)}
                loading="lazy"
                tabIndex={-1}
                // Débord de 60 px de chaque côté : les boutons + / − (en haut à gauche) et les mentions
                // d'OSM sortent du cadre ; le centre, donc le studio, ne bouge pas.
                className="pointer-events-none absolute -top-[60px] -left-[60px] h-[calc(100%+120px)] w-[calc(100%+120px)] max-w-none border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.6)_brightness(0.9)]"
              />
              <span className="from-night/70 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent to-45%" />
              {/* Le studio : cœur rose au centre (la carte est centrée sur lui), pointe sur l'adresse. */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center"
              >
                <span className="bg-flash/40 absolute size-3 rounded-full motion-safe:animate-[sonar_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <svg
                  viewBox="0 0 24 24"
                  className="text-flash relative size-7 -translate-y-1/2 drop-shadow-[0_0_10px_var(--color-flash)]"
                >
                  <path
                    fill="currentColor"
                    d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z"
                  />
                </svg>
              </span>
              <span className="font-label text-bone/50 pointer-events-none absolute top-2.5 left-3 text-[8px] tracking-[0.12em] uppercase">
                © contributeurs OpenStreetMap
              </span>
            </>
          )}
          <nav
            aria-label="Itinéraire jusqu’au studio"
            className={`flex gap-1.5 ${geo ? "absolute inset-x-2.5 bottom-2.5" : ""}`}
          >
            {(
              [
                ["Citymapper", links.citymapper, "Itinéraire en transports avec Citymapper"],
                ["Waze", links.waze, "Itinéraire en voiture avec Waze"],
                ["Maps", links.google, "Ouvrir l’adresse dans Google Maps"],
              ] as const
            ).map(([name, href, label]) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={glass}
              >
                {name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
