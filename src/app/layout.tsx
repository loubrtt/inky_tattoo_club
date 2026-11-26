import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "INKY CLIENT", template: "%s · INKY CLIENT" },
  description: "Espace privé de gestion du studio INKY TATTOO",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-sm">{children}</body>
    </html>
  );
}
