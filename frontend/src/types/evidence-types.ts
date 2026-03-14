export interface AccessInfo {
  isPublic: boolean
  accessType: string
  emailsWithAccess: {
    email: string
    role: string
  }[]
  domainsWithAccess: {
    domain: string
    role: string
  }[]
  totalPermissionsCount: number
  error?: string
}

export interface FileType {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  webContentLink: string
  createdTime: string
  extension: string
  access: AccessInfo
  expiryDate?: string
}

export interface CriteriaData {
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

export interface SimpleFileType {
  id: number
  file_name: string
  file_path: string
  drive_file_id: string
  uploaded_by: number
  uploaded_at: string
}
