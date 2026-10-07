(function () {
  'use strict';

  const script = document.currentScript;
  const siteId = script && script.getAttribute('data-site');
  if (!siteId || !/^[a-f0-9]{24}$/.test(siteId) || window.logdash) return;
  try {
    expireLegacyCookies();
  } catch {
    return;
  }
  if (
    navigator.webdriver ||
    navigator.globalPrivacyControl ||
    navigator.doNotTrack === '1'
  )
    return;

  const endpoint = script.getAttribute('data-endpoint') || '/_ld/events';
  const contentType =
    new URL(endpoint, location.href).origin === location.origin
      ? 'application/json'
      : 'text/plain';
  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    timezone = '';
  }
  const attribution = readAttribution();
  const optOutKey = 'logdash:opt-out';
  let active = false;
  // ponytail: Keep 100 pending events for at most four minutes; use persistent storage for offline analytics.
  let queue = [];
  let timer;
  let sending = false;
  let lastPath;
  let userId;
  let identifyCalls = 0;
  let warnedProps = false;
  let restoreHistory = [];
  const listeners = [
    [window, 'popstate', pageview],
    [window, 'pageshow', onPageShow],
    [window, 'pagehide', onPageHide],
    [document, 'visibilitychange', onVisibilityChange],
    [window, 'error', onError],
    [window, 'unhandledrejection', onError],
  ];

  window.logdash = { track, identify, optOut, optIn, stop: optOut };
  if (!optedOut()) start();

  function track(name, props) {
    if (active && optedOut()) halt();
    if (!active || !/^[a-z][a-z0-9_]{0,63}$/.test(name)) return;
    try {
      queue.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        name,
        path: location.pathname.slice(0, 1024),
        ...attribution,
        timezone,
        userId,
        props: cleanProps(name, props),
      });
      queue = queue.slice(-100);
      schedule(1000);
    } catch {
      halt();
    }
  }

  function cleanProps(name, input) {
    if (input === undefined || input === null) return;
    const props = {};
    let dropped =
      ['pageview', 'pageleave', 'browser_error'].includes(name) ||
      typeof input !== 'object' ||
      Array.isArray(input);
    try {
      for (const [key, raw] of dropped ? [] : Object.entries(input)) {
        if (raw === null || raw === undefined) continue;
        const scalar =
          typeof raw === 'string' ||
          typeof raw === 'boolean' ||
          (typeof raw === 'number' && isFinite(raw));
        const text = scalar ? String(raw) : '';
        if (
          !scalar ||
          !/^[a-z][a-z0-9_]{0,39}$/.test(key) ||
          /[@\p{Cc}]/u.test(text) ||
          Object.keys(props).length === 10
        ) {
          dropped = true;
          continue;
        }
        const value = Array.from(text.trim()).slice(0, 100).join('');
        if (value) props[key] = value;
      }
    } catch {
      dropped = true;
    }
    if (dropped && !warnedProps) {
      warnedProps = true;
      console.warn(
        'logdash.track() props take up to 10 keys matching [a-z][a-z0-9_]{0,39} with string, number or boolean values, never emails or control characters, on custom events only. Invalid props were dropped and the event was sent.',
      );
    }
    return Object.keys(props).length ? props : undefined;
  }

  async function identify(id) {
    const value = id === null || id === undefined ? '' : id;
    const text = String(value);
    if (
      !['string', 'number'].includes(typeof value) ||
      text.includes('@') ||
      text.length > 256
    ) {
      console.warn(
        'logdash.identify() takes an opaque user ID (string or number, up to 256 characters), never an email. The call was ignored.',
      );
      return;
    }
    if (!crypto.subtle) return;
    const call = ++identifyCalls;
    userId = undefined;
    if (!text.trim()) return;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(siteId + ':' + text),
    );
    if (call !== identifyCalls) return;
    userId = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    for (const event of queue) event.userId = event.userId || userId;
  }

  function optOut() {
    halt();
    saveOptOut(true);
  }

  function optIn() {
    saveOptOut(false);
    start();
  }

  function start() {
    if (active) return;
    active = true;
    lastPath = undefined;
    restoreHistory = ['pushState', 'replaceState'].map(patchHistory);
    for (const [target, type, listener] of listeners)
      target.addEventListener(type, listener);
    pageview();
  }

  function halt() {
    active = false;
    queue = [];
    clearTimeout(timer);
    timer = undefined;
    for (const restore of restoreHistory) restore();
    for (const [target, type, listener] of listeners)
      target.removeEventListener(type, listener);
  }

  function patchHistory(method) {
    const original = history[method];
    const patched = function () {
      original.apply(this, arguments);
      pageview();
    };
    history[method] = patched;
    return () => {
      if (history[method] === patched) history[method] = original;
    };
  }

  function pageview() {
    if (!active || lastPath === location.pathname) return;
    lastPath = location.pathname;
    track('pageview');
  }

  function schedule(delay) {
    if (timer || !active) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush(false);
    }, delay);
  }

  async function flush(leaving) {
    if (!active || (!leaving && sending) || !queue.length) return;
    queue = queue.filter(
      (event) => Date.now() - Date.parse(event.timestamp) < 4 * 60000,
    );
    const encoder = new TextEncoder();
    let count = 0;
    let bytes = 100;
    while (count < Math.min(queue.length, 20)) {
      bytes += encoder.encode(JSON.stringify(queue[count])).length + 1;
      if (count && bytes > 32768) break;
      count++;
    }
    const events = queue.splice(0, count);
    if (!events.length) return;
    const body = JSON.stringify({
      siteId,
      sentAt: new Date().toISOString(),
      events,
    });
    if (
      leaving &&
      navigator.sendBeacon &&
      navigator.sendBeacon(endpoint, new Blob([body], { type: contentType }))
    ) {
      if (queue.length) void flush(true);
      return;
    }
    if (sending) {
      queue = events.concat(queue);
      return;
    }
    sending = true;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
        keepalive: true,
        credentials: 'omit',
      });
      if (active && response.status >= 500)
        queue = events.concat(queue).slice(0, 100);
    } catch {
      if (active) queue = events.concat(queue).slice(0, 100);
    } finally {
      sending = false;
      if (queue.length) schedule(5000);
    }
  }

  function readAttribution() {
    const query = new URLSearchParams(location.search);
    // ponytail: Values are cut to 300 encoded bytes to keep 20-event batches small; long non-ASCII campaigns lose their tail.
    const campaign = (key) => {
      const value = (query.get(key) || '').trim();
      if (/[@\p{Cc}]/u.test(value)) return '';
      const chars = Array.from(value).slice(0, 100);
      while (encodeURIComponent(chars.join('')).length > 300) chars.pop();
      return chars.join('');
    };
    let referrer = '';
    try {
      const host = new URL(document.referrer).hostname;
      if (host !== location.hostname) referrer = host;
    } catch {
      referrer = '';
    }
    return {
      referrer,
      utmSource: campaign('utm_source'),
      utmMedium: campaign('utm_medium'),
      utmCampaign: campaign('utm_campaign'),
      utmTerm: campaign('utm_term'),
      clickId:
        [
          'gclid',
          'gbraid',
          'wbraid',
          'gad_source',
          'dclid',
          'msclkid',
          'fbclid',
          'ttclid',
          'twclid',
          'li_fat_id',
        ].find((key) => query.get(key)) || '',
    };
  }

  function expireLegacyCookies() {
    const labels = location.hostname.split('.');
    const domains = labels.map(
      (_, index) => '; Domain=' + labels.slice(index).join('.'),
    );
    for (const name of ['ldv_', 'lds_'])
      for (const domain of domains.concat(''))
        document.cookie = name + siteId + '=; Path=/; Max-Age=0' + domain;
  }

  function optedOut() {
    try {
      return localStorage.getItem(optOutKey) === '1';
    } catch {
      return false;
    }
  }

  function saveOptOut(value) {
    try {
      if (value) localStorage.setItem(optOutKey, '1');
      else localStorage.removeItem(optOutKey);
    } catch {
      return;
    }
  }

  function onPageHide() {
    track('pageleave');
    void flush(true);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') void flush(true);
  }

  function onPageShow(event) {
    if (event.persisted) {
      lastPath = undefined;
      pageview();
    }
  }

  function onError() {
    track('browser_error');
  }
})();
