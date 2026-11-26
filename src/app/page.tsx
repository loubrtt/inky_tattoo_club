import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Pirata_One, Playfair_Display } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { instagramUrl, mailtoUrl, telUrl } from "@/lib/landing/content";
import { getPublicLanding } from "@/lib/landing/data";
import { CursorLight } from "./cursor-light";
import { SmoothAnchors } from "./smooth-anchors";

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
function LitWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span className="lit block">
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="lit-word"
          style={
            {
              "--from": `${25 + (i / words.length) * 25}%`,
              "--to": `${25 + ((i + 1) / words.length) * 25 + 5}%`,
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

function Section({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="scroll-mt-20 px-5 py-24 outline-none sm:px-10 lg:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id={`${id}-titre`}
          className="font-editorial reveal text-5xl leading-none tracking-tight text-balance sm:text-7xl"
        >
          {title}
        </h2>
        <div className="mt-14 lg:mt-20">{children}</div>
      </div>
    </section>
  );
}

const smallHeading = "text-bone-dim text-sm";

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

      <CursorLight />
      <SmoothAnchors />

      <header className="border-bone/12 bg-night/90 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-10">
          <a
            href="#contenu"
            className={`font-editorial text-lg font-bold tracking-wide ${focusRing}`}
          >
            {studioName}
          </a>
          <nav aria-label="Sections de la page" className="hidden md:block">
            <ul className="flex gap-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`text-bone-dim hover:text-bone inline-flex min-h-10 items-center px-3 text-sm transition-colors duration-150 ${focusRing}`}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={team.href}
            className={`${label} text-bone-dim hover:text-bone inline-flex min-h-10 items-center transition-colors duration-150 ${focusRing}`}
          >
            {team.text}
          </Link>
        </div>
      </header>

      <main id="contenu" className="flex-1 outline-none">
        <section className="px-5 pt-20 pb-24 sm:px-10 lg:pt-32 lg:pb-32">
          <div className="mx-auto max-w-6xl">
            <p className={`${label} text-bone-dim hero-in`} style={order(0)}>
              Studio de tatouage
            </p>
            <h1 className="font-editorial hero-recede mt-6 text-[clamp(3rem,13vw,10rem)] leading-[0.88] font-black tracking-tight text-balance">
              {/* Glitch périodique : le titre passe en gothique le temps d'un éclat (globals.css). */}
              <span className="hero-in glitch relative block" style={order(1)}>
                <span className="glitch-base block">{studioName}</span>
                <span aria-hidden className="glitch-layer glitch-goth">
                  {studioName}
                </span>
                <span aria-hidden className="glitch-layer glitch-slice-a text-flash">
                  {studioName}
                </span>
                <span aria-hidden className="glitch-layer glitch-slice-b text-white">
                  {studioName}
                </span>
              </span>
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
                <a
                  href="#rendez-vous"
                  className={`bg-bone text-night mt-8 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold transition-[background-color,scale] duration-150 ease-out hover:bg-white active:scale-[0.96] ${focusRing}`}
                >
                  Parler de ton projet
                </a>
              </div>
            </div>
          </div>
        </section>

        <Section id="studio" title={<Fill value={about.title} todo="titre" />}>
          <div className="reveal max-w-4xl text-2xl leading-snug text-pretty whitespace-pre-line sm:text-3xl">
            <Fill value={about.text} todo="texte de présentation du studio" block />
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
          {artists.length ? (
            <ul className="grid gap-6 md:gap-2">
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
          <div className="grid gap-14 md:grid-cols-2 md:gap-20">
            <div className="reveal">
              <address className="font-editorial grid gap-1 text-3xl leading-tight not-italic">
                <span>
                  <Fill value={practical.address} todo="adresse" />
                </span>
                <span>
                  <Fill value={practical.city} todo="code postal et ville" />
                </span>
              </address>
              <p className="text-bone-dim mt-6 leading-relaxed text-pretty">
                <Fill value={practical.access} todo="transports, parking, étage…" />
              </p>
            </div>
            <div className="reveal">
              <h3 className={smallHeading}>Horaires</h3>
              {practical.hours.length ? (
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

        <Section id="rendez-vous" title={<LitWords text="Ton projet commence par un message." />}>
          <div className="text-bone-dim reveal max-w-2xl text-xl leading-relaxed text-pretty">
            <Fill
              value={booking.text}
              todo="comment se passe une demande : projet, devis, acompte…"
              block
            />
          </div>
          <ul className="reveal mt-14 grid gap-4">
            <li>
              <ContactLink
                href={instagramUrl(booking.instagram)}
                text={booking.instagram ? `@${booking.instagram.trim().replace(/^@/, "")}` : null}
                todo="Instagram du studio"
              />
            </li>
            <li>
              <ContactLink
                href={mailtoUrl(booking.email)}
                text={booking.email?.trim() ?? null}
                todo="e-mail du studio"
              />
            </li>
            <li>
              <ContactLink
                href={telUrl(booking.phone)}
                text={booking.phone?.trim() ?? null}
                todo="téléphone du studio"
              />
            </li>
          </ul>
        </Section>
      </main>

      <footer className="border-bone/12 border-t px-5 pt-20 pb-12 sm:px-10 lg:pt-28">
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
