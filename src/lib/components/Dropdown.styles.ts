import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";
import { motion } from "../styles/motion.stylex";

export const styles = stylex.create({
  host: {
    position: "relative",
  },
  button: {
    width: "100%",
    cursor: "pointer",
    borderRadius: "0.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx70,
    outlineStyle: "none",
    ":hover": {
      borderColor: tokens.bd20,
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
  panel: {
    position: "absolute",
    zIndex: 20,
    marginTop: "0.25rem",
    maxHeight: "15rem",
    width: "100%",
    overflowY: "auto",
    borderRadius: motion.radiusControl,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    backgroundColor: tokens.card,
    padding: "0.25rem",
    boxShadow: tokens.shadow3,
  },
  search: {
    width: "100%",
    marginBottom: "0.25rem",
    borderRadius: "0.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx70,
    outlineStyle: "none",
    "::placeholder": {
      color: tokens.ph30,
    },
    ":focus": {
      borderColor: `color-mix(in srgb, ${tokens.accent} 50%, transparent)`,
    },
  },
  clear: {
    width: "100%",
    cursor: "pointer",
    borderRadius: "0.5rem",
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx40,
    ":hover": {
      backgroundColor: tokens.surf5,
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
  option: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    gap: "0.125rem",
    borderRadius: "0.5rem",
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx70,
    ":hover": {
      backgroundColor: tokens.surf5,
    },
  },
  optionHighlighted: {
    backgroundColor: tokens.surf5,
  },
  optionSelected: {
    backgroundColor: tokens.surf10,
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  optionLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  optionMeta: {
    marginLeft: "auto",
    flexShrink: 0,
    fontSize: "10px",
    color: tokens.tx30,
  },
  optionHint: {
    fontSize: "10px",
    lineHeight: "1.25",
    color: tokens.tx30,
  },
});
