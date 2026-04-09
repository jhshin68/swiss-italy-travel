import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * 백엔드 API를 mock — /api/auth/me 를 가로채 진형(admin)으로 로그인된 상태 반환.
 * checkAuth() 가 외부 API 서버 (slp-travel.duckdns.org) 를 호출하므로
 * route intercept 로 처리한다.
 */
async function mockAuthAs(page: Page) {
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'member-jinhyung',
          name: '진형',
          emoji: '👨',
          role: 'admin',
        },
      }),
    });
  });
}

// ── 홈 화면 ─────────────────────────────────────

test.describe('홈 화면', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAs(page);
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
  });

  test('타이틀 텍스트 렌더링', async ({ page }) => {
    await expect(page.getByText('우리 가족')).toBeVisible();
    await expect(page.getByText('대탐험!')).toBeVisible();
    await expect(page.getByText('스위스')).toBeVisible();
    await page.screenshot({ path: 'test-results/01-home-title.png' });
  });

  test('D-Day 카운터 표시', async ({ page }) => {
    const dday = page.locator('text=/D-\\d+/');
    await expect(dday).toBeVisible();
    const text = await dday.textContent();
    console.log('D-Day 값:', text);
  });

  test('스위스 국기 🇨🇭 표시', async ({ page }) => {
    // 텍스트 콘텐츠 기반으로 국기 확인
    const flag = page.locator('text=🇨🇭');
    await expect(flag).toBeVisible();
  });

  test('날씨 섹션 표시', async ({ page }) => {
    await expect(page.getByText('현재 날씨')).toBeVisible();
    await expect(page.getByText('날씨 정보 없음')).toBeVisible();
  });

  test('다음 미션 카드 표시', async ({ page }) => {
    await expect(page.getByText(/다음 미션/)).toBeVisible();
    await expect(page.getByText(/DAY \d+/)).toBeVisible();
  });

  test('방문 도장 8개 렌더링', async ({ page }) => {
    await expect(page.getByText('방문 도장 모으기')).toBeVisible();
    // 도장 카드는 span 안에 exact 텍스트로 존재
    const stamps = ['베른', '그린델발트', '피르스트', '체르마트', '고르너그라트', '젤라또', '피렌체', '콜로세움'];
    for (const name of stamps) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('홈 전체 스크린샷', async ({ page }) => {
    await page.screenshot({ path: 'test-results/01-home-full.png', fullPage: true });
  });
});

// ── 하단 탭 내비게이션 ──────────────────────────

test.describe('하단 탭 내비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAs(page);
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
  });

  test('7개 탭 모두 표시', async ({ page }) => {
    const labels = ['홈', '여정', '지출', '미션', '현지어', '체크', '긴급'];
    for (const label of labels) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
    await page.screenshot({ path: 'test-results/02-bottom-nav.png' });
  });

  test('여정 탭 → /itinerary', async ({ page }) => {
    await page.getByRole('link', { name: '여정' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/itinerary/);
    await page.screenshot({ path: 'test-results/03-itinerary.png' });
  });

  test('지출 탭 → /expenses', async ({ page }) => {
    await page.getByRole('link', { name: '지출' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/expenses/);
    await page.screenshot({ path: 'test-results/04-expenses.png' });
  });

  test('미션 탭 → /missions', async ({ page }) => {
    await page.getByRole('link', { name: '미션' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/missions/);
    await expect(page.getByRole('heading', { name: '미션' })).toBeVisible();
    await page.screenshot({ path: 'test-results/05-missions.png' });
  });

  test('현지어 탭 → /phrasebook', async ({ page }) => {
    await page.getByRole('link', { name: '현지어' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/phrasebook/);
    await expect(page.getByRole('heading', { name: '현지어' })).toBeVisible();
    await page.screenshot({ path: 'test-results/06-phrasebook.png' });
  });

  test('체크 탭 → /checklist', async ({ page }) => {
    await page.getByRole('link', { name: '체크' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/checklist/);
    await expect(page.getByText('체크리스트')).toBeVisible();
    await page.screenshot({ path: 'test-results/07-checklist.png' });
  });

  test('긴급 탭 → /info', async ({ page }) => {
    await page.getByRole('link', { name: '긴급' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/info/);
    await page.screenshot({ path: 'test-results/08-info.png' });
  });
});

// ── 인증 플로우 ──────────────────────────────────

test.describe('인증 플로우', () => {
  test('미인증 → /login 리다이렉트', async ({ page }) => {
    // mock 없이 접근하면 API 실패 → 로그인으로 리다이렉트
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
    });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'test-results/09-login-redirect.png' });
  });

  test('로그인 페이지 렌더링', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('PIN 6자리를 입력하세요')).toBeVisible();
    await page.screenshot({ path: 'test-results/10-login-page.png' });
  });
});
