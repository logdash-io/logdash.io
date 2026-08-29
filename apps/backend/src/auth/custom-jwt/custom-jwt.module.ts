import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomJwtService } from './custom-jwt.service';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: getEnvConfig().auth.jwtSecret,
      signOptions: { expiresIn: '7d', algorithm: 'HS256' },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  providers: [CustomJwtService],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
