import {
  CATEGORY_SUBCATEGORY_MAP,
  CSAT_FIELDS,
  DUMMY_TOTAL_RECORDS,
  ISSUE_CATEGORIES,
} from '@/shared/constants/feedback';
import { OUTLET_OPTIONS } from '@/shared/constants/outlets';
import type {
  CsatScorecard,
  FeedbackRecord,
  IssueSeverity,
  IssueTicket,
  IssueTicketType,
  Rating,
} from '@/shared/types/feedback';
import { feedbackRecordSchema } from '@/shared/types/feedback';
import sampleFeedback from '@/server/dummy-data/sample-feedback.json';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DUMMY_RECORD_LIMIT = DUMMY_TOTAL_RECORDS;
export const OUTLETS = OUTLET_OPTIONS;
const SAMPLE_FEEDBACK_RECORDS = sampleFeedback.map((item) => feedbackRecordSchema.parse(item));

const POSITIVE_HIGHLIGHTS = [
  'starters were fresh and well grilled',
  'staff attended quickly and politely',
  'booking process was smooth and hassle-free',
  'kulfi options were appreciated by the family',
  'ambience felt clean and comfortable',
];

const NEGATIVE_HIGHLIGHTS = [
  'wait time for main course was longer than expected',
  'billing clarification took extra time',
  'service attention dropped during peak rush',
  'washroom cleanliness needs improvement',
  'drinks quality did not meet expectations',
];

const SPECIAL_MENTIONS = [
  'Staff member handled repeated refill requests very efficiently.',
  'The team proactively checked for dietary preferences.',
  'The grilled pineapple starter was specifically praised.',
  'Booking assistance over phone was seamless and polite.',
  'Family seating arrangement was managed very well.',
];

const createSeededRandom = (seed: number) => {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const pick = <T>(items: readonly T[], random: () => number) => {
  return items[Math.floor(random() * items.length)] as T;
};

const pickWeightedRating = (random: () => number): Rating => {
  const draw = random();

  if (draw < 0.47) {
    return 'Excellent';
  }

  if (draw < 0.79) {
    return 'Good';
  }

  if (draw < 0.91) {
    return 'Average';
  }

  if (draw < 0.98) {
    return 'Poor';
  }

  return 'N/A';
};

const clampRatingAroundBase = (base: Rating, random: () => number): Rating => {
  if (base === 'N/A') {
    return random() < 0.8 ? 'N/A' : 'Good';
  }

  if (random() < 0.12) {
    return 'N/A';
  }

  if (base === 'Excellent') {
    return random() < 0.7 ? 'Excellent' : 'Good';
  }

  if (base === 'Good') {
    const draw = random();
    if (draw < 0.2) {
      return 'Excellent';
    }
    if (draw < 0.75) {
      return 'Good';
    }
    return 'Average';
  }

  if (base === 'Average') {
    const draw = random();
    if (draw < 0.2) {
      return 'Good';
    }
    if (draw < 0.75) {
      return 'Average';
    }
    return 'Poor';
  }

  return random() < 0.7 ? 'Poor' : 'Average';
};

const buildCsatScorecard = (base: Rating, random: () => number): CsatScorecard => {
  const entries = CSAT_FIELDS.map((field) => [field, clampRatingAroundBase(base, random)] as const);

  return Object.fromEntries(entries) as CsatScorecard;
};

const createIssueTickets = (
  id: string,
  overallRating: Rating,
  random: () => number,
): IssueTicket[] => {
  let ticketCount = 0;

  if (overallRating === 'Poor') {
    ticketCount = Math.floor(random() * 3) + 2;
  } else if (overallRating === 'Average') {
    ticketCount = Math.floor(random() * 2) + 1;
  } else if (overallRating === 'Good' && random() < 0.18) {
    ticketCount = 1;
  } else if (overallRating === 'Excellent' && random() < 0.06) {
    ticketCount = 1;
  }

  return Array.from({ length: ticketCount }, (_, index) => {
    const category = pick(ISSUE_CATEGORIES, random);
    const subcategory = pick(CATEGORY_SUBCATEGORY_MAP[category], random);

    const isSuggestion = overallRating !== 'Poor' && random() < 0.35;
    const ticketType: IssueTicketType = isSuggestion ? 'Suggestion' : 'Complaint';

    const severity: IssueSeverity = isSuggestion
      ? random() < 0.75
        ? 'Low'
        : 'Medium'
      : random() < 0.5
        ? 'High'
        : 'Medium';

    const descriptionSource = severity === 'High' ? NEGATIVE_HIGHLIGHTS : POSITIVE_HIGHLIGHTS;

    return {
      id: `${id}-ticket-${index + 1}`,
      ticketType,
      category,
      subcategory,
      severity,
      description: `Customer mentioned that ${pick(descriptionSource, random)}.`,
    };
  });
};

const createSummary = (outletName: string, overallRating: Rating, random: () => number): string | null => {
  if (overallRating === 'N/A') {
    return null;
  }

  const groupSize = Math.floor(random() * 8) + 2;

  if (overallRating === 'Poor' || overallRating === 'Average') {
    return `I visited ${outletName} with ${groupSize} guests. My <span style="color: red;">overall experience was ${overallRating.toLowerCase()}</span>. I felt that <span style="color: red;">${pick(NEGATIVE_HIGHLIGHTS, random)}</span>. I hope this feedback helps improve upcoming visits.`;
  }

  return `I visited ${outletName} with ${groupSize} guests. My <span style="color: green;">overall experience was ${overallRating.toLowerCase()}</span>. I noticed that <span style="color: green;">${pick(POSITIVE_HIGHLIGHTS, random)}</span>. I do not have additional concerns to report.`;
};

const createTranscript = (overallRating: Rating, outletName: string, random: () => number): string => {
  const quality = overallRating.toLowerCase();

  return `**Staff:** Hello, this is a feedback call from Barbeque Nation Head Office.\n\n**Customer:** Yes, please continue.\n\n**Staff:** You recently visited ${outletName}. How was your overall experience?\n\n**Customer:** It was ${quality}.\n\n**Staff:** Could you share one key point from your visit?\n\n**Customer:** ${pick(
    overallRating === 'Poor' || overallRating === 'Average' ? NEGATIVE_HIGHLIGHTS : POSITIVE_HIGHLIGHTS,
    random,
  )}.\n\n**Staff:** Thank you for your feedback. We will use this for service improvements.`;
};

const createSpecialMentions = (overallRating: Rating, random: () => number): string[] | null => {
  if (overallRating !== 'Excellent' || random() > 0.34) {
    return null;
  }

  const mentionsCount = random() < 0.55 ? 1 : 2;
  return Array.from({ length: mentionsCount }, () => pick(SPECIAL_MENTIONS, random));
};

const buildBookingId = (outletCode: string, sequence: number) => {
  return `${outletCode}-${String(sequence).padStart(12, '0')}`;
};

const getCallDateIso = (random: () => number): string => {
  const maxDaysBack = 420;
  const dayOffset = Math.floor(random() * maxDaysBack);
  const dayTimeOffset = Math.floor(random() * DAY_IN_MS);
  return new Date(Date.now() - dayOffset * DAY_IN_MS - dayTimeOffset).toISOString();
};

export const generateFeedbackRecord = (index: number): FeedbackRecord => {
  if (index < SAMPLE_FEEDBACK_RECORDS.length) {
    return SAMPLE_FEEDBACK_RECORDS[index] as FeedbackRecord;
  }

  const random = createSeededRandom((index + 1) * 104_729);
  const outlet = pick(OUTLETS, random);
  const overallExperienceRating = pickWeightedRating(random);
  const bookingId = buildBookingId(outlet.code, index + 1);
  const callDate = getCallDateIso(random);
  const id = `feedback-${index + 1}`;

  return {
    id,
    bookingId,
    outletId: outlet.id,
    outletName: outlet.name,
    city: outlet.city,
    region: outlet.region,
    callDate,
    overallExperienceRating,
    csatScorecard: buildCsatScorecard(overallExperienceRating, random),
    summary: createSummary(outlet.name, overallExperienceRating, random),
    translatedTranscript: createTranscript(overallExperienceRating, outlet.name, random),
    specialMentions: createSpecialMentions(overallExperienceRating, random),
    issueTickets: createIssueTickets(id, overallExperienceRating, random),
  };
};

export const generateFeedbackById = (feedbackId: string): FeedbackRecord | null => {
  if (feedbackId.startsWith('sample-')) {
    const sampleIndex = Number(feedbackId.replace('sample-', ''));

    if (Number.isInteger(sampleIndex) && sampleIndex >= 1 && sampleIndex <= SAMPLE_FEEDBACK_RECORDS.length) {
      return SAMPLE_FEEDBACK_RECORDS[sampleIndex - 1] as FeedbackRecord;
    }

    return null;
  }

  if (feedbackId.startsWith('feedback-')) {
    const recordIndex = Number(feedbackId.replace('feedback-', ''));

    if (Number.isInteger(recordIndex) && recordIndex >= 1 && recordIndex <= DUMMY_RECORD_LIMIT) {
      return generateFeedbackRecord(recordIndex - 1);
    }
  }

  return null;
};

export const generateRecordsInRange = (startIndex: number, endExclusive: number): FeedbackRecord[] => {
  const records: FeedbackRecord[] = [];

  for (let index = startIndex; index < endExclusive; index += 1) {
    records.push(generateFeedbackRecord(index));
  }

  return records;
};
