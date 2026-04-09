// types/index.ts — 공통 타입 정의

/** API 응답 기본 형태 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** JWT 페이로드 — API 레벨에서는 string ID 사용 */
export interface JwtPayload {
  tripId: string;
  memberId: string;       // 'member-jinhyung' | 'member-jihyun' | 'member-dongwoo' | 'member-yujin'
  memberName: string;
  role: 'admin' | 'member';
  iat?: number;
  exp?: number;
}

/** Express Request에 인증 정보 추가 */
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}
