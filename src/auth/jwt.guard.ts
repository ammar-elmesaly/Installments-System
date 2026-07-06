import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { PayloadType } from "./types/payload.type";
import { Role } from "../accounts/enums/role";

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // This basically bypasses @Public() routes from Jwt Authentication
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = PayloadType>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    if (user.role !== Role.Admin) {
      throw new UnauthorizedException('You have to be admin to perform this action.');
    }
    return user;
  }
}