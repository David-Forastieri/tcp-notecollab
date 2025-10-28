'use client'

import React from 'react'

export default function RefreshButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={className}
    >
      Refresh Page
    </button>
  )
}
