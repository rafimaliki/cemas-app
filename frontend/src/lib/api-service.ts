// Update the API service functions to handle numeric IDs
import type {
  ComplianceData,
  CriteriaData,
  ActivityLogEntry,
  UserInfo,
  CommentData,
  EvidenceFile,
  ComplianceInfo,
} from '@/types/compliance-types'
import { toast } from 'sonner'

// Base API URL - replace with your actual API endpoint
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL

// Helper function to log API calls
const logApiCall = (endpoint: string, method: string, data: any) => {
  console.log(`[API Call] ${method} ${endpoint}`, data)
}

// Helper function to handle API errors
const handleApiError = (error: any, message: string): never => {
  console.log('API Error:', error)
  const errorMessage =
    error.message ||
    error.response?.data?.error ||
    error.response?.data?.errors ||
    error.response?.data?.message ||
    message
  // console.error(`${message}: ${errorMessage}`, error)
  toast.error(errorMessage, { position: 'top-center' })
  throw new Error(errorMessage)
}

// Get compliance data
export const fetchComplianceData = async (
  complianceId: number,
): Promise<ComplianceData> => {
  logApiCall(`/compliance/${complianceId}`, 'GET', {})

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/compliance/${complianceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to fetch compliance data',
      }
    }

    return await response.json()
  } catch (error) {
    return handleApiError(error, 'Error fetching compliance data')
  }
}

// Get users data
export const fetchUsersData = async (): Promise<UserInfo[]> => {
  logApiCall('/users', 'GET', {})

  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to fetch users data',
      }
    }

    return await response.json()
  } catch (error) {
    return handleApiError(error, 'Error fetching users data')
  }
}

// Create a new criteria
export const createCriteria = async (
  criteria: CriteriaData,
): Promise<CriteriaData> => {
  logApiCall('/criteria/create', 'POST', criteria)

  try {
    const requestData = {
      ...criteria,
      compliance_id: criteria.compliance_id,
    }

    const response = await fetch(`${API_BASE_URL}/api/criteria/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: errorData.error || 'Failed to create criteria',
      }
    }

    const createdCriteria = await response.json()
    toast.success('Criteria created successfully', { position: 'top-center' })
    return createdCriteria.data
  } catch (error) {
    return handleApiError(error, 'Error creating criteria')
  }
}

// Update an existing criteria
export const updateCriteria = async (
  criteria: CriteriaData,
): Promise<CriteriaData> => {
  logApiCall(`/criteria/${criteria.id}/edit`, 'PUT', criteria)

  try {
    // Ensure compliance_id is included in the request
    const requestData = {
      ...criteria,
      compliance_id: criteria.compliance_id,
    }

    const response = await fetch(
      `${API_BASE_URL}/api/criteria/${criteria.id}/edit`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to update criteria',
      }
    }

    const updatedCriteria = await response.json()
    toast.success('Criteria updated successfully', { position: 'top-center' })
    return updatedCriteria
  } catch (error) {
    return handleApiError(error, 'Error updating criteria')
  }
}

// Delete a criteria
export const deleteCriteria = async (
  criteriaId: number,
  compliance_id: number,
): Promise<void> => {
  logApiCall(`/criteria/${criteriaId}/delete`, 'DELETE', { compliance_id })

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/criteria/${criteriaId}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ compliance_id }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to delete criteria',
      }
    }

    toast.success('Criteria deleted successfully', { position: 'top-center' })
  } catch (error) {
    handleApiError(error, 'Error deleting criteria')
  }
}

// Add a comment to a criteria
export const addComment = async (
  criteriaId: number,
  comment: CommentData,
  compliance_id: number,
): Promise<CommentData> => {
  logApiCall(`/comment/criteria/${criteriaId}`, 'POST', {
    ...comment,
    compliance_id,
  })

  try {
    const response = await fetch(`${API_BASE_URL}/api/comment/${criteriaId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ comment: comment.text }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw { response: { data: errorData }, message: 'Failed to add comment' }
    }

    const createdComment = comment
    // toast.success.success('Comment added successfully', {
    //   position: 'top-center',
    // })
    return createdComment
  } catch (error) {
    return handleApiError(error, 'Error adding comment')
  }
}

// Add evidence to a criteria
export const addEvidence = async (
  criteriaId: number,
  file: EvidenceFile,
  compliance_id: number,
): Promise<EvidenceFile> => {
  logApiCall(`/criteria/${criteriaId}/evidence`, 'POST', {
    ...file,
    compliance_id,
  })

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/criteria/${criteriaId}/evidence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...file, compliance_id }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw { response: { data: errorData }, message: 'Failed to add evidence' }
    }

    const createdEvidence = await response.json()

    toast.success('Evidence added successfully', {
      position: 'top-center',
    })
    return createdEvidence
  } catch (error) {
    return handleApiError(error, 'Error adding evidence')
  }
}

// Delete evidence from a criteria
export const deleteEvidence = async (
  criteriaId: number,
  fileId: string,
  compliance_id: number,
): Promise<void> => {
  logApiCall(`/evidence/e-criteria/${fileId}/delete`, 'DELETE', {
    compliance_id,
  })

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/evidence/e-criteria/${fileId}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to delete evidence',
      }
    }

    toast.success('Evidence deleted successfully', {
      position: 'top-center',
    })
  } catch (error) {
    handleApiError(error, 'Error deleting evidence')
  }
}

// Get activity logs
export const fetchActivityLogs = async (
  complianceId: number,
): Promise<ActivityLogEntry[]> => {
  // logApiCall(`/compliance/${complianceId}/activity-logs`, 'GET', {})

  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/${complianceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to fetch activity logs',
      }
    }

    return await response.json()
  } catch (error) {
    toast.error('Failed to fetch activity logs', {
      position: 'top-center',
    })
    return []
  }
}

export const editComplianceInfo = async (
  complianceId: number,
  name: string,
  description: string,
  expiry_date?: string,
): Promise<ComplianceInfo> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/compliance/${complianceId}/edit`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          expiry_date,
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to edit compliance info via API',
      }
    }

    toast.success('Compliance info updated successfully', {
      position: 'top-center',
    })

    const updatedComplianceInfo = {
      name,
      description,
      expiry_date,
    }

    return updatedComplianceInfo
  } catch (error) {
    return handleApiError(error, 'Error editing compliance info via API')
  }
}

export const deleteCompliance = async (complianceId: number): Promise<void> => {
  logApiCall(`/compliance/${complianceId}/delete`, 'DELETE', {})

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/compliance/${complianceId}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: { data: errorData },
        message: 'Failed to delete compliance',
      }
    }

    toast.success('Compliance deleted successfully', {
      position: 'top-center',
    })

    window.location.href = '/dashboard'
  } catch (error) {
    handleApiError(error, 'Error deleting compliance')
  }
}
