export type PlaceCategory =
  | "RESTAURANT"
  | "CAFE"
  | "ACTIVITY"
  | "PHOTO_SPOT"
  | "WALK";

export type PlaceDataStatus = "VERIFIED" | "PARTIAL" | "ESTIMATED";

export type PlaceSourceField = "NAME" | "ADDRESS" | "COORDINATES" | "OPENING_HOURS" | "PRICE";

export interface PlaceSource {
  title: string;
  url: string;
  publisher: string;
  accessedAt: string;
  supportedFields: PlaceSourceField[];
}

export type PriceSourceType = "OFFICIAL" | "THIRD_PARTY" | "EDITORIAL_ESTIMATE" | "NOT_APPLICABLE";

export type OpeningHoursSourceType = "OFFICIAL" | "THIRD_PARTY" | "ESTIMATED" | "NOT_APPLICABLE";

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
  dataStatus: PlaceDataStatus;
  sources: PlaceSource[];
  priceSourceType: PriceSourceType;
  openingHoursSourceType: OpeningHoursSourceType;
  lastVerifiedAt: string;
  validFrom?: string;
  validUntil?: string;
  scoreSource: "EDITORIAL";
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
