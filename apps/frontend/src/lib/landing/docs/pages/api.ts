import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/api',
  title: 'HTTP API',
  metaTitle: 'HTTP API reference | Logdash Docs',
  description:
    'Send logs, metrics, events and heartbeats from any language, and read your logs, metrics and monitors with a personal API key.',
  keywords:
    'logdash api, logging api, metrics api, rest api, http log ingestion, read logs api, server-sent events logs',
  blocks: [
    {
      type: 'paragraph',
      text: 'Everything the SDKs and the dashboard do goes through one HTTP API at `https://api.logdash.io`. Use it from a language without an SDK, from a shell script, or to read your data into your own tools. Requests and responses are JSON.',
    },
    { type: 'heading', text: 'Authentication' },
    {
      type: 'paragraph',
      text: 'Sending data and reading data use different keys, so the key on your servers can never read anything. See [Keys and IDs](/docs/concepts#keys-and-ids).',
    },
    {
      type: 'table',
      headers: ['To', 'Send', 'Header'],
      rows: [
        [
          'Send logs, metrics and app events',
          'The ingest key of the domain',
          '`project-api-key: ldi_…`',
        ],
        [
          'Read your data',
          'A [personal API key](/docs/api-keys)',
          '`Authorization: Bearer ldp_…`',
        ],
        [
          'Ping a heartbeat, read a status page',
          'Nothing. These endpoints are public.',
          '-',
        ],
      ],
    },
    { type: 'heading', text: 'Errors' },
    {
      type: 'paragraph',
      text: 'Errors answer with a status code and a JSON body. `message` is a string, or a list of strings when the body has more than one problem.',
    },
    {
      type: 'code',
      language: 'json',
      code: `{
  "message": "Invalid API key",
  "error": "Unauthorized",
  "statusCode": 401
}`,
    },
    {
      type: 'table',
      headers: ['Status', 'Means'],
      rows: [
        [
          '`400`',
          'The body or a query parameter is not valid, such as a missing field or a field the endpoint does not know.',
        ],
        ['`401`', 'The key is missing, wrong, revoked or expired.'],
        [
          '`403`',
          'The personal API key lacks the scope, or does not reach the domain.',
        ],
        ['`404`', 'The monitor, metric or status page does not exist.'],
        [
          '`409`',
          'A [plan limit](/docs/limits) is reached, such as the number of apps or metrics.',
        ],
        [
          '`429`',
          'Too many requests. Wait for the window to end and try again.',
        ],
      ],
    },
    { type: 'heading', text: 'Logs' },
    { type: 'heading', text: 'Send a log', level: 3 },
    {
      type: 'code',
      language: 'bash',
      code: `curl -X POST https://api.logdash.io/logs \\
  -H "project-api-key: $LOGDASH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "createdAt": "2026-11-09T10:15:00.000Z",
    "level": "error",
    "message": "Payment failed for order 1042",
    "namespace": "billing",
    "app": "api"
  }'`,
    },
    {
      type: 'table',
      headers: ['Field', 'Type', 'Description'],
      rows: [
        ['`createdAt`', 'string, required', 'When it happened, in ISO 8601.'],
        [
          '`level`',
          'string, required',
          'One of `error`, `warning`, `info`, `http`, `verbose`, `debug` or `silly`. See [Levels](/docs/logging#levels).',
        ],
        [
          '`message`',
          'string, required',
          'The text of the log. Longer than 4,096 characters is cut.',
        ],
        [
          '`namespace`',
          'string',
          'A part of your app, such as `billing`. Up to 255 characters.',
        ],
        [
          '`app`',
          'string',
          'The app that sent it. Defaults to `default`. See [Apps](/docs/concepts#apps).',
        ],
        [
          '`sequenceNumber`',
          'number',
          'Orders logs that share the same `createdAt`. The SDKs set it for you.',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'A sent log answers `201` with `{"success": true}`. Fields the endpoint does not know answer `400`.',
    },
    { type: 'heading', text: 'Send a batch', level: 3 },
    {
      type: 'paragraph',
      text: 'Send 1 to 100 logs in one request to `POST /logs/batch`. Each item takes the same fields as a single log.',
    },
    {
      type: 'code',
      language: 'json',
      title: 'POST /logs/batch',
      code: `{
  "logs": [
    { "createdAt": "2026-11-09T10:15:00.000Z", "level": "info", "message": "Job started" },
    { "createdAt": "2026-11-09T10:15:02.000Z", "level": "info", "message": "Job finished" }
  ]
}`,
    },
    { type: 'heading', text: 'Log limits', level: 3 },
    {
      type: 'list',
      items: [
        'Each app can send a fixed number of logs per hour. Past it, logs answer `429` with "Rate limit exceeded" until the hour ends.',
        'A log for a new app past the apps limit of your plan answers `409` with "You have reached the maximum number of apps for your plan".',
        'Request bodies can be up to 2 MB. The endpoints accept requests from any origin, so a browser can send logs too.',
      ],
    },
    { type: 'heading', text: 'Metrics' },
    {
      type: 'code',
      language: 'bash',
      code: `curl -X PUT https://api.logdash.io/metrics \\
  -H "project-api-key: $LOGDASH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "queue_length", "value": 42, "operation": "set", "app": "worker"}'`,
    },
    {
      type: 'table',
      headers: ['Field', 'Type', 'Description'],
      rows: [
        [
          '`name`',
          'string, required',
          'The name of the metric. Up to 255 characters.',
        ],
        ['`value`', 'number, required', 'The value to set, or to add.'],
        [
          '`operation`',
          'string, required',
          '`set` replaces the value. `change` adds to it. See [Set or change](/docs/metrics#set-or-change).',
        ],
        [
          '`app`',
          'string',
          'The app the metric belongs to. Defaults to `default`.',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'A value answers `200` with `{"success": true}`. A new metric past the metrics limit of the app answers `409`.',
    },
    { type: 'heading', text: 'App events' },
    {
      type: 'paragraph',
      text: 'Send web analytics events from your backend or a native app to `POST /events` with the ingest key. The fields and examples are on [Events from your apps](/docs/web-analytics/app-events).',
    },
    { type: 'heading', text: 'Heartbeats' },
    {
      type: 'paragraph',
      text: 'Ping a heartbeat monitor with `POST /ping/<monitor-id>`. It needs no key. See [Cron and heartbeats](/docs/monitoring/heartbeats).',
    },
    { type: 'heading', text: 'Read your data' },
    {
      type: 'paragraph',
      text: 'Read endpoints take a [personal API key](/docs/api-keys) with the matching scope, and most of them a domain ID. To find it, open your domain, go to **Settings** and press **Copy domain ID** in the **Domain** card.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `export LOGDASH_PERSONAL_KEY="ldp_…"
export LOGDASH_DOMAIN_ID="6650f1c2a3b4c5d6e7f80a01"`,
    },
    { type: 'heading', text: 'Read logs', level: 3 },
    {
      type: 'paragraph',
      text: 'Needs **Logs: Read**. Returns the newest logs first.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `curl -G "https://api.logdash.io/clusters/$LOGDASH_DOMAIN_ID/logs" \\
  -H "Authorization: Bearer $LOGDASH_PERSONAL_KEY" \\
  --data-urlencode "levels=error" \\
  --data-urlencode "searchString=payment failed" \\
  --data-urlencode "limit=20"`,
    },
    {
      type: 'table',
      headers: ['Parameter', 'Description'],
      rows: [
        ['`limit`', '1 to 100 logs. Defaults to 50.'],
        [
          '`startDate`, `endDate`',
          'ISO 8601 dates. A start before the retention of your plan moves up to it.',
        ],
        [
          '`levels`',
          'Only these levels. Repeat it for more than one, such as `levels=error&levels=warning`.',
        ],
        ['`namespaces`', 'Only these namespaces. Repeat it for more than one.'],
        ['`apps`', 'Only these apps, by name. Repeat it for more than one.'],
        ['`searchString`', 'Only logs that contain every word, in any case.'],
        [
          '`lastId`, `direction`',
          'Pages from a log. `direction=before` returns older logs, `direction=after` newer ones. Send both or neither.',
        ],
      ],
    },
    {
      type: 'code',
      language: 'json',
      title: 'Response',
      code: `[
  {
    "id": "6650f1c2a3b4c5d6e7f80c21",
    "createdAt": "2026-11-09T10:15:00.000Z",
    "message": "Payment failed for order 1042",
    "level": "error",
    "sequenceNumber": 0,
    "namespace": "billing",
    "app": "api"
  }
]`,
    },
    {
      type: 'paragraph',
      text: 'To read the next page, send the `id` of the last log you got as `lastId`, with `direction=before`. An empty list means there is nothing older.',
    },
    { type: 'heading', text: 'Follow logs live', level: 3 },
    {
      type: 'paragraph',
      text: 'Needs **Logs: Read**. `GET /clusters/<domain-id>/logs/sse` streams each new log of the domain as a server-sent event, with the fields above. Send `lastId` to first get up to 100 logs that arrived after it.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `curl -N "https://api.logdash.io/clusters/$LOGDASH_DOMAIN_ID/logs/sse" \\
  -H "Authorization: Bearer $LOGDASH_PERSONAL_KEY"`,
    },
    { type: 'heading', text: 'Read metrics', level: 3 },
    {
      type: 'paragraph',
      text: 'Needs **Metrics: Read**. `GET /clusters/<domain-id>/metrics` lists the metrics of the domain with their current value and app.',
    },
    {
      type: 'code',
      language: 'json',
      title: 'Response',
      code: `[
  {
    "id": "6650f1c2a3b4c5d6e7f80b11",
    "name": "queue_length",
    "value": 42,
    "metricRegisterEntryId": "6650f1c2a3b4c5d6e7f80b10",
    "app": "worker",
    "projectId": "6650f1c2a3b4c5d6e7f80a02"
  }
]`,
    },
    {
      type: 'paragraph',
      text: 'For the history of one metric, call `GET /clusters/<domain-id>/metrics/<metricRegisterEntryId>`. `granularity` picks `minute`, `hour` or `day` points, and `limit` returns up to 1,000 of the newest. Each point has its `date` and `value`.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `curl "https://api.logdash.io/clusters/$LOGDASH_DOMAIN_ID/metrics/<metricRegisterEntryId>?granularity=hour&limit=24" \\
  -H "Authorization: Bearer $LOGDASH_PERSONAL_KEY"`,
    },
    { type: 'heading', text: 'Read monitors', level: 3 },
    {
      type: 'paragraph',
      text: 'Needs **Monitors: Read**. `GET /clusters/<domain-id>/http_monitors` lists the monitors of the domain with their `lastStatus`: `up`, `down` or `unknown`. `GET /clusters/<domain-id>/monitors/<monitor-id>/http_pings` returns the newest checks of one monitor, up to 160 with `limit`, 100 by default.',
    },
    {
      type: 'code',
      language: 'json',
      title: 'A check',
      code: `{
  "id": "6650f1c2a3b4c5d6e7f80d31",
  "httpMonitorId": "6650f1c2a3b4c5d6e7f80912",
  "statusCode": 200,
  "responseTimeMs": 184,
  "createdAt": "2026-11-09T10:15:00.000Z"
}`,
    },
    { type: 'heading', text: 'Read an overview', level: 3 },
    {
      type: 'paragraph',
      text: 'Needs **Domains: Read**. `GET /overview` answers "is anything wrong?" across every domain the key reaches, and `GET /clusters/<domain-id>/overview` for one domain. It returns the error logs per app, the status of each monitor, the number of monitors that are down, and when each app last sent a log and a metric. `since` sets the window, such as `30m`, `24h` or `7d`. It defaults to `1h`.',
    },
    {
      type: 'code',
      language: 'bash',
      code: `curl "https://api.logdash.io/overview?since=24h" \\
  -H "Authorization: Bearer $LOGDASH_PERSONAL_KEY"`,
    },
    { type: 'heading', text: 'Read web analytics', level: 3 },
    {
      type: 'paragraph',
      text: 'Read web analytics through the [MCP server](/docs/mcp). It takes the same personal API key, with **Web analytics: Read**.',
    },
    { type: 'heading', text: 'Status pages' },
    {
      type: 'paragraph',
      text: '`GET /v1/status_pages/<status-page-id>` returns a published status page as JSON. It needs no key. See [Build your own](/docs/status-pages/api).',
    },
  ],
};
