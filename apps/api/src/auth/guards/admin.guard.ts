import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JWTPayload, UserRole } from '@savote/shared-types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JWTPayload = request.user;
    
    const isAuthorized = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);
    
    if (!isAuthorized) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
