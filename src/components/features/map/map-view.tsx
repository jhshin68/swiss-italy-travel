'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DaySchedule, ScheduleItem } from '@/data/itinerary';

// Leaflet 기본 마커 아이콘 경로 수정 (Next.js에서 깨지는 문제 해결)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 도시별 좌표 — 여행 경로 5개 도시
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  '취리히': { lat: 47.3769, lng: 8.5417 },
  '그린델발트': { lat: 46.6244, lng: 8.0413 },
  '체르마트': { lat: 46.0207, lng: 7.7491 },
  '피렌체': { lat: 43.7696, lng: 11.2558 },
  '로마': { lat: 41.9028, lng: 12.4964 },
};

// 도시명에서 좌표를 가져오는 함수 — 경유지 포함 도시명 처리
function getCityCoords(city: string): { lat: number; lng: number } | null {
  // 정확히 매칭
  if (CITY_COORDS[city]) return CITY_COORDS[city];

  // "베른→그린델발트" 같은 경유지는 마지막 도시 기준
  for (const key of Object.keys(CITY_COORDS)) {
    if (city.includes(key)) return CITY_COORDS[key];
  }
  return null;
}

// 전체 여행 경로 polyline 좌표 (도시 순서대로)
const ROUTE_COORDS: [number, number][] = [
  [47.3769, 8.5417],
  [46.6244, 8.0413],
  [46.0207, 7.7491],
  [43.7696, 11.2558],
  [41.9028, 12.4964],
];

// 카테고리별 아이콘 매핑
const CATEGORY_ICONS: Record<ScheduleItem['type'], string> = {
  transport: '🚂',
  sightseeing: '🏛',
  meal: '🍽',
  hotel: '🏨',
  activity: '⛰️',
};

// Day 변경 시 지도 이동을 처리하는 내부 컴포넌트
function MapUpdater({
  center,
  zoom,
  showAll,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  showAll: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (showAll) {
      // 전체 경로 보기: 5개 도시를 모두 포함하는 bounds
      const bounds = L.latLngBounds(
        ROUTE_COORDS.map(([lat, lng]) => L.latLng(lat, lng)),
      );
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
    } else {
      map.flyTo([center.lat, center.lng], zoom, { duration: 1.0 });
    }
  }, [map, center.lat, center.lng, zoom, showAll]);

  return null;
}

interface MapViewProps {
  selectedDay: DaySchedule;
  showAllRoute: boolean;
}

// 지도 뷰 컴포넌트 — Leaflet + OpenStreetMap
export function MapView({ selectedDay, showAllRoute }: MapViewProps) {
  const cityCoords = useMemo(
    () => getCityCoords(selectedDay.city),
    [selectedDay.city],
  );

  // 기본 중심: 스위스 중앙
  const center = cityCoords ?? { lat: 46.8, lng: 8.2 };

  return (
    <div className="relative h-[55vh] w-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 전체 여행 경로 — 테라코타 색상 점선 */}
        <Polyline
          positions={ROUTE_COORDS}
          pathOptions={{
            color: '#C8552A',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.7,
          }}
        />

        {/* 전체 경로 보기일 때 5개 도시 마커 전부 표시 */}
        {showAllRoute &&
          Object.entries(CITY_COORDS).map(([name, coord]) => (
            <Marker key={name} position={[coord.lat, coord.lng]}>
              <Popup>
                <strong>{name}</strong>
              </Popup>
            </Marker>
          ))}

        {/* 선택된 Day의 도시 마커 + 팝업 */}
        {!showAllRoute && cityCoords && (
          <Marker position={[cityCoords.lat, cityCoords.lng]}>
            <Popup maxWidth={280} minWidth={200}>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                <strong style={{ fontSize: '15px' }}>
                  {selectedDay.city}
                </strong>
                <br />
                <span style={{ color: '#666' }}>
                  Day {selectedDay.day} &middot; {selectedDay.theme}
                </span>
                <hr style={{ margin: '6px 0', borderColor: '#eee' }} />
                {selectedDay.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <span>{CATEGORY_ICONS[item.type]}</span>
                    <span>
                      {item.mapUrl ? (
                        <a
                          href={item.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#C8552A', textDecoration: 'none' }}
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 지도 중심/줌 업데이트 */}
        <MapUpdater
          center={center}
          zoom={14}
          showAll={showAllRoute}
        />
      </MapContainer>
    </div>
  );
}
