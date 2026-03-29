// types/index.ts — 공통 타입 정의

/** API 응답 기본 형태 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** JWT 페이로드 */
export interface JwtPayload {
  tripId: number;
  memberId: number;
  memberName: string;
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
