import React, { useState } from 'react';
import { ArrowRight, Compass, Globe, Lock, ShieldCheck, Download } from 'lucide-react';
import type { LanguageCode, RegionCode } from '../shared/types.ts';
import { t } from '../shared/i18n.ts';
import { usePWAInstall } from '../hooks/usePWA.ts';

interface WelcomeScreenProps {
  region: RegionCode;
  language: LanguageCode;
  hasExistingProgress: boolean;
  onChangeRegion: (r: RegionCode) => void;
  onChangeLanguage: (l: LanguageCode) => void;
  onStartAnonymous: () => void;
  onResumeExisting: () => void;
  onOpenAuthModal: () => void;
  careerCount: number;
}

const REGIONS: Array<{ code: RegionCode; label: string; currency: string }> = [
  { code: 'global', label: 'Global (USD)', currency: 'Baseline international ranges' },
  { code: 'in', label: 'India (INR)', currency: '₹ salaries, ITI/CUET/NSP routes' },
  { code: 'us', label: 'United States (USD)', currency: '$ salaries, Pell/Apprenticeship routes' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  region,
  language,
  hasExistingProgress,
  onChangeRegion,
  onChangeLanguage,
  onStartAnonymous,
  onResumeExisting,
  onOpenAuthModal,
  careerCount,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <main className="min-h-screen bg-[#F7F9FB] text-[#0F172A]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3.5 sm:gap-8 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <Compass className="h-5 w-5 text-[#0F766E]" aria-hidden="true" />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0F172A]">
              PathFinder
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Language">
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[36px] rounded-md px-2 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  language === 'en'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">English</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('hi')}
                className={`min-h-[36px] rounded-md px-2 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  language === 'hi'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[40px] sm:min-h-[44px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">Sync</span>
              <span className="hidden sm:inline">{t(language, 'cta.signIn')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Primary Editorial Hero */}
          <section className="lg:col-span-7 space-y-6">
            <p className="text-sm font-medium text-[#0F766E]">
              Free for students aged 14–25 · No counsellor or account required
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl leading-[1.15]">
              {t(language, 'welcome.headline')}
            </h1>
            <p className="max-w-2xl text-base text-[#475569] leading-relaxed sm:text-lg">
              {t(language, 'welcome.subtitle')}
            </p>

            {/* Region Selector */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                <Globe className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                <span>Choose your region for localized salaries &amp; education routes</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {REGIONS.map((item) => {
                  const active = region === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => onChangeRegion(item.code)}
                      aria-pressed={active}
                      className={`min-h-[56px] rounded-xl border p-3.5 text-left transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-teal-50/50 text-[#0F172A]'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="mt-0.5 text-xs text-[#475569]">{item.currency}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              {hasExistingProgress ? (
                <>
                  <button
                    type="button"
                    onClick={onResumeExisting}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors whitespace-nowrap"
                  >
                    Continue my saved plan
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onStartAnonymous}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Start fresh assessment
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onStartAnonymous}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors whitespace-nowrap"
                >
                  {t(language, 'cta.startAnonymous')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              {!isInstalled && isInstallable && (
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Download className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  Install offline app
                </button>
              )}

              {!isInstalled && !isInstallable && isIOS && (
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Download className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  Save to Home Screen
                </button>
              )}
            </div>

            <div className="flex items-start gap-2.5 pt-2 text-xs text-[#475569] leading-relaxed">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
              <p>{t(language, 'welcome.privacyNote')}</p>
            </div>
          </section>

          {/* Right Column: What You Get in 10 Minutes */}
          <aside className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0F172A]">
                How PathFinder works
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                Grounded in {careerCount || 42} verified careers across 8 sectors—from software and nursing to solar, skilled trades, and agriculture.
              </p>
            </div>

            <ol className="space-y-4 text-sm">
              <li className="border-b border-slate-100 pb-3.5">
                <div className="font-semibold text-[#0F172A]">01. Quick profile (3 mins)</div>
                <p className="mt-0.5 text-[#475569]">
                  Share your education level, subjects, budget, and timeline—skip anything you are unsure about.
                </p>
              </li>
              <li className="border-b border-slate-100 pb-3.5">
                <div className="font-semibold text-[#0F172A]">02. Transparent interest check (5 mins)</div>
                <p className="mt-0.5 text-[#475569]">
                  24 practical everyday tasks scored openly across 6 RIASEC work styles—zero black-box claims.
                </p>
              </li>
              <li className="border-b border-slate-100 pb-3.5">
                <div className="font-semibold text-[#0F172A]">03. Ranked matches &amp; skill gaps</div>
                <p className="mt-0.5 text-[#475569]">
                  See honest fit scores, trade-offs, local pay ranges, and what to learn now, next, or later.
                </p>
              </li>
              <li>
                <div className="font-semibold text-[#0F172A]">04. Phased roadmap &amp; parent share</div>
                <p className="mt-0.5 text-[#475569]">
                  Follow a 30-day, 6-month, and 2-year checklist of free resources that works offline, plus ask the AI mentor anytime.
                </p>
              </li>
            </ol>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-xs text-[#475569]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
              <span>
                Every career card shows its data source and last-verified date. We show options and trade-offs—never false guarantees.
              </span>
            </div>
          </aside>
        </div>
      </div>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
            <h3 id="ios-install-title" className="font-display text-lg font-semibold text-[#0F172A]">
              Install PathFinder on iPhone / iPad
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              1. Tap the <strong>Share</strong> icon in Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong> so your saved roadmap opens offline anytime.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="min-h-[44px] w-full rounded-xl bg-[#0F766E] py-2.5 text-sm font-medium text-white hover:bg-[#115E59]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
