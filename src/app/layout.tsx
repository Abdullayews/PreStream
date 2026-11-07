import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/prime/providers";

/* Type system — "Basement" voice:
   - Outfit: the UI voice (body, labels, buttons) — geometric, friendly.
   - Cabinet Grotesk: the display voice (headings, big statements) —
     self-hosted from public/fonts (see @font-face in globals.css),
     with Outfit as its own fallback.
   - Inter: reading fallback for long-form copy.
   - JetBrains Mono: keyboard hints and data chips. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetMono = JetBrains_Mono({
  variable: "--font-jet-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PreStream — your screening room",
    template: "%s · PreStream",
  },
  description:
    "A cinematic way to browse the PrimeWire catalog: movies, TV shows, ratings, cast and trailers — with watchlists, playlists and full account sync.",
  applicationName: "PreStream",
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-paint theme application — reads the persisted choice (zustand
            persist key "primestream-user") and sets data-theme BEFORE first
            paint so saved themes never flash. All wrapped in try/catch:
            corrupted/missing storage must never break the page. Legacy theme
            ids are migrated to their closest new id. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var LEGACY={mono:"neutral",crimson:"crimson-red",emerald:"forest-green",amber:"amber-gold",violet:"royal-purple",rose:"valentines-day",teal:"deep-ocean",orange:"lava-flow",lime:"forest-green",fuchsia:"royal-purple",sky:"ocean-blue",bronze:"amber-gold",mint:"forest-green",cherry:"crimson-red",halloween:"halloween",christmas:"christmas",valentine:"valentines-day",newyear:"new-year-eve",frosty:"winter-frost",stpatricks:"st-patricks",easter:"easter-spring",ironman:"crimson-red",hulk:"forest-green",thor:"northern-mist",cap:"independence-day-usa",panther:"royal-purple",spidey:"crimson-red",deadpool:"crimson-red"};
var raw=localStorage.getItem("primestream-user");
if(!raw)return;
var id=(JSON.parse(raw).state||{}).themeId;
if(!id||id==="auto")return;
var t=document.documentElement;
if(t.dataset.theme)return;
if(LEGACY[id])id=LEGACY[id];
var known="neutral midnight-black pure-light ocean-blue forest-green crimson-red royal-purple amber-gold slate-grey aurora sunset-horizon neon-cyber deep-ocean cotton-candy lava-flow northern-mist mesh-prism halloween christmas new-year-eve valentines-day easter-spring autumn-harvest st-patricks independence-day-usa lunar-new-year diwali eid-ramadan nowruz-spring winter-frost cyberpunk-city retro-synthwave terminal-hacker glassmorphism neumorphism-soft zen-minimal space-galaxy vintage-paper steampunk high-contrast-accessible";
if(known.split(" ").indexOf(id)>=0)t.dataset.theme=id;
}catch(e){}})();`,
          }}
        />
      </head>
      {/* suppressHydrationWarning: browser extensions / the preview wrapper
          may inject classes or attributes into <body> (and next-themes /
          the pre-paint theme script touch <html>) BEFORE React hydrates.
          Suppressing on the root tags keeps those external mutations from
          ever escalating into hydration errors — React only skips the
          attribute check on THIS element, everything inside still hydrates
          strictly. */}
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${inter.variable} ${jetMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
