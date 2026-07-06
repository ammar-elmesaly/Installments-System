import { Role } from "../../accounts/enums/role";
import { AdminLevel } from "../../admins/enums/adminLevel.enum";

export interface PayloadType {
  email: string;
  role: Role;
  admin_level: AdminLevel | undefined;
  sub: string;
}