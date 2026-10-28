import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/prime/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PreStream",
  description:
    "A modern way to browse the PrimeWire catalog: movies, TV shows, ratings, cast and trailers.",
  icons: {
    icon: "/logo.svg",
  },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
