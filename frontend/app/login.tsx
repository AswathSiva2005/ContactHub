import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  return <AuthForm mode="login" submit={login} />;
}
