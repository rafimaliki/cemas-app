import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useRouterState } from '@tanstack/react-router'
import { Fragment } from 'react'

export function Breadcrumbs() {
  const { location } = useRouterState()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  const breadcrumbs = pathSegments.map((segment, index) => {
    const fullPath = '/' + pathSegments.slice(0, index + 1).join('/')
    const isLast = index === pathSegments.length - 1
    const label = segment
    return (
      <Fragment key={fullPath}>
        <BreadcrumbItem>
          <BreadcrumbLink
            // href={fullPath}
            aria-current={isLast ? 'page' : undefined}
          >
            {label}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </Fragment>
    )
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
    </Breadcrumb>
  )
}
