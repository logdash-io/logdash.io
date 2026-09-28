# Logdash status page for Next.js

A status page for your [Logdash](https://logdash.io) monitors that runs on your domain and looks like the rest of your site.
It is a small Next.js app: one page, one component and a Tailwind theme you control.
The data comes from the public Logdash status page API through [`@logdash/status`](https://www.npmjs.com/package/@logdash/status).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/logdash-io/logdash.io/tree/main/templates/status-page-next&env=LOGDASH_STATUS_PAGE_ID&envDescription=Your%20Logdash%20status%20page%20id%2C%20or%20its%20verified%20custom%20domain&envLink=https%3A%2F%2Flogdash.io%2Fdocs%2Fstatus-pages%23deploy-the-next-js-starter)

## Deploy

1. Publish a status page in Logdash and copy its id.
   The status page settings show it under "Build your own", and it is the last part of the page's URL, `https://logdash.io/d/<id>`.
2. Click the button above and paste the id into `LOGDASH_STATUS_PAGE_ID`.
3. Point a subdomain such as `status.example.com` at the new project.

## Run it locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `LOGDASH_STATUS_PAGE_ID` in `.env.local`, then open http://localhost:3000.

| Variable                 | Description                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `LOGDASH_STATUS_PAGE_ID` | Required. Your status page id, or its verified custom domain.                                                                   |
| `LOGDASH_API_URL`        | Optional. Only for pointing the page at a local Logdash backend, for example `http://localhost:3000`. Leave it unset otherwise. |

A local Logdash backend listens on port 3000, the same port as `next dev`, so start the page on another one with `npm run dev -- -p 3001`.

## How it works

`app/page.tsx` fetches the status page on the server, and Next.js renders it again at most once every 60 seconds (`export const revalidate = 60`).
In the browser, the component polls the Logdash API every 60 seconds and pauses while the tab is hidden.
When a request fails, the page keeps showing the last data it had, and Next.js keeps serving the last page it rendered.

`next build` fetches the status page once, so a missing id, an unknown id (404) or a page that is not published (403) fails the build with that error.

## Make it yours

`components/status-page.tsx` is the same file `npx shadcn add https://logdash.io/r/react/status-page.json` installs.
It is plain React and Tailwind with no dependency other than `@logdash/status`, so change whatever you like.

Colours come from the shadcn CSS variables in `app/globals.css`, such as `--background`, `--foreground`, `--muted-foreground` and `--border`.
Replace them with your site's theme.
The status colours (green, amber and red) are set in the component.

## Host it apart from your app

People open a status page when your app is down.
If the page runs on the same servers, deploys or domain setup as your app, one outage takes both down, and the page cannot tell anyone about it.
Deploy it as its own project on its own subdomain, so it stays up when your app does not.

## License

MIT
