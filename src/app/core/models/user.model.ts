export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}