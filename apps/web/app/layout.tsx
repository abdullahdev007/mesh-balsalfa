import type { Metadata } from "next";

import "./styles/global.scss";

import "@fontsource/rubik";

import { ThemeProvider, useTheme } from "./context/ThemeContext";

import "react-tooltip/dist/react-tooltip.css";
import Footer from "./components/footer/footer";
import { Toaster } from "react-hot-toast";
import ToastProvider from "./components/toastProvider/ToastProvider";

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
        <ThemeProvider>
          <div className="main">{children}</div>
          <Footer />
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
