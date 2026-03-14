import type { CriteriaData } from '@/types/compliance-types'

export const findCriteriaById = (
  criterias: CriteriaData[],
  id: number,
): { criteria: CriteriaData | null; path: (number | string)[] } => {
  const search = (
    items: CriteriaData[],
    targetId: number,
    currentPath: (number | string)[],
  ): { criteria: CriteriaData | null; path: (number | string)[] } => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        return { criteria: items[i], path: [...currentPath, i] }
      }

      if (items[i].children && items[i].children.length > 0) {
        const result = search(items[i].children, targetId, [
          ...currentPath,
          i,
          'children',
        ])
        if (result.criteria) {
          return result
        }
      }
    }

    return { criteria: null, path: [] }
  }

  return search(criterias, id, [])
}

export const updateCriteriaInTree = (
  criterias: CriteriaData[],
  path: (number | string)[],
  updatedCriteria: CriteriaData,
): CriteriaData[] => {
  if (path.length === 0) return criterias

  const newCriterias = [...criterias]
  let current: any = newCriterias

  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (i === path.length - 1) {
      current[idx as number] = updatedCriteria
    } else {
      if (idx === 'children') {
        current = current.children
      } else {
        current = current[idx as number]
        if (i < path.length - 2 && path[i + 1] === 'children') {
          current = current.children
          i++
        }
      }
    }
  }

  return newCriterias
}

export const getLevelBackgroundColor = (level: number): string => {
  const customColors = [
    'bg-[#ffffff]', // level 0 - white
    'bg-[#f9f9f9]', // level 1 - very light gray
    'bg-[#f3f3f3]', // level 2
    'bg-[#ededed]', // level 3
    'bg-[#e5e5e5]', // level 4
    'bg-[#dddddd]', // level 5
    'bg-[#d5d5d5]', // level 6 - soft gray
  ]
  return customColors[level % customColors.length]
}

export function removeCriteriaById(
  list: CriteriaData[],
  idToRemove: number,
): CriteriaData[] {
  return list
    .map((item) => {
      if (item.id === idToRemove) {
        return null
      }

      const updatedChildren = item.children
        ? removeCriteriaById(item.children, idToRemove)
        : undefined

      return {
        ...item,
        ...(updatedChildren ? { children: updatedChildren } : {}),
      }
    })
    .filter((item): item is CriteriaData => item !== null)
}
