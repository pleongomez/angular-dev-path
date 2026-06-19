import { computed, Service, signal } from '@angular/core';
import { User } from '../models/user.model';

const SESSION_KEY = 'devpath_user_id';

@Service()
export class AuthService {
  private readonly mockUsers: User[] = [
    {
      id: '1',
      name: 'Ana García',
      email: 'ana@devpath.io',
      role: 'student',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    },
    {
      id: '2',
      name: 'Admin DevPath',
      email: 'admin@devpath.io',
      role: 'admin',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    },
  ];

  private readonly _currentUser = signal<User | null>(this.restoreSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  login(email: string): boolean {
    const user = this.mockUsers.find(u => u.email === email);
    if (user) {
      this._currentUser.set(user);
      localStorage.setItem(SESSION_KEY, user.id);
      return true;
    }
    return false;
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private restoreSession(): User | null {
    const savedId = localStorage.getItem(SESSION_KEY);
    return this.mockUsers.find(u => u.id === savedId) ?? null;
  }
}