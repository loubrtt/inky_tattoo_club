"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { saveLanding } from "@/lib/landing/actions";
import type { LandingContent } from "@/lib/landing/content";
import { ActionForm, Field, FormMessage, SubmitButton, TextArea } from "@/components/ui";

type ArtistDraft = { key: string; name: string; styles: string; bio: string; instagram: string };
type HoursDraft = { key: string; days: string; hours: string };
type Draft = {
  tagline: string;
  intro: string;
  aboutTitle: string;
  aboutText: string;
  styles: string;
  artists: ArtistDraft[];
  address: string;
  city: string;
  access: string;
  hours: HoursDraft[];
  bookingText: string;
  bookingInstagram: string;
  bookingEmail: string;
  bookingPhone: string;
};

const s = (v: string | null | undefined) => v ?? "";

function toDraft(c: LandingContent): Draft {
  return {
    tagline: s(c.tagline),
    intro: s(c.intro),
    aboutTitle: s(c.about.title),
    aboutText: s(c.about.text),
    styles: c.about.styles.join(", "),
    artists: c.artists.map((a, i) => ({
      key: `a${i}`,
      name: s(a.name),
      styles: s(a.styles),
      bio: s(a.bio),
      instagram: s(a.instagram),
    })),
    address: s(c.practical.address),
    city: s(c.practical.city),
    access: s(c.practical.access),
    hours: c.practical.hours.map((h, i) => ({ key: `h${i}`, days: h.days, hours: s(h.hours) })),
    bookingText: s(c.booking.text),
    bookingInstagram: s(c.booking.instagram),
    bookingEmail: s(c.booking.email),
    bookingPhone: s(c.booking.phone),
  };
}

// Brouillon -> forme attendue par landingSchema (le serveur revalide tout).
function toPayload(d: Draft) {
  return {
    tagline: d.tagline,
    intro: d.intro,
    about: {
      title: d.aboutTitle,
      text: d.aboutText,
      styles: d.styles
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    },
    artists: d.artists.map(({ name, styles, bio, instagram }) => ({
      name,
      styles,
      bio,
      instagram,
    })),
    practical: {
      address: d.address,
      city: d.city,
      access: d.access,
      hours: d.hours.map(({ days, hours }) => ({ days, hours })),
    },
    booking: {
      text: d.bookingText,
      instagram: d.bookingInstagram,
      email: d.bookingEmail,
      phone: d.bookingPhone,
    },
  };
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-line bg-paper shadow-soft rounded-2xl border p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

const smallButton =
  "border-line hover:bg-wash rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40";

export function SiteForm({ initial }: { initial: LandingContent }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [state, action, pending] = useActionState(saveLanding, {});
  const nextKey = useRef(0);
  const newKey = (prefix: string) => `${prefix}-new-${nextKey.current++}`;

  const err = (key: string) =>
    state.errors?.[key] ??
    Object.entries(state.errors ?? {}).find(([k]) => k.startsWith(`${key}.`))?.[1];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const text = (key: keyof Draft) => ({
    value: draft[key] as string,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  });

  const setArtist = (i: number, patch: Partial<ArtistDraft>) =>
    setDraft((d) => ({
      ...d,
      artists: d.artists.map((a, j) => (j === i ? { ...a, ...patch } : a)),
    }));
  const moveArtist = (i: number, delta: -1 | 1) =>
    setDraft((d) => {
      const list = [...d.artists];
      const j = i + delta;
      if (j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, artists: list };
    });

  const setHours = (i: number, patch: Partial<HoursDraft>) =>
    setDraft((d) => ({ ...d, hours: d.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));

  return (
    <ActionForm action={action} className="grid max-w-3xl gap-5">
      <input type="hidden" name="content" value={JSON.stringify(toPayload(draft))} />

      <Card title="En-tête" hint="Sous le grand nom du studio, en haut de la page.">
        <Field
          label="Phrase d’accroche"
          name="tagline"
          maxLength={160}
          error={err("tagline")}
          {...text("tagline")}
        />
        <TextArea
          label="Présentation courte (2 ou 3 phrases)"
          name="intro"
          rows={3}
          maxLength={600}
          error={err("intro")}
          {...text("intro")}
        />
      </Card>

      <Card title="Le studio">
        <Field
          label="Titre"
          name="about.title"
          maxLength={120}
          error={err("about.title")}
          {...text("aboutTitle")}
        />
        <TextArea
          label="Présentation du studio"
          name="about.text"
          rows={5}
          maxLength={3000}
          error={err("about.text")}
          {...text("aboutText")}
        />
        <Field
          label="Styles pratiqués (séparés par des virgules)"
          name="about.styles"
          placeholder="Ex. fineline, blackwork, dotwork"
          error={err("about.styles")}
          {...text("styles")}
        />
      </Card>

      <Card
        title="Artistes"
        hint="Affichés dans cet ordre. Rien n’est lié aux comptes : seul ce que tu écris ici est public."
      >
        {draft.artists.length === 0 && <p className="text-muted">Aucun artiste pour l’instant.</p>}
        {draft.artists.map((a, i) => (
          <fieldset key={a.key} className="border-line grid gap-4 rounded-xl border p-4">
            <legend className="px-1 text-xs font-semibold">Artiste {i + 1}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nom"
                name={`artists.${i}.name`}
                maxLength={80}
                value={a.name}
                onChange={(e) => setArtist(i, { name: e.target.value })}
                error={err(`artists.${i}.name`)}
              />
              <Field
                label="Styles"
                name={`artists.${i}.styles`}
                maxLength={120}
                value={a.styles}
                onChange={(e) => setArtist(i, { styles: e.target.value })}
                error={err(`artists.${i}.styles`)}
              />
            </div>
            <TextArea
              label="Quelques mots"
              name={`artists.${i}.bio`}
              rows={2}
              maxLength={600}
              value={a.bio}
              onChange={(e) => setArtist(i, { bio: e.target.value })}
              error={err(`artists.${i}.bio`)}
            />
            <Field
              label="Instagram (identifiant sans @)"
              name={`artists.${i}.instagram`}
              maxLength={31}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={a.instagram}
              onChange={(e) => setArtist(i, { instagram: e.target.value })}
              error={err(`artists.${i}.instagram`)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={smallButton}
                disabled={i === 0}
                onClick={() => moveArtist(i, -1)}
              >
                Monter
              </button>
              <button
                type="button"
                className={smallButton}
                disabled={i === draft.artists.length - 1}
                onClick={() => moveArtist(i, 1)}
              >
                Descendre
              </button>
              <button
                type="button"
                className={`${smallButton} text-danger`}
                onClick={() =>
                  set(
                    "artists",
                    draft.artists.filter((_, j) => j !== i),
                  )
                }
              >
                Retirer
              </button>
            </div>
          </fieldset>
        ))}
        <div>
          <button
            type="button"
            className={smallButton}
            disabled={draft.artists.length >= 20}
            onClick={() =>
              set("artists", [
                ...draft.artists,
                { key: newKey("a"), name: "", styles: "", bio: "", instagram: "" },
              ])
            }
          >
            ＋ Ajouter un artiste
          </button>
          {err("artists") && <p className="text-danger mt-2 text-xs">{err("artists")}</p>}
        </div>
      </Card>

      <Card title="Infos pratiques">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Adresse"
            name="practical.address"
            maxLength={160}
            error={err("practical.address")}
            {...text("address")}
          />
          <Field
            label="Code postal et ville"
            name="practical.city"
            maxLength={120}
            error={err("practical.city")}
            {...text("city")}
          />
        </div>
        <TextArea
          label="Accès (transports, parking, étage…)"
          name="practical.access"
          rows={2}
          maxLength={600}
          error={err("practical.access")}
          {...text("access")}
        />
        <div className="grid gap-3">
          <p className="font-medium">Horaires</p>
          {draft.hours.map((h, i) => (
            <div key={h.key} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Field
                label="Jours"
                name={`practical.hours.${i}.days`}
                placeholder="Ex. du mardi au samedi"
                maxLength={40}
                value={h.days}
                onChange={(e) => setHours(i, { days: e.target.value })}
                error={err(`practical.hours.${i}.days`)}
              />
              <Field
                label="Heures (vide = fermé)"
                name={`practical.hours.${i}.hours`}
                placeholder="Ex. de 11h à 19h"
                maxLength={40}
                value={h.hours}
                onChange={(e) => setHours(i, { hours: e.target.value })}
                error={err(`practical.hours.${i}.hours`)}
              />
              <button
                type="button"
                className={`${smallButton} text-danger mb-1`}
                onClick={() =>
                  set(
                    "hours",
                    draft.hours.filter((_, j) => j !== i),
                  )
                }
              >
                Retirer
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className={smallButton}
              disabled={draft.hours.length >= 14}
              onClick={() =>
                set("hours", [...draft.hours, { key: newKey("h"), days: "", hours: "" }])
              }
            >
              ＋ Ajouter une ligne d’horaires
            </button>
          </div>
        </div>
      </Card>

      <Card title="Prendre rendez-vous" hint="Les liens n’apparaissent que si l’info est valide.">
        <TextArea
          label="Comment se passe une demande"
          name="booking.text"
          rows={3}
          maxLength={1000}
          error={err("booking.text")}
          {...text("bookingText")}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Instagram du studio (sans @)"
            name="booking.instagram"
            maxLength={31}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            error={err("booking.instagram")}
            {...text("bookingInstagram")}
          />
          <Field
            label="E-mail"
            name="booking.email"
            type="email"
            maxLength={254}
            error={err("booking.email")}
            {...text("bookingEmail")}
          />
          <Field
            label="Téléphone"
            name="booking.phone"
            type="tel"
            maxLength={20}
            error={err("booking.phone")}
            {...text("bookingPhone")}
          />
        </div>
      </Card>

      <div className="bg-wash/90 sticky bottom-0 -mx-1 grid gap-3 px-1 py-4 backdrop-blur-sm">
        <FormMessage message={state.message} ok={state.ok} />
        <div className="flex justify-end">
          <SubmitButton pending={pending} pendingLabel="Enregistrement…">
            Enregistrer et publier
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
