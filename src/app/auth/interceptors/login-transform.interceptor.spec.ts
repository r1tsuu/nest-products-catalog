import { createMock } from '@golevelup/ts-jest';
import { LoginTransformInterceptor } from './login-transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

describe('LoginTransformInterceptor', () => {
  let interceptor: LoginTransformInterceptor;

  beforeEach(() => {
    interceptor = new LoginTransformInterceptor();
  });

  it('Should return object with access token field ', async () => {
    const context = createMock<ExecutionContext>();
    const token = 'test-jwt-token';
    const handler = createMock<CallHandler>({
      handle: () => of(token),
    });

    const tokenObservable = await interceptor.intercept(context, handler);

    const tokenObject = await lastValueFrom(tokenObservable);

    expect(tokenObject.access_token).toEqual(token);
  });
});
