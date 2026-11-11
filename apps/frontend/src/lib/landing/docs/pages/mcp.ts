import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/mcp',
  title: 'MCP server',
  metaTitle: 'MCP server | Logdash Docs',
  description:
    'Connect Claude Code, Codex, Cursor or any MCP client to Logdash, so your coding agent can read your web analytics and build insights for you.',
  keywords:
    'logdash mcp, mcp server, web analytics mcp, claude code analytics, cursor mcp, codex mcp',
  blocks: [
    {
      type: 'paragraph',
      text: 'The Logdash MCP server lets your coding agent read your [web analytics](/docs/web-analytics) and save [insights](/docs/web-analytics/insights) to your dashboard. Ask it questions such as "where do signups come from this month?" or "add a funnel from first open to first project, and a weekly cohort table".',
    },
    {
      type: 'paragraph',
      text: 'The server answers at `https://api.logdash.io/mcp` over Streamable HTTP. Agents that support sign-in through the browser need no key. Other agents use a [personal API key](/docs/api-keys).',
    },
    { type: 'heading', text: 'Connect your agent' },
    {
      type: 'code-group',
      items: [
        {
          title: 'Claude Code',
          language: 'bash',
          code: 'claude mcp add --transport http logdash https://api.logdash.io/mcp',
        },
        {
          title: 'Codex',
          language: 'text',
          code: `# ~/.codex/config.toml
[mcp_servers.logdash]
url = "https://api.logdash.io/mcp"
bearer_token_env_var = "LOGDASH_PERSONAL_KEY"`,
        },
        {
          title: 'Cursor',
          language: 'json',
          code: `{
  "mcpServers": {
    "logdash": {
      "url": "https://api.logdash.io/mcp",
      "headers": { "Authorization": "Bearer \${env:LOGDASH_PERSONAL_KEY}" }
    }
  }
}`,
        },
      ],
    },
    { type: 'heading', text: 'Sign in through the browser', level: 3 },
    {
      type: 'paragraph',
      text: 'On first use, Claude Code opens a Logdash consent page that names the agent and what it asks for: **Read your analytics**, or **Read your analytics and manage your saved insights**. Press **Approve** to connect, or **Decline**.',
    },
    {
      type: 'list',
      items: [
        'The agent gets a key labelled `MCP (<client>)` in your [API keys](/docs/api-keys). It reaches every domain you are a member of.',
        'The key expires after 30 days. Then you approve the agent again.',
        'To disconnect the agent, revoke its key in **API keys**.',
      ],
    },
    { type: 'heading', text: 'Use a personal API key', level: 3 },
    {
      type: 'paragraph',
      text: 'For Codex, Cursor and other clients, [create a personal API key](/docs/api-keys#create-a-key) and keep it in `LOGDASH_PERSONAL_KEY`. Set **Web analytics** to **Read** so the agent can only read, or to **Write** so it can also save, change and remove insights. Under **Access**, pick the domains the agent may see.',
    },
    { type: 'heading', text: 'Tools' },
    {
      type: 'paragraph',
      text: 'The agent calls `describe` first, to get the IDs of your domains and the names of your events. The other tools take a domain ID, and most take a number of days, cut to the retention of your plan. They return short summaries, never raw events.',
    },
    {
      type: 'table',
      headers: ['Tool', 'What it returns'],
      rows: [
        [
          '`describe`',
          'The domains the key reaches, with their sites, goals, saved insights and retention, and the custom events with their counts and property keys.',
        ],
        [
          '`overview`',
          'Visits, people, pageviews, bounce rate, session length and conversion against the period before, with the top 5 of every breakdown.',
        ],
        [
          '`breakdown`',
          'Visits and events by one dimension, such as sources, campaigns, pages or countries.',
        ],
        [
          '`person_funnel`',
          'How many visitors or signed-in users went through pages and goals in order.',
        ],
        [
          '`events_funnel`',
          'Event counts for each step, with conversion and drop-off.',
        ],
        [
          '`trend`',
          'Event counts, or distinct people, per day, week or month, for up to 5 series. A series can have its own `label` and `bucket`, and `measure` set to `people` counts the users who sent it.',
        ],
        [
          '`distribution`',
          'A histogram of a numeric event property, with its mean and median.',
        ],
        [
          '`cohort_table`',
          'Cohorts by a date property, with the share of each cohort that sent each later event.',
        ],
        [
          '`retention`',
          'Retention, daily and monthly active users and comebacks of signed-in users.',
        ],
        [
          '`list_insights`',
          'The views and sections of the dashboard, and its saved insights in order, each with its view, section, hidden flag and width.',
        ],
        [
          '`run_insight`',
          'The current result of one saved insight, or of each tab of a tabbed insight.',
        ],
        [
          '`create_insight`',
          'Adds an insight to the end of the dashboard, up to 50 per domain, in the view and section you name. Needs **Write**.',
        ],
        [
          '`update_insight`',
          'Replaces the setup of an insight. Its view, section, hidden flag and width stay as they are unless you pass them. Needs **Write**.',
        ],
        [
          '`reorder_insights`',
          'Sets the order of the insights, and the view, section, hidden flag and width of any of them, in one call. Needs **Write**.',
        ],
        [
          '`set_views`',
          'Replaces the views of the dashboard and the sections of each view. Needs **Write**.',
        ],
        ['`delete_insight`', 'Removes an insight. Needs **Write**.'],
      ],
    },
    {
      type: 'paragraph',
      text: 'With **Read** only, the agent does not see the tools that need **Write**.',
    },
    { type: 'heading', text: 'Lay out a dashboard' },
    {
      type: 'paragraph',
      text: 'A dashboard has views, and each view has sections that hold cards. The agent reads the IDs of them with `list_insights`, and sets them with `set_views`, `create_insight`, `update_insight` and `reorder_insights`.',
    },
    {
      type: 'list',
      items: [
        '`set_views` takes the whole list of views, and the first one opens by default. Pass the ID of an existing view or section to keep or rename it, and leave the ID out to add one. A view with `traffic` set to `true` shows the built-in traffic cards, and no other view does. A section with `collapsed` set to `true` starts closed. The cards of a removed view move to the first view, and cards stay in their view when the views change order.',
        'Pass `version`, the `viewsVersion` from `list_insights`, to `set_views`. The call then fails when someone changed the views after you read them, instead of replacing their change.',
        'An insight takes `view` and `section` IDs, `hidden` to hide the card, and `width` set to `half` or `full`. An insight without a view shows in the first view, so existing insights need no change.',
        'To change the placement of insights, pass `placements` to `reorder_insights`. It changes only the insights it lists, and leaves a field alone when you omit it. A `null` clears the field.',
        'A tabbed insight has the type `tabs` and 2 to 6 chart setups in `tabs`. The title of each tab is its label.',
      ],
    },
    { type: 'heading', text: 'Compare products in one chart' },
    {
      type: 'paragraph',
      text: 'Each trend series takes a `label` and a `bucket` of `day`, `week` or `month`, so one chart can show the daily, weekly and monthly lines of several apps. Set `measure` to `people` to count the distinct users who sent the event, by the `userId` of the event. The three series are then the daily, weekly and monthly active users of an app. See [Events from your apps](/docs/web-analytics/app-events) for `userId`.',
    },
    {
      type: 'list',
      items: [
        'Series with different buckets share a day axis, and a series repeats its count on each day of its bucket. The result says which `bucket` each series counts per.',
        '`total` is what a series counted in the period. It is not the sum of the repeated counts. For people it is the distinct people of the whole period.',
        'An event without a `userId` is not a person. An app that sends no `userId` can send a marker once per active day with the properties `week_first` and `month_first`, and the weekly and monthly series count its events with a filter on them. See [Insights](/docs/web-analytics/insights) for the markers.',
        'The `bucket` of the insight is the bucket of every series that has none of its own.',
      ],
    },
    { type: 'heading', text: 'Measure a product loop' },
    {
      type: 'paragraph',
      text: 'Funnels, cohorts and event trends count events, so they work for apps that send no user ID. Send each milestone once per install, such as `first_open` and then `first_project`, with a `cohort` property set to the date of the first open. Then ask your agent for a funnel of the milestones and a weekly cohort table. See [Insights](/docs/web-analytics/insights) for more patterns.',
    },
  ],
};
