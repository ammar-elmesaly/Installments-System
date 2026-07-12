import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AccountsService } from "../accounts/accounts.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly accountsService: AccountsService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }

  async validate(payload: any) {
    const account = await this.accountsService.findById(payload.id);
    
    if (payload.token_version !== account.token_version) {
      throw new UnauthorizedException('Another device has logged in, please re-login.');
    }

    return { 
      token_version: payload.token_version, 
      email: payload.email, 
      role: payload.role, 
      admin_level: payload.admin_level, 
      id: payload.id 
    };
  }
}