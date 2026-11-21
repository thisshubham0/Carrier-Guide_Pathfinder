import { z } from 'zod';

/**
 * Exact Recommendation JSON schema required by PathFinder specification.
 * Validated on every LLM response; on failure, server retries once and then
 * falls back cleanly to deterministic scoring.
 */
export const SkillGapItemSchema = z.object({
  skill: z.string().min(1).max(120),
  priority: z.enum(['now', 'next', 'later']),
  resource_ids: z.array(z.string().min(1).max(80)).max(6),
});

export const RecommendationMatchSchema = z.object({
  career_id: z.string().min(1).max(80),
  fit_score: z.number().min(0).max(100),
  reasons: z.array(z.string().min(4).max(280)).min(1).max(5),
  risks_or_tradeoffs: z.array(z.string().min(4).max(280)).min(1).max(4),
  skill_gaps: z.array(SkillGapItemSchema).max(10),
  next_step: z.string().min(4).max(240),
});

export const RecommendationPayloadSchema = z.object({
  matches: z.array(RecommendationMatchSchema).min(1).max(8),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(z.string().min(3).max(240)).max(8),
});

export type ValidatedRecommendationPayload = z.infer<typeof RecommendationPayloadSchema>;

/**
 * Validates both schema shape AND grounding (all career_ids and resource_ids must exist
 * in the real dataset so the LLM can never hallucinate fake careers or resources).
 */
export function validateGroundedRecommendation(
  raw: unknown,
  validCareerIds: Set<string>,
  validResourceIds: Set<string>
): { ok: true; data: ValidatedRecommendationPayload } | { ok: false; error: string } {
  const parsed = RecommendationPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }

  for (const match of parsed.data.matches) {
    if (!validCareerIds.has(match.career_id)) {
      return { ok: false, error: `Unknown career_id not in dataset: ${match.career_id}` };
    }
    for (const gap of match.skill_gaps) {
      for (const rid of gap.resource_ids) {
        if (!validResourceIds.has(rid)) {
          return { ok: false, error: `Unknown resource_id not in dataset: ${rid}` };
        }
      }
    }
  }

  return { ok: true, data: parsed.data };
}
