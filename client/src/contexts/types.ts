export interface User {
  id: number;
  username: string;
  email: string;
  role?: 'admin' | 'manager' | 'viewer';
  manager_user_id?: number | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean; // ⏳ add this
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<string | undefined>;
  register: (username: string, email: string, password: string) => Promise<string | undefined>;
  logout: () => void;
}
