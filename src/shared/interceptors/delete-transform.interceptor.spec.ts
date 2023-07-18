import { createMock } from '@golevelup/ts-jest';
import { DeleteTransformInterceptor } from './delete-transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

describe('DeleteTransformInterceptor', () => {
  let interceptor: DeleteTransformInterceptor;

  beforeEach(() => {
    interceptor = new DeleteTransformInterceptor();
  });

  it('Should return object with deleted field that has value true ', async () => {
    const context = createMock<ExecutionContext>();
    const value = true;
    const handler = createMock<CallHandler>({
      handle: () => of(value),
    });

    const tokenObservable = await interceptor.intercept(context, handler);

    const tokenObject = await lastValueFrom(tokenObservable);

    expect(tokenObject.deleted).toEqual(value);
  });
});
