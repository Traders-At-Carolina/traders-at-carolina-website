import membersData from './members.json'

/**
 * Members and executive board, rendered in file order.
 *
 * Edit src/data/members.json. Each entry:
 *   name      "First Last"
 *   role      board title (leadership only; "" for members)
 *   photo     "/images/members/leadership/first-last.jpg" or
 *             "/images/members/general/first-last.jpg"; "" shows a blank block
 *   linkedin  full profile URL; "" hides the icon
 *   email     address; "" hides the icon
 *   year      graduation year, e.g. "2027"; "" shows "[Class of 20XX]"
 *   group     "leadership" | "member"
 */
export type Member = {
  name: string
  role: string
  photo: string
  linkedin: string
  email: string
  year: string
  group: 'leadership' | 'member'
}

export const members = membersData as Member[]
export const leadership = members.filter((member) => member.group === 'leadership')
export const generalMembers = members.filter((member) => member.group === 'member')
