import { animatedSpriteUrl, spriteUrl } from "$lib/pokemon-types";
import { getSpritesEnabled, setSpritesEnabled } from "$lib/storage";

/** Global thumbnail mode: show animated (or classic) pixel sprites instead of artwork. */
class SpriteMode {
  active = $state(getSpritesEnabled());

  toggle() {
    this.active = !this.active;
    setSpritesEnabled(this.active);
  }

  /** Primary + fallback sources for a pokemon thumbnail, honoring this mode. */
  thumbnail(id: number, artwork: string): { src: string; fallback: string[] } {
    return this.active
      ? { src: animatedSpriteUrl(id), fallback: [spriteUrl(id), artwork] }
      : { src: artwork, fallback: [] };
  }
}

export const spriteMode = new SpriteMode();
