import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class CronGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    const cronHeader = request.headers['x-cron-security-token'];
    const expectedSecret = process.env.CRON_SECRET_KEY;

    if (!expectedSecret) {
      throw new InternalServerErrorException('No CRON_SECRET_KEY provided.');
    }

    if (!cronHeader || cronHeader !== expectedSecret) {
      throw new UnauthorizedException('Access Denied: Invalid Cron Token');
    }

    return true;
  }
}