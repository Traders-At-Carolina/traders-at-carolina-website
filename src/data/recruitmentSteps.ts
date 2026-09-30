/* ==========================================================================
   Recruitment timeline data — the steps shown on the homepage.
   ========================================================================== */

export type RecruitmentStep = {
  /** Step number shown in the navy square. */
  number: number
  title: string
}

/** Recruitment timeline shown on the homepage. */
export const recruitmentSteps: RecruitmentStep[] = [
  { number: 1, title: 'Coffee chats' },
  { number: 2, title: 'Info session' },
  { number: 3, title: 'Written application' },
  { number: 4, title: 'Technical round' },
  { number: 5, title: 'Results' },
]
