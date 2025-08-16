// Types for custom frequency presets system

export interface RecurrencePattern {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // e.g., every 2 weeks, every 3 months
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  daysOfMonth?: number[]; // 1-31 for monthly patterns
  sessionsPerCycle?: number; // for custom patterns like "3x per month"
  customRule?: string; // human readable description
}

export interface FrequencyPreset {
  id: string;
  user_id: string;
  name: string;
  recurrence_pattern: RecurrencePattern;
  estimated_sessions_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFrequencyPresetData {
  name: string;
  recurrence_pattern: RecurrencePattern;
  estimated_sessions_per_month: number;
}

// Extended RecurrenceRule to include preset information
export interface RecurrenceRule {
  frequency: 'weekly' | 'biweekly' | 'custom';
  interval: number;
  daysOfWeek: number[];
  startDate: string;
  startTime: string;
  presetId?: string; // Reference to custom preset
  customPattern?: RecurrencePattern; // For custom frequencies
}