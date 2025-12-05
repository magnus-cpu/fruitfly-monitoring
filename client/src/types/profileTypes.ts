export interface ProfileProps {
    id: number;
    username: string;
    email: string;
    created_at: string;
    password: string;

}

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}