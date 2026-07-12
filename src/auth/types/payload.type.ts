import { Role } from "../../accounts/enums/role";
import { AdminLevel } from "../../admins/enums/adminLevel.enum";

export interface PayloadType {
  token_version: number;
  email: string;
  role: Role;
  admin_level: AdminLevel | undefined;
  id: string;
}