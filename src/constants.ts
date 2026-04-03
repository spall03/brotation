import { InteractionType, Stage } from './types';

export const POINTS: Record<InteractionType, number> = {
  quick_touch: 1,
  real_conversation: 5,
  intentional_hangout: 15,
};

export const STAGE_THRESHOLDS: Record<Stage, number> = {
  acquaintance: 0,
  building: 25,
  bro: 150,
};

export const STAGE_ORDER: Stage[] = ['acquaintance', 'building', 'bro'];

export const QUARTERLY_DEFAULTS: Record<Stage, number> = {
  acquaintance: 1,
  building: 2,
  bro: 3,
};

export const ACTIVE_CAP = 5;

// Surface hierarchy from Stitch "Brotherhood Framework" design system
export const COLORS = {
  surface: '#131313',
  surfaceContainerLowest: '#0E0E0E',
  surfaceContainerLow: '#1C1B1B',
  surfaceContainer: '#201F1F',
  surfaceContainerHigh: '#2A2A2A',
  surfaceContainerHighest: '#353534',
  surfaceBright: '#393939',
  text: '#E5E2E1',           // on-surface
  textSecondary: '#E0C0B1',  // on-surface-variant
  textMuted: '#A78B7D',      // outline
  textDim: '#584237',        // outline-variant
  accent: '#F97316',         // primary-container
  accentLight: '#FFB690',    // primary
  green: '#22C55E',
  greenDim: 'rgba(34, 197, 94, 0.15)',
  blue: '#3B82F6',
  blueDim: 'rgba(59, 130, 246, 0.15)',
  gold: '#FFDB3C',           // secondary-container
  goldDim: 'rgba(255, 219, 60, 0.15)',
  tertiary: '#E5812C',       // tertiary-container (used for Bro badge bg)
};

export const STAGE_COLORS: Record<Stage, { color: string; bg: string; badgeBg?: string }> = {
  acquaintance: { color: COLORS.green, bg: COLORS.greenDim },
  building: { color: COLORS.blue, bg: COLORS.blueDim },
  bro: { color: COLORS.gold, bg: COLORS.goldDim, badgeBg: COLORS.tertiary },
};

// Achievement glow shadow for Bro-status cards
export const BRO_GLOW = {
  shadowColor: COLORS.gold,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 15,
};
