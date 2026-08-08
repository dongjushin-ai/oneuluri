"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseStop } from "@/lib/course-generator";

const KAKAO_SDK_ID = "kakao-maps-sdk";
let kakaoMapsPromise: Promise<KakaoMapsNamespace> | null = null;

function loadKakaoMaps(appKey: string): Promise<KakaoMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Maps is only available in the browser"));
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const finishLoading = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK did not initialize"));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    const existingScript = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", finishLoading, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Kakao Maps SDK failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.addEventListener("load", finishLoading, { once: true });
    script.addEventListener("error", () => reject(new Error("Kakao Maps SDK failed to load")), { once: true });
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}

function createInfoContent(stop: CourseStop, order: number): HTMLElement {
  const content = document.createElement("div");
  content.className = "min-w-44 p-3 text-sm text-slate-700";

  const title = document.createElement("strong");
  title.className = "block text-slate-900";
  title.textContent = `${order}. ${stop.place.name}`;

  const category = document.createElement("p");
  category.className = "mt-1 text-xs text-orange-600";
  category.textContent = stop.place.category;

  const time = document.createElement("p");
  time.className = "mt-1 text-xs text-slate-600";
  time.textContent = `${stop.arrivalTime} ~ ${stop.departureTime}`;

  content.append(title, category, time);
  return content;
}

function createNumberedMarkerImage(maps: KakaoMapsNamespace, order: number): KakaoMarkerImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42"><path fill="#f97316" stroke="#fff" stroke-width="2" d="M18 1C8.6 1 1 8.6 1 18c0 12.5 17 23 17 23s17-10.5 17-23C35 8.6 27.4 1 18 1Z"/><circle cx="18" cy="18" r="11" fill="#fff"/><text x="18" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#ea580c">${order}</text></svg>`;
  return new maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new maps.Size(36, 42),
    { offset: new maps.Point(18, 42) },
  );
}

interface CourseMapProps {
  stops: CourseStop[];
}

export default function CourseMap({ stops }: CourseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  useEffect(() => {
    if (!appKey || !containerRef.current || stops.length === 0) {
      return;
    }

    let disposed = false;
    const cleanups: Array<() => void> = [];

    void loadKakaoMaps(appKey)
      .then((maps) => {
        if (disposed || !containerRef.current) {
          return;
        }

        const positions = stops.map((stop) => new maps.LatLng(stop.place.lat, stop.place.lng));
        const map = new maps.Map(containerRef.current, { center: positions[0], level: 4 });
        const bounds = new maps.LatLngBounds();
        const openInfoWindows: KakaoInfoWindow[] = [];

        positions.forEach((position, index) => {
          bounds.extend(position);
          const marker = new maps.Marker({
            map,
            position,
            title: `${index + 1}. ${stops[index].place.name}`,
            image: createNumberedMarkerImage(maps, index + 1),
          });
          const infoWindow = new maps.InfoWindow({ content: createInfoContent(stops[index], index + 1), removable: true });
          const handleClick = () => {
            openInfoWindows.forEach((window) => window.close());
            infoWindow.open(map, marker);
          };
          maps.event.addListener(marker, "click", handleClick);
          openInfoWindows.push(infoWindow);
          cleanups.push(() => {
            maps.event.removeListener(marker, "click", handleClick);
            infoWindow.close();
            marker.setMap(null);
          });
        });

        const polyline = new maps.Polyline({
          map,
          path: positions,
          strokeWeight: 4,
          strokeColor: "#f97316",
          strokeOpacity: 0.85,
          strokeStyle: "solid",
        });
        cleanups.push(() => polyline.setMap(null));

        if (positions.length === 1) {
          map.setLevel(4);
        } else {
          map.setBounds(bounds);
        }

        const resizeObserver = new ResizeObserver(() => {
          window.requestAnimationFrame(() => {
            if (disposed) return;
            map.relayout();
            if (positions.length === 1) {
              map.setLevel(4);
            } else {
              map.setBounds(bounds);
            }
          });
        });
        resizeObserver.observe(containerRef.current);
        cleanups.push(() => resizeObserver.disconnect());
      })
      .catch(() => {
        if (!disposed) {
          setError("지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      });

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [appKey, stops]);

  if (!appKey) {
    return (
      <div className="flex h-[320px] w-full min-w-0 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-6 text-center text-sm text-slate-600 lg:h-[420px]">
        카카오 지도 API 키가 설정되지 않았습니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] w-full min-w-0 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-6 text-center text-sm text-slate-600 lg:h-[420px]">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="h-[320px] w-full min-w-0 overflow-hidden rounded-2xl transition-[height] duration-200 lg:h-[420px]" aria-label="코스 경로 지도" />;
}
