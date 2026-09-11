import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  panel: {
    width: "22rem",
    maxHeight: "12rem",
    borderRadius: "0.5rem",
    padding: "0.5rem",
  },
  trigger: {
    cursor: "pointer",
    alignSelf: "flex-start",
    borderRadius: "9999px",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
    fontWeight: 700,
    color: tokens.tx60,
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
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
  message: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx40,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "0.75rem",
    rowGap: "0.125rem",
  },
  item: {
    display: "flex",
    minWidth: 0,
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "0.375rem",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: tokens.muted,
    textDecorationLine: "none",
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
    ":hover": {
      backgroundColor: tokens.surf5,
    },
  },
  sprite: {
    width: "1.25rem",
    height: "1.25rem",
    flexShrink: 0,
    objectFit: "contain",
  },
  name: {
    minWidth: 0,
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  id: {
    flexShrink: 0,
    fontSize: "10px",
    color: tokens.tx30,
  },
});
