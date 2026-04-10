import { NextRequest, NextResponse } from 'next/server';

// 여행 일정에 따른 도시 좌표 (open-meteo용)
const CITY_COORDS: Record<string, { lat: number; lon: number; name: string; flag: string }> = {
  zurich: { lat: 47.38, lon: 8.54, name: '취리히', flag: '🇨🇭' },
  grindelwald: { lat: 46.62, lon: 8.04, name: '그린델발트', flag: '🇨🇭' },
  zermatt: { lat: 46.02, lon: 7.75, name: '체르마트', flag: '🇨🇭' },
  florence: { lat: 43.77, lon: 11.25, name: '피렌체', flag: '🇮🇹' },
  rome: { lat: 41.90, lon: 12.49, name: '로마', flag: '🇮🇹' },
};

// 여행 날짜별 도시 매핑 (v6 가이드 기준)
function getCityByDate(now: Date): string {
  const tripStart = new Date('2026-10-08');
  const diff = Math.floor((now.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'zurich'; // 여행 전: 첫 목적지
  if (diff === 0) return 'zurich'; // Day 1
  if (diff <= 3) return 'grindelwald'; // Day 2~4
  if (diff <= 5) return 'zermatt'; // Day 5~6
  if (diff <= 8) return 'florence'; // Day 7~9
  if (diff <= 11) return 'rome'; // Day 10~12
  return 'rome'; // 여행 후
}

// WMO 날씨 코드 → 이모지 + 설명 변환
function wmoToWeather(code: number): { emoji: string; description: string } {
  if (code === 0) return { emoji: '☀️', description: '맑음' };
  if (code <= 3) return { emoji: '⛅', description: '구름' };
  if (code <= 48) return { emoji: '🌫', description: '안개' };
  if (code <= 57) return { emoji: '🌧', description: '이슬비' };
  if (code <= 67) return { emoji: '🌧', description: '비' };
  if (code <= 77) return { emoji: '❄️', description: '눈' };
  if (code <= 82) return { emoji: '🌦', description: '소나기' };
  if (code <= 99) return { emoji: '⛈', description: '뇌우' };
  return { emoji: '☁️', description: '흐림' };
}

export async function GET(request: NextRequest) {
  // 쿼리 파라미터로 도시 지정 가능, 없으면 여행 일정 기준 자동 선택
  const cityParam = request.nextUrl.searchParams.get('city');
  const cityKey = cityParam && CITY_COORDS[cityParam] ? cityParam : getCityByDate(new Date());
  const city = CITY_COORDS[cityKey];

  try {
    // open-meteo API — 현재 날씨 + 7일 예보 (가입/키 불필요)
    // forecast_days=3 — 오늘·내일·모레 3일치만 요청
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // 30분 서버 캐시

    if (!res.ok) {
      return NextResponse.json(
        { error: `open-meteo API 오류: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // 현재 날씨
    const currentWeather = wmoToWeather(data.current.weathercode);
    const current = {
      temp: Math.round(data.current.temperature_2m),
      humidity: data.current.relativehumidity_2m,
      windSpeed: Math.round(data.current.windspeed_10m),
      weatherCode: data.current.weathercode,
      emoji: currentWeather.emoji,
      description: currentWeather.description,
    };

    // 7일 예보
    const daily = data.daily.time.map((date: string, i: number) => {
      const w = wmoToWeather(data.daily.weathercode[i]);
      return {
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipProb: data.daily.precipitation_probability_max[i] ?? 0,
        weatherCode: data.daily.weathercode[i],
        emoji: w.emoji,
        description: w.description,
      };
    });

    // 날씨 팁 생성
    let tip = '';
    if (current.weatherCode <= 2) {
      tip = '☀ 피르스트/고르너그라트 최적 컨디션!';
    }
    const todayPrecip = daily[0]?.precipProb ?? 0;
    if (todayPrecip >= 70) {
      tip = '🌧 날씨가 흐립니다. Plan B 일정 확인하세요';
    }

    return NextResponse.json({
      city: city.name,
      flag: city.flag,
      cityKey,
      current,
      daily,
      tip,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: '날씨 데이터를 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}
