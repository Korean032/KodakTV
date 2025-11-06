"use client";
import { BackButton } from './BackButton';
import DesktopFloatingNav from './DesktopFloatingNav';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useSite } from './SiteProvider';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  const { siteName } = useSite();
  return (
    <div className='w-full min-h-screen'>
      {/* 移动端头部 */}
      <MobileHeader showBackButton={['/play', '/live'].includes(activePath)} />

      {/* 主要布局容器 */}
      <div className='w-full min-h-screen md:min-h-auto'>
        {/* 主内容区域 */}
        <div className='relative min-w-0 transition-all duration-300'>
          {/* 桌面端左上角返回按钮 */}
          {['/play', '/live'].includes(activePath) && (
            <div className='absolute top-3 left-1 z-20 hidden md:flex'>
              <BackButton />
            </div>
          )}

          {/* 桌面端顶层品牌胶囊（除首页外） */}
          {activePath !== '/' && activePath !== '/search' && (
            <div className='absolute top-2 left-1/2 -translate-x-1/2 z-20 hidden md:flex'>
              <div className='inline-flex items-center px-6 py-2 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-md'>
                <span className='bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent text-sm sm:text-base font-semibold tracking-tight'>
                  {siteName}
                </span>
              </div>
            </div>
          )}

          {/* 桌面端顶部按钮（玻璃态容器） */}
          <div className='absolute top-2 right-4 z-20 hidden md:flex items-center gap-1 bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 rounded-full shadow-md px-1 py-1'>
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* 主内容 */}
          <main
            className='flex-1 md:min-h-0 mb-14 md:mb-0 md:mt-0 mt-12'
            style={{
              paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className='md:hidden'>
        <MobileBottomNav activePath={activePath} />
      </div>

      {/* 桌面端悬浮底栏（居中液态玻璃） */}
      <div className='hidden md:block'>
        <DesktopFloatingNav activePath={activePath} />
      </div>
    </div>
  );
};

export default PageLayout;
