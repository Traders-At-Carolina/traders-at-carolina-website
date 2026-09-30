/* ==========================================================================
   Recruitment timeline data.

   This is the ONE place the recruitment dates live. When the cycle is
   scheduled, replace each '[Date]' below — nothing in the layout code
   (src/home/HomeRecruitment.tsx) needs to change.
   ========================================================================== */

export type RecruitmentStep = {
  /** Step number shown in the navy square. */
  number: number
  title: string
  /** Replace '[Date]' with the confirmed date once the cycle is scheduled. */
  date: string
}

/** Recruitment timeline shown on the homepage. Edit the `date` fields here only. */
export const recruitmentSteps: RecruitmentStep[] = [
  { number: 1, title: 'Coffee chats', date: '[Date]' },
  { number: 2, title: 'Info session', date: '[Date]' },
  { number: 3, title: 'Written application', date: '[Date]' },
  { number: 4, title: 'Technical round', date: '[Date]' },
  { number: 5, title: 'Results', date: '[Date]' },
]
