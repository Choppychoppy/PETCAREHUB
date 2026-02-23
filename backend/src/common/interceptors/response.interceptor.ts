import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const isHealthCheck = request.url === '/health' || request.url === '/';
    
    // Skip interceptor for health checks and static files
    if (isHealthCheck) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        // If data is already wrapped (has success, data, message), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // For paginated responses, keep the structure but wrap in success format
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        // For simple responses, wrap in standard format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}