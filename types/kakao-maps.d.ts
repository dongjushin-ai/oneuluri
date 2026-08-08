interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  relayout(): void;
  setBounds(bounds: KakaoLatLngBounds): void;
  setLevel(level: number): void;
}

interface KakaoLatLngBounds {
  extend(position: KakaoLatLng): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoMarkerImage {
  readonly __kakaoMarkerImage?: never;
}

interface KakaoSize {
  readonly __kakaoSize?: never;
}

interface KakaoPoint {
  readonly __kakaoPoint?: never;
}

interface KakaoPolyline {
  setMap(map: KakaoMap | null): void;
}

interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
}

interface KakaoMapsNamespace {
  load(callback: () => void): void;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Marker: new (options: { map: KakaoMap; position: KakaoLatLng; title?: string; image?: KakaoMarkerImage }) => KakaoMarker;
  MarkerImage: new (
    source: string,
    size: KakaoSize,
    options?: { offset?: KakaoPoint },
  ) => KakaoMarkerImage;
  Size: new (width: number, height: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
  Polyline: new (options: {
    map: KakaoMap;
    path: KakaoLatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
  }) => KakaoPolyline;
  InfoWindow: new (options: { content: HTMLElement; removable?: boolean }) => KakaoInfoWindow;
  event: {
    addListener(target: KakaoMarker, type: "click", handler: () => void): void;
    removeListener(target: KakaoMarker, type: "click", handler: () => void): void;
  };
}

interface Window {
  kakao?: {
    maps: KakaoMapsNamespace;
  };
}
