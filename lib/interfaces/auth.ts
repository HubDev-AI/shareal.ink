import { AuthUser } from "@/lib/types";

export interface IAuthProvider {
  getCurrentUser(): Promise<AuthUser>;
}
