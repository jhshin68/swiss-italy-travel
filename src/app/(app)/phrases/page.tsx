'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';

type Language = 'german' | 'italian' | 'french' | 'english';

interface Phrase {
  id: string;
  category: string;
  korean: string;
  local: string;
  pronunciation: string;
}

// 스위스 독일어 + 이탈리아어 필수 회화
const PHRASES: Record<Language, { label: string; flag: string; phrases: Phrase[] }> = {
  german: {
    label: '독일어',
    flag: '🇨🇭',
    phrases: [
      { id: 'g1', category: '인사', korean: '안녕하세요', local: 'Grüezi', pronunciation: '그뤼에치' },
      { id: 'g2', category: '인사', korean: '감사합니다', local: 'Danke', pronunciation: '단케' },
      { id: 'g3', category: '인사', korean: '안녕히 가세요', local: 'Auf Wiedersehen', pronunciation: '아우프 비더제엔' },
      { id: 'g4', category: '인사', korean: '실례합니다', local: 'Entschuldigung', pronunciation: '엔트슐디궁' },
      { id: 'g5', category: '식당', korean: '수돗물 주세요', local: 'Hahnenwasser, bitte', pronunciation: '하넨바서, 비테' },
      { id: 'g6', category: '식당', korean: '계산서 주세요', local: 'Die Rechnung, bitte', pronunciation: '디 레흐눙, 비테' },
      { id: 'g7', category: '식당', korean: '맛있어요!', local: 'Sehr gut!', pronunciation: '제어 굿!' },
      { id: 'g8', category: '교통', korean: '이 열차가 ~행인가요?', local: 'Fährt dieser Zug nach ~?', pronunciation: '페어트 디저 추크 나흐 ~?' },
      { id: 'g9', category: '교통', korean: '플랫폼이 어디예요?', local: 'Wo ist das Gleis?', pronunciation: '보 이스트 다스 글라이스?' },
      { id: 'g10', category: '긴급', korean: '도와주세요!', local: 'Hilfe!', pronunciation: '힐페!' },
      { id: 'g11', category: '긴급', korean: '경찰을 불러주세요', local: 'Rufen Sie die Polizei', pronunciation: '루펜 지 디 폴리차이' },
      { id: 'g12', category: '쇼핑', korean: '얼마예요?', local: 'Wie viel kostet das?', pronunciation: '비 필 코스텟 다스?' },
      { id: 'g13', category: '쇼핑', korean: '네 / 아니오', local: 'Ja / Nein', pronunciation: '야 / 나인' },
      { id: 'g14', category: '기타', korean: '화장실 어디예요?', local: 'Wo ist die Toilette?', pronunciation: '보 이스트 디 투왈레테?' },
    ],
  },
  italian: {
    label: '이탈리아어',
    flag: '🇮🇹',
    phrases: [
      { id: 'i1', category: '인사', korean: '안녕하세요', local: 'Buongiorno', pronunciation: '본조르노' },
      { id: 'i2', category: '인사', korean: '감사합니다', local: 'Grazie', pronunciation: '그라치에' },
      { id: 'i3', category: '인사', korean: '안녕히 가세요', local: 'Arrivederci', pronunciation: '아리베데르치' },
      { id: 'i4', category: '인사', korean: '실례합니다', local: 'Mi scusi', pronunciation: '미 스쿠지' },
      { id: 'i5', category: '식당', korean: '물 주세요', local: 'Acqua, per favore', pronunciation: '아쿠아, 페르 파보레' },
      { id: 'i6', category: '식당', korean: '계산서 주세요', local: 'Il conto, per favore', pronunciation: '일 꼰또, 페르 파보레' },
      { id: 'i7', category: '식당', korean: '맛있어요!', local: 'Buonissimo!', pronunciation: '부오니씨모!' },
      { id: 'i8', category: '식당', korean: '젤라또 하나 주세요', local: 'Un gelato, per favore', pronunciation: '운 젤라또, 페르 파보레' },
      { id: 'i9', category: '교통', korean: '~역 어디예요?', local: 'Dov\'è la stazione ~?', pronunciation: '도베 라 스타치오네 ~?' },
      { id: 'i10', category: '교통', korean: '표 한 장 주세요', local: 'Un biglietto, per favore', pronunciation: '운 빌리에또, 페르 파보레' },
      { id: 'i11', category: '긴급', korean: '도와주세요!', local: 'Aiuto!', pronunciation: '아유토!' },
      { id: 'i12', category: '긴급', korean: '경찰을 불러주세요', local: 'Chiamate la polizia', pronunciation: '키아마테 라 폴리치아' },
      { id: 'i13', category: '쇼핑', korean: '얼마예요?', local: 'Quanto costa?', pronunciation: '꽌또 꼬스따?' },
      { id: 'i14', category: '쇼핑', korean: '네 / 아니오', local: 'Sì / No', pronunciation: '시 / 노' },
      { id: 'i15', category: '기타', korean: '화장실 어디예요?', local: 'Dov\'è il bagno?', pronunciation: '도베 일 바뇨?' },
      { id: 'i16', category: '기타', korean: '사진 찍어주시겠어요?', local: 'Può fare una foto?', pronunciation: '뿌오 파레 우나 포토?' },
    ],
  },
  french: {
    label: '프랑스어',
    flag: '🇫🇷',
    phrases: [
      { id: 'f1', category: '인사', korean: '안녕하세요', local: 'Bonjour', pronunciation: '봉주르' },
      { id: 'f2', category: '인사', korean: '감사합니다', local: 'Merci', pronunciation: '메르시' },
      { id: 'f3', category: '인사', korean: '실례합니다', local: 'Excusez-moi', pronunciation: '엑스큐제 무아' },
      { id: 'f4', category: '식당', korean: '계산서 주세요', local: 'L\'addition, s\'il vous plaît', pronunciation: '라디시옹, 실 부 플레' },
      { id: 'f5', category: '긴급', korean: '도와주세요!', local: 'Au secours!', pronunciation: '오 스쿠르!' },
    ],
  },
  english: {
    label: '영어',
    flag: '🌍',
    phrases: [
      { id: 'e1', category: '식당', korean: '수돗물 주세요 (무료)', local: 'Tap water, please', pronunciation: '탭 워터, 플리즈' },
      { id: 'e2', category: '교통', korean: '이 열차 ~행 맞나요?', local: 'Does this train go to ~?', pronunciation: '더즈 디스 트레인 고 투 ~?' },
      { id: 'e3', category: '긴급', korean: '한국 대사관에 연락해주세요', local: 'Please contact the Korean Embassy', pronunciation: '플리즈 컨택트 더 코리안 엠버시' },
      { id: 'e4', category: '긴급', korean: '아이가 아파요', local: 'My child is sick', pronunciation: '마이 차일드 이즈 식' },
      { id: 'e5', category: '기타', korean: '와이파이 비번이 뭐예요?', local: 'What\'s the WiFi password?', pronunciation: '왓츠 더 와이파이 패스워드?' },
    ],
  },
};

// 꿀팁 데이터
const TIPS = [
  { emoji: '💧', tip: '스위스에서 "Water" 하면 유료 병 생수! → "Hahnenwasser(하넨바서)" 또는 "Tap water" 라고 해야 무료 수돗물' },
  { emoji: '👋', tip: '스위스 독일어권 입장 시 "Grüezi(그뤼에치)"로 인사하면 직원들 반응 좋아요!' },
  { emoji: '💰', tip: '스위스 팁: 의무 아니지만 서비스 좋으면 5~10% 또는 잔돈 남기기' },
  { emoji: '🍽️', tip: '이탈리아 식당 "Coperto(코페르토)" — 테이블 차지 €1~3 별도 부과 (정상)' },
  { emoji: '🚪', tip: '스위스 기차 문은 자동 아님! 정차 시 초록 버튼 눌러야 열림' },
];

// 현지어 페이지 — 여행 필수 회화 모음
export default function PhrasesPage() {
  const [activeLang, setActiveLang] = useState<Language>('german');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const langData = PHRASES[activeLang];
  const categories = [...new Set(langData.phrases.map((p) => p.category))];
  const filtered = activeCategory
    ? langData.phrases.filter((p) => p.category === activeCategory)
    : langData.phrases;

  return (
    <div className="mx-auto max-w-[430px] px-4 pb-24 pt-6">
      {/* 헤더 */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-stone-800">💬 현지어 회화</h1>
        <p className="mt-1 text-sm text-stone-500">
          여행에 꼭 필요한 표현만 모았어요
        </p>
      </div>

      {/* 언어 탭 */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(Object.keys(PHRASES) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => { setActiveLang(lang); setActiveCategory(null); }}
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLang === lang
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>{PHRASES[lang].flag}</span>
            <span>{PHRASES[lang].label}</span>
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            activeCategory === null
              ? 'bg-stone-700 text-white'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              activeCategory === cat
                ? 'bg-stone-700 text-white'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 회화 카드 목록 */}
      <div className="flex flex-col gap-2">
        {filtered.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>

      {/* 꿀팁 섹션 */}
      <section className="mt-6 rounded-2xl bg-amber-50 p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-800">
          <Lightbulb size={16} aria-hidden />
          현지 에티켓 & 꿀팁
        </h2>
        <div className="flex flex-col gap-2">
          {TIPS.map((t, i) => (
            <div key={i} className="flex gap-2 text-xs text-amber-900">
              <span className="flex-shrink-0">{t.emoji}</span>
              <span>{t.tip}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────

function PhraseCard({ phrase }: { phrase: Phrase }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-bold text-stone-800">{phrase.local}</p>
          <p className="mt-0.5 text-xs text-blue-600">{phrase.pronunciation}</p>
          <p className="mt-0.5 text-xs text-stone-400">{phrase.korean}</p>
        </div>
        <span className="rounded-md bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-400">
          {phrase.category}
        </span>
      </div>
    </div>
  );
}
