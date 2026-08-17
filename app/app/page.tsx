'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-white text-black">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
          Đang tải Zero AI Note...
        </span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}