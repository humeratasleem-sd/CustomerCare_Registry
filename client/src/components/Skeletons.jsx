import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    </div>
    <div className="mt-4 h-8 w-16 bg-slate-350 dark:bg-slate-700 rounded"></div>
    <div className="mt-2 h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
    <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 flex-1 bg-slate-200 dark:bg-slate-800 rounded"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex border-b border-slate-100 dark:border-slate-800/40 py-3.5 gap-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 flex-1 bg-slate-150 dark:bg-slate-850 rounded"></div>
        ))}
      </div>
    ))}
  </div>
);

export const ChatSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 animate-pulse h-full">
    <div className="flex gap-3 justify-start max-w-[70%]">
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    </div>
    <div className="flex gap-3 justify-end self-end max-w-[70%] text-right">
      <div className="flex flex-col items-end gap-2">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-14 w-60 bg-slate-250 dark:bg-slate-700 rounded-2xl"></div>
      </div>
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
    </div>
    <div className="flex gap-3 justify-start max-w-[70%]">
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-pulse h-80 flex flex-col justify-end gap-4">
    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-auto"></div>
    <div className="flex items-end justify-between px-4 h-48">
      <div className="h-24 w-12 bg-slate-150 dark:bg-slate-800 rounded-t"></div>
      <div className="h-32 w-12 bg-slate-150 dark:bg-slate-800 rounded-t"></div>
      <div className="h-40 w-12 bg-slate-200 dark:bg-slate-800 rounded-t"></div>
      <div className="h-16 w-12 bg-slate-150 dark:bg-slate-800 rounded-t"></div>
      <div className="h-28 w-12 bg-slate-200 dark:bg-slate-800 rounded-t"></div>
      <div className="h-36 w-12 bg-slate-150 dark:bg-slate-800 rounded-t"></div>
    </div>
  </div>
);
