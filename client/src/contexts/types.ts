export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean; // ⏳ add this
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
