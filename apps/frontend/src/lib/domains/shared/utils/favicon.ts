import { envConfig } from './env-config';

const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const SAMPLE_SIZE = 16;

export function faviconUrl(hostname: string): string | null {
  const host = hostname.trim().toLowerCase();

  return HOSTNAME.test(host)
    ? `${envConfig.apiBaseUrl.replace(/\/$/, '')}/favicons/${host}`
    : null;
}

/**
 * True for a dark glyph on a transparent background, like GitHub's octocat,
 * which disappears on the dark app unless it gets a light backdrop. The image
 * has to be loaded with `crossorigin="anonymous"`, otherwise the canvas is
 * tainted and this answers false.
 */
export function isDarkGlyph(image: EventTarget): boolean {
  if (!(image instanceof HTMLImageElement)) return false;

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  try {
    context?.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const pixels = context?.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
    let opaque = 0;
    let luminance = 0;

    for (let i = 0; pixels && i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) continue;

      opaque++;
      luminance +=
        (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) /
        255;
    }

    const transparent = SAMPLE_SIZE * SAMPLE_SIZE - opaque;

    return opaque > 0 && transparent > 0 && luminance / opaque < 0.25;
  } catch {
    return false;
  }
}
