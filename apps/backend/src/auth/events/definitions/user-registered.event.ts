import { AuthMethod } from '../../../user/core/enum/auth-method.enum';

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  authMethod: AuthMethod;
  emailAccepted: boolean;
}
