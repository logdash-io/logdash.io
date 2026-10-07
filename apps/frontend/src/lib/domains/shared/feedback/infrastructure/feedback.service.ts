import type { Feedback } from '$lib/domains/shared/feedback/domain/feedback';

export async function sendFeedback(feedback: Feedback): Promise<void> {
  const response = await fetch('/app/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error(`Sending feedback failed with ${response.status}`);
  }
}
