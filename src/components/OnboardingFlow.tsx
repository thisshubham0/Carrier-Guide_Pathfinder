import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import type {
  BudgetConstraint,
  EducationLevel,
  StudentProfile,
  TimeConstraint,
} from '../shared/types.ts';
import { t } from '../shared/i18n.ts';

interface OnboardingFlowProps {
  profile: StudentProfile;
  onUpdateProfile: (patch: Partial<StudentProfile>) => void;
  onComplete: () => void;
  onExit: () => void;
}

const TOTAL_STEPS = 8;

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Biology & Health',
  'Physics & Chemistry',
  'Computer Science',
  'English & Writing',
  'Art & Design',
  'Economics & Accounts',
  'History & Civics',
  'Geography & Environment',
  'Workshop / Practical Tech',
];

const INTEREST_OPTIONS = [
  'Technology & Coding',
  'Healthcare & Helping People',
  'Fixing & Building Machines',
  'Design, Video & Writing',
  'Teaching & Community Work',
  'Business, Finance & Organizing',
  'Agriculture, Food & Animals',
  'Solar, Climate & Green Energy',
];

const SKILL_OPTIONS = [
  'Spreadsheets',
  'HTML & CSS',
  'JavaScript',
  'Python',
  'Clear Writing',
  'Graphic Design',
  'Video Editing',
  'Customer Support',
  'Accounting Basics',
  'Electrical Safety',
  'Active Listening',
  'Record Keeping',
  'IT Troubleshooting',
  'Applied Math',
];

const STRENGTH_OPTIONS = [
  'Analytical thinking',
  'Hands-on building',
  'Patience & listening',
  'Creative ideas',
  'Attention to detail',
  'Leading groups',
  'Explaining things simply',
  'Staying calm under pressure',
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  profile,
  onUpdateProfile,
  onComplete,
  onExit,
}) => {
  const [step, setStep] = useState(0);
  const [customSkill, setCustomSkill] = useState('');

  const pct = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const lang = profile.language;

  const toggleItem = (
    field: 'favorite_subjects' | 'interests' | 'current_skills' | 'strengths',
    value: string
  ) => {
    const current = profile[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onUpdateProfile({ [field]: next });
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customSkill.trim().slice(0, 50);
    if (!cleaned) return;
    if (!profile.current_skills.includes(cleaned)) {
      onUpdateProfile({ current_skills: [...profile.current_skills, cleaned] });
    }
    setCustomSkill('');
  };

  const handleNext = () => {
    if (step + 1 >= TOTAL_STEPS) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  const needsUnder18Ack = step === 0 && profile.age_band === '14-17' && !profile.under18_guardian_ack;

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      {/* Compact Sticky Top Progress Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#475569] hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t(lang, 'cta.back')}</span>
          </button>

          <div className="text-xs font-medium text-[#475569] tabular-nums font-mono">
            Profile · Step {step + 1} of {TOTAL_STEPS} · ~{Math.max(1, TOTAL_STEPS - step)} min left
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={needsUnder18Ack}
            className="min-h-[44px] rounded-lg px-2 text-xs font-medium text-[#0F766E] hover:underline disabled:opacity-40"
          >
            Skip
          </button>
        </div>
        <div className="h-1 w-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-[#0F766E] transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {/* Single Question Focus Card */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-6">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  First, what is your age group and first name?
                </h1>
                <p className="text-sm text-[#475569]">
                  Name is optional—we only use it to personalize your printable summary. We never collect last names, phone numbers, or sensitive personal identifiers.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="pf-display-name" className="block text-sm font-medium text-[#0F172A]">
                  First name or nickname (optional)
                </label>
                <input
                  id="pf-display-name"
                  type="text"
                  maxLength={50}
                  value={profile.display_name}
                  onChange={(e) => onUpdateProfile({ display_name: e.target.value })}
                  placeholder="e.g., Priya, Sam, or leave blank"
                  className="min-h-[48px] w-full rounded-xl border border-[#E2E8F0] px-4 text-base text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
                />
              </div>

              <fieldset className="space-y-2.5">
                <legend className="text-sm font-medium text-[#0F172A]">Your age group</legend>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {(['14-17', '18-21', '22-25'] as const).map((band) => {
                    const active = profile.age_band === band;
                    return (
                      <button
                        key={band}
                        type="button"
                        onClick={() => onUpdateProfile({ age_band: band })}
                        aria-pressed={active}
                        className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60 text-[#0F766E]'
                            : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                        }`}
                      >
                        {band} years
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {profile.age_band === '14-17' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-sm text-[#0F172A]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
                    <div>
                      <div className="font-semibold">Under-18 family safety check</div>
                      <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                        Because you are under 18, please let a parent, guardian, or teacher know you are exploring careers here. You can share your finished roadmap with them in one click.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-[#0F172A] min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={profile.under18_guardian_ack}
                      onChange={(e) =>
                        onUpdateProfile({ under18_guardian_ack: e.target.checked })
                      }
                      className="h-5 w-5 rounded border-slate-300 accent-[#0F766E]"
                    />
                    <span>I understand and have a parent or guardian&apos;s permission to use PathFinder.</span>
                  </label>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  What is your current education stage?
                </h1>
                <p className="text-sm text-[#475569]">
                  This helps us recommend realistic next steps without assuming a 4-year college degree.
                </p>
              </div>
              <div className="space-y-2.5">
                {(
                  [
                    ['high_school_early', 'Classes 9–10 / Early High School', 'Exploring subjects and future streams'],
                    ['high_school_senior', 'Classes 11–12 / Senior High School', 'Choosing college, diploma, or apprenticeship next'],
                    ['diploma_vocational', 'Diploma / ITI / Community College', 'Building practical skills toward a first job'],
                    ['undergraduate', 'Undergraduate Student', 'Preparing for internships or career direction'],
                    ['graduate_or_switcher', 'Graduate / Early Career Switcher', 'Looking to pivot or land a stronger role'],
                  ] as Array<[EducationLevel, string, string]>
                ).map(([val, title, desc]) => {
                  const active = profile.education_level === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateProfile({ education_level: val })}
                      aria-pressed={active}
                      className={`w-full min-h-[56px] rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-teal-50/60'
                          : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#0F172A]">{title}</div>
                      <div className="mt-0.5 text-xs text-[#475569]">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  What is your current stream, trade, or major?
                </h1>
                <p className="text-sm text-[#475569]">
                  Pick the closest option—or choose &ldquo;Undecided&rdquo; to keep every sector open.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  'Undecided',
                  'Science & Math (PCM)',
                  'Biology & Health (PCB)',
                  'Commerce & Accounting',
                  'Arts & Humanities',
                  'Computer Science / IT',
                  'Vocational / Trade / ITI',
                  'Agriculture / Environment',
                ].map((stream) => {
                  const active = profile.stream_or_major === stream;
                  return (
                    <button
                      key={stream}
                      type="button"
                      onClick={() => onUpdateProfile({ stream_or_major: stream })}
                      aria-pressed={active}
                      className={`min-h-[48px] rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-teal-50/60 text-[#0F766E]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                      }`}
                    >
                      {stream}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Which subjects do you enjoy most?
                </h1>
                <p className="text-sm text-[#475569]">
                  Tap as many as apply. Even enjoying one part of a subject counts.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {SUBJECT_OPTIONS.map((subj) => {
                  const active = profile.favorite_subjects.includes(subj);
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => toggleItem('favorite_subjects', subj)}
                      aria-pressed={active}
                      className={`min-h-[48px] rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-teal-50/60 text-[#0F766E]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Which work areas sound interesting to explore?
                </h1>
                <p className="text-sm text-[#475569]">
                  Select 1 to 4 areas you are curious about—you will still see surprises from the quiz.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INTEREST_OPTIONS.map((item) => {
                  const active = profile.interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem('interests', item)}
                      aria-pressed={active}
                      className={`min-h-[48px] rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-teal-50/60 text-[#0F766E]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  What skills or strengths do you already have?
                </h1>
                <p className="text-sm text-[#475569]">
                  It is completely fine if you are starting from zero—we use this to build your skill-gap plan.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#475569]">Practical skills</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SKILL_OPTIONS.map((sk) => {
                    const active = profile.current_skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleItem('current_skills', sk)}
                        aria-pressed={active}
                        className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-left text-sm transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60 font-medium text-[#0F766E]'
                            : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                        }`}
                      >
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                <label htmlFor="pf-custom-skill" className="sr-only">
                  Add another skill
                </label>
                <input
                  id="pf-custom-skill"
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add another skill (e.g., Tally, Hindi typing, CAD)..."
                  className="min-h-[44px] flex-1 rounded-xl border border-[#E2E8F0] px-3.5 text-sm text-[#0F172A]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-slate-50 px-4 text-sm font-medium text-[#0F172A] hover:bg-slate-100 whitespace-nowrap"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-medium text-[#475569]">Personal strengths</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STRENGTH_OPTIONS.map((st) => {
                    const active = profile.strengths.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleItem('strengths', st)}
                        aria-pressed={active}
                        className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-left text-sm transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60 font-medium text-[#0F766E]'
                            : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  What are your budget and time constraints?
                </h1>
                <p className="text-sm text-[#475569]">
                  Being honest here ensures we never suggest an expensive 4-year program without showing free or low-cost alternatives first.
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-[#0F172A]">Training / study budget</legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      ['free_only', 'Free / Scholarship only', 'Need free courses, govt. seats, or paid apprenticeships'],
                      ['low_budget', 'Tight / Low budget', 'Can afford modest exam fees or public diploma'],
                      ['moderate', 'Moderate budget', 'Can manage public college tuition or low-cost cert'],
                      ['flexible', 'Flexible budget', 'Open to degrees, diplomas, or paid training'],
                    ] as Array<[BudgetConstraint, string, string]>
                  ).map(([val, title, desc]) => {
                    const active = profile.budget === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateProfile({ budget: val })}
                        aria-pressed={active}
                        className={`min-h-[56px] rounded-xl border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60'
                            : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-[#0F172A]">{title}</div>
                        <div className="mt-0.5 text-xs text-[#475569]">{desc}</div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-2 pt-2">
                <legend className="text-sm font-medium text-[#0F172A]">
                  How soon do you want to start earning?
                </legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      ['under_6m', 'Under 6 months', 'Need a fast-entry job or paid trainee role'],
                      ['6m_to_2y', '6 months to 2 years', 'Open to diplomas, certs, or apprenticeships'],
                      ['2y_to_4y', '2 to 4 years', 'Planning for a degree or longer licensing track'],
                      ['flexible', 'Flexible timeline', 'Still exploring all time horizons'],
                    ] as Array<[TimeConstraint, string, string]>
                  ).map(([val, title, desc]) => {
                    const active = profile.time_horizon === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateProfile({ time_horizon: val })}
                        aria-pressed={active}
                        className={`min-h-[56px] rounded-xl border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60'
                            : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-[#0F172A]">{title}</div>
                        <div className="mt-0.5 text-xs text-[#475569]">{desc}</div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          {step === 7 && (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Location preference &amp; family expectations
                </h1>
                <p className="text-sm text-[#475569]">
                  Optional context so your roadmap and AI mentor reflect your real life.
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-[#0F172A]">Where would you prefer to work?</legend>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {(
                    [
                      ['local_or_remote', 'Local town or remote'],
                      ['hands_on_local', 'Hands-on in my area'],
                      ['willing_to_relocate', 'Open to relocating'],
                    ] as const
                  ).map(([val, label]) => {
                    const active = profile.location_preference === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateProfile({ location_preference: val })}
                        aria-pressed={active}
                        className={`min-h-[48px] rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-teal-50/60 text-[#0F766E]'
                            : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="pf-family-exp" className="block text-sm font-medium text-[#0F172A]">
                  Any family expectations or responsibilities to keep in mind? (optional)
                </label>
                <textarea
                  id="pf-family-exp"
                  rows={3}
                  maxLength={220}
                  value={profile.family_expectations}
                  onChange={(e) => onUpdateProfile({ family_expectations: e.target.value })}
                  placeholder="e.g., Need part-time study hours to help at home, or parents prefer stable government/healthcare roles..."
                  className="w-full rounded-xl border border-[#E2E8F0] p-3.5 text-sm text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
                />
              </div>
            </>
          )}

          {/* Footer Action Row */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50"
            >
              {t(lang, 'cta.back')}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={needsUnder18Ack}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-40 transition-colors"
            >
              <span>{step + 1 === TOTAL_STEPS ? 'Start Interest Quiz' : t(lang, 'cta.continue')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
