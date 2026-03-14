export interface UserData {
  id: string | number
  name: string
  email: string
  status?: 'Active' | 'Suspended'
  role?: 'Administrator' | 'Contributor' | 'Auditor'
  picture?: string
  exp?: number
}
