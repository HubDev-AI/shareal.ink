import type { IAuthProvider } from "@/lib/interfaces";
import type { AuthUser } from "@/lib/types";

export class NoopAuthProvider implements IAuthProvider {
  async getCurrentUser(): Promise<AuthUser> {
    return { userId: "anonymous", isAuthenticated: false };
  }
}
