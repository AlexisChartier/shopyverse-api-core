import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto'; // À créer (email + password)

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    // Vérification User + Mot de passe
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Payload du token
    const payload = { sub: user.id, email: user.email, role: user.role?.name };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
