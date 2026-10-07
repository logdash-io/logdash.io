import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family I. The intent is "explain the concept", so every page answers in its
 * first sentence, then does the math or shows the command, and only then
 * points a monitor at it. No single query owns /learn, so the hub is a list.
 */
export const learnFamily: SeoFamily = {
  key: 'learn',
  hubPath: '/learn',
  hubLabel: 'All uptime monitoring explainers',
  title: 'Uptime monitoring, explained | Logdash',
  description:
    'Short answers to uptime questions: what 99.9% allows, how SLAs pay out, heartbeats, cron, MTTR, and what to do when a site goes down.',
  intro:
    'Fourteen uptime questions, each answered in one sentence, then the math or the command behind it.',
};

export const learnPages: SeoPage[] = [
  {
    slug: 'what-is-uptime-monitoring',
    h1: 'What is uptime monitoring',
    answer:
      'Uptime monitoring is a service outside your infrastructure that requests your URL on a fixed interval, records the status code and response time of every answer, and alerts you when a check fails, so you hear about an outage before your users do.',
    meta: {
      title: 'What is uptime monitoring? | Logdash',
      description:
        'How uptime monitoring works: an outside server requests your URL every few minutes, records status and latency, and alerts you on the first failed check.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A server cannot report its own death. A crashed process, a VPS that lost its network or a deploy that broke the database connection all look the same from the inside: silence. So something you do not run has to ask from the outside, on a schedule, and tell you when the answer is wrong. That is the whole idea.',
      },
      { type: 'heading', text: 'How does uptime monitoring work' },
      {
        type: 'paragraph',
        text: 'Each check is one HTTP request and three facts: did the server answer, with which status code, and how long it took. Logdash counts any status from 200 to 399 as up and everything else as down, including no answer within 10 seconds, which it stores as status code 0. When a monitor changes state, an alert goes out, and a second one goes out when it recovers. There is no confirmation round: the first failed check pages you, so a one-check blip costs a down and an up message.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'One check, by hand',
        code: `curl -sS -L -o /dev/null -m 10 \\
  -w '%{http_code} in %{time_total}s\\n' \\
  https://example.com/health

# 200 in 0.084s   up
# 503 in 0.091s   down, the app answered and said it is broken
# 000 in 10.0s    down, nothing answered at all`,
      },
      {
        type: 'paragraph',
        text: 'A monitor runs that command on a schedule from somewhere else and turns state changes into messages.',
      },
      { type: 'heading', text: 'The interval decides how late you find out' },
      {
        type: 'list',
        items: [
          'Every 5 minutes: 288 checks a day. An outage can be 5 minutes old before the first failed check, and one shorter than 5 minutes can fall between two checks and never show up. This is the Logdash free plan.',
          'Every minute: 1,440 checks a day, and you know within a minute. This is Builder.',
          'Every 15 seconds: 5,760 checks a day. For anything that takes payments. This is Pro.',
        ],
      },
      {
        type: 'heading',
        text: 'Website uptime monitoring: what to point it at',
      },
      {
        type: 'paragraph',
        text: 'For a static marketing site, the homepage is fine. For an app, point the monitor at a health endpoint that runs one cheap database query and returns 503 when it fails. A homepage served from a CDN cache can return 200 for hours while every API request behind it returns 500, and a monitor on that homepage is measuring the CDN, not your product.',
      },
      { type: 'heading', text: 'What uptime monitoring does not see' },
      {
        type: 'paragraph',
        text: 'It sends one request from one place. It does not see a checkout that takes 9 seconds on a phone abroad or a button that throws a JavaScript error. That is real user monitoring. It cannot see a queue worker either, because a worker has no URL. There the direction flips: the worker calls the monitor after each pass, and silence is the alert. Logdash calls that a push monitor, on Pro, with a fixed 15-second window.',
      },
      { type: 'heading', text: 'Uptime monitoring tool or a script' },
      {
        type: 'comparison',
        title: 'Logdash vs curl in your crontab',
        them: 'curl in cron',
        rows: [
          {
            feature: 'Runs while your server is down',
            logdash: 'Yes, from outside your network',
            them: 'Only from a second machine',
            winner: 'logdash',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP status and response time',
            them: 'Anything you can script: SSL expiry, ports, DNS',
            winner: 'them',
          },
          {
            feature: 'Alerts',
            logdash: 'Telegram and webhook, once per state change',
            them: 'Whatever you wire up, dedupe included',
            winner: 'logdash',
          },
          {
            feature: 'History',
            logdash: 'Checks for 12 hours, hourly stats for 90 days',
            them: 'A log file, if you keep one',
            winner: 'logdash',
          },
          {
            feature: 'Cost',
            logdash: 'Free for 5 monitors',
            them: 'Free, plus the box it runs on',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'curl in cron',
        reasons: [
          'You already run a second server at another provider. A crontab there does not die with your app.',
          'You need SSL expiry, port, DNS or keyword checks. Logdash has none of them; a script, Uptime Kuma or UptimeRobot does.',
          'The URL is internal and never reachable from the internet.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the address of your health endpoint, or your homepage if the site is static. The first check runs straight away, so a wrong path shows up in seconds rather than during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check stores the status code and response time, so the uptime history and latency chart fill in on their own.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then stop the app or make the endpoint return 503. An alert you never tested is an alert you cannot trust. On the next check the monitor flips to down and a Telegram alert lands on your phone with the monitor name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is uptime monitoring?',
        answer:
          'A service outside your infrastructure that requests your URL on a fixed interval and alerts you when the answer is wrong or missing. It answers one question, can a request reach my app right now, and it answers it every few minutes for as long as the app exists.',
      },
      {
        question: 'How does uptime monitoring work?',
        answer:
          'A server you do not run sends an HTTP request to your URL every 5 minutes, every minute or every 15 seconds, depending on the plan. A status from 200 to 399 is up. Anything else, or no answer within 10 seconds, is down. A change of state sends an alert, in Logdash to Telegram or a webhook.',
      },
      {
        question: 'What is website uptime monitoring?',
        answer:
          'The same check pointed at a website. For a static site the homepage is enough. For an app, monitor a health endpoint that touches the database, because a cached homepage can stay green while the app behind it fails.',
      },
      {
        question: 'Which uptime monitoring tool should I use?',
        answer:
          'Uptime Kuma if you want to self-host and have a server separate from your app; it is MIT licensed and covers TCP, ping, DNS and keyword checks. UptimeRobot if you need 50 free monitors, or check types Logdash lacks such as SSL expiry and keyword. Logdash if you want HTTP checks, heartbeats, a status page and your app logs and metrics in one place.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: '99-9-uptime-downtime',
    h1: 'How much downtime is 99.9% uptime',
    answer:
      '99.9% uptime allows 8 hours 45 minutes 57.6 seconds of downtime per year, 43 minutes 49.8 seconds per average month, 10 minutes 4.8 seconds per week and 1 minute 26.4 seconds per day.',
    meta: {
      title: 'How much downtime is 99.9% uptime? | Logdash',
      description:
        '99.9% uptime is 8.77 hours of downtime a year, 43.8 minutes a month and 86.4 seconds a day. The exact math, calendar months, and what a 5-minute check sees.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The 0.1% is the whole story. A year of 365.25 days is 525,960 minutes, and 0.1% of that is 525.96 minutes. That is your downtime budget for the year, and every number below is the same budget cut into smaller periods.',
      },
      { type: 'heading', text: '99.9 uptime means how much downtime' },
      {
        type: 'list',
        items: [
          'Per year: 525.96 minutes, which is 8.766 hours or 8 h 45 min 57.6 s.',
          'Per average month of 30.4375 days: 43.83 minutes, or 43 min 49.8 s.',
          'Per week: 10.08 minutes, or 10 min 4.8 s.',
          'Per day: 86.4 seconds, or 1 min 26.4 s.',
        ],
      },
      { type: 'heading', text: '99.9 uptime hours per year' },
      {
        type: 'paragraph',
        text: '8.77 hours, if the year is 365.25 days. Use 365 days and it drops to 8.76 hours; use 366 and it is 8.78. The difference is about a minute at most, so any of them is fine for planning. What matters is that 8.77 hours is one working day. One bad migration that takes a full day to roll back spends the whole year.',
      },
      { type: 'heading', text: '99.9 uptime hours per month' },
      {
        type: 'paragraph',
        text: '0.73 hours, or 43.8 minutes, for an average month. Real months are not average, and contracts measure calendar months, so the budget moves: 40.32 minutes in a 28-day February, 43.2 minutes in a 30-day month and 44.64 minutes in a 31-day month. February gives you 4.3 minutes less than March for the same promise.',
      },
      { type: 'heading', text: 'The math, for any target' },
      {
        type: 'code',
        language: 'bash',
        title: 'Change target to 99.99, 99.95 or 99.5',
        code: `awk -v target=99.9 'BEGIN {
  down = (100 - target) / 100
  year = 365.25 * 24 * 60   # minutes in a year
  printf "per year:  %.1f min (%.2f h)\\n", year * down, year * down / 60
  printf "per month: %.1f min\\n", year / 12 * down
  printf "per week:  %.1f min\\n", 7 * 24 * 60 * down
  printf "per day:   %.1f s\\n", 24 * 60 * 60 * down
}'

# per year:  526.0 min (8.77 h)
# per month: 43.8 min
# per week:  10.1 min
# per day:   86.4 s`,
      },
      {
        type: 'list',
        items: [
          '99%: 3 d 15 h 39.6 min a year, 7 h 18.3 min a month.',
          '99.5%: 1 d 19 h 49.8 min a year, 3 h 39.2 min a month.',
          '99.95%: 4 h 23 min a year, 21.9 min a month.',
          '99.99%: 52.6 min a year, 4.4 min a month.',
        ],
      },
      { type: 'heading', text: 'What 99.9% looks like to a 5-minute check' },
      {
        type: 'paragraph',
        text: 'A monitor that checks every 5 minutes makes 8,766 checks in an average month. 0.1% of that is 8.77, so 8 failed checks leave you at 99.909% and the ninth puts you at 99.897%. Logdash computes uptime the same way, successful checks over all checks, so the number is only as precise as the interval. An outage shorter than 5 minutes can fall between two checks and cost you nothing on paper. At one check a minute the month is 43,830 checks and 43 failures fit in the budget.',
      },
      { type: 'heading', text: '99.9 uptime SLA' },
      {
        type: 'paragraph',
        text: 'A 99.9% SLA from a provider covers their service, measured their way, and pays back in credits on their bill. It says nothing about the app you built on top. If a request needs three services and each one hits exactly 99.9%, the most you can promise is 0.999 cubed, 99.7%, which is about 2 hours 11 minutes a month. Your own code and deploys come out of what is left.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the address of your health endpoint, or your homepage if the site is static. The first check runs straight away, so a wrong path shows up in seconds rather than during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'At 99.9% the monthly budget is 43.8 minutes, and a 5-minute interval can spend 5 of those, 11%, before the first failed check. Every minute on Builder brings that to 1 minute. Every 15 seconds on Pro brings it to 15 seconds.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then stop the app or make the endpoint return 503. An alert you never tested is an alert you cannot trust. On the next check the monitor flips to down and a Telegram alert lands on your phone with the monitor name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: '99.9 uptime means how much downtime?',
        answer:
          '0.1% of the period: 8 hours 45 minutes 57.6 seconds per year of 365.25 days, 43 minutes 49.8 seconds per average month, 10 minutes 4.8 seconds per week and 86.4 seconds per day.',
      },
      {
        question: 'What is 99.9 uptime in hours per year?',
        answer:
          '8.766 hours, from 8,766 hours in a 365.25-day year times 0.001. With a 365-day year it is 8.76 hours. Either way it is roughly one working day of downtime for the whole year.',
      },
      {
        question: 'What is 99.9 uptime in hours per month?',
        answer:
          '0.73 hours, which is 43.83 minutes, for an average month. A 30-day month allows 43.2 minutes, a 31-day month 44.64 minutes and a 28-day February 40.32 minutes.',
      },
      {
        question: 'What does a 99.9 uptime SLA promise?',
        answer:
          "That the provider's service will be unavailable for no more than 0.1% of the measured period, usually a calendar month, as measured by the provider. If it misses, you can claim a service credit, a percentage of that month's bill for the service. It does not cover your own code or your lost revenue.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'uptime-sla',
    h1: 'Uptime SLA',
    answer:
      "An uptime SLA is a provider's written promise that a service will be available for a set share of each month, such as 99.9% or 99.99%, with a service credit off that month's bill when it falls short.",
    meta: {
      title: 'Uptime SLA: meaning, 99.99 and the math | Logdash',
      description:
        'What an uptime SLA promises, what 99.99 allows per month, how credits work on a real SLA like AWS EC2, and a calculator you can paste and run.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "An SLA reads like an uptime guarantee. It is not one. It is a refund policy with a number on top. The provider promises a share of the month, measures it themselves, and if they miss, you get a percentage of that service's bill back, usually only after you ask for it. Knowing that changes how much weight a 99.99 on a pricing page should carry.",
      },
      { type: 'heading', text: 'Uptime SLA meaning: the three parts' },
      {
        type: 'list',
        items: [
          'The target. The number of nines, almost always per calendar month. 99.9% is 43.2 minutes in a 30-day month, 99.99% is 4.32 minutes.',
          "The measurement. How downtime is defined and who measures it. Usually minutes in which the service was unavailable, by the provider's own definition and from the provider's own data.",
          "The remedy. A service credit, a percentage of that month's bill for the affected service, in tiers that grow as uptime drops.",
        ],
      },
      { type: 'heading', text: 'A real one: AWS EC2' },
      {
        type: 'paragraph',
        text: 'AWS commits to 99.99% monthly uptime for EC2 at the region level and 99.5% for a single instance. Monthly uptime is 100% minus the percentage of minutes the service was unavailable. The region-level credits are 10% of the bill below 99.99%, 30% below 99.0% and 100% below 95.0%. You get nothing unless you open a support case by the end of the second billing cycle after the incident, and outages caused by your own software are excluded. A 4-hour outage in a 30-day month is 99.44% uptime, which buys a 10% credit on the EC2 bill, not on the launch day it cost you.',
      },
      { type: 'heading', text: 'Uptime SLA 99.99' },
      {
        type: 'paragraph',
        text: 'Four nines allow 4.38 minutes of downtime in an average month and 52.6 minutes in a year. That is tight enough that a 5-minute check cannot verify it: one failed check already counts as up to 5 minutes. At 15-second checks a 30-day month is 172,800 checks, and 17 failures fit inside 99.99%. If you promise four nines to your own customers, you need sub-minute checks just to know whether you kept the promise.',
      },
      { type: 'heading', text: 'Uptime SLA calculator' },
      {
        type: 'code',
        language: 'python',
        title: 'sla.py',
        code: `def monthly_uptime(down_minutes, days_in_month=30):
    total = days_in_month * 24 * 60
    return 100 * (total - down_minutes) / total

def credit(uptime):
    # AWS EC2 region-level tiers, as an example
    if uptime >= 99.99:
        return 0
    if uptime >= 99.0:
        return 10
    if uptime >= 95.0:
        return 30
    return 100

uptime = monthly_uptime(52)  # 52 minutes down in a 30-day month
print(f"{uptime:.3f}% uptime, {credit(uptime)}% credit")

# 99.880% uptime, 10% credit`,
      },
      {
        type: 'paragraph',
        text: "Swap the tiers for the ones in your provider's SLA and the days for the month you are claiming. The input that matters is down minutes, and the provider will use their number, not yours, so keep your own record with timestamps.",
      },
      { type: 'heading', text: 'What an SLA will never cover' },
      {
        type: 'list',
        items: [
          'Your code. A deploy that breaks login is 100% your downtime and 0% theirs.',
          'The chain. Three dependencies at 99.9% each give your app a ceiling of 99.7%, about 2 hours 11 minutes a month.',
          'Your losses. Credits are a share of the provider bill, and AWS issues none under one dollar.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the address of your health endpoint, or your homepage if the site is static. The first check runs straight away, so a wrong path shows up in seconds rather than during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'Match the interval to the target you care about. For 99.9% a 1-minute check on Builder is enough to see a breach. For 99.99% use 15 seconds on Pro. The down and up alerts carry timestamps, which is the record you take to a claim.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then stop the app or make the endpoint return 503. An alert you never tested is an alert you cannot trust. On the next check the monitor flips to down and a Telegram alert lands on your phone with the monitor name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is an uptime SLA?',
        answer:
          'A contract term in which a provider promises a service will be available for a set share of each month, and pays a service credit when it is not. It is a refund policy, not a guarantee that nothing breaks.',
      },
      {
        question: 'Uptime SLA meaning: what counts as downtime?',
        answer:
          'Whatever the SLA defines, measured by the provider. AWS EC2 counts minutes in which the service was unavailable and excludes outages caused by your own software or by factors outside its reasonable control. Read the definitions section before you trust the number.',
      },
      {
        question: 'How much downtime does an uptime SLA 99.99 allow?',
        answer:
          '4.32 minutes in a 30-day month, 4.38 minutes in an average month and 52.6 minutes in a 365.25-day year. Verifying it takes sub-minute checks, since a single failed 5-minute check is already over the monthly budget.',
      },
      {
        question: 'How does an uptime SLA calculator work?',
        answer:
          'It divides the minutes your service was up by the minutes in the month, then maps the result to the credit tiers. 52 minutes down in a 30-day month is 99.880%, which on the EC2 region-level SLA is a 10% credit.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'uptime-vs-downtime',
    h1: 'Uptime vs downtime',
    answer:
      'Uptime is the share of a period in which your service answered correctly and downtime is the share in which it did not, so the two always add up to 100%: 99.9% uptime is 0.1% downtime, or 43.8 minutes in an average month.',
    meta: {
      title: 'Uptime vs downtime: meaning and math | Logdash',
      description:
        'Uptime and downtime always add up to 100%. What counts as down, two ways to calculate both, and why downtime in minutes is the number to watch.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Uptime is usually quoted as a percentage and downtime as a duration, but they are the same measurement read from opposite ends. A month of 43,830 minutes at 99.9% uptime has 43.8 minutes of downtime. Say the second number out loud and the first one stops sounding like a rounding error.',
      },
      { type: 'heading', text: 'Uptime and downtime meaning' },
      {
        type: 'paragraph',
        text: 'Both need a definition of up before they mean anything. For an HTTP monitor, up is a status code from 200 to 399 within the timeout. Down is everything else: a 404 on the health path, a 500 from a crashed handler, a 503 from a health check that could not reach the database, or no answer at all. Logdash gives a request 10 seconds and records a timeout as status code 0. A page that returns 200 with an error message in the body is up, as far as a status-code check can tell.',
      },
      { type: 'heading', text: 'How to calculate uptime and downtime' },
      {
        type: 'paragraph',
        text: 'There are two formulas. Counting minutes: uptime is minutes up divided by minutes in the period, which is how every SLA is written. Counting checks: uptime is successful checks divided by all checks, which is what a check-based monitor computes, Logdash included. Downtime is 100% minus uptime in both. You can run the second one yourself with nothing but curl and awk.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Record checks, then count them',
        code: `# one check, appended as "timestamp status" (000 = no answer in 10 s)
echo "$(date -u +%FT%TZ) $(curl -s -o /dev/null -m 10 -w '%{http_code}' https://example.com/health)" >> checks.log

# uptime and downtime from every check so far
awk '{ n++; if ($2 >= 200 && $2 < 400) up++ }
  END { printf "uptime %.3f%%  downtime %.3f%%  failed %d of %d checks\\n", 100*up/n, 100*(n-up)/n, n-up, n }' checks.log

# uptime 99.909%  downtime 0.091%  failed 8 of 8766 checks`,
      },
      {
        type: 'comparison',
        title: 'Logdash counts checks, SLAs count minutes',
        them: 'SLA math',
        rows: [
          {
            feature: 'Formula',
            logdash: 'Successful checks over all checks',
            them: 'Minutes up over minutes in the period',
            winner: 'tie',
          },
          {
            feature: 'Data you need',
            logdash: 'None extra, the monitor counts checks as it runs',
            them: 'A start and end time for every outage',
            winner: 'logdash',
          },
          {
            feature: 'A 3-minute outage with 5-minute checks',
            logdash: '0 or 1 failed checks, so 0 or 5 minutes',
            them: '3 minutes',
            winner: 'them',
          },
          {
            feature: 'Precision',
            logdash:
              'One interval: 5 minutes free, 1 minute on Builder, 15 seconds on Pro',
            them: 'To the minute, if someone wrote the times down',
            winner: 'them',
          },
          {
            feature: 'Works at 3am with nobody watching',
            logdash: 'Yes',
            them: 'Only if something recorded the outage',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'SLA math',
        reasons: [
          'You are checking a provider against its SLA, or writing one. Contracts count minutes, so convert to minutes before you compare.',
          'You have exact start and end times from logs or an incident timeline. That beats any check interval.',
          'Your checks run every 5 minutes and the outages are short. Check counts will round them to 0 or 5 minutes each.',
        ],
      },
      { type: 'heading', text: 'Why downtime is the number to watch' },
      {
        type: 'paragraph',
        text: '99.9% and 99.5% look 0.4 points apart. In downtime it is 43.8 minutes a month against 3 hours 39 minutes, five times more. Uptime percentages compress exactly the part you care about, so set targets and write postmortems in minutes. Count the time to notice too: on a 5-minute interval an outage can be 5 minutes old before anyone knows, and those minutes are downtime whether or not a check saw them. A single one-hour outage takes that month to 99.86%, below three nines on its own.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the address of your health endpoint, or your homepage if the site is static. The first check runs straight away, so a wrong path shows up in seconds rather than during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. The shorter the interval, the closer the check count gets to the minute count.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then stop the app or make the endpoint return 503. An alert you never tested is an alert you cannot trust. On the next check the monitor flips to down and a Telegram alert lands on your phone with the monitor name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is uptime vs downtime?',
        answer:
          'Uptime is the share of time your service answered correctly, downtime is the share it did not, and together they make 100%. Uptime is usually quoted as a percentage, downtime as minutes: 99.9% uptime is 43.8 minutes of downtime in an average month.',
      },
      {
        question: 'What is the uptime and downtime meaning for a website?',
        answer:
          'For a website checked over HTTP, up means a status code from 200 to 399 within the timeout and down means anything else, including no answer. Logdash waits 10 seconds before it counts a request as down.',
      },
      {
        question: 'How to calculate uptime and downtime?',
        answer:
          'Divide minutes up by minutes in the period, or successful checks by all checks, and multiply by 100. That is uptime. Downtime is 100 minus that. 8 failed checks out of 8,766 is 99.909% uptime and 0.091% downtime.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'synthetic-monitoring-vs-real-user-monitoring',
    h1: 'Synthetic monitoring vs real user monitoring',
    answer:
      'Synthetic monitoring sends scripted requests to your app on a schedule, so it catches an outage at 3am with zero visitors, while real user monitoring records what actual visitors experience in their browsers, so it catches slow pages and errors no script ever hits.',
    meta: {
      title: 'Synthetic monitoring vs real user monitoring | Logdash',
      description:
        'Synthetic checks catch outages with zero traffic, RUM shows what real visitors see. What each one misses, where APM fits, and which to set up first.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "Logdash is synthetic monitoring. It sends HTTP requests to your URL from its own servers and alerts you when the answer is wrong. It is not real user monitoring and it does not run in your visitors' browsers. Both are worth having, and they fail in opposite directions, so it helps to know which hole each one leaves.",
      },
      { type: 'heading', text: 'What is synthetic monitoring' },
      {
        type: 'paragraph',
        text: 'A robot visitor on a timer. The simple kind sends one HTTP request and records the status code and response time. The heavy kind drives a headless browser through a script: log in, add to cart, pay. Logdash does the simple kind, one GET per check, every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro. It needs no traffic, so it works the same at 3am as at noon.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Synthetic: one scripted request',
        code: `curl -sS -L -o /dev/null -m 10 \\
  -w '%{http_code} in %{time_total}s\\n' \\
  https://example.com/health

# 200 in 0.084s`,
      },
      { type: 'heading', text: 'What real user monitoring records' },
      {
        type: 'paragraph',
        text: 'A script in your pages measures every real visit, such as how long the largest element took to paint, how fast the page reacted to a click and how much the layout jumped, then sends it home. That is per device, per country and per page, which no single check can give you. The catch is that it needs visitors. No traffic, no data, and an app that is fully down sends nothing at all.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Real user monitoring: what each visit reports',
        code: `import { onCLS, onINP, onLCP } from 'web-vitals';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    page: location.pathname,
  });
  navigator.sendBeacon('/rum', body);
}

onCLS(send);
onINP(send);
onLCP(send);`,
      },
      {
        type: 'comparison',
        title: 'Synthetic (Logdash) vs real user monitoring (RUM)',
        them: 'RUM',
        rows: [
          {
            feature: 'Where the data comes from',
            logdash: 'A request from Logdash servers on a schedule',
            them: "Every real page view, from the visitor's browser",
            winner: 'tie',
          },
          {
            feature: 'Full outage at 3am, no traffic',
            logdash: 'Caught within one interval',
            them: 'Silent, no visitors means no data',
            winner: 'logdash',
          },
          {
            feature: 'Slow pages on a phone in another country',
            logdash: 'Not visible, one request from one place',
            them: 'Visible per device, country and page',
            winner: 'them',
          },
          {
            feature: 'Front-end errors and layout shift',
            logdash: 'Not visible',
            them: 'Measured on every visit',
            winner: 'them',
          },
          {
            feature: 'Setup',
            logdash: 'Paste a URL',
            them: 'A script in every page and an endpoint to receive it',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'RUM',
        reasons: [
          'You care about Core Web Vitals. Google assesses them from real Chrome visits, not from lab or synthetic tests.',
          'The app is up and users still say it is slow. Only field data shows which page, which device and which country.',
          'You already host on Vercel. Speed Insights is free on every plan, with 10,000 events over a rolling 30 days and one overall Real Experience Score.',
        ],
      },
      { type: 'heading', text: 'Synthetic monitoring vs APM' },
      {
        type: 'paragraph',
        text: 'APM instruments your server code and traces each request through handlers, queries and outbound calls. It tells you which query made the endpoint slow. Synthetic monitoring tells you the endpoint was slow, or gone. APM cannot report a dead server, because the agent dies with it. Logdash is not APM: it has logs and metrics from eight SDKs beside each check, and no distributed tracing. If you need a scripted login flow tested, that is a browser check: Checkly runs Playwright scripts and its Hobby plan includes 1,000 browser runs a month.',
      },
      { type: 'heading', text: 'Which one first' },
      {
        type: 'paragraph',
        text: 'Synthetic. It covers the worst case, fully down, with zero traffic and one URL. Add RUM once you have enough visitors for the numbers to mean something.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the address of your health endpoint, or your homepage if the site is static. The first check runs straight away, so a wrong path shows up in seconds rather than during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check stores the status code and response time, so you get a latency chart from one place to set against your RUM data.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect a Telegram channel, then stop the app or make the endpoint return 503. An alert you never tested is an alert you cannot trust. On the next check the monitor flips to down and a Telegram alert lands on your phone with the monitor name, the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is synthetic monitoring?',
        answer:
          'Monitoring that sends scripted requests to your app on a schedule, either single HTTP checks or a headless browser running a script, and alerts you when the result is wrong. It works with zero traffic.',
      },
      {
        question:
          'Synthetic monitoring vs real user monitoring: which should I set up first?',
        answer:
          'Synthetic. It catches a full outage within one check interval even when nobody is on the site, and it takes one URL to set up. RUM needs a script in every page and enough visitors before its numbers mean anything.',
      },
      {
        question: 'Synthetic monitoring vs RUM: can one replace the other?',
        answer:
          'No. Synthetic sees one request from one place and misses slow pages for real users. RUM sees real visits and goes silent when the site is fully down. Logdash is synthetic only, so pair it with a RUM tool if field data matters to you.',
      },
      {
        question: 'Synthetic monitoring vs APM: what is the difference?',
        answer:
          'APM runs inside your server and traces where each request spends its time. Synthetic monitoring runs outside and checks whether the request works at all. APM explains a slow endpoint; synthetic catches the dead one APM cannot report from.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'what-is-heartbeat-monitoring',
    h1: 'What is heartbeat monitoring',
    answer:
      'Heartbeat monitoring turns the usual uptime check around: your job or worker calls a monitor URL every time it finishes a unit of work, and the monitor alerts you when those calls stop arriving.',
    meta: {
      title: 'What is heartbeat monitoring? | Logdash',
      description:
        'Heartbeat monitoring for software: the job pings the monitor, silence trips the alert. A worker loop you can paste, how it works with cron, and where it falls short.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'An HTTP uptime check asks your server a question every few minutes. That works for anything with a URL. A queue worker, a backup script, a data sync or a cron job has no URL to ask. It runs in the background, and when it dies it dies quietly: no 500, no error page, often no log line, just work that stops getting done. Heartbeat monitoring exists for that silence.',
      },
      { type: 'heading', text: 'How a heartbeat check works' },
      {
        type: 'list',
        items: [
          'The monitor gives you a unique URL. In Logdash it is a POST to api.logdash.io/ping/ followed by the monitor id, public, with no auth header and no body.',
          'Your process calls that URL each time it completes a pass of real work.',
          'The monitor keeps a window. A call inside the window means alive. An empty window means down, and the alert fires on that change.',
          'When the calls come back, the monitor flips to up and tells you that too.',
        ],
      },
      {
        type: 'paragraph',
        text: 'One design rule matters more than the tool: ping after the work, not on a timer beside it. A background thread that pings every 10 seconds while the main loop is stuck on a dead database connection reports healthy for the whole outage. A ping that only happens when a pass completes cannot lie that way.',
      },
      { type: 'heading', text: 'Heartbeat monitoring software in practice' },
      {
        type: 'paragraph',
        text: 'Logdash push monitors use a 15-second window on the Pro plan. That makes them a fit for things that run all the time: queue consumers, pollers, sync loops, websocket servers. This is the whole integration for a worker written as a shell loop:',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'worker.sh',
        code: `#!/usr/bin/env bash
# worker.sh - one pass of real work, then one heartbeat, forever.
set -euo pipefail

PING_URL="https://api.logdash.io/ping/\${LOGDASH_MONITOR_ID}"

while true; do
  /srv/app/bin/process-queue   # a failed pass ends the loop, so the pings stop
  curl -fsS -m 5 -X POST "$PING_URL" > /dev/null || true
  sleep 5                      # one pass plus the sleep must fit in 15 seconds
done`,
      },
      {
        type: 'paragraph',
        text: 'If process-queue exits non-zero, set -e ends the loop, the pings stop, and the next empty window marks the monitor down. If it hangs, same result. The || true on curl means a network blip on the ping itself never kills the worker. The endpoint allows 300 calls a minute per IP, so a ping every few seconds is nowhere near the limit.',
      },
      { type: 'heading', text: 'Heartbeat monitoring for cron' },
      {
        type: 'paragraph',
        text: 'A cron job is the textbook heartbeat case: append a curl to the crontab line with && so only a successful run reports in. The catch is the window. An hourly job needs a monitor that knows "hourly" and adds a grace period. Logdash does not. It expects a call in every 15-second window, so an hourly job would read as down for 59 minutes of every hour and alert you twice an hour. The cron monitoring explainer shows the HTTP check that works instead.',
      },
      { type: 'heading', text: 'Heartbeat check vs uptime check' },
      {
        type: 'paragraph',
        text: 'Most apps need both. An uptime check asks from outside whether the front door opens. A heartbeat asks from inside whether the work gets done. Your API can return 200 all week while the worker that sends receipts has been dead since Tuesday.',
      },
      {
        type: 'comparison',
        title: 'Logdash push monitors vs Cronitor heartbeats',
        them: 'Cronitor',
        rows: [
          {
            feature: 'Expected interval',
            logdash: 'Fixed 15-second window',
            them: 'A schedule you set, such as every 5 minutes, plus grace seconds',
            winner: 'them',
          },
          {
            feature: 'Plan',
            logdash: 'Pro only',
            them: '5 monitors on the free plan',
            winner: 'them',
          },
          {
            feature: 'A run that fails',
            logdash: 'Reported when the next window comes up empty',
            them: 'Reported at once with a ?state=fail ping',
            winner: 'them',
          },
          {
            feature: 'Free alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email and Slack',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cronitor',
        reasons: [
          'The job runs on a schedule. Cronitor knows it and alerts after the grace period; Logdash would alert between runs.',
          'You are not on Pro. Cronitor watches 5 jobs for free.',
          'You want a crashed run reported the moment it crashes, not one window later.',
        ],
      },
      { type: 'heading', text: 'Set one up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Push monitors are on the Pro plan. Open the Uptime page of your domain in Logdash, add a monitor, choose "You send heartbeats", and copy the id from the heartbeat endpoint.',
          },
          {
            title: 'Ping after the work',
            text: 'Export LOGDASH_MONITOR_ID, start the worker above, and the monitor goes green within one 15-second window.',
          },
          {
            title: 'Kill the worker',
            text: 'Stop the process. The next window comes up empty, the monitor flips to down, and a Telegram message lands on your phone naming the monitor and saying no call arrived. Start the worker again and a second message says it is back up.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is heartbeat monitoring software?',
        answer:
          'A service that hands you one URL per job, records every call to it, and alerts you when the calls stop. Healthchecks.io, Cronitor and the push monitor type in Uptime Kuma all work this way. Logdash push monitors do too, with a fixed 15-second window, so they suit always-on workers rather than scheduled jobs.',
      },
      {
        question: 'How does heartbeat monitoring work with cron?',
        answer:
          'Add a curl after && on the crontab line, so the ping only fires when the command exits 0. The monitor then has to know the schedule plus a grace period, or it alerts between runs. Healthchecks.io takes a cron expression with a timezone and a grace time. Logdash has no schedule setting, so for cron use an HTTP check on when the job last succeeded.',
      },
      {
        question: 'What is a heartbeat check?',
        answer:
          'One window in which the monitor expects a call. A call inside it means the process is alive and finished a pass. An empty window means it stopped, and that is when the alert goes out. In Logdash on Pro, one window is 15 seconds.',
      },
      {
        question: 'What is heartbeat monitoring compared to uptime monitoring?',
        answer:
          'Uptime monitoring pulls: the monitor requests your URL and judges the answer. Heartbeat monitoring is push: your process calls the monitor and the monitor judges the silence. Use uptime checks for anything with a URL and heartbeats for anything without one.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'what-is-cron-monitoring',
    h1: 'What is cron monitoring',
    answer:
      'Cron monitoring tells you when a scheduled job did not run or did not succeed, by having each successful run leave a signal and alerting you when the expected signal is missing.',
    meta: {
      title: 'What is cron monitoring? | Logdash',
      description:
        'Why failed cron jobs stay silent, the two ways to monitor them, a crontab and endpoint you can paste, and an honest look at which cron monitoring tool fits which job.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Cron has no idea whether your job worked. It starts the command at the scheduled minute and moves on. If the script exits 1, the output goes to a local mail spool nobody reads. If the server is rebuilt and the crontab is not, nothing runs and nothing complains. The usual way founders find out is a customer asking why invoices stopped, or a restore that finds the newest backup is 41 days old.',
      },
      { type: 'heading', text: 'How to monitor cron jobs' },
      {
        type: 'list',
        items: [
          'Push: the job calls a monitor URL after it succeeds, and the monitor alerts when a call is late. Dedicated cron monitoring tools work this way. They take your schedule, add a grace period, and alert at the moment a run should have reported in and did not.',
          'Pull: the job leaves evidence, such as a marker file or a row with a timestamp, and an HTTP endpoint returns 503 once that evidence is older than it should be. Any uptime monitor can watch that endpoint.',
          'Either way, chain the signal with && so a failed run stays quiet. A cron monitor that hears from a job that crashed is worse than no monitor.',
        ],
      },
      { type: 'heading', text: 'Watching a cron job with an HTTP check' },
      {
        type: 'paragraph',
        text: 'Logdash watches cron jobs the pull way. Its push monitors expect a call in every 15-second window, which suits always-on workers, not a job that runs once an hour. So the hourly job touches a file, and a small endpoint turns the age of that file into a status code.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `# Back up every hour. touch only runs when backup.sh exits 0.
0 * * * * /srv/app/bin/backup.sh && touch /var/lib/app/backup.ok`,
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'freshness.js',
        code: `// freshness.js - run next to the job: node freshness.js
const http = require('node:http');
const fs = require('node:fs');

const MARKER = '/var/lib/app/backup.ok';
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // hourly job, alert after 2 hours of silence

http
  .createServer((req, res) => {
    let ageMs = Infinity;
    try {
      ageMs = Date.now() - fs.statSync(MARKER).mtimeMs;
    } catch {
      // no marker yet: the job has never succeeded
    }
    const fresh = ageMs < MAX_AGE_MS;
    res.writeHead(fresh ? 200 : 503, { 'cache-control': 'no-store' });
    res.end(fresh ? 'ok\\n' : 'stale\\n');
  })
  .listen(8080);`,
      },
      {
        type: 'paragraph',
        text: 'It answers 200 while the last good run is under 2 hours old and 503 after that. Set the limit to one schedule interval plus your longest run, so a single slow night does not page you. If the app already has a health route, add the same file check there instead of running a second server.',
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Expose the check',
            text: 'Run freshness.js on the box where the job runs, or fold the check into your existing health route, and make the URL reachable from the internet.',
          },
          {
            title: 'Add an HTTP monitor',
            text: 'Add a monitor in Logdash and give it that URL. Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and each one records the status code and response time.',
          },
          {
            title: 'Break the job',
            text: 'Make backup.sh exit 1, or backdate the marker with touch -d "3 hours ago". On the next check the endpoint answers 503, the monitor flips to down, and a Telegram alert reaches your phone with the monitor name and the status code.',
          },
        ],
      },
      { type: 'heading', text: 'Cron monitoring tools' },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for cron jobs',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'How a job reports',
            logdash: 'Touches a file, an HTTP check reads its age',
            them: 'Pings a URL, with optional start and fail signals',
            winner: 'them',
          },
          {
            feature: 'Knows the schedule',
            logdash: 'No, you encode it as a maximum age',
            them: 'Period or cron expression with timezone, plus grace time',
            winner: 'them',
          },
          {
            feature: 'Free plan',
            logdash: 'Five monitors, HTTP checks every 5 minutes',
            them: '20 jobs, 100 log entries each',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Telegram, Slack, Discord and 20+ more',
            winner: 'them',
          },
          {
            feature: 'Uptime checks on the app itself',
            logdash: 'Yes, same dashboard',
            them: 'Not built, it only listens for pings',
            winner: 'logdash',
          },
          {
            feature: 'Self-hosting',
            logdash: 'AGPL-3.0, not a one-command install yet',
            them: 'BSD 3-clause, official Docker image',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'Most of what you run is scheduled jobs. A tool that reads the cron expression alerts within the grace time of a missed run, with no endpoint to write.',
          'You have 15 jobs across 4 servers. One curl per crontab line beats one freshness check per job.',
          'You need to know a run started and never finished. Start and success signals measure duration, and a file timestamp cannot.',
          'You want the alert by email. Logdash sends Telegram messages and webhooks only.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does cron email me when a job fails?',
        answer:
          'Only if the box can send mail. Cron mails whatever a job prints to the crontab owner, or to the MAILTO address, through the local mail system. Most cloud servers have none, so the output is dropped or sits in a local spool, and a job that fails without printing anything sends nothing at all.',
      },
      {
        question: 'How to monitor cron jobs?',
        answer:
          'Make every successful run leave a signal, chained with && so a failure leaves none. Then either ping a cron monitor that knows the schedule, or record a timestamp and serve it from an endpoint that returns 503 when it gets too old, watched by an uptime monitor.',
      },
      {
        question: 'How late can a cron monitor alert me?',
        answer:
          'A schedule-aware tool alerts at the expected run time plus the grace period you set. The HTTP check on this page alerts once the marker passes its maximum age, plus up to one check interval: 5 minutes on the free plan, 1 minute on Builder, 15 seconds on Pro.',
      },
      {
        question: 'What is cron monitoring in Logdash?',
        answer:
          'An HTTP monitor on an endpoint that reports when the job last succeeded. Logdash push monitors use a 15-second window, so they are a heartbeat for always-on workers, not a schedule-aware cron monitor.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'how-to-check-if-a-website-is-down',
    h1: 'How to check if a website is down',
    answer:
      'Load the site from a second network, such as your phone on mobile data, and run curl against it from a terminal: if both fail it is down for everyone, and if only your connection fails the problem sits between you and the site.',
    meta: {
      title: 'How to check if a website is down | Logdash',
      description:
        'Down for everyone or just you? Three checks in a minute: another network, curl, and a DNS lookup. Plus how to stop checking your own site by hand.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A page that will not load is one of five things: your connection, your DNS resolver, your browser, the site blocking you, or the site actually being down. The first four are "just me". Only the last is "down for everyone". Telling them apart takes about a minute, and guessing wrong costs more, because you either restart a healthy server or wait out an outage you could have fixed.',
      },
      { type: 'heading', text: 'How to check if a website is down or just me' },
      {
        type: 'list',
        items: [
          'Open it on your phone with wifi off. Mobile data means a different network, a different DNS resolver and a different IP address. If it loads there, the site is up and the problem is on your side.',
          'Try a private window. It skips cached redirects, cookies and extensions. A site that works in private but not in your normal window has a browser problem, not an outage.',
          'Ask a checker. Down For Everyone Or Just Me requests the site from its own servers and reports what it got. Downdetector works differently: it counts user reports, so it is good for Netflix or Slack and useless for a site with 40 visitors a day.',
        ],
      },
      { type: 'heading', text: 'Check it from a terminal' },
      {
        type: 'paragraph',
        text: 'curl tells you what the server actually answered, which a browser error page often hides. Swap in the domain you care about:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `# 1. What did the server answer, how fast, and from which IP?
curl -sS -o /dev/null -w '%{http_code} in %{time_total}s from %{remote_ip}\\n' https://example.com

# 2. What does your own resolver say the name points to?
dig +short example.com

# 3. What does a public resolver say? A different answer means stale local DNS.
dig +short example.com @1.1.1.1`,
      },
      {
        type: 'list',
        items: [
          '200 or a 301: the server is up. If the browser still fails, look at the browser, an extension or a cached redirect.',
          '500, 502, 503 or 504: the site is down for everyone. A 502 or 504 usually means the proxy in front is fine and the app behind it is not.',
          '000 with "Could not resolve host": DNS. Either the domain lapsed or your resolver is wrong, so compare the two dig answers.',
          '000 with "Failed to connect" or a timeout: nothing is listening, or a firewall dropped you. Try from mobile data before blaming the server.',
        ],
      },
      { type: 'heading', text: 'Check if website is down for everyone' },
      {
        type: 'paragraph',
        text: 'One request from one place is a sample of one. A site can be down in one region and fine in another, broken over IPv6 and fine over IPv4, or blocking your country while serving everyone else. The useful answer to "is it down for everyone" is a check that runs from outside your network on a schedule and keeps the history, so you can see when it started and whether it is still happening.',
      },
      {
        type: 'paragraph',
        text: 'If the site is yours, stop checking by hand. You only check after someone complains, which is the worst moment to find out.',
      },
      { type: 'heading', text: 'A monitor or curl by hand' },
      {
        type: 'comparison',
        title: 'Logdash vs checking with curl by hand',
        them: 'curl by hand',
        rows: [
          {
            feature: 'When it checks',
            logdash:
              'Every 5 minutes free, every minute on Builder, every 15 seconds on Pro',
            them: 'When you remember to',
            winner: 'logdash',
          },
          {
            feature: 'Rules out your own connection',
            logdash: 'Always, it runs outside your network',
            them: 'Only from a second network',
            winner: 'logdash',
          },
          {
            feature: 'Why it failed',
            logdash: 'Status code and error message',
            them: 'dig and the curl error show the cause',
            winner: 'them',
          },
          {
            feature: 'Setup',
            logdash: 'One form, free for 5 monitors',
            them: 'Nothing, curl is already installed',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'curl by hand',
        reasons: [
          "The site is not yours. You want one answer now, not a monitor on someone else's server.",
          'You are mid-incident and need the DNS answer or the exact connection error. The monitor says it failed, the commands say why.',
        ],
      },
      { type: 'heading', text: 'Make a monitor check it for you' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and give it the address. The free plan covers five monitors checked every 5 minutes, Builder checks every minute and Pro every 15 seconds. Every check stores the status code and response time.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. The bot sends a welcome message straight away, so you know the wiring works before you need it.',
          },
          {
            title: 'Take it down on purpose',
            text: 'Stop the server or make the URL return 503. On the next check the monitor flips to down and a Telegram message reaches your phone with the site name, the status code and the error, such as "Timed out after 10s".',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How to check if a website is down or just me?',
        answer:
          'Load it on your phone with wifi off. A different network and DNS resolver either reproduce the problem or rule out your connection. If it loads there, it is just you: flush your DNS, try a private window, and turn off any VPN.',
      },
      {
        question: 'How to check if a website is down for everyone?',
        answer:
          'Use a checker that requests the site from its own servers, such as Down For Everyone Or Just Me, or run curl from a server in another region. For your own site, an uptime monitor answers the question continuously and keeps the history.',
      },
      {
        question: 'How to check if a website is down from the command line?',
        answer:
          'curl -sS -o /dev/null -w "%{http_code}" followed by the URL prints the status code. 200 to 399 means up, any other code means down, and 000 means no HTTP answer at all, with the reason on the line above.',
      },
      {
        question:
          'How to check if a website is down without checking it yourself?',
        answer:
          'Point an uptime monitor at it. Logdash checks every 5 minutes on the free plan and sends a Telegram message the moment a check fails and again when it recovers.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'how-to-get-notified-when-a-website-is-down',
    h1: 'How to get notified when a website is down',
    answer:
      'Point an uptime monitor at the URL and connect an alert channel you actually read: the monitor requests the site every few minutes and messages you the moment a check fails, then again when it recovers.',
    meta: {
      title: 'How to get notified when a website is down | Logdash',
      description:
        'Website down alerts in three steps: a monitor, a channel, a test. Telegram and webhooks in Logdash, a cron script if you run a spare server, and when another tool fits.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A website down notification has three parts. Something outside your server requests the site on a schedule. Something decides whether the answer counts as down. Something delivers that decision to a place you look. Most setups that fail, fail at the third part: the alert lands in an inbox filter or a team channel muted since March.',
      },
      { type: 'heading', text: 'What triggers a website down alert' },
      {
        type: 'list',
        items: [
          'Logdash requests the URL with a GET every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
          'Any status from 200 to 399 is up. Anything else is down, and so is no answer at all: a timeout after 10 seconds, a refused connection, a name that does not resolve, an expired certificate.',
          'The alert fires on the change, not on every failed check. One message when it goes down, one when it comes back, silence in between, so a 4-hour outage costs you two messages instead of 48.',
          'There is no retry before alerting. One failed check is a down alert, so a flaky endpoint will tell you it is flaky.',
        ],
      },
      { type: 'heading', text: 'Website down alert channels' },
      {
        type: 'paragraph',
        text: 'Logdash delivers to two places: Telegram and webhooks. Telegram is the one we recommend, because it is on your phone, it makes a sound, and a bot message does not get filtered into Promotions. The webhook calls any public URL you choose, so your own code can route the alert anywhere, email included. There is no built-in email, and the JSON body and custom headers need a paid plan; on the free plan the webhook is a bare GET.',
      },
      {
        type: 'heading',
        text: 'Without a monitor: cron and the Telegram bot API',
      },
      {
        type: 'paragraph',
        text: 'If you already run a second server, a short script gets you the same kind of alert. It checks once, compares the result with the last one, and messages Telegram only when the state changes.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'notify-down.sh',
        code: `#!/usr/bin/env bash
# notify-down.sh URL - one check, and a Telegram message when up/down changes.
# Cron it on a machine that does not host the site:
# */5 * * * * TELEGRAM_TOKEN=... TELEGRAM_CHAT_ID=... /usr/local/bin/notify-down.sh https://example.com/health
url="$1"
state="/tmp/notify-down-$(printf '%s' "$url" | tr -c 'a-zA-Z0-9' '_')"

code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$url")
if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then now=up; else now=down; fi

if [ "$now" != "$(cat "$state" 2>/dev/null)" ]; then
  echo "$now" > "$state"
  curl -s "https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage" \\
    --data-urlencode "chat_id=\${TELEGRAM_CHAT_ID}" \\
    --data-urlencode "text=\${url} is \${now} (HTTP \${code})" > /dev/null
fi`,
      },
      {
        type: 'paragraph',
        text: 'That is the core of what a monitor does, minus the parts you now own. It dies with the machine it runs on, it checks from one place, it keeps no history beyond the last state, and the bot token sits in a crontab.',
      },
      { type: 'heading', text: 'Set it up' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Add a monitor in Logdash and give it the URL your users load, or better, a health route that also checks the database.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel and attach it to the monitor. The bot sends a welcome message right away, which proves the chat id is right.',
          },
          {
            title: 'Test the alert',
            text: 'Stop the app or make the health route return 503. On the next check the monitor flips to down and the Telegram alert lands, naming the monitor with the status code and the error. Start it again and a second message says it is back up.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot for down alerts',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Email alerts',
            logdash: 'Not built, webhook to your own sender',
            them: 'Included on the free plan',
            winner: 'them',
          },
          {
            feature: 'Telegram alerts',
            logdash: 'Free plan',
            them: 'Solo plan and up',
            winner: 'logdash',
          },
          {
            feature: 'Webhook alerts',
            logdash: 'Bare GET on free, JSON body and headers from Builder',
            them: 'Team plan and up',
            winner: 'logdash',
          },
          {
            feature: 'SMS and voice calls',
            logdash: 'Not built',
            them: 'Available with paid credits',
            winner: 'them',
          },
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Free monitors',
            logdash: 'Five monitors',
            them: '50 monitors',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'Email is the only channel you will ever check. UptimeRobot sends it on the free plan; Logdash needs your own relay behind a paid-plan webhook.',
          'You want a text message or a phone call when the site goes down. Logdash does neither.',
          'You watch more than five sites and want them all free. UptimeRobot gives you 50 monitors at the same 5-minute interval.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How to get notified when a website is down for free?',
        answer:
          'Add the URL to a free uptime monitor and connect a channel. Logdash checks five monitors every 5 minutes on the free plan and alerts through Telegram or a webhook. UptimeRobot checks 50 monitors every 5 minutes for free and alerts by email.',
      },
      {
        question: 'How do I get notified when a website is back up?',
        answer:
          'The same monitor does it. Logdash sends a second message on the first check that passes after an outage, so the gap between the down and the up message is how long the site was down. No up message means it still is.',
      },
      {
        question: 'How fast does a website down alert arrive?',
        answer:
          'Within one check interval of the failure: up to 5 minutes on the Logdash free plan, 1 minute on Builder, 15 seconds on Pro. The message goes out as soon as the failing check finishes, and a check gives up after 10 seconds.',
      },
      {
        question: 'What should a website down notification include?',
        answer:
          'Which monitor failed, the status code, and the error. Logdash sends all three, for example a 0 with "Timed out after 10s", which already tells you whether to look at the app, the proxy or the network.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'why-is-my-website-down',
    h1: 'Why is my website down',
    answer:
      'Most outages come from six causes: a bad deploy, a crashed app or database, a full disk, an expired domain or SSL certificate, a broken DNS record, or your host having its own outage, and the error you see already narrows it to one or two.',
    meta: {
      title: 'Why is my website down? | Logdash',
      description:
        'The common website down reasons, how to tell which one you have from the error you see, a copy-paste diagnosis script, and how to hear about the next outage first.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Start with what changed. Outages without a cause are rare, outages whose cause nobody remembers are common. A deploy 20 minutes ago, a DNS edit yesterday, a card that expired last month on the account that pays for the domain. Then read the error, because the error already rules out most of the list.',
      },
      { type: 'heading', text: 'Website down reasons, by the error you see' },
      {
        type: 'list',
        items: [
          '502 Bad Gateway or 504 Gateway Timeout: the proxy or CDN is up and the app behind it is not. A crashed process, an out-of-memory kill, or a deploy that never started listening.',
          '500 Internal Server Error: the app runs but throws. Usually the last deploy or a database it cannot reach. The logs from that minute name it.',
          '503 Service Unavailable: the host, the load balancer or your own health check says it cannot serve. Check your provider status page before your code.',
          'Could not resolve host, or DNS_PROBE_FINISHED_NXDOMAIN in Chrome: the name points nowhere. An expired domain or a broken DNS record.',
          '"Your connection is not private": the SSL certificate expired or does not match the name. Auto-renewal fails silently more often than anyone admits.',
          'Connection refused or a timeout: the server is off, the port is closed, or a firewall drops you. A full disk ends here too, once the app cannot write and stops answering.',
        ],
      },
      { type: 'heading', text: 'Find out which one in a minute' },
      {
        type: 'code',
        language: 'bash',
        code: `SITE=example.com

# Status code, time, and the IP the request actually went to
curl -sS -o /dev/null -w '%{http_code} in %{time_total}s from %{remote_ip}\\n' "https://$SITE"

# Does the name resolve? Empty output means DNS.
dig +short "$SITE"

# When does the SSL certificate expire?
echo | openssl s_client -connect "$SITE:443" -servername "$SITE" 2>/dev/null \\
  | openssl x509 -noout -enddate

# When does the domain expire?
whois "$SITE" | grep -i 'expir'`,
      },
      {
        type: 'paragraph',
        text: 'A status of 000 means curl got no HTTP answer at all, and the line it prints above says why. An empty dig answer means DNS. A notAfter date in the past means the certificate. An expiry date in the past means renew the domain before anything else.',
      },
      { type: 'heading', text: 'Why is my website down for me but not others' },
      {
        type: 'paragraph',
        text: 'If the site loads on your phone over mobile data but not on your laptop, the site is fine. The usual suspects: your resolver still caching an old IP after a migration, a firewall or WAF rule that blocked your IP after too many requests, a VPN exit the host refuses, or a browser holding a cached 301 to a dead URL. Flush DNS, try a private window, turn the VPN off, in that order.',
      },
      { type: 'heading', text: 'Why is my website not loading but not down' },
      {
        type: 'paragraph',
        text: 'A 200 that takes 9 seconds is an outage to the user and a green tick to most monitors. Slow pages come from a query without an index, a connection pool at its limit, or a third-party script that blocks rendering. Watch response time, not only status. A check that went from 200 ms to 4 seconds over a week is telling you something before anything goes down. Logdash records the response time of every check and counts anything slower than 10 seconds as down.',
      },
      { type: 'heading', text: 'Hear about the next one from a monitor' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and point it at the site or its health route. Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. The bot confirms the setup with a welcome message.',
          },
          {
            title: 'Break it once',
            text: 'Stop the app for one check. The monitor flips to down and a Telegram alert reaches your phone with the status code and the error, so the first line of your diagnosis arrives with the alert.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'Every cause on this list ends as a failed HTTP check, so the monitor catches all of them once they happen. It does not warn you before a certificate or a domain expires. It tells you on the first check that fails because one did.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Why is my website down for me?',
        answer:
          'If it loads on mobile data, the problem is your side: a cached DNS answer, a firewall rule that blocked your IP, a VPN, or a cached redirect in the browser. Flush DNS, open a private window and turn off the VPN.',
      },
      {
        question: 'Why is my website not loading?',
        answer:
          'Read the error first. 502 or 504 means the app behind the proxy died, 500 means the app throws, a DNS error means the name points nowhere, and a privacy warning means the certificate. A blank page that spins is usually slowness, not an outage.',
      },
      {
        question: 'What are the most common website down reasons?',
        answer:
          'A bad deploy, a crashed app or database, a full disk, an expired domain or certificate, a broken DNS record, and the hosting provider having an outage. The first two account for most of the incidents a small team sees.',
      },
      {
        question: 'Why is my website down after a deploy?',
        answer:
          'Usually the new build never started listening, a migration did not run, or an environment variable is missing. The logs from the first minute after the deploy name it. Roll back first, read the logs second.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'mttr',
    h1: 'MTTR',
    answer:
      'MTTR is the average time it takes to get a broken service working again: add up the downtime from every incident and divide by the number of incidents, so four outages of 12, 47, 6 and 31 minutes give an MTTR of 24 minutes.',
    meta: {
      title: 'MTTR: meaning, formula and MTTR vs MTBF | Logdash',
      description:
        'MTTR is total downtime divided by the number of incidents. The four meanings of the acronym, the formula with a worked example, MTTR vs MTBF, and how to measure it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'MTTR is the number you quote after an outage. The arithmetic is one division; the hard part is where the clock starts. Start it when someone opens a laptop and every minute nobody knew about the outage drops out of the report, and those are usually the longest minutes.',
      },
      { type: 'heading', text: 'MTTR meaning: four metrics, one acronym' },
      {
        type: 'paragraph',
        text: 'The R means four different things depending on who wrote the runbook. Check which one before you compare two numbers.',
      },
      {
        type: 'list',
        items: [
          'Mean time to repair: from the start of the repair work to the fix. It leaves out the time it took to notice.',
          'Mean time to recovery, or restore: from the moment the service broke to the moment users could use it again. This matches what your customers felt, and it is the one this page means.',
          'Mean time to respond: from the first alert to a human acknowledging it and starting work. Some teams call this MTTA, mean time to acknowledge.',
          'Mean time to resolve: from the break to the root cause being fixed for good. Often days, because it includes the follow-up after service is back.',
        ],
      },
      { type: 'heading', text: 'MTTR formula' },
      {
        type: 'paragraph',
        text: 'MTTR = total downtime / number of incidents. Take a month with four outages of 12, 47, 6 and 31 minutes. That is 96 minutes over 4 incidents, an MTTR of 24 minutes. One bad night dominates the average: drop the 47 and it falls to 16 minutes. Once you have more than a handful of incidents, report the median next to the mean.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `# minutes from each down alert to its up alert
printf '%s\\n' 12 47 6 31 |
  awk '{ total += $1; n++ } END { printf "MTTR %.1f min over %d incidents\\n", total / n, n }'
# MTTR 24.0 min over 4 incidents`,
      },
      { type: 'heading', text: 'How to calculate MTTR from uptime alerts' },
      {
        type: 'paragraph',
        text: 'You need two timestamps per incident: when it went down and when it came back. An external uptime monitor records both for you. Logdash sends one alert when a monitor flips to down and another when it flips back to up, so the gap between the red and the green message is your recovery time, measured from outside your stack.',
      },
      {
        type: 'paragraph',
        text: 'One caveat: the clock starts on the first failed check, not the first failed request, so a 5-minute interval can hide up to 5 minutes of every incident. At 15 seconds that error nearly disappears. The receiver below turns the alerts into a running MTTR. It needs a webhook channel set to POST, which is a paid-plan option; the free plan sends a GET with no body.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'mttr.mjs',
        code: `// mttr.mjs - run with: node mttr.mjs
// Point a Logdash webhook channel (method POST) at this server.
import { createServer } from 'node:http';

const downSince = new Map();
const outages = [];

createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    res.end('ok');
    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return; // not a Logdash alert
    }
    const { httpMonitorId, newStatus, name } = event;

    if (newStatus === 'down') downSince.set(httpMonitorId, Date.now());
    if (newStatus !== 'up' || !downSince.has(httpMonitorId)) return;

    outages.push(Date.now() - downSince.get(httpMonitorId));
    downSince.delete(httpMonitorId);

    const mttr = outages.reduce((sum, ms) => sum + ms, 0) / outages.length;
    console.log(\`\${name} is back. MTTR over \${outages.length} outages: \${(mttr / 60000).toFixed(1)} min\`);
  });
}).listen(3000);`,
      },
      { type: 'heading', text: 'MTTR vs MTBF' },
      {
        type: 'paragraph',
        text: 'MTBF, mean time between failures, is total uptime divided by the number of failures. MTTR says how fast you recover, MTBF says how often you have to. Together they give availability: MTBF / (MTBF + MTTR). A service that breaks once a month, an MTBF of about 43,200 minutes, and takes 43 minutes to recover sits at 99.9%. Halve the MTTR and it is at 99.95% without preventing a single failure.',
      },
      {
        type: 'paragraph',
        text: 'For a small team, MTTR is the lever you can actually pull. Failures come from deploys, hosts and third parties you only partly control. Recovery time is mostly detection plus finding the cause, and both shrink with a shorter check interval and the error logs one click from the monitor.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Point a monitor at the service',
            text: 'Add the health URL as an HTTP monitor. Every check stores the status code and response time, every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel for whoever fixes things. If you want the MTTR computed for you, add a POST webhook pointing at the receiver above as a second channel.',
          },
          {
            title: 'Break it and time the recovery',
            text: 'Stop the app, wait a few minutes, start it again. Your first MTTR data point is the gap between the down alert and the up alert that reach you on Telegram.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the MTTR formula?',
        answer:
          'Total downtime divided by the number of incidents. 96 minutes of downtime across 4 incidents is an MTTR of 24 minutes. Use the same start and end points for every incident, or the average means nothing.',
      },
      {
        question: 'MTTR vs MTBF: what is the difference?',
        answer:
          'MTTR measures how long a failure lasts, MTBF measures how long the service runs between failures. Availability is MTBF / (MTBF + MTTR), so you raise uptime either by failing less often or by recovering faster.',
      },
      {
        question: 'What is the MTTR meaning in incident management?',
        answer:
          'Usually mean time to recovery: from the service breaking to users being able to use it again. Repair, respond and resolve are the other three readings, and each starts or stops the clock at a different moment.',
      },
      {
        question: 'How to calculate MTTR if nobody logged the incidents?',
        answer:
          'Use your uptime alerts. Every incident has a down alert and an up alert; subtract and average. The result is accurate to one check interval, so 5 minutes on a 5-minute check and 15 seconds on a 15-second one.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'website-monitoring-open-source',
    h1: 'Open source website monitoring',
    answer:
      'Open source website monitoring means a checker whose code you can read and run yourself: Uptime Kuma or Gatus if you want to host it, Upptime if you want GitHub Actions to run it, and Logdash if you want the code open but the monitor run for you.',
    meta: {
      title: 'Open source website monitoring, compared | Logdash',
      description:
        "Uptime Kuma, Gatus, Upptime, Checkmate, OpenStatus and Logdash: each open source website monitor's licence, where it runs and who keeps it alive.",
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Open source answers one question: can you read the code and run it without asking anyone. It does not answer the question that matters at 3am, which is who keeps the monitor itself running. A self-hosted checker on the same VPS as your site goes down with your site and tells nobody. Pick by where it runs first and by licence second.',
      },
      { type: 'heading', text: 'Open source uptime monitors worth knowing' },
      {
        type: 'list',
        items: [
          'Uptime Kuma, MIT, 90,000+ GitHub stars. Runs on your server as one Docker container with a web UI. The default for a reason.',
          'Gatus, Apache 2.0, 12,000+ stars. One Go binary driven by a YAML file, on your server or as the managed version at gatus.io.',
          'Upptime, MIT, 17,000+ stars. Runs on GitHub Actions in your own repository, checks every 5 minutes, opens an issue per outage and publishes a status page on GitHub Pages.',
          'Checkmate, AGPL-3.0, 10,000+ stars. A newer Kuma-style app on Node.js and MongoDB, installed with Docker Compose.',
          'OpenStatus, AGPL-3.0, 9,000+ stars. Hosted with checks from 28 regions, or self-hosted with Docker Compose, where checks only run from probes you deploy.',
          'Logdash, AGPL-3.0. Hosted HTTP checks with status code and response time, Telegram and webhook alerts and a public status page, plus logs and metrics from eight SDKs. The code is public; production self-hosting is not ready yet.',
        ],
      },
      { type: 'heading', text: 'Open source URL monitoring as a config file' },
      {
        type: 'paragraph',
        text: 'If open source to you means checks you can diff, Gatus is the cleanest example. This file watches one URL every minute, fails the check on anything but a 200 or a response slower than 1 second, and messages Telegram after 3 failures in a row, which is the default threshold, and again on recovery.',
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'config.yaml',
        code: `# docker run -p 8080:8080 -e TELEGRAM_TOKEN -e TELEGRAM_CHAT_ID \\
#   --mount type=bind,source="$(pwd)"/config.yaml,target=/config/config.yaml \\
#   ghcr.io/twin/gatus:stable
alerting:
  telegram:
    token: "\${TELEGRAM_TOKEN}"
    id: "\${TELEGRAM_CHAT_ID}"

endpoints:
  - name: website
    url: "https://example.com/health"
    interval: 1m
    conditions:
      - "[STATUS] == 200"
      - "[RESPONSE_TIME] < 1000"
    alerts:
      - type: telegram
        send-on-resolved: true`,
      },
      {
        type: 'paragraph',
        text: 'Run it on a different machine from the site it watches, ideally with a different provider. That one rule matters more than which tool on this page you choose.',
      },
      {
        type: 'heading',
        text: 'Website uptime monitoring, open source, without the server',
      },
      {
        type: 'paragraph',
        text: 'Logdash takes the other trade. The code is AGPL-3.0 on GitHub, so you can read exactly what a check does: one GET with a 10 second timeout, any status from 200 to 399 counts as up, and an alert fires when the monitor flips to down and again when it flips back. What you do not do is run it. That is a loss if self-hosting was the requirement, and a relief if the requirement was a monitor that survives your server. Checks run every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Paste the address of your site or its health endpoint. The first check runs straight away, from outside your network.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. A webhook works too if you want to route alerts through your own code.',
          },
          {
            title: 'Break it on purpose',
            text: 'Point the monitor at a path that returns 500, or stop the app. On the next check it flips to down and the Telegram alert arrives with the status code and the error.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Gatus',
        them: 'Gatus',
        rows: [
          {
            feature: 'Who keeps the checker running',
            logdash: 'We do, outside your network',
            them: 'You do, on a box you patch',
            winner: 'logdash',
          },
          {
            feature: 'Checks in git',
            logdash: 'No, a form in the browser',
            them: 'YAML, reviewed like code',
            winner: 'them',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP status code and response time',
            them: 'Adds TCP, ICMP, DNS, TLS, certificate and domain expiry',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: '40+ providers, Telegram included',
            winner: 'them',
          },
          {
            feature: 'Licence',
            logdash: 'AGPL-3.0',
            them: 'Apache 2.0',
            winner: 'tie',
          },
          {
            feature: 'Self-hosting in production',
            logdash: 'Not ready yet',
            them: 'One container',
            winner: 'them',
          },
          {
            feature: 'Logs and metrics beside the checks',
            logdash: 'Eight SDKs into the same dashboard',
            them: 'Uptime only, by design',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Gatus',
        reasons: [
          'Open source means you run it. Gatus does that today and Logdash does not.',
          'Your checks belong in a pull request. A reviewed YAML file beats a form nobody audits.',
          'You need TCP, DNS, ICMP or certificate expiry checks. Logdash checks HTTP and nothing else.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does the licence of open source website monitoring matter?',
        answer:
          'Only if you change the code and offer it to others as a service. MIT and Apache 2.0 let you do anything. AGPL-3.0, used by Logdash, Checkmate and OpenStatus, lets you run and change it for any purpose, including commercial, but a modified version you run for other people has to be published under the same licence.',
      },
      {
        question:
          'Is there open source URL monitoring that runs without a server?',
        answer:
          'Upptime. It runs on GitHub Actions in your own repository, checks every 5 minutes and costs nothing. The trade is the 5-minute floor and scheduled runs that can start late when runners are busy.',
      },
      {
        question: 'Is Logdash open source website monitoring?',
        answer:
          'Yes, AGPL-3.0 with the code on GitHub. The hosted version is what you use today. Production self-hosting means wiring up MongoDB, Redis and ClickHouse by hand and is tracked as an open issue.',
      },
      {
        question:
          'Is website uptime monitoring open source software really free?',
        answer:
          'The software is. The server, its backups and the hours spent patching it are not, and the monitor is only as reliable as the box it runs on. The Logdash free plan covers 5 monitors at a 5-minute interval if you would rather run nothing.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'best-self-hosted-uptime-monitor',
    h1: 'Best self hosted uptime monitor',
    answer:
      'Uptime Kuma is the best self hosted uptime monitor for most people, Gatus is better if you want your checks in a YAML file in git, Upptime is better if you want no server at all, and Logdash cannot be self-hosted in production with one command yet.',
    meta: {
      title: 'Best self hosted uptime monitor in 2026 | Logdash',
      description:
        'Uptime Kuma, Gatus, Upptime and Logdash self-host, ranked honestly: what each one checks, what it takes to run, and why it must not share a host with your app.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Every self-hosted monitor has the same weak spot: it is only as up as the machine it runs on. Put it on the VPS it watches and the night that VPS dies, the monitor dies with it, silently. Whatever you pick below, run it somewhere else, a small VPS at a different provider or a Raspberry Pi at home, and alert through something that does not depend on your app.',
      },
      { type: 'heading', text: 'The shortlist, in order' },
      {
        type: 'list',
        items: [
          'Uptime Kuma. The default for a reason. MIT, one container, a web UI anyone can use, monitors for HTTP, keywords, TCP, ping, DNS and push heartbeats, intervals down to 20 seconds, 90+ notification services and status pages. Version 2 added MariaDB next to SQLite. Weak spots: one login shared by everyone, and its status page JSON is not an officially supported API.',
          'Gatus. Apache 2.0, one container, checks written as YAML conditions on status, body and response time. Covers HTTP, TCP, ICMP, DNS and TLS, plus certificate and domain expiry. There is no UI for editing checks, which is the point if you want review on every change.',
          'Upptime. MIT and no server: GitHub Actions checks every 5 minutes, outages become GitHub issues, the status page is GitHub Pages. Still maintained, with a release in September 2026. The floor is 5 minutes and scheduled runs can start late.',
          'Logdash self-host. AGPL-3.0, the whole stack in one public repo, and it runs locally for development. Production is not one command: you wire up Node 22, MongoDB, Redis and ClickHouse yourself, there is no packaged deployment and no upgrade path, and boot still expects Stripe and Resend keys. Use the hosted version, or one of the three above.',
        ],
      },
      { type: 'heading', text: 'Uptime Kuma in one command' },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `docker run -d --restart=always -p 3001:3001 \\
  -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:2
# open http://localhost:3001 and create the admin user`,
      },
      {
        type: 'paragraph',
        text: 'Back up the uptime-kuma volume. It holds every monitor, every notification setting and the whole history, and losing it means an afternoon of clicking everything back in.',
      },
      { type: 'heading', text: 'Uptime Kuma alternatives, self hosted' },
      {
        type: 'paragraph',
        text: 'Beyond the shortlist: Checkmate is the newest Kuma-style app, AGPL-3.0 on Node.js and MongoDB, with Docker Compose and Helm installs. OpenStatus, also AGPL-3.0, self-hosts with Docker Compose, but its 28 check regions are hosted only; self-hosted checks run from probes you deploy. Healthchecks is the pick for cron jobs rather than URLs, and a common setup is Kuma for URLs plus Healthchecks for jobs.',
      },
      { type: 'heading', text: 'When hosted beats self-hosted' },
      {
        type: 'paragraph',
        text: 'Self-hosting wins on cost, data ownership and check types. It loses on one thing: the monitor is another service you keep alive, patch and back up, and its failures are silent by nature. Logdash is the hosted trade: HTTP checks every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, Telegram and webhook alerts and a status page, all run from outside your network.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Self-hosting in production',
            logdash: 'Not one command yet',
            them: 'One container',
            winner: 'them',
          },
          {
            feature: 'Who keeps the checker running',
            logdash: 'We do, outside your network',
            them: 'You do, on a box you patch',
            winner: 'logdash',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP, plus push heartbeats on Pro',
            them: 'HTTP, keyword, TCP, ping, DNS, push and more',
            winner: 'them',
          },
          {
            feature: 'Fastest interval',
            logdash: '15 seconds on Pro',
            them: '20 seconds',
            winner: 'tie',
          },
          {
            feature: 'Notification channels',
            logdash: 'Telegram and webhook',
            them: '90+ services',
            winner: 'them',
          },
          {
            feature: 'Logs and metrics',
            logdash: 'Eight SDKs into the same dashboard',
            them: 'Not what Kuma is for',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'Self-hosting is the requirement. Kuma does it today, Logdash does not.',
          'You need keyword, TCP, ping or DNS checks. Logdash has none of them.',
          'You want alerts on Discord, Slack, email or ntfy. Kuma has them built in, Logdash has Telegram and webhooks.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'If you would rather skip the server, paste your health URL into Logdash. The free plan covers 5 monitors with a check every 5 minutes.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. This is the channel that still works when your own server does not.',
          },
          {
            title: 'Pull the plug',
            text: 'Stop the app, or the whole VPS. On the next check the monitor flips to down and the Telegram alert arrives with the status code, sent from a machine you did not just turn off.',
          },
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the best self hosted uptime monitor?',
        answer:
          'Uptime Kuma for most people: one container, a web UI and 90+ notification services. Gatus if you want checks in git and review on every change. Either way, run it on a different machine from the app it watches.',
      },
      {
        question: 'Where should a self hosted uptime monitor run?',
        answer:
          'Anywhere but the server it watches: a small VPS at another provider, or a machine at home. If it shares a host, a network or a provider with your app, one outage takes out both and nobody gets told.',
      },
      {
        question: 'What are the best Uptime Kuma alternatives, self hosted?',
        answer:
          'Gatus for config as code, Checkmate for a Kuma-style UI on MongoDB, OpenStatus if you can deploy its probes yourself, and Upptime if you want GitHub Actions to do the hosting.',
      },
      {
        question: 'Is Logdash a self hosted uptime monitor?',
        answer:
          'Not yet. The code is AGPL-3.0 and runs locally for development, but there is no packaged production install and the work is tracked as an open GitHub issue. Today Logdash is a hosted monitor.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'pingdom-speed-test-alternative',
    h1: 'Pingdom speed test alternative',
    answer:
      'PageSpeed Insights is the free Pingdom speed test alternative most people should use, WebPageTest is better for waterfalls and repeat runs, and GTmetrix works after a free signup; none of them watch your site between tests, which is what an uptime monitor like Logdash is for.',
    meta: {
      title: 'Pingdom speed test alternative, free options | Logdash',
      description:
        'PageSpeed Insights, WebPageTest and GTmetrix against the Pingdom Website Speed Test, and why response time on every uptime check is a different number.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The Pingdom Website Speed Test still works and is still free. Paste a URL, pick one of 7 locations, and you get a grade, the load time, page size, request count and a waterfall. People look elsewhere because of what it leaves out: it tests desktop only, on an unthrottled data centre connection, and it reports load time rather than Core Web Vitals, the metrics Google shows in Search Console.',
      },
      { type: 'heading', text: 'Free website speed test options' },
      {
        type: 'list',
        items: [
          'PageSpeed Insights. Free, no account. Runs Lighthouse for mobile and desktop, and when your site has enough Chrome traffic it adds real-user LCP, INP and CLS from the Chrome UX Report. The best first test for almost everyone.',
          'WebPageTest. Now part of LogicMonitor, which bought Catchpoint in 2025. Basic tests run without an account; the free Starter account gives 150 test runs a month, up to 3 runs per test, with filmstrips, video and Lighthouse from 30 locations. The pick when you need to see exactly which request blocks the render.',
          'GTmetrix. Lighthouse reports with a waterfall and video. You need a free account to see a report, free tests run from Seattle or London, and most mobile devices and locations are on PRO.',
          'Pingdom Website Speed Test. Still free, 7 locations, desktop only. Fine for a quick waterfall, weak on modern metrics.',
        ],
      },
      { type: 'heading', text: 'A speed test is not response time monitoring' },
      {
        type: 'paragraph',
        text: 'A speed test loads the whole page once in a real browser: HTML, CSS, scripts, images, fonts and rendering. It tells you how heavy the page is. It says nothing about 3am on a Tuesday. Response time monitoring does the opposite. Logdash sends one GET to your URL on every check and records the status code and how long the server took to return the HTML. It never loads images or runs JavaScript, so it will not tell you your hero image is 4 MB. It will show the server going from 180 ms to 2.4 seconds after a deploy, and a check that gets no answer within 10 seconds counts as down and sends the alert.',
      },
      {
        type: 'paragraph',
        text: 'You can see the number it records from your own terminal. The total at the end is roughly one uptime check; the rest shows where the time went.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `curl -s -o /dev/null -w 'dns %{time_namelookup}s  connect %{time_connect}s  tls %{time_appconnect}s  first byte %{time_starttransfer}s  total %{time_total}s\\n' \\
  https://example.com
# dns 0.002s  connect 0.015s  tls 0.032s  first byte 0.052s  total 0.054s`,
      },
      {
        type: 'paragraph',
        text: 'Run that once from a laptop and you have one data point. Run it every minute from outside your network for a month and you have a chart that shows the slow Tuesday nobody reported. That second part is the job an uptime monitor does and a speed test does not.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs PageSpeed Insights',
        them: 'PageSpeed Insights',
        rows: [
          {
            feature: 'What it measures',
            logdash: 'One request for the HTML: status code and response time',
            them: 'Full page load in a browser, plus Core Web Vitals',
            winner: 'them',
          },
          {
            feature: 'How often',
            logdash:
              'Every 5 minutes free, 1 minute on Builder, 15 seconds on Pro',
            them: 'When you press the button',
            winner: 'logdash',
          },
          {
            feature: 'Alerts',
            logdash: 'Telegram or webhook when the site goes down',
            them: 'None',
            winner: 'logdash',
          },
          {
            feature: 'Fix suggestions',
            logdash: 'None, it records numbers',
            them: 'Lighthouse audits with specific fixes',
            winner: 'them',
          },
          {
            feature: 'Mobile results',
            logdash: 'No rendering, so no mobile view',
            them: 'Mobile and desktop',
            winner: 'them',
          },
          {
            feature: 'Cost',
            logdash: 'Free for 5 monitors',
            them: 'Free, no account',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'PageSpeed Insights',
        reasons: [
          'You want to know why the page feels slow. Logdash measures the server, not the page.',
          'You care about Core Web Vitals and search. Logdash does not report LCP, INP or CLS.',
          'You need a one-off audit before a launch, not something watching every minute.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL you speed tested',
            text: 'Paste it into Logdash as an HTTP monitor. Every check stores the status code and response time, so the latency chart starts filling from the first minute.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. A webhook works too if you want alerts in your own system.',
          },
          {
            title: 'Make it fail',
            text: 'Point the monitor at a path that returns 500, or stop the server. On the next check it flips to down and the Telegram alert arrives with the status code and the error.',
          },
        ],
      },
    ],
    featurePath: '/features/metrics',
    faq: [
      {
        question: 'What is the best Pingdom speed test alternative?',
        answer:
          'PageSpeed Insights for most people: free, no account, Lighthouse on mobile and desktop, and real-user Core Web Vitals when your traffic is high enough. WebPageTest when you need filmstrips and request-level detail.',
      },
      {
        question: 'Is there a free Pingdom website speed test alternative?',
        answer:
          'Several. PageSpeed Insights is free with no account. WebPageTest runs basic tests without an account and 150 test runs a month on its free Starter plan. GTmetrix is free after you create an account.',
      },
      {
        question: 'Which free website speed test needs no signup?',
        answer:
          'PageSpeed Insights and the Pingdom test both run without an account, and so do basic WebPageTest tests. GTmetrix runs the test but asks you to log in before it shows the report.',
      },
      {
        question: 'Does Logdash replace the Pingdom website speed test?',
        answer:
          'No. Logdash times one request to your URL on every check and alerts you when it fails. It does not load the full page, so keep a speed test for page weight and use Logdash for the 3am question.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const learn: SeoFamilyData = {
  family: learnFamily,
  pages: learnPages,
};
