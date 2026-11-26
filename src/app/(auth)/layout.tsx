import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid flex-1 place-items-center bg-[radial-gradient(circle_at_top,#f1e8f6,transparent_60%)] px-4 py-10">
      <div className="border-line bg-paper shadow-soft w-full max-w-md rounded-3xl border p-8">
        <div className="mb-8">
          <Brand />
        </div>
        {children}
        <p className="text-muted mt-8 text-center text-xs">
          Accès réservé aux membres autorisés du studio.
        </p>
      </div>
    </main>
  );
}
