import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OpenAPI contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expose le document OpenAPI avec les ressources principales', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body.info?.title).toBe('ShopyVerse API Core');
    expect(response.body.openapi || response.body.swagger).toBeDefined();
    expect(response.body.paths).toBeDefined();
    expect(response.body.paths).toHaveProperty('/products');
    expect(response.body.paths).toHaveProperty('/categories');
    expect(response.body.components?.securitySchemes?.bearer).toBeDefined();
  });
});
