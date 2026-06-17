import { ModuleName } from '@/common/enums';
import { TokenType } from '@/modules/auth/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { VerifyTokenProvider } from '@/modules/auth/providers/verify-token.provider';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ResetPasswordDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class ResetPasswordProvider {
  constructor(
    private readonly findOneUser: FindOneUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly verifyToken: VerifyTokenProvider,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const payload: VerificationTokenPayload = {
      type: TokenType.ForgotPassword,
      email: dto.email,
      token: dto.token,
    };

    const user = await this.verifyToken.execute(payload);
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }

    const fullUser = await this.findOneUser.execute({ id: user.id }, { withPassword: true });
    if (fullUser?.password) {
      const isSame = await this.hashService.verify(fullUser.password, dto.password);
      if (isSame) {
        await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'match-old-password' });
      }
    }

    const newHash = await this.hashService.createHash(dto.password);
    await this.updateUser.execute({ id: user.id }, { password: newHash });
  }
}
