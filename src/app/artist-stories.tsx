"use client";

import { useEffect, useRef, useState } from "react";

export type StoryArtist = {
  name: string | null;
  styles: string | null;
  bio: string | null;
  instagramUrl: string | null;
};

const STORY_MS = 5000;

// Fond « encre » propre à chaque carte (dégradés roses à des places différentes).
function inkBackground(i: number) {
  const spots = [
    ["22% 28%", "78% 64%"],
    ["70% 22%", "26% 70%"],
    ["50% 40%", "84% 82%"],
    ["16% 60%", "66% 30%"],
  ][i % 4];
  return [
    `radial-gradient(circle at ${spots[0]}, color-mix(in oklab, var(--color-flash) 55%, transparent), transparent 42%)`,
    `radial-gradient(circle at ${spots[1]}, color-mix(in oklab, var(--color-bone) 14%, transparent), transparent 38%)`,
    "linear-gradient(transparent 35%, color-mix(in oklab, var(--color-night) 94%, transparent))",
    "var(--color-night-raised)",
  ].join(", ");
}

// Téléphone : les artistes en « stories ». On glisse d'une carte à l'autre ; les segments
// du haut avancent tout seuls tant que la section est à l'écran (pas si moins d'animations).
export function ArtistStories({ artists }: { artists: StoryArtist[] }) {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0); // relance l'animation du segment en cours

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.5,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
        setIndex(Math.max(0, Math.min(artists.length - 1, i)));
        setRun((r) => r + 1);
      }, 90);
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      t.removeEventListener("scroll", onScroll);
    };
  }, [artists.length]);

  useEffect(() => {
    if (!visible || artists.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => {
      const t = track.current;
      if (!t) return;
      const next = (index + 1) % artists.length;
      t.scrollTo({ left: next * t.clientWidth, behavior: "smooth" });
    }, STORY_MS);
    return () => clearTimeout(timer);
  }, [visible, index, run, artists.length]);

  return (
    <div ref={root} className="-mx-5 sm:-mx-10">
      <div className="flex items-center gap-1 px-5 sm:px-10" aria-hidden>
        {artists.map((_, i) => (
          <span
            key={i}
            className="bg-bone/20 relative h-[2.5px] flex-1 overflow-hidden rounded-full"
          >
            <span
              key={i === index ? `run-${run}` : "idle"}
              className={`bg-flash absolute inset-0 origin-left ${
                i < index
                  ? "scale-x-100"
                  : i === index && visible
                    ? "motion-safe:animate-[story_5s_linear_forwards] motion-reduce:scale-x-100"
                    : "scale-x-0"
              }`}
            />
          </span>
        ))}
      </div>
      <p className="font-label text-bone-dim mt-3 px-5 text-[10px] tracking-[0.14em] uppercase sm:px-10">
        {index + 1} / {artists.length} · glisse pour voir les artistes
      </p>
      <div
        ref={track}
        className="mt-4 flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {artists.map((a, i) => (
          <article
            key={`${i}-${a.name ?? "artiste"}`}
            className="flex w-full shrink-0 snap-center px-5 sm:px-10"
            aria-label={a.name ?? `Artiste ${i + 1}`}
          >
            <div
              className="border-bone/12 flex min-h-[52svh] w-full min-w-0 flex-col justify-end rounded-[26px] border p-6"
              style={{ background: inkBackground(i) }}
            >
              <h3 className="font-editorial text-[clamp(2.2rem,13vw,3.4rem)] leading-[0.9] font-black break-words">
                {a.name ?? "Nom à compléter"}
              </h3>
              {a.styles && <p className="text-bone-dim mt-3 italic">{a.styles}</p>}
              {a.bio && (
                <p className="text-bone/85 mt-3 line-clamp-4 leading-relaxed text-pretty">
                  {a.bio}
                </p>
              )}
              {a.instagramUrl && (
                <a
                  href={a.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label bg-flash/12 text-flash mt-5 inline-flex min-h-11 items-center self-start rounded-full px-4 text-[11px] tracking-[0.1em] uppercase"
                >
                  Instagram ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
