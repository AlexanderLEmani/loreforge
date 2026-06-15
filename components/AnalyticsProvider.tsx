'use client'

import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { getPostHogClient, initPostHog, isPostHogConfigured } from '@/lib/posthog-client'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  if (!isPostHogConfigured()) {
    return children
  }

  return <PostHogProvider client={getPostHogClient()}>{children}</PostHogProvider>
}
