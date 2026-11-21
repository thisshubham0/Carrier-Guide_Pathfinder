import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { loadCareers, loadResources, getCareerMap, getResourceMap } from './src/server/dataset.ts';
import {
  authenticateUser,
  createSession,
  createShareSnapshot,
  createUserAccount,
  deleteSession,
  deleteUserAndAllData,
  getAnalyticsSummary,
  getDb,
  getSessionUser,
  getShareSnapshot,
  loadUserState,
  recordAnalyticsEvent,
  saveUserState,
} from './src/server/db.ts';
import { generateHybridRecommendations, generateMentorChatReply } from './src/server/gemini.ts';
import { buildDeterministicRoadmap } from './src/shared/matching.ts';
import type { MentorMessage, QuizAnswers, RegionCode, StudentProfile } from './src/shared/types.ts';

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

// Simple in-memory per-IP rate limiter for AI endpoints
const rateBuckets = new Map<string, number[]>();
function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (rateBuckets.get(ip) ?? []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests right now. Please pause for a moment and try again.',
      });
      return;
    }
    recent.push(now);
    rateBuckets.set(ip, recent);
    next();
  };
}

const ProfileInputSchema = z.object({
  id: z.string().min(1).max(80),
  display_name: z.string().max(60),
  age_band: z.enum(['14-17', '18-21', '22-25']),
  under18_guardian_ack: z.boolean(),
  region: z.enum(['global', 'in', 'us']),
  language: z.enum(['en', 'hi']),
  education_level: z.enum([
    'high_school_early',
    'high_school_senior',
    'diploma_vocational',
    'undergraduate',
    'graduate_or_switcher',
  ]),
  stream_or_major: z.string().max(100),
  favorite_subjects: z.array(z.string().max(60)).max(20),
  interests: z.array(z.string().max(60)).max(20),
  current_skills: z.array(z.string().max(60)).max(30),
  strengths: z.array(z.string().max(60)).max(20),
  budget: z.enum(['free_only', 'low_budget', 'moderate', 'flexible']),
  time_horizon: z.enum(['under_6m', '6m_to_2y', '2y_to_4y', 'flexible']),
  location_preference: z.enum(['local_or_remote', 'willing_to_relocate', 'hands_on_local']),
  family_expectations: z.string().max(240),
  free_notes: z.string().max(400).optional(),
});

const QuizAnswersSchema = z.record(z.string().max(10), z.number().int().min(1).max(5));

const AuthBodySchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

async function startServer() {
  // Initialize SQLite tables & preload dataset cleanly
  getDb();
  loadCareers();
  loadResources();

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '512kb' }));

  // Basic security headers (preserving iframe preview compatibility)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Health & config
  app.get('/api/health', (_req, res) => {
    const defaultRegion = (process.env.PATHFINDER_DEFAULT_REGION as RegionCode) || 'global';
    res.json({
      ok: true,
      default_region: ['global', 'in', 'us'].includes(defaultRegion) ? defaultRegion : 'global',
      career_count: loadCareers().length,
      resource_count: loadResources().length,
    });
  });

  // 1. Career & Resource Catalog API
  app.get('/api/careers', (req, res) => {
    const sector = typeof req.query.sector === 'string' ? req.query.sector : '';
    const allCareers = loadCareers();
    const filtered = sector ? allCareers.filter((c) => c.sector === sector) : allCareers;
    res.json({
      careers: filtered,
      resources: loadResources(),
      total: filtered.length,
    });
  });

  // 2. Hybrid Recommendations API
  app.post('/api/recommendations', createRateLimiter(25, 60_000), async (req, res) => {
    const schema = z.object({
      profile: ProfileInputSchema,
      quizAnswers: QuizAnswersSchema,
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid profile or quiz payload.' });
      return;
    }

    try {
      const result = await generateHybridRecommendations(
        parsed.data.profile as StudentProfile,
        parsed.data.quizAnswers as QuizAnswers,
        loadCareers(),
        loadResources()
      );
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Could not generate recommendations right now.' });
    }
  });

  // 3. Personalized Roadmap API
  app.post('/api/roadmap', (req, res) => {
    const schema = z.object({
      profile: ProfileInputSchema,
      career_id: z.string().min(1).max(80),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid roadmap request.' });
      return;
    }

    const career = getCareerMap().get(parsed.data.career_id);
    if (!career) {
      res.status(404).json({ error: 'Career not found in dataset.' });
      return;
    }

    const roadmap = buildDeterministicRoadmap(
      parsed.data.profile as StudentProfile,
      career,
      getResourceMap()
    );
    res.json({ roadmap });
  });

  // 4. AI Career Mentor Chat API (rate-limited, crisis-screened, prompt-injection fenced)
  app.post('/api/mentor/chat', createRateLimiter(20, 60_000), async (req, res) => {
    const schema = z.object({
      message: z.string().min(1).max(800),
      history: z
        .array(
          z.object({
            id: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string().max(1200),
            created_at: z.string(),
          })
        )
        .max(20)
        .default([]),
      profile: ProfileInputSchema,
      topCareerIds: z.array(z.string().max(80)).max(8).default([]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please write a short question under 800 characters.' });
      return;
    }

    try {
      const result = await generateMentorChatReply({
        message: parsed.data.message,
        history: parsed.data.history as MentorMessage[],
        profile: parsed.data.profile as StudentProfile,
        topCareerIds: parsed.data.topCareerIds,
        careers: loadCareers(),
        resources: loadResources(),
      });
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Mentor is temporarily busy. Please try again in a moment.' });
    }
  });

  // 5. Optional Email + Password Sync Auth (never required to use the app)
  app.post('/api/auth/register', createRateLimiter(15, 60_000), (req, res) => {
    const parsed = AuthBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Use a valid email and a password of at least 8 characters.' });
      return;
    }
    try {
      const user = createUserAccount(parsed.data.email, parsed.data.password);
      const token = createSession(user.id);
      res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
        res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
        return;
      }
      res.status(500).json({ error: 'Could not create account right now.' });
    }
  });

  app.post('/api/auth/login', createRateLimiter(20, 60_000), (req, res) => {
    const parsed = AuthBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Enter a valid email and password.' });
      return;
    }
    const user = authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      res.status(401).json({ error: 'Email or password did not match.' });
      return;
    }
    const token = createSession(user.id);
    const savedState = loadUserState(user.id);
    res.json({ token, user: { id: user.id, email: user.email }, savedState });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) deleteSession(token);
    res.json({ ok: true });
  });

  // 6. Synced Profile Read / Save / One-Click Delete (Authenticated)
  app.get('/api/profile', (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Sign in required to load synced profile.' });
      return;
    }
    const user = getSessionUser(token);
    if (!user) {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }
    res.json({ user, state: loadUserState(user.id) });
  });

  app.put('/api/profile', (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Sign in required to sync profile.' });
      return;
    }
    const user = getSessionUser(token);
    if (!user) {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid sync payload.' });
      return;
    }
    saveUserState(user.id, req.body);
    res.json({ ok: true, synced_at: new Date().toISOString() });
  });

  app.delete('/api/profile', (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Sign in required.' });
      return;
    }
    const user = getSessionUser(token);
    if (!user) {
      res.status(401).json({ error: 'Session expired.' });
      return;
    }
    deleteUserAndAllData(user.id);
    res.json({ ok: true, deleted: true });
  });

  // 7. Shareable Read-Only Parent/Counsellor Snapshots (strictly excludes chat history)
  app.post('/api/share', createRateLimiter(20, 60_000), (req, res) => {
    const schema = z.object({
      snapshot: z.record(z.string(), z.unknown()),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid share snapshot.' });
      return;
    }
    const token = createShareSnapshot(parsed.data.snapshot);
    res.status(201).json({ token });
  });

  app.get('/api/share/:token', (req, res) => {
    const token = req.params.token;
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(token)) {
      res.status(400).json({ error: 'Invalid share link.' });
      return;
    }
    const snapshot = getShareSnapshot(token);
    if (!snapshot) {
      res.status(404).json({ error: 'This shared career summary was not found.' });
      return;
    }
    res.json({ snapshot });
  });

  // 8. PII-Free Success Metrics API
  app.post('/api/metrics', (req, res) => {
    const schema = z.object({
      event_type: z.enum([
        'onboarding_started',
        'onboarding_completed',
        'quiz_completed',
        'roadmap_generated',
        'roadmap_step_completed',
        'return_visit',
        'helpfulness_rated',
        'share_created',
      ]),
      anon_session_id: z.string().min(4).max(120),
      meta: z.record(z.string().max(40), z.union([z.string().max(60), z.number(), z.boolean()])).default({}),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid metric event.' });
      return;
    }
    recordAnalyticsEvent(parsed.data.event_type, parsed.data.anon_session_id, parsed.data.meta);
    res.status(201).json({ ok: true });
  });

  app.get('/api/metrics/summary', (_req, res) => {
    res.json({ counts: getAnalyticsSummary() });
  });

  const httpServer = http.createServer(app);

  // Mount Vite middleware in dev, or serve static dist/ in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PathFinder server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PathFinder server:', err);
  process.exit(1);
});
