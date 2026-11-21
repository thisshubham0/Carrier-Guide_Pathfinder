import React from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
import type { Career, RecommendationMatch, StudentProfile } from '../shared/types.ts';
import { getAffordableRoutes } from '../shared/matching.ts';

interface CompareViewProps {
  profile: StudentProfile;
  compareIds: string[];
  careers: Career[];
  matchesById: Map<string, RecommendationMatch>;
  onToggleCompare: (careerId: string) => void;
  onOpenRoadmap: (careerId: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  profile,
  compareIds,
  careers,
  matchesById,
  onToggleCompare,
  onOpenRoadmap,
}) => {
  const selectedCareers = compareIds
    .map((id) => careers.find((c) => c.id === id))
    .filter((c): c is Career => Boolean(c));

  const addableCareers = careers.filter((c) => !compareIds.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#0F766E]">Side-by-side trade-offs</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
            Compare Careers
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Weigh up to 3 paths across entry pay, training time, budget-friendly routes, and missing skills.
          </p>
        </div>

        {selectedCareers.length < 3 && (
          <div className="flex items-center gap-2">
            <label htmlFor="add-compare-select" className="sr-only">
              Add a career to compare
            </label>
            <select
              id="add-compare-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onToggleCompare(e.target.value);
                  e.target.value = '';
                }
              }}
              className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A]"
            >
              <option value="">+ Add career to compare...</option>
              {addableCareers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.sector})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedCareers.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#0F172A]">
            No careers selected for comparison yet
          </h2>
          <p className="mx-auto max-w-md text-sm text-[#475569]">
            Tap &ldquo;Compare&rdquo; on any card in your Matches tab, or pick two careers from the selector above.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {careers.slice(0, 3).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggleCompare(c.id)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-slate-50 px-4 py-2 text-xs font-medium text-[#0F172A] hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
                {c.title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="w-44 p-4 text-xs font-semibold text-[#475569]">Factor</th>
                {selectedCareers.map((c) => (
                  <th key={c.id} className="p-4 align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-normal text-[#475569]">{c.sector}</div>
                        <div className="font-display text-base font-bold text-[#0F172A]">
                          {c.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(c.id)}
                        aria-label={`Remove ${c.title} from comparison`}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#475569] hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Your fit score</td>
                {selectedCareers.map((c) => {
                  const m = matchesById.get(c.id);
                  return (
                    <td key={c.id} className="p-4 font-mono font-bold text-[#0F766E] tabular-nums">
                      {m ? `${Math.round(m.fit_score)}%` : 'Exploratory'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">
                  Entry salary ({profile.region.toUpperCase()})
                </td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 font-mono text-xs font-semibold text-[#0F172A] tabular-nums">
                    {c.salary_by_region[profile.region]?.formatted ?? c.salary_by_region.global.formatted}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Demand outlook</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 text-xs text-[#0F172A]">
                    <div className="font-semibold">{c.growth_outlook.label}</div>
                    <div className="mt-0.5 text-[#475569]">{c.growth_outlook.note}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Fastest credible entry</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 font-mono text-xs font-semibold text-[#0F172A] tabular-nums">
                    ~{c.fastest_entry_months} months
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Lowest-cost pathway</td>
                {selectedCareers.map((c) => {
                  const first = getAffordableRoutes(c, 'free_only')[0];
                  return (
                    <td key={c.id} className="p-4 text-xs text-[#0F172A]">
                      <div className="font-medium">{first?.title}</div>
                      <div className="text-[#475569]">
                        Cost: {first?.cost_tier} · {first?.duration}
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Core skills needed</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 text-xs text-[#475569]">
                    {c.required_skills.map((s) => s.name).join(' · ')}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Day in the life</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 text-xs text-[#475569] leading-relaxed">
                    {c.day_in_the_life}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Data source</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4 text-[11px] text-[#475569]">
                    {c.source} · Updated {c.last_verified}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-semibold text-[#475569]">Action</td>
                {selectedCareers.map((c) => (
                  <td key={c.id} className="p-4">
                    <button
                      type="button"
                      onClick={() => onOpenRoadmap(c.id)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59] whitespace-nowrap"
                    >
                      Open roadmap
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
