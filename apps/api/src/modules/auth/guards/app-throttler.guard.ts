import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const isLoopback =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip === 'localhost';

    // Allow internal loopback diagnostics without artificial rate-limiting interference
    if (isLoopback && req.headers['x-internal-diagnostic'] === 'true') {
      return true;
    }

    return super.shouldSkip(context);
  }
}
