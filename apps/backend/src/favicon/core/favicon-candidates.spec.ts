import { findFaviconUrls, sniffImageType } from './favicon-candidates';

describe('findFaviconUrls', () => {
  it('prefers a sized icon over the apple touch icon and keeps favicon.ico as the last resort', () => {
    const html = `<head>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    </head>`;

    expect(findFaviconUrls(html, 'https://readsimon.com/')).toEqual([
      'https://readsimon.com/favicon-48x48.png',
      'https://readsimon.com/favicon-32x32.png',
      'https://readsimon.com/favicon-16x16.png',
      'https://readsimon.com/favicon.ico',
    ]);
  });

  it('prefers svg, ignores mask and fluid icons and resolves absolute and data urls', () => {
    const html = `
      <link rel="fluid-icon" href="https://github.com/fluidicon.png">
      <link rel="mask-icon" href="https://cdn.example/pinned.svg" color="#000000">
      <link rel="alternate icon" type="image/png" href="https://cdn.example/favicon.png">
      <link rel="icon" type="image/svg+xml" href="https://cdn.example/favicon.svg">
      <link rel=icon href='data:image/svg+xml,%3csvg%3e%3c/svg%3e'>`;

    expect(findFaviconUrls(html, 'https://example.com/')).toEqual([
      'https://cdn.example/favicon.svg',
      'data:image/svg+xml,%3csvg%3e%3c/svg%3e',
      'https://cdn.example/favicon.png',
      'https://example.com/favicon.ico',
    ]);
  });

  it('prefers the dark scheme variant and ignores links after the head', () => {
    const html = `<head>
      <link rel="icon" href="/light.svg" media="(prefers-color-scheme: light)">
      <link rel="icon" href="/dark.svg" media="(prefers-color-scheme: dark)">
    </head><body><link rel="icon" href="/body.png"></body>`;

    expect(findFaviconUrls(html, 'https://example.com/en/')).toEqual([
      'https://example.com/dark.svg',
      'https://example.com/light.svg',
      'https://example.com/favicon.ico',
    ]);
  });
});

describe('sniffImageType', () => {
  it('recognises image formats by their bytes, not by what the server claims', () => {
    expect(sniffImageType(Buffer.from('89504e470d0a1a0a0000', 'hex'))).toBe('image/png');
    expect(sniffImageType(Buffer.from('0000010001001010', 'hex'))).toBe('image/x-icon');
    expect(sniffImageType(Buffer.from('<?xml version="1.0"?>\n<svg xmlns="x"></svg>'))).toBe(
      'image/svg+xml',
    );
    expect(sniffImageType(Buffer.from('<!doctype html><html><svg></svg></html>'))).toBeNull();
    expect(sniffImageType(Buffer.from('Not found'))).toBeNull();
  });
});
