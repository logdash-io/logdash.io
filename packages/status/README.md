# @logdash/status

Typed client for [Logdash](https://logdash.io) public status pages, with React and Svelte bindings.
Build a status page that looks like the rest of your site, on data from the Logdash API.

- Zero runtime dependencies.
- Types generated from the API's OpenAPI spec.
- Polls in the background, pauses in hidden tabs and keeps the last good data when a request fails.

## Install

```sh
npm i @logdash/status
```

React (>= 18) and Svelte (>= 5.7) are optional peer dependencies: install the one you use.

Your status page id is shown in Logdash under the status page settings.
A verified custom domain (for example `status.example.com`) works as an id too.

## Fetch once

```ts
import { fetchStatusPage } from '@logdash/status';

const page = await fetchStatusPage('your-status-page-id');

page.status; // 'operational' | 'degraded' | 'outage' | 'unknown'
for (const monitor of page.monitors) {
  console.log(monitor.name, monitor.status, monitor.uptime['90d']);
}
```

`fetchStatusPage(statusPageId, { baseUrl?, init? })` calls `GET {baseUrl}/v1/status_pages/:statusPageId`.
`baseUrl` defaults to `https://api.logdash.io`.
`init` is passed through to `fetch`, so you can add a `signal` or Next.js options such as `{ next: { revalidate: 60 } }`.

A page has a `name`, an overall `status`, `updatedAt` and its `monitors` in the configured order.
Each monitor has a `status`, `uptime` percentages for `1h`, `24h`, `7d`, `30d` and `90d` (`null` when there is no data), `history.daily` with 90 UTC days (oldest first, today last) and its last 100 `pings` (oldest first).
The types `StatusPage`, `Monitor`, `Bucket` and `Ping` are exported.

## React

```tsx
'use client';

import { useStatusPage } from '@logdash/status/react';

export function Status() {
  const { data, error, isLoading, lastUpdated } = useStatusPage('your-status-page-id');

  if (!data) return <p>{error ? 'Status is unavailable right now.' : 'Loading...'}</p>;

  return (
    <ul>
      {data.monitors.map((monitor) => (
        <li key={monitor.id}>
          {monitor.name}: {monitor.status}
        </li>
      ))}
    </ul>
  );
}
```

`useStatusPage(statusPageId, options?)` returns `{ data, error, isLoading, lastUpdated }`.
It keeps one store per `statusPageId` and `baseUrl` for the component's lifetime.

## Svelte

```svelte
<script lang="ts">
  import { statusPage } from '@logdash/status/svelte';

  let { id }: { id: string } = $props();

  const page = $derived(statusPage(id));
</script>

{#if page.data}
  <h1>{page.data.name}</h1>
  {#each page.data.monitors as monitor (monitor.id)}
    <p>{monitor.name}: {monitor.status}</p>
  {/each}
{:else if page.error}
  <p>Status is unavailable right now.</p>
{:else}
  <p>Loading...</p>
{/if}
```

`statusPage(statusPageId, options?)` returns an object with reactive `data`, `error`, `isLoading` and `lastUpdated` getters and a `refresh()` method.
Reading a getter in a template or effect starts polling; it stops once nothing reads it.
Wrap the call in `$derived` when the id can change, as above; with a fixed id a plain `const` is enough.

## Server rendering

Fetch on the server and pass the result as `initialData`.
The first render then has data, and the client picks up polling from there without a loading state.

```tsx
// app/page.tsx (Next.js App Router)
import { fetchStatusPage } from '@logdash/status';
import { Status } from './status';

export const revalidate = 60;

export default async function Page() {
  const page = await fetchStatusPage('your-status-page-id');
  return <Status initialData={page} />;
}
```

```tsx
// app/status.tsx
'use client';

import type { StatusPage } from '@logdash/status';
import { useStatusPage } from '@logdash/status/react';

export function Status({ initialData }: { initialData: StatusPage }) {
  const { data } = useStatusPage('your-status-page-id', { initialData });
  // ...
}
```

In SvelteKit, return the page from a `load` function and pass it the same way: `statusPage(id, { initialData: data.page })`.
On the server nothing polls: React renders the snapshot built from `initialData`, and the Svelte getters return it.

## Polling

Options for `useStatusPage`, `statusPage` and `createStatusPageStore`:

| Option         | Default                  | Description                                       |
| -------------- | ------------------------ | ------------------------------------------------- |
| `baseUrl`      | `https://api.logdash.io` | API origin, for example `http://localhost:3000`.  |
| `pollInterval` | `60_000`                 | Milliseconds between refreshes, `0` turns it off. |
| `initialData`  |                          | A page fetched earlier, usually on the server.    |

- Polling runs only in the browser and only while something is subscribed.
- It fetches right away when there is no data yet; with `initialData` the first refresh comes after `pollInterval`.
- It pauses while the tab is hidden and refetches as soon as the tab is visible again.
- `isLoading` is `true` while a request is in flight, including background refreshes, and before the first load.
  Show a loading state for `!data && isLoading`, not for `isLoading` alone.
- `lastUpdated` is the server's `updatedAt` of the data you have, so it keeps ageing while requests fail.
- The API caches responses for 60 seconds, so polling more often than that returns the same data.

For other frameworks, use the store directly:

```ts
import { createStatusPageStore } from '@logdash/status';

const store = createStatusPageStore('your-status-page-id', { pollInterval: 60_000 });
const unsubscribe = store.subscribe(() => render(store.getSnapshot()));
await store.refresh();
```

`getSnapshot()` returns the same object until something changes and a new one after every change.

## Errors

`fetchStatusPage` throws a `StatusPageError` when the API answers with an error status:

- `404` - no status page with that id or verified custom domain.
- `403` - the status page exists but is not public.

Network failures reject with the error `fetch` throws, so you can tell them apart:

```ts
import { fetchStatusPage, StatusPageError } from '@logdash/status';

try {
  await fetchStatusPage(id);
} catch (error) {
  if (error instanceof StatusPageError && error.status === 404) notFound();
  throw error;
}
```

The hooks never throw.
A failed refresh sets `error` and keeps the last good `data`; the next successful refresh clears `error`.

## Components

Ready-made status page components, copied into your project so you own the code.
They use Tailwind and shadcn theme variables, so they follow your site's theme.

```sh
npx shadcn add https://logdash.io/r/react/status-page.json
npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json
```

## Starter

A deployable Next.js status page: [templates/status-page-next](https://github.com/logdash-io/logdash.io/tree/main/templates/status-page-next).

## Docs

[logdash.io/docs/status-pages](https://logdash.io/docs/status-pages)

## License

MIT
