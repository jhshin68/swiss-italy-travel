'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/itinerary', label: '일정', icon: '📅' },
  { href: '/map', label: '지도', icon: '🗺️' },
  { href: '/expenses', label: '경비', icon: '💰' },
  { href: '/info', label: '비상', icon: 'ℹ️' },
];

// 하단 탭 네비게이션 — 5개 메인 섹션으로 이동
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[var(--color-text)]/10 bg-[var(--color-surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          // 홈은 정확히 '/'일 때만 활성, 나머지는 prefix 매칭
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isActive
                    ? 'font-semibold text-[var(--color-primary)]'
                    : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]/80'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
