import { createContext, useContext } from "react";

export type UserRole = "admin" | "member";

interface AuthContextType {
  role: UserRole;
  userName: string;
  accountId: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  role: "member",
  userName: "",
  accountId: null,
});

export const useAuth = () => useContext(AuthContext);
