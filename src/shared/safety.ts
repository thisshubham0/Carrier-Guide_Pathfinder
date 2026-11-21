import type { RegionCode } from './types.ts';

export interface CrisisHelpline {
  region: string;
  name: string;
  contact: string;
  note: string;
}

export const CRISIS_HELPLINES: Record<RegionCode, CrisisHelpline[]> = {
  in: [
    {
      region: 'India',
      name: 'Tele-MANAS (Govt. of India 24x7 Mental Health)',
      contact: 'Call 14416 or 1-800-891-4416',
      note: 'Free, confidential support in multiple Indian languages.',
    },
    {
      region: 'India',
      name: 'KIRAN Mental Health Helpline',
      contact: 'Call 1800-599-0019',
      note: '24x7 free national helpline.',
    },
    {
      region: 'International',
      name: 'Find A Helpline',
      contact: 'https://findahelpline.com',
      note: 'Free, confidential local helplines worldwide.',
    },
  ],
  us: [
    {
      region: 'United States',
      name: '988 Suicide & Crisis Lifeline',
      contact: 'Call or text 988',
      note: 'Free, confidential 24/7 support in English and Spanish.',
    },
    {
      region: 'United States',
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      note: 'Free 24/7 text support with a trained crisis counselor.',
    },
    {
      region: 'International',
      name: 'Find A Helpline',
      contact: 'https://findahelpline.com',
      note: 'Free, confidential local helplines worldwide.',
    },
  ],
  global: [
    {
      region: 'Worldwide',
      name: 'Find A Helpline (International Directory)',
      contact: 'https://findahelpline.com',
      note: 'Free, confidential local crisis lines in 130+ countries.',
    },
    {
      region: 'India',
      name: 'Tele-MANAS (24x7)',
      contact: 'Call 14416 or 1-800-891-4416',
      note: 'Free multilingual support across India.',
    },
    {
      region: 'United States & Canada',
      name: '988 Suicide & Crisis Lifeline',
      contact: 'Call or text 988',
      note: 'Free, confidential 24/7 phone and text support.',
    },
  ],
};

const DISTRESS_PATTERNS: RegExp[] = [
  /\b(kill myself|end my life|want to die|wanna die|wish i was dead|wish i were dead)\b/i,
  /\b(suicide|suicidal|self[- ]?harm|cut myself|hurt myself|overdose)\b/i,
  /\b(no reason to live|better off dead|can'?t go on anymore|give up on life|life is pointless|totally hopeless|nothing matters anymore)\b/i,
  /\b(jeena nahi|mar jana|marna chahta|marna chahti|khud ko khatam|aatmahatya)\b/i,
];

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+)?(system|previous)\s+(prompt|rules?|instructions?)/i,
  /reveal\s+(your\s+)?(system\s+prompt|hidden\s+instructions?|api\s+key)/i,
  /you\s+are\s+now\s+(a\s+)?(different|unrestricted|jailbroken|DAN)/i,
  /pretend\s+there\s+are\s+no\s+rules/i,
];

/**
 * Deterministic pre-LLM crisis / severe distress check.
 * Runs BEFORE any LLM call so career advice stops immediately and helpline resources surface.
 */
export function detectCrisisDistress(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return DISTRESS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildCrisisResponse(region: RegionCode): {
  content: string;
  helplines: CrisisHelpline[];
  next_step: string;
} {
  const helplines = CRISIS_HELPLINES[region] || CRISIS_HELPLINES.global;
  const lineList = helplines
    .map((h) => `- ${h.name} (${h.region}): ${h.contact} — ${h.note}`)
    .join('\n');

  return {
    content: [
      "I'm really sorry you're feeling this way, and I'm glad you spoke up. Right now, your safety and well-being matter far more than any career decision, so let's pause career planning for now.",
      '',
      'You do not have to carry this alone. Please reach out right away to a trusted adult in your life—like a parent, teacher, school counsellor, or relative—or contact a free, confidential helpline:',
      lineList,
      '',
      'If you are in immediate physical danger, please call your local emergency number or go to the nearest hospital right now.',
    ].join('\n'),
    helplines,
    next_step: 'Message or call a trusted adult or one of the free helplines above right now.',
  };
}

/**
 * Sanitizes student text to remove control chars, bound length, and neutralize
 * tag-breakout attempts before placing inside delimited data blocks.
 */
export function sanitizeUserText(input: unknown, maxLength = 800): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/<\/?student_input>/gi, '')
    .replace(/<\/?system>/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function containsPromptInjectionAttempt(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function wrapUntrustedStudentInput(text: string): string {
  const clean = sanitizeUserText(text, 800);
  return `<student_input>\n${clean}\n</student_input>`;
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
