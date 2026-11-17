import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogsService } from '../../logs/logs.service';

const SENSITIVE_KEYS = new Set(['password', 'token', 'accessToken', 'refreshToken', 'authorization']);

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(item),
  ]));
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    if (!request) return next.handle();
    const response = context.switchToHttp().getResponse();
    const startedAt = Date.now();
    const write = (statusCode: number) => this.logs.logAudit({
      method: request.method,
      path: request.path || String(request.originalUrl || request.url || '').split('?')[0],
      statusCode,
      durationMs: Date.now() - startedAt,
      ipAddress: request.ip || request.socket?.remoteAddress,
      userAgent: request.headers?.['user-agent'],
      metadata: request.body ? { body: redact(request.body) } : undefined,
    });
    return next.handle().pipe(tap({
      next: () => write(response?.statusCode || 200),
      error: error => write(error?.status || error?.statusCode || 500),
    }));
  }
}
