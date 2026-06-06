import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  // 全局响应包装
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🦉 魔法枢纽已启动: http://localhost:${port}/api`);
}
bootstrap();
