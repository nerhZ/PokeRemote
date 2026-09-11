import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  shell: {
    maxWidth: "48rem",
  },
  statTabs: {
    marginBottom: "1.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  statTab: {
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 700,
    letterSpacing: "0.025em",
    textTransform: "uppercase",
  },
  statTabActive: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
    color: tokens.onAccent,
  },
  statTabIdle: {
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    color: tokens.tx50,
    ":hover": {
      borderColor: tokens.bd25,
    },
  },
  skeletonTall: {
    height: "4rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderRadius: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd6,
    backgroundColor: tokens.surf3,
    padding: "0.875rem",
    textDecorationLine: "none",
    transitionProperty: "all",
    transitionDuration: "150ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    ":hover": {
      borderColor: tokens.bd20,
      backgroundColor: tokens.surf5,
    },
  },
  medal: {
    width: "2rem",
    textAlign: "center",
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    fontWeight: 900,
  },
  medalGold: {
    color: "#ffcb05",
  },
  medalSilver: {
    color: "#c0c0c0",
  },
  medalBronze: {
    color: "#cd7f32",
  },
  medalMuted: {
    color: tokens.muted,
  },
  itemImage: {
    height: "3rem",
    width: "3rem",
    objectFit: "contain",
    transitionProperty: "transform, translate, scale, rotate",
    transitionDuration: "150ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    [stylex.when.ancestor(":hover")]: {
      scale: 1.1,
    },
  },
  itemBody: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
  },
  itemName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 700,
    color: tokens.txStrong,
  },
  meta: {
    marginTop: "0.125rem",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  id: {
    fontSize: "10px",
    color: tokens.tx30,
  },
  valueCol: {
    textAlign: "right",
  },
  value: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    fontWeight: 900,
    color: tokens.txStrong,
  },
  bar: {
    marginTop: "0.25rem",
    marginInlineStart: "auto",
    height: "0.375rem",
    width: "5rem",
    overflow: "hidden",
    borderRadius: "9999px",
    backgroundColor: tokens.surf6,
  },
  barFill: {
    backgroundColor: tokens.accent,
    height: "100%",
    borderRadius: "9999px",
  },
});
