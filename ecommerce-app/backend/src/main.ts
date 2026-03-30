import { NestFactory } from '@nestjs/core';
import { json, raw } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 Add this line to enable CORS for your frontend
  app.enableCors({
    origin: 'http://localhost:3000',   // allow requests from your Next.js app
    credentials: true,                 // if you plan to use cookies/authorization headers
  });

  app.use('/store/payments/stripe/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '10mb' }));

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new GlobalValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();