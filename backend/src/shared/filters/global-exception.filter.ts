import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionHandler implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionHandler.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do sistema.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else {
      this.logger.error('Erro não tratado:', exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
