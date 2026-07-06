import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from '../accounts/dto/account.dto';
import { LoginDTO } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor (private authService: AuthService) {}

  @Post('signup/admin')
  createAdmin(@Body() createAccountDTO: CreateAdminAccountDTO) {
    return this.authService.signupAdmin(createAccountDTO);
  }

  @Public()
  @Post('signup')
  createClient(@Body() createAccountDTO: CreateClientAccountDTO) {
    return this.authService.signup(createAccountDTO);
  }
  
  @Public()
  @Post('login')
  login(
    @Body() loginDTO: LoginDTO
  ) {
    return this.authService.login(loginDTO); 
  }
}
