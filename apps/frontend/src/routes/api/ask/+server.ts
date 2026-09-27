import { FAQ_QUESTION_MAX_LENGTH } from '$lib/landing/data/faq.data';
import { askFaqAssistant } from '$lib/landing/faq-assistant.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({
  request,
  platform,
  getClientAddress,
}) => {
  const question = await readQuestion(request);

  if (!question) {
    return json(
      {
        message: `Ask a question of up to ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  if (!platform) {
    return json({ message: 'Answers are unavailable.' }, { status: 503 });
  }

  const { success } = await platform.env.FAQ_ASK_LIMITER.limit({
    key: getClientAddress(),
  });

  if (!success) {
    return json({ message: 'Too many questions.' }, { status: 429 });
  }

  try {
    const answer = await askFaqAssistant(platform.env.AI, question);

    if (!answer) {
      return json({ message: 'No answer was generated.' }, { status: 502 });
    }

    return json({ answer });
  } catch (error) {
    console.error('FAQ assistant failed', error);

    return json({ message: 'Answers are unavailable.' }, { status: 503 });
  }
};

async function readQuestion(request: Request): Promise<string | null> {
  try {
    const { question } = (await request.json()) as { question?: unknown };

    if (typeof question !== 'string') return null;

    const trimmed = question.trim();

    return trimmed && trimmed.length <= FAQ_QUESTION_MAX_LENGTH
      ? trimmed
      : null;
  } catch {
    return null;
  }
}
