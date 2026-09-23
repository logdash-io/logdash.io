import type { StageLighting } from './stage-light';

export type StagePreset =
  | 'hero'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left';

export const STAGE_LIGHTING: Record<StagePreset, StageLighting> = {
  hero: {
    spot: [0.5, 1],
    spread: [0.56, 0.7],
    floorFrom: [0.5, 0.08],
    floorTo: [0.5, 1],
    fadeTop: true,
  },
  bottom: {
    spot: [0.5, 1],
    spread: [0.6, 0.9],
    floorFrom: [0.5, 0],
    floorTo: [0.5, 1],
    fadeTop: false,
  },
  'bottom-left': {
    spot: [0, 1],
    spread: [1.1, 1.3],
    floorFrom: [1, 0],
    floorTo: [0, 1],
    fadeTop: false,
  },
  'bottom-right': {
    spot: [1, 1],
    spread: [1.1, 1.3],
    floorFrom: [0, 0],
    floorTo: [1, 1],
    fadeTop: false,
  },
  'top-left': {
    spot: [0, 0],
    spread: [1.1, 1.3],
    floorFrom: [1, 1],
    floorTo: [0, 0],
    fadeTop: false,
  },
};

export const STAGE_FALLBACK: Record<
  StagePreset,
  { spot: string; floor: string }
> = {
  hero: { spot: '50% 100%', floor: '180deg' },
  bottom: { spot: '50% 100%', floor: '180deg' },
  'bottom-left': { spot: '0% 100%', floor: '225deg' },
  'bottom-right': { spot: '100% 100%', floor: '135deg' },
  'top-left': { spot: '0% 0%', floor: '315deg' },
};
