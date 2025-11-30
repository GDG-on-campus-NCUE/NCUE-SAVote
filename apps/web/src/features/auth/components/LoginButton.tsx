import { authApi } from '../services/auth.api';
import { Button } from '../../../components/ui/Button';

export const LoginButton = () => {
  return (
    <Button
      onClick={() => authApi.login()}
      variant="primary"
      className="w-full"
      style={{ width: '100%' }}
    >
      使用學校帳號登入 (SSO)
    </Button>
  );
};
