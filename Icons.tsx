import React from 'react';

const make =
  (d: string) =>
  ({ size = 20 }: { size?: number }) =>
    (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d={d} />
      </svg>
    );

export const IconHome = make('M3 11l9-8 9 8M5 10v10h14V10');
export const IconUsers = make(
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'
);
export const IconChart = make('M4 20V10M10 20V4M16 20v-8M22 20H2');
export const IconSettings = make('M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4');
export const IconPlus = make('M12 5v14M5 12h14');
export const IconPhone = make(
  'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z'
);
export const IconChat = make('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
export const IconDownload = make('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3');
export const IconShare = make('M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13');
export const IconSearch = make('M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3');
export const IconLock = make('M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4');
export const IconTrash = make('M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6');
export const IconEdit = make('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z');
export const IconBack = make('M15 18l-6-6 6-6');
export const IconX = make('M18 6L6 18M6 6l12 12');
export const IconCheck = make('M20 6L9 17l-5-5');
