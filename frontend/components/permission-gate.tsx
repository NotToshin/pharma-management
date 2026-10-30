"use client"

import * as React from "react"
import { usePermission } from "@/hooks/usePermission"
import type { PermissionAction } from "@/lib/permissions"

interface PermissionGateProps {
  feature: string
  action: PermissionAction | string
  /** Extra matrix flag that must also be granted. */
  also?: PermissionAction | string
  children: React.ReactNode
  fallback?: React.ReactNode
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  feature,
  action,
  also,
  children,
  fallback = null,
}) => {
  const { can, ready } = usePermission()

  if (!ready || !can(feature, action) || (also ? !can(feature, also) : false)) {
    return <>{fallback}</>
  }

  return children
}

export default PermissionGate
