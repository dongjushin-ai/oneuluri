# DATA_MODEL.md

## 1. Place (장소)
- id: string
- name: string
- category: 'RESTAURANT' | 'CAFE' | 'SPOT' | 'ACTIVITY'
- lat: number
- lng: number
- address: string
- avg_price: number
- tags: string[] (예: ['러블리', '인스타감성', '조용한'])
- indoor: boolean
- opening_hours: { open: string, close: string, break_start?: string, break_end?: string }

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