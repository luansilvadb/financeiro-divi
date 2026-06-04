import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiConflictResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { Public } from './public.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso',
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({ description: 'Nome de usuário já está em uso' })
  @ApiBadRequestResponse({ description: 'Dados de entrada mal-formatados ou inválidos (ex: senha com menos de 6 caracteres)' })
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.username, 
      registerDto.password, 
      registerDto.inviteCode, 
      registerDto.membroId
    );
  }

  @ApiOperation({ summary: 'Realizar login para obter token JWT' })
  @ApiOkResponse({
    description: 'Login bem-sucedido',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiBadRequestResponse({ description: 'Dados de entrada mal-formatados' })
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @ApiOperation({ summary: 'Obter dados e perfil do usuário logado' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Perfil retornado com sucesso',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente ou inválido' })
  @Get('me')
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}
