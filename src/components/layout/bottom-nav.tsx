'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CalendarDays,
  Wallet,
  Trophy,
  MessageCircle,
  CheckSquare,
  Siren,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/itinerary', label: '여정', Icon: CalendarDays },
  { href: '/expenses', label: '지출', Icon: Wallet },
  { href: '/missions', label: '미션', Icon: Trophy },
  { href: '/phrases', label: '현지어', Icon: MessageCircle },
  { href: '/checklist', label: '체크', Icon: CheckSquare },
  { href: '/info', label: '긴급', Icon: Siren },
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

          const { Icon } = item;

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
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  aria-hidden
                />
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
