import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/api-keys',
  title: 'Personal API keys',
  metaTitle: 'Personal API keys | Logdash Docs',
  description:
    'Create a key that reads your logs, metrics, monitors and analytics from scripts and coding agents, limited to the scopes and domains you pick.',
  keywords:
    'logdash api key, personal access token, api scopes, read api key, mcp api key',
  blocks: [
    {
      type: 'paragraph',
      text: 'A personal API key acts as you outside the browser: in a script, a CI job or a coding agent. You decide what it can read or change, which domains it reaches and when it expires. It is a different key from the ingest key your apps send logs with. See [Keys and IDs](/docs/concepts#keys-and-ids).',
    },
    { type: 'heading', text: 'Create a key' },
    {
      type: 'steps',
      items: [
        {
          title: 'Open API keys',
          text: 'Open the account menu at the bottom of the sidebar, choose **API keys** and press **New key**.',
        },
        {
          title: 'Name it',
          text: 'Enter a **Label** that says where the key lives, such as `CI release job` or `My laptop`. You see it in the list of keys later.',
        },
        {
          title: 'Pick scopes',
          text: 'Under **Scopes**, give each area the least access the job needs. Every area starts at **Read**, except **Account**.',
        },
        {
          title: 'Pick access',
          text: 'Under **Access**, choose **Everything**, a set of **Domains**, or a set of apps under **Services**.',
        },
        {
          title: 'Pick an expiry',
          text: 'Choose **30 days**, **90 days**, **1 year** or **No expiration**, and press **Create key**.',
        },
        {
          title: 'Copy the key',
          text: 'Logdash shows the key once. Copy it into your secret store or an environment variable, such as `LOGDASH_PERSONAL_KEY`.',
        },
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'Logdash keeps only a hash of the key. If you lose it, revoke it and create a new one.',
    },
    { type: 'heading', text: 'Use a key' },
    {
      type: 'paragraph',
      text: 'Send the key in the `Authorization` header of every request. To check a key and see what it can do, call `whoami`:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `curl https://api.logdash.io/personal-api-keys/whoami \\
  -H "Authorization: Bearer $LOGDASH_PERSONAL_KEY"`,
    },
    {
      type: 'code',
      language: 'json',
      title: 'Response',
      code: `{
  "userId": "6650f1c2a3b4c5d6e7f80912",
  "scopes": [
    { "resource": "logs", "action": "read" },
    { "resource": "monitors", "action": "read" }
  ],
  "access": { "kind": "clusters", "ids": ["6650f1c2a3b4c5d6e7f80a01"] }
}`,
    },
    {
      type: 'paragraph',
      text: 'The [HTTP API](/docs/api#read-your-data) lists what you can read with it, and the [MCP server](/docs/mcp) takes it too.',
    },
    { type: 'heading', text: 'Scopes' },
    {
      type: 'paragraph',
      text: 'Each scope gives one area of your data an access level. A higher level includes the ones below it, so **Write** can also read.',
    },
    {
      type: 'table',
      headers: ['Scope', 'Levels', 'What it allows'],
      rows: [
        ['Logs', 'Read', 'Read and search logs, and follow them live.'],
        ['Metrics', 'Read', 'Read metrics and their history.'],
        [
          'Monitors',
          'Read, Write, Delete',
          '**Read** reads monitors and their checks. **Write** adds and edits monitors. **Delete** also deletes monitors and their history.',
        ],
        ['Services', 'Read', 'List the apps of a domain.'],
        [
          'Domains',
          'Read',
          'Read the overview of your domains and their ingest keys.',
        ],
        [
          'Web analytics',
          'Read, Write',
          '**Read** reads your analytics. **Write** also saves, edits and removes insights.',
        ],
        ['Account', 'Read', 'Read your account.'],
      ],
    },
    {
      type: 'paragraph',
      text: 'A request that needs a scope the key lacks answers `403` with a message such as `Missing scope logs:read`. Endpoints that no scope covers, such as billing and creating keys, answer `403` to every personal API key.',
    },
    { type: 'heading', text: 'Access' },
    {
      type: 'table',
      headers: ['Access', 'The key reaches'],
      rows: [
        [
          'Everything',
          'Every domain you are a member of, including domains you join later.',
        ],
        ['Domains', 'Only the domains you check.'],
        ['Services', 'Only the apps you check, in their domains.'],
      ],
    },
    {
      type: 'paragraph',
      text: 'Access never goes beyond your own membership. If you leave a domain, your keys stop reaching it. A request for a domain outside the key answers `403` with "Personal API key is not scoped to this domain or service".',
    },
    { type: 'heading', text: 'Revoke a key' },
    {
      type: 'paragraph',
      text: 'In **API keys**, press the trash button of the key and confirm with **Revoke key**. Anything that uses the key stops working at once. The list also shows when each key was last used and when it expires, so you can find keys nobody uses.',
    },
    {
      type: 'paragraph',
      text: 'Coding agents that sign in through the browser get a key of their own, labelled `MCP (<client>)`. It expires after 30 days, and you revoke it in the same list.',
    },
    { type: 'heading', text: 'Keep keys safe' },
    {
      type: 'list',
      items: [
        'Give each script or agent its own key, so you can revoke one without breaking the others.',
        'Prefer an expiry over **No expiration**, and **Read** over **Write**.',
        'Keep keys out of code and out of the browser. A personal API key can read every domain it reaches.',
      ],
    },
  ],
};
