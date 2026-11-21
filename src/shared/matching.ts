import type {
  BudgetConstraint,
  Career,
  FitBreakdown,
  LearningResource,
  PersonalizedRoadmap,
  QuizAnswers,
  RecommendationMatch,
  RecommendationPayload,
  RegionCode,
  RiasecScores,
  RoadmapStep,
  SkillGapItem,
  StudentProfile,
  TimeConstraint,
} from './types.ts';
import { computeRiasecScores, RIASEC_LETTERS, RIASEC_META } from './riasec.ts';

function normalizeSkill(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
}

/**
 * Computes cosine similarity between two 6-dimensional RIASEC vectors, mapped to 0..100.
 */
export function computeRiasecCosineSimilarity(a: RiasecScores, b: RiasecScores): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const letter of RIASEC_LETTERS) {
    const va = Math.max(0, a[letter]);
    const vb = Math.max(0, b[letter]);
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 50;
  const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.round(Math.max(0, Math.min(1, cosine)) * 100);
}

/**
 * Checks whether a student's skill list covers a required career skill (exact or substring token match).
 */
export function studentHasSkill(studentSkills: string[], requiredSkill: string): boolean {
  const reqNorm = normalizeSkill(requiredSkill);
  const reqTokens = reqNorm.split(' ').filter((w) => w.length > 2);
  for (const raw of studentSkills) {
    const sNorm = normalizeSkill(raw);
    if (!sNorm) continue;
    if (sNorm === reqNorm || sNorm.includes(reqNorm) || reqNorm.includes(sNorm)) {
      return true;
    }
    if (reqTokens.length > 0 && reqTokens.every((t) => sNorm.includes(t))) {
      return true;
    }
  }
  return false;
}

/**
 * Computes prioritized skill gaps (now = basic missing, next = intermediate missing, later = advanced missing)
 * and skill overlap score (0..100).
 */
export function analyzeSkillGaps(
  profile: StudentProfile,
  career: Career
): { skillScore: number; matchedSkills: string[]; gaps: SkillGapItem[] } {
  const combinedStudentSkills = [
    ...profile.current_skills,
    ...profile.favorite_subjects,
    ...profile.strengths,
  ];
  const matchedSkills: string[] = [];
  const gaps: SkillGapItem[] = [];

  for (const req of career.required_skills) {
    if (studentHasSkill(combinedStudentSkills, req.name)) {
      matchedSkills.push(req.name);
    } else {
      const priority: 'now' | 'next' | 'later' =
        req.level === 'basic' ? 'now' : req.level === 'intermediate' ? 'next' : 'later';
      gaps.push({
        skill: req.name,
        priority,
        resource_ids: req.resource_ids,
      });
    }
  }

  // Ensure even beginners get a sensible baseline score (never 0 just for being a 15-year-old student)
  const ratio =
    career.required_skills.length > 0 ? matchedSkills.length / career.required_skills.length : 0;
  const skillScore = Math.round(35 + ratio * 65);
  return { skillScore, matchedSkills, gaps };
}

/**
 * Constraint scoring (budget, time horizon, education alignment, location preference).
 * Strictly NEVER reads gender, caste, religion, name, or region for scoring so recommendations stay unbiased.
 */
export function scoreConstraints(profile: StudentProfile, career: Career): number {
  let score = 80;

  // Budget fit: tight budgets strongly favor careers with verified free/low-cost routes
  const isTightBudget: boolean =
    profile.budget === 'free_only' || profile.budget === 'low_budget';
  if (isTightBudget) {
    if (career.has_free_or_low_cost_route) {
      score += 15;
    } else {
      score -= 35;
    }
  } else if (profile.budget === 'moderate') {
    score += career.has_free_or_low_cost_route ? 10 : 0;
  } else {
    score += 10;
  }

  // Time horizon fit
  const maxMonthsByHorizon: Record<TimeConstraint, number> = {
    under_6m: 9,
    '6m_to_2y': 24,
    '2y_to_4y': 48,
    flexible: 72,
  };
  const targetMax = maxMonthsByHorizon[profile.time_horizon] ?? 48;
  if (career.fastest_entry_months <= targetMax) {
    score += 10;
  } else if (career.fastest_entry_months <= targetMax + 12) {
    score -= 5;
  } else {
    score -= 22;
  }

  // Location / work-style alignment
  if (profile.location_preference === 'hands_on_local' && career.riasec.R >= 65) {
    score += 6;
  }
  if (
    profile.location_preference === 'local_or_remote' &&
    (career.sector === 'Technology' ||
      career.sector === 'Creative & Media' ||
      career.sector === 'Business & Finance')
  ) {
    score += 5;
  }

  return Math.max(20, Math.min(100, Math.round(score)));
}

/**
 * Explicit alignment (0..100) from user-stated interests, favorite subjects, and stream/major
 * matching sector, title, description, or required skills.
 */
function computeExplicitInterestScore(profile: StudentProfile, career: Career): number {
  const interestPhrases = [...profile.interests, ...profile.favorite_subjects, profile.stream_or_major]
    .filter((s) => Boolean(s) && s !== 'Undecided')
    .map((s) => normalizeSkill(s))
    .filter(Boolean);
  if (interestPhrases.length === 0) return 55;

  const sectorHaystack = normalizeSkill(`${career.sector} ${career.title}`);
  const fullHaystack = normalizeSkill(
    `${career.title} ${career.sector} ${career.description} ${career.required_skills.map((s) => s.name).join(' ')}`
  );

  let points = 35;
  for (const phrase of interestPhrases) {
    const tokens = phrase.split(' ').filter((w) => w.length >= 3 && w !== 'and' && w !== 'the');
    if (tokens.some((t) => sectorHaystack.includes(t))) {
      points += 24;
    } else if (tokens.some((t) => fullHaystack.includes(t))) {
      points += 12;
    }
  }
  return Math.min(100, points);
}

export function getAffordableRoutes(career: Career, budget: BudgetConstraint) {
  const routes = [...career.education_routes];
  const costRank: Record<string, number> = { free: 0, low: 1, moderate: 2, high: 3 };
  if (budget === 'free_only' || budget === 'low_budget') {
    routes.sort((a, b) => (costRank[a.cost_tier] ?? 2) - (costRank[b.cost_tier] ?? 2));
  }
  return routes;
}

export function computeConfidenceAndAssumptions(
  profile: StudentProfile,
  answeredCount: number,
  totalQuestions: number
): { confidence: 'low' | 'medium' | 'high'; assumptions: string[] } {
  const ratio = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  const assumptions: string[] = [];

  if (ratio < 0.45) {
    assumptions.push(
      `Only ${answeredCount} of ${totalQuestions} interest quiz questions were answered, so unanswered areas defaulted to neutral.`
    );
  }
  if (profile.current_skills.length === 0) {
    assumptions.push(
      'No current skills were selected, so foundational skills are prioritized first in your skill gap list.'
    );
  }
  if (profile.budget === 'free_only' || profile.budget === 'low_budget') {
    assumptions.push(
      'Prioritized careers and entry pathways with free, scholarship-backed, vocational, or apprenticeship options.'
    );
  }
  if (!profile.stream_or_major || profile.stream_or_major === 'Undecided') {
    assumptions.push('Kept recommendations open across sectors since no fixed major was specified.');
  }
  if (assumptions.length === 0) {
    assumptions.push(
      'Matches combine your RIASEC interest profile, current skills, and stated budget and time preferences.'
    );
  }

  let confidence: 'low' | 'medium' | 'high' = 'high';
  if (ratio < 0.45) {
    confidence = 'low';
  } else if (ratio < 0.8 || profile.current_skills.length === 0) {
    confidence = 'medium';
  }

  return { confidence, assumptions };
}

/**
 * Deterministic hybrid ranker: scores all careers in the dataset and returns
 * the top `limit` (default 6, range 5–8) in exact RecommendationPayload format.
 * Always works without an LLM call and serves as the grounded shortlist input to Gemini.
 */
export function buildDeterministicRecommendations(
  profile: StudentProfile,
  quizAnswers: QuizAnswers,
  careers: Career[],
  limit = 6
): {
  payload: RecommendationPayload;
  riasec: RiasecScores;
  topCodes: ('R' | 'I' | 'A' | 'S' | 'E' | 'C')[];
  rankedCareers: Array<{ career: Career; breakdown: FitBreakdown; matchedSkills: string[]; gaps: SkillGapItem[] }>;
} {
  const { scores: riasec, topCodes, answeredCount } = computeRiasecScores(quizAnswers);
  const { confidence, assumptions } = computeConfidenceAndAssumptions(profile, answeredCount, 24);

  const scored = careers.map((career) => {
    const riasecSim = computeRiasecCosineSimilarity(riasec, career.riasec);
    const explicitInterest = computeExplicitInterestScore(profile, career);
    const interestScore = Math.round(riasecSim * 0.72 + explicitInterest * 0.28);
    const { skillScore, matchedSkills, gaps } = analyzeSkillGaps(profile, career);
    const constraintScore = scoreConstraints(profile, career);

    // Weighted blend: 52% interest alignment, 23% skill readiness, 25% budget/time constraints
    const totalScore = Math.round(
      interestScore * 0.52 + skillScore * 0.23 + constraintScore * 0.25
    );

    return {
      career,
      breakdown: {
        interest_score: interestScore,
        skill_score: skillScore,
        constraint_score: constraintScore,
        total_score: Math.max(15, Math.min(99, totalScore)),
      },
      matchedSkills,
      gaps,
    };
  });

  scored.sort((a, b) => b.breakdown.total_score - a.breakdown.total_score);
  const top = scored.slice(0, Math.max(5, Math.min(8, limit)));

  const topTraitNames = topCodes.slice(0, 2).map((c) => RIASEC_META[c].short.toLowerCase());
  const isTightBudget = profile.budget === 'free_only' || profile.budget === 'low_budget';

  const matches: RecommendationMatch[] = top.map((item) => {
    const { career, breakdown, matchedSkills, gaps } = item;
    const sortedRoutes = getAffordableRoutes(career, profile.budget);
    const affordableRoute = sortedRoutes[0];
    const reasons: string[] = [
      `Aligns with your ${topTraitNames.join(' and ')} strengths (${breakdown.interest_score}% interest match).`,
    ];

    if (matchedSkills.length > 0) {
      reasons.push(
        `You already have a head start with ${matchedSkills.slice(0, 2).join(' and ')}.`
      );
    } else {
      reasons.push(
        `Beginner-friendly entry path: you can build the basics step by step in ${career.fastest_entry_months} months.`
      );
    }

    if (isTightBudget && affordableRoute) {
      reasons.push(
        `Offers a lower-cost route: ${affordableRoute.title} (${affordableRoute.duration}).`
      );
    } else {
      reasons.push(`Demand outlook: ${career.growth_outlook.label} (${career.growth_outlook.note}).`);
    }

    const risks_or_tradeoffs: string[] = [
      `Typical entry takes around ${career.fastest_entry_months} months of steady practice or training before your first paid role.`,
    ];
    if (isTightBudget && !career.has_free_or_low_cost_route) {
      risks_or_tradeoffs.push(
        'Usually requires formal paid licensing or a degree; look closely at scholarships or related assistant roles first.'
      );
    } else {
      risks_or_tradeoffs.push(
        'Starting pay varies widely by city, employer, and portfolio quality—this path often leads to steady growth rather than instant high pay.'
      );
    }

    const firstGap = gaps[0];
    const next_step = firstGap
      ? `Spend 30 minutes this week starting "${firstGap.skill}" using the linked free guide, then try the starter project.`
      : `Build the starter project (${career.starter_project}) and ask a teacher or working professional for feedback.`;

    return {
      career_id: career.id,
      fit_score: breakdown.total_score,
      reasons,
      risks_or_tradeoffs,
      skill_gaps: gaps,
      next_step,
      breakdown,
    };
  });

  return {
    payload: {
      matches,
      confidence,
      assumptions,
      engine_mode: 'deterministic_fallback',
    },
    riasec,
    topCodes,
    rankedCareers: top,
  };
}

/**
 * Deterministic 30-day / 6-month / 2-year roadmap generator grounded strictly in the career
 * and resource datasets. Used both offline and as fallback when LLM is unavailable.
 */
export function buildDeterministicRoadmap(
  profile: StudentProfile,
  career: Career,
  resourcesById: Map<string, LearningResource>
): PersonalizedRoadmap {
  const { gaps } = analyzeSkillGaps(profile, career);
  const nowGaps = gaps.filter((g) => g.priority === 'now');
  const nextGaps = gaps.filter((g) => g.priority === 'next');
  const laterGaps = gaps.filter((g) => g.priority === 'later');

  const validRes = (ids: string[]) => ids.filter((id) => resourcesById.has(id));
  const fallbackRes = validRes(career.free_resource_ids).slice(0, 2);

  const steps: RoadmapStep[] = [];

  // Phase 1: 30 Days
  const firstNow = nowGaps[0];
  steps.push({
    id: `${career.id}_30d_1`,
    phase: 'days_30',
    title: firstNow ? `Learn the core basics: ${firstNow.skill}` : `Review core foundations for ${career.title}`,
    detail: career.roadmap_milestones.days_30[0] || `Complete an introductory free module and take short notes in your own words.`,
    category: 'Learn',
    resource_ids: firstNow && validRes(firstNow.resource_ids).length > 0 ? validRes(firstNow.resource_ids) : fallbackRes,
  });
  steps.push({
    id: `${career.id}_30d_2`,
    phase: 'days_30',
    title: 'Complete a small starter project',
    detail: career.starter_project,
    category: 'Build',
    resource_ids: fallbackRes,
  });
  steps.push({
    id: `${career.id}_30d_3`,
    phase: 'days_30',
    title: 'Talk to one person or explore local routes',
    detail:
      career.roadmap_milestones.days_30[1] ||
      'Compare traditional college routes with free/low-cost vocational or apprenticeship options in your area.',
    category: 'Milestone',
    resource_ids: [],
  });

  // Phase 2: 6 Months
  const firstNext = nextGaps[0];
  steps.push({
    id: `${career.id}_6m_1`,
    phase: 'months_6',
    title: firstNext ? `Build intermediate skill: ${firstNext.skill}` : 'Deepen practical job-ready skills',
    detail: career.roadmap_milestones.months_6[0] || 'Finish a structured intermediate course and practice weekly on realistic tasks.',
    category: 'Learn',
    resource_ids: firstNext && validRes(firstNext.resource_ids).length > 0 ? validRes(firstNext.resource_ids) : fallbackRes,
  });
  steps.push({
    id: `${career.id}_6m_2`,
    phase: 'months_6',
    title: `Earn an entry credential: ${career.entry_certification}`,
    detail: career.roadmap_milestones.months_6[1] || 'Use free audit, scholarship, or government vocational exam options if budget is tight.',
    category: 'Credential',
    resource_ids: fallbackRes,
  });
  steps.push({
    id: `${career.id}_6m_3`,
    phase: 'months_6',
    title: 'Assemble 2–3 proof-of-work samples',
    detail: 'Document what you built or practiced so employers, teachers, or apprenticeship mentors can see your real ability.',
    category: 'Build',
    resource_ids: [],
  });

  // Phase 3: 2 Years
  const firstLater = laterGaps[0];
  steps.push({
    id: `${career.id}_2y_1`,
    phase: 'years_2',
    title: firstLater ? `Grow into advanced skill: ${firstLater.skill}` : 'Specialize through real-world experience',
    detail: career.roadmap_milestones.years_2[0] || 'Apply for entry-level roles, paid apprenticeships, or supervised internships.',
    category: 'Milestone',
    resource_ids: firstLater && validRes(firstLater.resource_ids).length > 0 ? validRes(firstLater.resource_ids) : [],
  });
  steps.push({
    id: `${career.id}_2y_2`,
    phase: 'years_2',
    title: 'Prepare for your next step and review progress',
    detail:
      career.roadmap_milestones.years_2[1] ||
      `Re-check salary ranges, licensing renewals, or related paths like ${career.related_careers.slice(0, 2).join(' or ')}.`,
    category: 'Milestone',
    resource_ids: [],
  });

  const affordableFirst = getAffordableRoutes(career, profile.budget)[0];
  const budgetNote =
    profile.budget === 'free_only' || profile.budget === 'low_budget'
      ? `Tailored for a tight budget: starts with free resources and highlights "${affordableFirst?.title ?? 'low-cost entry routes'}".`
      : `Balances free starter learning with "${affordableFirst?.title ?? 'recognized training pathways'}".`;

  return {
    career_id: career.id,
    career_title: career.title,
    region: profile.region as RegionCode,
    summary: `${budgetNote} This roadmap gives realistic steps, not guarantees—adjust the pace to fit your school or family schedule.`,
    steps,
    counsellor_note:
      'Before paying tuition, taking a major entrance exam, or signing an apprenticeship contract, review this plan with a school counsellor, teacher, or trusted family member.',
    source: career.source,
    last_verified: career.last_verified,
  };
}
