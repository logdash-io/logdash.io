export function identifySiteVisitor(userId: string): void {
  if (window.logdash) {
    window.logdash.identify(userId);
    return;
  }

  document
    .querySelector('script[src="/_ld/script.js"]')
    ?.addEventListener('load', () => window.logdash?.identify(userId), {
      once: true,
    });
}
