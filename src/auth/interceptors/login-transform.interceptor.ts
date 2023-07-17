import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface LoginResponse {
  access_token: string;
}

@Injectable()
export class LoginTransformInterceptor
  implements NestInterceptor<string, LoginResponse>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<string>,
  ): Observable<LoginResponse> | Promise<Observable<LoginResponse>> {
    return next.handle().pipe(
      map((data) => ({
        access_token: data,
      })),
    );
  }
}
