import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userUuid = localStorage.getItem('userUuid');
  
  if (userUuid) {
    const clonedRequest = req.clone({
      setHeaders: {
        'x-user-uuid': userUuid
      }
    });
    return next(clonedRequest);
  }
  
  return next(req);
};
