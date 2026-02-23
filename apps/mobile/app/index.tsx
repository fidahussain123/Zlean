import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth';

export default function Index() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user.role) {
    case 'super_admin':
      return <Redirect href="/(super-admin)/dashboard" />;
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'worker':
      return <Redirect href="/(worker)/queue" />;
    case 'customer':
      return <Redirect href="/(customer)/tracker" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
