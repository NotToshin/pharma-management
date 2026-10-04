import { SystemUser, SystemRole, RolePermission } from "@prisma/client";

export type AuthenticatedUser = SystemUser & {
  role: SystemRole & {
    permissions?: RolePermission[];
  };
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
