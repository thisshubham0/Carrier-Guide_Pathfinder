import type { LanguageCode } from './types.ts';

type TranslationKey =
  | 'nav.matches'
  | 'nav.roadmap'
  | 'nav.compare'
  | 'nav.mentor'
  | 'nav.settings'
  | 'cta.startAnonymous'
  | 'cta.signIn'
  | 'cta.continue'
  | 'cta.skip'
  | 'cta.back'
  | 'welcome.headline'
  | 'welcome.subtitle'
  | 'welcome.privacyNote'
  | 'quiz.title'
  | 'quiz.subtitle'
  | 'quiz.transparency'
  | 'quiz.warningBadge'
  | 'quiz.warningTitle'
  | 'quiz.warningBody'
  | 'quiz.warningPoint1'
  | 'quiz.warningPoint2'
  | 'quiz.warningPoint3'
  | 'quiz.warningCheckbox'
  | 'quiz.warningStart'
  | 'matches.title'
  | 'matches.lowConfidence'
  | 'roadmap.title'
  | 'mentor.title'
  | 'mentor.placeholder'
  | 'offline.banner';

const DICT: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    'nav.matches': 'Matches',
    'nav.roadmap': 'Roadmap',
    'nav.compare': 'Compare',
    'nav.mentor': 'AI Mentor',
    'nav.settings': 'Privacy & Sync',
    'cta.startAnonymous': 'Start without an account',
    'cta.signIn': 'Sign in to sync',
    'cta.continue': 'Continue',
    'cta.skip': 'Skip this question',
    'cta.back': 'Back',
    'welcome.headline': 'A clear, honest career plan in under 15 minutes.',
    'welcome.subtitle':
      'Discover careers that fit your strengths, budget, and timeline—with free learning resources and zero paywalls.',
    'welcome.privacyNote':
      'Private by default: we save your plan on your device, never sell student data, and let you export or delete everything in one click.',
    'quiz.title': 'Interest & Aptitude Check',
    'quiz.subtitle': 'Rate how much you would enjoy each everyday task. There are no right or wrong answers.',
    'quiz.transparency':
      'Transparent RIASEC scoring: each answer simply averages into 6 practical interest areas (Hands-On, Analytical, Creative, Helping, Leading, Structured).',
    'quiz.warningBadge': 'Important Notice Before You Begin',
    'quiz.warningTitle': 'Enter your own choices at your true will',
    'quiz.warningBody':
      'Your career matches and roadmap are built directly from your quiz answers. Please answer honestly according to what you genuinely enjoy—so your guidance comes out precise and useful for you.',
    'quiz.warningPoint1': 'Choose freely for yourself—do not pick answers just to impress others or follow trends.',
    'quiz.warningPoint2': 'There are no right, wrong, or "best" answers—every work style leads to strong careers.',
    'quiz.warningPoint3': 'If you rush or guess randomly, your career recommendations will be less accurate.',
    'quiz.warningCheckbox': 'I will enter my own choices honestly at my true will for accurate results.',
    'quiz.warningStart': 'I Understand — Start Quiz',
    'matches.title': 'Your Top Career Matches',
    'matches.lowConfidence':
      'Low confidence: you skipped several questions, so these matches are broad starting points. Answer more quiz items to sharpen your results.',
    'roadmap.title': 'Skill Gaps & Action Roadmap',
    'mentor.title': 'AI Career Mentor',
    'mentor.placeholder': 'Ask about salaries, low-cost routes, exams, or day-to-day work...',
    'offline.banner': 'Offline mode: showing your saved roadmap and career catalog.',
  },
  hi: {
    'nav.matches': 'करियर मैच',
    'nav.roadmap': 'रोडमैप',
    'nav.compare': 'तुलना करें',
    'nav.mentor': 'AI मेंटर',
    'nav.settings': 'प्राइवेसी व सिंक',
    'cta.startAnonymous': 'बिना अकाउंट शुरू करें',
    'cta.signIn': 'सिंक के लिए साइन इन',
    'cta.continue': 'आगे बढ़ें',
    'cta.skip': 'यह सवाल छोड़ें',
    'cta.back': 'पीछे',
    'welcome.headline': '15 मिनट से कम में स्पष्ट और भरोसेमंद करियर प्लान।',
    'welcome.subtitle':
      'अपनी रुचि, बजट और समय के अनुसार सही करियर, मुफ्त संसाधन और कदम-दर-कदम रोडमैप जानें।',
    'welcome.privacyNote':
      'आपका डेटा सुरक्षित है: प्लान आपके डिवाइस पर सेव रहता है और आप एक क्लिक में इसे एक्सपोर्ट या डिलीट कर सकते हैं।',
    'quiz.title': 'रुचि और कौशल जांच (RIASEC)',
    'quiz.subtitle': 'बताएं कि आपको इनमें से हर काम कितना पसंद आएगा। कोई सही या गलत उत्तर नहीं है।',
    'quiz.transparency':
      'पारदर्शी स्कोरिंग: आपके उत्तर 6 व्यावहारिक रुचि क्षेत्रों में औसत होते हैं—कोई छिपा हुआ स्कोर नहीं।',
    'quiz.warningBadge': 'शुरू करने से पहले महत्वपूर्ण चेतावनी',
    'quiz.warningTitle': 'अपनी सच्ची इच्छा से अपने उत्तर चुनें',
    'quiz.warningBody':
      'आपके करियर सुझाव और रोडमैप सीधे आपके उत्तरों के आधार पर बनाए जाते हैं। कृपया पूरी ईमानदारी से वही चुनें जो आपको सच में पसंद है, ताकि जानकारी बिल्कुल सटीक मिले।',
    'quiz.warningPoint1': 'बिना किसी दबाव के अपनी पसंद चुनें—दूसरों की उम्मीद या ट्रेंड के हिसाब से नहीं।',
    'quiz.warningPoint2': 'इसमें कोई सही या गलत उत्तर नहीं है—हर रुचि में अच्छे करियर विकल्प हैं।',
    'quiz.warningPoint3': 'जल्दबाजी या अंदाज़े से उत्तर देने पर परिणाम कम सटीक हो सकते हैं।',
    'quiz.warningCheckbox': 'मैं सटीक जानकारी के लिए अपनी सच्ची इच्छा और ईमानदारी से उत्तर दूँगा/दूँगी।',
    'quiz.warningStart': 'मैं समझ गया/गई — क्विज़ शुरू करें',
    'matches.title': 'आपके प्रमुख करियर विकल्प',
    'matches.lowConfidence':
      'कम विश्वास स्कोर: आपने कई सवाल छोड़े हैं। बेहतर सुझाव के लिए और सवालों के उत्तर दें।',
    'roadmap.title': 'स्किल गैप और एक्शन रोडमैप',
    'mentor.title': 'AI करियर मेंटर',
    'mentor.placeholder': 'वेतन, कम खर्च वाले कोर्स, परीक्षा या दैनिक काम के बारे में पूछें...',
    'offline.banner': 'ऑफ़लाइन मोड: आपका सेव किया गया रोडमैप और करियर डेटा दिख रहा है।',
  },
};

export function t(lang: LanguageCode, key: TranslationKey): string {
  return DICT[lang]?.[key] ?? DICT.en[key];
}
