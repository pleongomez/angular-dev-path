import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const user = auth.currentUser();

  if (user && req.url.startsWith('/api/')) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${user.id}` },
    });
    return next(authReq);
  }

  return next(req);
};