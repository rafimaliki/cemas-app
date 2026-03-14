export interface CommentData {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: string
}

export interface EvidenceFile {
  id: string
  name: string
  url: string
  uploadedBy: string
  uploadedAt: string
  expiryDate?: string
}

export interface CriteriaData {
  id: number
  prefix: string
  compliance_id: number
  parent_id: number | null
  name: string
  description: string
  level: number
  created_at: string
  pic_id: number | null
  status: 'in-progress' | 'compliant' | 'non-compliant'
  evidence?: EvidenceFile[]
  comments?: CommentData[]
  children?: CriteriaData[]
}

export interface ComplianceData {
  id: number
  title: string
  standard: string
  version: string
  criterias: CriteriaData[]
}
export interface TagWithCriteria {
  id: string
  name: string
  description: string
  created_at: string
  criteria: SimpleCriteria[]
}

export interface SimpleCriteria {
  e_criteria_id: number
  id: number
  compliance_id: number
  parent_id?: number | null
  name: string
  description: string
  level: number
  created_at: string
  compliance_name: string
  status: string
  pic_id: number
  prefix: string
}

export type AccessLevel = 0 | 1 | 2 // 0: Auditor, 1: Contributor, 2: Administrator

export interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  category?: string
  complianceId?: string
  complianceName?: string
  criteriaId?: number
  criteriaPrefix?: string
  details?: string
  timestamp: string
}

export interface UpdateCriteriaParams {
  criteriaId: number
  updates: Partial<CriteriaData>
  userId: string
  userName: string
  compliance_id: number
}

export interface AddCriteriaParams {
  parentId: number | null
  criteria: CriteriaData
  isSibling: boolean
  userId: string
  userName: string
  compliance_id: number
}

export interface DeleteCriteriaParams {
  criteriaId: number
  userId: string
  userName: string
  compliance_id: number
}

export interface AddCommentParams {
  criteriaId: number
  comment: CommentData
  userId: string
  userName: string
  compliance_id: number
}

export interface AddEvidenceParams {
  criteriaId: number
  file: EvidenceFile
  userId: string
  userName: string
  compliance_id: number
}

export interface DeleteEvidenceParams {
  criteriaId: number
  fileId: string
  userId: string
  userName: string
  compliance_id: number
}

export interface UserInfo {
  id: number
  name: string
  email: string
  status?: 'Active' | 'Suspended'
  role?: 'Administrator' | 'Contributor' | 'Auditor'
  picture?: string
  exp: number
}

export interface updateComplianceParams {
  name: string
  description: string
  expiry_date?: string
}

export interface ComplianceInfo {
  name: string
  description: string
  expiry_date?: string
}
