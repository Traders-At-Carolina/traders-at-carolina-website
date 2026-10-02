import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Chivo, Gelasio, Public_Sans } from "next/font/google";
import { ClickTracker } from "@/components/ClickTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/content/site";
import { introScript } from "@/lib/intro";
import { validateSite } from "@/lib/validate-site";
import "./globals.css";

validateSite(site);

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

// Boxy, heavy grotesque for the Team page tier titles.
const chivo = Chivo({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-chivo",
  display: "swap",
});

// Fallback for devices without Georgia (Android, Linux); never preloaded (00 §5.1).
const gelasio = Gelasio({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-gelasio",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.mission,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${gelasio.variable} ${chivo.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal-on-scroll styles only when JS runs, so content never stays hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Decides before first paint whether this tab plays the Home intro (spec 01 §3.6). */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
        <ClickTracker applyUrl={site.recruiting.applyUrl} interestFormUrl={site.recruiting.interestFormUrl} />
        <Analytics />
      </body>
    </html>
  );
}
