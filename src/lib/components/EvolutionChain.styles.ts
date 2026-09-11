import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  link: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.375rem",
    textDecorationLine: "none",
  },
  thumb: {
    height: "5rem",
    width: "5rem",
    borderRadius: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd6,
    backgroundColor: tokens.surf3,
    padding: "0.5rem",
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    translate: "0 0",
    [stylex.when.ancestor(":hover")]: {
      translate: "0 -0.25rem",
    },
  },
  image: {
    height: "100%",
    width: "100%",
    objectFit: "contain",
  },
  name: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 600,
  },
  nameIdle: {
    color: tokens.muted,
  },
  children: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "1rem",
  },
  childRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  condition: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingInline: "0.25rem",
  },
  arrow: {
    color: tokens.tx25,
  },
  conditionText: {
    maxWidth: "4.5rem",
    textAlign: "center",
    fontSize: "10px",
    lineHeight: 1.25,
    color: tokens.tx40,
  },
});
