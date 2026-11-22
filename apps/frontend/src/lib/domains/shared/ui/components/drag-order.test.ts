import { expect, test } from '@playwright/test';
import { dropOrder, slotLefts } from './drag-order';

const order = ['traffic', 'malini', 'grip', 'tony'];

test('slots sit one after another with the gap between them', () => {
  expect(slotLefts([50, 40, 60], 2, 2)).toEqual([2, 54, 96, 158]);
  expect(slotLefts([], 2, 2)).toEqual([2]);
});

test('a dragged option takes the slot nearest to where it is', () => {
  const lefts = slotLefts([50, 40, 60], 2, 2);
  expect(dropOrder(order, 'traffic', lefts, 2)).toEqual(order);
  expect(dropOrder(order, 'traffic', lefts, 27)).toEqual(order);
  expect(dropOrder(order, 'traffic', lefts, 29)).toEqual([
    'malini',
    'traffic',
    'grip',
    'tony',
  ]);
  expect(dropOrder(order, 'traffic', lefts, 500)).toEqual([
    'malini',
    'grip',
    'tony',
    'traffic',
  ]);
});

test('an option dragged left moves before the ones it passes', () => {
  const lefts = slotLefts([70, 50, 40], 2, 2);
  expect(dropOrder(order, 'tony', lefts, -40)).toEqual([
    'tony',
    'traffic',
    'malini',
    'grip',
  ]);
  expect(dropOrder(order, 'tony', lefts, 60)).toEqual([
    'traffic',
    'tony',
    'malini',
    'grip',
  ]);
});
