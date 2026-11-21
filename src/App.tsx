import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Map as MapIcon,
  MessageSquare,
  Scale,
  Settings,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import type {
  Career,
  LearningResource,
  MentorMessage,
  ProgressState,
  RegionCode,
  ShareSnapshotPayload,
  StudentProfile,
} from './shared/types.ts';
import { computeRiasecScores } from './shared/riasec.ts';
import {
  buildDeterministicRecommendations,
  buildDeterministicRoadmap,
  getAffordableRoutes,
} from './shared/matching.ts';
import { t } from './shared/i18n.ts';
import { useOnlineStatus } from './hooks/usePWA.ts';
import {
  clearLocalState,
  createDemoAutostartState,
  createEmptyState,
  loadCatalogCache,
  loadLocalState,
  saveCatalogCache,
  saveLocalState,
  toggleStepInProgress,
  trackMetric,
  type PersistedAppState,
} from './utils/storage.ts';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { OnboardingFlow } from './components/OnboardingFlow.tsx';
import { RiasecQuiz } from './components/RiasecQuiz.tsx';
import { MatchesHub } from './components/MatchesHub.tsx';
import { RoadmapWorkspace } from './components/RoadmapWorkspace.tsx';
import { CompareView } from './components/CompareView.tsx';
import { MentorChat } from './components/MentorChat.tsx';
import { ShareSummaryView } from './components/ShareSummaryView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

type AppStage = 'welcome' | 'onboarding' | 'quiz' | 'workspace';
type WorkspaceTab = 'matches' | 'roadmap' | 'compare' | 'mentor';

export default function App() {
  const isOnline = useOnlineStatus();

  const [careers, setCareers] = useState<Career[]>(() => loadCatalogCache()?.careers ?? []);
  const [resources, setResources] = useState<LearningResource[]>(
    () => loadCatalogCache()?.resources ?? []
  );

  const [state, setState] = useState<PersistedAppState>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return createDemoAutostartState('in');
    }
    return loadLocalState() ?? createEmptyState('global');
  });

  const [stage, setStage] = useState<AppStage>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'workspace';
    const saved = loadLocalState();
    if (saved?.quizComplete) return 'workspace';
    return 'welcome';
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('matches');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [prefillMentorQ, setPrefillMentorQ] = useState<string | null>(null);

  // Optional sync auth held strictly in JS/React memory (never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Standalone shared snapshot viewer (?share=<token>)
  const [sharedSnapshot, setSharedSnapshot] = useState<ShareSnapshotPayload | null>(null);
  const [shareLoadError, setShareLoadError] = useState<string | null>(null);
  const [loadingSharePage, setLoadingSharePage] = useState(false);

  // Check for ?share=token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) return;
    setLoadingSharePage(true);
    fetch(`/api/share/${encodeURIComponent(shareToken)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Summary link not found.');
        setSharedSnapshot(d.snapshot as ShareSnapshotPayload);
      })
      .catch((err) => {
        setShareLoadError(err instanceof Error ? err.message : 'Could not load shared summary.');
      })
      .finally(() => setLoadingSharePage(false));
  }, []);

  // Load 42-career & 35-resource catalog from server (with offline cache fallback)
  useEffect(() => {
    fetch('/api/careers')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Catalog fetch failed'))))
      .then((data: { careers: Career[]; resources: LearningResource[] }) => {
        setCareers(data.careers);
        setResources(data.resources);
        saveCatalogCache(data.careers, data.resources);
      })
      .catch(() => {
        // Offline cache already loaded in initial state
      });
  }, []);

  // Persist local state whenever it updates
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // Record anonymized return visit if returning on a new day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastVisitDate && state.lastVisitDate !== today) {
      trackMetric('return_visit', state.profile.id, { region: state.profile.region });
      setState((prev) => ({ ...prev, lastVisitDate: today }));
    }
  }, [state.lastVisitDate, state.profile.id, state.profile.region]);

  const careersById = useMemo(() => new Map(careers.map((c) => [c.id, c])), [careers]);
  const resourcesById = useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources]);

  const riasecResult = useMemo(
    () => computeRiasecScores(state.quizAnswers),
    [state.quizAnswers]
  );

  // Compute instant deterministic recommendations first, then refine asynchronously via backend Gemini endpoint
  const fetchRecommendations = useCallback(
    async (profileToUse: StudentProfile, answersToUse: PersistedAppState['quizAnswers']) => {
      if (careers.length === 0) return;
      setMatchError(null);

      // Immediate zero-latency deterministic baseline so mid-range/low-bandwidth phones render right away
      const baseline = buildDeterministicRecommendations(profileToUse, answersToUse, careers, 6);
      const baselineFirstId = baseline.payload.matches[0]?.career_id ?? null;
      setState((prev) => ({
        ...prev,
        recommendations: prev.recommendations ?? baseline.payload,
        selectedCareerId: prev.selectedCareerId || baselineFirstId,
        compareIds:
          prev.compareIds.length > 0
            ? prev.compareIds
            : baseline.payload.matches.slice(0, 2).map((m) => m.career_id),
      }));

      setLoadingMatches(true);
      try {
        const resp = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: profileToUse, quizAnswers: answersToUse }),
        });
        if (!resp.ok) throw new Error('Server matching unavailable');
        const data = await resp.json();
        const firstId = data.payload?.matches?.[0]?.career_id ?? baselineFirstId;
        setState((prev) => ({
          ...prev,
          recommendations: data.payload,
          selectedCareerId: prev.selectedCareerId || firstId,
          compareIds:
            prev.compareIds.length > 0
              ? prev.compareIds
              : data.payload.matches.slice(0, 2).map((m: { career_id: string }) => m.career_id),
        }));
        trackMetric('roadmap_generated', profileToUse.id, {
          mode: data.payload?.engine_mode || 'hybrid_llm',
          confidence: data.payload?.confidence || 'medium',
        });
      } catch {
        // Baseline deterministic payload is already displayed cleanly
      } finally {
        setLoadingMatches(false);
      }
    },
    [careers]
  );

  // Trigger recommendation synthesis whenever entering workspace with missing matches
  useEffect(() => {
    if (stage === 'workspace' && careers.length > 0 && !state.recommendations && !loadingMatches) {
      fetchRecommendations(state.profile, state.quizAnswers);
    }
  }, [stage, careers.length, state.recommendations, state.profile, state.quizAnswers, loadingMatches, fetchRecommendations]);

  const updateProfile = (patch: Partial<StudentProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  };

  const handleChangeRegion = (region: RegionCode) => {
    updateProfile({ region });
  };

  const handleStartFresh = () => {
    const fresh = createEmptyState(state.profile.region);
    fresh.profile.language = state.profile.language;
    setState(fresh);
    setStage('onboarding');
    trackMetric('onboarding_started', fresh.profile.id, { region: fresh.profile.region });
  };

  const handleCompleteOnboarding = () => {
    setState((prev) => ({ ...prev, onboardingComplete: true }));
    setStage('quiz');
    trackMetric('onboarding_completed', state.profile.id, {
      budget: state.profile.budget,
      age_band: state.profile.age_band,
    });
  };

  const handleCompleteQuiz = () => {
    setState((prev) => ({ ...prev, quizComplete: true, recommendations: null }));
    setStage('workspace');
    setActiveTab('matches');
    trackMetric('quiz_completed', state.profile.id, {
      answered: Object.keys(state.quizAnswers).length,
    });
    fetchRecommendations(state.profile, state.quizAnswers);
  };

  const handleSwitchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const handleOpenRoadmap = (careerId: string) => {
    setState((prev) => ({ ...prev, selectedCareerId: careerId }));
    setActiveTab('roadmap');
    window.scrollTo({ top: 0 });
  };

  const handleToggleCompare = (careerId: string) => {
    setState((prev) => {
      if (prev.compareIds.includes(careerId)) {
        return { ...prev, compareIds: prev.compareIds.filter((id) => id !== careerId) };
      }
      const next = [...prev.compareIds, careerId].slice(-3);
      return { ...prev, compareIds: next };
    });
  };

  const handleToggleStep = (stepId: string) => {
    setState((prev) => {
      const nextProgress = toggleStepInProgress(prev.progress, stepId);
      if (nextProgress.completed_step_ids.length > prev.progress.completed_step_ids.length) {
        trackMetric('roadmap_step_completed', prev.profile.id, {
          total_done: nextProgress.completed_step_ids.length,
        });
      }
      return { ...prev, progress: nextProgress };
    });
  };

  const handleRateHelpfulness = (rating: 'yes' | 'somewhat' | 'no') => {
    setState((prev) => ({
      ...prev,
      progress: { ...prev.progress, helpfulness_rating: rating },
    }));
    trackMetric('helpfulness_rated', state.profile.id, { rating });
  };

  const matchesById = useMemo(() => {
    const map = new Map<string, NonNullable<PersistedAppState['recommendations']>['matches'][number]>();
    for (const m of state.recommendations?.matches ?? []) {
      map.set(m.career_id, m);
    }
    return map;
  }, [state.recommendations]);

  const matchedCareersList = useMemo(() => {
    return (state.recommendations?.matches ?? [])
      .map((m) => careersById.get(m.career_id))
      .filter((c): c is Career => Boolean(c));
  }, [state.recommendations, careersById]);

  const activeCareer = useMemo(() => {
    if (state.selectedCareerId && careersById.has(state.selectedCareerId)) {
      return careersById.get(state.selectedCareerId)!;
    }
    return matchedCareersList[0] ?? null;
  }, [state.selectedCareerId, careersById, matchedCareersList]);

  const activeRoadmap = useMemo(() => {
    if (!activeCareer) return null;
    return buildDeterministicRoadmap(state.profile, activeCareer, resourcesById);
  }, [activeCareer, state.profile, resourcesById]);

  const buildShareSnapshot = (): ShareSnapshotPayload => {
    const topMatches = (state.recommendations?.matches ?? []).slice(0, 5).map((m) => {
      const c = careersById.get(m.career_id);
      const affordable = c ? getAffordableRoutes(c, state.profile.budget)[0] : null;
      return {
        career_id: m.career_id,
        title: c?.title ?? m.career_id,
        sector: c?.sector ?? '',
        fit_score: m.fit_score,
        salary_formatted:
          c?.salary_by_region[state.profile.region]?.formatted ??
          c?.salary_by_region.global.formatted ??
          'Data unavailable',
        demand: c?.growth_outlook.label ?? '',
        reasons: m.reasons,
        risks_or_tradeoffs: m.risks_or_tradeoffs,
        next_step: m.next_step,
        affordable_route: affordable ? `${affordable.title} (${affordable.duration})` : 'See pathways',
        source: c?.source ?? 'PathFinder Dataset',
        last_verified: c?.last_verified ?? '2026-10-15',
      };
    });

    return {
      created_at: new Date().toISOString(),
      region: state.profile.region,
      student_first_name: state.profile.display_name,
      age_band: state.profile.age_band,
      education_level: state.profile.education_level,
      budget: state.profile.budget,
      top_riasec: riasecResult.topCodes,
      riasec_scores: riasecResult.scores,
      confidence: state.recommendations?.confidence ?? 'medium',
      assumptions: state.recommendations?.assumptions ?? [],
      top_matches: topMatches,
      focused_career_roadmap: activeRoadmap
        ? {
            career_title: activeRoadmap.career_title,
            days_30_steps: activeRoadmap.steps
              .filter((s) => s.phase === 'days_30')
              .map((s) => s.title),
            completed_count: activeRoadmap.steps.filter((s) =>
              state.progress.completed_step_ids.includes(s.id)
            ).length,
            total_count: activeRoadmap.steps.length,
          }
        : undefined,
    };
  };

  const handleCreateShareLink = async (): Promise<string | null> => {
    const snapshot = buildShareSnapshot();
    const resp = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Could not create share link');
    trackMetric('share_created', state.profile.id, { region: state.profile.region });
    return data.token as string;
  };

  // Optional Auth & Sync handlers (Bearer token kept strictly in React memory)
  const handleAuthLogin = async (
    email: string,
    password: string,
    mode: 'login' | 'register'
  ): Promise<string | null> => {
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) return data.error || 'Authentication failed.';
      setAuthToken(data.token);
      setAuthUser(data.user);
      if (mode === 'login' && data.savedState) {
        setState(data.savedState as PersistedAppState);
        if (data.savedState.quizComplete) setStage('workspace');
        setSyncStatus('Loaded your synced roadmap.');
      } else {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify(state),
        });
        setSyncStatus('Account created and current plan synced.');
      }
      return null;
    } catch {
      return 'Could not reach server. Please check your connection.';
    }
  };

  const handleAuthLogout = async () => {
    if (authToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setAuthToken(null);
    setAuthUser(null);
    setSyncStatus(null);
  };

  const handleSyncNow = async () => {
    if (!authToken) return;
    setSyncStatus('Syncing...');
    try {
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(state),
      });
      setSyncStatus(resp.ok ? 'Synced just now.' : 'Sync failed.');
    } catch {
      setSyncStatus('Offline — saved locally on device.');
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pathfinder-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    if (authToken) {
      await fetch('/api/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
      setAuthToken(null);
      setAuthUser(null);
    }
    clearLocalState();
    setState(createEmptyState('global'));
    setStage('welcome');
    setShowSettings(false);
  };

  // Standalone Parent Share Route (?share=<token>)
  if (loadingSharePage) {
    return (
      <main className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6 text-sm text-[#475569]">
        Loading shared career summary...
      </main>
    );
  }
  if (shareLoadError) {
    return (
      <main className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center space-y-3">
          <h1 className="font-display text-lg font-bold text-[#0F172A]">Summary not found</h1>
          <p className="text-sm text-[#475569]">{shareLoadError}</p>
          <a
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white"
          >
            Go to PathFinder
          </a>
        </div>
      </main>
    );
  }
  if (sharedSnapshot) {
    return <ShareSummaryView snapshot={sharedSnapshot} isStandaloneSharePage />;
  }

  return (
    <>
      {/* Offline Connectivity Notice */}
      {!isOnline && (
        <div
          role="status"
          className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-[#B45309] flex items-center justify-center gap-2"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t(state.profile.language, 'offline.banner')}</span>
        </div>
      )}

      {stage === 'welcome' && (
        <WelcomeScreen
          region={state.profile.region}
          language={state.profile.language}
          hasExistingProgress={state.onboardingComplete || state.quizComplete}
          onChangeRegion={handleChangeRegion}
          onChangeLanguage={(language) => updateProfile({ language })}
          onStartAnonymous={handleStartFresh}
          onResumeExisting={() =>
            setStage(state.quizComplete ? 'workspace' : state.onboardingComplete ? 'quiz' : 'onboarding')
          }
          onOpenAuthModal={() => setShowSettings(true)}
          careerCount={careers.length}
        />
      )}

      {stage === 'onboarding' && (
        <OnboardingFlow
          profile={state.profile}
          onUpdateProfile={updateProfile}
          onComplete={handleCompleteOnboarding}
          onExit={() => setStage('welcome')}
        />
      )}

      {stage === 'quiz' && (
        <RiasecQuiz
          answers={state.quizAnswers}
          language={state.profile.language}
          onChangeAnswer={(qid, val) =>
            setState((prev) => ({
              ...prev,
              quizAnswers: { ...prev.quizAnswers, [qid]: val },
            }))
          }
          onBackToOnboarding={() => setStage('onboarding')}
          onComplete={handleCompleteQuiz}
        />
      )}

      {stage === 'workspace' && (
        <div className="min-h-screen bg-[#F7F9FB] pb-20 md:pb-10">
          {/* Desktop 3-Zone Top Bar Contract / Compact Mobile Top Bar */}
          <header className="no-print sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
              {/* Zone 1: Single-line Brand Wordmark */}
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
              >
                <Compass className="h-5 w-5 text-[#0F766E]" aria-hidden="true" />
                <span>PathFinder</span>
              </button>

              {/* Zone 2: 4 Clean Single-Line Nav Links (Desktop) */}
              <nav
                aria-label="Primary navigation"
                className="hidden md:flex items-center gap-6 text-sm font-medium"
              >
                {(
                  [
                    ['matches', t(state.profile.language, 'nav.matches')],
                    ['roadmap', t(state.profile.language, 'nav.roadmap')],
                    ['compare', t(state.profile.language, 'nav.compare')],
                    ['mentor', t(state.profile.language, 'nav.mentor')],
                  ] as Array<[WorkspaceTab, string]>
                ).map(([tabKey, label]) => {
                  const active = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => handleSwitchTab(tabKey)}
                      aria-current={active ? 'page' : undefined}
                      className={`min-h-[44px] border-b-2 px-1 text-sm transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'border-[#0F766E] font-semibold text-[#0F766E]'
                          : 'border-transparent text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>

              {/* Zone 3: 1 Primary Action */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Settings className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  <span>{t(state.profile.language, 'nav.settings')}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Responsive Workspace Container */}
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            {activeTab === 'matches' && (
              <MatchesHub
                profile={state.profile}
                riasecScores={riasecResult.scores}
                topCodes={riasecResult.topCodes}
                recommendations={state.recommendations}
                careersById={careersById}
                compareIds={state.compareIds}
                loading={(loadingMatches || careers.length === 0) && !state.recommendations && !matchError}
                error={matchError}
                onRetry={() => fetchRecommendations(state.profile, state.quizAnswers)}
                onOpenRoadmap={handleOpenRoadmap}
                onToggleCompare={handleToggleCompare}
                onOpenCompare={() => handleSwitchTab('compare')}
                onOpenShare={() => setShowShareModal(true)}
                onRetakeQuiz={() => setStage('quiz')}
                onChangeRegion={handleChangeRegion}
              />
            )}

            {activeTab === 'roadmap' && (
              <RoadmapWorkspace
                profile={state.profile}
                career={activeCareer}
                match={activeCareer ? matchesById.get(activeCareer.id) ?? null : null}
                roadmap={activeRoadmap}
                allMatchedCareers={matchedCareersList.length > 0 ? matchedCareersList : careers}
                resourcesById={resourcesById}
                progress={state.progress}
                onSelectCareer={(cid) => setState((prev) => ({ ...prev, selectedCareerId: cid }))}
                onToggleStep={handleToggleStep}
                onChangeReminder={(freq: ProgressState['reminder_frequency']) =>
                  setState((prev) => ({
                    ...prev,
                    progress: { ...prev.progress, reminder_frequency: freq },
                  }))
                }
                onRateHelpfulness={handleRateHelpfulness}
                onAskMentorAboutCareer={(title) => {
                  setPrefillMentorQ(
                    `What are the most realistic first steps and trade-offs for ${title} given my budget?`
                  );
                  setActiveTab('mentor');
                }}
              />
            )}

            {activeTab === 'compare' && (
              <CompareView
                profile={state.profile}
                compareIds={state.compareIds}
                careers={careers}
                matchesById={matchesById}
                onToggleCompare={handleToggleCompare}
                onOpenRoadmap={handleOpenRoadmap}
              />
            )}

            {activeTab === 'mentor' && (
              <MentorChat
                profile={state.profile}
                messages={state.mentorHistory}
                topCareers={matchedCareersList}
                prefillQuestion={prefillMentorQ}
                onClearPrefill={() => setPrefillMentorQ(null)}
                onAppendMessages={(newMsgs: MentorMessage[]) =>
                  setState((prev) => ({
                    ...prev,
                    mentorHistory: [...prev.mentorHistory, ...newMsgs].slice(-40),
                  }))
                }
              />
            )}
          </main>

          {/* Mobile Fixed Bottom Thumb-Zone Tab Bar (56px height -> header+footer <= 15% of 844px mobile height) */}
          <nav
            aria-label="Mobile navigation"
            className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md md:hidden"
          >
            <div className="grid h-14 grid-cols-4 items-center">
              {(
                [
                  ['matches', t(state.profile.language, 'nav.matches'), Sparkles],
                  ['roadmap', t(state.profile.language, 'nav.roadmap'), MapIcon],
                  ['compare', t(state.profile.language, 'nav.compare'), Scale],
                  ['mentor', t(state.profile.language, 'nav.mentor'), MessageSquare],
                ] as Array<[WorkspaceTab, string, React.ComponentType<{ className?: string }>]>
              ).map(([tabKey, label, Icon]) => {
                const active = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => handleSwitchTab(tabKey)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                      active ? 'text-[#0F766E] font-semibold' : 'text-[#475569]'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {showShareModal && (
        <ShareSummaryView
          snapshot={buildShareSnapshot()}
          onClose={() => setShowShareModal(false)}
          onCreateShareLink={handleCreateShareLink}
        />
      )}

      {showSettings && (
        <SettingsModal
          region={state.profile.region}
          language={state.profile.language}
          authUser={authUser}
          syncStatus={syncStatus}
          onChangeRegion={handleChangeRegion}
          onChangeLanguage={(language) => updateProfile({ language })}
          onAuthLogin={handleAuthLogin}
          onAuthLogout={handleAuthLogout}
          onSyncNow={handleSyncNow}
          onExportData={handleExportData}
          onDeleteAllData={handleDeleteAllData}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
