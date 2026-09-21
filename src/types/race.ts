export type LocalizedText = {
  ja: string;
  en: string;
  fr?: string;
};

export type CountryCode = 'JP' | 'FR' | 'GB' | 'US' | 'HK' | 'AU';
export type Organization = 'jra' | 'nar' | 'france_galop' | 'bha' | 'equibase' | 'overseas';
export type TrackType = 'turf' | 'dirt' | 'obstacle' | 'banei' | 'aw';
export type SexConstraint = 'filly_and_mare' | 'colt_and_filly' | 'none';
export type AgeConstraint = '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
export type Grade =
  | 'G1'
  | 'G2'
  | 'G3'
  | 'J.G1'
  | 'J.G2'
  | 'J.G3'
  | 'Jpn1'
  | 'Jpn2'
  | 'Jpn3'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'local_grade';
export type HandicapCode = 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';

export type Handicap = {
  code: HandicapCode;
  ja: string;
  en: string;
};

export type Race = {
  id: string;
  organization: Organization;
  country_code?: CountryCode; // ISO 3166-1 alpha-2 (例: "JP", "FR", "GB")
  name: LocalizedText;
  grade: Grade;
  date: string; // YYYY-MM-DD
  start_time: string; // UTC ISO 8601 (例: "2026-02-22T06:40:00.000Z")
  is_time_confirmed: boolean;
  is_rescheduled?: boolean;
  original_date?: string; // YYYY-MM-DD
  course: LocalizedText;
  distance: number;
  track_type: TrackType;
  sex_constraint: SexConstraint;
  age_constraint: AgeConstraint;
  handicap: Handicap;
};

export type DistanceCategory = 'sprint' | 'mile' | 'intermediate' | 'long';

export type FilterState = {
  organizations: Organization[];
  searchQuery: string;
  grades: Grade[];
  trackTypes: TrackType[];
  sexConstraints: SexConstraint[];
  ageConstraints: AgeConstraint[];
  courses: string[];
  distanceCategories: DistanceCategory[];
  yearMonth: { year: number; month: number } | null;
};
