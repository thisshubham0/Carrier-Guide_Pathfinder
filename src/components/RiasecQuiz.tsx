import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import type { LanguageCode, QuizAnswers, RiasecLetter } from '../shared/types.ts';
import { RIASEC_LETTERS, RIASEC_META, RIASEC_QUESTIONS } from '../shared/riasec.ts';
import { t } from '../shared/i18n.ts';

interface RiasecQuizProps {
  answers: QuizAnswers;
  language: LanguageCode;
  onChangeAnswer: (questionId: string, value: number) => void;
  onBackToOnboarding: () => void;
  onComplete: () => void;
}

const SCALE = [
  { value: 1, label: 'Not for me', short: '1' },
  { value: 2, label: 'Rarely', short: '2' },
  { value: 3, label: 'Maybe', short: '3' },
  { value: 4, label: 'Like it', short: '4' },
  { value: 5, label: 'Love it', short: '5' },
];

export const RiasecQuiz: React.FC<RiasecQuizProps> = ({
  answers,
  language,
  onChangeAnswer,
  onBackToOnboarding,
  onComplete,
}) => {
  const [hasAcceptedWarning, setHasAcceptedWarning] = useState(false);
  const [warningConfirmed, setWarningConfirmed] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const currentLetter: RiasecLetter = RIASEC_LETTERS[pageIdx];
  const questionsOnPage = RIASEC_QUESTIONS.filter((q) => q.dimension === currentLetter);
  const answeredTotal = Object.keys(answers).length;
  const pct = Math.round(((pageIdx + 1) / RIASEC_LETTERS.length) * 100);

  const handleNext = () => {
    if (pageIdx + 1 >= RIASEC_LETTERS.length) {
      onComplete();
    } else {
      setPageIdx(pageIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (pageIdx === 0) onBackToOnboarding();
    else {
      setPageIdx(pageIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!hasAcceptedWarning) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
        <header className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onBackToOnboarding}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#475569] hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{t(language, 'cta.back')}</span>
            </button>
            <div className="text-xs font-medium text-[#475569] font-mono tabular-nums">
              Interest Check · Before you start
            </div>
            <div className="w-14" aria-hidden="true" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10 sm:px-6">
          <section
            role="alertdialog"
            aria-labelledby="quiz-honesty-warning-title"
            aria-describedby="quiz-honesty-warning-body"
            className="w-full rounded-2xl border border-[#F59E0B]/40 bg-white p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#B45309]">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#B45309]">
                  {t(language, 'quiz.warningBadge')}
                </p>
                <h1
                  id="quiz-honesty-warning-title"
                  className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug"
                >
                  {t(language, 'quiz.warningTitle')}
                </h1>
              </div>
            </div>

            <p id="quiz-honesty-warning-body" className="text-sm sm:text-base text-[#334155] leading-relaxed">
              {t(language, 'quiz.warningBody')}
            </p>

            <ul className="space-y-3 text-sm text-[#475569]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                <span>{t(language, 'quiz.warningPoint1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                <span>{t(language, 'quiz.warningPoint2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                <span>{t(language, 'quiz.warningPoint3')}</span>
              </li>
            </ul>

            <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border border-[#E2E8F0] bg-slate-50/70 p-4 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={warningConfirmed}
                onChange={(e) => setWarningConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#0F766E]"
              />
              <span className="text-sm font-medium text-[#0F172A] leading-snug">
                {t(language, 'quiz.warningCheckbox')}
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onBackToOnboarding}
                className="min-h-[48px] rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50"
              >
                {t(language, 'cta.back')}
              </button>

              <button
                type="button"
                disabled={!warningConfirmed}
                onClick={() => {
                  setHasAcceptedWarning(true);
                  window.scrollTo({ top: 0 });
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-45 transition-colors"
              >
                <span>{t(language, 'quiz.warningStart')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#475569] hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t(language, 'cta.back')}</span>
          </button>

          <div className="text-xs font-medium text-[#475569] font-mono tabular-nums">
            Interest Check · Part {pageIdx + 1} of {RIASEC_LETTERS.length} · {answeredTotal}/24 answered
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] rounded-lg px-2 text-xs font-medium text-[#0F766E] hover:underline"
          >
            {pageIdx + 1 === RIASEC_LETTERS.length ? 'Finish' : 'Skip part'}
          </button>
        </div>
        <div
          className="h-1 w-full bg-slate-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#0F766E] transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#0F766E]">
            Area {pageIdx + 1} of 6 · {RIASEC_META[currentLetter].name}
          </p>
          <h1 className="font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {t(language, 'quiz.title')}
          </h1>
          <p className="text-sm text-[#475569]">{t(language, 'quiz.subtitle')}</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-white p-4 text-xs text-[#475569]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
          <p>{t(language, 'quiz.transparency')}</p>
        </div>

        <div className="space-y-4">
          {questionsOnPage.map((q, idx) => {
            const selected = answers[q.id];
            const promptText = language === 'hi' ? q.hi_text : q.text;
            return (
              <fieldset
                key={q.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4"
              >
                <legend className="text-base font-medium text-[#0F172A] leading-snug">
                  <span className="mr-2 font-mono text-xs text-[#475569] tabular-nums">
                    {pageIdx * 4 + idx + 1}.
                  </span>
                  {promptText}
                </legend>
                <div className="text-xs text-[#475569]">{q.example}</div>

                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={promptText}>
                  {SCALE.map((opt) => {
                    const active = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChangeAnswer(q.id, opt.value)}
                        className={`min-h-[52px] rounded-xl border px-1.5 py-2 text-center transition-colors ${
                          active
                            ? 'border-[#0F766E] bg-[#0F766E] text-white'
                            : 'border-[#E2E8F0] bg-slate-50/50 text-[#0F172A] hover:border-slate-300'
                        }`}
                      >
                        <div className="font-mono text-sm font-semibold tabular-nums">
                          {opt.short}
                        </div>
                        <div
                          className={`mt-0.5 text-[11px] leading-tight ${
                            active ? 'text-teal-50' : 'text-[#475569]'
                          }`}
                        >
                          {opt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 pb-10">
          <button
            type="button"
            onClick={handlePrev}
            className="min-h-[48px] rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-slate-50"
          >
            {t(language, 'cta.back')}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors"
          >
            <span>
              {pageIdx + 1 === RIASEC_LETTERS.length
                ? 'See My Career Matches'
                : 'Next Area'}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </main>
    </div>
  );
};
