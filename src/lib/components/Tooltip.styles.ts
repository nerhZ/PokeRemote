import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  host: {
    position: "relative",
    display: "inline-block",
    cursor: "default",
  },
  popup: {
    pointerEvents: "none",
    position: "fixed",
    zIndex: 9999,
    width: "16rem",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    padding: "0.75rem",
    textAlign: "left",
    fontSize: "11px",
    lineHeight: "1.625",
    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    backgroundColor: tokens.card,
    borderColor: tokens.border,
    color: tokens.mutedStrong,
  },
  nowrap: {
    whiteSpace: "nowrap",
  },
  normal: {
    whiteSpace: "normal",
  },
});
