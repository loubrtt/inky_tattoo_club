export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="font-display relative grid size-10 place-items-center rounded-xl bg-[#211d26] text-2xl font-extrabold text-white ring-1 ring-white/10">
        i
        <span aria-hidden className="absolute top-1 right-1.5 text-[10px] text-[#ff8edb]">
          ♥
        </span>
      </span>
      {!compact && (
        <span>
          <strong className="font-display block text-lg font-extrabold tracking-[0.1em]">
            INKY
          </strong>
          <small className="block text-[9px] tracking-[0.35em] text-[#9b819f]">CLIENT</small>
        </span>
      )}
    </span>
  );
}
