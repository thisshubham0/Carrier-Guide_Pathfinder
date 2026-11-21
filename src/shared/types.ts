export type RegionCode = 'global' | 'in' | 'us';
export type LanguageCode = 'en' | 'hi';
export type RiasecLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export type CareerSector =
  | 'Technology'
  | 'Healthcare'
  | 'Skilled Trades'
  | 'Creative & Media'
  | 'Public Service & Education'
  | 'Business & Finance'
  | 'Agriculture & Food'
  | 'Green Jobs & Energy';

export type BudgetConstraint = 'free_only' | 'low_budget' | 'moderate' | 'flexible';
export type TimeConstraint = 'under_6m' | '6m_to_2y' | '2y_to_4y' | 'flexible';
export type EducationLevel =
  | 'high_school_early'
  | 'high_school_senior'
  | 'diploma_vocational'
  | 'undergraduate'
  | 'graduate_or_switcher';

export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  cost: 'Free' | 'Free audit / Financial aid' | 'Low-cost';
  duration: string;
  skills_covered: string[];
  format: 'Course' | 'Interactive' | 'Guide' | 'Certification' | 'Apprenticeship Portal';
  source: string;
  last_verified: string;
}

export interface CareerSkillRequirement {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced';
  resource_ids: string[];
}

export interface EducationRoute {
  title: string;
  type: 'vocational' | 'apprenticeship' | 'online' | 'degree';
  cost_tier: 'free' | 'low' | 'moderate' | 'high';
  duration: string;
  summary: string;
  exams: Record<RegionCode, string[]>;
  scholarships: Record<RegionCode, string[]>;
}

export interface LocalizedSalary {
  currency: string;
  entry_min: number;
  entry_max: number;
  period: 'year';
  formatted: string;
}

export interface Career {
  id: string;
  title: string;
  sector: CareerSector;
  description: string;
  day_in_the_life: string;
  riasec: RiasecScores;
  required_skills: CareerSkillRequirement[];
  education_routes: EducationRoute[];
  salary_by_region: Record<RegionCode, LocalizedSalary>;
  growth_outlook: {
    label: 'Fast growing' | 'Steady growth' | 'Moderate growth';
    demand: 'High' | 'Medium' | 'Steady';
    note: string;
  };
  fastest_entry_months: number;
  has_free_or_low_cost_route: boolean;
  related_careers: string[];
  free_resource_ids: string[];
  roadmap_milestones: {
    days_30: string[];
    months_6: string[];
    years_2: string[];
  };
  starter_project: string;
  entry_certification: string;
  source: string;
  last_verified: string;
}

export interface StudentProfile {
  id: string;
  display_name: string;
  age_band: '14-17' | '18-21' | '22-25';
  under18_guardian_ack: boolean;
  region: RegionCode;
  language: LanguageCode;
  education_level: EducationLevel;
  stream_or_major: string;
  favorite_subjects: string[];
  interests: string[];
  current_skills: string[];
  strengths: string[];
  budget: BudgetConstraint;
  time_horizon: TimeConstraint;
  location_preference: 'local_or_remote' | 'willing_to_relocate' | 'hands_on_local';
  family_expectations: string;
  /** Optional non-scored note; never used for demographic stereotyping */
  free_notes?: string;
}

export interface QuizAnswers {
  [questionId: string]: number; // 1 to 5
}

export interface SkillGapItem {
  skill: string;
  priority: 'now' | 'next' | 'later';
  resource_ids: string[];
}

export interface FitBreakdown {
  interest_score: number;
  skill_score: number;
  constraint_score: number;
  total_score: number;
}

export interface RecommendationMatch {
  career_id: string;
  fit_score: number;
  reasons: string[];
  risks_or_tradeoffs: string[];
  skill_gaps: SkillGapItem[];
  next_step: string;
  breakdown?: FitBreakdown;
}

export interface RecommendationPayload {
  matches: RecommendationMatch[];
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
  engine_mode?: 'hybrid_llm' | 'deterministic_fallback';
}

export interface RoadmapStep {
  id: string;
  phase: 'days_30' | 'months_6' | 'years_2';
  title: string;
  detail: string;
  category: 'Learn' | 'Build' | 'Credential' | 'Milestone';
  resource_ids: string[];
}

export interface PersonalizedRoadmap {
  career_id: string;
  career_title: string;
  region: RegionCode;
  summary: string;
  steps: RoadmapStep[];
  counsellor_note: string;
  source: string;
  last_verified: string;
}

export interface ProgressState {
  completed_step_ids: string[];
  streak_days: number;
  last_activity_date: string | null;
  reminder_frequency: 'off' | 'daily' | 'weekly';
  helpfulness_rating: 'yes' | 'somewhat' | 'no' | null;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  is_crisis?: boolean;
  next_step?: string;
  sources_used?: string[];
}

export interface ShareSnapshotPayload {
  created_at: string;
  region: RegionCode;
  student_first_name: string;
  age_band: string;
  education_level: string;
  budget: BudgetConstraint;
  top_riasec: RiasecLetter[];
  riasec_scores: RiasecScores;
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
  top_matches: Array<{
    career_id: string;
    title: string;
    sector: string;
    fit_score: number;
    salary_formatted: string;
    demand: string;
    reasons: string[];
    risks_or_tradeoffs: string[];
    next_step: string;
    affordable_route: string;
    source: string;
    last_verified: string;
  }>;
  focused_career_roadmap?: {
    career_title: string;
    days_30_steps: string[];
    completed_count: number;
    total_count: number;
  };
}
