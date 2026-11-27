const HEART =
  "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z";

// Section Rendez-vous (version B choisie par Lou) : aperçu d'une conversation Instagram avec
// le studio. Toute la carte ouvre la messagerie. Les deux messages sont décoratifs (aria-hidden).
export function InstagramThread({ handle, href }: { handle: string; href: string }) {
  return (
    <div className="min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Envoyer un message à @${handle} sur Instagram`}
        className="group border-bone/12 bg-night-raised/60 hover:border-flash/50 focus-visible:outline-flash grid gap-2.5 rounded-[22px] border p-4 backdrop-blur-md transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-5"
      >
        <span className="border-bone/12 flex items-center gap-3 border-b pb-3">
          <span
            aria-hidden
            className="text-flash grid size-9 shrink-0 place-items-center rounded-full bg-[#050405]"
          >
            <svg viewBox="0 0 24 24" className="size-4">
              <path fill="currentColor" d={HEART} />
            </svg>
          </span>
          <span className="min-w-0">
            <b className="font-editorial block truncate font-bold">{handle}</b>
            <small className="font-editorial text-bone-dim block italic">
              Instagram · message privé
            </small>
          </span>
        </span>
        <span
          aria-hidden
          className="bg-flash text-night max-w-[85%] justify-self-end rounded-[18px] rounded-br-md px-3.5 py-2.5 leading-snug"
        >
          Hello ! J’ai une idée de tatouage, je vous envoie quelques images ?
        </span>
        <span
          aria-hidden
          className="max-w-[85%] justify-self-start rounded-[18px] rounded-bl-md bg-[#262127] px-3.5 py-2.5 leading-snug"
        >
          Avec plaisir, dis-nous l’emplacement et la taille.
        </span>
        <span className="border-bone/15 group-hover:border-flash mt-1.5 flex items-center justify-between gap-3 rounded-xl border py-1.5 pr-1.5 pl-4 transition-colors duration-200">
          <span className="font-editorial text-bone-dim truncate italic">Écris ton message…</span>
          <span className="font-editorial group-hover:text-flash shrink-0 rounded-lg bg-[#262127] px-3.5 py-2 transition-colors duration-200">
            Ouvrir Instagram
          </span>
        </span>
      </a>
    </div>
  );
}
