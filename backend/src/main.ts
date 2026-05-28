import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { execSync } from 'child_process';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Carrega as variáveis de ambiente do arquivo .env de forma autônoma para o process.env do Node
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIdx = trimmed.indexOf('=');
    if (separatorIdx > 0) {
      const key = trimmed.substring(0, separatorIdx).trim();
      let val = trimmed.substring(separatorIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Executa migrações automáticas pendentes antes de iniciar o app
  try {
    logger.log('Iniciando verificação autônoma de migrações DDL...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.log('Migrações DDL aplicadas/verificadas com sucesso!');
  } catch (error) {
    logger.error('Falha ao aplicar migrações DDL de forma autônoma:', error);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Tenant-ID',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuração da documentação interativa Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('DIVI API')
    .setDescription('API do Gerenciador Financeiro DIVI (NestJS + PostgreSQL)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT gerado no login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log('Servidor NestJS rodando na porta 3000');
}
bootstrap();
