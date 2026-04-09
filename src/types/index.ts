// 멤버 역할 타입
export type MemberRole = 'admin' | 'member';

// 서버에서 반환하는 멤버 정보
export interface Member {
  memberId: string;
  memberName: string;
  emoji: string;
  color: string;
  role: MemberRole;
  tripId: string;
}

// API 공통 응답 타입 — 모든 API 호출에서 사용
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 로그인 요청 타입
export interface LoginRequest {
  pin: string;
  memberId: string;
}

// 로그인 응답 데이터
export interface LoginData {
  member: Member;
  token: string;
}

// 멤버 선택 UI에서 사용하는 프리셋 정보
export interface MemberPreset {
  memberId: string;
  memberName: string;
  emoji: string;
  color: string;
}
