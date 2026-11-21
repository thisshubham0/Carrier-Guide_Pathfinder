import React, { useState } from 'react';
import { Check, Copy, Link2, Printer, X } from 'lucide-react';
import type { ShareSnapshotPayload } from '../shared/types.ts';
import { RIASEC_META } from '../shared/riasec.ts';

interface ShareSummaryViewProps {
  snapshot: ShareSnapshotPayload;
  isStandaloneSharePage?: boolean;
  onClose?: () => void;
  onCreateShareLink?: () => Promise<string | null>;
}

export const ShareSummaryView: React.FC<ShareSummaryViewProps> = ({
  snapshot,
  isStandaloneSharePage = false,
  onClose,
  onCreateShareLink,
}) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    if (!onCreateShareLink || creating) return;
    setCreating(true);
    setLinkError(null);
    try {
      const token = await onCreateShareLink();
      if (!token) throw new Error('Could not create share link right now.');
      const url = `${window.location.origin}/?share=${encodeURIComponent(token)}`;
      setShareUrl(url);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Share link failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: user can select text directly
    }
  };

  const content = (
    <div className="mx-auto max-w-4xl space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0]">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Parent, Teacher &amp; Counsellor Summary
          </h2>
          <p className="text-xs text-[#475569]">
            Clean read-only overview—private AI mentor chats are never included.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStandaloneSharePage && onCreateShareLink && (
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={creating}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59] disabled:opacity-50 whitespace-nowrap"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {creating ? 'Creating link...' : 'Create shareable link'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            Print / Save PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close summary"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-slate-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="no-print rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="truncate font-mono text-[#0F172A]">{shareUrl}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}

      {linkError && (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {linkError}
        </div>
      )}

      {/* Printable Header */}
      <header className="space-y-1">
        <div className="text-xs font-medium text-[#0F766E]">
          PathFinder Career Guidance Report · Generated {snapshot.created_at.slice(0, 10)} · Region: {snapshot.region.toUpperCase()}
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
          Career Exploration Summary{snapshot.student_first_name ? ` for ${snapshot.student_first_name}` : ''}
        </h1>
        <p className="text-sm text-[#475569]">
          Age group: {snapshot.age_band} · Education: {snapshot.education_level.replace(/_/g, ' ')} · Budget focus: {snapshot.budget.replace(/_/g, ' ')} · Match confidence: {snapshot.confidence}
        </p>
      </header>

      {/* Strengths / RIASEC Overview */}
      <section className="rounded-xl border border-[#E2E8F0] p-4 space-y-2 print-break-avoid">
        <h3 className="font-display text-sm font-bold text-[#0F172A]">
          Top Interest Strengths: {snapshot.top_riasec.map((c) => RIASEC_META[c].name).join(' · ')}
        </h3>
        <p className="text-xs text-[#475569]">
          Assumptions noted: {snapshot.assumptions.join(' · ')}
        </p>
      </section>

      {/* Top Ranked Careers */}
      <section className="space-y-3">
        <h3 className="font-display text-base font-bold text-[#0F172A]">
          Top Ranked Career Options &amp; Trade-Offs
        </h3>
        <div className="space-y-3">
          {snapshot.top_matches.map((m, idx) => (
            <div
              key={m.career_id}
              className="rounded-xl border border-[#E2E8F0] p-4 space-y-2 print-break-avoid"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <span className="font-mono text-xs text-[#475569] mr-2">#{idx + 1}</span>
                  <span className="font-display text-base font-bold text-[#0F172A]">{m.title}</span>
                  <span className="text-xs text-[#475569]"> · {m.sector} · {m.demand}</span>
                </div>
                <div className="font-mono text-sm font-bold text-[#0F766E] tabular-nums shrink-0">
                  {Math.round(m.fit_score)}% fit
                </div>
              </div>
              <div className="text-xs text-[#0F172A]">
                <span className="font-semibold">Typical entry salary:</span>{' '}
                <span className="font-mono tabular-nums">{m.salary_formatted}</span>
                {' · '}
                <span className="font-semibold">Affordable pathway:</span> {m.affordable_route}
              </div>
              <div className="text-xs text-[#475569]">
                <strong className="text-[#0F172A]">Why it fits:</strong> {m.reasons.join(' ')}
              </div>
              <div className="text-xs text-[#475569]">
                <strong className="text-[#B45309]">Trade-off:</strong> {m.risks_or_tradeoffs[0]}
              </div>
              <div className="text-xs text-[#0F766E]">
                <strong>Suggested next step:</strong> {m.next_step}
              </div>
              <div className="text-[11px] text-[#475569]">
                Source: {m.source} · Last updated: {m.last_verified}
              </div>
            </div>
          ))}
        </div>
      </section>

      {snapshot.focused_career_roadmap && (
        <section className="rounded-xl border border-[#E2E8F0] p-4 space-y-2 print-break-avoid">
          <h3 className="font-display text-sm font-bold text-[#0F172A]">
            30-Day Starter Plan: {snapshot.focused_career_roadmap.career_title} ({snapshot.focused_career_roadmap.completed_count}/{snapshot.focused_career_roadmap.total_count} steps completed)
          </h3>
          <ul className="space-y-1 text-xs text-[#475569]">
            {snapshot.focused_career_roadmap.days_30_steps.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-[#475569] border-t border-slate-100 pt-3">
        Note for parents and counsellors: PathFinder provides structured options, data sources, and trade-offs—not guaranteed salary outcomes. Please review costs, local accreditation, and family goals together before making major tuition decisions.
      </p>
    </div>
  );

  if (isStandaloneSharePage) {
    return <main className="min-h-screen bg-[#F7F9FB] px-4 py-8">{content}</main>;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Parent and Counsellor Career Summary"
    >
      {content}
    </div>
  );
};
