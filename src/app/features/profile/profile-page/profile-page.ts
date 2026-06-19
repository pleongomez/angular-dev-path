import { Component, inject } from '@angular/core';
import { form, FormField, required, email, minLength, maxLength } from '@angular/forms/signals';
import { signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-profile-page',
  imports: [FormField],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);

  protected readonly submitted = signal(false);
  protected readonly saveSuccess = signal(false);

  protected readonly profileModel = signal({
    name: this.auth.currentUser()?.name ?? '',
    email: this.auth.currentUser()?.email ?? '',
    bio: '',
    website: '',
  });

  protected readonly profileForm = form(this.profileModel, (f) => {
    required(f.name,    { message: 'El nombre es obligatorio' });
    minLength(f.name, 3, { message: 'Mínimo 3 caracteres' });
    maxLength(f.name, 50);
    required(f.email,   { message: 'El email es obligatorio' });
    email(f.email,      { message: 'Introduce un email válido' });
    maxLength(f.bio, 200);
  });

  protected onSubmit(): void {
    this.submitted.set(true);
    if (!this.profileForm().valid()) return;

    // Simulamos guardado
    console.log('Perfil guardado:', this.profileForm().value());
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }
}