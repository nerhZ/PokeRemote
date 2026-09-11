import * as stylex from "@stylexjs/stylex";
import { motion } from "../../lib/styles/motion.stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  shell: {
    maxWidth: "64rem",
  },
  loadingWrap: {
    display: "flex",
    justifyContent: "center",
    paddingBlock: "6rem",
  },
  panel: {
    textAlign: "center",
  },
  controls: {
    marginBottom: "1.25rem",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  dropdownWrap: {
    width: "13rem",
    textAlign: "left",
  },
  streak: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
  },
  streakValue: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
    color: tokens.text,
  },
  best: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: tokens.tx40,
  },
  silhouetteWrap: {
    display: "flex",
    justifyContent: "center",
  },
  silhouetteBox: {
    display: "flex",
    aspectRatio: "1 / 1",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: "1.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
  },
  silhouette: {
    height: "100%",
    width: "100%",
    objectFit: "contain",
  },
  answer: {
    marginTop: "1.5rem",
    fontSize: "2.25rem",
    lineHeight: "calc(2.5 / 2.25)",
    fontWeight: 900,
    color: tokens.text,
    "@media (min-width: 48rem)": {
      fontSize: "3rem",
      lineHeight: "1",
    },
  },
  nextWrap: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
  },
  nextButton: {
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 0,
    backgroundColor: tokens.accent,
    paddingInline: "1.5rem",
    paddingBlock: "0.625rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 600,
    color: tokens.onAccent,
    ":hover": {
      backgroundColor: `color-mix(in srgb, ${tokens.accent} 80%, transparent)`,
    },
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  prompt: {
    marginTop: "1.5rem",
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
    color: tokens.muted,
  },
  searchWrap: {
    marginInline: "auto",
    marginTop: "0.75rem",
    maxWidth: "32rem",
  },
  hint: {
    marginTop: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.pokemonRed,
  },
  hintRow: {
    marginTop: "1rem",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  hintButton: {
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 600,
    color: tokens.tx60,
    ":hover": {
      color: tokens.txStrong,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  typeHintRow: {
    marginTop: "0.75rem",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx60,
  },
  skipButton: {
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    marginTop: "1rem",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 600,
    color: tokens.tx60,
    ":hover": {
      color: tokens.txStrong,
    },
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  lifetime: {
    marginTop: "1rem",
    fontSize: "10px",
    color: tokens.tx30,
  },
});
