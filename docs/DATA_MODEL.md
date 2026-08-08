# DATA_MODEL.md

## 1. Place (장소)
- id: string
- name: string
- category: 'RESTAURANT' | 'CAFE' | 'ACTIVITY' | 'PHOTO_SPOT' | 'WALK'
- lat: number
- lng: number
- address: string
- avg_price: number
- tags: string[] (예: ['러블리', '인스타감성', '조용한'])
- indoor: boolean
- opening_hours: `{ dayOfWeek, open, close, breakStart?, breakEnd? }[]`; 비즈니스 시간이 적용되지 않는 공공장소는 빈 배열
- dataStatus: `'VERIFIED' | 'PARTIAL' | 'ESTIMATED'`
- sources: `PlaceSource[]` (제목, URL, 발행처, 확인일, 지원 필드)
- priceSourceType: `'OFFICIAL' | 'THIRD_PARTY' | 'EDITORIAL_ESTIMATE' | 'NOT_APPLICABLE'`
- openingHoursSourceType: `'OFFICIAL' | 'THIRD_PARTY' | 'ESTIMATED' | 'NOT_APPLICABLE'`
- lastVerifiedAt: string (ISO 날짜)
- validFrom?: string, validUntil?: string (기간 한정 장소의 유효 기간, ISO 날짜)
- scoreSource: `'EDITORIAL'` (주관적 추천 점수의 출처)

### 검증 규칙

- `VERIFIED`는 출처가 이름, 주소, 좌표, 영업시간을 모두 지원할 때만 사용한다.
- 일부 필드만 출처로 확인된 경우 `PARTIAL`, 추정값 중심이면 `ESTIMATED`를 사용한다.
- 공원·거리·산책로처럼 영업시간이 없는 장소는 `openingHoursSourceType: 'NOT_APPLICABLE'`과 빈 `opening_hours`를 사용한다.
- 기간 한정 장소는 `validFrom`과 `validUntil`을 기록하며 유효 기간 밖에서는 추천하지 않는다.

## 2. CourseRequest (사용자 입력)
- location: string (기본 '성수')
- date: string
- start_time: string
- end_time: string
- budget: number
- preferences: {
    lovely: number (0~5),
    sensibility: number (0~5),
    quiet: number (0~5),
    activity: number (0~5)
  }

## 3. Course (생성된 코스)
- id: string
- type: 'SHORTEST' | 'MOOD' | 'PHOTO'
- total_time_min: number
- total_cost: number
- items: CourseItem[]

## 4. CourseItem (코스 내 개별 장소)
- order: number
- place: Place
- arrival_time: string
- stay_duration_min: number
- travel_time_to_next_min: number

## 5. Supabase representation (`public.places`)

`Place`의 스칼라 필드는 데이터베이스에서 snake_case 컬럼으로 저장한다. 도메인 변환은 `lib/supabase/places.ts`에서 수행한다.

- `lat` → `latitude double precision`
- `lng` → `longitude double precision`
- `opening_hours` → `jsonb`
- `scores` → `jsonb`
- `sources` → `jsonb`
- `tags` → `text[]`
- `dataStatus` → `data_status`
- `priceSourceType` → `price_source_type`
- `openingHoursSourceType` → `opening_hours_source_type`
- `lastVerifiedAt` → `last_verified_at date`
- `validFrom`, `validUntil` → `valid_from date`, `valid_until date`
- `scoreSource` → `score_source`

RLS는 활성화되어 있으며 익명·인증 사용자는 현재 유효한 장소만 조회할 수 있다. 공개 쓰기 정책은 제공하지 않는다. 애플리케이션은 조회 결과를 Zod로 검증하고 설정 누락, 네트워크 오류, 잘못된 데이터 또는 빈 결과가 발생하면 로컬 장소 데이터로 안전하게 대체한다.

## 6. SharedCourse (`public.shared_courses`)

익명 공유 링크는 코스를 다시 생성하지 않고 생성 당시의 요청과 조정된 코스 전체를 스냅샷으로 저장한다.

- `id`: uuid
- `course_type`: `'SHORTEST' | 'MOOD' | 'PHOTO'`
- `request_data`: CourseRequest 전체를 저장하는 jsonb
- `course_data`: GeneratedCourse와 포함된 Place 정보를 저장하는 jsonb
- `created_at`: timestamptz
- `expires_at`: nullable timestamptz

공개 사용자는 만료되지 않은 스냅샷만 조회할 수 있다. 공개 쓰기 정책은 없으며 생성은 서버 API가 서버 전용 자격 증명으로 수행한다. 브라우저에는 privileged key를 전달하지 않는다.
