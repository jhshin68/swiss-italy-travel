import type { ApiResponse, LoginData, Member } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://slp-travel.duckdns.org';

// httpOnly cookie 전송을 위해 credentials: 'include' 필수
async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const body: ApiResponse<T> = await response.json();
    return body;
  } catch {
    return {
      success: false,
      error: '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.',
    };
  }
}

// PIN + 멤버 ID로 로그인
export async function login(pin: string, memberId: string): Promise<ApiResponse<LoginData>> {
  return fetchApi<LoginData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ pin, memberId }),
  });
}

// 현재 인증 상태 확인 (httpOnly cookie 기반)
export async function getMe(): Promise<ApiResponse<Member>> {
  return fetchApi<Member>('/api/auth/me');
}

// 로그아웃 (서버에서 cookie 제거)
export async function logout(): Promise<ApiResponse<null>> {
  return fetchApi<null>('/api/auth/logout', {
    method: 'POST',
  });
}
