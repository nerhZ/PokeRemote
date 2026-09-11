import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    paddingInline: "1rem",
    paddingBlock: "0.625rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    transitionProperty: "all",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
    outlineStyle: "none",
    "::placeholder": {
      color: tokens.muted,
    },
    ":focus": {
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
    ":disabled": {
      opacity: 0.4,
    },
  },
  listbox: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 30,
    marginTop: "0.25rem",
    maxHeight: "18rem",
    width: "100%",
    overflowY: "auto",
    borderRadius: motion.radiusControl,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    backgroundColor: tokens.card,
    paddingBlock: "0.25rem",
    boxShadow: tokens.shadow3,
  },
  option: {
    display: "flex",
    width: "100%",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.75rem",
    borderWidth: 0,
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    backgroundColor: "transparent",
    color: tokens.mutedStrong,
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
  },
  optionActive: {
    backgroundColor: tokens.surface2,
    color: tokens.text,
  },
  resultImage: {
    width: "2.25rem",
    height: "2.25rem",
    flexShrink: 0,
    objectFit: "contain",
  },
  resultName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 500,
  },
  resultId: {
    marginLeft: "auto",
    flexShrink: 0,
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.muted,
  },
});
