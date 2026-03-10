"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authAPI } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  rating: number;
  academy_id?: string;
  academyName?: string;
  avatar?: string;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

const ROLE_ROUTES: Record<string, string> = {
  super_admin: "/super-admin",
  academy_admin: "/academy",
  coach: "/coach",
  student: "/student",
  parent: "/parent",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI
      .me()
      .then((r) => setUser(r.data.user))
      .catch(() => Cookies.remove("auth_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await authAPI.login({ email, password });
    const { token, user: u } = r.data;
    Cookies.set("auth_token", token, { expires: 7, sameSite: "lax" });
    setUser(u);
    router.push(ROLE_ROUTES[u.role] || "/student");
  };

  const register = async (data: any) => {
    const r = await authAPI.register(data);
    const { token, user: u } = r.data;
    Cookies.set("auth_token", token, { expires: 7, sameSite: "lax" });
    setUser(u);
    router.push(ROLE_ROUTES[u.role] || "/student");
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    Cookies.remove("auth_token");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updates: Partial<User>) =>
    setUser((prev) => (prev ? { ...prev, ...updates } : null));

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
