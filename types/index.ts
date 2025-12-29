export interface JournalEntry {
  id: string;
  startTime: number;
  endTime: number;
  englishText: string;
  chineseText: string;
}

export type DisplayMode = 'english' | 'bilingual' | 'hidden';

