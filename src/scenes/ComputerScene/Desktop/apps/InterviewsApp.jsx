import React from 'react'
import InterviewsTab from '../tabs/InterviewsTab.jsx'

/**
 * InterviewsApp
 * Standalone Interviews application. Wraps the existing InterviewsTab content
 * in the shared single-scroll app container.
 */
export default function InterviewsApp() {
  return (
    <div className="simple-app">
      <InterviewsTab />
    </div>
  )
}
