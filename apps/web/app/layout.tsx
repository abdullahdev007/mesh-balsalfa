import type { Metadata } from "next";

import "./styles/global.scss";

import "@fontsource/rubik";

import { ThemeProvider } from "@/context/ThemeContext";

import "react-tooltip/dist/react-tooltip.css";
import Footer from "@/components/footer/footer";
import ToastProvider from "@/components/toastProvider/ToastProvider";

import { GameProvider } from "@/context/GameContext";

export const metadata: Metadata = {
  title: "مش بلسالفة",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body>
        <GameProvider>
          <ThemeProvider>
            <div className="main">{children}</div>
            <Footer />
            <ToastProvider />
          </ThemeProvider>
        </GameProvider>
      </body>
    </html>
  );
}
