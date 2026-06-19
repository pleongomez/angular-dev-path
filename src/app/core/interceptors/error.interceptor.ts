import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[Auth] Sesión expirada o no autorizado');
      }
      if (error.status >= 500) {
        console.error('[Server] Error interno del servidor:', error.message);
      }
      return throwError(() => error);
    })
  );
};