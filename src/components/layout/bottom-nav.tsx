'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** true면 빨간색 강조 (긴급 탭용) */
  accent?: boolean;
}

// 스크린샷 기준 7개 탭
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/itinerary', label: '여정', icon: '🗺️' },
  { href: '/expenses', label: '지출', icon: '💰' },
  { href: '/missions', label: '미션', icon: '🏆' },
  { href: '/phrasebook', label: '현지어', icon: '💬' },
  { href: '/checklist', label: '체크', icon: '✅' },
  { href: '/info', label: '긴급', icon: '🆘', accent: true },
];

// 하단 탭 네비게이션 — 7개 섹션 이동
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[var(--color-text)]/10 bg-[var(--color-surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 transition-colors ${
                  item.accent
                    ? isActive
                      ? 'text-red-500'
                      : 'text-red-400 hover:text-red-500'
                    : isActive
                      ? 'font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]/80'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[9px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
