import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import type {
  Career,
  LearningResource,
  PersonalizedRoadmap,
  ProgressState,
  RecommendationMatch,
  StudentProfile,
} from '../shared/types.ts';
import { getAffordableRoutes } from '../shared/matching.ts';
import { isSafeHttpUrl } from '../shared/safety.ts';

interface RoadmapWorkspaceProps {
  profile: StudentProfile;
  career: Career | null;
  match: RecommendationMatch | null;
  roadmap: PersonalizedRoadmap | null;
  allMatchedCareers: Career[];
  resourcesById: Map<string, LearningResource>;
  progress: ProgressState;
  onSelectCareer: (careerId: string) => void;
  onToggleStep: (stepId: string) => void;
  onChangeReminder: (freq: ProgressState['reminder_frequency']) => void;
  onRateHelpfulness: (rating: 'yes' | 'somewhat' | 'no') => void;
  onAskMentorAboutCareer: (careerTitle: string) => void;
}

const PHASE_LABELS: Array<{ key: 'days_30' | 'months_6' | 'years_2'; title: string; subtitle: string }> = [
  { key: 'days_30', title: 'Next 30 Days', subtitle: 'Build momentum with free basics and a starter project' },
  { key: 'months_6', title: 'Next 6 Months', subtitle: 'Earn an entry credential and proof of practical skill' },
  { key: 'years_2', title: 'Next 2 Years', subtitle: 'Step into paid work, apprenticeships, or specialization' },
];

export const RoadmapWorkspace: React.FC<RoadmapWorkspaceProps> = ({
  profile,
  career,
  match,
  roadmap,
  allMatchedCareers,
  resourcesById,
  progress,
  onSelectCareer,
  onToggleStep,
  onChangeReminder,
  onRateHelpfulness,
  onAskMentorAboutCareer,
}) => {
  const [subTab, setSubTab] = useState<'roadmap' | 'gaps' | 'pathways'>('roadmap');

  if (!career || !roadmap) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-3">
        <h2 className="font-display text-xl font-semibold text-[#0F172A]">
          Choose a career to view your roadmap
        </h2>
        <p className="text-sm text-[#475569]">
          Open any matched career from the Matches tab to see prioritized skill gaps, free resources, and your 30-day / 6-month / 2-year checklist.
        </p>
      </div>
    );
  }

  const totalSteps = roadmap.steps.length;
  const completedCount = roadmap.steps.filter((s) =>
    progress.completed_step_ids.includes(s.id)
  ).length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const skillGaps = match?.skill_gaps ?? [];
  const gapsByPriority = {
    now: skillGaps.filter((g) => g.priority === 'now'),
    next: skillGaps.filter((g) => g.priority === 'next'),
    later: skillGaps.filter((g) => g.priority === 'later'),
  };

  const orderedRoutes = getAffordableRoutes(career, profile.budget);
  const salary =
    career.salary_by_region[profile.region]?.formatted ??
    career.salary_by_region.global.formatted;

  return (
    <div className="space-y-6">
      {/* Career Switcher & Summary Header */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <div className="text-xs text-[#475569]">
              {career.sector} · Entry pay: <span className="font-mono font-medium text-[#0F172A] tabular-nums">{salary}</span> · {career.growth_outlook.label}
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
              {career.title}
            </h1>
            <p className="max-w-2xl text-sm text-[#475569] leading-relaxed">
              {roadmap.summary}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <label htmlFor="roadmap-career-select" className="sr-only">
              Switch roadmap career
            </label>
            <select
              id="roadmap-career-select"
              value={career.id}
              onChange={(e) => onSelectCareer(e.target.value)}
              className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm font-medium text-[#0F172A]"
            >
              {allMatchedCareers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onAskMentorAboutCareer(career.title)}
              className="min-h-[44px] rounded-xl border border-[#0F766E] px-4 py-2 text-sm font-semibold text-[#0F766E] hover:bg-teal-50/60 whitespace-nowrap"
            >
              Ask AI Mentor
            </button>
          </div>
        </div>

        {/* Progress Tracker Strip (P1 Tracker: checklist %, streaks, reminders) */}
        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[#475569]">Roadmap progress</span>
              <span className="font-mono font-semibold text-[#0F766E] tabular-nums">
                {completedCount}/{totalSteps} steps ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <Flame className="h-5 w-5 text-[#B45309] shrink-0" aria-hidden="true" />
            <div>
              <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                {progress.streak_days} {progress.streak_days === 1 ? 'day' : 'days'} streak
              </div>
              <div className="text-xs text-[#475569]">Check off any step to keep momentum</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-[#475569]">
              <Bell className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
              <label htmlFor="reminder-select">Check-in reminder</label>
            </div>
            <select
              id="reminder-select"
              value={progress.reminder_frequency}
              onChange={(e) =>
                onChangeReminder(e.target.value as ProgressState['reminder_frequency'])
              }
              className="min-h-[40px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A]"
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sub-navigation Tabs */}
      <div
        className="inline-flex rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Roadmap views"
      >
        {(
          [
            ['roadmap', 'Phased Roadmap'],
            ['gaps', `Skill Gaps (${skillGaps.length})`],
            ['pathways', `Education Pathways (${orderedRoutes.length})`],
          ] as const
        ).map(([key, label]) => {
          const active = subTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(key)}
              className={`min-h-[40px] rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Phased 30-Day / 6-Month / 2-Year Roadmap Checklist */}
      {subTab === 'roadmap' && (
        <div className="space-y-6">
          {PHASE_LABELS.map((phase) => {
            const steps = roadmap.steps.filter((s) => s.phase === phase.key);
            return (
              <section
                key={phase.key}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">{phase.title}</h2>
                  <p className="text-xs text-[#475569]">{phase.subtitle}</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {steps.map((step) => {
                    const done = progress.completed_step_ids.includes(step.id);
                    const linkedResources = step.resource_ids
                      .map((rid) => resourcesById.get(rid))
                      .filter((r): r is LearningResource => Boolean(r));

                    return (
                      <div key={step.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => onToggleStep(step.id)}
                            aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`}
                            aria-pressed={done}
                            className="mt-0.5 flex min-h-[44px] min-w-[44px] -ml-2 -mt-2 items-center justify-center rounded-xl text-[#0F766E] hover:bg-teal-50/70 transition-colors shrink-0"
                          >
                            {done ? (
                              <CheckCircle2 className="h-6 w-6 text-[#15803D]" aria-hidden="true" />
                            ) : (
                              <Circle className="h-6 w-6 text-slate-300" aria-hidden="true" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="text-xs text-[#475569]">
                              {step.category} · {done ? 'Completed' : 'To do'}
                            </div>
                            <h3
                              className={`text-base font-semibold ${
                                done ? 'line-through text-[#475569]' : 'text-[#0F172A]'
                              }`}
                            >
                              {step.title}
                            </h3>
                            <p className="text-sm text-[#475569] leading-relaxed">{step.detail}</p>

                            {linkedResources.length > 0 && (
                              <div className="pt-2 space-y-1.5">
                                {linkedResources.map((res) => (
                                  <div
                                    key={res.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs"
                                  >
                                    <div>
                                      <span className="font-semibold text-[#0F172A]">{res.title}</span>
                                      <span className="text-[#475569]">
                                        {' '}· {res.provider} · {res.cost} · {res.duration}
                                      </span>
                                    </div>
                                    {isSafeHttpUrl(res.url) && (
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:underline whitespace-nowrap"
                                      >
                                        Open resource
                                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* TAB 2: Prioritized Skill Gap Analysis */}
      {subTab === 'gaps' && (
        <div className="grid gap-5 lg:grid-cols-3">
          {(
            [
              ['now', 'Learn Now (Core Basics)', 'Start with these foundational skills first in your 30-day sprint.'],
              ['next', 'Learn Next (Job-Ready)', 'Build these intermediate skills over months 2 to 6.'],
              ['later', 'Learn Later (Growth)', 'Add these advanced skills once you have practical momentum.'],
            ] as const
          ).map(([priority, heading, subtitle]) => {
            const list = gapsByPriority[priority];
            return (
              <section
                key={priority}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4"
              >
                <div>
                  <h2 className="font-display text-base font-bold text-[#0F172A]">{heading}</h2>
                  <p className="mt-0.5 text-xs text-[#475569]">{subtitle}</p>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-[#15803D]">
                    You already cover these skills or none are required at this tier.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {list.map((gap) => {
                      const resources = gap.resource_ids
                        .map((rid) => resourcesById.get(rid))
                        .filter((r): r is LearningResource => Boolean(r));
                      return (
                        <div
                          key={gap.skill}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2"
                        >
                          <div className="text-sm font-semibold text-[#0F172A]">{gap.skill}</div>
                          {resources.map((res) => (
                            <div key={res.id} className="text-xs text-[#475569] space-y-0.5">
                              <div>
                                {res.title} · {res.cost}
                              </div>
                              {isSafeHttpUrl(res.url) && (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-[#0F766E] hover:underline"
                                >
                                  {res.provider}
                                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* TAB 3: Education Pathways (Degrees, Vocational, Apprenticeships, Exams & Scholarships) */}
      {subTab === 'pathways' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-start gap-3">
            <GraduationCap className="mt-0.5 h-5 w-5 text-[#0F766E] shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#475569]">
              Showing routes localized for <strong className="text-[#0F172A]">{profile.region.toUpperCase()}</strong>
              {profile.budget === 'free_only' || profile.budget === 'low_budget'
                ? ' — sorted with free, scholarship, apprenticeship, and vocational routes first to match your tight budget.'
                : ' — including both traditional degrees and faster low-cost alternatives.'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {orderedRoutes.map((route, idx) => {
              const exams = route.exams[profile.region] ?? route.exams.global;
              const scholarships = route.scholarships[profile.region] ?? route.scholarships.global;
              return (
                <article
                  key={idx}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-3"
                >
                  <div className="text-xs text-[#475569]">
                    {route.type.charAt(0).toUpperCase() + route.type.slice(1)} · Cost: {route.cost_tier} · Duration: {route.duration}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">{route.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{route.summary}</p>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#0F172A]">Typical exams / entry checks: </span>
                      <span className="text-[#475569]">{exams.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#0F766E]">Scholarships &amp; fee support: </span>
                      <span className="text-[#475569]">{scholarships.join(', ')}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Human Counsellor Guidance + Source Attribution + Helpfulness Survey */}
      <footer className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4">
        <div className="flex items-start gap-2.5 text-xs text-[#475569]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-[#0F172A] font-medium">{roadmap.counsellor_note}</p>
            <p>
              Source: {roadmap.source} · Last updated: {roadmap.last_verified}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-[#0F172A]">
            Did this roadmap help you decide on a next step?
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                ['yes', 'Yes, very helpful'],
                ['somewhat', 'Somewhat'],
                ['no', 'Not yet'],
              ] as const
            ).map(([val, label]) => {
              const active = progress.helpfulness_rating === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onRateHelpfulness(val)}
                  aria-pressed={active}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#0F766E] bg-[#0F766E] text-white'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
};
