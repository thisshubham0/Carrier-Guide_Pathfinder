import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Scale,
  Share2,
} from 'lucide-react';
import type {
  Career,
  RecommendationPayload,
  RiasecLetter,
  RiasecScores,
  StudentProfile,
} from '../shared/types.ts';
import { RIASEC_LETTERS, RIASEC_META } from '../shared/riasec.ts';
import { getAffordableRoutes } from '../shared/matching.ts';
import { t } from '../shared/i18n.ts';

interface MatchesHubProps {
  profile: StudentProfile;
  riasecScores: RiasecScores;
  topCodes: RiasecLetter[];
  recommendations: RecommendationPayload | null;
  careersById: Map<string, Career>;
  compareIds: string[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenRoadmap: (careerId: string) => void;
  onToggleCompare: (careerId: string) => void;
  onOpenCompare: () => void;
  onOpenShare: () => void;
  onRetakeQuiz: () => void;
  onChangeRegion: (r: StudentProfile['region']) => void;
}

export const MatchesHub: React.FC<MatchesHubProps> = ({
  profile,
  riasecScores,
  topCodes,
  recommendations,
  careersById,
  compareIds,
  loading,
  error,
  onRetry,
  onOpenRoadmap,
  onToggleCompare,
  onOpenCompare,
  onOpenShare,
  onRetakeQuiz,
  onChangeRegion,
}) => {
  const [expandedFitId, setExpandedFitId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>('All');

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading your career matches">
        <div className="h-28 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-4">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#B45309]" aria-hidden="true" />
        <h2 className="font-display text-xl font-semibold text-[#0F172A]">
          Could not load your career matches
        </h2>
        <p className="mx-auto max-w-md text-sm text-[#475569]">
          {error || 'We could not compute matches yet. Check your connection or retry.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const matchedSectors = Array.from(
    new Set(
      recommendations.matches
        .map((m) => careersById.get(m.career_id)?.sector)
        .filter((s): s is Career['sector'] => Boolean(s))
    )
  );

  const visibleMatches = recommendations.matches.filter((m) => {
    if (sectorFilter === 'All') return true;
    return careersById.get(m.career_id)?.sector === sectorFilter;
  });

  const isTightBudget = profile.budget === 'free_only' || profile.budget === 'low_budget';

  return (
    <div className="space-y-6">
      {/* Top Heading + Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#0F766E]">
            Top profile: {topCodes.map((c) => RIASEC_META[c].short).join(' · ')} ({topCodes.join('')})
            {' · '}Confidence: {recommendations.confidence}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {t(profile.language, 'matches.title')}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="region-switcher" className="sr-only">
            Region for salary and routes
          </label>
          <select
            id="region-switcher"
            value={profile.region}
            onChange={(e) => onChangeRegion(e.target.value as StudentProfile['region'])}
            className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm font-medium text-[#0F172A]"
          >
            <option value="global">Global (USD)</option>
            <option value="in">India (INR)</option>
            <option value="us">United States (USD)</option>
          </select>

          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-slate-50 whitespace-nowrap"
          >
            <Share2 className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            Parent / Counsellor Summary
          </button>
        </div>
      </div>

      {/* Low Confidence Notice (Explicit State) */}
      {recommendations.confidence === 'low' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-[#0F172A]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
            <p>{t(profile.language, 'matches.lowConfidence')}</p>
          </div>
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="min-h-[44px] shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-[#B45309] hover:bg-amber-50 whitespace-nowrap"
          >
            Finish quiz questions
          </button>
        </div>
      )}

      {/* Transparent RIASEC Score Strip */}
      <section
        aria-label="Transparent RIASEC score breakdown"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-[#0F172A]">
            Your transparent RIASEC interest profile
          </h2>
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="text-xs font-medium text-[#0F766E] hover:underline"
          >
            Update quiz answers
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RIASEC_LETTERS.map((letter) => {
            const val = riasecScores[letter];
            const isTop = topCodes.includes(letter);
            return (
              <div key={letter} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className={isTop ? 'font-semibold text-[#0F766E]' : 'text-[#475569]'}>
                    {letter} · {RIASEC_META[letter].short}
                  </span>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">{val}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isTop ? 'bg-[#0F766E]' : 'bg-slate-400'}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {recommendations.assumptions.length > 0 && (
          <div className="border-t border-slate-100 pt-3 text-xs text-[#475569]">
            <span className="font-medium text-[#0F172A]">Assumptions used: </span>
            {recommendations.assumptions.join(' · ')}
          </div>
        )}
      </section>

      {/* Interactive Filter Bar + Compare Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter matches by sector">
          {['All', ...matchedSectors].map((sec) => {
            const active = sectorFilter === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>

        {compareIds.length >= 2 && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59] whitespace-nowrap"
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
            Compare selected ({compareIds.length})
          </button>
        )}
      </div>

      {/* Career Match Cards Grid (2 Columns on Desktop) */}
      {visibleMatches.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#475569]">
          No matches in this sector filter. Select &ldquo;All&rdquo; to view all ranked careers.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleMatches.map((match, idx) => {
            const career = careersById.get(match.career_id);
            if (!career) return null;
            const salary =
              career.salary_by_region[profile.region]?.formatted ??
              career.salary_by_region.global.formatted;
            const isComparing = compareIds.includes(career.id);
            const showBreakdown = expandedFitId === career.id;
            const firstAffordable = getAffordableRoutes(career, profile.budget)[0];

            return (
              <article
                key={career.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 space-y-4"
              >
                <div className="space-y-4">
                  {/* Card Header: Direct Title + Quiet Unboxed Metadata */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-[#475569]">
                        #{idx + 1} Match · {career.sector} · {career.growth_outlook.label}
                      </div>
                      <h2 className="font-display text-xl font-bold text-[#0F172A]">
                        {career.title}
                      </h2>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-2xl font-bold text-[#0F766E] tabular-nums">
                        {Math.round(match.fit_score)}%
                      </div>
                      <div className="text-[11px] text-[#475569]">Fit score</div>
                    </div>
                  </div>

                  {/* Key Quantitative Row */}
                  <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs">
                    <div>
                      <div className="text-[#475569]">Typical entry pay</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                        {salary}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#475569]">Fastest entry route</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                        ~{career.fastest_entry_months} months
                      </div>
                    </div>
                  </div>

                  {/* Fit Breakdown Disclosure */}
                  {match.breakdown && (
                    <div>
                      <button
                        type="button"
                        aria-expanded={showBreakdown}
                        onClick={() => setExpandedFitId(showBreakdown ? null : career.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:underline"
                      >
                        <span>How this {Math.round(match.fit_score)}% fit score was calculated</span>
                        {showBreakdown ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>

                      {showBreakdown && (
                        <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                          <div>
                            <div className="text-[#475569]">Interests (52%)</div>
                            <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                              {match.breakdown.interest_score}/100
                            </div>
                          </div>
                          <div>
                            <div className="text-[#475569]">Skills (23%)</div>
                            <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                              {match.breakdown.skill_score}/100
                            </div>
                          </div>
                          <div>
                            <div className="text-[#475569]">Constraints (25%)</div>
                            <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                              {match.breakdown.constraint_score}/100
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day in the Life */}
                  <div className="space-y-1 text-sm">
                    <div className="text-xs font-semibold text-[#0F172A]">Day in the life</div>
                    <p className="text-[#475569] leading-relaxed">{career.day_in_the_life}</p>
                  </div>

                  {/* Why It Fits */}
                  <div className="space-y-1.5 text-sm">
                    <div className="text-xs font-semibold text-[#0F766E]">Why this fits you</div>
                    <ul className="space-y-1 text-[#0F172A]">
                      {match.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="leading-snug">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Honest Trade-Offs */}
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-[#B45309]">Trade-offs to weigh</div>
                    <p className="text-[#475569] leading-relaxed">
                      {match.risks_or_tradeoffs[0]}
                    </p>
                  </div>

                  {isTightBudget && firstAffordable && (
                    <div className="rounded-xl bg-teal-50/50 p-3 text-xs text-[#0F172A]">
                      <span className="font-semibold text-[#0F766E]">Budget-friendly route: </span>
                      {firstAffordable.title} ({firstAffordable.duration})
                    </div>
                  )}
                </div>

                {/* Card Footer: Source Attribution + Actions */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="text-[11px] text-[#475569]">
                    Source: {career.source} · Last updated: {career.last_verified}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenRoadmap(career.id)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors whitespace-nowrap"
                    >
                      <span>View Gaps &amp; Roadmap</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleCompare(career.id)}
                      aria-pressed={isComparing}
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        isComparing
                          ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50'
                      }`}
                    >
                      {isComparing ? 'In Compare ✓' : 'Compare'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
