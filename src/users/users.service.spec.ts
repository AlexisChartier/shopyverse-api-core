import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('prevents duplicate emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    await expect(
      service.create({
        email: 'a@a.com',
        password: 'p',
        firstName: 'a',
        lastName: 'b',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires default role to exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null as any);
    prisma.role.findUnique.mockResolvedValue(null as any);
    await expect(
      service.create({
        email: 'a@a.com',
        password: 'p',
        firstName: 'a',
        lastName: 'b',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a user with hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null as any);
    prisma.role.findUnique.mockResolvedValue({ id: 'r1' } as any);
    prisma.user.create.mockResolvedValue({
      id: 'created',
      email: 'a@a.com',
    } as any);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await expect(
      service.create({
        email: 'a@a.com',
        password: 'p',
        firstName: 'a',
        lastName: 'b',
      } as any),
    ).resolves.toEqual({ id: 'created', email: 'a@a.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('p', 10);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('finds all users and throws when missing', async () => {
    prisma.user.findMany.mockResolvedValue(['user'] as any);
    await expect(service.findAll()).resolves.toEqual(['user']);

    prisma.user.findUnique.mockResolvedValue(null as any);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates user and rehashes password', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed2');
    prisma.user.update.mockResolvedValue({ id: 'u1', email: 'a@a.com' } as any);

    await expect(
      service.update('u1', { password: 'newpass', firstName: 'x' } as any),
    ).resolves.toEqual({ id: 'u1', email: 'a@a.com' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { password: 'hashed2', firstName: 'x' },
      select: { id: true, email: true },
    });
  });

  it('removes users', async () => {
    prisma.user.delete.mockResolvedValue({ id: 'u1' } as any);
    await expect(service.remove('u1')).resolves.toEqual({ id: 'u1' });
  });
});
