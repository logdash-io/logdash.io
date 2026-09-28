import { fetchStatusPage } from '@logdash/status';
import type { Metadata } from 'next';
import { cache } from 'react';
import { StatusPage } from '@/components/status-page';

export const revalidate = 60;

const baseUrl = process.env.LOGDASH_API_URL;

const getStatusPage = cache(async () => {
  const statusPageId = process.env.LOGDASH_STATUS_PAGE_ID;

  if (!statusPageId) {
    throw new Error(
      'LOGDASH_STATUS_PAGE_ID is not set. Copy .env.example to .env.local and set it to your status page id.',
    );
  }

  return {
    statusPageId,
    data: await fetchStatusPage(statusPageId, { baseUrl }),
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getStatusPage();

  return {
    title: data.name,
    description: `Current status and 90-day uptime history of ${data.name}.`,
  };
}

export default async function Page() {
  const { statusPageId, data } = await getStatusPage();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-20">
      <h1 className="sr-only">{data.name} status</h1>
      <StatusPage
        statusPageId={statusPageId}
        baseUrl={baseUrl}
        initialData={data}
      />
    </main>
  );
}
