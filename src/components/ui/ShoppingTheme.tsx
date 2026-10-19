"use client";

import { useState, type ReactNode } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager, ThemeProvider } from "styled-components";
import original from "react95/dist/themes/original";
import { shouldForwardShoppingProp } from "./ShoppingControls";

const theme = {
  ...original,
  name: "guaurritas",
  material: "#f2f2f2",
  materialText: "#263650",
  borderDark: "#637aa6",
  borderDarkest: "#425b8c",
  borderLight: "#e3e8f0",
  borderLightest: "#ffffff",
  headerBackground: "#425b8c",
  headerText: "#ffffff",
  hoverBackground: "#a66d88",
  focusSecondary: "#a66d88",
};

export default function ShoppingTheme({ children }: { children: ReactNode }) {
  const [sheet] = useState(() => new ServerStyleSheet());
  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });
  const content = <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  return <StyleSheetManager
    sheet={typeof window === "undefined" ? sheet.instance : undefined}
    shouldForwardProp={shouldForwardShoppingProp}
  >{content}</StyleSheetManager>;
}
