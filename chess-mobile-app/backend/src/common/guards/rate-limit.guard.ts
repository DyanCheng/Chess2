import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly limit = 120;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest();
    if (!request) return true;
    const now = Date.now();
    const key = `${request.ip || request.socket?.remoteAddress || 'unknown'}:${request.path || request.url}`;
    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + this.windowMs }
      : current;
    bucket.count += 1;
    this.buckets.set(key, bucket);

    // ponytail: use a shared limiter (Redis/API gateway) before running multiple backend replicas.
    if (this.buckets.size > 10_000) {
      for (const [bucketKey, value] of this.buckets) {
        if (value.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }
    if (bucket.count <= this.limit) return true;

    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    const response = context.switchToHttp().getResponse();
    response?.setHeader?.('Retry-After', String(retryAfter));
    throw new HttpException(
      { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau', retryAfter },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
