import { expect, test } from '@playwright/test';
import {
  visitorSessions,
  type WebAnalyticsVisitorEvent,
} from './web-analytics';

function event(time: string, sessionId: string): WebAnalyticsVisitorEvent {
  return {
    time,
    name: 'pageview',
    path: '/',
    hostname: '',
    app: '',
    sessionId,
    source: 'Direct',
  };
}

test('a session that overlaps another one on a second device stays one group', () => {
  const phone = [event('17:43', 'phone'), event('17:38', 'phone')];
  const laptop = event('17:40', 'laptop');
  const sessions = visitorSessions([phone[0], laptop, phone[1]]);
  expect(sessions).toEqual([
    { id: 'phone', events: phone },
    { id: 'laptop', events: [laptop] },
  ]);
});
