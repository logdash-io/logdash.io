import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family C. The intent is "write the endpoint", not "pick a tool", so every
 * page leads with framework code and only then points a monitor at it.
 *
 * The hub carries article blocks of its own because "health check endpoint
 * best practices" is a query in its own right, unlike the alternatives hub
 * which is only a list.
 */
export const healthCheckFamily: SeoFamily = {
  key: 'health-check',
  hubPath: '/health-check',
  hubLabel: 'All health check guides',
  title: 'Health check endpoint best practices | Logdash',
  description:
    'What a health endpoint should actually check, what it should return, and the code for it in fourteen frameworks.',
  intro:
    'One page per framework, each with the endpoint code and the monitor that watches it.',
  hub: {
    h1: 'Health check endpoint best practices',
    answer:
      'A health check endpoint should test the dependencies a real request needs, usually one cheap database query, and answer in under a second with 200 when the service can serve traffic and 503 when it cannot.',
    meta: {
      title: 'Health check endpoint best practices | Logdash',
      description:
        'What a health endpoint should check, what it must never check, why it returns 503 and not 500, and how to point a monitor at it in three steps.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most health endpoints return a hardcoded 200 from inside the process. That proves one thing: the process is running and the HTTP server accepted a connection. It says nothing about the database being reachable, the connection pool having a free slot, or the migration from the last deploy having finished. So the monitor stays green while every real request returns 500, and you hear about the outage from a customer.',
      },
      {
        type: 'paragraph',
        text: 'One rule fixes this and the rest of the page is detail: a health check should fail for the same reasons a real request fails. Not more, not fewer. An endpoint that cannot go down is not a health check, it is a decoration.',
      },
      { type: 'heading', text: 'What to check' },
      {
        type: 'list',
        items: [
          'The database, with one cheap query. A select 1 is enough. It proves the pool handed out a connection and the server answered. It must never scan a table.',
          'The cache or queue the request path cannot work without. Usually Redis. A ping, not a read.',
          'Anything local the process would fail without: a writable upload directory, a secret loaded at boot.',
          'That is the list. Check what a request needs, the cheapest way that would still catch a real failure, and stop.',
        ],
      },
      { type: 'heading', text: 'What not to check' },
      {
        type: 'list',
        items: [
          "Third-party APIs you do not control. Stripe having a bad afternoon is not your service being down. A check that fails on it pages you at 4am for someone else's outage while your app serves traffic fine.",
          'Every downstream microservice. Chained health checks turn one slow neighbour into a fleet-wide red board, then into a restart storm worse than the outage you started with.',
          'Anything billed per call. A monitor is thousands of requests a day, forever. A health check should not arrive with an invoice.',
          "Anything slow. Every dependency you add is another second of latency and another way to trip your monitor's timeout.",
          'The deep version. If you want a full dependency audit, put it behind a separate path and run it on demand, not on every check.',
        ],
      },
      { type: 'heading', text: 'Status codes' },
      {
        type: 'paragraph',
        text: 'Return 200 when the service can serve traffic and 503 when it cannot. That is the whole contract. Not 500, which reads as the check crashing rather than the service being unavailable. And not a 200 carrying an unhealthy field in the body, because most uptime monitors and every load balancer read the status line and nothing else, so a 200 with a sad body is an outage nobody hears about. Logdash flips a monitor to down on any status outside 200-399 and sends the alert on the transition, so the status line is heard and the body is not.',
      },
      {
        type: 'heading',
        text: 'Liveness and readiness are different questions',
      },
      {
        type: 'paragraph',
        text: 'Liveness asks whether the orchestrator should kill this process. Readiness asks whether traffic should be routed to it. Different questions, and not the same endpoint. A pod whose database is unreachable is not broken - restarting it brings nothing back - so it fails readiness and passes liveness. A pod that has deadlocked should fail liveness. Kubernetes wants both: one path proving the event loop still turns, another checking the dependencies. An external uptime monitor wants readiness, because it asks the same question your users ask.',
      },
      { type: 'heading', text: 'The two responses' },
      {
        type: 'code',
        language: 'bash',
        code: `curl -sS -o /dev/null -w '%{http_code} in %{time_total}s\\n' \\
  https://api.example.com/health

# healthy: the database answered, keep sending traffic
# 200 in 0.084s

# unhealthy: the database did not, take me out of rotation
# 503 in 0.096s`,
      },
      { type: 'heading', text: 'Practical rules' },
      {
        type: 'list',
        items: [
          'Keep it under a second. The Logdash pinger gives up after 10 seconds and records the check as down, so an endpoint that waits on a slow dependency invents its own outage. One cheap query, a short timeout, no retries.',
          'Keep the body boring. No version numbers, no environment names, no hostnames, no connection strings, no stack traces. A public endpoint that lists your stack is free reconnaissance. One ok field is a complete answer.',
          'Do not authenticate it if an external monitor has to reach it. An auth flow is one more thing that breaks and wakes you for nothing. Put it on a boring path instead.',
          "Send Cache-Control: no-store. A CDN, a reverse proxy or a framework's static optimiser will happily cache one 200 and keep serving it for an hour after the service died.",
          'Pick one path and never move it. The path /health is the safe guess. Write it in the README, because the person wiring up the monitor at 2am is not always you.',
          'Exclude it from request logs and rate limits, or the check will drown the log volume you need during an incident.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a project in Logdash and give it the address of the endpoint you just wrote. One HTTP monitor per project, five projects on the free plan. Every check records the status code and response time, so the latency chart fills itself in.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Choose the gap you can live with. At 15 seconds that is 5,760 checks a day, which is the real reason to keep the query cheap.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database and leave the process running. The endpoint should start returning 503, the monitor should flip to down on the next check, and a Telegram alert should land naming the endpoint and the status code. If nothing arrives, you found the bug today instead of during the outage.',
          },
        ],
      },
    ],
    faq: [
      {
        question: 'What path should a health check endpoint use?',
        answer:
          'The path /health is the convention and the one anyone will guess first. Kubernetes setups tend to use /healthz for liveness and /readyz for readiness. Any of them works as long as it is stable, reachable without auth, and written down somewhere. The path matters far less than never moving it.',
      },
      {
        question: 'What status code should a health check return?',
        answer:
          '200 when the service can serve traffic, 503 when it cannot, and nothing else. 500 reads as the check itself crashing, and a 200 with an unhealthy body is read as healthy by every load balancer and most monitors, including Logdash, which flips to down on any status outside 200-399.',
      },
      {
        question: 'Should a health check hit the database?',
        answer:
          'Yes, with one cheap query such as select 1. A service that cannot reach its database cannot serve requests, so a check that skips it stays green through the exact outage you most want to hear about. Do not query a real table: you are testing the connection, not the data.',
      },
      {
        question: 'Should a health check endpoint be authenticated?',
        answer:
          'Not if an external uptime monitor has to reach it. Authentication is one more moving part that can fail and wake you up for nothing. Keep versions, hostnames and config out of the body and the endpoint is dull enough to leave open. If policy demands it, use a static header token the monitor can send.',
      },
      {
        question: 'How often should a health check run?',
        answer:
          'As often as the delay you can tolerate. A 5-minute interval means up to 5 minutes of downtime before anyone knows; one minute suits most side projects; 15 seconds is for anything taking payments. Logdash checks every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
      },
    ],
  },
};

export const healthCheckPages: SeoPage[] = [
  {
    slug: 'nextjs',
    h1: 'Health check endpoint in Next.js',
    answer:
      'Create app/api/health/route.ts with a GET handler that runs one cheap query against your database, returns 200 when it succeeds and 503 when it throws, and add export const dynamic = "force-dynamic" so the response is never served from a cache.',
    meta: {
      title: 'Next.js health check endpoint | Logdash',
      description:
        'The App Router health route in full: a GET handler in app/api/health/route.ts, one select 1 against the database, a 503 on failure, and no caching.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A health endpoint exists so something outside your app can ask one question and get an honest answer: can this instance serve a request right now. The Next.js server is a poor judge of that on its own. It stays up and keeps rendering long after the database has stopped accepting connections, so a route that returns ok: true unconditionally will report green for the entire length of an outage while your users stare at 500s.',
      },
      {
        type: 'paragraph',
        text: 'That is why the handler has to touch the thing it cannot work without. One query that reads nothing, select 1, and a 503 when it throws. Logdash flips a monitor to down on any status code outside 200 to 399 and fires the alert on that transition, so the 503 is not decoration - it is the entire mechanism by which the route becomes a page you get woken up by.',
      },
      { type: 'heading', text: 'The route handler' },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/api/health/route.ts',
        code: `import { db } from '@/lib/db';

// Never prerender or cache a health check.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute('select 1');
    return Response.json({ ok: true });
  } catch {
    // 503: the process is alive, the app is not servable.
    return Response.json({ ok: false, error: 'db' }, { status: 503 });
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Two details in that handler are deliberate. The query is the cheapest one the driver can send, so a check costs a connection and a round trip and nothing more. And the failure body has two fields, because the only consumer that matters never opens it.',
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'The database, with a query that reads no rows. A count over a real table is a load test you would then be running every 5 minutes forever.',
          'Anything a request genuinely cannot complete without: Redis if sessions live there, the queue if the handler enqueues work.',
          'Nothing you do not own. A health route that calls Stripe hands Stripe the ability to wake you at 3am about an outage you cannot fix.',
          'Under a second, end to end. The Logdash pinger gives up after 10 seconds and records the check as down, and a route with a slow query is slowest exactly when the system is already in trouble.',
          'No commit hash, no environment dump, no dependency versions. The URL is public and the monitor only ever reads the status code.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a project in Logdash and give the monitor https://yourapp.com/api/health. The first check runs straight away, so a wrong path shows up in the next few seconds rather than during an incident.',
          },
          {
            title: 'Choose the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check records the status code and the response time, so the latency chart builds itself with no extra work.',
          },
          {
            title: 'Break it before production does',
            text: 'Stop the database and leave the app running. The route starts returning 503, the monitor flips to down on the next check, and a Telegram alert arrives naming the endpoint and the code it got back.',
          },
        ],
      },
      { type: 'heading', text: 'The Next.js trap: a cached health check' },
      {
        type: 'paragraph',
        text: 'Since Next.js 15, GET route handlers are dynamic by default, and force-dynamic is belt and braces. On 13 and 14 it was the opposite: a GET handler with no request-time API in it got prerendered at build, so the health route was frozen to whatever it returned on the build machine and answered 200 forever, including through outages that lasted days. Keep the export. It is one line and it survives an upgrade in either direction. Watch the CDN as well, since a health URL that Vercel or Cloudflare can answer from cache is a URL your monitor has stopped measuring. On the Pages Router none of this applies, because API routes always run per request.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'pages/api/health.ts',
        code: `import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await db.execute('select 1');
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'db' });
  }
}`,
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the default health check path in Next.js?',
        answer:
          'There is not one. Next.js ships no health route, so you write it yourself and the convention people land on is /api/health, which is app/api/health/route.ts on the App Router and pages/api/health.ts on the Pages Router.',
      },
      {
        question: 'What status code should a Next.js health check return?',
        answer:
          '200 when the app can serve traffic and 503 when it cannot. Logdash treats anything outside 200 to 399 as down, so a 503 is what turns a broken dependency into an alert. Do not return 200 with an error field in the body - nothing reads the body.',
      },
      {
        question:
          'What is the difference between a Kubernetes liveness and readiness probe for Next.js?',
        answer:
          'Liveness asks whether the process should be restarted, so it checks nothing external - a plain 200 is right. Readiness asks whether this pod should receive traffic, so that is the one that runs select 1 and returns 503. Point liveness at a bare route and readiness at /api/health, or a database blip will restart every pod at once.',
      },
      {
        question: 'What health check path should I set for Next.js on ECS?',
        answer:
          'Set the ALB target group health check path to /api/health and widen the success matcher if you have narrowed it, because a 503 has to read as a failure and a 200 as a pass. Keep the container health check separate and cheap so ECS is not restarting tasks over a database that is briefly slow.',
      },
      {
        question: 'Should the health endpoint be authenticated?',
        answer:
          'Leave it open. An auth check in front of it means the monitor needs a credential, and a rotated token then reads as an outage. Keep the body to one boolean instead, and put anything detailed behind a second, authenticated route.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'express',
    h1: 'Express health check endpoint',
    answer:
      'Add a route that answers 200 when the process is up and a second one that runs select 1 against your database and answers 503 when the query fails, then point a monitor at the second one.',
    meta: {
      title: 'Express health check endpoint | Logdash',
      description:
        'Liveness and readiness routes for Express, why the readiness one has to touch the database and return 503, and how to monitor it every 5 minutes.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Two different questions get answered by the same endpoint in most Express apps, which is why so many health checks are useless. The first question is whether the process is alive: did Node crash, did the event loop wedge, is anything listening on the port. The second is whether the app can actually serve a request, which depends on a database, and sometimes a cache or a queue as well.',
      },
      {
        type: 'paragraph',
        text: 'An app answers the first question and fails the second more often than the other way round. The pool is exhausted, the credentials rotated, the database failed over and DNS has not caught up - Express keeps listening the whole time and cheerfully returns 200 to a monitor that then reports a perfect month. Split the two. Give the liveness route to your orchestrator and the readiness route to your uptime monitor, and make readiness return 503 the moment the query throws, because 503 is what Logdash reads as down.',
      },
      { type: 'heading', text: 'Both routes' },
      {
        type: 'code',
        language: 'javascript',
        title: 'routes/health.js',
        code: `import { Router } from 'express';
import { pool } from '../db.js';

export const health = Router();

// Liveness: the process answered. Nothing else is claimed.
health.get('/healthz', (req, res) => res.status(200).send('ok'));

// Readiness: the process can serve a real request.
health.get('/readyz', async (req, res) => {
  try {
    await pool.query('select 1');
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, dependency: 'postgres' });
  }
});`,
      },
      {
        type: 'paragraph',
        text: 'Mount that router before anything that can reject a request. Auth middleware, rate limiting and a strict CORS policy will all happily block a monitor, and the resulting alert is indistinguishable from a real outage until you have wasted twenty minutes on it. If the app depends on more than one thing, run the checks with Promise.all and fail on the first rejection, because a readiness route that reports partial health is a route nobody knows how to act on.',
      },
      { type: 'heading', text: 'Rules that keep it honest' },
      {
        type: 'list',
        items: [
          'Mount the routes before any auth middleware, or the monitor gets a 401 and you spend an evening debugging an outage that never happened.',
          'Query nothing real. select 1 proves the pool can hand out a connection, which is the only thing you need to know.',
          'Do not chain a call to every downstream service. Each one you add is a service whose bad night becomes your pager.',
          'Budget under a second. The Logdash pinger times out at 10 seconds and files that as down, and a health route sharing an exhausted pool is the slowest route you have.',
          'Return a boolean, not a report. Stack traces and env values in a public JSON body are a gift to anyone scanning your domain.',
        ],
      },
      { type: 'heading', text: 'Watch it from outside' },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the monitor',
            text: 'Add a project in Logdash and paste https://api.yourapp.com/readyz. The check runs immediately and stores the status code and response time from that first request.',
          },
          {
            title: 'Set how often it runs',
            text: 'Free plans check every 5 minutes and cover five projects, Builder drops to every minute and Pro to every 15 seconds. Pick the gap you are willing to be down for without knowing.',
          },
          {
            title: 'Prove the alert path works',
            text: 'Stop your database container while the API keeps running. Within one interval the monitor goes down and Telegram delivers the alert with the failing URL and the 503 in it.',
          },
        ],
      },
      { type: 'heading', text: 'Response time is data, not an alarm' },
      {
        type: 'paragraph',
        text: 'Logdash records how long every check took and charts it, and that chart is genuinely useful for spotting the slow drift that precedes a real failure. It does not alert on it. Nothing fires until a check returns a status outside 200 to 399 or fails outright, so if you want slowness to page you, make the endpoint itself decide: time the query, and return 503 when it crosses the threshold you actually care about. That is a better design anyway, because the app knows what slow means for its own dependencies and a monitor sitting on the other side of the internet does not. The same uptime history feeds a public status page, so the readiness route ends up being the single fact your customers, your orchestrator and your phone all read from.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the standard health check endpoint for Express?',
        answer:
          'Express has no built-in route, so it is whatever you write. /health is the common name, and /healthz plus /readyz is the split you want once Kubernetes or a load balancer is involved, because those two callers are asking different questions.',
      },
      {
        question: 'Should the Express health check query the database?',
        answer:
          'The readiness one should, with a single select 1. The liveness one should not, because a database outage would then restart every container you have and turn a recoverable problem into a cold start under load.',
      },
      {
        question: 'What should an Express health check return when it fails?',
        answer:
          '503 with a tiny JSON body. Logdash marks the monitor down on anything outside 200 to 399 and alerts on the transition, so a 500 works too, but 503 is the accurate one: the service exists and is temporarily unable to handle the request.',
      },
      {
        question: 'Does the health endpoint need authentication?',
        answer:
          'No, and adding it usually backfires. The route returns a boolean and nothing else, so there is nothing to protect, while an expired monitor credential would look exactly like a real outage.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'sveltekit',
    h1: 'SvelteKit health check endpoint',
    answer:
      'Create src/routes/health/+server.ts, export a GET handler that runs one query and returns json({ ok: true }) or a 503 when the query throws, and set export const prerender = false so the route is built as a real endpoint.',
    meta: {
      title: 'SvelteKit health check endpoint | Logdash',
      description:
        'A +server.ts health route for SvelteKit with a database check, a 503 on failure, prerender switched off, and a monitor watching it from outside.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The value of a health route is entirely in what it refuses to say. Returning 200 because the handler ran is worth almost nothing: the Node adapter will happily serve that response from a box whose database credentials expired an hour ago. What you want is a route that goes quiet the moment the app stops being able to do its job, so that the monitor watching it has something real to react to.',
      },
      {
        type: 'paragraph',
        text: 'One query is enough to get there. Run select 1 through whatever client your load functions use, return json({ ok: true }) when it comes back, and return a 503 when it throws. That status code is the contract with everything downstream - Logdash counts 200 to 399 as up and anything else as down, and alerts on the moment the state changes, so the 503 is what converts a dead connection pool into a message on your phone.',
      },
      { type: 'heading', text: 'The endpoint' },
      {
        type: 'code',
        language: 'typescript',
        title: 'src/routes/health/+server.ts',
        code: `import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async () => {
  try {
    await db.execute('select 1');
    return json({ ok: true });
  } catch {
    // Second argument is a ResponseInit, same as new Response().
    return json({ ok: false, error: 'db' }, { status: 503 });
  }
};`,
      },
      {
        type: 'paragraph',
        text: 'Two things are worth copying from that file beyond the query. The handler imports from $lib/server, which keeps the database client out of any bundle that could reach the browser and makes SvelteKit shout at you if it ever does. And it uses the same client your load functions use, rather than opening a fresh connection, so the check exercises the pool that real traffic depends on. A health route with its own private connection can pass while every page on the site is queued behind an exhausted pool.',
      },
      { type: 'heading', text: 'Keep the check small' },
      {
        type: 'list',
        items: [
          'One dependency check per thing the app cannot serve without, and no more. Two queries and a Redis ping is a full health check for most apps.',
          'Do not call your own API routes from it. You end up measuring your own HTTP stack twice and doubling the chance of a false alarm.',
          'Skip third-party APIs entirely. Their downtime is real, it is just not something an alert to you can fix at 3am.',
          'Stay under a second. Logdash abandons a request after 10 seconds and records it as down, which is correct behaviour but a confusing way to learn your query is slow.',
          'Return json({ ok: true }) and stop. Build hashes and adapter details in a public response body help attackers more than they help you.',
        ],
      },
      { type: 'heading', text: 'Monitor it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the endpoint',
            text: 'Create a project in Logdash and enter https://yourapp.com/health. The first check fires on save, which is when a typo in the route path is cheap to find.',
          },
          {
            title: 'Pick the check interval',
            text: 'Free is every 5 minutes across five projects, Builder is every minute, Pro is every 15 seconds. The response time from each check lands on a chart next to the uptime history.',
          },
          {
            title: 'Trigger a real failure',
            text: 'Point DATABASE_URL somewhere that does not exist and restart the app. The endpoint answers 503, the monitor turns red, and the Telegram alert arrives with the URL and status code in the message.',
          },
        ],
      },
      { type: 'heading', text: 'Prerendering will lie to you' },
      {
        type: 'paragraph',
        text: 'If prerender is switched on globally in src/routes/+layout.ts, or you are on adapter-static, SvelteKit will try to render this endpoint at build time and bake the response into a file. The build machine has no database, so you either get a build error or, worse, a permanently cached 200 sitting on a CDN answering every check for the next six months. Setting prerender = false in the file itself makes the route dynamic whatever the layout says, and it is one line you will not have to remember when you swap adapters. Worth knowing where the endpoint actually runs, too: on adapter-node it runs in your process and a database check means something, while on a serverless adapter each check may hit a cold function, which is a real number but not the one you thought you were measuring.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Where do I put a health check route in SvelteKit?',
        answer:
          'src/routes/health/+server.ts, which serves GET /health. Any path works, so if the app already owns /health for something else, src/routes/api/health/+server.ts is the usual second choice.',
      },
      {
        question: 'Should I use json() or new Response() in +server.ts?',
        answer:
          'json() from @sveltejs/kit, since it sets the content type and takes a ResponseInit as its second argument, which is where the 503 goes. new Response("ok") is fine if the body is a plain string and you set the status yourself.',
      },
      {
        question: 'Why does my SvelteKit health check need prerender = false?',
        answer:
          'Because a prerendered endpoint is a static file. It runs once on a build machine with no database, then serves that same answer to every monitor forever, which is the exact failure mode a health check exists to prevent.',
      },
      {
        question: 'What status code should the SvelteKit health route return?',
        answer:
          '200 when the query succeeds, 503 when it does not. Logdash marks a monitor down on any status outside 200 to 399, so a correct 503 is the difference between an alert and a green dashboard during an outage.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'nuxt',
    h1: 'Nuxt health check endpoint',
    answer:
      'Add server/api/health.get.ts with a defineEventHandler that runs one query, returns a small object on success, and calls setResponseStatus(event, 503) before returning when the query throws.',
    meta: {
      title: 'Nuxt health check endpoint | Logdash',
      description:
        'A Nitro health route for Nuxt: server/api/health.get.ts, defineEventHandler, a database check, setResponseStatus for the 503, and a monitor on top.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Nitro makes the endpoint itself trivial. Drop a file in server/api, export a handler, return an object, and Nuxt serialises it to JSON with a 200. That convenience is also the problem: the default path through the framework produces exactly the health check that cannot tell you anything, because returning an object is something a completely broken app does just as easily as a healthy one.',
      },
      {
        type: 'paragraph',
        text: 'Make the handler earn the 200. Run one query against the database - select 1, no rows, no joins - and if it throws, set the status to 503 before you return. Everything watching the endpoint keys off that number. A Logdash monitor treats 200 to 399 as up and everything else as down, and sends the alert on the transition, so an endpoint that never returns anything but 200 is an endpoint that can never alert.',
      },
      { type: 'heading', text: 'The Nitro handler' },
      {
        type: 'code',
        language: 'typescript',
        title: 'server/api/health.get.ts',
        code: `import { db } from '~/server/utils/db';

// defineEventHandler and setResponseStatus are auto-imported by Nitro.
export default defineEventHandler(async (event) => {
  try {
    await db.execute('select 1');
    return { ok: true };
  } catch {
    // Without this the body below still goes out as a 200.
    setResponseStatus(event, 503);
    return { ok: false, error: 'db' };
  }
});`,
      },
      {
        type: 'paragraph',
        text: 'The order of the two lines in the catch block is the part people get wrong. setResponseStatus mutates the response that Nitro is about to send, so it has to run before the handler returns; call it after and there is nothing left to mutate. The other common mistake is returning the caught error itself for debugging. Nitro will serialise it, and a driver error object carries the host, the port and sometimes the user from your connection string out to a public URL.',
      },
      { type: 'heading', text: 'What belongs in the check' },
      {
        type: 'list',
        items: [
          'The database, and the cache only if a request fails without it. Everything else is noise you will eventually mute.',
          'No fan-out to payment providers, mail APIs or a sibling service. Their outage becomes your alert, and you have no lever to pull.',
          'A hard ceiling of one second. Logdash gives up on a request at 10 seconds and files it as down, so a slow health route reads as a dead app.',
          'Nothing revealing in the body. Nitro will serialise whatever object you hand it, including an error object with a connection string in it.',
          'One route, not one per dependency. A monitor watches one URL, and a single 503 is enough to get you looking.',
        ],
      },
      { type: 'heading', text: 'Put a monitor on it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Register the URL',
            text: 'Create a project in Logdash and add https://yourapp.com/api/health. The first check runs on save and records both the status code and how long the request took.',
          },
          {
            title: 'Choose the frequency',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Response times are charted from every check, and the uptime history is public if you turn on a status page.',
          },
          {
            title: 'Fail it deliberately',
            text: 'Shut the database down and leave Nuxt running. The handler starts returning 503, the monitor flips to down, and the Telegram alert lands naming the endpoint and the status code it saw.',
          },
        ],
      },
      { type: 'heading', text: 'Nitro will cache anything you let it' },
      {
        type: 'paragraph',
        text: 'Check your routeRules in nuxt.config before you trust any of this. A broad rule such as "/api/**" with swr or isr set will serve a stored copy of the last successful response, and a cached 200 is worse than having no health check at all, because it looks like it is working. Exclude the health path explicitly rather than assuming a per-request handler cannot be cached. The same applies to any CDN or reverse proxy in front of Nuxt: a health URL that something else can answer is a health URL your monitor has stopped measuring. Curl it once from outside your network after every deploy that touches routing, and read the status line rather than the body, since the body is the part that lies most convincingly.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Where does a health check go in a Nuxt app?',
        answer:
          'server/api/health.get.ts, which Nitro serves at GET /api/health. The .get suffix restricts it to GET, so anything else on that path gets a 405 instead of running your query.',
      },
      {
        question: 'How do I return a 503 from a Nuxt server route?',
        answer:
          'Call setResponseStatus(event, 503) and then return your body. Throwing createError works too and is the right tool for genuine errors, but setResponseStatus keeps the response body yours, which matters when something other than a monitor reads it.',
      },
      {
        question: 'Should the Nuxt health endpoint check the database?',
        answer:
          'Yes, with one query that touches no rows. A Nuxt server can serve pages fine while the database refuses connections, and a health check that skips the query will report up through all of it.',
      },
      {
        question: 'Does the health endpoint need to be protected?',
        answer:
          'No. Keep it public and keep the body to a boolean. An auth layer in front of it just means a rotated key can take your monitoring down while the app is perfectly healthy.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'nestjs',
    h1: 'NestJS health check endpoint with Terminus',
    answer:
      'Install @nestjs/terminus, inject HealthCheckService and TypeOrmHealthIndicator into a /health controller, and the endpoint returns 200 while every indicator is up and 503 the moment one goes down.',
    meta: {
      title: 'NestJS health check endpoint | Logdash',
      description:
        'The Terminus controller, the version without the package, what to check and what to leave out, and how to point a monitor at the 503 once it works.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A health endpoint answers one question: can this instance serve a real request right now. A controller returning a hardcoded ok answers a different one, which is whether the Node process is still accepting sockets, and sockets are almost never what break. The database is. Postgres restarts, the pool never recovers, every real route starts throwing 500s, and the health route, which touches nothing, keeps answering 200 in three milliseconds. A monitor reads the status code and nothing else, so it stays green for the whole outage.',
      },
      {
        type: 'paragraph',
        text: 'Logdash flips a monitor to down on any status code outside 200-399 and fires the alert on that transition. That is the whole contract, and it puts the burden on your endpoint. A correct 503 is what turns the route into an alert. A 200 from a process that cannot reach its database turns your monitoring into decoration you trust a little less every month.',
      },
      { type: 'heading', text: 'The Terminus controller' },
      {
        type: 'paragraph',
        text: 'The @nestjs/terminus package is the idiomatic answer, and it earns its place because the failure mapping is already right. HealthCheckService.check runs your indicators, returns the aggregate when they pass, and throws ServiceUnavailableException the moment one reports down, which Nest serialises as a 503 naming the failing indicator.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'health/health.controller.ts',
        code: `import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Import TerminusModule into the module that declares the controller. pingCheck runs a driver-level ping through the TypeORM connection, so it costs about what SELECT 1 costs and fails when the pool is exhausted or the host is unreachable. Swap in PrismaHealthIndicator, MongooseHealthIndicator, SequelizeHealthIndicator or MikroOrmHealthIndicator depending on what you run.',
      },
      { type: 'heading', text: 'Without the package' },
      {
        type: 'paragraph',
        text: 'If you would rather not add a dependency, the hand-rolled version is fifteen lines. Throw ServiceUnavailableException rather than reaching for the raw response object, so Nest keeps serialisation and your exception filters still apply.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'health/health.controller.ts, without Terminus',
        code: `import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      // 503, so a live process with a dead pool reads as down
      throw new ServiceUnavailableException({ status: 'down', db: 'unreachable' });
    }

    return { status: 'ok' };
  }
}`,
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'The database, with one cheap query. A ping through the pool you already hold proves the pool is alive, which is the failure you are trying to catch.',
          'Redis or the queue only if a request that cannot reach them fails. A cache miss that degrades to a slower response is not a reason to pull the instance out of rotation.',
          'Nothing that calls a third-party API. A payment provider having a bad afternoon should not take your monitor down with it.',
          'Keep the handler under a second. The Logdash pinger gives up after 10 seconds and records the check as down, and anything close to that is already too slow to trust.',
          'No connection strings, no environment names, no build SHA in the body. The endpoint is public unless you guard it, and Terminus prints whatever keys you hand it.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Prove the 503 by hand',
            text: 'Run curl -i https://yourapp.com/health and read the status line, then stop the database and run it again. If the second call is not a 503, the monitor you are about to create cannot help you.',
          },
          {
            title: 'Create the monitor',
            text: 'Add an HTTP monitor on that URL. Logdash records the status code and the response time on every check: every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database again and wait one interval. The monitor flips to down and a Telegram alert arrives naming the endpoint and the status code, which is how you learn your alerting works before an outage does.',
          },
        ],
      },
      { type: 'heading', text: 'Degraded still returns 200' },
      {
        type: 'paragraph',
        text: 'Terminus has three indicator outcomes, not two. An indicator can report up, degraded or down, and only down produces the 503. Degraded leaves the HTTP status at 200, so no external monitor will ever see it. If a degraded dependency means you cannot serve traffic, report it down and take the alert. Terminus also answers 503 while the app shuts down, so a check landing mid-deploy registers as a short blip.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What path should the NestJS health check endpoint use?',
        answer:
          'Use /health. It is what Kubernetes examples, load balancer defaults and most monitoring tools assume, and a Nest controller decorated with @Controller("health") gives you exactly that with no route prefix work.',
      },
      {
        question: 'How do I add a Redis health check in NestJS?',
        answer:
          'Inject MicroserviceHealthIndicator and call pingCheck<RedisOptions>("redis", { transport: Transport.REDIS, options: { host, port } }). It opens a client, connects and closes it, with a 1 second default timeout. Only add it if a request that cannot reach Redis actually fails.',
      },
      {
        question: 'How do I health check a gRPC service in NestJS?',
        answer:
          'GRPCHealthIndicator.checkService<GrpcOptions>("hero_service", "hero.health.v1") speaks the standard grpc.health.v1 protocol, so it works against any server that implements the spec. Anything other than SERVING fails the indicator and the endpoint returns 503.',
      },
      {
        question: 'Can Terminus check Kafka?',
        answer:
          'Yes, through MicroserviceHealthIndicator.pingCheck with KafkaOptions: transport Transport.KAFKA and a client naming your brokers. Terminus sets producerOnlyMode so the probe does not join a consumer group and trigger a rebalance on every check.',
      },
      {
        question: 'Should the health endpoint be authenticated?',
        answer:
          'Leave it open and keep the body boring. A monitor cannot send your auth header, and an endpoint that returns nothing but a status and an indicator key leaks nothing worth protecting. Put a guard on any deeper diagnostics route instead.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'fastapi',
    h1: 'FastAPI health check endpoint',
    answer:
      'Add an async /health route that runs SELECT 1 through the session with a short timeout and returns a JSONResponse with status_code=503 when the query fails, so a live Uvicorn process with a dead database reads as down.',
    meta: {
      title: 'FastAPI health check endpoint | Logdash',
      description:
        'An async /health route with a real SELECT 1, a 503 on failure, the Docker and compose HEALTHCHECK lines, and the monitor that turns it into an alert.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'FastAPI makes the useless version of this endpoint very easy to write. Three lines, a dict, a 200, and you have told the world that Uvicorn is running. Uvicorn is rarely the thing that goes wrong. The connection pool behind it is. The database restarts, the pool never recovers, every route that touches a session starts raising, and the health route, which touches nothing, keeps answering in under a millisecond with the same cheerful 200 it returned yesterday.',
      },
      {
        type: 'paragraph',
        text: 'The route has to run one real query against the dependency it cannot work without, and it has to answer with a status code that means something. A monitor watching this URL reads anything outside 200-399 as down and alerts on the change, which makes the 503 the entire point of the exercise. Keep it to one query. An endpoint that fans out to five services is an endpoint that pages you for an outage that is not yours.',
      },
      { type: 'heading', text: 'The endpoint' },
      {
        type: 'code',
        language: 'python',
        title: 'app/main.py',
        code: `import asyncio

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session

app = FastAPI()


@app.get("/health")
async def health(session: AsyncSession = Depends(get_session)):
    try:
        async with asyncio.timeout(2):
            await session.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "down"}, status_code=503)

    return {"status": "ok"}`,
      },
      {
        type: 'paragraph',
        text: 'Two details are load-bearing. SQLAlchemy 2.0 refuses to execute a bare string, so the text() wrapper is required or you get an ObjectNotExecutableError where you wanted a health check. And asyncio.timeout, which needs Python 3.11 or newer, is there because a hung connection makes the endpoint hang rather than fail. Without it the monitor times out instead of reading your 503, and you lose the reason from the response body.',
      },
      { type: 'heading', text: 'The Docker side' },
      {
        type: 'paragraph',
        text: 'If the app runs in a container, point the runtime at the same URL so the container marks itself unhealthy on the signal your monitor alerts on. Docker by itself will not restart an unhealthy container, it only reports the state, and compose uses it for depends_on with condition: service_healthy. The -f flag makes curl exit non-zero on a 503, which is what the HEALTHCHECK contract reads. In a Dockerfile the line is HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:8000/health.',
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'docker-compose.yml',
        code: `services:
  api:
    build: .
    ports:
      - '8000:8000'
    healthcheck:
      test: ['CMD', 'curl', '-fsS', 'http://localhost:8000/health']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s`,
      },
      {
        type: 'paragraph',
        text: 'Slim Python base images do not ship curl. Install it in the image or swap the test for a python -c one-liner, because a HEALTHCHECK that fails on a missing binary marks the container unhealthy forever and tells you nothing about the app.',
      },
      { type: 'heading', text: 'What to leave out' },
      {
        type: 'list',
        items: [
          'Downstream HTTP calls. Checking a partner API means their incident becomes your alert and your container restart loop.',
          'Anything slow. Two seconds is a generous ceiling here, and the Logdash pinger abandons the request at 10 seconds and records it as down, so a slow endpoint is indistinguishable from a broken one.',
          'The version string, the git SHA, the settings object. This route is public. Return a status and, at most, the name of the dependency that failed.',
          'Migrations, disk usage and anything else that only matters at boot. Check it in a startup hook and let the process refuse to start instead.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Deploy and verify the failure path',
            text: 'Stop the database container while the API keeps running, then hit the route. A 200 here means the endpoint is lying to you and no monitor can fix that.',
          },
          {
            title: 'Add the HTTP monitor',
            text: 'Create a Logdash service, paste the public URL and let the first check run immediately. Free checks every 5 minutes, Builder every minute, Pro every 15 seconds, with the status code and response time stored each time.',
          },
          {
            title: 'Watch the alert land',
            text: 'Kill the database once more and wait a single interval. The monitor transitions to down and Telegram delivers the endpoint name and the 503, which is the confirmation that the wiring works end to end.',
          },
        ],
      },
      { type: 'heading', text: 'Liveness and readiness are not one route' },
      {
        type: 'paragraph',
        text: 'If Kubernetes is in the picture, split them. The liveness probe should touch nothing, because a database blip that answers 503 will restart every healthy pod you have and turn a two-minute outage into a crash loop. The readiness probe is the one that runs SELECT 1. Point your external monitor at the readiness route: you want the version that fails when customers cannot be served, not the version that only fails when Python has stopped.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is a good FastAPI health check example?',
        answer:
          'An async route on /health that runs one SELECT 1 through the session inside asyncio.timeout, returns {"status": "ok"} on success, and returns JSONResponse with status_code=503 on any exception. That is the whole thing, and anything longer is usually checking too much.',
      },
      {
        question: 'How do I add a Docker health check for FastAPI?',
        answer:
          'Add HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:8000/health to the Dockerfile, and install curl in the image. The -f flag turns a 503 into a non-zero exit, which is how Docker marks the container unhealthy.',
      },
      {
        question: 'How do I set a health check in docker compose for FastAPI?',
        answer:
          'Put a healthcheck block on the service with test, interval, timeout, retries and start_period. Give it a start_period long enough to cover Uvicorn boot and any migration step, otherwise the container is marked unhealthy before it has had a chance to come up.',
      },
      {
        question: 'What status code should the health route return?',
        answer:
          '200 when the app can serve a request and 503 when it cannot. Avoid 500 for a dependency failure: 503 says temporarily unavailable, which is the truth, and it is the code load balancers and orchestrators expect on this route.',
      },
      {
        question: 'Should the health route be in the OpenAPI schema?',
        answer:
          'Pass include_in_schema=False on the decorator if it clutters your docs. It changes nothing about the response, and a monitor never reads the schema.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'django',
    h1: 'Django health check endpoint',
    answer:
      'Write a view that runs SELECT 1 on the default connection and returns JsonResponse with status=503 when it raises, wire it into urls.py, or install django-health-check if you want the batteries-included version.',
    meta: {
      title: 'Django health check endpoint | Logdash',
      description:
        'A plain Django view with a real database query and a 503, the django-health-check package, the Celery worker gap, and the monitor that alerts on it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Gunicorn does not notice when Postgres goes away. The workers stay up, the socket stays open, and Django keeps routing requests to views that now raise OperationalError on the first query. A health view that returns an empty 200 sails through all of it, because it never asks the database anything. You end up with a monitor reporting perfect uptime while your error tracker fills up, which is worse than having no monitor, since a green dashboard is an argument against looking.',
      },
      {
        type: 'paragraph',
        text: 'The fix is one query and one honest status code. Run something cheap through the connection you already have, and return 503 when it fails. Logdash counts anything outside 200-399 as down and sends the alert on the flip, so the 503 is the piece that converts a URL into a page at 3am. Without it the endpoint is a very fast way of confirming that Python has not segfaulted.',
      },
      { type: 'heading', text: 'The view' },
      {
        type: 'code',
        language: 'python',
        title: 'health/views.py',
        code: `from django.db import connection
from django.http import JsonResponse


def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        # 503: the process is alive, the app cannot serve a request
        return JsonResponse({"status": "down", "database": "unreachable"}, status=503)

    return JsonResponse({"status": "ok"})`,
      },
      {
        type: 'code',
        language: 'python',
        title: 'config/urls.py',
        code: `from django.urls import path

from health.views import health

urlpatterns = [
    path("health/", health, name="health"),
]`,
      },
      {
        type: 'paragraph',
        text: 'Keep the view out of any middleware that needs a session or a logged-in user, and do not decorate it with login_required. A monitor arrives with no cookies and no auth header, so a redirect to the login page turns into a 302, which lands inside 200-399 and reads as healthy while the real app is broken.',
      },
      { type: 'heading', text: 'The package version' },
      {
        type: 'paragraph',
        text: 'django-health-check on PyPI is the batteries-included option and a reasonable choice. Version 4 wants Django 5.2 or newer and installs extras per backend: pip install "django-health-check[celery,redis]". Add health_check to INSTALLED_APPS, then wire HealthCheckView into urls.py with an explicit checks list naming entries like health_check.Database, health_check.contrib.redis.Redis and health_check.contrib.celery.Ping. You get a rendered status page and a non-200 when a check fails. The trade is a dependency plus a checks list that is easy to over-fill.',
      },
      { type: 'heading', text: 'A web check says nothing about your workers' },
      {
        type: 'paragraph',
        text: 'This is the gap most Django setups have. The web tier and the Celery workers fail independently. The broker can be reachable from gunicorn while every worker container is dead, and your /health endpoint will not notice, because nothing in the request path touches them. Jobs pile up in the queue, emails stop going out, and the monitor stays green for as long as it takes somebody to complain.',
      },
      {
        type: 'code',
        language: 'python',
        title: 'health/views.py',
        code: `from django.http import JsonResponse

from config.celery import app as celery_app


def worker_health(request):
    replies = celery_app.control.ping(timeout=1.0)

    if not replies:
        return JsonResponse({"status": "down", "workers": 0}, status=503)

    return JsonResponse({"status": "ok", "workers": len(replies)})`,
      },
      {
        type: 'paragraph',
        text: 'control.ping broadcasts to every worker and collects replies until the timeout, so keep it to a second and serve it on a second URL rather than folding it into the main one. Logdash also has push heartbeats, where the worker calls out instead of being polled, but they are Pro-only and expect a ping every check interval, which makes them right for a worker that runs continuously and wrong for a nightly job.',
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Test both failure modes',
            text: 'Stop Postgres and curl the health URL, then bring it back, stop the workers and curl the worker URL. Two 503s means both endpoints are telling the truth.',
          },
          {
            title: 'Create the monitors',
            text: 'One Logdash project per endpoint, since a project carries one monitor. The free plan covers five projects at a 5-minute interval, Builder drops it to a minute and Pro to 15 seconds.',
          },
          {
            title: 'Confirm the alert',
            text: 'Scale the workers to zero and leave it for one interval. The worker monitor turns red and the Telegram message arrives with the URL and the 503, so you find out from your phone rather than from a queue with 40,000 items in it.',
          },
        ],
      },
      { type: 'heading', text: 'ALLOWED_HOSTS will reject the monitor' },
      {
        type: 'paragraph',
        text: 'Django validates the Host header before your view runs. A request whose Host is not in ALLOWED_HOSTS gets a 400 and never reaches the health check, which reads as down and produces an alert that has nothing to do with your database. That is fine when the monitor hits your real domain, and a constant false alarm when a load balancer probes the pod by IP. Add the host to the list.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is django-health-check on PyPI worth installing?',
        answer:
          'Yes if you want database, cache, storage and Celery checks without writing them. Install it with the extras you need, add health_check to INSTALLED_APPS and register HealthCheckView with an explicit checks list. A hand-written view is fifteen lines and no dependency, so both answers are defensible.',
      },
      {
        question: 'How do I health check Celery workers in Django?',
        answer:
          'Call celery_app.control.ping(timeout=1.0) from a view and return 503 when the reply list is empty. Serve it on its own URL: a web health check tells you nothing about whether any worker is consuming the queue.',
      },
      {
        question: 'Should the health check be middleware instead of a view?',
        answer:
          'A view is simpler and easier to reason about. Middleware is only worth it when you need the check to answer before other middleware runs, for example when an auth or tenant middleware would otherwise reject a monitor that has no session.',
      },
      {
        question: 'What about the Docker health check for Django?',
        answer:
          'Add HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:8000/health/ to the Dockerfile and make sure the container hostname is in ALLOWED_HOSTS, otherwise every probe returns 400 and the container is permanently unhealthy.',
      },
      {
        question: 'Does the endpoint need to check the database?',
        answer:
          'If the app cannot serve a page without it, yes. One SELECT 1 through the existing connection costs almost nothing and is the difference between a monitor that detects an outage and a monitor that confirms Python is running.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'flask',
    h1: 'Flask health check endpoint',
    answer:
      'Register a blueprint with a /health route that runs db.session.execute(text("SELECT 1")) and returns a 503 when it raises, so the check fails whenever the database the app depends on is gone.',
    meta: {
      title: 'Flask health check endpoint | Logdash',
      description:
        'A Flask blueprint that runs one real query, returns 503 when the database is unreachable, and gets watched by a monitor that alerts on the transition.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The Flask health check almost everybody writes is a route that returns the string ok. It takes ten seconds to add and it proves that the WSGI worker is alive. That is a real fact, and it is rarely the fact you need. When the database host disappears, the worker is still alive. It accepts the connection, matches the route, returns your 200, and every other endpoint in the app is returning 500 at the same moment. The monitor sees the good number and says nothing.',
      },
      {
        type: 'paragraph',
        text: 'What makes the endpoint useful is that it fails when the app has stopped being able to do its job. One query through the session you already have, and a 503 when that query raises. The 200-399 range is the whole of what a monitor treats as healthy, so stepping outside it is the only way to say something is wrong: Logdash marks the check down and fires once, on the change. That 503 is the line connecting a broken database to your phone, and without it there is nothing for an alert to hang on.',
      },
      { type: 'heading', text: 'The blueprint' },
      {
        type: 'code',
        language: 'python',
        title: 'app/health.py',
        code: `from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db.session.rollback()
        return jsonify(status="down", database="unreachable"), 503

    return jsonify(status="ok"), 200`,
      },
      {
        type: 'paragraph',
        text: 'Register it in the app factory with app.register_blueprint(health_bp). The text() wrapper is not optional on SQLAlchemy 2.0, which refuses to execute a raw string and raises ObjectNotExecutableError instead. The rollback matters too: a failed statement leaves the session in a broken state, and without it the next request handled by that worker inherits the mess.',
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'One query against the primary database. That is the dependency Flask cannot fake its way around, and SELECT 1 through the existing pool costs a fraction of a millisecond.',
          'Redis, only when a cache miss is fatal rather than slow. Most Flask apps survive a cold cache and should not go down for one.',
          'No calls to other services you happen to talk to. Their downtime becomes your alert, and you spend the incident explaining that your app was fine.',
          'Finish well under a second. Logdash abandons a request after 10 seconds and files the check as down, so a health route that queues behind slow traffic will alert on its own latency.',
          'Keep the body to a status and the name of the failed dependency. No config values, no library versions, nothing that helps somebody who is not you.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Check what runs before the view as well. A before_request hook that requires an API key, or a login_required decorator applied to the whole blueprint, will bounce the monitor with a 401 or a redirect. A 401 reads as down and alerts constantly; a 302 reads as up and hides real outages. Leave this one route open.',
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Prove it fails',
            text: 'Stop the database and call the route. If you do not see a 503 with the body you wrote, fix that before going any further, because everything downstream depends on this one status code.',
          },
          {
            title: 'Create the monitor',
            text: 'Add a Logdash service pointed at https://yourapp.com/health. Every check stores the status code and the response time, at 5 minute intervals on the free plan, 1 minute on Builder and 15 seconds on Pro.',
          },
          {
            title: 'Watch it fire',
            text: 'Take the database down one more time and wait an interval. The monitor flips to down and the Telegram alert arrives with the URL and the status code, which is the only real proof that the chain from query to notification is intact.',
          },
        ],
      },
      { type: 'heading', text: 'One worker is not the app' },
      {
        type: 'paragraph',
        text: 'A single check hits one Gunicorn worker on one instance. If you run four instances behind a load balancer, a green result means at least one of them answered, not that all four are healthy. That is usually acceptable, since the load balancer should be pulling the broken one out with its own probe. Where it stops being acceptable is a rolling deploy that half fails: two instances serving the new code, two crash-looping, and an external monitor happily reporting up. Response times are recorded on every check and charted, so a jump there is often the first hint, but nothing alerts on latency by itself. The alert comes from status codes, which is another reason the 503 has to be right.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the simplest Flask health check example?',
        answer:
          'A blueprint with one route that runs db.session.execute(text("SELECT 1")), returns jsonify(status="ok") with a 200, and returns a 503 from the except branch. Twelve lines including imports.',
      },
      {
        question: 'What path should the Flask health endpoint use?',
        answer:
          '/health. It is the default most orchestrators, load balancers and monitoring tools reach for, and matching the convention means one less thing to configure. /healthz is the Kubernetes flavoured alternative if your cluster already standardises on it.',
      },
      {
        question: 'Should a Flask health check query the database?',
        answer:
          'Yes, if the app cannot serve a request without one. The point of the endpoint is to fail when the app is unusable, and the database is the dependency that most often makes it unusable while the process stays up.',
      },
      {
        question: 'What status code should Flask return when a check fails?',
        answer:
          '503 Service Unavailable. It says the condition is temporary, it is what load balancers act on, and a monitor treats it as down because it sits outside the 200-399 range.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'rails',
    h1: 'Rails health check endpoint and what /up actually checks',
    answer:
      'Rails 8 already serves a health check at /up, but it only returns 200 when the app boots without raising, so if you want the database checked you write your own controller and return 503 when the query fails.',
    meta: {
      title: 'Rails health check endpoint and /up | Logdash',
      description:
        'Rails 8 mounts /up by default, but it only proves the app booted. Add a controller that queries the database, returns 503, and put a monitor on it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Rails has shipped a health check since 7.1, and every app generated on Rails 8 still has it. One line sits near the top of config/routes.rb: get "up" => "rails/health#show", as: :rails_health_check. Hit /up and Rails::HealthController renders a green page with a 200, or a red one with a 500 if something raised on the way in. You do not have to add it, wire it or name it. Most people running Rails in production already have this endpoint and have never opened it, which is worth knowing before you go shopping for a gem.',
      },
      {
        type: 'paragraph',
        text: "The next thing to know is what it does not do, and Rails is honest about this in the controller's own documentation: the endpoint does not reflect the status of your application's dependencies. It answers exactly one question. Did this process boot without raising. A Puma worker whose connection pool is full of dead Postgres sockets booted fine hours ago, and it will keep answering /up with a cheerful 200 while every real request 500s. That is the failure mode that costs you the outage. A monitor pointed at /up sits green through the whole thing, and a monitor you have learned to trust while it is wrong is worse than no monitor at all.",
      },
      {
        type: 'heading',
        text: 'The controller you write when the database matters',
      },
      {
        type: 'code',
        language: 'ruby',
        title: 'app/controllers/health_controller.rb',
        code: `class HealthController < ApplicationController
  # Whatever ApplicationController runs before every action, skip it here.
  skip_before_action :authenticate_user!, raise: false

  def show
    ActiveRecord::Base.with_connection { |c| c.select_value("SELECT 1") }
    render json: { ok: true }
  rescue StandardError => e
    Rails.logger.warn("health check failed: #{e.class}")
    # 503, so a booted app with a dead database reads as down.
    render json: { ok: false, error: "database" }, status: :service_unavailable
  end
end`,
      },
      {
        type: 'paragraph',
        text: 'Then point the existing route at it in config/routes.rb: get "up" => "health#show", as: :rails_health_check. Keeping the path means the load balancer config, the Kubernetes probe and anything else already hitting /up carry on working without a change.',
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'One query against the database you cannot serve a request without. SELECT 1 through the pool is enough: it proves the pool still hands out a live connection, and it costs well under a millisecond.',
          'Redis, only if a request genuinely fails without it. If the app degrades to a slower page, that is not something worth waking anyone up for.',
          "Nothing that calls a third-party API. Fan out to Stripe and S3 and you will page yourself at 3am for someone else's outage, about a thing you cannot fix.",
          'A budget well under a second. The Logdash pinger gives up after 10 seconds and records the check as down, and an endpoint that needs 10 seconds is already telling you something.',
          'No version string, no migration status, no environment dump in the body. Assume the URL is public, because eventually it is.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Ship it, then try to break it',
            text: 'Deploy, open /up in a browser, then stop Postgres on your machine and load the same path. You want a small JSON body with a 503, not a 500 page with a stack trace in it.',
          },
          {
            title: 'Create the monitor',
            text: 'Add the service in Logdash and paste the full URL. Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and each one records the status code and the response time.',
          },
          {
            title: 'Take the database away',
            text: 'Point staging at a dead database and wait one interval. The status code leaves the 200-399 range, the monitor flips to down on that transition, and the Telegram alert arrives naming the endpoint and the code it got back.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'The one that catches people: host authorization',
      },
      {
        type: 'paragraph',
        text: 'If you have set config.hosts in production, ActionDispatch::HostAuthorization answers any request with an unexpected Host header with 403 Forbidden. An external monitor hitting your real domain is fine. A load balancer or a Kubernetes probe hitting the pod by IP is not, and 403 sits outside 200-399, so the check reads as down while the app is perfectly healthy. The Rails guide gives you the exclusion: config.host_authorization = { exclude: ->(request) { request.path == "/up" } }. Set it before you lose an evening to a red monitor pointed at a green app.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Rails 8 have a built-in health check endpoint?',
        answer:
          'Yes. Every generated app routes /up to Rails::HealthController, which returns 200 if the app booted without raising and 500 if it did not. It has been the default since Rails 7.1, so most apps already have it and most owners have never looked.',
      },
      {
        question: 'What does the Rails /up endpoint actually check?',
        answer:
          'That the process is running and boots clean. Nothing else. It never touches the database, Redis or a queue, and the controller documentation says so directly, which is why a custom action is the answer as soon as the database matters.',
      },
      {
        question: 'What status code should a Rails health check return?',
        answer:
          '200 when the app can serve traffic, 503 when a dependency it needs is gone. Logdash marks a monitor down on anything outside 200-399, so the 503 is what turns the endpoint into an alert instead of a chart.',
      },
      {
        question: 'Do I need a health check gem for Rails?',
        answer:
          'Usually not. health_check and okcomputer earn their place once you want a registry of named checks across a large app. For one controller and one SELECT 1, a gem is more configuration than code.',
      },
      {
        question: 'Should a Rails health check endpoint be authenticated?',
        answer:
          'Leave it open and keep the body boring. Monitors and load balancers cannot carry credentials easily, and a response of ok true leaks nothing. If it truly has to be private, restrict it by network rather than by password.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'laravel',
    h1: 'Laravel health check endpoint and the built-in /up route',
    answer:
      'Laravel 11 and 12 register a health route at /up out of the box, but it only proves the framework booted, so add a route that runs one database query and returns 503 when it fails.',
    meta: {
      title: 'Laravel health check endpoint and /up | Logdash',
      description:
        'Laravel 11 added a /up health route, but it only proves the framework booted. Add a route with a database check, a 503, and a monitor watching it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "Open bootstrap/app.php in any Laravel 11 or 12 app and the health route is already there, passed as an argument: Application::configure()->withRouting(web: ..., commands: ..., health: '/up'). Laravel registers a GET route on that path, fires a DiagnosingHealth event and returns 200 unless a listener throws, in which case you get a 500. Nothing subscribes to that event in a fresh app, so out of the box /up answers 200 whenever PHP-FPM is alive and the framework boots.",
      },
      {
        type: 'paragraph',
        text: 'So the useful question is not whether you have a health endpoint. It is whether yours can fail. A booted Laravel app that can no longer reach MySQL still returns 200 from /up while every request to a real controller throws a QueryException, and the uptime monitor watching the site records a clean day through the incident. The check has to touch the thing the app needs: one cheap query, and a status code outside the success range when that query does not come back.',
      },
      { type: 'heading', text: 'A route that fails when the database does' },
      {
        type: 'code',
        language: 'php',
        title: 'routes/web.php',
        code: `use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Route;

Route::get('/health', function () {
    try {
        DB::select('select 1');
    } catch (\\Throwable $e) {
        report($e);

        // 503, so a booted app with a dead database reads as down.
        return response()->json(['ok' => false, 'error' => 'database'], 503);
    }

    return response()->json(['ok' => true]);
});`,
      },
      {
        type: 'paragraph',
        text: "If you would rather keep the built-in path, hook the event instead. In AppServiceProvider::boot, Event::listen(DiagnosingHealth::class, fn () => DB::select('select 1')). A throw from that listener turns /up into a 500, and a monitor reads a 500 the same way it reads a 503.",
      },
      { type: 'heading', text: 'What belongs in the check' },
      {
        type: 'list',
        items: [
          'The default connection, once, with something as cheap as select 1. DB::select uses the same pool and the same credentials your controllers use, so it fails for the same reasons they do.',
          'Redis or the queue, only when the app cannot serve a page without them. A slower cache miss is not an outage.',
          'Nothing that reaches a payment provider or an object store. That turns their bad night into your pager, and their night is not yours to fix.',
          'Under a second, end to end. The Logdash pinger times out at 10 seconds and records the check as down, so a slow health route becomes a false alarm.',
          'A body of two keys. No app version, no queue depth, no config values. Assume anyone can curl the URL, because they can.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Check both directions',
            text: 'Load /health in a browser, then break the database credentials in a staging .env and load it again. You want your JSON with a 503, so confirm APP_DEBUG is false anywhere a monitor can reach.',
          },
          {
            title: 'Create the monitor',
            text: 'Add the service in Logdash, paste the URL, and the first check runs straight away. Every check stores the status code and the response time, at 5-minute intervals on the free plan, 1 minute on Builder and 15 seconds on Pro.',
          },
          {
            title: 'Prove the alert',
            text: 'Stop the database container and wait one interval. The status code leaves the 200-399 window, the monitor flips to down on the transition, and Telegram gets a message naming the endpoint and the code.',
          },
        ],
      },
      { type: 'heading', text: 'artisan down does not take /up down' },
      {
        type: 'paragraph',
        text: 'Laravel excludes the built-in health path from maintenance mode on purpose: withRouting registers it through PreventRequestsDuringMaintenance::except(). Run php artisan down and every page returns 503 while /up carries on returning 200. That is right for a load balancer, which should keep routing to a pod that is deliberately in maintenance, and wrong for an uptime monitor, which will report the site as fine while nobody can buy anything. A custom route in routes/web.php goes through that middleware and returns 503 like everything else, so the monitor follows your deploys. Decide which of the two you want before you pick the URL.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Laravel have a built-in health check route?',
        answer:
          "Yes, since Laravel 11. bootstrap/app.php passes health: '/up' to withRouting, which registers a GET route that fires the DiagnosingHealth event and returns 200 unless a listener throws. Laravel 12 ships the same line.",
      },
      {
        question: 'What is the health check URL in Laravel?',
        answer:
          "/up by default. The path is whatever string you pass to health: in bootstrap/app.php, so health: '/healthz' moves it. A route of your own can live anywhere, and /health and /healthz are the two conventions worth picking between.",
      },
      {
        question: 'Is there a Laravel health check package?',
        answer:
          'spatie/laravel-health is the well-known one and it earns its keep once you have a dozen named checks with thresholds and a dashboard. For one query and one status code, a closure in routes/web.php is less to maintain.',
      },
      {
        question: 'Is there an artisan command for health checks?',
        answer:
          'Not in the framework. php artisan about prints environment and cache state locally, and spatie/laravel-health adds health:check for cron or CI. Neither is what a monitor should use, because a monitor needs an HTTP status code.',
      },
      {
        question: 'What status code should a Laravel health check return?',
        answer:
          '200 when the app can serve, 503 when it cannot. Logdash marks a monitor down on anything outside 200-399, so the status code is the difference between a chart nobody reads and an alert that arrives.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'phoenix',
    h1: 'Elixir Phoenix health check endpoint with Ecto and the cluster',
    answer:
      'Phoenix ships no health route, so you write a controller action that runs one Ecto query, returns 200 with the number of connected nodes, and answers 503 when the query raises.',
    meta: {
      title: 'Phoenix health check endpoint in Elixir | Logdash',
      description:
        'Phoenix has no built-in health route. Write one that queries Ecto, reports the cluster, returns 503 when the Repo is gone, and put a monitor on it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Phoenix does not generate a health route. Rails gives you /up and Laravel gives you /up. A new Phoenix app gives you a router with PageController in it and nothing else, so the endpoint is yours to write. That is mostly fine, except that the version most people write first is two lines - a plug that sends 200 - and two lines is exactly the version that lies to you.',
      },
      {
        type: 'paragraph',
        text: 'The BEAM makes that trap easier to fall into than most runtimes. A supervisor restarts the Repo pool for you, the node survives failures that would take a Rails process out entirely, and the web server keeps accepting and answering requests while every checkout from the pool times out. A plug that returns 200 because the VM is still scheduling is measuring the wrong thing. Query the database the app actually uses, and answer 503 when the query does not come back. Logdash treats any status outside 200-399 as down, so that 503 is what turns a line on a chart into a notification.',
      },
      { type: 'heading', text: 'The controller' },
      {
        type: 'code',
        language: 'elixir',
        title: 'lib/my_app_web/controllers/health_controller.ex',
        code: `defmodule MyAppWeb.HealthController do
  use MyAppWeb, :controller

  alias MyApp.Repo

  def show(conn, _params) do
    Ecto.Adapters.SQL.query!(Repo, "SELECT 1")
    json(conn, %{ok: true, peers: length(Node.list())})
  rescue
    _error ->
      # 503, so a live node with a dead Repo reads as down.
      conn
      |> put_status(:service_unavailable)
      |> json(%{ok: false, error: "database"})
  end
end`,
      },
      {
        type: 'paragraph',
        text: 'Route it in lib/my_app_web/router.ex with get "/health", HealthController, :show, inside a scope that pipes through :api rather than :browser. The browser pipeline hands a health check a session, a CSRF token and a layout, and it needs none of them.',
      },
      { type: 'heading', text: 'What to check, including the cluster' },
      {
        type: 'paragraph',
        text: 'A Phoenix node can be perfectly healthy and still be useless if it has dropped out of the cluster. If you run Horde, distributed PubSub or anything that assumes peers, Node.list() belongs in the response: a node reporting zero peers when it should see three is the shape of a libcluster or DNS problem no database query will catch. Report the count and read it during an incident. Only turn it into a 503 if the node genuinely cannot serve a request alone, because a rolling deploy leaves every node short of peers for a minute and you do not want the fleet flapping mid-release.',
      },
      {
        type: 'list',
        items: [
          'One Ecto query on the Repo the app cannot serve without. SELECT 1 through Ecto.Adapters.SQL.query! goes through the real pool, so an exhausted pool and a missing Postgres both raise.',
          'A cache or a Redis, only when a request fails outright without it.',
          'No calls to third-party APIs. Their outage becomes your alert, and you cannot do anything about their outage at 3am.',
          'Under a second. The Logdash pinger abandons a request after 10 seconds and records the check as down.',
          'No release version, no node cookie, nothing about the topology beyond a count, on any URL reachable from the internet.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Try both paths locally',
            text: 'Start the app, curl /health, then stop Postgres and curl it again. The second call should be a 503 with your JSON, which also proves the rescue clause is in the action and not swallowed by an error view.',
          },
          {
            title: 'Create the monitor',
            text: 'Add the service in Logdash and paste the URL. Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and each one records the status code and the response time.',
          },
          {
            title: 'Kill the database in staging',
            text: 'Take Postgres down and wait one interval. The status code leaves 200-399, the monitor flips on that transition, and the Telegram alert arrives with the endpoint and the code it saw.',
          },
        ],
      },
      { type: 'heading', text: 'One node is not the fleet' },
      {
        type: 'paragraph',
        text: 'An HTTP check hits whichever node the load balancer picks, so with four nodes behind one hostname a single monitor tells you about roughly one in four. It catches a database outage, because that hits everyone at once. It misses one node that has lost its Repo, right up until the balancer sends the check that way. If per-node health matters, expose the endpoint on each node address and watch them separately. The free plan gives you one monitor per project across five projects, which covers a small fleet.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Phoenix have a built-in health check endpoint?',
        answer:
          'No. Unlike Rails with /up and Laravel with /up, Phoenix generates no health route at all. One controller action, or one plug in the endpoint, and it is yours to keep correct.',
      },
      {
        question: 'What path should an Elixir health check use?',
        answer:
          '/health or /healthz. Neither means anything to Phoenix, so pick one, write it in the runbook, and use the same path in every service you own so an on-call engineer never has to guess.',
      },
      {
        question: 'Should the Phoenix health check be a plug or a controller?',
        answer:
          'A plug matched high in lib/my_app_web/endpoint.ex answers before session parsing and routing, which keeps it cheap. A controller action is easier to read and to test. For one query, either is fine.',
      },
      {
        question:
          'What status code should the endpoint return when Ecto fails?',
        answer:
          '503, via put_status(:service_unavailable) before json/2. Logdash marks a monitor down on anything outside 200-399, so a 200 carrying an ok false body keeps the monitor green through the entire outage.',
      },
      {
        question: 'Should a Phoenix health check endpoint be authenticated?',
        answer:
          'Leave it open and keep the body to a boolean and a peer count. Monitors cannot carry credentials easily, and there is nothing in that response worth protecting. Restrict by network if it has to be private.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'spring-boot',
    h1: 'Spring Boot health check endpoint with Actuator',
    answer:
      'Add spring-boot-starter-actuator and Spring Boot serves /actuator/health for you, returning 200 while every contributor is UP and 503 the moment one of them goes DOWN.',
    meta: {
      title: 'Spring Boot health check endpoint | Logdash',
      description:
        'Expose /actuator/health, set show-details safely, add a custom HealthIndicator, and watch the 503 that Actuator already returns when a contributor is DOWN.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Actuator is the answer and most Spring Boot services already have half of it wired up. Add spring-boot-starter-actuator to the build file and /actuator/health starts serving on the application port. Health is the only endpoint exposed over HTTP by default, so you get the one you want and none of the ones you would rather not publish. The auto-configuration also registers a contributor for every dependency it recognises: a db indicator that borrows a connection from your DataSource, plus Redis, MongoDB, RabbitMQ and disk space. You do not write the database check.',
      },
      {
        type: 'paragraph',
        text: 'The part that gets skipped is the status code, and it is the only part a monitor reads. Actuator maps DOWN and OUT_OF_SERVICE to 503 by default and leaves UP on 200. A health URL that answers 200 from a JVM whose connection pool has been empty for ten minutes turns an outage into a green dashboard and a support thread. Actuator gets this right without configuration: the DataSource cannot hand out a connection, db goes DOWN, the response is 503. Logdash marks a monitor down on any status code outside 200 to 399, so that 503 is the difference between a chart you read afterwards and a message on your phone while it is happening.',
      },
      { type: 'heading', text: 'Expose it and decide what the body says' },
      {
        type: 'code',
        language: 'yaml',
        title: 'application.yml',
        code: `management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: when-authorized
      show-components: when-authorized
      probes:
        enabled: true`,
      },
      {
        type: 'paragraph',
        text: 'management.endpoint.health.show-details defaults to never, so an anonymous caller sees a status word and nothing else. Keep it that way on a public URL. Set it to always and the body starts naming your database vendor, the free space on the disk and the exception message from whatever just broke, which is a handy page for you and a better one for someone scanning your domain. Setting when-authorized gives your team the detail and leaves the public response as one word. A monitor only reads the status code, so it loses nothing either way. Turning probes on splits /actuator/health/liveness from /actuator/health/readiness, which is what Kubernetes should use so a pod is not restarted because Postgres blinked.',
      },
      {
        type: 'heading',
        text: 'A HealthIndicator for what Actuator cannot see',
      },
      {
        type: 'paragraph',
        text: 'Actuator knows about the infrastructure it auto-configured. It does not know that your app is pointless without the payments API, or that a consumer has fallen twenty minutes behind. Implement HealthIndicator, return Health.up() or Health.down(), and one DOWN contributor takes the whole endpoint to 503. The bean name becomes the key in the JSON, so PaymentsHealthIndicator appears as payments. One import to watch: Spring Boot 4 moved the interface to org.springframework.boot.health.contributor, and 3.x still uses org.springframework.boot.actuate.health.',
      },
      {
        type: 'code',
        language: 'java',
        title: 'PaymentsHealthIndicator.java',
        code: `@Component
class PaymentsHealthIndicator implements HealthIndicator {
  private final PaymentsClient payments;

  PaymentsHealthIndicator(PaymentsClient payments) {
    this.payments = payments;
  }

  @Override
  public Health health() {
    try {
      payments.ping(); // one cheap call, not a real transaction
      return Health.up().build();
    } catch (Exception ex) {
      return Health.down().withDetail("reason", "payments").build();
    }
  }
}`,
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'One call per dependency you cannot serve a request without. The built-in db indicator already covers the DataSource, so your own select 1 on top of it doubles the work.',
          'Nothing that takes longer than a second. Contributors run on every request to the endpoint, and the Logdash pinger gives up after 10 seconds and records the check as down.',
          'No fan-out to services you do not own. A health check that calls three partner APIs turns their bad afternoon into your 3am alert.',
          'No secrets, no build metadata, no stack traces in the body. That is what show-details is for, and never is the safe value on a public URL.',
          'Readiness for the load balancer, liveness for the kubelet. Pointing both at the same URL means a slow database restarts your pods.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Create a project in Logdash and point its HTTP monitor at https://yourapp.com/actuator/health. Every check stores the status code and the response time, so the latency chart builds itself from the first ping.',
          },
          {
            title: 'Pick the interval',
            text: 'Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro. One monitor per project, and the free plan covers five projects, which is usually one per service.',
          },
          {
            title: 'Take the database away',
            text: 'Stop Postgres and leave the app running. The db contributor flips to DOWN, /actuator/health answers 503, the monitor goes red on the next check and a Telegram message arrives naming the endpoint and the status code.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'The gotcha: nothing can reach it from outside',
      },
      {
        type: 'paragraph',
        text: 'If you moved Actuator onto its own port with management.server.port, the health URL is no longer on the port your load balancer publishes and an external monitor cannot see it. The other one that bites is ingress rewriting a 503 into a branded error page served with a 200, which puts you back where you started. Curl the public URL with -i before you trust the monitor.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the Spring Boot health check endpoint?',
        answer:
          'GET /actuator/health, served on the application port once spring-boot-starter-actuator is on the classpath. It aggregates every registered contributor and reports the worst status among them.',
      },
      {
        question: 'What is the Actuator health check URL on a deployed app?',
        answer:
          'Your base URL plus the servlet context path plus /actuator/health. management.server.port moves it to another port, management.endpoints.web.base-path relocates /actuator, and path-mapping.health renames the endpoint. None of those is security.',
      },
      {
        question: 'Should I expose Actuator publicly?',
        answer:
          'Exposing health is fine with show-details set to never or when-authorized, because the public body is one word. Do not open the rest of the tree: env, heapdump and loggers on a public URL are a real problem.',
      },
      {
        question: 'What status code does Actuator return when the app is down?',
        answer:
          '503. DOWN and OUT_OF_SERVICE both map to SERVICE_UNAVAILABLE by default, UP and UNKNOWN stay on 200. Any monitor that reads status codes will see the failure without extra configuration.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'dotnet',
    h1: '.NET health check endpoint in ASP.NET Core',
    answer:
      'ASP.NET Core has health checks built in: AddHealthChecks() registers them, MapHealthChecks("/health") serves them, and an unhealthy result returns 503 with no extra configuration.',
    meta: {
      title: 'ASP.NET Core health check endpoint | Logdash',
      description:
        'AddHealthChecks, MapHealthChecks and AddDbContextCheck in Program.cs, why Unhealthy returns 503, what the body should not say, and how to watch it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Health checks ship with the framework, so the basic case needs no package at all. Call builder.Services.AddHealthChecks() before the app is built and app.MapHealthChecks("/health") after, and you have an endpoint that answers 200 with the plaintext body Healthy. On its own that endpoint proves Kestrel accepted a connection, which you already knew, because something answered.',
      },
      {
        type: 'paragraph',
        text: 'It becomes useful the moment it touches what the request path needs. Add the EntityFrameworkCore package from Microsoft.Extensions.Diagnostics.HealthChecks and AddDbContextCheck<AppDbContext>() calls CanConnectAsync on your context each time the endpoint is hit. Now a process that is running but cannot reach its database reports differently from a healthy one, which is the entire point. The status mapping is already what you want: Healthy and Degraded return 200, Unhealthy returns 503. Since Logdash flips a monitor to down on anything outside 200 to 399, an unhealthy .NET app becomes an alert without you setting a single threshold.',
      },
      { type: 'heading', text: 'The whole thing in Program.cs' },
      {
        type: 'code',
        language: 'csharp',
        title: 'Program.cs',
        code: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("db");

var app = builder.Build();

// Unhealthy maps to 503; the default body is one word
app.MapHealthChecks("/health");

app.Run();`,
      },
      { type: 'heading', text: 'What to check and what to leave out' },
      {
        type: 'list',
        items: [
          'One check per dependency you cannot serve without. AddDbContextCheck is that check for EF Core, so there is no reason to hand-roll a second query alongside it.',
          'Keep the whole endpoint under a second. Every registered check runs on every request, so eight checks with a 200 ms budget each is an endpoint that takes longer than a page load.',
          'No calls to third-party APIs. Their outage is not your outage, and you do not want to be woken up for it.',
          'Watch what the body says. The default response writer prints Healthy or Unhealthy and nothing else, which is exactly right for a public URL. The JSON writers people paste in from samples serialise every entry name, description, duration and exception message.',
          'If you want the detailed body, map a second route with a custom ResponseWriter and put RequireAuthorization() on it. Leave the public one plain.',
        ],
      },
      { type: 'heading', text: 'The UI package, honestly' },
      {
        type: 'paragraph',
        text: 'AspNetCore.HealthChecks.UI is the community dashboard, part of the Xabaril AspNetCore.Diagnostics.HealthChecks project, and Microsoft states plainly that it does not maintain or support it. It is a real option and plenty of teams run it: add the UI package and a storage provider, list your endpoints in configuration, get a page with history. What you are also adding is a second ASP.NET app, a database for the results, and a dashboard that usually sits in the same cluster as the service it watches, so it goes dark in the same incident. That is the argument for checking the endpoint from outside your infrastructure as well.',
      },
      {
        type: 'paragraph',
        text: 'Aspire is worth the same note. Its service defaults call MapDefaultEndpoints, which maps /health for readiness and /alive for the checks tagged live, but only in the Development environment, because the template treats those endpoints as something to protect in production. The Aspire dashboard is a development tool. Neither of them is watching your deployed app at 3am, so a deployed service still needs a monitor pointed at a URL that a stranger on the internet can resolve.',
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Register the endpoint',
            text: 'Deploy with MapHealthChecks("/health") in place and confirm the URL answers from outside your network before you automate anything. Curl it with -i and read the status line, not the body.',
          },
          {
            title: 'Create the monitor',
            text: 'Add a project in Logdash, paste the health URL, and every check from then on records the status code and the response time. The free plan checks every 5 minutes, Builder every minute, Pro every 15 seconds, and the pinger gives up after 10 seconds.',
          },
          {
            title: 'Break the connection string',
            text: 'Point the context at a database that is not there and redeploy. CanConnectAsync fails, the report comes back Unhealthy, the endpoint returns 503, and the Telegram alert arrives with the URL and the code on the next scheduled check.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the default health check endpoint in ASP.NET Core?',
        answer:
          'There is no default path. You choose it in MapHealthChecks, and /health is the convention almost everyone follows. Aspire service defaults use /health for readiness and /alive for liveness.',
      },
      {
        question: 'Which package provides the EF Core health check?',
        answer:
          'The EntityFrameworkCore package under Microsoft.Extensions.Diagnostics.HealthChecks, maintained by Microsoft. It adds AddDbContextCheck<TContext>(), which runs CanConnectAsync unless you pass a customTestQuery of your own.',
      },
      {
        question: 'Is AspNetCore.HealthChecks.UI worth adding?',
        answer:
          'It is a good dashboard and a community project Microsoft does not support. It also runs inside your own infrastructure, so it cannot tell you about an outage that takes the cluster with it.',
      },
      {
        question: 'Should the health check API be authenticated?',
        answer:
          'The plain endpoint can stay open because its body is one word and an external monitor has to reach it. Authenticate any route that returns the detailed JSON report, and consider host filtering on the management route.',
      },
      {
        question: 'What status code does a failed health check return?',
        answer:
          '503. The default mapping is Healthy and Degraded to 200 and Unhealthy to 503, which is what makes the endpoint alertable without any extra plumbing on the monitoring side.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'go',
    h1: 'Go health check endpoint with net/http',
    answer:
      'Write it yourself: an http.HandlerFunc that runs db.PingContext under a one-second context.WithTimeout and writes http.StatusServiceUnavailable when the ping fails.',
    meta: {
      title: 'Go health check endpoint with net/http | Logdash',
      description:
        'A copy-pasteable Go health handler using db.PingContext, a one-second context timeout and a 503 on failure, plus the monitor that turns it into an alert.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'There is no health check package in the standard library and you do not need one. The endpoint is a handler, a context with a deadline and one call to the dependency you cannot serve without. Fourteen lines, no framework, no interfaces to satisfy.',
      },
      {
        type: 'paragraph',
        text: 'The version most services ship writes 200 and returns. It stays green as long as the process is scheduled, which means it stays green through an exhausted pool, a Postgres failover and a deploy that came up with the wrong DSN. db.PingContext fixes that in one line: database/sql either hands back a live connection from the pool or opens a new one, and both fail when the database is genuinely gone. Write http.StatusServiceUnavailable on that path and the response finally carries information. Logdash treats every status outside 200 to 399 as down, so the 503 is what becomes a notification instead of a data point.',
      },
      { type: 'heading', text: 'The handler' },
      {
        type: 'code',
        language: 'go',
        title: 'main.go',
        code: `// mux.HandleFunc("GET /readyz", healthHandler(db))
func healthHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			http.Error(w, "db unavailable", http.StatusServiceUnavailable)
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}
}`,
      },
      { type: 'heading', text: 'Why each line is there' },
      {
        type: 'list',
        items: [
          'r.Context() as the parent means a client that hangs up cancels the ping instead of leaving it running against a database that is already struggling.',
          'One second is the ceiling. The Logdash pinger abandons a request after 10 seconds and records it as down, and an endpoint that regularly needs seconds is telling you something before any monitor does.',
          'db.PingContext returns an error, not a bool, and it is the only call in database/sql that verifies a connection without pretending to do work.',
          'http.Error writes a short plaintext body. Do not put err.Error() in there: a driver error can contain the host, the port and the user.',
          'sql.DB is a pool, so set SetMaxOpenConns. Without a limit, the check can be the request that exhausts the database under load.',
          'One ping, nothing else. Do not loop over every downstream service, because you will page yourself for someone else.',
        ],
      },
      { type: 'heading', text: 'Point a monitor at it' },
      {
        type: 'steps',
        items: [
          {
            title: 'Ship the route',
            text: 'Deploy with GET /readyz mapped and check it from a machine outside your VPC. If it only answers on the internal listener, an external monitor cannot use it.',
          },
          {
            title: 'Add the monitor',
            text: 'Create a Logdash project and paste the URL. Status code and response time are recorded on every check: every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro.',
          },
          {
            title: 'Kill the database',
            text: 'Stop the container while the binary keeps running. PingContext returns an error, the handler writes 503, the monitor goes red and a Telegram message arrives with the endpoint and the status code.',
          },
        ],
      },
      { type: 'heading', text: 'Liveness and readiness are two routes' },
      {
        type: 'paragraph',
        text: 'On Kubernetes, split them. /livez returns 200 whenever the process is running and is what the kubelet restarts on, so it must not touch the database or a slow query will trigger a restart loop during an incident that has nothing to do with your code. /readyz does the ping and is what takes the pod out of the load balancer. Point the external monitor at /readyz, or at a real user-facing route that reads from the database anyway. A monitor aimed at a liveness probe reports green for a pod that is running and serving nothing, which is the same lie as the empty 200 handler, just with more YAML in front of it.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I write a health check endpoint in Go?',
        answer:
          'Register a handler on your ServeMux, derive a context with a one-second timeout from r.Context(), call db.PingContext, and write http.StatusServiceUnavailable on error and 200 otherwise.',
      },
      {
        question: 'What path should a Go health endpoint use?',
        answer:
          '/healthz is the convention, or /livez and /readyz if you want the Kubernetes split. The path matters far less than whether the handler touches your database before it answers.',
      },
      {
        question: 'Should the health endpoint check the database?',
        answer:
          'The readiness one should. A process can be alive with an unusable connection pool, and a check that never touches the pool reports 200 straight through that outage.',
      },
      {
        question: 'Do I need a health check library in Go?',
        answer:
          'No. Fourteen lines of net/http covers it. Libraries help once you have a dozen dependencies to aggregate and want per-check timeouts and caching, and not before.',
      },
    ],
    updatedAt: '2026-09-04',
  },
];

export const healthCheck: SeoFamilyData = {
  family: healthCheckFamily,
  pages: healthCheckPages,
};
