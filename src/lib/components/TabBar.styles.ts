import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    marginBottom: "1.25rem",
    display: "flex",
    gap: "0.25rem",
    overflowX: "auto",
    borderRadius: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd6,
    backgroundColor: tokens.surf3,
    padding: "0.25rem",
  },
  tab: {
    minWidth: "4.5rem",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 0,
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 700,
    letterSpacing: "0.025em",
    textTransform: "uppercase",
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  tabIdle: {
    backgroundColor: "transparent",
    color: tokens.muted,
  },
  tabActive: {
    color: "#fff",
  },
});
