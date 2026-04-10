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
  { href: '/itinerary', label: '여정', icon: '📅' },
  { href: '/expenses', label: '지출', icon: '💰' },
  { href: '/missions', label: '미션', icon: '🏆' },
  { href: '/phrases', label: '현지어', icon: '💬' },
  { href: '/checklist', label: '체크', icon: '✅' },
  { href: '/info', label: '긴급', icon: '🚨' },
];

// 하단 탭 네비게이션 — 7개 메인 섹션으로 이동
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
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 pb-1 pt-1.5 text-[11px] transition-colors ${
                  isActive
                    ? 'font-semibold text-[var(--color-primary)]'
                    : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]/80'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {/* 활성 탭 dot indicator — invisible로 레이아웃 고정 유지 */}
                <span
                  className={`h-1 w-1 rounded-full bg-[var(--color-primary)] ${
                    isActive ? '' : 'invisible'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
