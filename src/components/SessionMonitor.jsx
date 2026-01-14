// src/components/SessionMonitor.jsx
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';
import styled from 'styled-components';

export function SessionMonitor() {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkSession = () => {
      if (authService.isAuthenticated()) {
        const minutes = authService.getTokenTimeRemaining();
        setTimeRemaining(minutes);

        // Advertir cuando queden 5 minutos
        if (minutes === 5) {
          toast('⏰ Tu sesión expirará en 5 minutos', {
            duration: 5000,
            icon: '⚠️'
          });
        }

        // Advertir cuando quede 1 minuto
        if (minutes === 1) {
          toast.error('⏰ Tu sesión expirará en 1 minuto', {
            duration: 5000
          });
        }

        // Sesión expirada
        if (minutes <= 0) {
          toast.error('🚫 Tu sesión ha expirado');
          authService.logout();
        }
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkSession, 60000);
    checkSession(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, []);

  // No mostrar nada si no hay sesión o quedan más de 10 minutos
  if (!authService.isAuthenticated() || timeRemaining > 10) {
    return null;
  }

  return (
    <SessionWarning>
      ⏰ Sesión expira en {timeRemaining} minuto{timeRemaining !== 1 ? 's' : ''}
      <RenewButton onClick={() => {
        authService.renewSession(30);
        setTimeRemaining(30);
        toast.success('✅ Sesión renovada por 30 minutos');
      }}>
        Renovar
      </RenewButton>
    </SessionWarning>
  );
}

const SessionWarning = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  font-weight: 500;
  color: #856404;
`;

const RenewButton = styled.button`
  background: #ffc107;
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ffb300;
    transform: translateY(-1px);
  }
`;