import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image
        src="/brand/inky-heart-i.png"
        alt={compact ? "INKY CLIENT" : ""}
        width={40}
        height={40}
        preload
        className="size-10 shrink-0 rounded-xl bg-black ring-1 ring-white/10"
      />
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
