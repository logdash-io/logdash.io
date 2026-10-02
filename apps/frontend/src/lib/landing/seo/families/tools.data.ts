import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family G. The intent is "use the tool now", so every page renders its widget
 * right under the answer line, then explains the result with the command or
 * formula behind it, and only then points a monitor at it.
 *
 * Pages are ordered so the three sibling links stay on topic: the site checks
 * lead into each other, the uptime targets run 99.9, 99.95, 99.99, 99.5.
 */
export const toolsFamily: SeoFamily = {
  key: 'tools',
  hubPath: '/tools',
  hubLabel: 'All free tools',
  title: 'Free uptime and monitoring tools | Logdash',
  description:
    'Check if a site is down, its HTTP status and response time, work out uptime, SLA and downtime cost, and generate cron expressions, status pages and badges.',
  intro:
    'One page per tool, each with the tool itself, the command or formula behind it and a monitor that keeps checking after you leave.',
};

export const toolsPages: SeoPage[] = [
  {
    slug: 'is-my-site-down',
    h1: 'Is my site down',
    answer:
      'Enter your URL and Logdash requests it from its own servers, outside your network, and shows the status code and response time within a few seconds, so you know whether the site is down for everyone or just for you.',
    meta: {
      title: 'Is my site down? Free website down checker | Logdash',
      description:
        'Check if your site is down for everyone or just you. Status code and response time from outside your network in seconds, no signup.',
    },
    tool: { kind: 'site-check' },
    blocks: [
      {
        type: 'paragraph',
        text: 'The check is one GET request to the address you typed, sent from Logdash and not from your browser. It follows up to 5 redirects and gives up after 10 seconds. Any final status from 200 to 399 counts as up. Anything else, or no answer at all, counts as down. The first result lands about a second after you press enter, and no account is needed to see it.',
      },
      { type: 'heading', text: 'Is my website down or just me' },
      {
        type: 'paragraph',
        text: 'If Logdash gets a 200 and your browser gets an error, the site is up and the problem sits between you and the server. The usual suspects, in the order worth checking: a stale DNS cache after a record change, a VPN or office firewall, your own IP blocked by a WAF or rate limit rule you set up months ago, and your ISP. If Logdash gets the same error you do, it is not just you, and every visitor is seeing it too.',
      },
      { type: 'heading', text: 'What the result means' },
      {
        type: 'list',
        items: [
          '200 to 399: up. The server answered with a page or a redirect that ended in one.',
          '401 or 403: the server is fine and something in front of it refused the request. Often a WAF, basic auth on a staging domain, or a bot rule.',
          '404: the server is up and the path is not. A deploy that dropped a route looks exactly like this.',
          '500: the app is running and crashing on this request. Your error logs have the stack trace.',
          '502, 503 or 504: the proxy is up and the app behind it is not, or it is too slow to answer.',
          'Not answering: the name does not resolve, the connection was refused, or nothing came back within 10 seconds.',
        ],
      },
      { type: 'heading', text: 'Check it from your terminal' },
      {
        type: 'code',
        language: 'bash',
        code: `host="yourapp.com"

# 1. Does the name resolve? Ask a public resolver, not your router.
dig +short "$host" @1.1.1.1

# 2. Does the site answer? Same rules as the Logdash check.
curl -sS -o /dev/null -L --max-redirs 5 -m 10 \\
  -w '%{http_code} in %{time_total}s\\n' "https://$host"`,
      },
      {
        type: 'paragraph',
        text: 'Empty output from dig means DNS, not the server. A 000 from curl means no HTTP answer at all, and curl prints the reason above it: could not resolve host, connection refused, or a timeout. Run the same two lines from your laptop and from a server somewhere else. Different answers mean the problem is the network path, not the site.',
      },
      { type: 'heading', text: 'Website down checker online vs a monitor' },
      {
        type: 'paragraph',
        text: 'A one-off checker answers for one moment. If the site was down from 03:12 to 03:20 and you check at 09:00, every checker on the internet says up, and you never learn about the eight minutes your users saw. That is why this one does not stop after the first request. It keeps checking every 5 minutes for 24 hours, and if you claim the dashboard with a free account it keeps going after that.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Down For Everyone Or Just Me',
        them: 'Down For Everyone Or Just Me',
        rows: [
          {
            feature: 'Check from outside your network',
            logdash: 'Yes, one GET from Logdash',
            them: 'Yes',
            winner: 'tie',
          },
          {
            feature: 'Reports from other people',
            logdash: 'None, it only checks',
            them: 'User reports and outage history for popular sites',
            winner: 'them',
          },
          {
            feature: 'Keeps checking after you leave',
            logdash: 'Every 5 minutes for 24 hours, longer once claimed',
            them: 'One check per visit',
            winner: 'logdash',
          },
          {
            feature: 'Tells you when it goes down',
            logdash: 'Telegram or webhook alert',
            them: 'No alerts',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Down For Everyone Or Just Me',
        reasons: [
          'The site is not yours. For Gmail, Discord or your bank, hundreds of user reports tell you more than one request from one server, and Logdash collects none.',
          'You want a yes or no and nothing else. No dashboard, no account, no follow-up checks.',
        ],
      },
      { type: 'heading', text: 'Hear about the next one first' },
      {
        type: 'steps',
        items: [
          {
            title: 'Claim the check',
            text: 'Sign in with a free account and the dashboard you just watched becomes yours. Five services on the free plan, one HTTP monitor each.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check stores the status code and response time.',
          },
          {
            title: 'Connect Telegram and test it',
            text: 'Add a Telegram channel, attach it to the monitor, then point the monitor at a path that returns 404. On the next check a Telegram alert arrives saying the site is down, with the status code and the start of the response body.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is my website down or just me?',
        answer:
          'Run the check above. It requests your URL from Logdash, outside your network. If it gets a 200 and you get an error, the site is up and the problem is your DNS cache, VPN, firewall or ISP. If it gets the same error, everyone sees it.',
      },
      {
        question: 'Is there a free website down checker online?',
        answer:
          'Yes, this one. No signup for the check. It shows the status code and response time, then keeps checking every 5 minutes for 24 hours. Claim it with a free account to keep monitoring and get Telegram alerts.',
      },
      {
        question: 'How does a website down checker work?',
        answer:
          'It sends an HTTP request to your URL from its own server and reads the answer. Logdash sends a GET, follows up to 5 redirects, waits up to 10 seconds, and calls any final status from 200 to 399 up.',
      },
      {
        question: 'Should I post "is my site down" on Reddit?',
        answer:
          'For your own small site, no. Nobody on Reddit can reach it any better than a checker can, and the answer arrives hours late. Reddit threads help for big services with many users. For your site, check it here and read the status code.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'http-status-checker',
    h1: 'HTTP status checker',
    answer:
      'Enter a URL and Logdash sends a GET request from its servers, follows up to 5 redirects and shows the final HTTP status code with the time the whole request took.',
    meta: {
      title: 'HTTP status checker, online and bulk | Logdash',
      description:
        'Check the HTTP status code of any URL online, or of a whole list with one bash loop. Final code after redirects, response time, and alerts on change.',
    },
    tool: { kind: 'site-check' },
    blocks: [
      {
        type: 'paragraph',
        text: 'The checker sends one GET, not a HEAD, because plenty of frameworks answer HEAD with a 404 or 405 while GET works fine, and a checker that uses HEAD reports outages that do not exist. Redirects are followed up to 5 hops and the code you see is the final one. If nothing answers within 10 seconds, or the name does not resolve, the result is 0: no HTTP status at all. That is what a missing DNS record or a stopped load balancer looks like.',
      },
      { type: 'heading', text: 'Check HTTP status of a URL' },
      {
        type: 'code',
        language: 'bash',
        code: `curl -s -o /dev/null -L --max-redirs 5 -m 10 \\
  -w '%{http_code} after %{num_redirects} redirects in %{time_total}s\\n' \\
  https://example.com`,
      },
      {
        type: 'paragraph',
        text: 'That is the same request the checker makes. Drop -L to see the first hop instead of the last, which is how you confirm a 301 is really a 301 and not a 302 that search engines treat differently. A 000 means curl got no HTTP answer at all.',
      },
      { type: 'heading', text: 'Bulk HTTP status checker' },
      {
        type: 'code',
        language: 'bash',
        title: 'check-urls.sh',
        code: `# urls.txt: one URL per line
while IFS= read -r url; do
  [ -z "$url" ] && continue
  result=$(curl -s -o /dev/null -L --max-redirs 5 -m 10 \\
    -w '%{http_code} %{num_redirects} %{time_total}' "$url")
  printf '%s %s\\n' "$result" "$url"
done < urls.txt`,
      },
      {
        type: 'paragraph',
        text: 'Each line prints the final code, the number of redirects, the seconds taken and the URL. Pipe it into sort to group by code, or into grep -v "^200" to see only the problems. The URL goes through printf rather than the curl format string, so a percent sign in a query string cannot break the output. A thousand URLs at a second each is about 17 minutes, which is fine for a one-off audit after a migration.',
      },
      { type: 'heading', text: 'Reading the codes' },
      {
        type: 'list',
        items: [
          '200: fine. A 200 on a page that should be gone is a soft 404, and search engines will keep it indexed.',
          '301 and 308 are permanent, 302 and 307 temporary. Only visible without -L.',
          '401 and 403: something refused the request. Often a WAF blocking non-browser clients, so check the same URL in a browser.',
          '404 and 410: missing. 410 tells crawlers it is gone on purpose.',
          '429: you are being rate limited. Slow the loop down.',
          '500: the app crashed on this request. 502, 503 and 504: the proxy could not get an answer from the app.',
          '000: no HTTP answer. DNS failure, refused connection or timeout.',
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs httpstatus.io',
        them: 'httpstatus.io',
        rows: [
          {
            feature: 'URLs per run',
            logdash: 'One per monitor',
            them: 'Up to 100 at once',
            winner: 'them',
          },
          {
            feature: 'Redirect chain',
            logdash: 'Follows 5 hops, shows the final code',
            them: 'Every hop of up to 10, with headers',
            winner: 'them',
          },
          {
            feature: 'Status code and timing',
            logdash: 'Final code and total time',
            them: 'Codes and round-trip time per hop',
            winner: 'tie',
          },
          {
            feature: 'Repeats on a schedule',
            logdash: 'Every 5 minutes free, 15 seconds on Pro',
            them: 'One-off checks',
            winner: 'logdash',
          },
          {
            feature: 'Alert when the code changes',
            logdash: 'Telegram or webhook',
            them: 'Not part of the checker',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'httpstatus.io',
        reasons: [
          'You are auditing a list of URLs after a migration and want 100 results in one table, exported to CSV or Google Sheets.',
          'You need every hop of a redirect chain with its headers. Logdash only keeps the final answer.',
        ],
      },
      {
        type: 'paragraph',
        text: 'For uptime, the final code is the one that matters. A clean 301 that lands on a 500 is an outage, and a checker that stops at the first hop calls it fine. A chain longer than 5 hops is a bug in itself, so Logdash counts it as down rather than following it forever.',
      },
      { type: 'heading', text: 'Get told when the code changes' },
      {
        type: 'steps',
        items: [
          {
            title: 'Keep the check',
            text: 'Claim the dashboard with a free account. The URL you checked becomes a monitor, and every check stores the status code and response time.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro.',
          },
          {
            title: 'Connect Telegram and break it',
            text: 'Add a Telegram channel to the monitor, then point it at a path that returns 404. On the next check a Telegram alert arrives naming the monitor as down, with the status code.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What does an HTTP status checker do?',
        answer:
          'It requests a URL and reports the status code the server sends back, plus usually the redirects and the time taken. This one sends a GET from Logdash, follows up to 5 redirects and shows the final code.',
      },
      {
        question: 'Is there a bulk HTTP status checker?',
        answer:
          'For a list of URLs, use the bash loop above: it reads urls.txt and prints the code, redirect count and time for each line. httpstatus.io does up to 100 URLs at once in the browser. Logdash watches one URL per monitor.',
      },
      {
        question: 'Is there a free HTTP status code checker online?',
        answer:
          'Yes, the checker on this page. No signup to see the code. It keeps checking every 5 minutes for 24 hours, and a free account keeps it running with Telegram alerts.',
      },
      {
        question:
          'How do I check the HTTP status of a URL from the command line?',
        answer:
          "curl -s -o /dev/null -w '%{http_code}' followed by the URL prints the code alone. Add -L to follow redirects and -m 10 to give up after 10 seconds, the same rules the Logdash check uses.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'response-time-checker',
    h1: 'Website response time checker',
    answer:
      'Enter a URL and Logdash times a full GET request from its servers, from DNS lookup to the last byte, then repeats it every 5 minutes so you see a trend instead of one lucky number.',
    meta: {
      title: 'Website response time checker | Logdash',
      description:
        'Check website response time from outside your network, then keep checking every 5 minutes. Plus the curl command that splits DNS, TLS and TTFB.',
    },
    tool: { kind: 'site-check' },
    blocks: [
      {
        type: 'paragraph',
        text: 'The number Logdash shows is the whole request: DNS lookup, TCP connect, TLS handshake, the server thinking, the body downloading, and every redirect on the way. It is what a visitor waits for before the HTML arrives, not a lab score. One reading tells you little, because a single request can hit a cold cache or a noisy network. The checker keeps going every 5 minutes for 24 hours, so you see a line, not a dot. And compare like with like: a health endpoint at 90 ms and a homepage at 1.4 seconds can both be healthy, because they do different work.',
      },
      {
        type: 'heading',
        text: 'Check website response time from your terminal',
      },
      {
        type: 'code',
        language: 'bash',
        code: `curl -sS -o /dev/null -w '
dns      %{time_namelookup}s
connect  %{time_connect}s
tls      %{time_appconnect}s
ttfb     %{time_starttransfer}s
total    %{time_total}s
status   %{http_code}
' https://example.com`,
      },
      {
        type: 'paragraph',
        text: 'Every value counts from the start of the request, so subtract to get each phase. The gap from connect to tls is the TLS handshake. The gap from tls to ttfb is your server working, and that is the number your code controls. The gap from ttfb to total is the download. On plain HTTP the tls line reads 0. Run it five times and take the middle value, never the first.',
      },
      {
        type: 'heading',
        text: 'Server response time checker: what counts as slow',
      },
      {
        type: 'list',
        items: [
          'Under 200 ms from ttfb minus tls: a cached page or a cheap API call. Most health endpoints should live here.',
          'Up to 0.8 seconds to first byte: the line web.dev draws for a good TTFB.',
          'Over a second of server time: a slow query, a cold start or a full connection pool. Fix it before it becomes an outage.',
          '10 seconds: the Logdash check gives up and records the site as down.',
          'Large DNS or connect times: the problem is distance or DNS, not your code. A CDN fixes the first, a different DNS host the second.',
        ],
      },
      {
        type: 'paragraph',
        text: 'One honest limit. Logdash charts the response time of every check and alerts when a check fails, including when it takes longer than 10 seconds. There is no alert for slower than 800 ms yet, so a slow creep shows up on the chart, not in Telegram.',
      },
      {
        type: 'paragraph',
        text: 'The check also runs from one location, so the number includes the distance between Logdash and your server. That makes it a poor league table and a good baseline. Compare the line with itself: a jump from 180 ms to 900 ms after a deploy is the signal, wherever the check runs from.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs KeyCDN Performance Test',
        them: 'KeyCDN Performance Test',
        rows: [
          {
            feature: 'Test locations',
            logdash: 'One',
            them: '10 around the world',
            winner: 'them',
          },
          {
            feature: 'Timing breakdown',
            logdash: 'Total time only',
            them: 'DNS, connect, TLS and TTFB per location',
            winner: 'them',
          },
          { feature: 'Price', logdash: 'Free', them: 'Free', winner: 'tie' },
          {
            feature: 'Repeats and keeps history',
            logdash: 'Every 5 minutes free, 15 seconds on Pro, charted',
            them: 'One-off test',
            winner: 'logdash',
          },
          {
            feature: 'Alert when it stops answering',
            logdash: 'Telegram or webhook',
            them: 'Not part of the test',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'KeyCDN Performance Test',
        reasons: [
          'You want to know how fast the site is in Sydney and Frankfurt right now. Ten locations in one click beats one location every 5 minutes.',
          'You are debugging a CDN or DNS setup and need the phase breakdown per region.',
        ],
      },
      { type: 'heading', text: 'Watch it for real' },
      {
        type: 'steps',
        items: [
          {
            title: 'Claim the check',
            text: 'Sign in with a free account and the response time chart you just watched keeps filling in. Five services on the free plan.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. That is 288 data points a day at 5 minutes and 5,760 at 15 seconds, so shorter gaps mean a smoother chart and faster alerts.',
          },
          {
            title: 'Connect Telegram and test it',
            text: 'Add a Telegram channel to the monitor, then stop the app. The next check fails, and a Telegram alert arrives saying the site is down with the status code or the timeout.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What does a response time checker measure?',
        answer:
          'The time from sending a request to receiving the full response. The Logdash checker measures one GET from its servers, DNS through the last byte, redirects included, and shows it in milliseconds.',
      },
      {
        question: 'Is there a free website response time checker?',
        answer:
          'Yes, this one. No signup to see the first number, then it checks every 5 minutes for 24 hours. A free account keeps it running with the chart and Telegram alerts.',
      },
      {
        question: 'What is a good result on a server response time checker?',
        answer:
          'Server time, ttfb minus tls in the curl output, under 200 ms for a cached page or a cheap API call. web.dev puts a good time to first byte at 0.8 seconds or less.',
      },
      {
        question: 'How do I check website response time from the command line?',
        answer:
          'Use curl with -w and the time_namelookup, time_connect, time_appconnect, time_starttransfer and time_total variables, as in the snippet above. Run it several times and take the median.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'ping-monitor-online',
    h1: 'Ping monitor online',
    answer:
      'Logdash does not send ICMP ping; it requests your URL over HTTP every 5 minutes for free, which answers what ping cannot: whether the site serves pages, not just whether the machine is switched on.',
    meta: {
      title: 'Ping monitor online, free HTTP checks | Logdash',
      description:
        'Logdash checks your site over HTTP, not ICMP ping. Why that catches more outages, when real ping is the better pick, and how to get alerts in 3 steps.',
    },
    tool: { kind: 'site-check' },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most people searching for a ping monitor want to know when their website goes down. ICMP ping answers a narrower question: does the network stack on that IP address reply. Logdash does not do ICMP. The checker on this page sends an HTTP GET instead, records the status code and response time, and counts anything outside 200 to 399, or no answer within 10 seconds, as down.',
      },
      { type: 'heading', text: 'Why a website ping monitor should use HTTP' },
      {
        type: 'list',
        items: [
          'The machine replies to ping while nginx is stopped, the app has crashed or the database is gone. Ping stays green and every visitor gets a 502.',
          'Behind Cloudflare or another proxy CDN, ping reaches the edge, not your server. Your origin can be down for hours and ping will never notice.',
          'Plenty of firewalls and cloud networks drop ICMP by default, so ping reports down while the site serves pages fine.',
          'An HTTP check measures the request your users make, so its response time means something. Ping latency is network distance and nothing else.',
        ],
      },
      { type: 'heading', text: 'Ping and HTTP side by side' },
      {
        type: 'code',
        language: 'bash',
        code: `# ICMP: does the machine answer?
ping -c 4 example.com

# HTTP: does the site answer? This is what Logdash checks.
curl -sS -o /dev/null -L --max-redirs 5 -m 10 \\
  -w '%{http_code} in %{time_total}s\\n' https://example.com`,
      },
      {
        type: 'paragraph',
        text: 'Read them together. Ping fine and curl 200: all good. Ping fine and curl 502 or 000: the box is up and the app is not, the case ping alone misses. Ping lost and curl 200: ICMP is blocked, and the site is fine. Both failing: the host or its network is gone. The third case is common enough that a ping-only monitor will wake you for a site that never went down.',
      },
      { type: 'heading', text: 'The other kind of ping' },
      {
        type: 'paragraph',
        text: 'Some tools use ping for the opposite direction: your cron job or worker calls the monitor, and silence means it died. Logdash has that as push monitors on the Pro plan. The worker sends POST https://api.logdash.io/ping/<monitorId>, no auth header, no body, and the monitor goes down on the first 15-second window without one. So it pings from a loop every few seconds. A nightly job that pings once would read as down all day, and Healthchecks.io or Cronitor fit that better.',
      },
      { type: 'heading', text: 'When you really need ICMP ping' },
      {
        type: 'paragraph',
        text: 'Some things have no web server to check: a router, a NAS, a VPN gateway, a printer, the internet connection at your office. For those, ICMP is the right tool, and Logdash cannot do it today. UptimeRobot includes ping monitors on its free plan, 50 monitors at 5-minute intervals, and is the better pick for that job.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'ICMP ping',
            logdash: 'Not shipped',
            them: 'Included on the free plan',
            winner: 'them',
          },
          {
            feature: 'Free HTTP check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Free monitors',
            logdash: '5 services, one HTTP monitor each',
            them: '50',
            winner: 'them',
          },
          {
            feature: 'Fastest paid interval',
            logdash: '15 seconds on Pro',
            them: '30 seconds on Team',
            winner: 'logdash',
          },
          {
            feature: 'App logs and metrics beside the check',
            logdash: 'Eight SDKs into the same service',
            them: 'Not part of the product',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You need to ping hardware or hosts with no HTTP endpoint. Logdash has no ICMP, port or keyword checks.',
          'You have more than five things to watch and no budget. 50 free monitors beats five.',
          'You want email or SMS alerts. Logdash sends Telegram messages and webhooks, and nothing else.',
        ],
      },
      { type: 'heading', text: 'Set it up in 3 steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Check the URL',
            text: 'Paste your site into the checker. The first result arrives in about a second with the status code and response time, no signup.',
          },
          {
            title: 'Claim it and pick the interval',
            text: 'Sign in with a free account to keep the monitor. Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro, which is 5,760 checks a day.',
          },
          {
            title: 'Connect Telegram and test it',
            text: 'Add a Telegram channel to the monitor, then stop the web server and leave the machine up. Ping would stay green. The next check fails and a Telegram alert arrives saying the site is down.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free ping monitor?',
        answer:
          'For websites, the Logdash free plan checks five services over HTTP every 5 minutes with Telegram alerts. For real ICMP ping on routers or servers, UptimeRobot includes it free with 50 monitors.',
      },
      {
        question: 'What is an online ping monitor?',
        answer:
          'A service that checks a host from the internet on a schedule and alerts you when it stops answering. Some send ICMP ping, others send HTTP requests. For a website, HTTP tells you more.',
      },
      {
        question: 'Is a website ping monitor the same as an uptime check?',
        answer:
          'Not quite. A ping proves the machine replies. An uptime check requests the page and reads the status code, so it catches a crashed app on a healthy machine. Logdash does the second.',
      },
      {
        question: 'Can Logdash be my ping monitor online?',
        answer:
          'For anything with a URL, yes, over HTTP. For devices without a web server, no. Logdash has no ICMP checks today.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'uptime-calculator',
    h1: 'Uptime calculator',
    answer:
      'The uptime calculator turns an uptime percentage into the downtime it allows per day, week, month, quarter and year, so 99.9% comes out as 1m 26.4s a day, 43m 49.8s a month and 8h 45m 57.6s a year.',
    meta: {
      title: 'Uptime calculator: downtime per day, month and year | Logdash',
      description:
        'Turn any uptime percentage into allowed downtime per day, week, month, quarter and year, and the formula to turn an outage back into a percentage.',
    },
    tool: { kind: 'uptime-calculator' },
    blocks: [
      {
        type: 'paragraph',
        text: 'Type a percentage, get a time budget. The calculator assumes 24/7 service and the calendar maths most SLA tools use: a 365.25-day year, a month of one twelfth of that (30.44 days, or 2,629,800 seconds) and a quarter of one quarter. Allowed downtime is the period length times (1 - uptime / 100). The rest of this page is what the number means once a monitor starts counting.',
      },
      {
        type: 'heading',
        text: 'Uptime percentage calculator: the common targets',
      },
      {
        type: 'list',
        items: [
          '99% allows 7h 18m 18s a month and 3d 15h 39m 36s a year. Fine for an internal tool.',
          '99.5% allows 3h 39m 9s a month and 1d 19h 49m 48s a year.',
          '99.9% allows 43m 49.8s a month and 8h 45m 57.6s a year. The usual first SaaS promise.',
          '99.95% allows 21m 54.9s a month and 4h 22m 58.8s a year. Google Cloud Run promises this for non-GPU services in most regions.',
          '99.99% allows 4m 22.98s a month and 52m 35.76s a year. Less than one 5-minute check interval.',
        ],
      },
      { type: 'heading', text: 'The formula' },
      {
        type: 'code',
        language: 'javascript',
        title: 'uptime.js',
        code: `// Allowed downtime for an uptime target, 24/7 service.
// Year = 365.25 days, month = year / 12, quarter = year / 4.
const YEAR = 365.25 * 86400;
const PERIODS = {
  day: 86400,
  week: 604800,
  month: YEAR / 12,
  quarter: YEAR / 4,
  year: YEAR,
};

const downtime = (percent) =>
  Object.entries(PERIODS).map(([name, seconds]) => {
    const down = seconds * (1 - percent / 100);
    return \`\${name}: \${down.toFixed(1)}s\`;
  });

// The other direction: the uptime an outage leaves you with.
const uptime = (downSeconds, period = 'month') =>
  (100 * (1 - downSeconds / PERIODS[period])).toFixed(3);

console.log(downtime(99.9).join(', '));
// day: 86.4s, week: 604.8s, month: 2629.8s, quarter: 7889.4s, year: 31557.6s
console.log(uptime(3600)); // one hour down this month: 99.863`,
      },
      {
        type: 'heading',
        text: 'Downtime calculator: from an outage back to a percentage',
      },
      {
        type: 'paragraph',
        text: 'Usually the question runs the other way: the API was down for an hour last Tuesday, what does that do to the month? Divide the outage by the period and subtract from 100%. One hour against a 30.44-day month leaves 99.863%, which misses 99.9. Thirty minutes leaves 99.932%, inside 99.9 with 13m 50s to spare. The same hour across a year costs only 0.011%, which is why a yearly SLA hides a bad month and a monthly one does not.',
      },
      { type: 'heading', text: 'Uptime calculator per month: which month?' },
      {
        type: 'paragraph',
        text: 'The 30.44-day month is an average. Contracts usually measure calendar months of 28 to 31 days. At 99.9%, February allows 40m 19.2s, a 30-day month 43m 12s and a 31-day month 44m 38.4s. The 4m 19s gap matters for a credit claim, so check which month your provider means.',
      },
      { type: 'heading', text: 'What a monitor actually counts' },
      {
        type: 'paragraph',
        text: 'A calculator works in seconds. A monitor works in checks. Logdash divides successful checks by all checks, a success being a status code from 200 to 399 within 10 seconds. At a 5-minute interval that is 8,766 checks a month, so one failed check costs 0.0114%, more than the whole 99.99% budget. At 1 minute one failure costs 0.0023%, at 15 seconds 0.0006%. An outage shorter than the interval can fall between two checks and never count. Pick the interval from the target.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Point a monitor at your app',
            text: 'Create a service in Logdash and give the monitor the URL your users hit, or a health route that touches the database. The free plan checks every 5 minutes, Builder every minute, Pro every 15 seconds.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. Webhooks work the same way.',
          },
          {
            title: 'Spend the budget on purpose',
            text: 'Stop the app for one interval. The next check fails, the monitor flips to down, and a Telegram alert lands with the monitor name and the status code. A second one arrives on recovery.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs uptime.is',
        them: 'uptime.is',
        rows: [
          {
            feature: 'Downtime per day, week, month, quarter and year',
            logdash: 'Yes, on a 365.25-day year',
            them: 'Yes, the same numbers',
            winner: 'tie',
          },
          {
            feature: 'Business-hours SLA',
            logdash: '24/7 only',
            them: 'Hours per weekday in its flexible mode',
            winner: 'them',
          },
          {
            feature: 'Outage back to a percentage',
            logdash: 'In the formula above',
            them: 'Built-in reverse mode',
            winner: 'them',
          },
          {
            feature: 'Measures your real uptime',
            logdash: 'HTTP checks every 5 minutes free, 15 seconds on Pro',
            them: 'Calculator only',
            winner: 'logdash',
          },
          {
            feature: 'Tells you when the budget is burning',
            logdash: 'Telegram or webhook alert on the first failed check',
            them: 'Not part of the calculator',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'uptime.is',
        reasons: [
          'You only need the number. It answers on one keystroke and puts any percentage in the URL.',
          'Your SLA covers business hours only. Its flexible mode takes hours per weekday, while this calculator assumes 24/7.',
          'You want two targets side by side, or an outage turned into a percentage without code.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How does an uptime calculator work?',
        answer:
          'It multiplies the length of a period by the share of time you may be down. For 99.9% that share is 0.001, so a 2,629,800-second month allows 2,629.8 seconds, or 43m 49.8s. It assumes the service is meant to be up around the clock.',
      },
      {
        question: 'What does an uptime calculator per month use as a month?',
        answer:
          'This one uses one twelfth of a 365.25-day year, 30.44 days. SLAs measured per calendar month use the real length, so 99.9% allows 40m 19.2s in February and 44m 38.4s in a 31-day month.',
      },
      {
        question: 'What is the formula behind an uptime percentage calculator?',
        answer:
          'Uptime is (period - downtime) / period * 100. Allowed downtime is period * (1 - uptime / 100). A monitor approximates both by counting checks: Logdash divides successful checks by all checks.',
      },
      {
        question: 'Can a downtime calculator work backwards from an outage?',
        answer:
          'Yes. Divide the outage by the period and subtract from 100%. A 1-hour outage costs 0.137% of a month, leaving 99.863%, and 0.011% of a year, leaving 99.989%.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: '99-9-uptime',
    h1: '99.9 uptime calculator',
    answer:
      'At 99.9% uptime the calculator gives 1m 26.4s of allowed downtime per day, 10m 4.8s per week, 43m 49.8s per month, 2h 11m 29.4s per quarter and 8h 45m 57.6s per year.',
    meta: {
      title: '99.9 uptime calculator: 43m 50s a month | Logdash',
      description:
        '99.9% uptime allows 1m 26.4s a day, 43m 49.8s a month and 8h 45m 57.6s a year. The exact numbers, the formula and what a monitor counts.',
    },
    tool: { kind: 'uptime-calculator', percent: 99.9 },
    blocks: [
      {
        type: 'paragraph',
        text: 'Three nines is the number most founders write on the pricing page first, usually before measuring anything. The calculator has it preset. It assumes 24/7 service, a 365.25-day year and a month of one twelfth of that, 30.44 days. One tenth of one percent of each period is the budget.',
      },
      { type: 'heading', text: '99.9 uptime: the full table' },
      {
        type: 'list',
        items: [
          'Per day: 1m 26.4s (86.4 seconds)',
          'Per week: 10m 4.8s (604.8 seconds)',
          'Per month: 43m 49.8s (2,629.8 seconds)',
          'Per quarter: 2h 11m 29.4s (7,889.4 seconds)',
          'Per year: 8h 45m 57.6s (31,557.6 seconds)',
        ],
      },
      { type: 'heading', text: '99.9 uptime per month' },
      {
        type: 'paragraph',
        text: 'The monthly figure is the one that bites, because most SLAs and most status pages reset monthly. 43 minutes sounds generous until you add up what eats it. A deploy that restarts the only instance for 90 seconds, twice a week, spends about 13 minutes a month before anything has actually broken. One migration that holds a lock for half an hour takes the rest. Calendar months move the line too: February allows 40m 19.2s, a 30-day month 43m 12s and a 31-day month 44m 38.4s.',
      },
      { type: 'heading', text: '99.9 uptime per year' },
      {
        type: 'paragraph',
        text: '8h 45m 57.6s a year looks like a full working day of slack. It is not spread evenly. A yearly 99.9% survives one 8-hour outage in March and a clean rest of the year. A monthly 99.9% fails March by more than 7 hours. If you promise 99.9 to customers, promise it per month. It is the stricter reading and the one they will check.',
      },
      { type: 'heading', text: '99.9 availability downtime in failed checks' },
      {
        type: 'code',
        language: 'javascript',
        title: 'budget.js',
        code: `// What 99.9% allows, in time and in failed checks.
const MONTH = (365.25 * 86400) / 12; // 2,629,800 seconds
const budget = MONTH * (1 - 99.9 / 100); // 2629.8 seconds = 43m 49.8s

for (const interval of [300, 60, 15]) {
  const checks = MONTH / interval;
  const allowed = Math.floor(budget / interval);
  console.log(\`\${interval}s interval: \${checks} checks, \${allowed} may fail\`);
}
// 300s interval: 8766 checks, 8 may fail
// 60s interval: 43830 checks, 43 may fail
// 15s interval: 175320 checks, 175 may fail`,
      },
      {
        type: 'paragraph',
        text: 'Logdash counts uptime as successful checks over all checks, where a check succeeds on a status code from 200 to 399 within 10 seconds. On the free plan, 8 failed checks a month keep you at 99.9 and the 9th puts you under. On Pro, at 15 seconds, the same budget is 175 failed checks, a much finer picture of what happened. A 3-minute outage can fall between two 5-minute checks and never count at all. The Logdash uptime badge is green at 99.9% and above and amber below it, down to 99%, so the number on your README draws the same line.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a service in Logdash and give the monitor your public URL or health route. The first check runs straight away and records the status code and response time.',
          },
          {
            title: 'Pick an interval that can see 43 minutes',
            text: 'Every 5 minutes on the free plan is 8,766 checks a month, enough for 99.9. Builder checks every minute for $9 a month, Pro every 15 seconds for $15.',
          },
          {
            title: 'Get the first failure on your phone',
            text: 'Connect a Telegram channel and stop the app for one interval. The monitor flips to down on the first failed check and Telegram delivers the alert with the monitor name and the status code, while most of the 43 minutes is still unspent.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Measuring 99.9: Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes, 8 failed checks fit in a 99.9 month',
            them: 'Every 5 minutes, the same 8',
            winner: 'tie',
          },
          {
            feature: 'Monitors on the free plan',
            logdash: '5 services',
            them: '50 monitors',
            winner: 'them',
          },
          {
            feature: 'Fastest paid interval',
            logdash: '15 seconds on Pro',
            them: '60 seconds on Solo, 30 seconds on Team',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, SMS, voice, Slack, Telegram, webhook and more, by plan',
            winner: 'them',
          },
          {
            feature: 'Source code',
            logdash: 'AGPL-3.0, public repository',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You have more than five URLs and no budget. Fifty free monitors at 5 minutes is the bigger free plan, and 5 minutes is enough to measure 99.9.',
          'You want an SMS or a voice call when the budget starts burning. Logdash sends Telegram messages and webhooks, nothing else.',
          'You already run thirty monitors there and they all report 99.9 fine. Moving buys a shorter interval, not a different number.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What does 99.9 uptime allow per day and per week?',
        answer:
          '1m 26.4s per day and 10m 4.8s per week, assuming the service should be up 24/7. That is 86.4 and 604.8 seconds.',
      },
      {
        question: 'What is 99.9 uptime per month?',
        answer:
          '43m 49.8s on an average 30.44-day month. Per calendar month it is 40m 19.2s in February, 43m 12s in a 30-day month and 44m 38.4s in a 31-day month.',
      },
      {
        question: 'What is 99.9 uptime per year?',
        answer:
          '8h 45m 57.6s over a 365.25-day year, or 8h 45m 36s over a 365-day year. A yearly target lets one long outage hide inside an otherwise clean year.',
      },
      {
        question: 'How is 99.9 availability downtime measured by a monitor?',
        answer:
          'By sampling. Logdash divides successful checks by all checks. At 5-minute checks a month holds 8,766 of them and 8 may fail; at 15 seconds it holds 175,320 and 175 may fail.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: '99-95-uptime',
    h1: '99.95 uptime calculator',
    answer:
      'At 99.95% uptime the calculator gives 43.2s of allowed downtime per day, 5m 2.4s per week, 21m 54.9s per month, 1h 5m 44.7s per quarter and 4h 22m 58.8s per year.',
    meta: {
      title: '99.95 uptime calculator: 21m 55s a month | Logdash',
      description:
        '99.95% uptime allows 43.2s a day, 21m 54.9s a month and 4h 22m 58.8s a year. Calendar-month SLA numbers, a Python check and how to measure it.',
    },
    tool: { kind: 'uptime-calculator', percent: 99.95 },
    blocks: [
      {
        type: 'paragraph',
        text: '99.95 is the number cloud providers like. Google Cloud Run promises it for non-GPU services in most regions, measured per calendar month. It sits between three and four nines and allows exactly half the downtime of 99.9. The calculator assumes 24/7 service, a 365.25-day year and a 30.44-day month.',
      },
      { type: 'heading', text: '99.95 uptime: the full table' },
      {
        type: 'list',
        items: [
          'Per day: 43.2 seconds',
          'Per week: 5m 2.4s (302.4 seconds)',
          'Per month: 21m 54.9s (1,314.9 seconds)',
          'Per quarter: 1h 5m 44.7s (3,944.7 seconds)',
          'Per year: 4h 22m 58.8s (15,778.8 seconds)',
        ],
      },
      { type: 'heading', text: '99.95 uptime per month' },
      {
        type: 'paragraph',
        text: '21m 54.9s on an average month. That is one slow rollback, or one database failover that takes longer than the docs promised. Per year the same target allows 4h 22m 58.8s, but a yearly reading lets one long outage hide inside eleven clean months, so most SLAs at this level reset monthly.',
      },
      { type: 'heading', text: '99.95 SLA downtime per calendar month' },
      {
        type: 'code',
        language: 'python',
        title: 'sla.py',
        code: `# 99.95% per calendar month, the way cloud SLAs measure it.
from calendar import monthrange

target = 99.95
for month in (2, 4, 1):  # 28, 30 and 31 days in 2026
    days = monthrange(2026, month)[1]
    allowed = days * 86400 * (1 - target / 100)
    print(f"{days} days: {allowed // 60:.0f}m {allowed % 60:.1f}s")
# 28 days: 20m 9.6s
# 30 days: 21m 36.0s
# 31 days: 22m 19.2s`,
      },
      {
        type: 'paragraph',
        text: 'Cloud SLAs count calendar months, so the real allowance moves between 20m 9.6s in February and 22m 19.2s in a 31-day month. Cloud Run credits 10% of the monthly bill when a month lands between 99% and 99.95%, 25% between 95% and 99%, and 50% below 95%, and states that the credit is your only remedy. Your customers get none of it, and that outage still counts in full against your own SLA.',
      },
      { type: 'heading', text: 'Your 99.95 sits on top of theirs' },
      {
        type: 'paragraph',
        text: 'If your app runs on a 99.95 host and talks to a 99.95 database, the best you can promise without redundancy is 99.95% times 99.95%, which is 99.90%. Two dependencies at the same target halve your budget before you write any code. Promise 99.9 on top of a 99.95 platform, not 99.95.',
      },
      { type: 'heading', text: 'Measuring 99.95 with checks' },
      {
        type: 'paragraph',
        text: 'Logdash counts successful checks over all checks, a 200 to 399 status within 10 seconds being a success. At 5 minutes the month holds 8,766 checks and 4 may fail. At 1 minute, on Builder, 21 may fail. At 15 seconds, on Pro, 87 may fail. The 5-minute interval is too coarse to trust here: a 6-minute outage shows up as one or two failed checks, a quarter or half of the monthly budget, depending on where the checks happened to land.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Point a monitor at the app',
            text: 'Create a service in Logdash and give it your public URL or a health route. The first check runs immediately and records the status code and response time.',
          },
          {
            title: 'Pick 1 minute or faster',
            text: 'Builder checks every minute for $9 a month and Pro every 15 seconds for $15. The free plan checks every 5 minutes, enough to see 99.9 but not to trust a 99.95 number.',
          },
          {
            title: 'Get told inside the budget',
            text: 'Connect a Telegram channel and stop the app. The next check fails, the monitor flips to down, and Telegram delivers the alert with the monitor name and the status code while almost all of the 21 minutes is still yours.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Measuring 99.95: Logdash vs Hyperping',
        them: 'Hyperping',
        rows: [
          {
            feature: 'Free plan',
            logdash: '5 services, checked every 5 minutes',
            them: '20 monitors, checked every 5 minutes',
            winner: 'them',
          },
          {
            feature: 'Fastest paid interval',
            logdash: '15 seconds on Pro',
            them: '30 seconds on Essentials, 20 seconds on Business',
            winner: 'logdash',
          },
          {
            feature: 'Failed checks inside 21m 55s',
            logdash: '87 at 15 seconds',
            them: '43 at 30 seconds',
            winner: 'logdash',
          },
          {
            feature: 'Status page on the free plan',
            logdash: 'One public status page',
            them: 'One basic status page',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Hyperping',
        reasons: [
          'You have more than five things to watch and no budget yet. The Hyperping free plan covers 20 monitors at the same 5-minute interval.',
          'You want monitors, status pages and incident management sold as one bundle, which is how Hyperping is built.',
          '30 seconds is enough for your 99.95. Forty-three failed checks a month is still a fine-grained picture.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How much downtime is 99.95 uptime?',
        answer:
          '43.2 seconds per day, 5m 2.4s per week, 21m 54.9s per month, 1h 5m 44.7s per quarter and 4h 22m 58.8s per year, assuming 24/7 service and a 365.25-day year.',
      },
      {
        question: 'What is 99.95 uptime per month?',
        answer:
          '21m 54.9s on a 30.44-day average month. Per calendar month it is 20m 9.6s in February, 21m 36s in a 30-day month and 22m 19.2s in a 31-day month.',
      },
      {
        question: 'How is 99.95 SLA downtime measured?',
        answer:
          'Usually per calendar month, from the provider side. Cloud Run measures its Monthly Uptime Percentage per project, per region, per calendar month. Your own monitor measures from outside, so the two numbers rarely match to the second.',
      },
      {
        question: 'Is 99.95 uptime per year the same as per month?',
        answer:
          'No. Per year it allows 4h 22m 58.8s, which one long outage can spend at once. Per month it caps every month at 21m 54.9s. The monthly reading is stricter and the one most SLAs use.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: '99-99-uptime',
    h1: '99.99 uptime calculator',
    answer:
      'At 99.99% uptime the calculator gives 8.64s of allowed downtime per day, 1m 0.48s per week, 4m 22.98s per month, 13m 8.94s per quarter and 52m 35.76s per year.',
    meta: {
      title: '99.99 uptime calculator: 4m 23s a month | Logdash',
      description:
        '99.99% uptime allows 8.64s a day, 4m 22.98s a month and 52m 35.76s a year. Exact numbers, an awk one-liner and the check interval it takes to see them.',
    },
    tool: { kind: 'uptime-calculator', percent: 99.99 },
    blocks: [
      {
        type: 'paragraph',
        text: 'Four nines is where the maths stops being abstract. The calculator assumes 24/7 service, a 365.25-day year and a 30.44-day month, and at 99.99% one ten-thousandth of each period is all you get. That is less time than most deploys take.',
      },
      { type: 'heading', text: '99.99 uptime: the full table' },
      {
        type: 'list',
        items: [
          'Per day: 8.64 seconds',
          'Per week: 1m 0.48s (60.48 seconds)',
          'Per month: 4m 22.98s (262.98 seconds)',
          'Per quarter: 13m 8.94s (788.94 seconds)',
          'Per year: 52m 35.76s (3,155.76 seconds)',
        ],
      },
      { type: 'heading', text: 'The same numbers in awk' },
      {
        type: 'code',
        language: 'bash',
        code: `# Allowed downtime at 99.99% uptime, in seconds. Change p for any target.
awk -v p=99.99 'BEGIN {
  year = 365.25 * 86400
  printf "day      %9.2f s\\n", 86400 * (1 - p / 100)
  printf "week     %9.2f s\\n", 604800 * (1 - p / 100)
  printf "month    %9.2f s\\n", year / 12 * (1 - p / 100)
  printf "quarter  %9.2f s\\n", year / 4 * (1 - p / 100)
  printf "year     %9.2f s\\n", year * (1 - p / 100)
}'
# day           8.64 s
# week         60.48 s
# month       262.98 s
# quarter     788.94 s
# year       3155.76 s`,
      },
      { type: 'heading', text: '99.99 uptime per month' },
      {
        type: 'paragraph',
        text: '4m 23s a month means one restart that takes 5 minutes is already a missed month. Calendar months shift it by seconds, not minutes: 4m 1.92s in February, 4m 19.2s in a 30-day month, 4m 27.84s in a 31-day month. A single instance cannot hit this. Every deploy, every host reboot and every config change that bounces the process spends the budget. Four nines on one box is a claim, not an architecture.',
      },
      { type: 'heading', text: '99.99 uptime per year' },
      {
        type: 'paragraph',
        text: '52m 35.76s a year sounds like one long lunch break, which is why yearly four nines gets promised so often. One hour-long outage, the usual cost of a bad migration, breaks the whole year on its own at 99.989%. If you promise 99.99 per year, you are promising that the worst incident of the next twelve months stays under 53 minutes, and that nothing else goes wrong at all.',
      },
      {
        type: 'heading',
        text: 'Four nines availability needs a faster monitor',
      },
      {
        type: 'paragraph',
        text: 'A monitor cannot report what it does not sample. Logdash counts successful checks over all checks, a success being a 200 to 399 status within 10 seconds. At a 5-minute interval the monthly budget is 0.88 of one check, so a single failure, 0.0114% of the month, takes you to 99.9886%. At 1 minute you may fail 4 checks a month. At 15 seconds, the Pro interval, you may fail 17. Only the 15-second interval is fine enough to tell a 30-second blip from a 4-minute outage.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Monitor what users hit',
            text: 'Create a service in Logdash and point the monitor at your public URL or at a health route that runs one database query. Each check stores the status code and the response time.',
          },
          {
            title: 'Use the 15-second interval',
            text: 'Pro checks every 15 seconds, 175,320 checks a month. Builder checks every minute and the free plan every 5 minutes, which is fine for 99.9 and too coarse for 99.99.',
          },
          {
            title: 'Hear about it in seconds, not minutes',
            text: 'Connect Telegram and kill the process. Within one 15-second interval the check fails, the monitor flips to down and the Telegram alert arrives with the monitor name and the status code, while most of the 4m 23s is still unspent.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Measuring 99.99: Logdash vs Better Stack',
        them: 'Better Stack',
        rows: [
          {
            feature: 'Fastest check interval',
            logdash: '15 seconds on Pro, $15 a month',
            them: '30 seconds on paid plans',
            winner: 'logdash',
          },
          {
            feature: 'Failed checks that fit in 4m 23s',
            logdash: '17 at 15 seconds',
            them: '8 at 30 seconds',
            winner: 'logdash',
          },
          {
            feature: 'Check locations',
            logdash: 'One location',
            them: 'Multi-location and geo-specific checks',
            winner: 'them',
          },
          {
            feature: 'SLA reporting',
            logdash: 'Uptime badges for 24h, 7d, 30d and 90d',
            them: 'Uptime SLA reports built in',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack, SMS and phone calls',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Better Stack',
        reasons: [
          'You sell four nines with a contract behind it. Multi-location checks stop one bad network path from costing you a credit, and Logdash checks from one place.',
          'You need a phone call at 3am. A 4-minute budget does not survive a Telegram message on a muted phone.',
          'You want SLA reports to send to a customer, not a badge on a README.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How much downtime is 99.99 uptime?',
        answer:
          '8.64 seconds per day, 1m 0.48s per week, 4m 22.98s per month, 13m 8.94s per quarter and 52m 35.76s per year, assuming 24/7 service and a 365.25-day year.',
      },
      {
        question: 'What is 99.99 uptime per month?',
        answer:
          '4m 22.98s on a 30.44-day average month. Calendar months give 4m 1.92s in February, 4m 19.2s in 30-day months and 4m 27.84s in 31-day months.',
      },
      {
        question: 'What is 99.99 uptime per year?',
        answer:
          '52m 35.76s across a 365.25-day year. One outage of an hour breaks it on its own, leaving 99.989%.',
      },
      {
        question: 'Is four nines availability realistic for a small team?',
        answer:
          'Not on one server: a restart that takes 5 minutes spends more than a month of budget. It takes at least two instances behind a load balancer, deploys that never drop traffic, and checks every 15 seconds to prove it. Most founders are better off promising 99.9 and beating it.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: '99-5-uptime',
    h1: '99.5 uptime calculator',
    answer:
      '99.5% uptime allows 7m 12s of downtime per day, 50m 24s per week, 3h 39m 9s per month, 10h 57m 27s per quarter and 1d 19h 49m 48s per year, and the calculator on this page does the same sum for any percentage you type.',
    meta: {
      title: '99.5 uptime calculator: downtime per month | Logdash',
      description:
        '99.5% uptime is 7m 12s of downtime a day, 3h 39m 9s a month and 43h 49m 48s a year. The exact numbers per period, the formula, and how to measure it.',
    },
    tool: { kind: 'uptime-calculator', percent: 99.5 },
    blocks: [
      {
        type: 'paragraph',
        text: "99.5% sounds close to 100. It is 0.5% of the clock, and 0.5% of a year is almost two full days. That is the budget: every failed deploy, every reboot for a kernel patch and every hour your host spends on someone else's incident comes out of the same 43h 49m 48s.",
      },
      {
        type: 'heading',
        text: '99.5 uptime per day, week, month, quarter and year',
      },
      {
        type: 'list',
        items: [
          'Per day: 7m 12s of downtime, out of 1,440 minutes.',
          'Per week: 50m 24s.',
          'Per month: 3h 39m 9s, using the average month of 30.44 days.',
          'Per quarter: 10h 57m 27s.',
          'Per year: 1d 19h 49m 48s, which is 43h 49m 48s.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The year is 365.25 days so leap years average out, and a month is a twelfth of that, 730.5 hours. Contracts often measure the calendar month instead, and then the number moves: 3h 21m 36s in a 28-day February, 3h 36m in a 30-day month, 3h 43m 12s in a 31-day one. Check which one your SLA uses before you argue about a credit.',
      },
      { type: 'heading', text: 'The formula the calculator runs' },
      {
        type: 'paragraph',
        text: 'Allowed downtime is the length of the period times the share of it you may be down: `period x (1 - 99.5 / 100)`. Paste this into Node or a browser console and change the percentage on the last line.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'downtime.js',
        code: `const YEAR = 365.25 * 24 * 3600; // seconds in an average year
const PERIODS = {
  day: 86400,
  week: 7 * 86400,
  month: YEAR / 12,
  quarter: YEAR / 4,
  year: YEAR,
};

const fmt = (seconds) => {
  const s = Math.round(seconds);
  return \`\${Math.floor(s / 3600)}h \${Math.floor((s % 3600) / 60)}m \${s % 60}s\`;
};

function allowedDowntime(percent) {
  const down = (100 - percent) / 100;
  return Object.fromEntries(
    Object.entries(PERIODS).map(([name, seconds]) => [
      name,
      fmt(seconds * down),
    ]),
  );
}

console.log(allowedDowntime(99.5));
// {
//   day: '0h 7m 12s',
//   week: '0h 50m 24s',
//   month: '3h 39m 9s',
//   quarter: '10h 57m 27s',
//   year: '43h 49m 48s'
// }`,
      },
      { type: 'heading', text: '99.5 uptime per month, counted in checks' },
      {
        type: 'paragraph',
        text: 'A monitor turns the percentage into a count you can watch. At one check every 5 minutes a month holds 8,766 checks, and 99.5% lets 43 of them fail. At one check a minute it is 43,830 checks and 219 failures. At every 15 seconds, 175,320 checks and 876 failures.',
      },
      {
        type: 'paragraph',
        text: 'The interval also decides how much budget you burn before anyone knows. A full outage that starts just after a 5-minute check runs up to 5 minutes unseen, which is 69% of the 7m 12s daily allowance. At 15 seconds the blind spot is about 3.5% of it.',
      },
      { type: 'heading', text: '99.5 availability next to the other tiers' },
      {
        type: 'list',
        items: [
          '99%: 7h 18m 18s per month. A bad Saturday.',
          '99.5%: 3h 39m 9s per month. One slow migration and a host incident.',
          '99.9%: 43m 49.8s per month. One rollback, if you notice fast.',
          '99.95%: 21m 54.9s per month. Needs automatic failover or a lot of luck.',
        ],
      },
      {
        type: 'paragraph',
        text: '99.5 is an honest target for a side project or an early SaaS on one VPS with no failover. It is too loose for anything taking payments, where a 3-hour hole in a single month reads as broken to the customer it hits. The Logdash classic uptime badge agrees: anything from 99% to just under 99.9% renders amber, not green.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs uptime.is',
        them: 'uptime.is',
        rows: [
          {
            feature: 'Downtime per day, week, month, quarter, year',
            logdash: 'Yes, average month of 730.5 hours',
            them: 'Yes, same periods',
            winner: 'tie',
          },
          {
            feature: 'SLA measured only in business hours',
            logdash: 'No, 24/7 only',
            them: 'Yes, hours per weekday',
            winner: 'them',
          },
          {
            feature: 'Measures the uptime you actually deliver',
            logdash: 'HTTP checks every 5 minutes free, 15 seconds on Pro',
            them: 'Calculator only',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'uptime.is',
        reasons: [
          'Your SLA only counts office hours, say 9 to 5 on weekdays. uptime.is lets you set the hours per weekday and Logdash does not.',
          'You want to work backwards from minutes of downtime to a percentage. uptime.is has a reverse mode built for exactly that.',
        ],
      },
      { type: 'heading', text: 'Measure the 99.5 you actually get' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a service in Logdash and give its monitor your health endpoint. Every check stores the status code and response time, and uptime is the share of checks that came back 200-399.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes free, every minute on Builder, every 15 seconds on Pro. For a 7m 12s daily budget, a minute is the slowest interval that still leaves room to react.',
          },
          {
            title: 'Break it once',
            text: 'Return a 503 from the endpoint. The next check flips the monitor to down and a Telegram alert lands with the status code, then a second one when it recovers.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How much downtime is 99.5 uptime?',
        answer:
          '7m 12s per day, 50m 24s per week, 3h 39m 9s per month, 10h 57m 27s per quarter and 1d 19h 49m 48s per year, with a 365.25-day year and a month of a twelfth of it.',
      },
      {
        question: 'What is 99.5 uptime per month?',
        answer:
          '3h 39m 9s in an average month of 730.5 hours. In a calendar month it is 3h 21m 36s for February, 3h 36m for a 30-day month and 3h 43m 12s for a 31-day month.',
      },
      {
        question: 'Is 99.5 availability good enough?',
        answer:
          'For a side project or an internal tool, yes. For a product people pay for, 3 hours in one month is long enough that they notice and ask. Most paid SaaS aims for 99.9%, which is 43m 49.8s a month.',
      },
      {
        question: 'How do I measure 99.5 uptime?',
        answer:
          "Point an HTTP monitor at a health endpoint and divide successful checks by total checks. Use an interval of a minute or shorter, because a 5-minute gap can hide most of a day's 7m 12s budget before the first failed check.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'sla-calculator',
    h1: 'SLA calculator',
    answer:
      'The SLA calculator turns an SLA percentage into the downtime it allows per day, week, month, quarter and year, and multiplies the SLAs of every service in your request path into the composite SLA you can actually promise.',
    meta: {
      title: 'SLA calculator: 99.9, 99.95, 99.99 and composite | Logdash',
      description:
        'Turn any SLA into allowed downtime per day, month and year, and multiply your dependencies into a composite SLA. With the formula in JavaScript.',
    },
    tool: { kind: 'sla-calculator' },
    blocks: [
      {
        type: 'paragraph',
        text: 'An SLA percentage is a downtime budget written as a fraction. 99.9% means you may be down 0.1% of the period, which is 43m 50s in an average month. The calculator does that conversion for any number, and then does the part a plain percentage converter skips: it multiplies in the services your app depends on, because your SLA can never be higher than theirs combined.',
      },
      { type: 'heading', text: 'SLA calculator 99.9, 99.95 and 99.99' },
      {
        type: 'list',
        items: [
          '99.9%: 1m 26.4s per day, 43m 49.8s per month, 8h 45m 57.6s per year.',
          '99.95%: 43.2s per day, 21m 54.9s per month, 4h 22m 58.8s per year.',
          '99.99%: 8.64s per day, 4m 22.98s per month, 52m 35.76s per year.',
        ],
      },
      {
        type: 'paragraph',
        text: 'All three use a 365.25-day year and a month of a twelfth of it, the same sums the calculator runs. Each extra nine divides the budget by ten, and the cost of staying inside it grows faster than that. 99.9 is one quick rollback a month. 99.99 is under 5 minutes, which no human on call can hit: by the time the alert is read the month is gone, so it takes automatic failover.',
      },
      { type: 'heading', text: 'SLA uptime formula' },
      {
        type: 'list',
        items: [
          'Allowed downtime: `period x (1 - SLA / 100)`.',
          'Measured uptime: `(period - downtime) / period x 100`.',
          'Serial composite: `A x B x C`, as fractions. Every dependency has to be up.',
          'Parallel composite: `1 - (1 - A) x (1 - B)`. Down only when every copy is down at once.',
        ],
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'sla.js',
        code: `const MONTH_MIN = (365.25 * 24 * 60) / 12; // 43,830 minutes

// Allowed downtime for one SLA, in minutes per month.
const allowed = (sla) => MONTH_MIN * (1 - sla / 100);

// Dependencies in series: every one has to be up, so multiply.
const serial = (...slas) => slas.reduce((acc, s) => acc * (s / 100), 1) * 100;

// Redundant copies with automatic failover: down only if all are down.
const parallel = (...slas) =>
  (1 - slas.reduce((acc, s) => acc * (1 - s / 100), 1)) * 100;

const composite = serial(99.99, 99.95, 99.9); // host, database, payments API
console.log(composite.toFixed(2) + '%'); // 99.84%
console.log(allowed(composite).toFixed(0) + ' min/month'); // 70 min/month
console.log(parallel(99.9, 99.9).toFixed(4) + '%'); // 99.9999%`,
      },
      {
        type: 'heading',
        text: 'Composite SLA: why you can promise less than your providers',
      },
      {
        type: 'paragraph',
        text: 'A request to your app usually needs the host, the database and often a third-party API. If those publish 99.99, 99.95 and 99.9, the chain is 99.84%, which is 70 minutes a month before your own code has failed once. Promise a customer 99.9 on that stack and you have signed for an SLA your vendors alone can break. Put the composite in the contract, or remove a dependency from the request path, for example by queueing the payment call instead of waiting on it.',
      },
      {
        type: 'paragraph',
        text: 'The parallel formula is how the big numbers get bought back. Two 99.9 regions with failover give 99.9999% on paper. That holds only if the failover is automatic and the two copies do not share a failure, like the same DNS provider or the same bad deploy. Most outages are shared failures, so treat the parallel result as a ceiling, not a forecast.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs uptime.is',
        them: 'uptime.is',
        rows: [
          {
            feature: 'SLA to downtime per period',
            logdash: 'Day, week, month, quarter, year',
            them: 'Day, week, month, quarter, year',
            winner: 'tie',
          },
          {
            feature: 'Composite SLA of dependencies',
            logdash: 'Multiplies them for you',
            them: 'Not built in',
            winner: 'logdash',
          },
          {
            feature: 'Business-hours SLA',
            logdash: 'No, 24/7 only',
            them: 'Hours per weekday',
            winner: 'them',
          },
          {
            feature: 'Measures delivered uptime',
            logdash: 'HTTP checks down to every 15 seconds',
            them: 'Calculator only',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'uptime.is',
        reasons: [
          'Your contract only counts business hours. uptime.is takes hours per weekday and Logdash assumes 24/7.',
          'You need the reverse sum, minutes of downtime back to a percentage, on a page made for it.',
        ],
      },
      { type: 'heading', text: 'Measure the SLA you actually deliver' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a service in Logdash and point its monitor at your health endpoint. Uptime is the share of checks that answered 200-399.',
          },
          {
            title: 'Match the interval to the SLA',
            text: 'A 5-minute check, the free plan, cannot see a 99.99 budget of 4m 23s a month. Builder checks every minute, Pro every 15 seconds.',
          },
          {
            title: 'Prove the alert works',
            text: 'Make the endpoint return 503. The next check marks it down and a Telegram alert arrives with the status code, so the first minute of the budget is not spent finding out.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'SLA calculator 99.9: how much downtime does it allow?',
        answer:
          '1m 26.4s per day, 10m 4.8s per week, 43m 49.8s per month, 2h 11m 29.4s per quarter and 8h 45m 57.6s per year, with a 365.25-day year.',
      },
      {
        question: 'SLA calculator 99.95: how much downtime does it allow?',
        answer:
          '43.2s per day, 5m 2.4s per week, 21m 54.9s per month, 1h 5m 44.7s per quarter and 4h 22m 58.8s per year. Half the 99.9 budget.',
      },
      {
        question: 'SLA calculator 99.99: can a monitor even measure it?',
        answer:
          'The budget is 4m 22.98s a month, 8.64 seconds a day. A 5-minute check cannot resolve that. You need checks every 15 seconds and failover that reacts without a human.',
      },
      {
        question: 'What is the SLA uptime formula?',
        answer:
          'Allowed downtime = period x (1 - SLA / 100). Measured uptime = (period - downtime) / period x 100. For dependencies in series, multiply their SLAs as fractions.',
      },
      {
        question: 'How does an SLA calculator handle dependencies?',
        answer:
          'Services in series multiply: 99.99, 99.95 and 99.9 give 99.84%. Redundant copies with automatic failover combine as 1 - (1 - A) x (1 - B), which only holds if they fail independently.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'downtime-cost-calculator',
    h1: 'Downtime cost calculator',
    answer:
      'The downtime cost calculator multiplies the length of the outage by your revenue per hour and by what the people fixing it cost per hour, and the formula below adds the customers who leave and any SLA credits, so you get one number for one outage.',
    meta: {
      title: 'Downtime cost calculator for small teams | Logdash',
      description:
        'Work out what an outage cost you: lost revenue per minute, staff time, churn and SLA credits. The formula in JavaScript, with a worked example.',
    },
    tool: { kind: 'downtime-cost' },
    blocks: [
      {
        type: 'paragraph',
        text: 'Search for the cost of downtime and you get $5,600 a minute. That number comes from a 2014 Gartner blog post about enterprise network downtime, and even there it was an average from industry surveys, not a figure for any one business. For a company doing $20,000 a month it is off by a factor of thousands. Use your own numbers. There are only four of them.',
      },
      { type: 'heading', text: 'Downtime cost formula' },
      {
        type: 'list',
        items: [
          'Lost revenue = revenue per minute x minutes down x share of revenue that stops. A shop that cannot take orders loses close to all of it. A subscription app mostly does not lose revenue in the moment.',
          'Labour = people on the incident x hourly rate x hours, including the clean-up the day after.',
          'Churn = MRR of customers who leave because of it x the months they would have stayed.',
          'SLA credits = whatever your contracts pay back when you miss the promised uptime.',
        ],
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'downtime-cost.js',
        code: `// All money in one currency, all time in minutes.
function downtimeCost({
  minutesDown,
  monthlyRevenue,
  shareOfRevenueBlocked, // 0 to 1: how much of the business stops while down
  responders,
  hourlyRate,
  hoursSpent,
  churnedMrr, // MRR of customers who leave because of this outage
  lifetimeMonths, // how long those customers would have stayed
  slaCredits = 0,
}) {
  const revenuePerMinute = monthlyRevenue / ((365.25 * 24 * 60) / 12);
  const lostRevenue = revenuePerMinute * minutesDown * shareOfRevenueBlocked;
  const labour = responders * hourlyRate * hoursSpent;
  const churn = churnedMrr * lifetimeMonths;
  const total = lostRevenue + labour + churn + slaCredits;
  return { lostRevenue, labour, churn, slaCredits, total };
}

console.log(
  downtimeCost({
    minutesDown: 120,
    monthlyRevenue: 20000,
    shareOfRevenueBlocked: 1,
    responders: 2,
    hourlyRate: 100,
    hoursSpent: 3,
    churnedMrr: 200,
    lifetimeMonths: 24,
  }),
);
// {
//   lostRevenue: 54.757...,
//   labour: 600,
//   churn: 4800,
//   slaCredits: 0,
//   total: 5454.757...
// }`,
      },
      { type: 'heading', text: 'Website downtime cost for a small SaaS' },
      {
        type: 'paragraph',
        text: 'Take the example in the code. $20,000 MRR is $0.46 a minute, so a 2-hour outage costs $55 of revenue. Two people spending 3 hours on it at $100 an hour is $600. One customer on a $200 plan who leaves instead of staying 24 more months is $4,800. Total: $5,455, and 88% of it is the churn line.',
      },
      {
        type: 'paragraph',
        text: 'That is the usual shape for subscription businesses. The outage itself is cheap. What it costs is the customer who found out before you did and decided you are not reliable. For a shop the shape flips: at $30,000 a month and checkout fully blocked, every hour down is $41 of orders that will not come back, before labour or churn.',
      },
      {
        type: 'heading',
        text: 'Cost of downtime calculator inputs most people get wrong',
      },
      {
        type: 'list',
        items: [
          'Minutes down start when users first fail, not when you first notice. With a 5-minute check, up to 5 of them are spent before anyone knows.',
          'Share blocked is rarely 1 or 0. A login outage blocks everyone, a broken export blocks almost nobody.',
          'Lifetime months for a churned customer: use 1 divided by your monthly churn rate. 4% churn means 25 months.',
          'Labour includes the evening you did not plan to work. Price it at what you would pay someone else.',
        ],
      },
      {
        type: 'comparison',
        title: 'This calculator vs a spreadsheet',
        them: 'a spreadsheet',
        rows: [
          {
            feature: 'First number for one outage',
            logdash: 'Fill in the fields, read the total',
            them: 'Build the formula first',
            winner: 'logdash',
          },
          {
            feature: 'History of every incident',
            logdash: 'Nothing is saved',
            them: 'One row per incident',
            winner: 'them',
          },
          {
            feature: 'Formula you can check',
            logdash: 'Printed on this page',
            them: 'In the cells',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'a spreadsheet',
        reasons: [
          'You want the yearly cost across every incident, or to show the trend to a co-founder or investor.',
          'Revenue splits across plans, regions or products that go down separately.',
        ],
      },
      { type: 'heading', text: 'Cut the minutes, not the price' },
      {
        type: 'paragraph',
        text: 'Minutes down is detection time plus fix time. You cannot calculate away the fix, but detection is a setting. Logdash checks every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a service in Logdash and point its monitor at the page that makes you money: checkout, login or the API.',
          },
          {
            title: 'Set the interval to your cost',
            text: 'If an hour down costs more than a month of Pro, a 15-second check pays for itself on the first incident.',
          },
          {
            title: 'Get told first',
            text: 'Break the endpoint once. The monitor flips to down on the next check and a Telegram alert lands with the status code, before the first support email.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How does a downtime cost calculator work?',
        answer:
          'The one on this page multiplies the outage length by your revenue per hour and by the hourly cost of the people fixing it. The formula below adds the share of revenue that actually stops, churned customers and SLA credits. Each input is a number you already know or can estimate in a minute.',
      },
      {
        question: 'What should a cost of downtime calculator include?',
        answer:
          'Lost revenue, staff time, churn and SLA credits. Leave out reputation as a separate line: it shows up in churn, and counting it twice inflates the total.',
      },
      {
        question: 'What is the website downtime cost for a small business?',
        answer:
          'For a $20,000 MRR SaaS a 2-hour outage is about $55 of revenue and $600 of labour. Losing a single $200 customer who would have stayed 24 months adds $4,800. Churn dominates.',
      },
      {
        question: 'What is the downtime cost formula?',
        answer:
          'Cost = revenue per minute x minutes down x share blocked + responders x hourly rate x hours + churned MRR x lifetime months + SLA credits.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'incident-postmortem-template',
    h1: 'Incident postmortem template',
    answer:
      'Copy the blameless template below into a markdown file within 48 hours of the incident, fill the timeline from your alert timestamps in UTC, and end it with at most three action items that each have an owner and a date.',
    meta: {
      title: 'Incident postmortem template, blameless | Logdash',
      description:
        'A blameless incident postmortem template in markdown, a filled-in post incident report example, and where the timeline timestamps come from.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A postmortem exists so the same outage does not happen twice. Blameless means you ask which part of the system let a reasonable person make the mistake, not who made it. Name a person and the next incident gets hidden. Name the missing lock timeout and you fix it once. The template below is short on purpose: a postmortem nobody finishes teaches nothing.',
      },
      { type: 'heading', text: 'Blameless postmortem template' },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `cat > "postmortem-$(date +%F).md" <<'EOF'
# Postmortem: <what users saw, in one line>

Date: YYYY-MM-DD | Author: <name> | Status: draft

## Summary
<Two sentences: what broke, for whom, for how long.>

## Impact
- Duration: HH:MM to HH:MM UTC (<n> minutes)
- Users affected: <number>
- Failed requests: <number, from logs>
- Cost: <refunds, credits, missed SLA>

## Timeline (UTC)
- HH:MM  Change that triggered it
- HH:MM  First failed check, alert fired
- HH:MM  Someone acknowledged
- HH:MM  Cause identified
- HH:MM  Fix shipped
- HH:MM  Monitor back up

## Root cause
<The mechanism, not the person.>

## What went well
## What went wrong
## Where we got lucky

## Action items
| Action | Owner | Due | Ticket |
|--------|-------|-----|--------|
EOF`,
      },
      { type: 'heading', text: 'How to fill in the postmortem template' },
      {
        type: 'list',
        items: [
          'Write it within 48 hours. After a week the timeline is a guess and the chat scrollback is gone.',
          'Every timestamp in UTC. Mixed time zones turn a 20-minute outage into a 2-hour one on paper.',
          'Impact in numbers: minutes, users, failed requests, money. Some users is not a number.',
          'The root cause is a mechanism. If the answer is that someone forgot, ask why the system let them.',
          'Where we got lucky is the section that finds the next outage. Write down what would have made this one worse.',
          'Three action items at most, each with an owner, a date and a ticket. Fifteen items with no owner is zero items.',
        ],
      },
      { type: 'heading', text: 'Post incident report example' },
      {
        type: 'paragraph',
        text: 'Checkout API down for 23 minutes. At 14:02 UTC a deploy ran a migration that locked the orders table, and checkout requests queued until the connection pool ran dry. At 14:03 the health check could not get a connection, the monitor flipped to down and a Telegram alert fired. 14:09 acknowledged, 14:17 migration identified, 14:25 rolled back, up alert the same minute. Impact: 412 failed checkouts, 9 refunds. Root cause: migrations run inside the deploy with no lock timeout. Actions: a 5-second lock timeout on migrations, owner Ana, due Friday; migrations as a separate step before the deploy, owner Tom, due next sprint.',
      },
      { type: 'heading', text: 'Where the timeline comes from' },
      {
        type: 'paragraph',
        text: 'The two timestamps everyone argues about are the start and the end. A Logdash monitor sends a Telegram message saying the service is down on the first failed check and another saying it is up on the first healthy one, so the chat history brackets the incident to within one check interval: 5 minutes on the free plan, 1 minute on Builder, 15 seconds on Pro. For check-level detail, a published status page returns the last 100 checks of each monitor. Run this right after you resolve, because 100 checks at one a minute is under two hours of history.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'failed checks, oldest first',
        code: `curl -s https://api.logdash.io/v1/status_pages/your-status-page-id \\
  | jq -r '.monitors[] | .name as $m | .pings[]
      | select(.statusCode < 200 or .statusCode >= 400)
      | "\\(.createdAt)  \\($m)  \\(.statusCode)  \\(.responseTimeMs)ms"'`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Point a Logdash HTTP monitor at your health endpoint. Each check stores the status code, the response time and the time it ran.',
          },
          {
            title: 'Connect Telegram',
            text: 'Attach a Telegram channel to the monitor. Every down and up message carries its own timestamp, which is the timeline you will paste later.',
          },
          {
            title: 'Rehearse the first line',
            text: 'Make the endpoint return 503. The down alert reaches Telegram on the next check. Restore it and the up alert follows. Those two messages are the first and last line of your next postmortem.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'This template plus Logdash vs incident.io',
        them: 'incident.io',
        rows: [
          {
            feature: 'Price',
            logdash: 'Free template, monitoring free for 5 services',
            them: 'Basic free, Team $19 per user a month',
            winner: 'tie',
          },
          {
            feature: 'Timeline',
            logdash: 'You assemble it from alerts and chat',
            them: 'Recorded from the Slack channel as it happens',
            winner: 'them',
          },
          {
            feature: 'First draft',
            logdash: 'You write it',
            them: 'AI draft from the incident data on Pro',
            winner: 'them',
          },
          {
            feature: 'Action items',
            logdash: 'A table you copy into your tracker',
            them: 'Follow-ups exported to Jira or Linear',
            winner: 'them',
          },
          {
            feature: 'Where it lives',
            logdash: 'A markdown file in your repo, reviewed in a PR',
            them: 'Inside incident.io',
            winner: 'logdash',
          },
          {
            feature: 'Setup for a team of one',
            logdash: 'None',
            them: 'Slack workspace, roles, workflows',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'incident.io',
        reasons: [
          'More than a handful of people respond to incidents, and they already do it in Slack.',
          'You run several incidents a month and rebuilding each timeline by hand costs hours.',
          'An auditor wants a review workflow and a trail, not a markdown file.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is a blameless postmortem template?',
        answer:
          'A postmortem template whose questions point at the system, not at people: what failed, why the system allowed it, what made it worse. It has no field for who caused it. The one above is blameless by structure, with root cause defined as a mechanism.',
      },
      {
        question: 'What goes in an incident postmortem template?',
        answer:
          'A one-line title, a two-sentence summary, impact in numbers, a UTC timeline from trigger to recovery, the root cause, what went well and badly, where you got lucky, and at most three owned action items. Anything longer rarely gets finished.',
      },
      {
        question: 'Is there a post incident report example I can copy?',
        answer:
          'Yes, the checkout example on this page: a 23-minute outage from a migration that locked the orders table, with timeline, impact, root cause and two owned actions. Replace the times and numbers with your own.',
      },
      {
        question: 'Is there a postmortem template for a small team?',
        answer:
          'This one. It fits on one page and needs no tool: one markdown file per incident in the repo. A dedicated incident platform starts paying off once several people respond to incidents every month.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'status-page-generator',
    h1: 'Status page generator',
    answer:
      'Logdash generates a status page from the uptime monitors you already run: publish the hosted page from the dashboard, or put one in your own code with the Next.js starter or a single shadcn command.',
    meta: {
      title: 'Status page generator, hosted or in your code | Logdash',
      description:
        'Publish a hosted status page from your uptime monitors, or generate one in your own code with a Next.js starter or one shadcn command. Free plan included.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A generator that only draws the page leaves the hard part to you. Something still has to call your API every minute and decide it is down, and until you wire that up the page says operational through every outage. Logdash starts from the other end. Every HTTP monitor records the status code and response time of each check, and a status page is just the list of monitors you choose to make public. The page cannot say green while the check says red, because they are the same data.',
      },
      { type: 'heading', text: 'Three ways to generate the page' },
      {
        type: 'list',
        items: [
          'Hosted. Switch on a public page in the dashboard and it lives at `logdash.io/d/<id>` straight away. One status page on the free plan, 5 on Builder at $9 a month, 15 on Pro at $15 a month. Your own domain on the hosted page needs Pro.',
          'Next.js starter. A small app with one page and one component, deployed to Vercel with one click. It renders on the server and revalidates every 60 seconds, so the page arrives complete in the HTML and runs on any domain you point at Vercel, on any Logdash plan.',
          'Component. One shadcn command copies a single file into the React or Svelte app you already have. It uses Tailwind and the shadcn CSS variables, so it takes your theme, and its only dependency is `@logdash/status`.',
        ],
      },
      { type: 'heading', text: 'Status page builder in your own code' },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `# The Next.js starter: server-rendered, revalidates every 60 seconds
npx create-next-app@latest status-page \\
  --example https://github.com/logdash-io/logdash.io \\
  --example-path templates/status-page-next
cd status-page && cp .env.example .env.local
# set LOGDASH_STATUS_PAGE_ID in .env.local, then
npm run dev

# Or add the component to an app you already have
npx shadcn add https://logdash.io/r/react/status-page.json
npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json`,
      },
      {
        type: 'paragraph',
        text: 'Both give you the same page: an overall status banner, a row per monitor with its uptime, and 90 days of daily bars with a tooltip. The data comes from one public endpoint, `GET https://api.logdash.io/v1/status_pages/:id`, with no API key and a 60-second cache. Statuses are computed on the server, so every copy of the page agrees: a monitor is down when its latest check failed and degraded when any of its last 10 did. If the API cannot be reached, the page keeps showing the last data it had instead of going blank. For developers this is a headless status page: the data is ours, the markup is yours.',
      },
      {
        type: 'paragraph',
        text: 'Wherever you generate it, host it apart from your app. People open a status page when your app is down, and a page that shares servers, deploys or DNS with the app goes down with it.',
      },
      { type: 'heading', text: 'From monitor to public page' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Paste your health URL into a new service. It is checked every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and the first check runs straight away.',
          },
          {
            title: 'Publish the page',
            text: 'Add the monitor to a status page and publish it. Share the hosted URL, or copy the id from the Build your own section into LOGDASH_STATUS_PAGE_ID for the starter.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then make the health endpoint return 503. The next check flips the monitor to down, the page follows within a few minutes, and a Telegram alert with the status code lands on your phone.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Instatus',
        them: 'Instatus',
        rows: [
          {
            feature: 'Monitors on the free plan',
            logdash: '5 services, checked every 5 minutes',
            them: '15 monitors, checked every 2 minutes',
            winner: 'them',
          },
          {
            feature: 'Status page on your own domain',
            logdash:
              'Hosted page on Pro at $15 a month, starter or component on any plan',
            them: 'Paid plans only, from Pro',
            winner: 'logdash',
          },
          {
            feature: 'Page in your own code',
            logdash: 'Next.js starter, shadcn component, typed client',
            them: 'Public JSON, you write the page',
            winner: 'logdash',
          },
          {
            feature: 'Incident updates and maintenance',
            logdash: 'None, the page shows the checks',
            them: 'Incident posts, templates, scheduled maintenance',
            winner: 'them',
          },
          {
            feature: 'Telling your customers',
            logdash: 'Nothing is sent, they open the page',
            them: '200 email subscribers free, 5,000 on Pro',
            winner: 'them',
          },
          {
            feature: 'Alerts to you',
            logdash: 'Telegram and webhook',
            them: 'Email on free, SMS from Pro',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Instatus',
        reasons: [
          'You need to write incident updates in words and schedule maintenance windows. Logdash has no incident posts at all, only check results.',
          'Customers expect to subscribe and get an email when something breaks. Logdash alerts you, never them.',
          'You want more than 5 monitors without paying. Instatus gives 15 on its free plan.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free status page generator?',
        answer:
          'Yes. The free Logdash plan covers 5 services checked every 5 minutes, one hosted status page and Telegram alerts. The Next.js starter, the shadcn component and @logdash/status are MIT licensed and free to run anywhere. Only a custom domain on the hosted page needs Pro.',
      },
      {
        question: 'Which status page maker works with Next.js?',
        answer:
          'The Logdash starter is a Next.js app: one-click Vercel deploy, server-rendered, revalidated every 60 seconds, with the component in components/status-page.tsx for you to edit. In an existing Next.js app, the shadcn command adds the same component.',
      },
      {
        question: 'Is there an open source status page creator?',
        answer:
          'Logdash is AGPL-3.0, and the starter, component and client are MIT. You can host the page yourself today. The monitoring behind it cannot be self-hosted with one command yet, so the data still comes from Logdash.',
      },
      {
        question: 'Can a status page builder use my own domain?',
        answer:
          'The hosted Logdash page takes a custom domain on Pro, $15 a month. The starter and the component run on whatever domain serves your app or your Vercel project, on any plan, because the status page API is public.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'uptime-badge-generator',
    h1: 'Uptime badge generator',
    answer:
      'The generator turns any Logdash monitor on a published status page into a live SVG badge, in classic, status or card style, and gives you the markdown or HTML to paste into a README or a site.',
    meta: {
      title: 'Uptime badge generator for README and site | Logdash',
      description:
        'Live SVG uptime and status badges for a GitHub README or a Tailwind site: classic, status or card style, 24h to 90d uptime, light or dark.',
    },
    tool: { kind: 'badge-generator' },
    blocks: [
      {
        type: 'paragraph',
        text: 'An uptime badge is an SVG the Logdash API draws from the same checks as your status page, so the badge and the page never disagree. It is recomputed at most once a minute and served with a 60-second cache. The monitor has to be on a published status page, and the snippets link the badge back to that page. An unpublished page or a monitor that is not on it answers 404. There is nothing to install: it is an image, so it works anywhere markdown or an img tag does.',
      },
      { type: 'heading', text: 'Three uptime badge styles' },
      {
        type: 'list',
        items: [
          'Classic. A 20-pixel pill in the shields shape: uptime 30d: 99.95%. The period is 24h, 7d, 30d or 90d. Its colours are fixed, so there is no theme.',
          'Status. A pill with the monitor name and its state right now: Operational, Degraded, Down or Unknown, with a pulsing dot. Light or dark. No period, because it shows the present.',
          'Card. A 120-pixel card with the name, the uptime over 90 days and one bar per day from 90 days ago to today. Light or dark.',
          'Badges carry a small Logdash mark. On Pro, the plan with custom domains, the mark is gone.',
        ],
      },
      { type: 'heading', text: 'Status badge for a GitHub README' },
      {
        type: 'paragraph',
        text: 'The URL takes three query parameters: `style` (classic by default), `period` (30d by default, read by classic only) and `theme` (light by default, read by status and card). The status page id is the last part of its public URL, and the monitor id is the `id` field of that monitor in the status page API. The README badge button on a monitor in the dashboard fills both in for you.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `PAGE="your-status-page-id"
KEY="your-monitor-id"
BADGE="https://api.logdash.io/public_dashboards/$PAGE/badges/$KEY.svg"
BADGE="$BADGE?style=classic&period=30d"

# Expect 200 and image/svg+xml before you commit it
curl -sI "$BADGE"

# Append it to the README, linked to the status page
echo "[![API uptime]($BADGE)](https://logdash.io/d/$PAGE)" >> README.md`,
      },
      {
        type: 'paragraph',
        text: 'GitHub serves README images through its own image proxy, which follows the 60-second cache header, so a fresh outage shows up on the badge within a few minutes rather than days. For a themed style in a README, the README badge dialog in the dashboard can output a picture element with a dark source instead of plain markdown.',
      },
      { type: 'heading', text: 'Status badge with shadcn and Tailwind' },
      {
        type: 'paragraph',
        text: 'shadcn themes switch dark mode with a class, not the system setting, so a picture element would ignore your toggle. Render both themes and let Tailwind pick.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'components/status-badge.tsx',
        code: `const PAGE = 'https://logdash.io/d/your-status-page-id';
const BADGE =
  'https://api.logdash.io/public_dashboards/your-status-page-id' +
  '/badges/your-monitor-id.svg?style=status';

export function StatusBadge() {
  return (
    <a href={PAGE} className="inline-flex">
      <img
        src={\`\${BADGE}&theme=light\`}
        alt="API status"
        className="h-5 dark:hidden"
      />
      <img
        src={\`\${BADGE}&theme=dark\`}
        alt="API status"
        className="hidden h-5 dark:block"
      />
    </a>
  );
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Paste your health URL. Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
          },
          {
            title: 'Publish and copy the badge',
            text: 'Add the monitor to a status page, publish it, and open README badge on the monitor. Pick a style, a period or a theme, and copy the snippet.',
          },
          {
            title: 'Watch it turn red',
            text: 'Connect Telegram and make the endpoint return 503. The status badge reads Down within a couple of minutes, and the Telegram alert with the status code has already reached you.',
          },
        ],
      },
      { type: 'heading', text: 'Uptime Kuma badge generator' },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma badges',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Where the badge is served from',
            logdash: 'The hosted Logdash API',
            them: 'Your Kuma server, up only when that box is',
            winner: 'logdash',
          },
          {
            feature: 'Badge types',
            logdash: 'Uptime, current status, 90-day card',
            them: 'Status, uptime, ping, response time, certificate expiry',
            winner: 'them',
          },
          {
            feature: 'Uptime window',
            logdash: '24h, 7d, 30d or 90d',
            them: 'Any duration you put in the URL',
            winner: 'them',
          },
          {
            feature: 'Look',
            logdash: 'Three fixed styles, light or dark',
            them: 'Five shields styles, custom labels and colours',
            winner: 'them',
          },
          {
            feature: 'Generator',
            logdash: 'This page, or README badge on each monitor',
            them: 'Badge Maker in the status page settings',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run Kuma, and the badge only has to be as available as the server it describes.',
          'You want ping, response time or certificate expiry badges. Logdash draws uptime and status only.',
          'The badge has to match shields badges next to it, with your own labels and colours.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I add an uptime badge to a README?',
        answer:
          'Publish a status page with the monitor on it, open README badge on the monitor, pick classic and a period, and paste the markdown. It is an image link to an SVG served by Logdash, so there is nothing to install or rebuild.',
      },
      {
        question: 'Is there an Uptime Kuma badge generator?',
        answer:
          'Yes. Kuma has a Badge Maker in the status page settings, for monitors on a published status page. Logdash works the same way, with the badge served from its hosted API instead of your server.',
      },
      {
        question: 'How do I add a status badge to GitHub?',
        answer:
          'Paste the badge markdown into README.md. A GitHub Actions badge shows whether a build passed, not whether production answers, so use the status style for live state or classic for uptime.',
      },
      {
        question: 'Is there a status badge for shadcn or Tailwind?',
        answer:
          'Use the status style with two img tags, one per theme, and let dark:hidden and dark:block switch them, as in the snippet above. An h-5 class keeps it at its native 20 pixels.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'cron-expression-generator',
    h1: 'Cron expression generator',
    answer:
      'The cron expression generator builds a schedule once and writes it in four dialects: classic 5-field Unix cron, 6-field cron with seconds for node-cron and Spring, Quartz, and AWS EventBridge, each with its own field order and weekday numbering.',
    meta: {
      title: 'Cron expression generator: seconds, Quartz, AWS | Logdash',
      description:
        'Generate cron expressions with seconds, for Quartz and for AWS EventBridge. What each of the 6 fields means in each dialect, and a converter you can paste.',
    },
    tool: { kind: 'cron-expression' },
    blocks: [
      {
        type: 'paragraph',
        text: 'For classic 5-field crontab, crontab.guru is the tool and has been for years. This page is for the expressions it does not read: the ones with a seconds field, Quartz with its question marks, and AWS with its year. They look alike, and a schedule copied from one into another either fails to parse or, worse, runs on the wrong day.',
      },
      {
        type: 'heading',
        text: 'Cron expression generator with 6 fields: two different sixth fields',
      },
      {
        type: 'paragraph',
        text: '"6 fields" means two different things. Quartz, Spring and node-cron add seconds at the front: second, minute, hour, day of month, month, day of week. AWS EventBridge adds a year at the end: minute, hour, day of month, month, day of week, year. Same count, shifted by one field: paste an AWS expression into Spring and every minute value becomes a second. Check which end the extra field is on before anything else.',
      },
      { type: 'heading', text: 'Cron expression generator with seconds' },
      {
        type: 'paragraph',
        text: 'node-cron takes an optional seconds field first. Spring @Scheduled requires it. Both keep Unix weekday numbers, 0 to 7, where 0 and 7 are Sunday. So `*/10 * * * * *` is every 10 seconds, and `0 0 9 * * 1-5` is 09:00 on weekdays. A plain Linux crontab rejects all of these: its smallest unit is a minute.',
      },
      { type: 'heading', text: 'Quartz cron expression generator' },
      {
        type: 'list',
        items: [
          'Fields: second, minute, hour, day of month, month, day of week, and an optional year.',
          'Weekdays are 1 to 7 from Sunday. 1 is Sunday, 2 is Monday. Unix `1-5` becomes Quartz `2-6`, or `MON-FRI`, which never drifts.',
          'One of the two day fields must be `?`. Unix `0 9 * * 1-5` is Quartz `0 0 9 ? * MON-FRI`.',
          'Extras: `L` for last, `W` for nearest weekday, `#` for nth weekday. `6#3` is the third Friday.',
        ],
      },
      {
        type: 'heading',
        text: 'AWS cron expression generator for EventBridge',
      },
      {
        type: 'list',
        items: [
          'Wrapped as `cron(minutes hours day-of-month month day-of-week year)`. Six fields, no seconds.',
          'Weekdays are 1 to 7 from Sunday, like Quartz. Same `?` rule: `cron(0 9 * * * *)` fails, `cron(0 9 * * ? *)` runs daily.',
          'Legacy EventBridge rules always run in UTC. EventBridge Scheduler takes a time zone.',
          'Nothing faster than once a minute.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The same conversion as a function you can paste into Node:',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'convert-cron.js',
        code: `// 5-field Unix cron in, seconds / Quartz / AWS out.
function convert(unix) {
  const [min, hour, dom, month, dow] = unix.trim().split(/\\s+/);
  if (dom !== '*' && dow !== '*') {
    throw new Error('Quartz and AWS cannot OR the day fields');
  }
  if (/-7\\b/.test(dow)) throw new Error('Write Sunday as 0 in a range');

  // Unix weekdays 0-7 (0 and 7 = Sunday) become 1-7 from Sunday.
  const weekday = dow.replace(/\\d+/g, (d) => String((Number(d) % 7) + 1));
  const days =
    dow === '*'
      ? \`\${dom.replace(/^\\*\\//, '1/')} \${month} ?\`
      : \`? \${month} \${weekday}\`;
  const time = [min, hour].map((f) => f.replace(/^\\*\\//, '0/')).join(' ');

  return {
    seconds: \`0 \${unix.trim()}\`, // node-cron, Spring @Scheduled
    quartz: \`0 \${time} \${days}\`,
    aws: \`cron(\${time} \${days} *)\`,
  };
}

console.log(convert('0 9 * * 1-5'));
// {
//   seconds: '0 0 9 * * 1-5',
//   quartz: '0 0 9 ? * 2-6',
//   aws: 'cron(0 9 ? * 2-6 *)'
// }`,
      },
      {
        type: 'comparison',
        title: 'Logdash vs crontab.guru',
        them: 'crontab.guru',
        rows: [
          {
            feature: 'Classic 5-field crontab',
            logdash: 'Yes',
            them: 'Yes, and the reference everyone links',
            winner: 'tie',
          },
          {
            feature: 'Seconds, Quartz and AWS dialects',
            logdash: 'All three, converted from one schedule',
            them: '5 fields only',
            winner: 'logdash',
          },
          {
            feature: 'Monitoring a nightly job',
            logdash:
              'Push monitors expect a ping every check, 15 seconds on Pro',
            them: 'Cronitor, from the same team, watches any schedule',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'crontab.guru',
        reasons: [
          'Your schedule lives in a Linux crontab or a GitHub Actions workflow. Both use 5 fields and crontab.guru reads them best.',
          'You need to know when a job that runs hourly or nightly did not run. Cronitor checks each run against its schedule. Logdash push monitors do not.',
        ],
      },
      { type: 'heading', text: 'Know when the scheduler dies' },
      {
        type: 'paragraph',
        text: 'A seconds field is useful for one thing in monitoring: a heartbeat from a worker or scheduler process that should never stop.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'heartbeat.js',
        code: `import cron from 'node-cron';

cron.schedule('*/10 * * * * *', async () => {
  await fetch('https://api.logdash.io/ping/<monitorId>', { method: 'POST' });
});`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'On Pro, add a push monitor to the service and copy its id. The ping URL is public: no auth header, no body.',
          },
          {
            title: 'Start the heartbeat',
            text: 'Run the snippet inside the worker. Pro evaluates push monitors every 15 seconds, and a ping every 10 lands in every window.',
          },
          {
            title: 'Kill the process',
            text: 'Stop the worker. Within 30 seconds a check window passes with no ping, the monitor flips to down, and a Telegram alert arrives naming it.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question:
          'Cron expression generator 6 fields: is the sixth field seconds or year?',
        answer:
          'Depends on the scheduler. Quartz, Spring and node-cron put seconds first. AWS EventBridge puts year last. Read the field order in the docs before you paste.',
      },
      {
        question:
          'Cron expression generator with seconds: which schedulers accept it?',
        answer:
          'node-cron (optional), Spring @Scheduled (required) and Quartz (required). Linux crontab, GitHub Actions and AWS EventBridge stop at minutes.',
      },
      {
        question:
          'Quartz cron expression generator: why does it need a question mark?',
        answer:
          'Quartz cannot combine a day-of-month and a day-of-week value, so one of them must be ?, meaning no specific value. Every day at 09:00 is 0 0 9 * * ?.',
      },
      {
        question:
          'AWS cron expression generator: why does cron(0 9 * * * *) fail?',
        answer:
          'EventBridge does not allow * in both day fields. Put ? in one of them: cron(0 9 * * ? *) runs every day at 09:00, in UTC unless your Scheduler schedule sets a time zone.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const tools: SeoFamilyData = {
  family: toolsFamily,
  pages: toolsPages,
};
