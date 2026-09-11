import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  placeholder: {
    borderRadius: "0.5rem",
    backgroundColor: tokens.surf5,
  },
  img: {
    transitionProperty: "opacity",
    transitionDuration: "300ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  loaded: {
    opacity: 1,
  },
  loading: {
    opacity: 0,
  },
  pixelated: {
    imageRendering: "pixelated",
  },
});
