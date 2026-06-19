import { Routes } from '@angular/router';

export const MY_LEARNING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./my-learning-page/my-learning-page').then(m => m.MyLearningPage),
  },
];