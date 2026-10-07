import { expect, test } from '@playwright/test';
import { MAX_FEEDBACK_LENGTH, parseFeedback } from './feedback';

test('accepts a trimmed message with a whole rating from 1 to 5', () => {
  expect(parseFeedback({ message: '  more charts  ', rating: 4 })).toEqual({
    message: 'more charts',
    rating: 4,
  });
});

test('rejects empty, oversized or malformed feedback', () => {
  expect(parseFeedback(null)).toBeNull();
  expect(parseFeedback({ message: '   ', rating: 5 })).toBeNull();
  expect(
    parseFeedback({ message: 'a'.repeat(MAX_FEEDBACK_LENGTH + 1), rating: 5 }),
  ).toBeNull();
  expect(parseFeedback({ message: 'ok', rating: 0 })).toBeNull();
  expect(parseFeedback({ message: 'ok', rating: 4.5 })).toBeNull();
  expect(parseFeedback({ message: 'ok', rating: '5' })).toBeNull();
});
