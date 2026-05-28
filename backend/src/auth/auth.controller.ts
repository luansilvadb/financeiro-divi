import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiConflictResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';

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
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.username, registerDto.password);
  }

  @ApiOperation({ summary: 'Realizar login para obter token JWT' })
  @ApiOkResponse({
    description: 'Login bem-sucedido',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiBadRequestResponse({ description: 'Dados de entrada mal-formatados' })
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
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}
