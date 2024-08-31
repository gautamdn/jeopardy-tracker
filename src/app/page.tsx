'use client'

import React from 'react';
import JeopardyTracker from '@/components/JeopardyTracker';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <JeopardyTracker />
    </main>
  )
}