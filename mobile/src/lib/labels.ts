import type { Gender, Intent, InterestedIn, ReportReason } from '../api/types';

// Human-readable labels for the values the backend stores.

export const INTENT_LABELS: Record<Intent, string> = {
  SERIOUS_RELATIONSHIP: 'Serious relationship',
  MARRIAGE: 'Shaadi',
  CASUAL_DATING: 'Casual dating',
  FRIENDSHIP: 'Sirf dosti',
  NOT_SURE: 'Abhi pata nahi',
};

export const GENDER_LABELS: Record<Gender, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
  NON_BINARY: 'Non-binary',
};

export const INTERESTED_IN_LABELS: Record<InterestedIn, string> = {
  MEN: 'Men',
  WOMEN: 'Women',
  EVERYONE: 'Everyone',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  FAKE_PROFILE: 'Fake profile',
  INAPPROPRIATE_PHOTOS: 'Galat photos',
  HARASSMENT: 'Harassment / buri baatein',
  SPAM: 'Spam ya scam',
  UNDERAGE: '18 se kam lagta/lagti hai',
  OFFLINE_BEHAVIOUR: 'Milne pe bura vyavhaar',
  OTHER: 'Kuch aur',
};

/** Options for the "About me" chips. The chosen text is saved as-is. */
export const DETAIL_OPTIONS = {
  education: ['High school', 'Diploma', 'Graduate', 'Post-graduate', 'PhD'],
  religion: ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Spiritual', 'Not religious', 'Prefer not to say'],
  zodiac: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  drinking: ['Never', 'Socially', 'Regularly'],
  smoking: ['Never', 'Socially', 'Regularly'],
  workout: ['Daily', 'Kabhi kabhi', 'Never'],
  diet: ['Vegetarian', 'Non-veg', 'Vegan', 'Eggetarian'],
  pets: ['Pets hain', 'Pasand hain', 'Allergy hai', 'Pasand nahi'],
  kids: ['Chahiye', 'Nahi chahiye', 'Abhi pata nahi', 'Pehle se hain'],
  languages: ['Hindi', 'English', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Punjabi', 'Kannada', 'Malayalam', 'Urdu', 'Odia'],
} as const;

export const DETAIL_TITLES: Record<string, string> = {
  heightCm: 'Height',
  jobTitle: 'Job',
  company: 'Company',
  education: 'Education',
  college: 'College',
  hometown: 'Hometown',
  religion: 'Religion',
  zodiac: 'Zodiac',
  drinking: 'Drinking',
  smoking: 'Smoking',
  workout: 'Workout',
  diet: 'Diet',
  pets: 'Pets',
  kids: 'Kids',
};

/** 165 → 5'5" */
export function formatHeight(cm: number) {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
}

/** Turns a profile's details map into short chip texts like "5'4\"", "Never smokes". */
export function detailChips(details: Record<string, string | number>): string[] {
  const chips: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (key === 'heightCm') chips.push(formatHeight(Number(value)));
    else if (key === 'drinking') chips.push(`Drinks: ${value}`);
    else if (key === 'smoking') chips.push(`Smokes: ${value}`);
    else if (key === 'workout') chips.push(`Workout: ${value}`);
    else if (key === 'kids') chips.push(`Kids: ${value}`);
    else if (key === 'company') continue; // shown together with job title
    else if (key === 'jobTitle') chips.push(details.company ? `${value} @ ${details.company}` : String(value));
    else chips.push(String(value));
  }
  return chips;
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'abhi';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
