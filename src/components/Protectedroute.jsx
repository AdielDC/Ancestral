import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export const ProtectedRoute = ({ children, requireAdmin = false, requireOperador = false }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no está activo
  if (user && !user.activo) {
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  // Si se requiere admin y el usuario no lo es
  if (requireAdmin && user?.rol !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si se requiere operador y el usuario no tiene el rol adecuado
  if (requireOperador && !['admin', 'operador'].includes(user?.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};