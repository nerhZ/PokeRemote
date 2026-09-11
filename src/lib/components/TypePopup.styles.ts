import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  title: {
    display: "block",
    marginBottom: "0.25rem",
    fontWeight: 600,
    textTransform: "capitalize",
    color: tokens.text,
  },
});
