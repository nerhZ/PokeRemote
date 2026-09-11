import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  host: {
    position: "relative",
  },
  trigger: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.25rem",
    borderWidth: 0,
  },
  caret: {
    fontSize: "9px",
    opacity: 0.7,
  },
  menu: {
    position: "absolute",
    top: "100%",
    zIndex: 50,
    marginTop: "0.25rem",
    minWidth: "11rem",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    backgroundColor: tokens.card,
    padding: "0.25rem",
    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  },
  menuLeft: {
    left: 0,
  },
  menuRight: {
    right: 0,
  },
  menuItem: {
    display: "block",
  },
});
