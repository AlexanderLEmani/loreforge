'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      capture_pageleave: true,
    })
  }, [])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return children
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
