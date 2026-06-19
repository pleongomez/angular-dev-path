import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import { MOCK_COURSES } from '../data/courses.data';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url === '/api/courses') {
    return of(new HttpResponse({ status: 200, body: MOCK_COURSES })).pipe(
      delay(400)
    );
  }

  return next(req);
};