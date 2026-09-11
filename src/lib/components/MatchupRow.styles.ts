import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  row: {
    marginTop: "0.375rem",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  label: {
    flexShrink: 0,
    fontSize: "10px",
    fontWeight: 700,
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
});
