import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not defined. Application cannot start.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  
  // Configuração de CORS mais robusta
  app.enableCors({
    origin: true, // Reflete a origem da requisição
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Tenant-ID', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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

  // Redireciona os assets estáticos do Swagger para CDN (corrige 404 no Vercel)
  const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5';
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api-docs/swagger-ui-bundle.js', (_req: any, res: any) => res.redirect(`${cdnUrl}/swagger-ui-bundle.js`));
  httpAdapter.get('/api-docs/swagger-ui-standalone-preset.js', (_req: any, res: any) => res.redirect(`${cdnUrl}/swagger-ui-standalone-preset.js`));
  httpAdapter.get('/api-docs/swagger-ui.css', (_req: any, res: any) => res.redirect(`${cdnUrl}/swagger-ui.css`));
  httpAdapter.get('/api-docs/favicon-32x32.png', (_req: any, res: any) => res.redirect(`${cdnUrl}/favicon-32x32.png`));
  httpAdapter.get('/api-docs/favicon-16x16.png', (_req: any, res: any) => res.redirect(`${cdnUrl}/favicon-16x16.png`));


  SwaggerModule.setup('api-docs', app, document, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Servidor NestJS rodando na porta ${port}`);
}
bootstrap();
