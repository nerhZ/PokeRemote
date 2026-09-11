import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  badge: {
    borderRadius: "9999px",
    fontWeight: 700,
    letterSpacing: "0.025em",
    textTransform: "uppercase",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
});

export const sizes = stylex.create({
  xs: {
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "9px",
  },
  sm: {
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
    fontSize: "10px",
  },
  md: {
    paddingInline: "1rem",
    paddingBlock: "0.375rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
});

export type BadgeSize = keyof typeof sizes;
