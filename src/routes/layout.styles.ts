import * as stylex from "@stylexjs/stylex";
import { motion } from "../lib/styles/motion.stylex";
import { tokens } from "../lib/styles/tokens.stylex";

export const styles = stylex.create({
  shell: {
    display: "flex",
    minHeight: "100vh",
    flexDirection: "column",
    backgroundColor: tokens.bg,
    backgroundImage: tokens.appBgImage,
    color: tokens.text,
    fontFamily:
      '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  },
  iconLink: {
    borderWidth: 0,
    ":focus": {
      outlineStyle: "none",
    },
  },
  cursorPointer: {
    cursor: "pointer",
  },
  icon: {
    width: "1.25rem",
    height: "1.25rem",
    fill: "currentColor",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderColor: tokens.border,
    backgroundColor: `color-mix(in srgb, ${tokens.bg} 85%, transparent)`,
    paddingBlock: "0.75rem",
    backdropFilter: "blur(12px)",
  },
  nav: {
    marginInline: "auto",
    display: "flex",
    minHeight: "2.75rem",
    maxWidth: "80rem",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    paddingInline: "1rem",
    "@media (min-width: 48rem)": {
      paddingInline: "1.5rem",
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    fontSize: "1.25rem",
    lineHeight: "calc(1.75 / 1.25)",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    textDecorationLine: "none",
    color: tokens.text,
    "@media (min-width: 48rem)": {
      fontSize: "1.5rem",
      lineHeight: "calc(2 / 1.5)",
    },
  },
  pokeball: {
    width: "1.75rem",
    height: "1.75rem",
  },
  desktopSearch: {
    display: {
      default: "none",
      "@media (min-width: 64rem)": "flex",
    },
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    justifyContent: "center",
    paddingInline: "0.5rem",
    opacity: 1,
    translate: "0 0",
    transitionProperty: "opacity, translate",
    transitionDuration: "350ms",
    transitionTimingFunction: "ease",
    "@media (prefers-reduced-motion: reduce)": {
      transitionProperty: "none",
    },
  },
  searchClosed: {
    opacity: 0,
    translate: "-32px 0",
  },
  searchWrap: {
    width: "100%",
    maxWidth: "28rem",
  },
  navLinks: {
    display: {
      default: "none",
      "@media (min-width: 64rem)": "flex",
    },
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.25rem",
  },
  mobileIcons: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    "@media (min-width: 64rem)": {
      display: "none",
    },
  },
  mobileSearch: {
    display: {
      default: "block",
      "@media (min-width: 64rem)": "none",
    },
    height: "var(--search-h)",
    willChange: "opacity",
    transitionProperty: "opacity",
    transitionDuration: "1000ms",
    transitionTimingFunction: "ease",
    "@media (prefers-reduced-motion: reduce)": {
      transitionProperty: "none",
    },
  },
  mobileSearchClosed: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
  searchRow: {
    paddingInline: "1rem",
    paddingTop: "0.5rem",
    "@media (min-width: 48rem)": {
      paddingInline: "1.5rem",
    },
  },
  mobileMenu: {
    marginTop: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    borderTopWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.bg,
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
    "@media (min-width: 64rem)": {
      display: "none",
    },
  },
  menuLabel: {
    paddingInline: "0.75rem",
    paddingTop: "0.5rem",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: tokens.muted,
  },
  menuLinkBlock: {
    display: "block",
  },
  menuLinkIndent: {
    paddingLeft: "1.5rem",
  },
  menuLinkMt: {
    marginTop: "0.5rem",
  },
  shortcuts: {
    paddingInline: "0.75rem",
    paddingTop: "0.5rem",
    fontSize: "10px",
    color: tokens.muted,
  },
  main: {
    position: "relative",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
  },
  toTop: {
    position: "fixed",
    right: "1.25rem",
    bottom: "1.25rem",
    zIndex: 40,
    display: "flex",
    height: "2.75rem",
    width: "2.75rem",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: `color-mix(in srgb, ${tokens.card} 90%, transparent)`,
    color: tokens.text,
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
    ":hover": {
      translate: "0 -0.125rem",
    },
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  footer: {
    marginInline: "auto",
    maxWidth: "80rem",
    paddingInline: "1.5rem",
    paddingBlock: "2rem",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.muted,
  },
});
