export type Feedback = {
  message: string;
  rating: number;
};

export const MAX_FEEDBACK_LENGTH = 2000;

export function parseFeedback(value: unknown): Feedback | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { message, rating } = value as Record<string, unknown>;

  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > MAX_FEEDBACK_LENGTH ||
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return null;
  }

  return { message: message.trim(), rating };
}
