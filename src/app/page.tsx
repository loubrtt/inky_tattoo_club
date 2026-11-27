import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Pirata_One, Playfair_Display } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { instagramDmUrl, instagramUrl, mailtoUrl, telUrl } from "@/lib/landing/content";
import { getPublicLanding } from "@/lib/landing/data";
import { todayKey } from "@/lib/planning/time";
import { CursorLight } from "./cursor-light";
import { Intro } from "./intro";
import { ArtistStories } from "./artist-stories";
import { MobileTabs } from "./mobile-tabs";
import { OpenBadge } from "./open-badge";
import { CopyAddress } from "./copy-address";
import { InstagramThread } from "./instagram-thread";
import { MapBlock, MetroBadges } from "./place-card";
import { OpeningHours } from "./opening-hours";
import { GlitchTitle } from "./glitch-title";
import { NeedleRule } from "./needle-rule";
import { SectionNav } from "./section-nav";
import { SmoothAnchors } from "./smooth-anchors";
import { TouchHeart } from "./touch-heart";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
// Police gothique du glitch : changer ici pour en essayer une autre.
const gothic = Pirata_One({ variable: "--font-gothic-face", subsets: ["latin"], weight: "400" });

export async function generateMetadata(): Promise<Metadata> {
  const { studioName } = await getPublicLanding();
  return {
    title: { absolute: studioName },
    description: `Studio de tatouage ${studioName}.`,
  };
}

const SECTIONS = [
  { id: "studio", label: "Le studio" },
  { id: "artistes", label: "Artistes" },
  { id: "infos", label: "Infos pratiques" },
  { id: "rendez-vous", label: "Rendez-vous" },
] as const;

const label = "font-label text-[11px] tracking-[0.18em] uppercase";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flash";

// Emplacement discret tant que la valeur n'est pas remplie dans src/lib/landing/content.ts.
function Todo({ children, block = false }: { children: string; block?: boolean }) {
  return (
    <span
      className={`font-editorial text-bone-dim font-normal tracking-normal normal-case italic ${
        block ? "block" : ""
      }`}
    >
      {children} à compléter
    </span>
  );
}

function Fill({ value, todo, block }: { value: string | null; todo: string; block?: boolean }) {
  return value ? <>{value}</> : <Todo block={block}>{todo}</Todo>;
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

// Ordre d'apparition du hero au chargement.
const order = (i: number) => ({ "--i": i }) as CSSProperties;

// Titre dont les mots s'allument un à un pendant le scroll (voir .lit dans globals.css).
// Variante « studio » : suit le défilement de la section fixée (voir .lit-studio).
function LitWords({ text, studio = false }: { text: string; studio?: boolean }) {
  const words = text.split(" ");
  // Plage de défilement (en %) sur laquelle les mots s'allument, du premier au dernier.
  const [start, span] = studio ? [5, 75] : [25, 25];
  return (
    <span className={studio ? "block" : "lit block"}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className={studio ? "lit-word lit-word--studio" : "lit-word"}
          style={
            {
              "--from": `${start + (i / words.length) * span}%`,
              "--to": `${start + ((i + 1) / words.length) * span + 5}%`,
            } as CSSProperties
          }
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function Section({
  id,
  title,
  children,
  sticky = false,
  aside,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
  sticky?: boolean;
  /** Colonne de droite sur ordinateur (sous le contenu sur téléphone). */
  aside?: ReactNode;
}) {
  // sticky : la section s'allonge et son contenu reste à l'écran pendant la lecture,
  // seulement si le navigateur gère les animations au scroll et que le mouvement est permis.
  // Ordinateur seulement : sur téléphone, chaque section tient dans un écran (défilement façon Reels).
  const tall = "lit-studio md:supports-[animation-timeline:view()]:motion-safe:min-h-[200vh]";
  const pinned =
    "md:supports-[animation-timeline:view()]:motion-safe:sticky md:supports-[animation-timeline:view()]:motion-safe:top-28";
  return (
    <section
      id={id}
      data-snap
      aria-labelledby={`${id}-titre`}
      className={`scroll-mt-20 px-5 py-24 outline-none max-md:flex max-md:min-h-[calc(100svh-4rem)] max-md:scroll-mt-16 max-md:flex-col max-md:justify-center max-md:pt-6 max-md:pb-28 sm:px-10 lg:py-40 ${sticky ? tall : ""}`}
    >
      <div className={`mx-auto w-full max-w-6xl min-w-0 ${sticky ? pinned : ""}`}>
        {aside ? (
          <div className="grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-16">
            <div className="min-w-0">
              <h2
                id={`${id}-titre`}
                className="font-editorial reveal text-5xl leading-none tracking-tight text-balance sm:text-7xl"
              >
                {title}
              </h2>
              <div className="mt-10 max-md:mt-8">{children}</div>
            </div>
            <div className="reveal min-w-0">{aside}</div>
          </div>
        ) : (
          <>
            <h2
              id={`${id}-titre`}
              className="font-editorial reveal text-5xl leading-none tracking-tight text-balance sm:text-7xl"
            >
              {title}
            </h2>
            <div className="mt-14 max-md:mt-8 lg:mt-20">{children}</div>
          </>
        )}
      </div>
    </section>
  );
}

// Grand lien de contact : le texte affiché est l'info elle-même (@compte, e-mail, numéro).
function ContactLink({
  href,
  text,
  todo,
}: {
  href: string | null;
  text: string | null;
  todo: string;
}) {
  if (!href || !text) return <Todo>{todo}</Todo>;
  const external = href.startsWith("https://");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group font-editorial decoration-bone/30 hover:text-flash hover:decoration-flash inline-flex min-h-11 items-center gap-3 text-3xl break-all underline decoration-1 underline-offset-8 transition-colors duration-150 sm:text-5xl ${focusRing}`}
    >
      {text}
      {external && <ArrowIcon />}
    </a>
  );
}

export default async function LandingPage() {
  const user = await getCurrentUser();
  const team = user
    ? { href: "/dashboard", text: "Accéder à mon espace" }
    : { href: "/connexion", text: "Espace équipe" };
  const { studioName, content } = await getPublicLanding();
  const { about, artists, practical, booking } = content;
  // Section du studio fixée pendant la lecture seulement si le texte tient à l'écran.
  const pinStudio = Boolean(about.text && about.text.length <= 600);
  const igHandle = booking.instagram?.trim().replace(/^@/, "") || null;
  const igDm = instagramDmUrl(booking.instagram);
  // Footer : Instagram du studio, puis ceux des artistes (sans doublon).
  const instagramLinks = [
    { handle: booking.instagram, name: null as string | null },
    ...artists.map((a) => ({ handle: a.instagram, name: a.name })),
  ]
    .map((x) => {
      const href = instagramUrl(x.handle);
      const clean = x.handle?.trim().replace(/^@/, "");
      return href && clean ? { href, handle: `@${clean}`, name: x.name } : null;
    })
    .filter((x): x is { href: string; handle: string; name: string | null } => x !== null)
    .filter((x, i, list) => list.findIndex((y) => y.href === x.href) === i);

  return (
    <div
      className={`${playfair.variable} ${jetbrains.variable} ${gothic.variable} landing bg-night text-bone flex flex-1 flex-col overflow-x-clip text-base`}
    >
      <a
        href="#contenu"
        className="bg-bone text-night sr-only z-20 rounded-md px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>

      {/* Intro : le cœur bat puis éclate en encre rose (au toucher sur téléphone). */}
      <Intro />
      <div aria-hidden className="grain" />

      <CursorLight />
      <TouchHeart />
      <SmoothAnchors />

      <header className="bg-night/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl min-w-0 items-center justify-between gap-3 px-5 sm:px-10 md:gap-6">
          <a
            href="#contenu"
            className={`font-editorial min-w-0 truncate text-lg font-bold tracking-wide ${focusRing}`}
          >
            {studioName}
          </a>
          {practical.week && (
            <span className="md:hidden">
              <OpenBadge week={practical.week} closures={practical.closures} />
            </span>
          )}
          <SectionNav
            sections={SECTIONS}
            linkClassName={`font-editorial inline-flex min-h-10 items-center px-3 text-sm font-bold tracking-wide uppercase transition-[color,text-shadow] duration-300 ${focusRing}`}
          />
          <Link
            href={team.href}
            className={`${label} text-bone-dim hover:text-bone hidden min-h-10 items-center transition-colors duration-150 md:inline-flex ${focusRing}`}
          >
            {team.text}
          </Link>
        </div>
        <NeedleRule variant="header" sections={SECTIONS} />
      </header>
      <MobileTabs sections={SECTIONS} />

      <main id="contenu" className="flex-1 outline-none">
        <section
          data-snap
          className="px-5 pt-20 pb-24 max-md:flex max-md:min-h-[calc(100svh-4rem)] max-md:flex-col max-md:justify-center max-md:pt-6 max-md:pb-28 sm:px-10 lg:pt-32 lg:pb-32"
        >
          <div className="mx-auto w-full max-w-6xl min-w-0">
            <p className={`${label} text-bone-dim hero-in`} style={order(0)}>
              Studio de tatouage
            </p>
            <h1 className="font-editorial hero-recede mt-6 text-[clamp(3rem,13vw,10rem)] leading-[0.88] font-black tracking-tight text-balance">
              {/* Glitch périodique et au clic : le titre passe en gothique le temps d'un éclat. */}
              <GlitchTitle text={studioName} />
            </h1>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <p
                className="font-editorial hero-in text-2xl leading-snug text-pretty italic sm:text-3xl"
                style={order(2)}
              >
                <Fill value={content.tagline} todo="phrase d’accroche" />
              </p>
              <div className="hero-in" style={order(3)}>
                <div className="text-bone-dim leading-relaxed text-pretty">
                  <Fill value={content.intro} todo="présentation courte, 2 ou 3 phrases" block />
                </div>
                {/* Version B choisie par Lou : ça vibre comme une machine, l'encre monte, gothique. */}
                <a href="#rendez-vous" className={`cta-machine font-editorial mt-8 ${focusRing}`}>
                  <span className="cta-machine-txt">
                    <span className="cta-machine-norm">Parler de ton projet</span>
                    <span aria-hidden className="cta-machine-goth">
                      Parler de ton projet
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <Section id="studio" title={<Fill value={about.title} todo="titre" />} sticky={pinStudio}>
          <div className="max-w-4xl text-2xl leading-snug text-pretty whitespace-pre-line sm:text-3xl">
            {about.text ? (
              <LitWords text={about.text} studio={pinStudio} />
            ) : (
              <Todo block>texte de présentation du studio</Todo>
            )}
          </div>
          <p className="text-bone-dim reveal mt-10 max-w-3xl text-xl leading-relaxed text-pretty">
            {about.styles.length ? (
              <>
                On tatoue{" "}
                {about.styles.map((style, i) => (
                  <span key={`${i}-${style}`}>
                    <em className="font-editorial text-bone">{style}</em>
                    {i < about.styles.length - 2
                      ? ", "
                      : i === about.styles.length - 2
                        ? " et "
                        : "."}
                  </span>
                ))}
              </>
            ) : (
              <Todo>styles pratiqués</Todo>
            )}
          </p>
        </Section>

        <Section id="artistes" title="Les artistes">
          {artists.length > 0 && (
            <div className="md:hidden">
              <ArtistStories
                artists={artists.map((a) => ({
                  name: a.name,
                  styles: a.styles,
                  bio: a.bio,
                  instagramUrl: instagramUrl(a.instagram),
                }))}
              />
            </div>
          )}
          {artists.length ? (
            <ul className="hidden gap-6 md:grid md:gap-2">
              {artists.map((a, i) => {
                const ig = instagramUrl(a.instagram);
                return (
                  <li
                    key={`${i}-${a.name ?? "artiste"}`}
                    className="group reveal flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-12"
                  >
                    <h3 className="font-editorial pointer-fine:md:text-bone-dim pointer-fine:md:group-hover:text-flash pointer-fine:md:group-focus-within:text-flash text-5xl leading-none break-words transition-colors duration-200 sm:text-7xl lg:text-8xl">
                      <Fill value={a.name} todo="nom" />
                    </h3>
                    <div className="max-w-sm transition-opacity duration-200 pointer-fine:md:opacity-0 pointer-fine:md:group-focus-within:opacity-100 pointer-fine:md:group-hover:opacity-100">
                      <p className="text-bone">
                        <Fill value={a.styles} todo="styles" />
                      </p>
                      <p className="text-bone-dim mt-2 leading-relaxed text-pretty">
                        <Fill value={a.bio} todo="quelques mots sur l’artiste" />
                      </p>
                      <p className="mt-3">
                        {ig ? (
                          <a
                            href={ig}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Instagram de ${a.name ?? "l’artiste"}`}
                            className={`group/ig hover:text-flash inline-flex min-h-11 items-center gap-2 underline decoration-1 underline-offset-4 transition-colors duration-150 ${focusRing}`}
                          >
                            Instagram <ArrowIcon />
                          </a>
                        ) : (
                          <Todo>Instagram</Todo>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Todo block>ajouter les artistes</Todo>
          )}
        </Section>

        <Section id="infos" title="Infos pratiques">
          {/* Téléphone : adresse, carte, puis horaires (écran suivant).
              Ordinateur : carte sur toute la hauteur à gauche, adresse et horaires à droite. */}
          <div className="grid gap-x-16 gap-y-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
            <div className="reveal min-w-0 md:col-start-2 md:row-start-1 md:pl-10 lg:pl-20">
              <h3 className={`${label} text-bone-dim mb-4`}>Adresse</h3>
              <address className="font-editorial text-3xl leading-tight not-italic">
                {practical.address ? (
                  <CopyAddress
                    address={[practical.address, practical.city].filter(Boolean).join(", ")}
                  >
                    <span>{practical.address}</span>
                    <span className="text-bone-dim text-xl">
                      <Fill value={practical.city} todo="code postal et ville" />
                    </span>
                  </CopyAddress>
                ) : (
                  <span className="grid gap-1">
                    <Todo>adresse</Todo>
                    <span>
                      <Fill value={practical.city} todo="code postal et ville" />
                    </span>
                  </span>
                )}
              </address>
              {/* Texte d'accès facultatif : inutile de le réclamer quand les stations sont renseignées. */}
              {(practical.access || practical.metro.length === 0) && (
                <p className="text-bone-dim mt-6 leading-relaxed text-pretty whitespace-pre-line">
                  <Fill value={practical.access} todo="transports, parking, étage…" />
                </p>
              )}
              <div className="mt-5">
                <MetroBadges metro={practical.metro} />
              </div>
            </div>
            <MapBlock
              address={practical.address}
              city={practical.city}
              geo={practical.geo}
              className="reveal md:col-start-1 md:row-span-2 md:row-start-1"
            />
            <div
              data-snap
              className="reveal max-md:flex max-md:min-h-[calc(100svh-4rem)] max-md:scroll-mt-16 max-md:flex-col max-md:justify-center max-md:pb-28 md:col-start-2 md:row-start-2 md:pl-10 lg:pl-20"
            >
              <h3 className={`${label} text-bone-dim`}>Horaires</h3>
              {practical.week ? (
                <OpeningHours
                  week={practical.week}
                  closures={practical.closures}
                  today={todayKey()}
                />
              ) : practical.hours.length ? (
                <table className="mt-4 w-full max-w-sm text-left text-lg">
                  <tbody>
                    {practical.hours.map((h) => (
                      <tr key={h.days}>
                        <th scope="row" className="text-bone-dim py-1.5 pr-8 font-normal">
                          {h.days}
                        </th>
                        <td className="py-1.5 tabular-nums">{h.hours ?? "Fermé"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-4 text-lg">
                  <Todo>horaires d’ouverture</Todo>
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section
          id="rendez-vous"
          title={<LitWords text="Ton projet commence par un message." />}
          aside={igDm && igHandle ? <InstagramThread handle={igHandle} href={igDm} /> : undefined}
        >
          <div className="text-bone-dim reveal max-w-2xl text-xl leading-relaxed text-pretty">
            <Fill
              value={booking.text}
              todo="comment se passe une demande : projet, devis, acompte…"
              block
            />
          </div>
          {/* Autres moyens de contact : seulement ceux remplis dans Site public. */}
          {(mailtoUrl(booking.email) || telUrl(booking.phone)) && (
            <ul className="reveal mt-10 grid gap-3">
              {mailtoUrl(booking.email) && (
                <li>
                  <ContactLink
                    href={mailtoUrl(booking.email)}
                    text={booking.email?.trim() ?? null}
                    todo="e-mail du studio"
                  />
                </li>
              )}
              {telUrl(booking.phone) && (
                <li>
                  <ContactLink
                    href={telUrl(booking.phone)}
                    text={booking.phone?.trim() ?? null}
                    todo="téléphone du studio"
                  />
                </li>
              )}
            </ul>
          )}
          {!igDm && !mailtoUrl(booking.email) && !telUrl(booking.phone) && (
            <p className="reveal mt-10">
              <Todo>moyens de contact</Todo>
            </p>
          )}
        </Section>
      </main>

      <footer data-snap-end className="relative px-5 pt-20 pb-32 sm:px-10 md:pb-12 lg:pt-28">
        <NeedleRule variant="footer" />
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-editorial text-4xl">{studioName}</p>
            <address className="text-bone-dim mt-4 grid gap-1 not-italic">
              <span>
                <Fill value={practical.address} todo="adresse" />
              </span>
              <span>
                <Fill value={practical.city} todo="code postal et ville" />
              </span>
            </address>
          </div>
          <nav aria-label="Pied de page">
            <ul className="grid gap-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`text-bone-dim hover:text-bone inline-flex min-h-10 items-center transition-colors duration-150 ${focusRing}`}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid content-start gap-1">
            {/* Instagram du studio puis des artistes, tels que réglés dans Site public. */}
            {instagramLinks.length > 0 && (
              <ul className="mb-4 grid gap-1" aria-label="Instagram">
                {instagramLinks.map((ig) => (
                  <li key={ig.href}>
                    <a
                      href={ig.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-editorial decoration-bone/30 hover:text-flash hover:decoration-flash inline-flex min-h-10 items-baseline gap-2 underline decoration-1 underline-offset-4 transition-colors duration-150 ${focusRing}`}
                    >
                      {ig.handle}
                      {ig.name && (
                        <span className="text-bone-dim text-sm no-underline">{ig.name}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={team.href}
              className={`text-bone-dim hover:text-bone inline-flex min-h-10 items-center transition-colors duration-150 ${focusRing}`}
            >
              {team.text}
            </Link>
          </div>
        </div>
        <p className="text-bone-dim mx-auto mt-20 max-w-6xl text-sm">
          © {new Date().getFullYear()} {studioName}
        </p>
      </footer>
    </div>
  );
}
