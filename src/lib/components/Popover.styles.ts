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
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
});
