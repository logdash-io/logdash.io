import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family D. The intent is "tell me when my job did not run", so every page
 * starts from how that runner fails silently and ends on a heartbeat that fits
 * Logdash push monitors: Pro only, checked every 15 seconds, no per-job
 * schedule. One ping per run would flap, so pages use a canary job, a stamp
 * plus heartbeat, or a freshness route behind an HTTP monitor.
 *
 * The hub targets "cron job monitoring" itself, so it carries an article.
 */
export const cronMonitoringFamily: SeoFamily = {
  key: 'cron-monitoring',
  hubPath: '/cron-monitoring',
  hubLabel: 'All cron monitoring guides',
  title: 'Cron job monitoring | Logdash',
  description:
    'How cron job monitoring works, the heartbeat patterns that fit Logdash push monitors, and one guide per scheduler from GitHub Actions to restic.',
  intro:
    'One guide per scheduler, each with the code that proves a job ran and the alert for when it did not.',
  hub: {
    h1: 'Cron job monitoring',
    answer:
      'Cron job monitoring means every successful run proves itself to a service outside your servers, and that service alerts you when the proof stops arriving, because a job that never started logs no error anywhere.',
    meta: {
      title: 'Cron job monitoring that alerts on silence | Logdash',
      description:
        'How cron job monitoring works, why one ping per run is not enough on Logdash, the three heartbeat patterns that are, and when Healthchecks.io fits better.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A cron job that fails loudly is the easy case. The expensive one is the job that stops running: the crontab that did not survive a server rebuild, the scheduler container a deploy replaced, the workflow GitHub disabled after 60 quiet days in a public repo. Nothing ran, so nothing threw, nothing reached the error tracker, and cron mailed its output to a local root mailbox nobody reads.',
      },
      { type: 'heading', text: 'What a cron monitor has to get right' },
      {
        type: 'paragraph',
        text: 'Flip the direction. Instead of waiting for an error, have the job report in after every good run, and treat silence as the failure. Three rules keep the report honest. Send it after the work, not before, so a run that dies halfway stays silent. Chain it behind &&, so a non-zero exit never counts as success. And keep the timer on a service outside your infrastructure, because a monitor on the same box dies with it.',
      },
      { type: 'heading', text: 'How Logdash watches a job' },
      {
        type: 'paragraph',
        text: 'Logdash does this with push monitors. Push monitors are on the Pro plan, $15 a month, one per service and up to 50 services. Each one is checked every 15 seconds. A ping inside the window keeps it up, an empty window flips it to down and sends the alert, and the next ping flips it back and sends another. There is no per-job schedule and no grace setting. So a nightly job that pings once when it finishes reads as down 15 to 30 seconds later and stays down all day. Every guide here uses one of three patterns that fit the model instead:',
      },
      {
        type: 'list',
        items: [
          'Workers that never stop, like Celery, Sidekiq and BullMQ. Schedule a canary job every 5 to 10 seconds that pings. It only arrives if the scheduler, the broker and a worker all still work.',
          'Jobs on a schedule, like crontab, pg_cron, the Laravel scheduler, Kubernetes CronJobs and Windows Task Scheduler. The job leaves a stamp when it succeeds, and a heartbeat pings every 5 to 10 seconds while the stamp is younger than the schedule plus the lateness you accept.',
          'The free plan, or a runner that cannot loop, like GitHub Actions. The job tells your app, the app keeps a key that expires, and an HTTP monitor checks a route that returns 503 once the key is gone. HTTP monitors run on every plan, every 5 minutes on the free one.',
        ],
      },
      { type: 'heading', text: 'Test the ping URL first' },
      {
        type: 'code',
        language: 'bash',
        title: 'Run it once by hand',
        code: `# A push monitor takes a plain POST. No auth header, no body.
curl -fsS -o /dev/null -w '%{http_code}\\n' -X POST \\
  https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234

# 201  the ping counts for the current 15-second window
# 404  no push monitor has that id, and curl -f exits non-zero
# 429  more than 300 pings a minute from one IP`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'On Pro, add a service named after the job, set its monitor to push and copy the ping URL. The name is what the alert will say.',
          },
          {
            title: 'Wire up the heartbeat',
            text: 'Pick the guide for your runner below and paste its snippet. The monitor goes up within 15 seconds of the first ping.',
          },
          {
            title: 'Break it on purpose',
            text: "Connect a Telegram channel, then stop the heartbeat. Within 30 seconds of the last ping Telegram shows the job's name, is down, status code 0 and Did not receive call for this time range. Start it again and the is up message follows.",
          },
        ],
      },
      { type: 'heading', text: 'Picking a cron job monitoring tool' },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for cron jobs',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'Schedule per job',
            logdash: 'None, the heartbeat pattern carries it',
            them: 'Period or cron expression, time zone and grace per check',
            winner: 'them',
          },
          {
            feature: 'Signals from the job',
            logdash: 'Ping, and silence as the failure',
            them: 'Ping, start, fail and exit status',
            winner: 'them',
          },
          {
            feature: 'Host goes dark',
            logdash: 'Alert within 30 seconds',
            them: 'Alert after the period plus grace',
            winner: 'logdash',
          },
          {
            feature: 'HTTP uptime checks and logs',
            logdash: 'Same account, eight SDKs',
            them: 'Heartbeats only',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack, Telegram, webhooks and more',
            winner: 'them',
          },
          {
            feature: 'Free plan',
            logdash: 'No push monitors, Pro is $15 a month',
            them: '20 checks',
            winner: 'them',
          },
          {
            feature: 'Self-hosting',
            logdash: 'AGPL-3.0, not a one-command install yet',
            them: 'BSD-3-Clause, self-hostable today',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'Your jobs only need one ping per run on a known schedule, and you would rather type a cron expression than run a heartbeat next to each job.',
          'You want to see a run start, fail and finish, not only whether the last good one is recent.',
          'You want email or Slack alerts without building a bridge behind a webhook.',
          'You are not on Pro, or you want to run the monitor on your own server.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is there cron job monitoring free of charge?',
        answer:
          "Yes. Healthchecks.io watches 20 jobs free, Cronitor 5 monitors and Dead Man's Snitch one. Logdash push monitors start at Pro, $15 a month, but the freshness-route pattern runs on free HTTP monitors: five services, checked every 5 minutes.",
      },
      {
        question: 'Is there open source cron job monitoring?',
        answer:
          'Healthchecks.io is BSD-3-Clause licensed and the hosted service runs the same code. Logdash is AGPL-3.0 with the full source on GitHub. Cronitor is closed source with open-source SDKs.',
      },
      {
        question: 'Can cron job monitoring be self hosted?',
        answer:
          'Healthchecks.io can, today, from the same repository as the hosted service. Logdash cannot yet: it runs locally for development, and production self-hosting is open work, not a one-command install. If self hosted is a hard requirement, use Healthchecks.io.',
      },
      {
        question: 'What is the best cron job monitoring tool?',
        answer:
          "For many jobs on fixed schedules, Healthchecks.io or Cronitor, which apply the schedule and grace for you. For alerts by email with nothing else, Dead Man's Snitch. For jobs plus uptime checks and logs on one timeline, with Telegram alerts, Logdash on Pro.",
      },
      {
        question: 'What does a cron job monitoring service do?',
        answer:
          'It holds the timer your job cannot hold for itself. The job checks in, the service notices when a check-in is late and alerts you. It has to run outside your infrastructure, or a dead server takes the monitor down with the job.',
      },
    ],
  },
};

export const cronMonitoringPages: SeoPage[] = [
  {
    slug: 'scheduled-tasks',
    h1: 'Scheduled task monitoring',
    answer:
      'Scheduled task monitoring means the task leaves proof after every clean run, whatever scheduler starts it, and a service outside the box alerts you when that proof gets older than the schedule allows.',
    meta: {
      title: 'Scheduled task monitoring with heartbeats | Logdash',
      description:
        'Monitor scheduled tasks with a heartbeat: the task proves it ran and silence sends a Telegram alert. A crontab to paste, and where Healthchecks.io fits better.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "A scheduled task fails in two ways. It runs and exits non-zero, or it never runs at all. The second one is the expensive kind: the server was rebuilt and the crontab did not come with it, the disk filled at 02:00, cron started the script with a PATH that has no node on it. Nothing crashes, so nothing reaches your error tracker. You find out when a customer asks why last week's invoices never went out.",
      },
      { type: 'heading', text: 'How to monitor scheduled tasks' },
      {
        type: 'paragraph',
        text: 'Watch the outcome, not the scheduler. Every scheduler can run one more command only after a clean exit: && in a crontab, ExecStartPost= in a Type=oneshot systemd service, a last step in a CI job. Use that slot to touch a stamp file, after the work and never before it, and alert when the stamp gets too old.',
      },
      { type: 'heading', text: 'How Logdash decides a scheduled job is down' },
      {
        type: 'paragraph',
        text: 'Logdash watches the stamp through a push monitor, which needs the Pro plan. On Pro it expects a ping in every 15-second window and alerts on the first empty one, with no per-job schedule or grace setting. One curl at the end of a nightly task would read as down almost all day. So a second crontab line pings every 5 seconds while the stamp is fresh.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `# Once: mkdir -p /var/lib/heartbeat

# The task. The stamp moves only when the script exits 0.
0 3 * * * /srv/app/bin/send-invoices && touch /var/lib/heartbeat/send-invoices

# The heartbeat. Pings every 5 seconds while the stamp is under 25 hours old.
* * * * * for i in $(seq 12); do find /var/lib/heartbeat/send-invoices -mmin -1500 2>/dev/null | grep -q . && curl -fsS -m 4 -o /dev/null -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234; sleep 5; done`,
      },
      {
        type: 'paragraph',
        text: 'The -mmin -1500 is your schedule and grace period in one number. 1,500 minutes is 25 hours: a daily task plus an hour of slack before the stamp goes stale, the pings stop and the alert fires. A task that runs every 15 minutes wants something like -mmin -20. The heartbeat line only reads the stamp, so it works unchanged behind a systemd timer. It also catches the box itself dying, because a dead cron sends nothing, and that alert lands within 30 seconds. One limit to plan around: the ping endpoint allows 300 requests a minute per IP and each heartbeat line sends 12, so one IP tops out at 25 of them.',
      },
      { type: 'heading', text: 'Scheduled task alert in three steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service on Pro, set its monitor to push and copy the ping URL. A service holds one monitor, so each task gets its own service and its own name in the alert, up to 50 on Pro.',
          },
          {
            title: 'Paste both lines',
            text: 'Add the task line and the heartbeat line to the crontab, then run the task once by hand so the stamp exists. Until it does the monitor reads down, which is correct: there is no proof yet.',
          },
          {
            title: 'Let the stamp go stale',
            text: "Connect a Telegram channel to the monitor, then backdate the stamp with touch -d '2 days ago' on Linux. Within 30 seconds Telegram shows the task's name, is down, status code 0 and Did not receive call for this time range. Touch it again and the is up message follows.",
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for scheduled tasks',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'Schedule per task',
            logdash: 'None, the find threshold in your crontab is the schedule',
            them: 'Period or cron expression, with time zone',
            winner: 'them',
          },
          {
            feature: 'Failure signal',
            logdash: 'Silence only',
            them: 'Fail and exit-status endpoints alert at once',
            winner: 'them',
          },
          {
            feature: 'Whole host goes down',
            logdash: 'Alert within 30 seconds',
            them: 'Alert after the period plus grace',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack, Telegram, webhooks and more',
            winner: 'them',
          },
          {
            feature: 'HTTP uptime checks',
            logdash: 'HTTP monitors on the same account',
            them: 'Not built, heartbeats only',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'No push monitors, Pro only',
            them: '20 checks',
            winner: 'them',
          },
          {
            feature: 'Open source',
            logdash: 'AGPL-3.0',
            them: 'Open source, self-hostable today',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'Your tasks run on fixed schedules and you would rather type the cron expression once than encode it in a find threshold.',
          'You want the alert by email or Slack without building a bridge behind a webhook.',
          'You are not on Pro. Healthchecks.io watches 20 tasks for free, and Logdash push monitors start at Pro.',
          "You want the failing run's output in the alert. Healthchecks.io stores up to 100 kB of request body per ping. Logdash keeps only the fact that a ping arrived.",
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is scheduled task monitoring?',
        answer:
          'Checking that a scheduled task actually ran and succeeded, by having it check in after every good run and alerting when the check-in stops. Error tracking cannot do this, because a task that never started throws nothing.',
      },
      {
        question:
          'Does scheduled job monitoring work for jobs that run once a day?',
        answer:
          'Yes, with the stamp file above. Logdash checks a push monitor every 15 seconds, so a daily job cannot ping it directly. The job touches a file and a heartbeat line pings while the file is younger than your threshold. Healthchecks.io and Cronitor take a daily schedule directly, which is simpler if daily jobs are all you run.',
      },
      {
        question:
          'How do I monitor scheduled tasks without installing an agent?',
        answer:
          'Use curl. The Logdash ping is a public POST to https://api.logdash.io/ping/<monitorId> with no auth header and no body, so cron, a systemd timer or a CI runner can all send it. A wrong id returns 404, and curl -f turns that into a non-zero exit you will see.',
      },
      {
        question: 'Where does a scheduled task alert go?',
        answer:
          'To Telegram or a webhook, the only two channels Logdash has. The Telegram message names the monitor and says it did not receive a call for this time range. A webhook set to POST receives the same facts as JSON. Email and Slack need a bridge you run behind the webhook.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'dead-mans-switch',
    h1: "Dead man's switch monitoring",
    answer:
      "A dead man's switch alerts on the absence of a signal: the job checks in after every successful run, and when the check-ins stop, for any reason at all, the switch fires.",
    meta: {
      title: "Dead man's switch monitoring for cron jobs | Logdash",
      description:
        "How a dead man's switch works for cron: silence is the alert. A crontab to paste, Telegram or webhook alerts, and when Dead Man's Snitch is the better pick.",
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Normal monitoring waits for something to go wrong and say so: a crash, a 500, an error line in the log. That model is blind to failures that make no noise. The server that was terminated, the crontab a deploy overwrote, the script hung on a network mount since Tuesday. None of them report anything, because the thing that would report is the thing that stopped.',
      },
      { type: 'heading', text: "How a dead man's switch works" },
      {
        type: 'paragraph',
        text: 'The name comes from trains. The driver holds a handle down, and if the driver collapses the handle rises and the brakes engage. Nobody has to notice the collapse. In software your job is the hand. It checks in after every good run, a service outside your infrastructure holds the timer, and the alert fires when the check-ins stop. Silence is the alert. That is also why the switch has to live somewhere else: a switch on the same server dies with it.',
      },
      { type: 'heading', text: "Dead man's switch cron setup" },
      {
        type: 'paragraph',
        text: 'In Logdash the switch is a push monitor, on the Pro plan. It has no per-job interval. On Pro it checks every 15 seconds, goes down on the first window without a ping and comes back up on the next one. That suits a process that is always running. For a cron job that runs once a night, the job leaves proof on disk and a heartbeat line keeps the handle held while the proof is fresh.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `# The job leaves proof only when it exits 0.
0 2 * * * /srv/app/bin/nightly-export && touch /var/lib/heartbeat/nightly-export

# The hand on the handle: ping every 5 seconds while the proof is under 25 hours old.
* * * * * for i in $(seq 12); do find /var/lib/heartbeat/nightly-export -mmin -1500 2>/dev/null | grep -q . && curl -fsS -m 4 -o /dev/null -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234; sleep 5; done`,
      },
      {
        type: 'paragraph',
        text: 'Read the second line as the hand. Every 5 seconds it checks that the export finished in the last 25 hours and pings if it did. If the export fails, the stamp ages out and the pings stop. If the server dies, cron stops and the pings stop. Either way Logdash hears nothing and fires, within 30 seconds of the last ping.',
      },
      { type: 'heading', text: "Dead man's switch email, Telegram or webhook" },
      {
        type: 'paragraph',
        text: 'Logdash does not send email. Alerts go to Telegram or to a webhook, and that is the full list. Set the webhook method to POST and it receives the body below. GET, the default, carries no body. If the switch has to end in an inbox, the webhook is where you attach a mailer you run yourself.',
      },
      {
        type: 'code',
        language: 'json',
        title: 'Webhook body when the switch fires',
        code: `{
  "httpMonitorId": "68b4c1f0e3a2d5c7b9f01234",
  "newStatus": "down",
  "name": "nightly-export",
  "url": "push monitor",
  "errorMessage": "Did not receive call for this time range",
  "statusCode": "0"
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'On Pro, add a service, set its monitor to push and copy the ping URL into the heartbeat line.',
          },
          {
            title: 'Hold the handle',
            text: 'Paste both lines into the crontab and run the job once by hand so the stamp exists. The monitor goes up on the first ping.',
          },
          {
            title: 'Let go',
            text: 'Connect Telegram to the monitor, then comment out the heartbeat line. Within 90 seconds, once the loop already running finishes its minute, Telegram reads nightly-export is down, with Did not receive call for this time range. Put the line back and the is up message follows.',
          },
        ],
      },
      {
        type: 'comparison',
        title: "Logdash vs Dead Man's Snitch",
        them: "Dead Man's Snitch",
        rows: [
          {
            feature: 'Interval per job',
            logdash: 'None, set it as the stamp threshold',
            them: 'Pick an interval per snitch',
            winner: 'them',
          },
          {
            feature: 'Email alerts',
            logdash: 'Not built, Telegram or webhook',
            them: 'Email by default, repeated each failed period',
            winner: 'them',
          },
          {
            feature: 'Check in by email',
            logdash: 'Not built',
            them: 'Every snitch has an address that counts as a check-in',
            winner: 'them',
          },
          {
            feature: 'Host goes dark',
            logdash: 'Alert within 30 seconds',
            them: 'Alert at the end of the interval',
            winner: 'logdash',
          },
          {
            feature: 'Uptime checks for the API',
            logdash: 'HTTP monitors on the same account',
            them: 'Not built',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'Push monitors need Pro',
            them: 'One snitch free, three for $5 a month',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: "Dead Man's Snitch",
        reasons: [
          "You want the alert in your inbox. Dead Man's Snitch emails by default and sends one more for every failed period until you act.",
          'Your job can send email but not run curl. Email check-ins cover that, and Logdash has nothing like it.',
          'You watch one nightly job and nothing else. One snitch is free and you skip the stamp file entirely.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: "How does a dead man's switch work?",
        answer:
          'Your job checks in after every successful run, an outside service keeps the timer, and the alert fires when an expected check-in does not arrive. It catches failures that cannot report themselves: a dead host, a deleted crontab, a hung script.',
      },
      {
        question: "Does Logdash have dead man's switch email alerts?",
        answer:
          "No. Logdash alerts through Telegram and webhooks only. Dead Man's Snitch and Healthchecks.io both email out of the box, so pick one of them if the inbox is a hard requirement, or put a mailer behind the Logdash webhook.",
      },
      {
        question: "How do I set up a dead man's switch cron job?",
        answer:
          'Chain the job with && touch on a stamp file, then add a crontab line that pings https://api.logdash.io/ping/<monitorId> every 5 seconds while the stamp is fresh. Logdash checks the monitor every 15 seconds on Pro, so the gap between pings has to stay under that.',
      },
      {
        question: "What is dead man's switch monitoring used for?",
        answer:
          'Backups, invoice runs, data exports, queue workers: anything whose failure is silent and only noticed later. Also the monitoring stack itself, since a Prometheus that has died cannot alert on its own death.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'backup-monitoring',
    h1: 'Backup monitoring',
    answer:
      'Backup monitoring means hearing about a backup that did not finish, and AWS Backup and Azure Backup already alert on their own jobs, so the gap is the pg_dump, restic and rsync scripts nothing watches.',
    meta: {
      title: 'Backup monitoring for AWS, Azure and scripts | Logdash',
      description:
        'AWS Backup and Azure Backup already alert on failed jobs. For pg_dump, restic and rsync scripts, a heartbeat that alerts when the last good backup gets too old.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A backup that fails loudly is the easy case. The hard case is the one that stops: the cron entry lost in a server rebuild, the full disk that left pg_dump writing 0 bytes, the SSH key the NAS stopped accepting. Each of them leaves the last good backup getting older, quietly, until the day you need it. Backup monitoring is the alarm on that age.',
      },
      { type: 'heading', text: 'AWS backup monitoring is already built in' },
      {
        type: 'paragraph',
        text: 'If AWS Backup runs the job, use AWS. An EventBridge rule on Backup Job State Change with state FAILED, pointed at an SNS topic, is the setup the AWS docs describe, and AWS Backup sends those events on a best-effort basis every 5 minutes. For the backup that never ran, Backup Audit Manager has a Last recovery point was created control that flags resources with no recovery point in the last 1 to 744 hours. It is evaluated once every 24 hours and is not switched on for existing frameworks.',
      },
      { type: 'heading', text: 'Azure backup monitoring is already built in' },
      {
        type: 'paragraph',
        text: 'Azure Backup raises built-in Azure Monitor alerts for failed backup and restore jobs, on by default, within about 20 minutes of the failure. They notify nobody until you add an action group and an alert processing rule, which can route to email or a webhook. Do that once and the vaults are covered.',
      },
      { type: 'heading', text: 'The backups no cloud console sees' },
      {
        type: 'paragraph',
        text: 'Neither one watches pg_dump on a Hetzner box, restic on a home server or rsync to a NAS. That is where Logdash fits, with a push monitor on the Pro plan. There is no per-job schedule: on Pro, Logdash expects a ping in every 15-second window and alerts on the first empty one. So the script touches a stamp only when every step passed, and a heartbeat line pings while the stamp is fresh.',
      },
      {
        type: 'code',
        language: 'bash',
        title: '/usr/local/bin/pg-backup.sh',
        code: `#!/bin/sh
# Credentials come from ~/.pgpass. Any failing step exits before the touch.
set -eu
FILE=/backups/app-$(date +%F).dump

pg_dump --format=custom --file="$FILE" app
pg_restore --list "$FILE" >/dev/null
rsync -a "$FILE" backup@nas:/srv/backups/
touch /var/lib/heartbeat/pg-backup`,
      },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `30 2 * * * /usr/local/bin/pg-backup.sh
* * * * * for i in $(seq 12); do find /var/lib/heartbeat/pg-backup -mmin -1500 2>/dev/null | grep -q . && curl -fsS -m 4 -o /dev/null -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234; sleep 5; done`,
      },
      {
        type: 'paragraph',
        text: 'The -mmin -1500 is 25 hours, a nightly run plus an hour of slack. Past it the pings stop and the alert goes out within 30 seconds. pg_restore --list proves the file is a readable archive, not that every row restores. A restore into a scratch database once a month is the only test that proves that.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'On Pro, add a service per backup, set its monitor to push and copy the ping URL into the heartbeat line.',
          },
          {
            title: 'Run the backup once by hand',
            text: 'Create /var/lib/heartbeat and run the script. When the stamp appears the heartbeat starts and the monitor goes up.',
          },
          {
            title: 'Fail it on purpose',
            text: "Connect Telegram to the monitor, then backdate the stamp with touch -d '2 days ago', which is what a missed night looks like a day later. Within 30 seconds Telegram shows the backup name, is down, and Did not receive call for this time range.",
          },
        ],
      },
      { type: 'heading', text: 'Picking a backup monitoring tool' },
      {
        type: 'comparison',
        title: 'Logdash vs native AWS and Azure alerts',
        them: 'AWS and Azure native',
        rows: [
          {
            feature: 'AWS Backup and Azure Backup jobs',
            logdash: 'Not integrated',
            them: 'Job events and alerts built in',
            winner: 'them',
          },
          {
            feature: 'pg_dump, restic and rsync scripts',
            logdash: 'One push monitor per script',
            them: 'Out of scope',
            winner: 'logdash',
          },
          {
            feature: 'Alert after a failed job',
            logdash: 'When the stamp passes your threshold',
            them: 'About 5 minutes on AWS, 20 on Azure',
            winner: 'them',
          },
          {
            feature: 'Email',
            logdash: 'Not built, Telegram or webhook',
            them: 'Through SNS or an action group',
            winner: 'them',
          },
          {
            feature: 'Setup per backup',
            logdash: 'Two crontab lines',
            them: 'One rule or one vault setting',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'AWS and Azure native',
        reasons: [
          'Every backup you have is an AWS Backup plan or an Azure Backup vault. Native alerts cover it, and Logdash would only be watching the watcher.',
          'You need email. Both clouds deliver it and Logdash does not.',
          'You want the alert minutes after a failed job, not after a staleness threshold. The cloud events fire on the failure itself.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is backup monitoring?',
        answer:
          'Checking that backups finish and stay recent, and alerting when they stop. The useful signal is the age of the last good backup, because a backup that never ran produces no error to alert on.',
      },
      {
        question: 'How does Azure backup monitoring alert on a failed job?',
        answer:
          'Azure Backup raises a built-in Azure Monitor alert for failed backup and restore jobs, on by default. To be told about it, create an action group with email or a webhook and an alert processing rule that routes backup alerts to it.',
      },
      {
        question: 'Does AWS backup monitoring catch a backup that never ran?',
        answer:
          'An EventBridge rule on FAILED only fires for jobs that started. For jobs that never started, enable the Backup Audit Manager control Last recovery point was created. It runs every 24 hours and flags resources with no recovery point inside the window you set.',
      },
      {
        question: 'Which backup monitoring tool should I use for scripts?',
        answer:
          "One that alerts on silence, not only on errors: Healthchecks.io, Cronitor, Dead Man's Snitch or a Logdash push monitor. Logdash makes sense if you already watch the app there on Pro. For backups alone, the free tiers of Healthchecks.io or Dead Man's Snitch do the job.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'restic-backup',
    h1: 'Restic backup monitoring',
    answer:
      'Chain restic backup, restic check and a timestamp so the stamp only moves when both commands exit 0, then let a heartbeat ping Logdash while the stamp is under 26 hours old, and a failed, partial or skipped backup becomes a Telegram alert.',
    meta: {
      title: 'Restic backup monitoring with Telegram alerts | Logdash',
      description:
        'A restic script that runs backup and check, moves a stamp only when both pass, and a heartbeat that alerts when it goes stale. Plus when Healthchecks.io fits better.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Restic sends no notifications. It exits with a code, writes to whatever log you pointed it at, and goes quiet. That is fine on the nights it works. On the night the NAS stops accepting the SSH key, restic backup exits non-zero and saves nothing, and it does the same the next night and every night after, while the log grows and nobody reads it. Most people find out on the day they need to restore.',
      },
      { type: 'heading', text: 'The restic backup check script' },
      {
        type: 'code',
        language: 'bash',
        title: '/usr/local/bin/restic-backup.sh',
        code: `#!/bin/sh
export RESTIC_REPOSITORY=sftp:backup@nas:/srv/restic
export RESTIC_PASSWORD_FILE=/etc/restic/password

restic backup /srv /etc --exclude-caches \\
  && restic check --read-data-subset=5% \\
  && touch /var/lib/heartbeat/restic`,
      },
      {
        type: 'paragraph',
        text: 'Three details carry the weight. The && chain means the stamp moves only if both commands exit 0. Exit code 3 matters most: restic made a snapshot but could not read some files, and counting that as a failure is how you hear about the database file that was locked every night. And --read-data-subset=5% downloads and verifies about 5% of the pack data per run, around 10 GB a night on a 200 GB repository, so budget the egress if the repository lives in a cloud bucket.',
      },
      { type: 'heading', text: 'Why restic monitoring needs a heartbeat' },
      {
        type: 'paragraph',
        text: 'Logdash watches this with a push monitor, a Pro plan feature. It has no schedule or grace setting: on Pro it expects a ping in every 15-second window, alerts on the first empty one and recovers on the next ping. A single curl at the end of a nightly backup would read as down nearly all day. So the script touches a stamp, and a second crontab line turns the age of that stamp into a steady heartbeat.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `0 3 * * * /usr/local/bin/restic-backup.sh >>/var/log/restic-backup.log 2>&1
* * * * * for i in $(seq 12); do find /var/lib/heartbeat/restic -mmin -1560 2>/dev/null | grep -q . && curl -fsS -m 4 -o /dev/null -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234; sleep 5; done`,
      },
      {
        type: 'paragraph',
        text: 'The -mmin -1560 is 26 hours: one nightly run plus two hours for a slow upload. Past that the pings stop and the alert goes out within 30 seconds. If the machine running restic dies outright, cron dies with it and the alert comes just as fast, without waiting for the threshold.',
      },
      { type: 'heading', text: 'Restic backup notification in three steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'On Pro, add a service named after the repository, set its monitor to push and copy the ping URL into the heartbeat line.',
          },
          {
            title: 'Run the script once by hand',
            text: 'Create /var/lib/heartbeat, then run the script. The first check takes the longest. When it finishes the stamp exists, the heartbeat starts and the monitor goes up.',
          },
          {
            title: 'Break it on purpose',
            text: "Connect Telegram to the monitor, then backdate the stamp with touch -d '2 days ago'. Within 30 seconds Telegram shows the repository name, is down, and Did not receive call for this time range. In real life the same message arrives about two hours after a missed night.",
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for restic',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'Nightly schedule',
            logdash: 'Encoded in the stamp threshold',
            them: 'Period or cron expression, plus grace, per check',
            winner: 'them',
          },
          {
            feature: 'Restic output in the alert',
            logdash: 'Not stored',
            them: 'Ping body up to 100 kB, so the log rides along',
            winner: 'them',
          },
          {
            feature: 'Exit code reporting',
            logdash: 'Silence only',
            them: 'Ping with the exit status, non-zero alerts at once',
            winner: 'them',
          },
          {
            feature: 'Backup host dies',
            logdash: 'Alert within 30 seconds',
            them: 'Alert after the period plus grace',
            winner: 'logdash',
          },
          {
            feature: 'Uptime checks and logs alongside',
            logdash: 'HTTP monitors and eight SDKs',
            them: 'Heartbeats only',
            winner: 'logdash',
          },
          {
            feature: 'Price for one nightly backup',
            logdash: 'Push monitors need Pro',
            them: 'Free, 20 checks',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'You run restic on many machines with different schedules. A cron expression per check is less to maintain than a threshold in every crontab.',
          'You want the restic output attached to the alert, so the failing line is the first thing you read.',
          'You want the alert by email. Logdash sends Telegram and webhooks only.',
          'Backups are the only thing you monitor. Healthchecks.io does it for free, and Logdash push monitors start at Pro.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does restic send a backup notification on failure?',
        answer:
          'No. Restic has no notification setting of its own. It returns an exit code, 0 for success, 3 when some files could not be read, 11 when it could not lock the repository, 12 for a wrong password, and leaves alerting to whatever runs it.',
      },
      {
        question: 'What does a restic backup check verify?',
        answer:
          'restic check verifies that snapshots, trees and pack files are structurally consistent. It reads no file contents unless you add --read-data or --read-data-subset. A small subset every night plus an occasional full read is a common split.',
      },
      {
        question: 'What is the simplest restic monitoring setup?',
        answer:
          'A shell script chained with &&, a stamp file and one heartbeat line in cron. No agent, no wrapper, no extra binary, only curl. Tools like resticprofile add scheduling and hooks if you outgrow that.',
      },
      {
        question:
          'Does restic backup monitoring catch a backup that never started?',
        answer:
          'With a stamp, yes. A cron entry that never fired, a deleted script and a full disk all leave the stamp to age, and the alert goes out once it passes 26 hours. A powered-off host is caught within 30 seconds.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'pg-cron',
    h1: 'pg_cron monitoring',
    answer:
      'pg_cron writes every run to cron.job_run_details and never alerts on it, so monitor it with a second pg_cron job that pings an external monitor every 10 seconds, but only while the last finished run of your job succeeded inside the window you expect.',
    meta: {
      title: 'pg_cron monitoring: failed jobs and alerts | Logdash',
      description:
        'Query cron.job_run_details for pg_cron failed jobs, then turn the last good run into a 10-second heartbeat that sends a Telegram alert when a job fails or stops.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'pg_cron runs SQL on a schedule and says nothing when it fails. Each run becomes a row in `cron.job_run_details`, and that is the end of it. No email, no webhook, no retry. A nightly rollup failing on a permission error since a migration three weeks ago looks exactly like one that works, until someone reads the table.',
      },
      { type: 'heading', text: 'pg_cron job status in job_run_details' },
      {
        type: 'paragraph',
        text: 'The table has ten columns: jobid, runid, job_pid, database, username, command, status, return_message, start_time and end_time. Join it to `cron.job` on jobid to get the job name. A run passes through starting and running, and finishes as succeeded or failed. For a failure, return_message holds the Postgres error. For a success it holds the command tag, such as 1 row. This query lists every pg_cron failed job from the last day.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Failed runs in the last 24 hours',
        code: `psql "$DATABASE_URL" -c "
  select j.jobname, d.status, d.return_message, d.start_time
  from cron.job_run_details d
  join cron.job j using (jobid)
  where d.status = 'failed'
    and d.start_time > now() - interval '1 day'
  order by d.start_time desc;"`,
      },
      {
        type: 'heading',
        text: 'pg_cron monitoring with a 10-second heartbeat',
      },
      {
        type: 'paragraph',
        text: 'Logdash push monitors are on the Pro plan, $15 a month. On Pro, Logdash checks each push monitor every 15 seconds, marks it down when no ping arrived in that window, and alerts on the change. A nightly job cannot ping that often, so a second pg_cron job pings for it every 10 seconds, but only while the newest finished run of your job succeeded within a window you pick. That window is your grace period, written in SQL.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Schedule the heartbeat and the cleanup',
        code: `psql "$DATABASE_URL" <<'SQL'
select cron.schedule('logdash-heartbeat', '10 seconds', $$
  select net.http_post('https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234')
  from (
    select d.status, d.end_time
    from cron.job_run_details d
    join cron.job j using (jobid)
    where j.jobname = 'nightly-rollup'
      and d.status in ('succeeded', 'failed')
    order by d.start_time desc
    limit 1
  ) last_run
  where last_run.status = 'succeeded'
    and last_run.end_time > now() - interval '25 hours'
$$);

select cron.schedule('prune-run-details', '0 * * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '2 days'$$);
SQL`,
      },
      {
        type: 'list',
        items: [
          'A failed run stops the pings within 10 seconds, because the newest finished row is no longer succeeded.',
          'A job that stops being scheduled, unscheduled by a migration or set inactive, stops the pings 25 hours after its last good run.',
          'A run in progress does not count against you. The filter judges the last finished run.',
          'Postgres down, or the pg_cron worker dead: the heartbeat dies with them and the alert lands within 30 seconds. No check inside the database can report that.',
        ],
      },
      {
        type: 'paragraph',
        text: 'It needs pg_cron 1.5 or newer for second-based schedules and pg_net for the HTTP call. Supabase ships both. Without pg_net, run the same query from a 10-second loop with psql and curl. The heartbeat adds 8,640 rows a day, hence the prune job.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service in Logdash on Pro, set the monitor to push and copy the monitor id from the ping URL. Name it after the job, since the alert shows the name.',
          },
          {
            title: 'Schedule the heartbeat',
            text: 'Run the psql block with your job name, monitor id and window. Use the job interval plus the lateness you can live with: 25 hours for a nightly job, 70 minutes for an hourly one. The monitor goes green within 15 seconds.',
          },
          {
            title: 'Break it on purpose',
            text: "Run select cron.unschedule('logdash-heartbeat'). Within 30 seconds a Telegram message lands saying the monitor is down, status code 0, did not receive call for this time range. Schedule it again and the up message follows.",
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for pg_cron',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'Schedule model',
            logdash: '15-second heartbeat, window written in your SQL',
            them: 'Cron schedule and grace time per check',
            winner: 'them',
          },
          {
            feature: 'Extra work in Postgres',
            logdash: 'A 10-second job and a prune job',
            them: 'One ping appended to the job command',
            winner: 'them',
          },
          {
            feature: 'Notices Postgres itself is down',
            logdash: 'Within 30 seconds',
            them: 'At the next missed run plus grace',
            winner: 'logdash',
          },
          {
            feature: 'HTTP uptime checks and logs in the same tool',
            logdash: 'Same service, same timeline',
            them: 'Jobs only',
            winner: 'logdash',
          },
          {
            feature: 'Free plan for job monitoring',
            logdash: 'None, push monitors need Pro',
            them: '20 jobs free',
            winner: 'them',
          },
          {
            feature: 'Source code',
            logdash: 'AGPL-3.0 on GitHub',
            them: 'Open source on GitHub',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'You want one ping per run instead of a heartbeat job. Append a net.http_get to the end of the job command and they apply the schedule and grace time for you.',
          'You do not want 8,640 extra rows a day in job_run_details, prune job or not.',
          'You are not on Pro. Their free plan covers 20 jobs, and Logdash has no free push monitors.',
          'You have many pg_cron jobs. One check per job with its own schedule beats one hand-written window per job.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I check pg_cron job status?',
        answer:
          'Query cron.job_run_details joined to cron.job on jobid and order by start_time descending. The status column reads running while a job runs, then succeeded or failed. return_message carries the error text for failures.',
      },
      {
        question: 'How do I get alerted on pg_cron failed jobs?',
        answer:
          'pg_cron has no alerting of its own. Schedule a 10-second heartbeat that pings an external monitor only while the last finished run succeeded. A failure stops the pings and Logdash sends a Telegram alert within 30 seconds.',
      },
      {
        question: 'Does pg_cron job_run_details grow forever?',
        answer:
          'Yes. pg_cron never cleans it, and a job running every 10 seconds adds 8,640 rows a day. Schedule a delete for rows older than a few days. Setting cron.log_run to off stops the logging, but then there is nothing left to monitor.',
      },
      {
        question: 'Does pg_cron monitoring work on Supabase?',
        answer:
          'Yes. Supabase offers both pg_cron and pg_net as extensions, so the heartbeat runs inside your project with no extra server. Enable pg_net first, then schedule the job.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'laravel-scheduler',
    h1: 'Laravel scheduler monitoring',
    answer:
      'Add a 10-second heartbeat task that posts to an external monitor only while your job last succeeded within a set window, so one alert covers both a failed task and a scheduler that is not running at all.',
    meta: {
      title: 'Laravel scheduler monitoring | Logdash',
      description:
        'Why pingOnSuccess falls short, a 10-second heartbeat that catches a dead schedule:run and failed tasks, and an honest look at spatie/laravel-schedule-monitor.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The Laravel scheduler fails in two ways. A task exits non-zero, or nothing runs at all: the cron line for schedule:run never made it to the new server, the container running schedule:work was replaced, or someone ran php artisan down and every task skipped. The second is worse: nothing logs a process that never started.',
      },
      { type: 'heading', text: 'Laravel cron monitoring with pingOnSuccess' },
      {
        type: 'paragraph',
        text: 'Laravel has pings built in. pingBefore, thenPing, pingOnSuccess and pingOnFailure call a URL around a task, and onSuccess only fires on exit code 0. There are two catches with Logdash. The scheduler sends those pings as GET, and the Logdash ping route only accepts POST, so they get a 404. And Logdash push monitors, a Pro feature at $15 a month, are checked every 15 seconds: no ping in that window and the monitor goes down. A daily task cannot keep that up by pinging after itself.',
      },
      {
        type: 'heading',
        text: 'Laravel scheduler monitoring with a heartbeat',
      },
      {
        type: 'paragraph',
        text: 'So split it. The real task writes its last success to the cache. A sub-minute task, which the scheduler supports natively, posts to Logdash every 10 seconds while that success is younger than your window.',
      },
      {
        type: 'code',
        language: 'php',
        title: 'routes/console.php',
        code: `<?php

use Illuminate\\Support\\Facades\\Cache;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Schedule;

// The task you care about. onSuccess only fires on exit code 0.
Schedule::command('backup:run')
    ->dailyAt('03:00')
    ->runInBackground()
    ->onSuccess(fn () => Cache::forever('backup:ok', now()->timestamp));

// The heartbeat. Stops when the scheduler stops or the backup goes stale.
Schedule::call(function () {
    if (now()->timestamp - Cache::get('backup:ok', 0) < 25 * 3600) {
        Http::timeout(5)->post('https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234');
    }
})->name('logdash-heartbeat')->everyTenSeconds();`,
      },
      {
        type: 'list',
        items: [
          'schedule:run not running: no heartbeat, alert within 30 seconds. A missing crontab line, a dead schedule:work container, a server stuck after a reboot.',
          'The backup exits non-zero or hangs: onSuccess never fires, the timestamp ages, and the pings stop 25 hours after the last good run.',
          'Maintenance mode: scheduled tasks skip, the heartbeat included, so a forgotten php artisan down reaches you too.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Two details matter. Keep runInBackground on long tasks, as the Laravel docs advise for schedules with sub-minute tasks, or a slow backup can delay the heartbeat and trip a false alert. And use a shared, persistent cache store, because the array driver forgets the timestamp between runs. After each deploy, run php artisan schedule:interrupt so the running scheduler picks up the new code.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service in Logdash on Pro, set the monitor to push and copy the monitor id from the ping URL. Name it after the task, since the alert shows the name.',
          },
          {
            title: 'Add the two tasks',
            text: 'Paste them into routes/console.php with your window: the task interval plus the lateness you accept. The monitor reads down until the first backup succeeds, which is the truth.',
          },
          {
            title: 'Stop the scheduler',
            text: 'Comment out the schedule:run cron line or stop the schedule:work process. Within 30 seconds a Telegram message lands saying the monitor is down, status code 0, did not receive call for this time range.',
          },
        ],
      },
      { type: 'heading', text: 'Laravel schedule monitor packages' },
      {
        type: 'paragraph',
        text: 'spatie/laravel-schedule-monitor logs every start, finish and failure of every task to two tables, lists them with schedule-monitor:list, and flags a task as late when it misses its time plus a grace period, 5 minutes by default. It does not send alerts, on purpose: if the scheduler is broken, a scheduled notification would not run either. Alerts come from syncing the schedule to Oh Dear, which starts at 15 euros a month and has no free plan.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs spatie/laravel-schedule-monitor',
        them: 'Spatie package with Oh Dear',
        rows: [
          {
            feature: 'Tasks covered',
            logdash: 'The ones you wire up, one cache key each',
            them: 'Every task after one sync command',
            winner: 'them',
          },
          {
            feature: 'Late and failed runs',
            logdash: 'One freshness window per task',
            them: 'Schedule-aware, grace time per task',
            winner: 'them',
          },
          {
            feature: 'Run history',
            logdash: 'Up and down history per monitor',
            them: 'Start, finish, runtime and memory in your database',
            winner: 'them',
          },
          {
            feature: 'Scheduler not running',
            logdash: 'Alert within 30 seconds, without Oh Dear',
            them: 'Only through Oh Dear',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Mail, Slack, SMS, webhooks and more',
            winner: 'them',
          },
          {
            feature: 'Price',
            logdash: 'Pro, $15 a month',
            them: 'Package free, Oh Dear from 15 euros a month',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'spatie/laravel-schedule-monitor',
        reasons: [
          'You have more than a handful of tasks. One sync and every task is monitored, with no cache keys to keep in step.',
          'You want runtime and memory per run in your own database, not only up or down.',
          'You already pay for Oh Dear. The scheduled task check comes with every plan.',
          'Your tasks run weekdays only or on odd schedules, where one fixed window either misses late runs or alerts every weekend.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the simplest Laravel scheduler monitoring setup?',
        answer:
          'A sub-minute heartbeat task that posts to an external monitor while your important task last succeeded within a window. It catches failed tasks and a dead scheduler with about ten lines in routes/console.php.',
      },
      {
        question: 'Is there a Laravel schedule monitor package?',
        answer:
          'spatie/laravel-schedule-monitor records every run and flags late tasks in schedule-monitor:list. It sends no alerts itself; for those it syncs your schedule to Oh Dear, a paid service.',
      },
      {
        question: 'How do I tell if the Laravel scheduler is not running?',
        answer:
          'Something outside the app has to notice the silence. Check that the cron entry for schedule:run exists on the server that is actually live, then add a heartbeat so the next time it stops you hear about it within 30 seconds instead of next week.',
      },
      {
        question:
          'Can I use pingOnSuccess for Laravel cron monitoring with Logdash?',
        answer:
          'Not directly. pingOnSuccess sends a GET and the Logdash ping route only takes POST. One ping after a daily task also cannot satisfy a 15-second check window, so use the heartbeat pattern above.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'celery-beat',
    h1: 'Celery beat monitoring',
    answer:
      'Have beat send a canary task every 10 seconds that posts to a Logdash push monitor, and the first 15 seconds without a ping tells you beat, the broker or every worker has stopped.',
    meta: {
      title: 'Celery beat monitoring with a 10-second canary | Logdash',
      description:
        'A canary task beat sends every 10 seconds, a push monitor that alerts on the first 15-second gap, and where Cronitor or Flower is the better pick.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Celery beat fails without raising anything. When the beat process dies, workers sit idle, the queue stays empty, Flower shows healthy workers, and the error tracker stays quiet because no task ran. You find out when a customer asks why the weekly report never arrived.',
      },
      { type: 'heading', text: 'Celery beat health check: a canary task' },
      {
        type: 'paragraph',
        text: 'The cheapest proof that beat is scheduling and a worker is consuming is a task that does nothing except say so. Beat sends it every 10 seconds, a worker runs it, the task posts to Logdash. If beat, the broker or every worker goes down, the posts stop. The expires option matters after an outage: returning workers discard canaries older than 10 seconds instead of chewing through hundreds of stale ones before real work.',
      },
      {
        type: 'code',
        language: 'python',
        title: 'tasks.py',
        code: `from urllib.request import Request, urlopen

from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379/0")

PING_URL = "https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234"

app.conf.beat_schedule = {
    "logdash-heartbeat": {
        "task": "tasks.heartbeat",
        "schedule": 10.0,
        # A canary that waited in the queue is stale. Drop it.
        "options": {"expires": 10},
    },
}


@app.task(ignore_result=True)
def heartbeat():
    urlopen(Request(PING_URL, data=b"", method="POST"), timeout=5)`,
      },
      {
        type: 'paragraph',
        text: "Run beat as its own process with celery -A tasks beat. Celery's docs call the embedded -B flag not recommended for production, and only one beat may run per schedule or every task fires twice. With django-celery-beat the entry still works: the database scheduler copies beat_schedule into its table on start.",
      },
      { type: 'heading', text: 'What the 15 seconds mean' },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature. On Pro, Logdash looks for a ping every 15 seconds and marks the monitor down on the first window without one. There is no grace setting, which is why the canary runs every 10 seconds. It also means a worker pool stuck on long tasks for 15 seconds pages you. If that is the outage you want to hear about, keep the canary on the main queue. If it is noise, route it to its own queue with one dedicated worker and accept that you then watch beat and the broker, not the main pool.',
      },
      {
        type: 'heading',
        text: 'Celery periodic task monitoring for nightly jobs',
      },
      {
        type: 'paragraph',
        text: 'The canary proves the machinery runs. It does not prove the 3am invoice task succeeded, and a task that runs once a day cannot feed a monitor that wants a call every 15 seconds. For those, have the task set a Redis key with a 26-hour expiry when it finishes, serve a route that returns 503 once the key is gone, and point an ordinary HTTP monitor at it. Or use a tool built around schedules.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service on Pro, set the monitor to push and paste the id from its ping URL into PING_URL.',
          },
          {
            title: 'Deploy beat and a worker',
            text: 'Start celery -A tasks worker and celery -A tasks beat. The monitor turns up on the first check after the first canary.',
          },
          {
            title: 'Kill beat',
            text: 'Connect a Telegram channel, then stop the beat process. Within 30 seconds a Telegram alert says the monitor is down with "Did not receive call for this time range". Start beat and the up message follows.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Cronitor for Celery',
        them: 'Cronitor',
        rows: [
          {
            feature: 'Setup',
            logdash: 'One canary task and a push monitor',
            them: 'cronitor.celery.initialize discovers every beat task',
            winner: 'them',
          },
          {
            feature: 'Per-task schedules',
            logdash: 'One canary for the whole system',
            them: 'A monitor per periodic task, schedule read from beat',
            winner: 'them',
          },
          {
            feature: 'Time to alert when beat dies',
            logdash: '15 to 30 seconds',
            them: 'When the next scheduled task is late',
            winner: 'logdash',
          },
          {
            feature: 'django-celery-beat',
            logdash: 'Works, the canary is a normal entry',
            them: 'Auto-discovery does not support it yet',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'Push monitors start at Pro, $15 a month',
            them: '5 monitors',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cronitor',
        reasons: [
          'You have a dozen periodic tasks on different schedules and want each one watched with its own late alert.',
          'Your important tasks run hourly or nightly. Cronitor knows the schedule; Logdash needs the canary plus a freshness route per task.',
          'You want job monitoring on a free plan, or alerts by email and Slack rather than Telegram and webhooks.',
          'You want to see that a task started, ran too long or failed, not only that the canary arrived.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I add a Celery beat health check?',
        answer:
          'Beat has no endpoint and is not a worker, so celery inspect ping never reaches it. The honest check is the effect beat should have: a canary task arriving on schedule. Send it every 10 seconds and alert when it stops.',
      },
      {
        question: 'What is the best tool for Celery monitoring?',
        answer:
          'Flower for a live view of workers and tasks, with Prometheus metrics if you already run Alertmanager. Cronitor for per-task schedules. Logdash for the canary, uptime checks on the app, and logs from the Python SDK in one place.',
      },
      {
        question:
          'Does Celery periodic task monitoring catch a task that ran but failed?',
        answer:
          'Only if success is what pings. Ping at the end of the task, after the work, and an exception skips the ping. The canary above proves scheduling, not the outcome of your other tasks.',
      },
      {
        question: 'Does Celery beat monitoring need a paid Logdash plan?',
        answer:
          'Yes. Push monitors are Pro only, at $15 a month. The free plan covers HTTP monitors, so the freshness route for nightly tasks works there.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'sidekiq',
    h1: 'Sidekiq monitoring',
    answer:
      'The Sidekiq Web UI shows queues, retries and dead jobs while you look at it; to be told when Sidekiq stops processing, run a canary job every 5 seconds that pings a Logdash push monitor.',
    meta: {
      title: 'Sidekiq monitoring with a canary job | Logdash',
      description:
        'A sidekiq-cron canary every 5 seconds, a push monitor that alerts on the first 15-second gap, and when Cronitor is the better pick.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Sidekiq rarely crashes loudly. Redis fills up, a deploy leaves the process quiet, a long job holds every thread, or the cron poller stops enqueuing. The Web UI shows each of these if you open it. Nothing tells you to open it.',
      },
      {
        type: 'paragraph',
        text: 'Keep the Web UI for what it is good at. Mount Sidekiq::Web and you get busy threads, queue sizes and latency, retries, dead jobs and memory per process, and Sidekiq 7 added a Metrics tab with execution time per job class. Use it for the questions you ask while looking. The canary is for the one you need answered while asleep.',
      },
      {
        type: 'paragraph',
        text: 'So watch the outcome instead of the parts: a tiny job that sidekiq-cron enqueues every 5 seconds and that pings Logdash when a thread runs it. Redis, the poller and at least one free thread all have to work for the ping to arrive.',
      },
      { type: 'heading', text: 'Sidekiq cron monitoring: the canary job' },
      {
        type: 'code',
        language: 'ruby',
        title: 'app/jobs/logdash_heartbeat_job.rb',
        code: `require "net/http"

class LogdashHeartbeatJob
  include Sidekiq::Job
  sidekiq_options retry: false # a late ping is worthless

  PING_URL = URI("https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234")

  def perform
    Net::HTTP.post(PING_URL, "")
  end
end

# config/initializers/sidekiq.rb
Sidekiq::Cron.configure do |config|
  config.cron_poll_interval = 2 # default 30 is slower than the window
end`,
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'config/schedule.yml',
        code: `logdash_heartbeat:
  cron: "*/5 * * * * *" # six fields: every 5 seconds
  class: "LogdashHeartbeatJob"`,
      },
      {
        type: 'paragraph',
        text: "Both settings matter. sidekiq-cron accepts a sixth field for seconds, and it only checks for due jobs every 30 seconds by default, with Sidekiq's random jitter on top. Logdash wants a ping inside every 15-second window, so the poller has to run far more often than that.",
      },
      { type: 'heading', text: 'Sidekiq scheduler monitoring' },
      {
        type: 'paragraph',
        text: 'On the sidekiq-scheduler gem the job class is the same and the schedule is every: "5s". Sidekiq Enterprise periodic jobs run at most once a minute, too slow for the window, so use either gem for the canary even on Enterprise.',
      },
      { type: 'heading', text: 'What a missed window means' },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature. On Pro, Logdash looks for a ping every 15 seconds and marks the monitor down on the first window without one, with no grace setting. That makes the canary a backlog alarm too: if every thread is busy for 15 seconds, you hear about it. If your jobs are long by design, give the canary a Sidekiq 7 capsule: its own queue with one dedicated thread, so busy workers cannot starve it. Nightly jobs need a different check, since they cannot ping every 15 seconds: set a Redis key with a 26-hour expiry when the job finishes and point an HTTP monitor at a route that returns 503 once it is gone.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service on Pro, set the monitor to push and copy the id from the ping URL into PING_URL.',
          },
          {
            title: 'Deploy and watch it turn up',
            text: 'Restart Sidekiq so it loads config/schedule.yml. The job shows on the Cron tab if you mounted sidekiq/cron/web, and the monitor goes up on the next check.',
          },
          {
            title: 'Stop Sidekiq',
            text: 'Connect a Telegram channel, then stop the process. Within 30 seconds a Telegram alert says the monitor is down, and another arrives when Sidekiq comes back.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Cronitor for Sidekiq',
        them: 'Cronitor',
        rows: [
          {
            feature: 'Coverage',
            logdash: 'One canary for the whole process',
            them: 'Server middleware reports every job class',
            winner: 'them',
          },
          {
            feature: 'Schedule sync',
            logdash: 'None, the canary has a fixed cadence',
            them: 'Syncs sidekiq-scheduler and Enterprise periodic jobs',
            winner: 'them',
          },
          {
            feature: 'Time to alert when Sidekiq stops',
            logdash: '15 to 30 seconds',
            them: 'When the next scheduled job is late',
            winner: 'logdash',
          },
          {
            feature: 'Logs from the Rails app',
            logdash: 'Ruby SDK into the same service',
            them: 'Job events, not application logs',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'Push monitors start at Pro, $15 a month',
            them: '5 monitors',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cronitor',
        reasons: [
          'You want every job class watched for failures and run time, not one canary.',
          'Your scheduled jobs run hourly or nightly and you want schedule-aware late alerts without writing a route per job.',
          'You want email or Slack alerts. Logdash sends Telegram and webhooks only.',
          'You run Sidekiq Enterprise and want periodic job schedules synced to monitors in one command.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What should Sidekiq monitoring cover?',
        answer:
          'Three things: is anything being processed, are retries and dead jobs piling up, and did the scheduled jobs run. The Web UI answers the second when you look. The canary answers the first without you looking.',
      },
      {
        question: 'Does Sidekiq have a health check?',
        answer:
          'Open-source Sidekiq has no HTTP health endpoint; its wiki suggests a file-based Kubernetes readiness probe. Sidekiq Enterprise 7.1.2 added config.health_check on a private port, and the sidekiq_alive gem adds one by having a job refresh a Redis key. None of them pages you on their own.',
      },
      {
        question: 'Does Sidekiq cron monitoring see each cron job?',
        answer:
          'Not with the canary. It proves the poller enqueues and a thread runs jobs. To watch a specific nightly job, use the Redis key plus HTTP monitor pattern, or Cronitor.',
      },
      {
        question: 'Does Sidekiq scheduler monitoring work the same way?',
        answer:
          'Yes. With sidekiq-scheduler, schedule the same job class with every: "5s" and skip the sidekiq-cron poll interval setting.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'bullmq',
    h1: 'BullMQ monitoring',
    answer:
      'Use Bull Board or Taskforce.sh to see queues and jobs, and add a 10-second job scheduler that pings a Logdash push monitor so you are told when workers stop processing.',
    meta: {
      title: 'BullMQ monitoring: dashboards and heartbeats | Logdash',
      description:
        'Bull Board and Taskforce.sh show your queues. A 10-second job scheduler and a Logdash push monitor tell you when nothing is being processed.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "The first answer to BullMQ monitoring is a dashboard, and Logdash is not one. If you want to read a failed job's payload and stack trace, start with one of these:",
      },
      { type: 'heading', text: 'BullMQ UI and dashboard options' },
      {
        type: 'list',
        items: [
          'Bull Board: free, MIT licensed, mounted as a route in Express, Fastify and other servers. A viewer with no alerts, so put it behind your own auth.',
          'Taskforce.sh: hosted by the BullMQ team, from $19.95 a month for one Redis connection after a 15-day trial. Alerts on failed jobs, missing workers and backlog by email, Slack or PagerDuty.',
          'Logdash: no queue view at all. A heartbeat, uptime checks on the API and logs from the Node.js SDK.',
        ],
      },
      {
        type: 'paragraph',
        text: 'What a dashboard does not do is ring when everything goes quiet. A worker that lost Redis, a deploy that never started the worker process, a concurrency of 1 stuck behind a job that never resolves: the queue just stops moving. Logdash covers that one question, is anything being processed, with a heartbeat that only arrives if a worker processed it.',
      },
      { type: 'heading', text: 'BullMQ queue monitoring with a heartbeat job' },
      {
        type: 'code',
        language: 'typescript',
        title: 'worker.ts',
        code: `import { Queue, Worker, type Job } from 'bullmq';

const connection = { host: 'localhost', port: 6379 };
const PING_URL = 'https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234';

// Upsert, so restarts and extra replicas never create duplicates.
await new Queue('jobs', { connection }).upsertJobScheduler(
  'logdash-heartbeat',
  { every: 10_000 },
  { name: 'heartbeat', opts: { removeOnComplete: true, removeOnFail: true } },
);

new Worker(
  'jobs',
  async (job: Job) => {
    if (job.name === 'heartbeat') {
      await fetch(PING_URL, { method: 'POST', signal: AbortSignal.timeout(5_000) });
      return;
    }
    // ...your existing handlers
  },
  { connection },
);`,
      },
      {
        type: 'paragraph',
        text: 'Job schedulers arrived in BullMQ 5.16 and are the only way left in v6, which removed the repeat option on queue.add in July 2026. A scheduler creates the next job only when the last one starts processing, so dead workers do not leave thousands of stale heartbeats behind to replay later. Node 18 and later ship fetch. BullMQ 6 no longer bundles ioredis, so install it next to bullmq.',
      },
      { type: 'heading', text: 'Why 10 seconds' },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature. On Pro, Logdash looks for a ping every 15 seconds and marks the monitor down on the first window without one. There is no grace setting, so the heartbeat runs every 10. Putting it on your main queue turns it into a stall alarm: if the worker is busy for 15 seconds, you hear about it. If long jobs are normal, raise concurrency or move the heartbeat to its own queue and worker. An hourly repeatable job cannot feed this monitor directly. For those, set a Redis key with an expiry when the job completes and point an HTTP monitor at a route that returns 503 once the key is gone.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service on Pro, set the monitor to push and copy the id from the ping URL into PING_URL.',
          },
          {
            title: 'Deploy the worker',
            text: 'The scheduler upserts on start and the monitor goes up on the first check after the first heartbeat.',
          },
          {
            title: 'Stop the worker',
            text: 'Connect a Telegram channel, then kill the worker process. Within 30 seconds a Telegram alert says the monitor is down, and an up message follows when it restarts.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Taskforce.sh',
        them: 'Taskforce.sh',
        rows: [
          {
            feature: 'Queue and job inspection',
            logdash: 'None',
            them: 'Every queue, job, payload and stack trace',
            winner: 'them',
          },
          {
            feature: 'Retry and clean jobs by hand',
            logdash: 'Not built',
            them: 'From the dashboard',
            winner: 'them',
          },
          {
            feature: 'Alert on failed jobs and backlog',
            logdash: 'Only as a late heartbeat',
            them: 'Failed jobs, missing workers, backlog, memory',
            winner: 'them',
          },
          {
            feature: 'Alert when nothing is processed',
            logdash: 'Heartbeat, 15 to 30 seconds',
            them: 'Missing worker alert',
            winner: 'tie',
          },
          {
            feature: 'Uptime checks on the API',
            logdash: 'HTTP monitors with response time',
            them: 'Not covered',
            winner: 'logdash',
          },
          {
            feature: 'Price',
            logdash: 'Pro, $15 a month',
            them: 'From $19.95 a month',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Taskforce.sh',
        reasons: [
          'You need to see why a job failed: payload, attempts, stack trace. Logdash sees one ping.',
          'You want alerts on failed jobs and queue size, not only on a stopped worker.',
          'You only want a UI and already have auth in front of your app. Then Bull Board is free and enough.',
          'You run several Redis instances and want every queue on them in one view.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the best BullMQ UI?',
        answer:
          'Bull Board if you want free and self-hosted: MIT licensed, mounted as a route in Express or Fastify, no alerts. Taskforce.sh if you want it hosted with teams and alerts. Bull Board shows a dead worker only when you open it; Taskforce.sh alerts on it.',
      },
      {
        question: 'Which BullMQ dashboard should I use?',
        answer:
          'For one app with auth already in place, Bull Board. For production with several people and alerting, Taskforce.sh, which connects through an outgoing connector so Redis stays private.',
      },
      {
        question: 'Is Logdash a BullMQ monitoring tool?',
        answer:
          'For one question: is a worker still processing jobs. It does not read your queues. Pair it with a dashboard, and use it for the heartbeat, uptime checks on the API, and logs from the Node.js SDK.',
      },
      {
        question: 'How does BullMQ queue monitoring catch a stuck queue?',
        answer:
          'Put the heartbeat on the same queue as the real work. If jobs stop moving for 15 seconds, the heartbeat stops too and the monitor alerts. Use a separate queue only if long jobs are normal.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'kubernetes-cronjob',
    h1: 'Kubernetes CronJob monitoring',
    answer:
      'Kubernetes records when each CronJob last succeeded in status.lastSuccessfulTime and never alerts on it, so either alert on that timestamp in Prometheus through kube-state-metrics, or run a small watcher that pings an external monitor every 10 seconds while it is fresh.',
    meta: {
      title: 'Kubernetes CronJob monitoring and alerts | Logdash',
      description:
        'Alert when a Kubernetes CronJob fails or stops: a 10-second watcher on lastSuccessfulTime with Telegram alerts, or the kube-state-metrics rule if you run Prometheus.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A CronJob can fail quietly in more ways than a crontab line. The pod exits non-zero until the Job hits its backoffLimit. The image tag was deleted and the pod sits in ImagePullBackOff. Someone set suspend to true during an incident and forgot. The controller was down past startingDeadlineSeconds and skipped the run. kubectl get cronjob shows a LAST SCHEDULE column, and nothing pages anyone.',
      },
      {
        type: 'paragraph',
        text: 'One field covers all of these: `status.lastSuccessfulTime`, which the CronJob controller sets when a Job completes. Every failure above stops it moving. So monitoring a CronJob means alerting when that timestamp is older than the schedule plus some slack.',
      },
      {
        type: 'heading',
        text: 'Kubernetes CronJob monitoring with Prometheus',
      },
      {
        type: 'paragraph',
        text: 'If kube-state-metrics already runs in the cluster, it is two rules. `time() - kube_cronjob_status_last_successful_time > 90000` fires when a job has not succeeded in 25 hours, and `kube_job_status_failed > 0` catches each failed Job, with a reason label. Alertmanager routes both. For a team that already operates that stack, this is the answer. For a team that does not, it is three components to run, and they go down with the cluster they are meant to watch.',
      },
      {
        type: 'heading',
        text: 'Kubernetes CronJob failed alert without Prometheus',
      },
      {
        type: 'paragraph',
        text: 'The Logdash version is one Deployment that reads lastSuccessfulTime every 10 seconds and posts to a push monitor while it is fresh. Push monitors are on Pro, $15 a month, and Pro checks each one every 15 seconds: no ping in that window, the monitor goes down. That is why the CronJob does not call Logdash itself. A curl at the end of a nightly job is one ping a day against a 15-second window.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Read-only access to CronJobs',
        code: `kubectl create serviceaccount cron-watch
kubectl create role cron-watch --verb=get --resource=cronjobs
kubectl create rolebinding cron-watch --role=cron-watch --serviceaccount=default:cron-watch`,
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'cron-watch.yaml',
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: cron-watch
spec:
  replicas: 1
  selector:
    matchLabels: { app: cron-watch }
  template:
    metadata:
      labels: { app: cron-watch }
    spec:
      serviceAccountName: cron-watch
      containers:
        - name: watch
          image: alpine/k8s:1.36.5
          env:
            - { name: JOB, value: nightly-report }
            - { name: MAX_AGE, value: "90000" } # 25 hours in seconds
            - { name: PING, value: https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234 }
          command: ["/bin/sh", "-c"]
          args:
            - |
              while true; do
                kubectl get cronjob "$JOB" -o json \\
                  | jq -e "now - (.status.lastSuccessfulTime | fromdateiso8601) < $MAX_AGE" >/dev/null \\
                  && curl -fsS -m 5 -X POST "$PING"
                sleep 10
              done`,
      },
      {
        type: 'paragraph',
        text: 'The alpine/k8s image ships kubectl, jq and curl. jq -e exits non-zero when the timestamp is stale or missing, so a CronJob that has never succeeded sends nothing. Set MAX_AGE to the schedule interval plus the lateness you accept. Because the watcher runs in the cluster, a dead cluster or a broken network goes quiet too, and that reaches you as well.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service in Logdash on Pro, set the monitor to push and copy the monitor id from the ping URL. Name it after the CronJob, since the alert shows the name.',
          },
          {
            title: 'Apply the watcher',
            text: 'Run the three kubectl lines, put the CronJob name, window and monitor id into the env block and apply the file. If the job succeeded inside the window, the monitor goes green within 15 seconds.',
          },
          {
            title: 'Break it on purpose',
            text: 'Scale the watcher to zero replicas. Within 30 seconds a Telegram message lands saying the monitor is down, status code 0, did not receive call for this time range. Scale it back and the up message follows.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Prometheus for CronJobs',
        them: 'Prometheus and kube-state-metrics',
        rows: [
          {
            feature: 'Setup if you already run it',
            logdash: 'RBAC, a Deployment and a monitor per job',
            them: 'Two alert rules',
            winner: 'them',
          },
          {
            feature: 'Setup from zero',
            logdash: 'One Deployment, alerting lives outside',
            them: 'kube-state-metrics, Prometheus and Alertmanager',
            winner: 'logdash',
          },
          {
            feature: 'New CronJobs',
            logdash: 'One more watcher and monitor each',
            them: 'Covered by the same rule',
            winner: 'them',
          },
          {
            feature: 'Why it failed',
            logdash: 'Only that the job went stale',
            them: 'Failure reason as a label',
            winner: 'them',
          },
          {
            feature: 'Whole cluster down',
            logdash: 'Alert within 30 seconds',
            them: 'Silent unless you add an outside check',
            winner: 'logdash',
          },
          {
            feature: 'Cost',
            logdash: 'Pro, $15 a month',
            them: 'Open source, you run and store it',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Prometheus',
        reasons: [
          'You already run Prometheus with kube-state-metrics. Two rules beat a new Deployment.',
          'You have dozens of CronJobs. One rule covers all of them, including the ones added next month.',
          'You want to know why a Job failed. The reason label separates BackoffLimitExceeded from DeadlineExceeded.',
          'Alerts have to reach Slack or PagerDuty. Logdash sends Telegram and webhooks only.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question:
          'Which metrics does Kubernetes CronJob monitoring use in Prometheus?',
        answer:
          'kube_cronjob_status_last_successful_time for staleness and kube_job_status_failed for failed runs, both from kube-state-metrics. Alert when time() minus the first exceeds the schedule interval plus slack.',
      },
      {
        question: 'How do I get a Kubernetes CronJob failed alert?',
        answer:
          'Watch status.lastSuccessfulTime, not pod events. A failed, suspended or never-scheduled job stops it moving. Alert on it in Prometheus, or ping a Logdash push monitor while it is fresh and get a Telegram alert when it stops.',
      },
      {
        question: 'What is the simplest kube cronjob alerting setup?',
        answer:
          'Without Prometheus, one Deployment running kubectl, jq and curl in a loop, plus a read-only role. With Prometheus, two rules on kube-state-metrics. Both alert on a stale lastSuccessfulTime.',
      },
      {
        question:
          'Does Kubernetes CronJob monitoring need a Pro plan in Logdash?',
        answer:
          'Yes. Push monitors are a Pro feature at $15 a month, which covers 50 services with one monitor each. HTTP uptime checks are on every plan, including the free one.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'github-actions',
    h1: 'GitHub Actions monitoring',
    answer:
      'GitHub shows you the runs that failed but never the runs that did not start, so watch a scheduled workflow from outside: the last step reports success, and a monitor alerts you when that report goes stale.',
    meta: {
      title: 'GitHub Actions monitoring for scheduled workflows | Logdash',
      description:
        'Scheduled workflows get disabled after 60 days and run late under load. How to catch the run that never happened and get a Telegram alert.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The Actions tab is a good record of what ran and no record of what did not. When a scheduled workflow fails, GitHub emails the user who last modified the cron line in the workflow file, which may be someone who left in March. When the workflow never starts, nobody hears anything, because there is no run to fail.',
      },
      { type: 'heading', text: 'GitHub Actions scheduled workflow monitoring' },
      {
        type: 'paragraph',
        text: "Three behaviours from GitHub's own docs make a schedule less reliable than the YAML suggests:",
      },
      {
        type: 'list',
        items: [
          'In a public repository, scheduled workflows are disabled after 60 days with no repository activity. The nightly backup of a finished side project is exactly the workflow this hits.',
          'The schedule event can be delayed during high load, and the start of every hour counts as high load. Under enough load, queued runs are dropped, not just delayed.',
          'Schedules run only on the default branch, no more often than every 5 minutes, and in UTC unless the entry sets the timezone key GitHub added in March 2026.',
        ],
      },
      {
        type: 'paragraph',
        text: 'So the question to monitor is not "did a run fail". It is "did a successful run happen recently enough".',
      },
      { type: 'heading', text: 'GitHub Actions cron: report in on success' },
      {
        type: 'paragraph',
        text: 'Put the report at the end of the job. Steps stop at the first failure, so the last step only runs when everything before it passed. The odd minute keeps the run off the top of the hour.',
      },
      {
        type: 'code',
        language: 'yaml',
        title: '.github/workflows/nightly-sync.yml',
        code: `name: nightly-sync
on:
  schedule:
    - cron: '17 3 * * *' # 03:17 UTC
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v7
      - run: ./scripts/sync.sh
      - name: Report success
        run: >
          curl -fsS -m 10 -X POST
          -H "Authorization: Bearer \${{ secrets.HEARTBEAT_TOKEN }}"
          https://yourapp.com/internal/heartbeat/nightly-sync`,
      },
      { type: 'heading', text: 'Why the check lives in your app' },
      {
        type: 'paragraph',
        text: 'A Logdash push monitor looks like the obvious target and is the wrong one here. Push monitors are a Pro feature, they expect a ping inside every 15-second window, and they flip to down on the first empty one. There is no grace setting. A workflow that runs every 5 minutes at best would flap after every run. So turn it around: the workflow tells your app, your app keeps the mark for 26 hours, and an ordinary HTTP monitor asks whether the mark is still there. That runs on the free plan. The 26 hours is a daily schedule plus two hours of slack for GitHub delays; set it to your own interval plus the lateness you can live with.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'server.ts',
        code: `import express from 'express';
import { Redis } from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL!);
const KEY = 'heartbeat:nightly-sync';
const TTL = 26 * 60 * 60; // one day plus slack for GitHub delays

app.post('/internal/heartbeat/nightly-sync', async (req, res) => {
  if (req.get('authorization') !== \`Bearer \${process.env.HEARTBEAT_TOKEN}\`) {
    res.sendStatus(401);
    return;
  }
  await redis.set(KEY, Date.now(), 'EX', TTL);
  res.sendStatus(204);
});

// Logdash checks this. 503 means no successful run in 26 hours.
app.get('/health/nightly-sync', async (_req, res) => {
  res.sendStatus((await redis.exists(KEY)) ? 200 : 503);
});

app.listen(3000);`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Ship the two routes',
            text: 'Deploy them, add HEARTBEAT_TOKEN as a repository secret, then run the workflow once by hand so the key exists before the first check.',
          },
          {
            title: 'Point a monitor at it',
            text: 'Create a service in Logdash with an HTTP monitor on /health/nightly-sync and connect a Telegram channel. Checks run every 5 minutes on the free plan and every minute on Builder.',
          },
          {
            title: 'Let it go stale',
            text: 'Delete the key in Redis. The route answers 503, the monitor flips to down on the next check, and a Telegram alert names the monitor and the 503.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io for scheduled workflows',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'Code in your app',
            logdash: 'Two routes and a Redis key',
            them: 'None, the workflow curls their URL',
            winner: 'them',
          },
          {
            feature: 'Schedule awareness',
            logdash: 'Expressed as the key TTL',
            them: 'Cron expression, time zone and grace time per check',
            winner: 'them',
          },
          {
            feature: 'Catches the 60-day disable',
            logdash: 'Yes, the key expires',
            them: 'Yes, the ping stops',
            winner: 'tie',
          },
          {
            feature: 'HTTP checks on the app the workflow feeds',
            logdash: 'Same service, with response time',
            them: 'Not offered, it only listens for pings',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'Five services, checks every 5 minutes',
            them: '20 checks',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack, Telegram and many more',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'You do not want to add routes to an app just to watch a workflow. A curl to their ping URL is the whole integration.',
          'You run many scheduled workflows. One check per workflow with its own cron expression beats one route per workflow.',
          'The workflow does not touch an app you run, for example it cuts a release or prunes a bucket.',
          'You want email or Slack alerts. Logdash sends Telegram and webhooks only.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a GitHub Actions monitoring dashboard?',
        answer:
          'Yes, under Insights: Actions Usage Metrics and Actions Performance Metrics, the latter on every GitHub Cloud plan since March 2025. They show run times, queue times and failure rates per workflow. They count runs that happened, so a schedule that silently stopped never shows up there.',
      },
      {
        question: 'How does GitHub Actions runner monitoring work?',
        answer:
          "GitHub-hosted runners are GitHub's problem. A self-hosted runner installed with ./svc.sh install is a long-running service, which suits a Logdash push monitor: a loop on the host that pings every 10 seconds while the actions.runner service is active. GitHub marks a dead runner Offline in settings, which is a page you have to open.",
      },
      {
        question: 'Why did my GitHub Actions cron not run?',
        answer:
          'Usually one of four reasons: the repo is public and had no activity for 60 days, so the schedule was disabled; the run was delayed or dropped under load; the workflow is not on the default branch; or the entry has no timezone key, so it runs in UTC, and you wrote local time. Re-enable a disabled workflow from the Actions tab.',
      },
      {
        question:
          'Does GitHub Actions scheduled workflow monitoring need a paid plan?',
        answer:
          'Not with the setup above. It uses an HTTP monitor, which the free plan includes with checks every 5 minutes. Push monitors are Pro only at $15 a month, and they need a ping every 15 seconds, which a scheduled workflow cannot send.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'windows-task-scheduler',
    h1: 'Windows Task Scheduler monitoring',
    answer:
      "Task Scheduler keeps each task's last run time and last run result but never alerts on them, so monitor it with a small PowerShell watcher that pings an external monitor every 10 seconds while the last run is recent and clean.",
    meta: {
      title: 'Windows Task Scheduler monitoring | Logdash',
      description:
        'Read Last Run Result with Get-ScheduledTaskInfo, turn it into a 10-second heartbeat with Invoke-RestMethod, and get a Telegram alert when a scheduled task fails.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Task Scheduler runs the job and keeps the receipt. Last Run Time and Last Run Result sit in two columns of the console, and that is all you get. The Send an e-mail action has been deprecated since Windows 8 and Server 2012, task history is off until someone clicks Enable All Tasks History, and nobody opens the console on a server that has worked for two years. That is how a backup task returns 0x1 for a month.',
      },
      { type: 'heading', text: 'Task Scheduler last run result' },
      {
        type: 'paragraph',
        text: 'Get-ScheduledTaskInfo returns what the console shows: LastRunTime, LastTaskResult, NextRunTime and NumberOfMissedRuns. LastTaskResult is the exit code of the action, so 0 is success and 1 is the generic failure most scripts return. A few values are states, not errors: 267009, or 0x41301, means the task is running right now, and 267011, or 0x41303, means it has never run. A check that treats every non-zero value as failure pages you every time the backup is mid-run.',
      },
      {
        type: 'heading',
        text: 'Windows Task Scheduler monitoring with a heartbeat',
      },
      {
        type: 'paragraph',
        text: 'Logdash push monitors are on Pro, $15 a month, and Pro checks each one every 15 seconds: no ping in that window, the monitor goes down and the alert goes out. A nightly task cannot ping that often, so a second task pings for it. The watcher below starts at boot, reads the task every 10 seconds, and posts to Logdash only while the last run started within 25 hours and either ended clean or is still going.',
      },
      {
        type: 'code',
        language: 'powershell',
        title: 'C:\\ops\\watch-task.ps1',
        code: `$task   = 'Nightly Backup'
$maxAge = New-TimeSpan -Hours 25
$ping   = 'https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234'
[Net.ServicePointManager]::SecurityProtocol = 'Tls12'

while ($true) {
  $info  = Get-ScheduledTaskInfo -TaskName $task
  $fresh = ((Get-Date) - $info.LastRunTime) -lt $maxAge
  # 0 = last run succeeded, 267009 = running right now
  if ($fresh -and $info.LastTaskResult -in 0, 267009) {
    try { Invoke-RestMethod -Method Post -Uri $ping -TimeoutSec 5 | Out-Null } catch {}
  }
  Start-Sleep -Seconds 10
}`,
      },
      {
        type: 'code',
        language: 'powershell',
        title: 'Run once in an elevated PowerShell',
        code: `$action   = New-ScheduledTaskAction -Execute 'powershell.exe' \`
  -Argument '-NoProfile -ExecutionPolicy Bypass -File C:\\ops\\watch-task.ps1'
$trigger  = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'Logdash watch' -Action $action \`
  -Trigger $trigger -Settings $settings -User 'SYSTEM' -RunLevel Highest
Start-ScheduledTask -TaskName 'Logdash watch'`,
      },
      {
        type: 'list',
        items: [
          'The zero time limit matters. The default is 3 days, so without it Task Scheduler kills the watcher on day three and you get an alert for nothing.',
          "Tasks inside a folder need -TaskPath next to -TaskName, for example -TaskPath '\\Backups\\'.",
          'The TLS line is for Windows PowerShell 5.1 on older servers, which can still default to protocols the API refuses.',
          'A reboot stops the watcher, so patch night reads as a short outage with a down and an up message.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service in Logdash on Pro, set the monitor to push and copy the monitor id from the ping URL. Name it after the task, since the alert shows the name.',
          },
          {
            title: 'Install the watcher',
            text: 'Save the script with your task name, window and monitor id, then run the registration block as administrator. If the last run was clean, the monitor goes green within 15 seconds.',
          },
          {
            title: 'Break it on purpose',
            text: "Run Stop-ScheduledTask -TaskName 'Logdash watch'. Within 30 seconds a Telegram message lands saying the monitor is down, status code 0, did not receive call for this time range. Start it again and the up message follows.",
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Cronitor for Windows tasks',
        them: 'Cronitor',
        rows: [
          {
            feature: 'Setup',
            logdash: 'One watcher script and monitor per task',
            them: 'cronitor sync scans Task Scheduler and wraps the tasks you pick',
            winner: 'them',
          },
          {
            feature: 'What it alerts on',
            logdash: 'Last run stale or not clean',
            them: 'Late start, failure and long runtime, separately',
            winner: 'them',
          },
          {
            feature: 'Your task definition',
            logdash: 'Untouched, the watcher only reads it',
            them: 'Action rewritten to run through cronitor.exe',
            winner: 'logdash',
          },
          {
            feature: 'Server down',
            logdash: 'Alert within 30 seconds',
            them: 'Alert at the next missed run',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack and more',
            winner: 'them',
          },
          {
            feature: 'Free plan',
            logdash: 'None for push monitors, Pro is $15 a month',
            them: '5 monitors free',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cronitor',
        reasons: [
          'You have more than a few tasks. cronitor sync finds them all and wraps the ones you choose in one pass.',
          'You want did not start, failed and ran too long as three different alerts, not one freshness window.',
          'Your servers reboot for patches every month and a short down and up message each time would be noise.',
          'Alerts must land in email or Slack, and 5 monitors on a free plan covers you.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is a good Windows Task Scheduler monitoring tool?',
        answer:
          'For many tasks, Cronitor, whose CLI discovers and wraps them. For a few important tasks on servers you also want uptime checks for, a PowerShell watcher pinging a Logdash push monitor. Task Scheduler itself has no alerting.',
      },
      {
        question: 'How do I get a scheduled task failed alert on Windows?',
        answer:
          'Read LastTaskResult with Get-ScheduledTaskInfo and treat anything other than 0 or 267009 as a failure. The watcher above stops pinging on a failure, and Logdash sends a Telegram alert within 30 seconds.',
      },
      {
        question: 'What does Task Scheduler last run result 0x1 mean?',
        answer:
          'The action exited with code 1. That is the script or program failing, not Task Scheduler. Common causes are a wrong working directory, a missing path or a credential the task account does not have.',
      },
      {
        question: 'Does Windows Task Scheduler monitoring need an agent?',
        answer:
          'Something on the machine has to read the task state. Here it is a PowerShell script registered as a startup task, with nothing to install.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const cronMonitoring: SeoFamilyData = {
  family: cronMonitoringFamily,
  pages: cronMonitoringPages,
};
