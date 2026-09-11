import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  host: {
    position: "relative",
  },
  panel: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 30,
    marginTop: "0.25rem",
    overflowY: "auto",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    backgroundColor: tokens.card,
    boxShadow: tokens.shadow3,
  },
});
