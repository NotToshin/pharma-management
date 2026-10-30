"use client"

import * as React from "react"
import { getStoredUser, type AuthUser } from "@/lib/auth"
import {
  featureForPath,
  userCan,
  type PermissionAction,
} from "@/lib/permissions"

export function usePermission() {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const sync = () => setUser(getStoredUser())
    sync()
    setReady(true)
    window.addEventListener("ak-permissions-updated", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("ak-permissions-updated", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const can = React.useCallback(
    (feature: string, action: PermissionAction | string) => {
      if (!ready) return false
      return userCan(user, feature, action)
    },
    [ready, user]
  )

  const canCurrent = React.useCallback(
    (pathname: string, action: PermissionAction | string) => {
      const feature = featureForPath(pathname)
      if (!feature) return true
      return can(feature, action)
    },
    [can]
  )

  return { can, canCurrent, ready, user }
}
