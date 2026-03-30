import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, raw } from 'express';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", frontendUrl],
        },
      },
    }),
  );

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.use(compression());
  app.use(cookieParser());

  app.use('/store/payments/stripe/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '10mb' }));

  app.useGlobalInterceptors(new SanitizeInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new GlobalValidationPipe());
  await app.listen(process.env.PORT || 3001);
}
bootstrap();