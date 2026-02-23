import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Guard
 * - Allows requests through even without authentication
 * - If JWT token is present and valid, user will be attached to request
 * - If no token or invalid token, request still proceeds but user will be undefined
 * - Useful for public endpoints that want to provide enhanced features for authenticated users
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // No error throwing, just return user or undefined
    // This allows the request to proceed regardless of authentication status
    return user;
  }
}
