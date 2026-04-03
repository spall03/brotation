export type Stage = 'acquaintance' | 'building' | 'bro';

export type TargetStatus = 'active' | 'bench' | 'archive';

export type InteractionType = 'quick_touch' | 'real_conversation' | 'intentional_hangout';

export type ChallengeType = 'monthly_horizontal' | 'quarterly_vertical';

export interface Target {
  id: string;
  name: string;
  notes: string;
  phone?: string;
  email?: string;
  contactId?: string;
  stage: Stage;
  status: TargetStatus;
  totalPoints: number;
  createdAt: string; // ISO string for JSON serialization
}

export interface Interaction {
  id: string;
  targetId: string;
  type: InteractionType;
  points: number;
  note?: string;
  date: string; // ISO string
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  targetId?: string; // only for quarterly_vertical
  targetCount: number;
  periodStart: string; // ISO string
  periodEnd: string; // ISO string
}

export interface MonthlyResult {
  month: string; // "2026-03"
  target: number;
  actual: number;
  hit: boolean;
}
