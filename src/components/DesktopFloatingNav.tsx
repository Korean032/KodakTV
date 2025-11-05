/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clover, Film, Home, Radio, Search as SearchIcon, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DesktopFloatingNavProps {
  /** 主动指定当前激活的路径 */
  activePath?: string;
}

const DesktopFloatingNav = ({ activePath }: DesktopFloatingNavProps) => {
  const pathname = usePathname();
  const currentActive = activePath ?? pathname;

  const [navItems, setNavItems] = useState([
    { icon: Home, label: '首页', href: '/' },
    { icon: Film, label: '电影', href: '/douban?type=movie' },
    { icon: Tv, label: '剧集', href: '/douban?type=tv' },
    { icon: Cat, label: '动漫', href: '/douban?type=anime' },
    { icon: Clover, label: '综艺', href: '/douban?type=show' },
    { icon: Radio, label: '直播', href: '/live' },
  ]);

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    if (runtimeConfig?.CUSTOM_CATEGORIES?.length > 0) {
      setNavItems((prevItems) => [
        ...prevItems,
        {
          icon: Star,
          label: '自定义',
          href: '/douban?type=custom',
        },
      ]);
    }
  }, []);

  const isActive = (href: string) => {
    const typeMatch = href.match(/type=([^&]+)/)?.[1];
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(href);
    return (
      decodedActive === decodedItemHref ||
      (decodedActive.startsWith('/douban') &&
        decodedActive.includes(`type=${typeMatch}`))
    );
  };

  return (
    <div
      className='hidden md:block fixed z-[600]'
      style={{
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div className='relative inline-block' style={{ maxWidth: 'min(960px, 90vw)' }}>
        <nav
          className='
            flex
            bg-white/20 dark:bg-gray-900/30 backdrop-blur-2xl
            border border-gray-200/40 dark:border-gray-700/40
            rounded-full shadow-lg
            px-4 py-2
          '
        >
          <ul className='flex items-center justify-center gap-3 flex-wrap'>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className='flex-shrink-0'>
                <Link
                  href={item.href}
                  className='
                    inline-flex items-center gap-2 px-3 py-2
                    rounded-xl transition-colors
                  '
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300'
                      }`}
                  />
                  <span
                    className={
                      active
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-200'
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          </ul>
        </nav>

        {/* 独立搜索按钮，紧贴底栏右侧留少许间距 */}
        <Link
          href='/search'
          aria-label='搜索'
          className='
            absolute -right-14 top-1/2 -translate-y-1/2
            w-12 h-12 rounded-full
            flex items-center justify-center
            bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl
            border border-gray-200/40 dark:border-gray-700/40
            shadow-md hover:bg-white/40 dark:hover:bg-gray-900/50
            transition-colors
          '
        >
          <SearchIcon className='w-6 h-6 text-gray-700 dark:text-gray-200' />
        </Link>
      </div>
    </div>
  );
};

export default DesktopFloatingNav;