import type {
  Career,
  LearningResource,
  MentorMessage,
  ProgressState,
  QuizAnswers,
  RecommendationPayload,
  RegionCode,
  StudentProfile,
} from '../shared/types.ts';
import { RIASEC_QUESTIONS } from '../shared/riasec.ts';

const STORAGE_KEY = 'pathfinder_local_state_v1';
const CATALOG_CACHE_KEY = 'pathfinder_catalog_cache_v1';

export interface PersistedAppState {
  profile: StudentProfile;
  quizAnswers: QuizAnswers;
  onboardingComplete: boolean;
  quizComplete: boolean;
  recommendations: RecommendationPayload | null;
  selectedCareerId: string | null;
  compareIds: string[];
  progress: ProgressState;
  mentorHistory: MentorMessage[];
  lastVisitDate: string | null;
}

export function createDefaultProfile(region: RegionCode = 'global'): StudentProfile {
  return {
    id: `anon_${Math.random().toString(36).slice(2, 10)}`,
    display_name: '',
    age_band: '18-21',
    under18_guardian_ack: false,
    region,
    language: 'en',
    education_level: 'high_school_senior',
    stream_or_major: 'Undecided',
    favorite_subjects: [],
    interests: [],
    current_skills: [],
    strengths: [],
    budget: 'low_budget',
    time_horizon: '6m_to_2y',
    location_preference: 'local_or_remote',
    family_expectations: '',
    free_notes: '',
  };
}

export function createEmptyState(region: RegionCode = 'global'): PersistedAppState {
  return {
    profile: createDefaultProfile(region),
    quizAnswers: {},
    onboardingComplete: false,
    quizComplete: false,
    recommendations: null,
    selectedCareerId: null,
    compareIds: [],
    progress: {
      completed_step_ids: [],
      streak_days: 0,
      last_activity_date: null,
      reminder_frequency: 'weekly',
      helpfulness_rating: null,
    },
    mentorHistory: [],
    lastVisitDate: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Deterministic demo profile activated ONLY via ?autostart=1 for rapid testing/evaluation.
 */
export function createDemoAutostartState(region: RegionCode = 'in'): PersistedAppState {
  const answers: QuizAnswers = {};
  for (const q of RIASEC_QUESTIONS) {
    if (q.dimension === 'I') answers[q.id] = 5;
    else if (q.dimension === 'R') answers[q.id] = 4;
    else if (q.dimension === 'C') answers[q.id] = 4;
    else if (q.dimension === 'A') answers[q.id] = 3;
    else if (q.dimension === 'S') answers[q.id] = 3;
    else answers[q.id] = 2;
  }

  return {
    profile: {
      id: 'demo_student_01',
      display_name: 'Asha',
      age_band: '18-21',
      under18_guardian_ack: true,
      region,
      language: 'en',
      education_level: 'diploma_vocational',
      stream_or_major: 'Science & Computers',
      favorite_subjects: ['Mathematics', 'Computer Science', 'Physics'],
      interests: ['Technology', 'Clean Energy', 'Problem Solving'],
      current_skills: ['Spreadsheets', 'HTML & CSS'],
      strengths: ['Analytical thinking', 'Troubleshooting'],
      budget: 'free_only',
      time_horizon: '6m_to_2y',
      location_preference: 'local_or_remote',
      family_expectations: 'Stable job within 1 year without taking a student loan.',
      free_notes: '',
    },
    quizAnswers: answers,
    onboardingComplete: true,
    quizComplete: true,
    recommendations: null,
    selectedCareerId: null,
    compareIds: [],
    progress: {
      completed_step_ids: [],
      streak_days: 1,
      last_activity_date: new Date().toISOString().slice(0, 10),
      reminder_frequency: 'weekly',
      helpfulness_rating: null,
    },
    mentorHistory: [],
    lastVisitDate: new Date().toISOString().slice(0, 10),
  };
}

export function loadLocalState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAppState;
  } catch {
    return null;
  }
}

export function saveLocalState(state: PersistedAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearLocalState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function saveCatalogCache(careers: Career[], resources: LearningResource[]): void {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ careers, resources }));
  } catch {
    // Ignore
  }
}

export function loadCatalogCache(): { careers: Career[]; resources: LearningResource[] } | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { careers: Career[]; resources: LearningResource[] };
  } catch {
    return null;
  }
}

/**
 * Updates step completion and computes daily learning streak honestly.
 */
export function toggleStepInProgress(progress: ProgressState, stepId: string): ProgressState {
  const today = new Date().toISOString().slice(0, 10);
  const exists = progress.completed_step_ids.includes(stepId);
  const completed_step_ids = exists
    ? progress.completed_step_ids.filter((id) => id !== stepId)
    : [...progress.completed_step_ids, stepId];

  let streak_days = progress.streak_days;
  let last_activity_date = progress.last_activity_date;

  if (!exists) {
    if (!last_activity_date) {
      streak_days = 1;
    } else if (last_activity_date !== today) {
      const prev = new Date(last_activity_date).getTime();
      const curr = new Date(today).getTime();
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      streak_days = diffDays === 1 ? streak_days + 1 : 1;
    } else if (streak_days === 0) {
      streak_days = 1;
    }
    last_activity_date = today;
  }

  return {
    ...progress,
    completed_step_ids,
    streak_days,
    last_activity_date,
  };
}

/**
 * Fires PII-free success metrics to /api/metrics quietly without blocking UI.
 */
export function trackMetric(
  eventType:
    | 'onboarding_started'
    | 'onboarding_completed'
    | 'quiz_completed'
    | 'roadmap_generated'
    | 'roadmap_step_completed'
    | 'return_visit'
    | 'helpfulness_rated'
    | 'share_created',
  anonSessionId: string,
  meta: Record<string, string | number | boolean> = {}
): void {
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      anon_session_id: anonSessionId,
      meta,
    }),
  }).catch(() => {
    // Offline or blocked; skip silently
  });
}
