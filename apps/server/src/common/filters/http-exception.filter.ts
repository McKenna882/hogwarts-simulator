import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;

      // class-validator 返回的消息可能是数组
      if (Array.isArray(message)) {
        message = message[0];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`未捕获异常: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
      },
    });
  }
}
