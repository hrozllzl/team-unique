import { createContext, useContext } from "react";

export type UserRole = "admin" | "member";

interface AuthContextType {
  role: UserRole;
  userName: string;
}

export const AuthContext = createContext<AuthContextType>({
  role: "member",
  userName: "",
});

export const useAuth = () => useContext(AuthContext);
