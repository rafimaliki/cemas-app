import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type {CriteriaData } from '@/types/compliance-types'

export async function downloadEvidenceZip(
  criteriaRoot: CriteriaData[],
  zipFileName: string
) {
  const zip = new JSZip()

  const addEvidenceToZip = async (
    criteria: CriteriaData,
    path: string
  ): Promise<void> => {
    // Add each evidence file under the path (as folder)
    for (const file of criteria.evidence || []) {
      try {
        const response = await fetch(file.url)
        const blob = await response.blob()
        const fileName = file.name || file.url.split('/').pop()
        if (fileName) {
          zip.file(`${path}/${fileName}`, blob)
        }
      } catch (error) {
        console.error(`Failed to download file: ${file.url}`, error)
      }
    }

    // Recurse into children
    for (const child of criteria.children || []) {
      const childPath = `${path}/${child.prefix} ${child.name}`
      await addEvidenceToZip(child, childPath)
    }
  }

  for (const rootCriteria of criteriaRoot) {
    const rootPath = `${rootCriteria.prefix} ${rootCriteria.name}`
    await addEvidenceToZip(rootCriteria, rootPath)
  }

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `${zipFileName}-evidence.zip`)
}

