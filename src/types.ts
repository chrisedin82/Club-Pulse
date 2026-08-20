export const CLUB_AREAS = [
  "Main Stage Bingo",
  "Go Go Bingo",
  "Bar",
  "Diner",
  "Slots",
] as const;

export type ClubArea = (typeof CLUB_AREAS)[number];

export type ClubFigure = {
  id: string;
  club_id: string;
  entry_date: string;
  area: ClubArea;
  revenue: number;
  target: number;
  activity_count: number;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
