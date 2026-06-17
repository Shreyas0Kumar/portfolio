import React from 'react'
import InterviewsTab from '../tabs/InterviewsTab.jsx'

/**
 * InterviewsApp
 * Standalone Interviews application. The editorial InterviewsTab is full-bleed
 * (its own sticky masthead + internal scroll, like PortfolioApp), so it renders
 * directly into the app body without the padded `.simple-app` wrapper.
 */
export default function InterviewsApp() {
  return <InterviewsTab />
}
