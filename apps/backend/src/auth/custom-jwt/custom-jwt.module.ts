import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomJwtService } from './custom-jwt.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'todo-change-this',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [CustomJwtService],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
