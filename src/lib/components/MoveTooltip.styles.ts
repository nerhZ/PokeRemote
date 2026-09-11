import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  moveTooltip: {
    width: "max-content",
  },
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "9999px",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd6,
    backgroundColor: tokens.surf3,
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "11px",
  },
  title: {
    display: "block",
    marginBottom: "0.25rem",
    fontWeight: 600,
    color: tokens.text,
  },
  line: {
    display: "block",
  },
  effect: {
    display: "block",
    marginTop: "0.25rem",
  },
});
