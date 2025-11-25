import styled from 'styled-components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiBell } from 'react-icons/fi';
import authService from '../services/authService';
import { toast } from 'react-hot-toast';
import { Configuracion } from '../pages/Configuracion';

export function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <NavbarContainer>
      <LeftSection>
        <Greeting>¡Hola, {user.nombre}! </Greeting>
      </LeftSection>

      <RightSection>
        {/* Notificaciones */}
        <IconButton>
          <FiBell size={20} />
          <Badge>3</Badge>
        </IconButton>

        {/* Perfil del usuario */}
        <UserMenu onClick={() => setShowDropdown(!showDropdown)}>
          <Avatar>
            {user.nombre.charAt(0).toUpperCase()}
          </Avatar>
          <UserInfo>
            <UserName>{user.nombre}</UserName>
            <UserRole>{user.rol}</UserRole>
          </UserInfo>

          {/* Dropdown Menu */}
          {showDropdown && (
            <DropdownMenu>
              <DropdownItem onClick={() => navigate('/perfil')}>
                <FiUser size={16} />
                <span>Mi Perfil</span>
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/configuracion')}>
                <FiSettings size={16} />
                <span>Configuración</span>
              </DropdownItem>
              <Divider />
              <DropdownItem onClick={handleLogout} danger>
                <FiLogOut size={16} />
                <span>Cerrar Sesión</span>
              </DropdownItem>
            </DropdownMenu>
          )}
        </UserMenu>
      </RightSection>
    </NavbarContainer>
  );
}

const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.bg};
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Greeting = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const IconButton = styled.button`
  position: relative;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.bg2};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.bg2};
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #92400e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.2;
`;

const UserRole = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.bg4};
  text-transform: capitalize;
  line-height: 1.2;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 0.5rem 0;
  z-index: 1000;
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: ${({ danger, theme }) => danger ? '#ef4444' : theme.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.bg2};
  }

  svg {
    flex-shrink: 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.bg3};
  margin: 0.5rem 0;
`;