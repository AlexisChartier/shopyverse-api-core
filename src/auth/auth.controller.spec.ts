import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // Mock AuthService
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        // Mock UsersService (utilisé par la méthode register)
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
        // Mock JwtService (dépendance indirecte souvent requise)
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // C'est ce test qui manquait ou était mal formaté
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});