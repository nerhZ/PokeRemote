import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

const cardEnterKeyframes = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(16px) scale(0.97)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" },
});

export const shared = stylex.create({
  toolShell: {
    marginInline: "auto",
    maxWidth: "72rem",
    paddingBlock: "2rem",
    paddingInline: "1.5rem",
  },
  toolHero: {
    marginBottom: "2rem",
  },
  toolHeroTitle: {
    marginBottom: "0.5rem",
    fontWeight: 900,
    color: tokens.text,
    fontSize: {
      default: "1.875rem",
      "@media (min-width: 48rem)": "2.25rem",
    },
    lineHeight: {
      default: "2.25rem",
      "@media (min-width: 48rem)": "2.5rem",
    },
  },
  toolHeroText: {
    color: tokens.muted,
    fontSize: {
      default: "0.875rem",
      "@media (min-width: 48rem)": "1rem",
    },
    lineHeight: {
      default: "1.25rem",
      "@media (min-width: 48rem)": "1.5rem",
    },
  },
  panel: {
    borderRadius: "1.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    boxShadow: tokens.shadow,
    color: tokens.text,
    padding: {
      default: "1.5rem",
      "@media (min-width: 48rem)": "2rem",
    },
  },
  navLink: {
    borderRadius: "0.5rem",
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    fontSize: "0.75rem",
    lineHeight: "1rem",
    fontWeight: 600,
    textDecorationLine: "none",
    transitionProperty: "all",
    transitionDuration: "150ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    color: tokens.muted,
    ":hover": {
      backgroundColor: tokens.surface2,
      color: tokens.accent,
      textShadow: `0 0 10px color-mix(in srgb, ${tokens.accent} 60%, transparent)`,
    },
  },
  navLinkActive: {
    color: tokens.accent,
    textShadow: `0 0 10px color-mix(in srgb, ${tokens.accent} 60%, transparent)`,
    ":hover": {
      backgroundColor: "transparent",
    },
  },
  pokeCard: {
    position: "relative",
    display: "block",
    borderRadius: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    textDecorationLine: "none",
    transitionProperty: "all",
    transitionDuration: "300ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    color: tokens.text,
    boxShadow: tokens.shadow,
    ":hover": {
      top: "-0.375rem",
      borderColor: `color-mix(in srgb, ${tokens.accent} 35%, ${tokens.border})`,
    },
  },
  typeEdge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: "0.25rem",
    opacity: 0.8,
  },
  uiInput: {
    backgroundColor: tokens.inputBg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    color: tokens.text,
    borderRadius: "0.75rem",
    ":focus": {
      outlineStyle: "none",
      borderColor: `color-mix(in srgb, ${tokens.accent} 55%, ${tokens.border})`,
    },
  },
  typeBadgeText: {
    textShadow: `0 0 2px ${tokens.badgeOutline}, 0 0 4px ${tokens.badgeOutline}`,
  },
  kbd: {
    backgroundColor: tokens.kbdBg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
    borderRadius: "0.35rem",
    paddingInline: "0.35rem",
    paddingBlock: "0.1rem",
    fontSize: "0.75em",
  },
  cardEnter: {
    animationName: cardEnterKeyframes,
    animationDuration: "0.5s",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    animationFillMode: "backwards",
    "@media (prefers-reduced-motion: reduce)": {
      animationName: null,
    },
  },
});
