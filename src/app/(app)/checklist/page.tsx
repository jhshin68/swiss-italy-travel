'use client';

import { useState, useEffect, useCallback } from 'react';

interface CheckItem {
  id: string;
  text: string;
  note?: string;
}

interface CheckCategory {
  id: string;
  title: string;
  emoji: string;
  items: CheckItem[];
}

// 체크리스트 v3 기반 — 8개 카테고리
const CHECKLIST_DATA: CheckCategory[] = [
  {
    id: 'booking',
    title: '사전 예약 필수',
    emoji: '📌',
    items: [
      { id: 'b1', text: '✈ KE917 인천→취리히 (10/8 12:25)', note: '좌석 지정 확인' },
      { id: 'b2', text: '✈ KE932 로마→인천 (10/19 21:25)', note: '수하물 규정 재확인' },
      { id: 'b3', text: '🏔 피르스트 곤돌라 (10/11 오전)', note: 'jungfrau.ch · 왕복 CHF 72/인' },
      { id: 'b4', text: '🏔 고르너그라트 등산열차 (10/13 오전)', note: 'gornergrat.ch · 왕복 CHF 94/인' },
      { id: 'b5', text: '🎨 우피치 미술관 (10/15 12:00)', note: 'uffizi.it · €25~38/인' },
      { id: 'b6', text: '🏛 바티칸 박물관·시스티나 (10/19 08:00)', note: 'museivaticani.va · €17/인' },
      { id: 'b7', text: '🏟 콜로세움+포로로마노 (10/18 09:00)', note: 'coopculture.it · €16/인' },
      { id: 'b8', text: '🏛 두오모 쿠폴라 (10/15 08:00)', note: 'duomo.firenze.it · 통합권 €20/인' },
      { id: 'b9', text: '🚂 스위스 트래블패스 + 패밀리카드', note: '마이리얼트립 or 클룩 · 유진 양 교통비 ₩280,000+ 절약!' },
      { id: 'b10', text: '🚆 비스프→밀라노 EC 좌석 예약 (Day 7)', note: 'sbb.ch · CHF 5~15/인' },
      { id: 'b11', text: '🚆 밀라노→피렌체 Frecciarossa (Day 7)', note: 'trenitalia.com · €30~50/인' },
      { id: 'b12', text: '🚆 피렌체→로마 Frecciarossa (Day 10)', note: 'trenitalia.com · €15~30/인' },
    ],
  },
  {
    id: 'yujin',
    title: '유진 양 특별 체크',
    emoji: '👧',
    items: [
      { id: 'y1', text: '여권 원본 (패밀리카드 검표용)', note: '필수 휴대!' },
      { id: 'y2', text: '피르스트 마운틴카트 탑승 OK (150cm > 135cm)', note: '현장 키 체크 엄격' },
      { id: 'y3', text: '피르스트 플라이어 (짚라인) 키 제한 없음', note: '시속 84km · 가족 전원 탑승' },
      { id: 'y4', text: '고산증 대비 수분 섭취', note: '고르너그라트 3,089m' },
      { id: 'y5', text: '자외선 차단 — 선크림 SPF50+', note: '설원 반사 자외선 강함' },
      { id: 'y6', text: '아이용 선글라스 준비', note: '눈 보호용 UV 차단' },
      { id: 'y7', text: '하루 도보 10km 이내 권장', note: '저녁 조기 귀환 원칙' },
      { id: 'y8', text: '알레르기 식품 메모지 지참', note: '영어·이탈리아어 병기' },
    ],
  },
  {
    id: 'day7',
    title: 'Day 7 대이동 키트',
    emoji: '🚂',
    items: [
      { id: 'd1', text: '🍫 초콜릿·젤리·쿠키 (전날 COOP 구매)', note: '린트·토블론 추천 · CHF 10~15' },
      { id: 'd2', text: '🥪 샌드위치·에너지바', note: '체르마트 베이커리 또는 COOP' },
      { id: 'd3', text: '💧 물 500ml × 인원수', note: 'COOP에서 저렴하게 구매' },
      { id: 'd4', text: '🔒 자전거 케이블 자물쇠', note: '캐리어 기차 기둥에 고정' },
      { id: 'd5', text: '📱 태블릿/폰 오프라인 영상 다운로드', note: '유튜브·넷플릭스 저장' },
      { id: 'd6', text: '🎮 닌텐도 스위치 완충', note: '보조배터리 함께' },
      { id: 'd7', text: '🃏 카드게임·보드게임 (우노 등)', note: '가족 함께 즐기기' },
      { id: 'd8', text: '🎧 노이즈캔슬링 이어폰 완충', note: '기차 소음 차단' },
      { id: 'd9', text: '💊 멀미약', note: '아이 용량 확인 · 30분 전 복용' },
      { id: 'd10', text: '🧸 목베개 or 작은 쿠션', note: '수면 유도용' },
    ],
  },
  {
    id: 'clothing',
    title: '의류 & 신발',
    emoji: '👕',
    items: [
      { id: 'c1', text: '방수·방풍 하드쉘 재킷 (4벌)', note: '알프스 정상 필수 · 아이용 포함' },
      { id: 'c2', text: '경량 패딩 or 플리스 (4벌)', note: '레이어링 핵심' },
      { id: 'c3', text: '긴소매 기능성 언더레이어 (8벌+)', note: '땀 배출 + 보온' },
      { id: 'c4', text: '얇은 긴팔·카디건 (4벌)', note: '이탈리아 도시용 · 일교차 대비' },
      { id: 'c5', text: '⭐ 쿠션 워킹화 or 경량 등산화 (4켤레)', note: '이탈리아 돌길 + 알프스 하이킹 겸용' },
      { id: 'c6', text: '따뜻한 비니 모자 (4개)', note: '알프스 체감온도 -10°C' },
      { id: 'c7', text: '방수 장갑 (4+1쌍)', note: '아이 여분 1쌍 필수' },
      { id: 'c8', text: '목도리 or 넥워머 (4개)', note: '바티칸 어깨 가리개 겸용' },
      { id: 'c9', text: '선크림 SPF50+ (2개)', note: '설원+이탈리아 한낮' },
      { id: 'c10', text: '선글라스 UV 100% (4개)', note: '아이용 포함' },
      { id: 'c11', text: '우산 or 경량 우비 (4개)', note: '하이킹 시 우비가 편리' },
    ],
  },
  {
    id: 'luggage',
    title: '캐리어 & 보안',
    emoji: '🎒',
    items: [
      { id: 'l1', text: '⭐ 24인치 이하 캐리어 (1개/인)', note: '스위스 2층 기차 짐칸 좁음!' },
      { id: 'l2', text: '⭐ 자전거 케이블 자물쇠 (1~2개)', note: '캐리어 기둥 고정 · 도난 방지' },
      { id: 'l3', text: '소매치기 방지 보조가방 (힙색)', note: '이탈리아 관광지 주의' },
      { id: 'l4', text: '스마트폰 목걸이 스트랩 (4개)', note: '분실·낙하 방지' },
      { id: 'l5', text: '유진 양 여권 원본', note: '패밀리카드 검표 시 필수' },
    ],
  },
  {
    id: 'essentials',
    title: '고수 꿀템',
    emoji: '✨',
    items: [
      { id: 'e1', text: '⭐ 1인용 미니 전기장판 (1~2개)', note: '유럽 호텔 바닥 난방 없음!' },
      { id: 'e2', text: '⭐ 시트형 세탁 세제 (1팩)', note: '12일 짐 부피 절감 · 세면대 빨래' },
      { id: 'e3', text: '얼룩 제거펜 (2개)', note: '아이 옷 얼룩 즉시 제거' },
      { id: 'e4', text: '기내 목베개 + 수면 안대 (4세트)', note: '12시간 장거리 비행' },
      { id: 'e5', text: '기내 마스크 (다수)', note: '기내 건조 차단 · 감기 예방' },
      { id: 'e6', text: '순한 컵라면 (4~6개)', note: '고산 정상 특식용 · 한국에서 준비' },
      { id: 'e7', text: '샴푸·바디워시 소용량', note: '유럽 호텔 어메니티 부족 가능' },
      { id: 'e8', text: '때밀이 장갑 (4개)', note: '장거리 여행 개운한 샤워' },
      { id: 'e9', text: '멀티 어댑터 유럽 C타입 (2개)', note: '스위스·이탈리아 공용 원형 2핀' },
    ],
  },
  {
    id: 'apps',
    title: '필수 앱 & 연락처',
    emoji: '📱',
    items: [
      { id: 'a1', text: '⛅ MeteoSwiss (스위스 날씨)', note: '매일 아침 산 정상 기상 확인' },
      { id: 'a2', text: '🚂 SBB Mobile (스위스 열차)', note: '트래블패스 등록 · 플랫폼 확인' },
      { id: 'a3', text: '🇮🇹 Trenitalia (이탈리아 열차)', note: 'Frecciarossa 좌석 관리' },
      { id: 'a4', text: 'Google Maps 오프라인 저장', note: '스위스+이탈리아 지도' },
      { id: 'a5', text: 'Google 번역 오프라인 저장', note: '이탈리아어·독일어·프랑스어' },
      { id: 'a6', text: 'XE Currency (환율 앱)', note: 'CHF/EUR 실시간 환율' },
      { id: 'a7', text: '여행자 보험 증서/앱', note: '해외 의료비 청구 연락처' },
      { id: 'a8', text: '신용카드 해외결제 활성화', note: '비자/마스터 해외 사용 설정' },
      { id: 'a9', text: '해외 로밍 또는 현지 SIM', note: '가족 전원 데이터' },
    ],
  },
  {
    id: 'accommodation',
    title: '숙소 예약',
    emoji: '🏨',
    items: [
      { id: 'h1', text: '취리히 호텔 (Day 1, 1박)', note: '공항 근처 or 시내 중심' },
      { id: 'h2', text: '그린델발트 (Day 2~4, 3박)', note: '선스타 or 알핀 아파트먼트 · 피르스트 근거리' },
      { id: 'h3', text: '체르마트 (Day 5~6, 2박)', note: '앰버서더 · "Matterhorn view" 요청' },
      { id: 'h4', text: '피렌체 (Day 7~9, 3박)', note: 'SMN역 도보 5분 이내 · 짐 이동 최소화' },
      { id: 'h5', text: '로마 (Day 10~11, 2박)', note: '테르미니역 도보 5분 이내 · 공항 접근성' },
    ],
  },
];

// localStorage 키
const STORAGE_KEY = 'travel-checklist-v3';

// 체크리스트 페이지 — 체크리스트 v3 기반
export default function ChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage에서 체크 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved) as string[]));
    }
    setIsLoaded(true);
  }, []);

  // 체크 토글
  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // 전체 통계
  const totalItems = CHECKLIST_DATA.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = checkedItems.size;

  const displayCategories = activeCategory
    ? CHECKLIST_DATA.filter((c) => c.id === activeCategory)
    : CHECKLIST_DATA;

  if (!isLoaded) return null;

  return (
    <div className="mx-auto max-w-[430px] px-4 pb-24 pt-6">
      {/* 헤더 */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-stone-800">✅ 여행 준비 체크</h1>
        <p className="mt-1 text-sm text-stone-500">
          출발 전 꼼꼼히 확인하세요!
        </p>
        {/* 전체 진행률 */}
        <div className="mx-auto mt-3 max-w-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>완료 {checkedCount}/{totalItems}</span>
            <span>{totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            activeCategory === null
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600'
          }`}
        >
          전체
        </button>
        {CHECKLIST_DATA.map((cat) => {
          const catChecked = cat.items.filter((i) => checkedItems.has(i.id)).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                activeCategory === cat.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{catChecked}/{cat.items.length}</span>
            </button>
          );
        })}
      </div>

      {/* 체크리스트 카드 */}
      <div className="flex flex-col gap-4">
        {displayCategories.map((category) => {
          const catChecked = category.items.filter((i) => checkedItems.has(i.id)).length;
          const allDone = catChecked === category.items.length;

          return (
            <section
              key={category.id}
              className={`rounded-2xl border p-4 ${
                allDone ? 'border-green-200 bg-green-50' : 'border-stone-100 bg-white'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-800">
                  {category.emoji} {category.title}
                </h2>
                <span className={`text-xs font-medium ${allDone ? 'text-green-600' : 'text-stone-400'}`}>
                  {catChecked}/{category.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {category.items.map((item) => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                        isChecked ? 'bg-green-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${
                        isChecked
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-stone-300 bg-white'
                      }`}>
                        {isChecked ? '✓' : ''}
                      </span>
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${isChecked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                          {item.text}
                        </p>
                        {item.note && (
                          <p className="mt-0.5 text-[10px] text-stone-400">{item.note}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
