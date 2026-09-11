import * as stylex from "@stylexjs/stylex";

/**
 * Dynamic style helpers. Pass these inside `stylex.attrs(...)` so the value
 * stays reactive. Svelte only tracks dependencies read inside the spread
 * expression, so a separate style attribute on the same element goes stale.
 *
 * The returned keys are kebab-case on purpose. The compiler names the
 * generated custom property after the key, but the `attrs` runtime kebab-cases
 * inline keys before serializing them. A camelCase key gives
 * `--x-backgroundColor` in the stylesheet and `--x-background-color` inline,
 * so the variable never resolves.
 */
export const dynamic = stylex.create({
  width: (value: string) => ({ width: value }),
  height: (value: string) => ({ height: value }),
  minHeight: (value: string) => ({ "min-height": value }),
  left: (value: string) => ({ left: value }),
  top: (value: string) => ({ top: value }),
  transform: (value: string) => ({ transform: value }),
  fontSize: (value: string) => ({ "font-size": value }),
  color: (value: string) => ({ color: value }),
  backgroundColor: (value: string) => ({ "background-color": value }),
  background: (value: string) => ({ background: value }),
  borderColor: (value: string) => ({ "border-color": value }),
  boxShadow: (value: string) => ({ "box-shadow": value }),
  filter: (value: string) => ({ filter: value }),
  animationDelay: (value: string) => ({ "animation-delay": value }),
  gridTemplateColumns: (value: string) => ({
    "grid-template-columns": value,
  }),
  searchH: (value: string) => ({ "--search-h": value }),
});
