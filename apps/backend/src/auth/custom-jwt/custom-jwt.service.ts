import { Injectable } from '@nestjs/common';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class CustomJwtService {
  constructor(private readonly jwtService: JwtService) {}

  public async sign(payload: JwtPayloadDto, options?: JwtSignOptions): Promise<string> {
    return this.jwtService.signAsync(payload, options);
  }

  public async getTokenPayload(token: string): Promise<JwtPayloadDto | null> {
    try {
      return await this.jwtService.verifyAsync<JwtPayloadDto>(token, {
        algorithms: ['HS256'],
      });
    } catch (e) {
      return null;
    }
  }
}
