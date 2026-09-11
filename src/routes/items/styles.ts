import * as stylex from "@stylexjs/stylex";
import { motion } from "../../lib/styles/motion.stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  searchWrap: {
    marginBottom: "1.5rem",
    maxWidth: "28rem",
  },
  loadingWrap: {
    display: "flex",
    justifyContent: "center",
    paddingBlock: "4rem",
  },
  pokeball: {
    height: "4rem",
    width: "4rem",
  },
  grid: {
    marginBottom: "2rem",
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: "0.75rem",
    "@media (min-width: 40rem)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (min-width: 64rem)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
  },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "1rem",
    "@media (min-width: 48rem)": {
      padding: "1rem",
    },
  },
  sprite: {
    height: "2.5rem",
    width: "2.5rem",
    flexShrink: 0,
    objectFit: "contain",
    imageRendering: "pixelated",
  },
  spritePlaceholder: {
    height: "2.5rem",
    width: "2.5rem",
    flexShrink: 0,
    borderRadius: "0.5rem",
    backgroundColor: tokens.surf5,
  },
  body: {
    minWidth: 0,
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 700,
  },
  meta: {
    marginTop: "0.125rem",
    fontSize: "10px",
    color: tokens.tx40,
    textTransform: "capitalize",
  },
  effect: {
    marginTop: "0.375rem",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden",
    fontSize: "0.75rem",
    lineHeight: 1.625,
    color: tokens.tx50,
  },
  skeletonTile: {
    height: "7rem",
  },
  retryWrap: {
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "center",
  },
  retryButton: {
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
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
});
