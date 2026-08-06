export type PlaceCategory =
  | "RESTAURANT"
  | "CAFE"
  | "ACTIVITY"
  | "PHOTO_SPOT"
  | "WALK";

export interface OpeningHour {
  dayOfWeek: number;
  open: string;
  close: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  avg_price: number;
  avg_stay_duration_min: number;
  tags: string[];
  indoor: boolean;
  opening_hours: OpeningHour[];
  scores: {
    romantic: number;
    instagram: number;
    quiet: number;
    activity: number;
    value: number;
    photo: number;
    rain: number;
  };
}