import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
  path: '',
  pathMatch: 'full',
  loadComponent: () =>
    import('./features/home/home-page/home-page').then(m => m.HomePage),
},
  {
    path: 'catalog',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
  },
  {
    path: 'my-learning',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/my-learning/my-learning.routes').then(m => m.MY_LEARNING_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];