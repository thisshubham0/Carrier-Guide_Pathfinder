import type { QuizAnswers, RiasecLetter, RiasecScores } from './types.ts';

export interface RiasecQuestion {
  id: string;
  dimension: RiasecLetter;
  text: string;
  hi_text: string;
  example: string;
}

export const RIASEC_META: Record<
  RiasecLetter,
  { name: string; short: string; description: string }
> = {
  R: {
    name: 'Realistic (Hands-On)',
    short: 'Hands-On',
    description: 'Enjoy working with tools, machines, plants, animals, or physical systems.',
  },
  I: {
    name: 'Investigative (Analytical)',
    short: 'Analytical',
    description: 'Enjoy solving puzzles, investigating how things work, and working with data or science.',
  },
  A: {
    name: 'Artistic (Creative)',
    short: 'Creative',
    description: 'Enjoy designing, writing, editing media, or expressing original ideas.',
  },
  S: {
    name: 'Social (Helping)',
    short: 'Helping',
    description: 'Enjoy teaching, caring for people, listening, or strengthening communities.',
  },
  E: {
    name: 'Enterprising (Leading)',
    short: 'Leading',
    description: 'Enjoy organizing people, persuading others, starting projects, or running operations.',
  },
  C: {
    name: 'Conventional (Structured)',
    short: 'Structured',
    description: 'Enjoy organizing records, checking accuracy, following clear systems, and managing budgets.',
  },
};

/**
 * 24-question transparent RIASEC interest & aptitude inventory (4 questions per dimension).
 * Written at roughly a Grade 8 reading level, free of gender/class/region assumptions.
 */
export const RIASEC_QUESTIONS: RiasecQuestion[] = [
  // Realistic (4)
  {
    id: 'r1',
    dimension: 'R',
    text: 'Fix a broken appliance, bicycle, or piece of equipment using tools.',
    hi_text: 'उपकरणों से टूटी हुई मशीन, साइकिल या उपकरण ठीक करना।',
    example: 'Hands-on troubleshooting',
  },
  {
    id: 'r2',
    dimension: 'R',
    text: 'Install, wire, or test physical systems like solar panels, computers, or sensors.',
    hi_text: 'सोलर पैनल, कंप्यूटर या सेंसर जैसे सिस्टम लगाना और जांचना।',
    example: 'Practical building',
  },
  {
    id: 'r3',
    dimension: 'R',
    text: 'Work outdoors or in a workshop, lab, or farm rather than sitting at a desk all day.',
    hi_text: 'पूरे दिन डेस्क पर बैठने के बजाय बाहर, वर्कशॉप, लैब या खेत में काम करना।',
    example: 'Active workspace',
  },
  {
    id: 'r4',
    dimension: 'R',
    text: 'Measure, cut, assemble, or inspect physical materials with careful accuracy.',
    hi_text: 'सटीकता के साथ सामग्री को मापना, जोड़ना या जांचना।',
    example: 'Craft & precision',
  },

  // Investigative (4)
  {
    id: 'i1',
    dimension: 'I',
    text: 'Figure out why a math problem, computer bug, or experiment went wrong.',
    hi_text: 'यह समझना कि गणित, कंप्यूटर कोड या प्रयोग में गलती कहाँ हुई।',
    example: 'Root-cause problem solving',
  },
  {
    id: 'i2',
    dimension: 'I',
    text: 'Look at numbers, charts, or test results to spot patterns and draw conclusions.',
    hi_text: 'पैटर्न खोजने के लिए संख्याओं, चार्ट या टेस्ट रिपोर्ट का विश्लेषण करना।',
    example: 'Data & evidence',
  },
  {
    id: 'i3',
    dimension: 'I',
    text: 'Read or watch explainers to understand how science, medicine, or technology works.',
    hi_text: 'विज्ञान, चिकित्सा या तकनीक कैसे काम करती है, यह गहराई से सीखना।',
    example: 'Curiosity & research',
  },
  {
    id: 'i4',
    dimension: 'I',
    text: 'Design a step-by-step test to compare two solutions before picking the better one.',
    hi_text: 'बेहतर विकल्प चुनने के लिए दो तरीकों का परीक्षण करना।',
    example: 'Logical testing',
  },

  // Artistic (4)
  {
    id: 'a1',
    dimension: 'A',
    text: 'Design a poster, logo, app screen, or layout so it looks clear and appealing.',
    hi_text: 'पोस्टर, लोगो या ऐप स्क्रीन को सुंदर और स्पष्ट तरीके से डिज़ाइन करना।',
    example: 'Visual design',
  },
  {
    id: 'a2',
    dimension: 'A',
    text: 'Write stories, explain complex ideas simply, or edit video and audio clips.',
    hi_text: 'कहानियाँ लिखना, कठिन बातों को सरल लिखना, या वीडियो/ऑडियो एडिट करना।',
    example: 'Storytelling & media',
  },
  {
    id: 'a3',
    dimension: 'A',
    text: 'Brainstorm fresh ways to present an idea when there is no single right answer.',
    hi_text: 'जब एक सही उत्तर न हो, तब नए रचनात्मक तरीके सोचना।',
    example: 'Open-ended creativity',
  },
  {
    id: 'a4',
    dimension: 'A',
    text: 'Notice details like color balance, spacing, sound clarity, or wording flow.',
    hi_text: 'रंग, लेआउट, आवाज़ की स्पष्टता या भाषा के प्रवाह पर ध्यान देना।',
    example: 'Aesthetic craft',
  },

  // Social (4)
  {
    id: 's1',
    dimension: 'S',
    text: 'Help a younger student, classmate, or family member understand a tough topic.',
    hi_text: 'किसी छात्र, सहपाठी या परिवार के सदस्य को कठिन विषय समझाना।',
    example: 'Teaching & explaining',
  },
  {
    id: 's2',
    dimension: 'S',
    text: 'Listen patiently when someone is worried and help them find practical support.',
    hi_text: 'किसी की परेशानी धैर्य से सुनना और सही मदद ढूँढने में साथ देना।',
    example: 'Empathy & care',
  },
  {
    id: 's3',
    dimension: 'S',
    text: 'Care for people’s health, recovery, or daily well-being in a calm, respectful way.',
    hi_text: 'लोगों के स्वास्थ्य या देखभाल में शांत और सम्मानजनक तरीके से मदद करना।',
    example: 'Health & support',
  },
  {
    id: 's4',
    dimension: 'S',
    text: 'Work with a community group, school club, or team to solve a local problem.',
    hi_text: 'स्थानीय समस्या सुलझाने के लिए समुदाय या टीम के साथ काम करना।',
    example: 'Community impact',
  },

  // Enterprising (4)
  {
    id: 'e1',
    dimension: 'E',
    text: 'Coordinate a group project, assign tasks, and keep everyone moving on schedule.',
    hi_text: 'टीम प्रोजेक्ट का नेतृत्व करना और समय पर काम पूरा करवाना।',
    example: 'Team coordination',
  },
  {
    id: 'e2',
    dimension: 'E',
    text: 'Explain the value of an idea, product, or service to convince people to try it.',
    hi_text: 'किसी विचार या उत्पाद के लाभ समझाकर लोगों को सहमत करना।',
    example: 'Communication & persuasion',
  },
  {
    id: 'e3',
    dimension: 'E',
    text: 'Spot a gap in a local market or school and plan how to start a small venture.',
    hi_text: 'स्थानीय ज़रूरत पहचानकर छोटा व्यवसाय या पहल शुरू करने की योजना बनाना।',
    example: 'Initiative & business',
  },
  {
    id: 'e4',
    dimension: 'E',
    text: 'Make practical decisions under time pressure and negotiate fair outcomes.',
    hi_text: 'समय की कमी में व्यावहारिक निर्णय लेना और सही समझौता करना।',
    example: 'Decision making',
  },

  // Conventional (4)
  {
    id: 'c1',
    dimension: 'C',
    text: 'Keep track of budgets, expenses, schedules, or spreadsheets without missing details.',
    hi_text: 'बजट, खर्च, समय-सारिणी या स्प्रेडशीट को सटीक तरीके से संभालना।',
    example: 'Numbers & organization',
  },
  {
    id: 'c2',
    dimension: 'C',
    text: 'Check forms, rules, safety checklists, or documents to catch small mistakes.',
    hi_text: 'गलतियाँ पकड़ने के लिए फॉर्म, नियम या सेफ्टी चेकलिस्ट की जांच करना।',
    example: 'Quality & accuracy',
  },
  {
    id: 'c3',
    dimension: 'C',
    text: 'Follow a clear, reliable step-by-step system so work is predictable and neat.',
    hi_text: 'स्पष्ट और व्यवस्थित प्रक्रिया का पालन करके काम को सही ढंग से पूरा करना।',
    example: 'Reliable processes',
  },
  {
    id: 'c4',
    dimension: 'C',
    text: 'Organize digital files, records, inventory, or databases so anyone can find them fast.',
    hi_text: 'फ़ाइलें, रिकॉर्ड या डेटाबेस इस तरह व्यवस्थित करना कि तुरंत मिल जाएं।',
    example: 'Structured records',
  },
];

export const RIASEC_LETTERS: RiasecLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];

/**
 * Transparent RIASEC scoring:
 * Each question is rated 1 ("Not like me") to 5 ("Very much like me").
 * Each letter's score is the average of answered questions in that dimension mapped cleanly to 0–100:
 *   score = ((avg - 1) / 4) * 100
 * Unanswered dimensions default to 50 (neutral) and lower overall confidence.
 */
export function computeRiasecScores(answers: QuizAnswers): {
  scores: RiasecScores;
  topCodes: RiasecLetter[];
  answeredCount: number;
  completionRatio: number;
} {
  const sums: Record<RiasecLetter, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: Record<RiasecLetter, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const q of RIASEC_QUESTIONS) {
    const val = answers[q.id];
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      sums[q.dimension] += val;
      counts[q.dimension] += 1;
    }
  }

  const scores: RiasecScores = { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 };
  let answeredCount = 0;

  for (const letter of RIASEC_LETTERS) {
    answeredCount += counts[letter];
    if (counts[letter] > 0) {
      const avg = sums[letter] / counts[letter];
      scores[letter] = Math.round(((avg - 1) / 4) * 100);
    }
  }

  const topCodes = [...RIASEC_LETTERS]
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 3);

  return {
    scores,
    topCodes,
    answeredCount,
    completionRatio: answeredCount / RIASEC_QUESTIONS.length,
  };
}
