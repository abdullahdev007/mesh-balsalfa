"use client";

import React from "react";

import styles from "./styles.module.scss";
import { Tooltip } from 'react-tooltip'
import ThemeToggle from "../themeToggle/themeToggle";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.developer}>
        <span>
          تم تطوير هذه اللعبة بواسطة
          {"     "}
          <Tooltip id="developer-tooltip" content="موقع المطور" />
          <a
            href={process.env.NEXT_PUBLIC_DEVELOPER_LINK}
            data-tooltip-id="developer-tooltip"
          >
            عبدالله شعبان
          </a>
        </span>
      </div>

      <ThemeToggle />
    </footer>
  );
};

export default Footer;
