import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-md hover:bg-white/40 dark:hover:bg-gray-900/50 transition-colors drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]'
      aria-label='Back'
    >
      <ArrowLeft className='w-full h-full' />
    </button>
  );
}
