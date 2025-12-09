// src/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- C'est la clé ! Rend le service accessible partout
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // On exporte le service pour que les autres modules puissent l'utiliser
})
export class PrismaModule {}
