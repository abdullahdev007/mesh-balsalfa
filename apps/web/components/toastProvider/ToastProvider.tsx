// components/ToastProvider.tsx

"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";

const ToastProvider = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          fontSize: "0.7rem",
          background: theme === "dark" ? "#2D3142" : "#FFFFFF",
          color: theme === "dark" ? "#FFFFFF" : "#2D3142",
          border: "2px solid #EF8354",
          padding: "12px 16px",
          direction: "rtl",
        },
        success: {
          iconTheme: {
            primary: "#EF8354",
            secondary: theme === "dark" ? "#FFFFFF" : "#2D3142",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF8354",
            secondary: theme === "dark" ? "#FFFFFF" : "#2D3142",
          },
        },
      }}
    />
  );
};

export default ToastProvider;
