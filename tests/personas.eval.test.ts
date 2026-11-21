import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Career, LearningResource, QuizAnswers, RiasecLetter, StudentProfile } from '../src/shared/types.ts';
import { RIASEC_QUESTIONS } from '../src/shared/riasec.ts';
import { buildDeterministicRecommendations, getAffordableRoutes } from '../src/shared/matching.ts';
import { validateGroundedRecommendation } from '../src/shared/schema.ts';

const careers: Career[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'data/careers.json'), 'utf8')
);
const resources: LearningResource[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'data/resources.json'), 'utf8')
);
const careerMap = new Map(careers.map((c) => [c.id, c]));
const validCareerIds = new Set(careers.map((c) => c.id));
const validResourceIds = new Set(resources.map((r) => r.id));

function makeQuiz(weights: Record<RiasecLetter, number>): QuizAnswers {
  const out: QuizAnswers = {};
  for (const q of RIASEC_QUESTIONS) {
    out[q.id] = weights[q.dimension];
  }
  return out;
}

function makeProfile(overrides: Partial<StudentProfile>): StudentProfile {
  return {
    id: 'eval_persona',
    display_name: 'Student',
    age_band: '18-21',
    under18_guardian_ack: true,
    region: 'global',
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
    ...overrides,
  };
}

interface PersonaCase {
  name: string;
  profile: StudentProfile;
  quiz: QuizAnswers;
  expectAnySectorInTop3?: Career['sector'][];
  expectFreeOrLowCostTop3?: boolean;
  expectConfidence?: 'low' | 'medium' | 'high';
  expectMaxMonthsInTop3?: number;
}

const PERSONA_CASES: PersonaCase[] = [
  {
    name: 'Persona 1: Rural Class 10 student, zero budget, hands-on mechanical/electrical interest',
    profile: makeProfile({
      age_band: '14-17',
      region: 'in',
      education_level: 'high_school_early',
      favorite_subjects: ['Workshop / Practical Tech'],
      interests: ['Fixing & Building Machines', 'Solar, Climate & Green Energy'],
      budget: 'free_only',
      time_horizon: '6m_to_2y',
      location_preference: 'hands_on_local',
    }),
    quiz: makeQuiz({ R: 5, I: 3, A: 1, S: 2, E: 2, C: 3 }),
    expectAnySectorInTop3: ['Skilled Trades', 'Green Jobs & Energy'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 2: First-gen urban student, tight budget, analytical + structured',
    profile: makeProfile({
      region: 'in',
      education_level: 'undergraduate',
      stream_or_major: 'Computer Science / IT',
      favorite_subjects: ['Mathematics', 'Computer Science'],
      interests: ['Technology & Coding'],
      current_skills: ['Spreadsheets', 'HTML & CSS'],
      budget: 'free_only',
      time_horizon: '6m_to_2y',
    }),
    quiz: makeQuiz({ R: 2, I: 5, A: 2, S: 2, E: 2, C: 5 }),
    expectAnySectorInTop3: ['Technology'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 3: Empathetic helper interested in community health & nursing',
    profile: makeProfile({
      region: 'us',
      education_level: 'high_school_senior',
      favorite_subjects: ['Biology & Health'],
      interests: ['Healthcare & Helping People'],
      current_skills: ['Active Listening'],
      budget: 'low_budget',
      time_horizon: '6m_to_2y',
    }),
    quiz: makeQuiz({ R: 3, I: 3, A: 2, S: 5, E: 2, C: 3 }),
    expectAnySectorInTop3: ['Healthcare', 'Public Service & Education'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 4: Creative visual storyteller with zero budget for art college',
    profile: makeProfile({
      region: 'global',
      education_level: 'high_school_senior',
      favorite_subjects: ['Art & Design', 'English & Writing'],
      interests: ['Design, Video & Writing'],
      current_skills: ['Graphic Design'],
      budget: 'free_only',
      time_horizon: 'under_6m',
    }),
    quiz: makeQuiz({ R: 2, I: 3, A: 5, S: 3, E: 3, C: 2 }),
    expectAnySectorInTop3: ['Creative & Media', 'Technology'],
    expectFreeOrLowCostTop3: true,
    expectMaxMonthsInTop3: 9,
  },
  {
    name: 'Persona 5: Commerce & numbers student wanting stable office career',
    profile: makeProfile({
      region: 'in',
      education_level: 'undergraduate',
      stream_or_major: 'Commerce & Accounting',
      favorite_subjects: ['Economics & Accounts', 'Mathematics'],
      interests: ['Business, Finance & Organizing'],
      current_skills: ['Spreadsheets', 'Accounting Basics'],
      budget: 'low_budget',
      time_horizon: 'under_6m',
    }),
    quiz: makeQuiz({ R: 1, I: 3, A: 1, S: 2, E: 4, C: 5 }),
    expectAnySectorInTop3: ['Business & Finance'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 6: Farming-family diploma student interested in modern agriculture',
    profile: makeProfile({
      region: 'in',
      education_level: 'diploma_vocational',
      stream_or_major: 'Agriculture / Environment',
      favorite_subjects: ['Biology & Health', 'Geography & Environment'],
      interests: ['Agriculture, Food & Animals'],
      budget: 'low_budget',
      time_horizon: '6m_to_2y',
      location_preference: 'hands_on_local',
    }),
    quiz: makeQuiz({ R: 5, I: 4, A: 1, S: 3, E: 3, C: 4 }),
    expectAnySectorInTop3: ['Agriculture & Food', 'Green Jobs & Energy'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 7: Early career switcher (age 22-25) needing fast entry under 6 months',
    profile: makeProfile({
      age_band: '22-25',
      region: 'us',
      education_level: 'graduate_or_switcher',
      interests: ['Technology & Coding'],
      current_skills: ['IT Troubleshooting', 'Customer Support'],
      budget: 'free_only',
      time_horizon: 'under_6m',
    }),
    quiz: makeQuiz({ R: 4, I: 4, A: 1, S: 4, E: 2, C: 4 }),
    expectAnySectorInTop3: ['Technology'],
    expectMaxMonthsInTop3: 6,
  },
  {
    name: 'Persona 8: Climate & outdoor science student',
    profile: makeProfile({
      region: 'global',
      education_level: 'undergraduate',
      favorite_subjects: ['Geography & Environment', 'Physics & Chemistry'],
      interests: ['Solar, Climate & Green Energy'],
      budget: 'moderate',
      time_horizon: '6m_to_2y',
    }),
    quiz: makeQuiz({ R: 5, I: 5, A: 1, S: 3, E: 2, C: 4 }),
    expectAnySectorInTop3: ['Green Jobs & Energy', 'Agriculture & Food', 'Skilled Trades'],
  },
  {
    name: 'Persona 9: Future educator / community social advocate',
    profile: makeProfile({
      region: 'in',
      education_level: 'undergraduate',
      stream_or_major: 'Arts & Humanities',
      favorite_subjects: ['History & Civics', 'English & Writing'],
      interests: ['Teaching & Community Work'],
      current_skills: ['Active Listening', 'Clear Writing'],
      budget: 'low_budget',
      time_horizon: '2y_to_4y',
    }),
    quiz: makeQuiz({ R: 1, I: 3, A: 3, S: 5, E: 3, C: 3 }),
    expectAnySectorInTop3: ['Public Service & Education', 'Healthcare'],
  },
  {
    name: 'Persona 10: Enterprising small-town organizer wanting business operations',
    profile: makeProfile({
      region: 'global',
      education_level: 'diploma_vocational',
      interests: ['Business, Finance & Organizing'],
      current_skills: ['Customer Support'],
      budget: 'free_only',
      time_horizon: 'under_6m',
    }),
    quiz: makeQuiz({ R: 2, I: 2, A: 3, S: 4, E: 5, C: 4 }),
    expectAnySectorInTop3: ['Business & Finance'],
    expectFreeOrLowCostTop3: true,
  },
  {
    name: 'Persona 11: Student who skips 80% of quiz questions receives explicit low confidence',
    profile: makeProfile({
      age_band: '14-17',
      region: 'global',
      education_level: 'high_school_early',
      stream_or_major: 'Undecided',
      budget: 'low_budget',
    }),
    quiz: { r1: 4, i1: 4, a1: 3 }, // Only 3 of 24 answered
    expectConfidence: 'low',
  },
  {
    name: 'Persona 12: Precision craft & CAD drawing student',
    profile: makeProfile({
      region: 'us',
      education_level: 'diploma_vocational',
      favorite_subjects: ['Mathematics', 'Art & Design', 'Workshop / Practical Tech'],
      interests: ['Fixing & Building Machines', 'Design, Video & Writing'],
      budget: 'low_budget',
      time_horizon: '6m_to_2y',
    }),
    quiz: makeQuiz({ R: 5, I: 4, A: 4, S: 1, E: 1, C: 5 }),
    expectAnySectorInTop3: ['Skilled Trades', 'Creative & Media'],
  },
];

for (const persona of PERSONA_CASES) {
  test(`persona evaluation: ${persona.name}`, () => {
    const result = buildDeterministicRecommendations(persona.profile, persona.quiz, careers, 6);
    const schemaCheck = validateGroundedRecommendation(
      result.payload,
      validCareerIds,
      validResourceIds
    );
    assert.equal(schemaCheck.ok, true, `Schema failed for ${persona.name}`);
    assert.ok(result.payload.matches.length >= 5 && result.payload.matches.length <= 8);

    const top3Careers = result.payload.matches
      .slice(0, 3)
      .map((m) => careerMap.get(m.career_id)!);

    if (persona.expectAnySectorInTop3) {
      const hit = top3Careers.some((c) => persona.expectAnySectorInTop3!.includes(c.sector));
      assert.equal(
        hit,
        true,
        `Expected one of [${persona.expectAnySectorInTop3.join(', ')}] in top 3 for ${persona.name}, got [${top3Careers.map((c) => `${c.title} (${c.sector})`).join(', ')}]`
      );
    }

    if (persona.expectFreeOrLowCostTop3) {
      for (const c of top3Careers) {
        assert.equal(
          c.has_free_or_low_cost_route,
          true,
          `Tight budget persona got career without free/low-cost route: ${c.id}`
        );
        const firstRoute = getAffordableRoutes(c, persona.profile.budget)[0];
        assert.ok(
          firstRoute.cost_tier === 'free' || firstRoute.cost_tier === 'low',
          `Expected free/low route ordered first for ${c.id}, got ${firstRoute.cost_tier}`
        );
      }
    }

    if (persona.expectConfidence) {
      assert.equal(result.payload.confidence, persona.expectConfidence);
    }

    if (persona.expectMaxMonthsInTop3) {
      const fastHit = top3Careers.some(
        (c) => c.fastest_entry_months <= persona.expectMaxMonthsInTop3!
      );
      assert.equal(
        fastHit,
        true,
        `Expected at least one fast-entry career (<= ${persona.expectMaxMonthsInTop3}m) in top 3`
      );
    }
  });
}

test('anti-stereotyping fairness test: swapping student name, region, or demographic wording produces identical rankings & scores', () => {
  const sharedQuiz = makeQuiz({ R: 5, I: 5, A: 2, S: 2, E: 2, C: 4 });

  const profileA = makeProfile({
    display_name: 'Fatima',
    region: 'in',
    favorite_subjects: ['Mathematics', 'Physics & Chemistry'],
    interests: ['Fixing & Building Machines', 'Technology & Coding'],
    budget: 'free_only',
    family_expectations: 'First-generation female student from a small village.',
  });

  const profileB = makeProfile({
    display_name: 'Connor',
    region: 'us',
    favorite_subjects: ['Mathematics', 'Physics & Chemistry'],
    interests: ['Fixing & Building Machines', 'Technology & Coding'],
    budget: 'free_only',
    family_expectations: 'Suburban student exploring engineering and trades.',
  });

  const resA = buildDeterministicRecommendations(profileA, sharedQuiz, careers, 6);
  const resB = buildDeterministicRecommendations(profileB, sharedQuiz, careers, 6);

  assert.deepEqual(
    resA.payload.matches.map((m) => ({ id: m.career_id, score: m.fit_score })),
    resB.payload.matches.map((m) => ({ id: m.career_id, score: m.fit_score })),
    'Recommendations must be strictly invariant to gender, region, or demographic cues'
  );
});
