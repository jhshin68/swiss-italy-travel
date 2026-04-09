// use-location-share.ts — 가족 위치 공유 훅
// Geolocation API로 내 위치를 서버에 전송하고, 가족 위치를 주기적으로 조회한다.
// 배터리 절약을 위해 탭이 비활성(document.hidden)이면 폴링을 중단한다.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { postLocation, getLocations } from '@/lib/api';
import type { LocationData } from '@/types';

// 폴링 주기 (밀리초)
const POLL_INTERVAL = 10_000;

interface LocationShareState {
  /** 내 현재 위치 (GPS) */
  myLocation: { lat: number; lng: number } | null;
  /** 가족 멤버들의 위치 목록 */
  familyLocations: LocationData[];
  /** 내 위치 공유 활성 여부 */
  isSharing: boolean;
  /** 위치 공유 토글 */
  toggleSharing: () => void;
  /** 오류 메시지 */
  error: string | null;
}

/** 가족 위치 공유 훅 — 10초 간격 폴링 기반 */
export function useLocationShare(
  tripId: number,
  enabled: boolean,
): LocationShareState {
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [familyLocations, setFamilyLocations] = useState<LocationData[]>([]);
  const [isSharing, setIsSharing] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // ref로 최신 상태 추적 (인터벌 콜백에서 사용)
  const isSharingRef = useRef(isSharing);
  const tripIdRef = useRef(tripId);

  // isSharing 변경 시 ref 동기화
  useEffect(() => {
    isSharingRef.current = isSharing;
  }, [isSharing]);

  useEffect(() => {
    tripIdRef.current = tripId;
  }, [tripId]);

  const toggleSharing = useCallback(() => {
    setIsSharing((prev) => !prev);
  }, []);

  // GPS 위치 가져오기 + 서버 전송
  const sendMyLocation = useCallback(async () => {
    // 비활성 탭이면 전송 중단 (배터리 절약)
    if (document.hidden) return;
    if (!isSharingRef.current) return;

    if (!navigator.geolocation) {
      setError('이 브라우저에서 위치 서비스를 사용할 수 없습니다');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 5000,
          });
        },
      );

      const { latitude, longitude, accuracy } = position.coords;
      setMyLocation({ lat: latitude, lng: longitude });
      setError(null);

      await postLocation(tripIdRef.current, {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ?? 0,
      });
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('위치 권한이 거부되었습니다. 설정에서 허용해주세요');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('위치 정보를 가져올 수 없습니다');
            break;
          case err.TIMEOUT:
            // 타임아웃은 일시적이므로 에러 표시하지 않음
            break;
        }
      }
    }
  }, []);

  // 가족 위치 조회
  const fetchFamilyLocations = useCallback(async () => {
    // 비활성 탭이면 조회 중단
    if (document.hidden) return;

    try {
      const result = await getLocations(tripIdRef.current);
      if (result.success && result.data) {
        setFamilyLocations(result.data);
      }
    } catch {
      // 조회 실패는 다음 폴링에서 재시도 — 사용자에게 오류 표시 불필요
    }
  }, []);

  // 메인 폴링 루프
  useEffect(() => {
    if (!enabled) return;

    // 즉시 1회 실행
    sendMyLocation();
    fetchFamilyLocations();

    // 10초 간격 폴링
    const intervalId = setInterval(() => {
      if (isSharingRef.current) {
        sendMyLocation();
      }
      fetchFamilyLocations();
    }, POLL_INTERVAL);

    // 탭 활성화 시 즉시 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (isSharingRef.current) {
          sendMyLocation();
        }
        fetchFamilyLocations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    };
  }, [enabled, sendMyLocation, fetchFamilyLocations]);

  return {
    myLocation,
    familyLocations,
    isSharing,
    toggleSharing,
    error,
  };
}
