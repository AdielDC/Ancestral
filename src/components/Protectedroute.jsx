import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../services/authService';

export const ProtectedRoute = ({ children, requireAdmin = false, requireOperador = false }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = () => {
      const isAuthenticated = authService.isAuthenticated();
      const isTokenExpired = authService.isTokenExpired();
      
      // Si no hay token o está expirado
      if (!isAuthenticated || isTokenExpired) {
        authService.logout();
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      setIsValid(true);
      setIsValidating(false);
    };

    validateToken();
  }, []);

  if (isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Verificando sesión...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  const user = authService.getCurrentUser();

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