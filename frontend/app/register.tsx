import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const { register } = useAuth();
  return <AuthForm mode="register" submit={register} />;
}
