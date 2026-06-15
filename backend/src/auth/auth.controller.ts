import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { Public } from './public.decorator';
import type { AuthenticatedRequest } from './auth.types';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


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
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiOkResponse({
    description: 'Cadastro bem-sucedido',
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou e-mail já existe' })
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.nome,
      registerDto.password,
      registerDto.inviteCode,
      registerDto.membroId
    );
  }

  @ApiOperation({ summary: 'Obter dados e perfil do usuário logado' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Perfil retornado com sucesso',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente ou inválido' })
  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.userId);
  }


  @ApiOperation({ summary: 'Realizar login ou cadastro via Google OAuth' })
  @ApiOkResponse({
    description: 'Login/Cadastro com o Google bem-sucedido',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credencial do Google inválida ou não verificada' })
  @Public()
  @Post('google')
  async loginComGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.loginComGoogle(googleAuthDto);
  }

  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiOkResponse({ description: 'Instruções enviadas para o e-mail (se existir)' })
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({ summary: 'Redefinir a senha usando o token de recuperação' })
  @ApiOkResponse({ description: 'Senha redefinida com sucesso' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado' })
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}
