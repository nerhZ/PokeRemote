import type { StyleXStyles } from "@stylexjs/stylex";

type SizeValue = string | number;

/** Sizing and spacing for a floating popup or a dropdown host. */
export type PopupSx = StyleXStyles<{
  width?: SizeValue;
  maxWidth?: SizeValue;
  height?: SizeValue;
  maxHeight?: SizeValue;
  marginTop?: SizeValue;
  marginBottom?: SizeValue;
}>;

/** Layout and appearance for a tooltip host wrapper, not the popup. */
export type HostSx = StyleXStyles<{
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  position?: string;
  top?: SizeValue;
  right?: SizeValue;
  bottom?: SizeValue;
  left?: SizeValue;
  height?: SizeValue;
  zIndex?: number;
  paddingBottom?: SizeValue;
  borderTopWidth?: SizeValue;
  borderBottomWidth?: SizeValue;
  borderStyle?: string;
  borderColor?: string;
  backgroundColor?: string;
}>;

/** Sizing and shape for a popover panel. */
export type PanelSx = StyleXStyles<{
  width?: SizeValue;
  maxWidth?: SizeValue;
  maxHeight?: SizeValue;
  minHeight?: SizeValue;
  borderRadius?: SizeValue;
  padding?: SizeValue;
  paddingInline?: SizeValue;
  paddingBlock?: SizeValue;
  top?: SizeValue;
  right?: SizeValue;
  bottom?: SizeValue;
  left?: SizeValue;
  marginTop?: SizeValue;
}>;

/** Margin and sizing overrides for a trigger button. */
export type ButtonSx = StyleXStyles<{
  width?: SizeValue;
  maxWidth?: SizeValue;
  marginTop?: SizeValue;
  marginBottom?: SizeValue;
}>;

/** Layout shell overrides for full-page wrappers. */
export type ShellSx = StyleXStyles<{
  width?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  marginInline?: SizeValue;
  marginBlock?: SizeValue;
  paddingInline?: SizeValue;
  paddingBlock?: SizeValue;
  paddingTop?: SizeValue;
  paddingBottom?: SizeValue;
}>;

/** Sizing and appearance for box-shaped components such as tiles,
    skeletons, images, and spinners. */
export type BoxSx = StyleXStyles<{
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  minHeight?: SizeValue;
  maxWidth?: SizeValue;
  maxHeight?: SizeValue;
  marginTop?: SizeValue;
  marginBottom?: SizeValue;
  marginLeft?: SizeValue;
  marginRight?: SizeValue;
  flexShrink?: number;
  borderRadius?: SizeValue;
  backgroundColor?: string;
}>;

/** Frame, fit, and motion for Pokémon artwork. */
export type ImageSx = StyleXStyles<{
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  minHeight?: SizeValue;
  maxWidth?: SizeValue;
  maxHeight?: SizeValue;
  flexShrink?: number;
  marginInline?: SizeValue;
  marginBlock?: SizeValue;
  marginTop?: SizeValue;
  marginBottom?: SizeValue;
  objectFit?: string;
  objectPosition?: string;
  aspectRatio?: string;
  position?: string;
  top?: SizeValue;
  right?: SizeValue;
  bottom?: SizeValue;
  left?: SizeValue;
  zIndex?: number;
  opacity?: number;
  filter?: string;
  mixBlendMode?: string;
  borderRadius?: SizeValue;
  translate?: string;
  scale?: number | string;
  rotate?: string;
  transformOrigin?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
  animationName?: string;
  animationDuration?: string;
  animationTimingFunction?: string;
  animationIterationCount?: string;
}>;
