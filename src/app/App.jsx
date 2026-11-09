import { AuthProvider } from '@/context/AuthContext';
import UpdateBanner from '@/components/pwa/UpdateBanner';
import AppRoutes from './AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <UpdateBanner />
    </AuthProvider>
  );
}
