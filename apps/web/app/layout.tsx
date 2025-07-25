export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";

import "./styles/global.scss";

import "@fontsource/rubik";

import { ThemeProvider } from "@/context/ThemeContext";

import "react-tooltip/dist/react-tooltip.css";
import Footer from "@/components/footer/footer";
import ToastProvider from "@/components/toastProvider/ToastProvider";

import { GameProvider } from "@/context/GameContext";
import { ServerStatusModal } from "@/components/modals/ServerStatusModal/ServerStatusModal";

import { Rubik } from "next/font/google";

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مش بلسالفة",
  description:
    'لعبة "مش بلسالفة" هي لعبة جماعية ذكية وممتعة تكشف فيها من بينكم ما يعرف السالفة! تدعم حتى 12 لاعبًا، مع أوضاع أونلاين وأوفلاين، وميزة تعديل السوالف. اكتشف، خمن، واستمتع بالضحك والتحدي!',
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#EF8354",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className={rubik.className}>
      <body>
        <GameProvider>
          <ThemeProvider>
            <div className="main">{children}</div>
            <Footer />
            <ToastProvider />
            <ServerStatusModal />
          </ThemeProvider>
        </GameProvider>
      </body>
    </html>
  );
}
