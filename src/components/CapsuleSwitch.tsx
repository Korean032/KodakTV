/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from 'react';

interface CapsuleSwitchProps {
  options: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

const CapsuleSwitch: React.FC<CapsuleSwitchProps> = ({
  options,
  active,
  onChange,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const activeIndex = options.findIndex((opt) => opt.value === active);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef<boolean>(false);
  const threshold = 40; // px

  // 更新指示器位置
  const updateIndicatorPosition = () => {
    if (
      activeIndex >= 0 &&
      buttonRefs.current[activeIndex] &&
      containerRef.current
    ) {
      const button = buttonRefs.current[activeIndex];
      const container = containerRef.current;
      if (button && container) {
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (buttonRect.width > 0) {
          setIndicatorStyle({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    }
  };

  // 组件挂载时立即计算初始位置
  useEffect(() => {
    const timeoutId = setTimeout(updateIndicatorPosition, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // 监听选中项变化
  useEffect(() => {
    const timeoutId = setTimeout(updateIndicatorPosition, 0);
    return () => clearTimeout(timeoutId);
  }, [activeIndex]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    movedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    movedRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = Math.abs(t.clientY - startRef.current.y);
    // 仅处理水平滑动，且需要一定阈值
    if (Math.abs(dx) > threshold && dy < 30) {
      if (dx < 0 && activeIndex < options.length - 1) {
        onChange(options[activeIndex + 1].value);
      } else if (dx > 0 && activeIndex > 0) {
        onChange(options[activeIndex - 1].value);
      }
    }
    startRef.current = null;
    movedRef.current = false;
  };

  return (
    <div className={`relative flex flex-col items-center mt-16 sm:mt-20 ${className || ''}`}>
      {/* 顶部品牌标签 */}
      <div
        className='
          absolute -top-20 left-1/2 -translate-x-1/2
          px-6 py-3 text-base sm:text-lg font-semibold tracking-wide
          bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl
          border border-gray-200/40 dark:border-gray-700/40
          rounded-full shadow-md
        '
      >
        <span className='bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent'>
          KodakTV
        </span>
      </div>

      <div
        ref={containerRef}
        className='
          relative inline-flex
          bg-white/20 dark:bg-gray-900/30 backdrop-blur-xl
          border border-gray-200/40 dark:border-gray-700/40
          rounded-full p-1
        '
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* 滑动的白色背景指示器 */}
      {indicatorStyle.width > 0 && (
        <div
          className='absolute top-1 bottom-1 bg-white dark:bg-gray-500 rounded-full shadow-sm transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      )}

      {options.map((opt, index) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 w-16 px-3 py-1 text-xs sm:w-20 sm:py-2 sm:text-sm rounded-full font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
      </div>
    </div>
  );
};

export default CapsuleSwitch;
