# 오늘우리 (OneulUri)

> **오늘, 우리 뭐하지?**
> 취향, 예산, 시간, 날씨와 실제 이동 동선을 고려하여 하루 데이트 코스를 자동으로 설계하는 데이트 코스 플래너

---

## 1. 프로젝트 소개

데이트 장소를 찾는 것은 어렵지 않습니다.

문제는 여러 장소를 하나의 **좋은 하루 일정으로 연결하는 것**입니다.

보통 데이트를 계획할 때는 지도, SNS, 블로그, 맛집 검색 등을 오가며 각각의 장소를 찾은 뒤 직접 일정을 조합해야 합니다.

이 과정에서 다음과 같은 문제가 발생합니다.

* 분위기 좋은 식당과 카페를 찾았지만 서로 너무 멀다.
* 방문하려는 시간에 브레이크타임이 걸린다.
* 여러 장소를 추가하다 보니 예산을 초과한다.
* 비가 오면서 야외 중심 일정이 무너진다.
* 사진을 찍고 싶었지만 좋은 시간대를 놓친다.
* 한 장소를 변경하면 이후 일정 전체를 다시 계산해야 한다.

**오늘우리**는 개별 장소를 추천하는 것에서 끝나지 않고,

**식사 → 활동 → 카페 → 포토스팟/산책**

등의 장소를 하나의 일정으로 조합하고 실제 제약조건까지 고려하여 **완성된 데이트 코스**를 생성하는 것을 목표로 개발했습니다.

---

# 2. 개발 동기

기존 지도 서비스는 특정 장소를 탐색하는 데 매우 강력하지만, 사용자가 하루 동안 여러 장소를 방문하려면 여전히 직접 검색하고 비교해야 합니다.

예를 들어 성수에서 데이트한다고 하면 다음과 같은 과정을 거치게 됩니다.

1. 맛집 검색
2. 메인 데이트 장소 검색
3. 주변 카페 검색
4. 사진 찍을 장소 검색
5. 각 장소 간 거리 확인
6. 영업시간 확인
7. 브레이크타임 확인
8. 예산 계산
9. 날씨 확인
10. 전체 시간표 조정

결국 사용자는 여러 서비스에서 얻은 정보를 다시 직접 조합해야 합니다.

여기서 다음 질문에서 프로젝트를 시작했습니다.

> **"장소를 추천하는 것이 아니라 하루 자체를 추천할 수 없을까?"**

오늘우리는 이 문제를 **제약조건을 고려하는 추천 시스템과 경로 최적화 문제**로 접근했습니다.

---

# 3. 핵심 목표

오늘우리의 핵심 목표는 단순한 장소 추천이 아닙니다.

사용자의 입력을 기반으로

* 취향
* 예산
* 날짜
* 시작 시간
* 이용 가능 시간
* 메인 장소
* 날씨
* 영업시간
* 브레이크타임
* 장소 간 이동시간
* 실제 보행 경로

를 함께 고려하여 실행 가능한 코스를 생성합니다.

사용자는 여러 장소를 직접 조합하는 대신 **완성된 하루 일정**을 받습니다.

---

# 4. 주요 기능

## 맞춤형 데이트 코스 생성

사용자가 입력한 조건을 바탕으로 여러 장소를 조합하여 코스를 생성합니다.

주요 입력 조건:

* 날짜
* 시작 시간
* 이용 가능 시간
* 예산
* 메인 장소
* 러블리 선호도
* 감성 선호도
* 조용함 선호도
* 활동성 선호도
* 가성비
* 사진 중요도
* 짧은 동선 선호
* 대기시간 회피
* 우천 시 실내 선호

생성된 결과에서는 성격이 다른 여러 코스를 비교할 수 있습니다.

---

## 추천 이유 제공

추천 결과만 보여주는 대신 **왜 해당 코스가 선택되었는지** 설명합니다.

예:

* 선택한 메인 장소를 중심으로 동선을 구성했습니다.
* 전체 이동 거리가 짧은 코스입니다.
* 설정한 예산 범위에 맞게 구성했습니다.
* 사진 선호도를 높게 반영했습니다.
* 영업시간과 브레이크타임을 고려했습니다.
* 일몰 시간과 포토스팟 방문 시간을 고려했습니다.

LLM을 사용해 설명을 생성하는 것이 아니라 실제 추천 엔진의 계산 결과를 기반으로 설명을 생성하여 추천 결과와 설명이 일치하도록 구성했습니다.

---

## 장소 하나만 교체하기

전체 코스를 다시 생성하지 않고 특정 장소 하나만 변경할 수 있습니다.

교체 시:

* 동일 카테고리 대체 장소 탐색
* 기존 장소와 중복 제거
* 영업시간 재검증
* 예산 재계산
* 실제 이동 경로 재계산
* 도착/출발 시간 재계산
* 총 이동거리 재계산
* 추천 점수 재계산
* 추천 이유 재생성

을 수행합니다.

메인 장소로 지정된 장소는 사용자의 핵심 선택이므로 고정됩니다.

---

## 실제 날씨 및 일몰 반영

Open-Meteo 데이터를 이용해 선택한 날짜와 시간대의 정보를 추천에 반영합니다.

활용 데이터:

* 기온
* 시간대별 강수확률
* 일몰시간

강수확률이 높으면 야외 포토스팟과 산책 장소에 페널티를 적용하고, 높은 기온이나 우천 상황에서는 실내 장소를 우선하도록 조정합니다.

사진 중심 코스에서는 일몰시간을 활용하여 포토스팟 방문 시간을 고려합니다.

API 장애가 발생하더라도 추천 기능 자체가 중단되지 않도록 deterministic fallback 데이터를 사용합니다.

---

## 실제 보행 경로 계산

초기 버전에서는 Haversine 공식을 이용해 두 장소 사이의 직선거리를 계산했습니다.

하지만 실제 도시에서는 직선거리와 보행거리가 크게 다를 수 있습니다.

예를 들어:

* 건물
* 골목
* 횡단보도
* 도로
* 공원 출입구

등으로 인해 직선으로 이동할 수 없습니다.

이를 개선하기 위해 OpenRouteService Foot-Walking API를 도입했습니다.

현재 코스 계산에는 실제 보행 도로망 기반의:

* 이동 거리
* 예상 이동시간
* 실제 경로 좌표

가 사용됩니다.

지도에서도 실제 보행 경로를 폴리라인으로 표시합니다.

API 실패 시 기존 Haversine 기반 계산으로 자동 전환합니다.

---

# 5. 지도 시각화

Kakao Maps API를 사용하여 생성된 코스를 지도에서 확인할 수 있습니다.

지도에는:

* 장소 마커
* 방문 순서
* 실제 보행 경로
* fallback 경로

가 표시됩니다.

실제 Routing API에서 받은 경로는 실선으로, fallback 경로는 점선으로 구분하여 데이터의 신뢰도를 사용자에게 숨기지 않도록 설계했습니다.

---

# 6. 장소 데이터

MVP에서는 범위를 **서울 성수동**으로 제한했습니다.

현재 총 **30개의 장소 데이터**를 관리합니다.

| Category   |  Count |
| ---------- | -----: |
| Restaurant |      8 |
| Cafe       |      8 |
| Activity   |      5 |
| Photo Spot |      5 |
| Walk       |      4 |
| **Total**  | **30** |

각 장소는 다음 정보를 포함합니다.

* 장소명
* 카테고리
* 주소
* 위도/경도
* 예상 비용
* 평균 체류시간
* 실내/실외
* 영업시간
* 브레이크타임
* 취향 점수
* 데이터 출처
* 검증 상태
* 마지막 검증 날짜
* 임시 장소의 유효기간

---

# 7. 데이터 신뢰도 관리

프로젝트 개발 과정에서 단순히 실제 장소명을 사용하는 것만으로는 데이터가 "검증되었다"고 볼 수 없다는 문제가 있었습니다.

따라서 장소 데이터에 provenance metadata를 추가했습니다.

### Data Status

```text
VERIFIED
PARTIAL
ESTIMATED
```

### Price Source

```text
OFFICIAL_MENU
MAP_LISTING
REVIEW_ESTIMATE
MANUAL_ESTIMATE
NOT_APPLICABLE
```

### Opening Hours Source

```text
OFFICIAL
MAP_LISTING
ESTIMATED
NOT_APPLICABLE
```

서울숲이나 거리처럼 일반적인 영업시간 개념이 없는 장소에는 임의의 영업시간을 생성하지 않고 `NOT_APPLICABLE`을 사용합니다.

사용자 취향 점수는 객관적으로 검증할 수 있는 데이터가 아니기 때문에 `EDITORIAL` 데이터로 별도 관리합니다.

---

# 8. 추천 알고리즘

추천 시스템은 크게 다음 과정으로 동작합니다.

```text
User Request
     │
     ▼
Candidate Places
     │
     ├── Opening Hours Filter
     ├── Expiration Filter
     ├── Budget Filter
     ├── Weather Filter / Penalty
     │
     ▼
Preference Scoring
     │
     ├── Lovely
     ├── Sensibility
     ├── Quiet
     ├── Activity
     ├── Value
     └── Photo
     │
     ▼
Course Combination
     │
     ├── Category Balance
     ├── Transition Penalty
     ├── Route Penalty
     ├── Budget Alignment
     └── Course Type Weight
     │
     ▼
Pedestrian Routing
     │
     ▼
Timeline Reconstruction
     │
     ▼
Final Course Ranking
```

---

# 9. 추천 점수 설계

추천 점수는 하나의 기준만 최대화하지 않습니다.

다음 요소들을 종합적으로 평가합니다.

### Preference Matching

사용자가 중요하게 설정한 취향을 장소별 점수와 비교합니다.

선호도가 0인 항목이 전체 점수를 불필요하게 희석하지 않도록 활성화된 취향 차원만 정규화하여 계산합니다.

### Category Balance

예를 들어:

```text
RESTAURANT → RESTAURANT → RESTAURANT
```

처럼 동일 카테고리가 반복되는 코스에는 페널티를 적용합니다.

반대로:

```text
RESTAURANT → ACTIVITY → CAFE → PHOTO_SPOT
```

처럼 자연스러운 데이트 흐름을 선호합니다.

### Budget Alignment

예산이 낮은 사용자에게 단순히 예산을 초과하지 않는 장소를 제공하는 것에서 끝나지 않고 무료 또는 저비용 장소의 가치를 더 높게 평가합니다.

### Route Efficiency

좋은 장소만 모아놓고 이동시간이 지나치게 길어지는 문제를 방지하기 위해 이동거리와 이동시간을 점수에 반영합니다.

---

# 10. 코스 품질 실험

추천 알고리즘이 특정 입력에서만 잘 작동하는 것을 방지하기 위해 자동화된 품질 평가 환경을 구축했습니다.

총 **25개의 대표 사용자 시나리오**를 정의했습니다.

시나리오는 다음 변수를 조합합니다.

### Preference

* Photo-centric
* Food-centric
* Walk / Outdoor
* Activity
* Indoor

### Budget

* Low
* Medium
* High

### Weather

* Clear
* Rain
* Extreme Heat

### Duration

* 2 stops
* 3 stops
* 4 stops

### Start Time

* Morning
* Afternoon
* Evening

25개의 시나리오에서 총 **75개의 deterministic course option**을 생성하여 품질을 평가했습니다.

---

# 11. 품질 평가 지표

자동화된 테스트에서 다음 항목을 검증합니다.

### Preference Alignment

사진 선호도가 높은 사용자의 코스에 사진 촬영에 적합한 장소가 실제 포함되는지 확인합니다.

### Category Transition

불필요한 동일 카테고리 연속 배치를 검사합니다.

### Travel Ratio

전체 데이트 시간 중 이동시간이 과도한 비율을 차지하지 않는지 확인합니다.

기준:

```text
Travel Time <= 40% of Course Duration
```

### Budget Fit

설정한 예산 범위를 초과하지 않는지 확인합니다.

### Diversity

특정 인기 장소 몇 개만 반복적으로 추천되는 현상을 검사합니다.

현재 30개의 장소 중 **28개의 장소가 25개 시나리오의 추천 결과에 사용**되었습니다.

### Determinism

같은 입력에 대해 테스트 환경에서 동일한 결과를 생성하는지 확인합니다.

---

# 12. 테스트

프로젝트에서는 추천 결과뿐 아니라 핵심 도메인 로직을 단위 테스트합니다.

주요 테스트 범위:

* 장소 점수 계산
* 영업시간 검증
* 브레이크타임 검증
* 거리 계산
* 코스 생성
* 예산 검증
* 장소 교체
* 만료 장소 제외
* 데이터 provenance 검증
* 날씨 데이터 parsing
* 날씨 API fallback
* 보행 경로 parsing
* Routing API fallback
* 실제/fallback 혼합 경로
* 타임라인 재계산
* 공유 코스 serialization
* 추천 품질 시나리오

개발 과정에서 다음 검증 명령을 지속적으로 실행했습니다.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

---

# 13. 기술 스택

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* Next.js Route Handlers

## Database

* Supabase
* PostgreSQL
* Row Level Security

## Map

* Kakao Maps API

## Routing

* OpenRouteService Foot-Walking API

## Weather

* Open-Meteo API

## Deployment

* Vercel

## Development

* VS Code
* Git / GitHub
* Codex

---

# 14. Supabase 데이터 구조

초기 버전에서는 장소 데이터를 TypeScript 파일에서 관리했습니다.

```text
data/places.ts
        ↓
generateCourses()
```

이후 실제 서비스 구조에 가깝게 개선하기 위해 Supabase로 이관했습니다.

```text
Supabase
   ↓
Place Repository
   ↓
Domain Mapping
   ↓
Recommendation Engine
```

Supabase 연결에 실패할 경우 로컬 장소 데이터로 자동 fallback하도록 구성하여 외부 서비스 장애가 추천 기능 전체의 장애로 이어지지 않도록 했습니다.

---

# 15. 공유 기능

생성한 코스를 다른 사람에게 공유할 수 있습니다.

공유 시 현재 코스를 Supabase에 snapshot으로 저장하고 고유 URL을 생성합니다.

```text
/course/{uuid}
```

공유 페이지에서는 추천 엔진을 다시 실행하지 않고 저장 당시의 코스를 그대로 복원합니다.

이 방식을 선택한 이유는 시간이 지나 장소 데이터나 추천 알고리즘이 변경되더라도 **공유 당시 사용자가 보았던 코스를 동일하게 유지하기 위해서**입니다.

공유 snapshot에는 실제 보행 경로 좌표도 포함됩니다.

---

# 16. 장애 대응 설계

외부 API에 의존하는 서비스에서는 하나의 API 장애가 전체 서비스 장애로 이어질 수 있습니다.

오늘우리는 핵심 외부 기능에 fallback 전략을 적용했습니다.

### OpenRouteService 실패

```text
Actual Pedestrian Route
        ↓ failure
Haversine Distance Estimation
```

### Open-Meteo 실패

```text
Real Weather
     ↓ failure
Deterministic Weather Fallback
```

### Supabase 장소 조회 실패

```text
Supabase Places
      ↓ failure
Local Curated Dataset
```

따라서 일부 외부 서비스가 일시적으로 실패해도 기본적인 코스 추천 기능은 계속 동작하도록 설계했습니다.

---

# 17. 개발 과정

프로젝트는 처음부터 현재 구조로 설계된 것이 아니라 MVP를 단계적으로 확장하는 방식으로 개발했습니다.

### Phase 1 — Product Planning

* 문제 정의
* MVP 범위 설정
* 성수동으로 지역 제한
* 사용자 입력 조건 정의
* UI Flow 설계
* 데이터 모델 설계

### Phase 2 — Frontend Prototype

* 홈 화면
* 취향 설정
* 결과 페이지
* 코스 상세 페이지
* 세션 기반 화면 연결

### Phase 3 — Recommendation Engine

* 장소 점수 계산
* Haversine 거리 계산
* 영업시간 검증
* 브레이크타임 검증
* 예산 필터링
* 코스 조합
* 타임라인 생성

### Phase 4 — Explainability

* 추천 이유 생성
* 결과 카드 설명
* 상세 페이지 추천 근거 표시

### Phase 5 — Smart Replacement

* 단일 장소 교체
* 동일 카테고리 후보 탐색
* 전체 일정 자동 재계산

### Phase 6 — External Context

* Open-Meteo 연동
* 강수확률 반영
* 기온 반영
* 일몰시간 반영

### Phase 7 — Real Place Data

* 성수동 30개 장소 구축
* 데이터 출처 관리
* VERIFIED / PARTIAL / ESTIMATED 분리
* 만료 장소 처리

### Phase 8 — Database

* Supabase places 테이블
* RLS
* Repository layer
* local fallback

### Phase 9 — Map & Routing

* Kakao Maps
* 장소 마커
* OpenRouteService
* 실제 보행 경로
* Routing fallback

### Phase 10 — Sharing

* 공유 코스 snapshot
* 고유 URL
* 공유 페이지
* Open Graph metadata

### Phase 11 — Quality Tuning

* 25개 사용자 시나리오
* 75개 코스 생성
* 선호도 정합성 평가
* 이동시간 비율 평가
* 다양성 평가
* 가중치 튜닝

---

# 18. 개발 과정에서 해결한 주요 문제

## 문제 1. 직선거리와 실제 이동거리의 차이

### 초기 구현

Haversine 공식을 이용하여 두 좌표 사이의 거리를 계산했습니다.

### 문제

도시에서는 실제 보행자가 직선으로 이동할 수 없기 때문에 일정의 이동시간이 부정확했습니다.

### 개선

OpenRouteService의 실제 보행 도로망을 적용했습니다.

API 실패 가능성을 고려해 Haversine 계산은 fallback으로 유지했습니다.

---

## 문제 2. 실제 장소와 신뢰할 수 있는 장소 데이터는 다르다

### 초기 접근

실제 성수동 장소를 데이터셋에 입력하면 실제 데이터라고 생각했습니다.

### 문제

장소가 실제 존재하더라도 가격, 영업시간, 좌표 등의 값이 검증되지 않았다면 추천 시스템에서는 잘못된 결과를 만들 수 있었습니다.

### 개선

각 장소에:

* 출처
* 검증 상태
* 가격 출처
* 영업시간 출처
* 마지막 확인 날짜

를 추가했습니다.

객관 데이터와 기획자가 부여한 주관적인 취향 점수도 분리했습니다.

---

## 문제 3. 좋은 장소의 집합이 좋은 코스는 아니다

각 장소의 점수만 높게 선택하면 개별 장소는 좋지만 전체 코스는 부자연스러워질 수 있었습니다.

예:

```text
Restaurant
→ Restaurant
→ Cafe
→ Cafe
```

따라서 장소 점수뿐 아니라:

* 카테고리 전환
* 이동거리
* 전체 예산
* 일정 길이
* 코스 목적

을 별도로 평가하도록 개선했습니다.

---

## 문제 4. 특정 인기 장소 편중

추천 점수만 정렬하면 여러 사용자 시나리오에서 동일한 장소가 반복적으로 선택될 수 있습니다.

이를 해결하기 위해 deterministic diversity 로직과 코스 유형별 가중치를 추가했습니다.

25개 시나리오 실험 결과 30개 장소 중 28개가 실제 추천 결과에 사용되었습니다.

---

## 문제 5. 외부 API 장애

날씨, 지도, Routing, DB가 모두 외부 서비스에 의존하기 때문에 API 하나의 장애가 전체 코스 생성을 막을 가능성이 있었습니다.

따라서 핵심 외부 의존성에 fallback 구조를 설계했습니다.

---

# 19. 프로젝트 구조

```text
oneuluri/
├── app/
│   ├── api/
│   │   ├── pedestrian-routes/
│   │   └── shared-courses/
│   ├── course/
│   │   └── [id]/
│   ├── results/
│   │   └── [id]/
│   └── page.tsx
│
├── components/
│   ├── home/
│   ├── map/
│   ├── planner/
│   └── ui/
│
├── data/
│   └── places.ts
│
├── docs/
│   ├── PRODUCT.md
│   └── DATA_MODEL.md
│
├── lib/
│   ├── course-generator.ts
│   ├── scoring.ts
│   ├── distance.ts
│   ├── opening-hours.ts
│   ├── weather.ts
│   ├── routing/
│   └── supabase/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
└── types/
    ├── course.ts
    └── place.ts
```

---

# 20. 시스템 아키텍처

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Next.js    │
                         └───────┬───────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
          Recommendation      Weather          Kakao Maps
             Engine          Open-Meteo
                 │
        ┌────────┼─────────┐
        │        │         │
        ▼        ▼         ▼
     Scoring  Constraints  Routing
                          OpenRouteService
        │
        ▼
     Supabase
     PostgreSQL
```

---

# 21. 현재 MVP 범위

현재 MVP는 **성수동 데이트 코스 추천**에 집중합니다.

구현 완료:

* 맞춤형 코스 생성
* 취향 기반 추천
* 예산 제약
* 영업시간/브레이크타임
* 실제 날씨
* 일몰시간
* 실제 보행 경로
* 지도 시각화
* 추천 이유
* 장소 단일 교체
* 일정 자동 재계산
* 장소 데이터 provenance
* Supabase 장소 데이터
* 공유 링크
* 모바일 반응형
* Open Graph 공유 metadata
* 외부 API fallback
* 자동화된 추천 품질 평가

---

# 22. 향후 개선 계획

현재는 기능 확장보다 실제 사용자 테스트와 추천 품질 검증을 우선합니다.

### Short Term

* 실제 모바일 환경 QA
* 실제 데이트 코스 수동 검수
* 사용자 테스트
* 추천 결과 품질 개선
* 오류 모니터링
* 기본 Analytics

### Mid Term

* 코스 저장
* 사용자 계정
* 사용자 취향 저장
* 자연어 코스 생성
* 빠른 추천 모드
* 장소 데이터 관리 도구

### Long Term

* 성수 외 지역 확대
* 실시간 혼잡도
* 예약 시스템 연동
* 사용자 리뷰 기반 취향 점수
* 친구/커플 공동 일정 편집
* 개인화 추천

---

# 23. 프로젝트에서 배운 점

이 프로젝트를 진행하면서 추천 시스템에서 중요한 것은 단순히 점수가 높은 장소를 선택하는 것이 아니라는 점을 확인했습니다.

실제 사용 가능한 추천을 만들기 위해서는 다음 요소들이 함께 고려되어야 했습니다.

**1. 데이터의 정확성**

잘못된 영업시간 하나만으로도 좋은 추천이 실제로는 사용할 수 없는 일정이 될 수 있습니다.

**2. 제약조건**

예산, 시간, 이동거리, 날씨 등의 조건을 만족하지 못하면 높은 취향 점수도 의미가 없습니다.

**3. 설명 가능성**

사용자가 추천 결과를 신뢰하려면 결과뿐 아니라 왜 추천되었는지 이해할 수 있어야 합니다.

**4. 장애 대응**

외부 API를 많이 사용하는 서비스일수록 정상 상황뿐 아니라 실패 상황을 함께 설계해야 합니다.

**5. 자동 평가만으로는 부족하다**

25개 시나리오 기반 자동 평가를 구축했지만, 수치상 좋은 코스와 사람이 실제로 가고 싶은 코스가 반드시 동일하지는 않습니다.

따라서 다음 단계에서는 실제 사용자 테스트를 통해 추천 품질을 검증하고 개선할 예정입니다.

---

# 24. Current Status

**MVP Core Complete**

현재 핵심 기능 개발을 완료하고 실제 사용자 QA 및 추천 품질 검증 단계에 있습니다.

```text
Planning             ██████████ 100%
Frontend Flow        ██████████ 100%
Recommendation Core  ██████████ 100%
Real Place Data      ██████████ 100%
Weather Integration  ██████████ 100%
Map Integration      ██████████ 100%
Pedestrian Routing   ██████████ 100%
Sharing              ██████████ 100%
Quality Simulation   ██████████ 100%
User Validation      ██░░░░░░░░  In Progress
```

---

## 오늘, 우리 뭐하지?

장소를 찾는 것에서 끝나지 않고,
**하루 전체를 설계하는 데이트 코스 플래너.**
