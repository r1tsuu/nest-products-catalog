import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface DeleteResponse {
  deleted: boolean;
}

@Injectable()
export class DeleteTransformInterceptor
  implements NestInterceptor<boolean, DeleteResponse>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<boolean>,
  ): Observable<DeleteResponse> | Promise<Observable<DeleteResponse>> {
    return next.handle().pipe(
      map((data) => ({
        deleted: data,
      })),
    );
  }
}
