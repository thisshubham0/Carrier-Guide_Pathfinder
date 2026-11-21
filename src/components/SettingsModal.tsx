import React, { useState } from 'react';
import { Cloud, Download, LogOut, Trash2, X } from 'lucide-react';
import type { LanguageCode, RegionCode } from '../shared/types.ts';
import { usePWAInstall } from '../hooks/usePWA.ts';

interface SettingsModalProps {
  region: RegionCode;
  language: LanguageCode;
  authUser: { id: string; email: string } | null;
  syncStatus: string | null;
  onChangeRegion: (r: RegionCode) => void;
  onChangeLanguage: (l: LanguageCode) => void;
  onAuthLogin: (email: string, password: string, mode: 'login' | 'register') => Promise<string | null>;
  onAuthLogout: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  onExportData: () => void;
  onDeleteAllData: () => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  region,
  language,
  authUser,
  syncStatus,
  onChangeRegion,
  onChangeLanguage,
  onAuthLogin,
  onAuthLogout,
  onSyncNow,
  onExportData,
  onDeleteAllData,
  onClose,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    const err = await onAuthLogin(email, password, authMode);
    setSubmitting(false);
    if (err) {
      setAuthError(err);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="settings-modal-title" className="font-display text-lg font-bold text-[#0F172A]">
              Privacy, Region &amp; Optional Sync
            </h2>
            <p className="text-xs text-[#475569]">
              PathFinder works 100% anonymously—sign in only if you want to sync across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#475569] hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Region & Language */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="settings-region" className="block text-xs font-semibold text-[#0F172A]">
              Region for salaries &amp; exams
            </label>
            <select
              id="settings-region"
              value={region}
              onChange={(e) => onChangeRegion(e.target.value as RegionCode)}
              className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A]"
            >
              <option value="global">Global (USD)</option>
              <option value="in">India (INR)</option>
              <option value="us">United States (USD)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-lang" className="block text-xs font-semibold text-[#0F172A]">
              Interface &amp; AI language
            </label>
            <select
              id="settings-lang"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A]"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* PWA Install Trigger */}
        {!isInstalled && isInstallable && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 flex items-center justify-between gap-3">
            <div className="text-xs text-[#0F172A]">
              <div className="font-semibold">Install PathFinder for offline access</div>
              <div className="text-[#475569]">Read your saved roadmap anytime without internet.</div>
            </div>
            <button
              type="button"
              onClick={install}
              className="min-h-[40px] rounded-lg bg-[#0F766E] px-3.5 text-xs font-semibold text-white hover:bg-[#115E59] whitespace-nowrap"
            >
              Install App
            </button>
          </div>
        )}

        {/* Optional Sync Account */}
        <section className="rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
              <Cloud className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
              <span>Optional Cross-Device Sync</span>
            </div>
            {authUser && (
              <button
                type="button"
                onClick={onAuthLogout}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F172A]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            )}
          </div>

          {authUser ? (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Signed in as <strong className="text-[#0F172A]">{authUser.email}</strong>.
                {syncStatus ? ` ${syncStatus}` : ''}
              </p>
              <button
                type="button"
                onClick={onSyncNow}
                className="min-h-[44px] w-full rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
              >
                Save &amp; Sync Roadmap Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`min-h-[36px] flex-1 rounded-md text-xs font-medium ${
                    authMode === 'login' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`min-h-[36px] flex-1 rounded-md text-xs font-medium ${
                    authMode === 'register' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
                  }`}
                >
                  Create Free Account
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-email" className="sr-only">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] px-3.5 text-sm text-[#0F172A]"
                />
                <label htmlFor="auth-password" className="sr-only">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ characters)"
                  className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] px-3.5 text-sm text-[#0F172A]"
                />
              </div>

              {authError && <p className="text-xs text-red-700">{authError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] w-full rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59] disabled:opacity-50"
              >
                {submitting
                  ? 'Please wait...'
                  : authMode === 'login'
                  ? 'Sign in & load saved plan'
                  : 'Create account & save plan'}
              </button>
            </form>
          )}
        </section>

        {/* Plain-language Privacy Controls: 1-Click Export & 1-Click Delete */}
        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold text-[#0F172A]">Your data rights</h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            We never sell student profiles, never train AI models on your private answers, and log usage only with anonymized hashes.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportData}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
              Export My Data (JSON)
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete All Data
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await onDeleteAllData();
                  setConfirmDelete(false);
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap"
              >
                Confirm Permanent Delete
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
