export interface ProfileProps {
    id: number;
    username: string;
    email: string;
    created_at: string;
    password: string;
    role?: 'admin' | 'manager' | 'viewer';
    manager_user_id?: number | null;

}

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
