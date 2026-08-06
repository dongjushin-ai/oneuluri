export type BudgetRange = "UNDER_10W" | "10W_TO_20W" | "OVER_20W";

export type TransportationMode = "WALK" | "PUBLIC" | "CAR" | "BICYCLE";

export type PreferenceValue = 0 | 1 | 2 | 3 | 4 | 5;

export interface UserPreferences {
  /** Integer from 0 to 5 */
  lovely: PreferenceValue;
  /** Integer from 0 to 5 */
  sensibility: PreferenceValue;
  /** Integer from 0 to 5 */
  quiet: PreferenceValue;
  /** Integer from 0 to 5 */
  activity: PreferenceValue;
}

export interface CourseRequest {
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  budget: BudgetRange;
  transportation_mode: TransportationMode;
  preferences: UserPreferences;
  mainPlaceId: string | null;
}

export interface CourseOption {
  reasons: string[];
}