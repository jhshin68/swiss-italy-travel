'use client';

import { useEffect, useState } from 'react';

interface CurrentWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  emoji: string;
  description: string;
}

interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  weatherCode: number;
  emoji: string;
  description: string;
}

interface WeatherData {
  city: string;
  flag: string;
  cityKey: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  tip: string;
  updatedAt: string;
}

// 날씨 코드에 따른 배경색
function weatherBg(code: number): string {
  if (code <= 2) return 'bg-gradient-to-r from-sky-400 to-blue-400';
  if (code <= 3) return 'bg-gradient-to-r from-gray-300 to-gray-400';
  if (code <= 48) return 'bg-gradient-to-r from-gray-400 to-gray-500';
  if (code <= 67) return 'bg-gradient-to-r from-blue-400 to-blue-500';
  if (code <= 77) return 'bg-gradient-to-r from-slate-300 to-slate-400';
  if (code <= 82) return 'bg-gradient-to-r from-blue-300 to-blue-400';
  return 'bg-gradient-to-r from-purple-400 to-purple-500';
}

// 요일 이름 (한국어)
function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return '오늘';
  if (index === 1) return '내일';
  if (index === 2) return '모레';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()] ?? '';
}

const CACHE_KEY_PREFIX = 'weather-cache-';
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// localStorage 캐시 읽기
function readCache(cityKey: string): WeatherData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + cityKey);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { data: WeatherData; ts: number };
    if (Date.now() - cached.ts < CACHE_TTL) return cached.data;
  } catch { /* 캐시 손상 시 무시 */ }
  return null;
}

// localStorage 캐시 쓰기
function writeCache(cityKey: string, data: WeatherData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + cityKey, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* 쿼터 초과 등 무시 */ }
}

// 마지막 갱신 시각 표시
function timeSince(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  return `${Math.floor(min / 60)}시간 전`;
}

// 날씨 위젯 — open-meteo 기반, 현재 날씨(크게) + 내일·모레(작게)
export function WeatherCard() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 캐시 우선 확인 (도시는 서버가 결정하므로 일단 fetch 후 캐시 키 결정)
    async function load() {
      try {
        const res = await fetch('/api/weather');
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json() as WeatherData;
        writeCache(json.cityKey, json);
        setData(json);
      } catch {
        // 네트워크 실패 시 캐시 fallback — 모든 도시 키 시도
        const cities = ['zurich', 'grindelwald', 'zermatt', 'florence', 'rome'];
        for (const key of cities) {
          const cached = readCache(key);
          if (cached) {
            setData(cached);
            setError(false);
            setLoading(false);
            return;
          }
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white/60 py-4 text-center text-sm text-stone-400">
        날씨 불러오는 중...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-white/60 py-3 text-center text-sm text-stone-400">
        날씨 정보를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 섹션1 — 현재 날씨 카드 (컴팩트 가로형) */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-sm ${weatherBg(data.current.weatherCode)}`}>
        <span className="text-4xl">{data.current.emoji}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold">{data.current.temp}°</span>
            <span className="text-sm opacity-90">{data.current.description}</span>
          </div>
          <p className="text-xs font-medium opacity-90">
            {data.flag} {data.city}
          </p>
          <div className="mt-0.5 flex gap-3 text-[10px] opacity-80">
            <span>💧 {data.current.humidity}%</span>
            <span>💨 {data.current.windSpeed}km/h</span>
          </div>
        </div>
      </div>

      {/* 날씨 팁 */}
      {data.tip && (
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
          data.tip.includes('🌧')
            ? 'bg-red-50 text-red-600'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {data.tip}
        </div>
      )}

      {/* 섹션2 — 내일·모레 예보 (작게 나란히) */}
      {data.daily.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {data.daily.slice(1).map((day, i) => (
            <div
              key={day.date}
              className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2"
            >
              <span className="text-xl">{day.emoji}</span>
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-stone-700">{day.tempMax}°</span>
                  <span className="text-[10px] text-stone-400">/ {day.tempMin}°</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  {getDayLabel(day.date, i + 1)} &middot; {day.description}
                </p>
                {day.precipProb > 0 && (
                  <span className={`text-[9px] ${day.precipProb >= 70 ? 'font-bold text-blue-600' : 'text-blue-400'}`}>
                    💧{day.precipProb}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 마지막 갱신 시각 */}
      <p className="text-right text-[9px] text-stone-400">
        마지막 갱신: {timeSince(data.updatedAt)}
      </p>
    </div>
  );
}
