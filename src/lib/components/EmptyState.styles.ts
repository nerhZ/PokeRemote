import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: "1.5rem",
    paddingBlock: "5rem",
    textAlign: "center",
  },
  pokeball: {
    width: "6rem",
    height: "6rem",
    marginBottom: "1.5rem",
  },
  title: {
    marginBottom: "0.25rem",
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    fontWeight: 600,
    color: tokens.text,
  },
  subtitle: {
    maxWidth: "24rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: tokens.muted,
  },
  action: {
    marginTop: "1.5rem",
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 0,
    paddingInline: "1.25rem",
    paddingBlock: "0.625rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 600,
    color: tokens.onAccent,
    backgroundColor: tokens.accent,
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionDuration: "150ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    ":hover": {
      backgroundColor: `color-mix(in srgb, ${tokens.accent} 80%, transparent)`,
    },
  },
});
