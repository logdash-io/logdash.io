(function () {
  'use strict';

  const script = document.currentScript;
  const siteId = script && script.getAttribute('data-site');
  if (!siteId || !/^[a-f0-9]{24}$/.test(siteId) || window.logdash) return;
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
  const visitorCookie = 'ldv_' + siteId;
  const sessionCookie = 'lds_' + siteId;
  const uuidPattern =
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  let cookieDomain;
  try {
    cookieDomain = findCookieDomain();
  } catch {
    return;
  }
  let active = true;
  // ponytail: Keep 100 pending events for at most four minutes; use persistent storage for offline analytics.
  let queue = [];
  let timer;
  let sending = false;
  let lastPath;

  window.logdash = { track, stop };
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  const push = function () {
    originalPush.apply(this, arguments);
    pageview();
  };
  const replace = function () {
    originalReplace.apply(this, arguments);
    pageview();
  };
  history.pushState = push;
  history.replaceState = replace;
  window.addEventListener('popstate', pageview);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onError);
  pageview();

  function track(name) {
    if (!active || !/^[a-z][a-z0-9_]{0,63}$/.test(name)) return;
    try {
      const now = Date.now();
      const session =
        readSession(now) || (name !== 'pageleave' && newSession(now));
      if (!session) return;
      let visitor = readCookie(visitorCookie).split('.');
      if (
        !uuidPattern.test(visitor[0]) ||
        !Number.isFinite(Number(visitor[1])) ||
        Number(visitor[1]) > now ||
        Number(visitor[1]) < Date.UTC(2020, 0, 1) ||
        now - Number(visitor[1]) >= 365 * 86400000
      ) {
        visitor = [crypto.randomUUID(), String(now)];
      }
      writeCookie(
        visitorCookie,
        visitor.join('.'),
        Math.max(
          1,
          Math.floor((Number(visitor[1]) + 365 * 86400000 - now) / 1000),
        ),
      );
      if (readCookie(visitorCookie) !== visitor.join('.')) return;
      writeCookie(sessionCookie, JSON.stringify(session), 1800);
      queue.push({
        id: crypto.randomUUID(),
        visitorId: visitor[0],
        sessionId: session.id,
        visitorStartedAt: new Date(Number(visitor[1])).toISOString(),
        timestamp: new Date(now).toISOString(),
        name,
        path: location.pathname.slice(0, 1024),
        referrer: session.referrer,
        utmSource: session.source,
        utmMedium: session.medium,
        utmCampaign: session.campaign,
        utmTerm: session.term,
        clickId: session.clickId,
        timezone,
      });
      queue = queue.slice(-100);
      schedule(1000);
    } catch {
      stop();
    }
  }

  function pageview() {
    if (!active || lastPath === location.pathname) return;
    lastPath = location.pathname;
    track('pageview');
  }

  function readSession(now) {
    try {
      const session = JSON.parse(readCookie(sessionCookie));
      return uuidPattern.test(session.id) &&
        Number.isFinite(session.startedAt) &&
        session.startedAt <= now &&
        now - session.startedAt < 86400000 &&
        ['source', 'medium', 'campaign', 'term', 'referrer', 'clickId'].every(
          (key) =>
            typeof session[key] === 'string' && session[key].length <= 255,
        )
        ? session
        : null;
    } catch {
      return null;
    }
  }

  function newSession(now) {
    const query = new URLSearchParams(location.search);
    // ponytail: Values are cut to 300 encoded bytes so the session cookie stays under 4 KB; long non-ASCII campaigns lose their tail.
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
      id: crypto.randomUUID(),
      startedAt: now,
      source: campaign('utm_source'),
      medium: campaign('utm_medium'),
      campaign: campaign('utm_campaign'),
      term: campaign('utm_term'),
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
      referrer,
    };
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
    const events = queue.splice(0, 20);
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

  function readCookie(name) {
    const item = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(name + '='));
    return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
  }

  function writeCookie(name, value, age) {
    document.cookie =
      name +
      '=' +
      encodeURIComponent(value) +
      '; Path=/; SameSite=Lax; Max-Age=' +
      age +
      (cookieDomain ? '; Domain=' + cookieDomain : '') +
      (location.protocol === 'https:' ? '; Secure' : '');
  }

  function findCookieDomain() {
    const host = location.hostname;
    if (!host.includes('.') || /^[\d.]+$|:/.test(host)) return '';
    const probe = 'ldp_' + Math.random().toString(36).slice(2);
    const labels = host.split('.');
    for (let index = labels.length - 2; index >= 0; index--) {
      const domain = labels.slice(index).join('.');
      document.cookie = probe + '=1; Path=/; Max-Age=10; Domain=' + domain;
      if (readCookie(probe) === '1') {
        document.cookie = probe + '=; Path=/; Max-Age=0; Domain=' + domain;
        return domain;
      }
    }
    return '';
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

  function stop() {
    active = false;
    queue = [];
    clearTimeout(timer);
    writeCookie(visitorCookie, '', 0);
    writeCookie(sessionCookie, '', 0);
    if (history.pushState === push) history.pushState = originalPush;
    if (history.replaceState === replace)
      history.replaceState = originalReplace;
    window.removeEventListener('popstate', pageview);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onError);
  }
})();
