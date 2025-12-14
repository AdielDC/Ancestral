import styled from 'styled-components';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiBell, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import authService from '../services/authService';
import { inventarioService } from '../services/inventarioService';
import { toast } from 'react-hot-toast';

export function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAlertas, setShowAlertas] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countAlertas, setCountAlertas] = useState(0);
  
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const alertasRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ CARGAR ALERTAS AL INICIAR LA APLICACIÓN
  useEffect(() => {
    loadAlertasCount();
    
    // Recargar alertas cada 5 minutos
    const interval = setInterval(() => {
      loadAlertasCount();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  // ✅ Función para cargar SOLO el conteo de alertas (más ligero)
  const loadAlertasCount = async () => {
    try {
      const response = await inventarioService.getStockBajo();
      
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        items = response.data;
      }

      setCountAlertas(items.length);
      
      console.log(`🔔 Alertas actualizadas: ${items.length}`);
    } catch (error) {
      // Silenciar errores si no hay backend
      setCountAlertas(0);
    }
  };

  // ✅ Función para cargar alertas completas (cuando se abre el dropdown)
  const loadAlertasCompletas = async () => {
    try {
      setLoading(true);
      const response = await inventarioService.getStockBajo();
      
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        items = response.data;
      }

      // Mapear items para tener estructura correcta
      const alertasTransformadas = items.map(item => {
        const stockPercentage = item.stock_minimo > 0 
          ? (item.stock / item.stock_minimo) * 100 
          : 100;
        
        const tipoAlerta = item.stock <= (item.stock_minimo * 0.3) 
          ? 'stock_critico' 
          : 'stock_bajo';

        // Mapear alias del backend
        const CATEGORIA_INSUMO = item.categoria || item.CATEGORIA_INSUMO;
        const CLIENTE = item.cliente || item.CLIENTE;
        const categoriaNombre = CATEGORIA_INSUMO?.nombre || 'Insumo';

        return {
          id: item.id,
          tipo_alerta: tipoAlerta,
          inventario_id: item.id,
          fecha_alerta: item.ultima_actualizacion || new Date().toISOString(),
          vista: false,
          resuelta: false,
          mensaje: `${categoriaNombre} - ${item.codigo_lote}: Stock ${tipoAlerta === 'stock_critico' ? 'crítico' : 'bajo'}`,
          INVENTARIO: {
            id: item.id,
            codigo_lote: item.codigo_lote,
            stock: item.stock,
            stock_minimo: item.stock_minimo,
            unidad: item.unidad,
            CATEGORIA_INSUMO,
            CLIENTE
          },
          creado_en: item.ultima_actualizacion || item.creado_en
        };
      });

      // Ordenar por criticidad
      alertasTransformadas.sort((a, b) => {
        if (a.tipo_alerta === 'stock_critico' && b.tipo_alerta !== 'stock_critico') return -1;
        if (a.tipo_alerta !== 'stock_critico' && b.tipo_alerta === 'stock_critico') return 1;
        return new Date(b.fecha_alerta) - new Date(a.fecha_alerta);
      });

      setAlertas(alertasTransformadas);
      setCountAlertas(alertasTransformadas.length);
    } catch (error) {
      // Silenciar errores si no hay backend
      setAlertas([]);
      setCountAlertas(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertasRef.current && !alertasRef.current.contains(event.target)) {
        setShowAlertas(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenAlertas = () => {
    const wasOpen = showAlertas;
    setShowAlertas(!wasOpen);
    
    // Solo cargar detalles si se está ABRIENDO y aún no se han cargado
    if (!wasOpen && alertas.length === 0) {
      loadAlertasCompletas();
    }
  };

  const getTipoAlertaColor = (tipo) => {
    if (tipo === 'stock_critico') return '#ef4444';
    if (tipo === 'stock_bajo') return '#f59e0b';
    return '#3b82f6';
  };

  const getTipoAlertaText = (tipo) => {
    if (tipo === 'stock_critico') return 'Stock Crítico';
    if (tipo === 'stock_bajo') return 'Stock Bajo';
    return 'Alerta';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    
    const now = new Date();
    const alertaFecha = new Date(fecha);
    const diffMs = now - alertaFecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return alertaFecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

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
        <AlertasContainer ref={alertasRef}>
          <IconButton onClick={handleOpenAlertas}>
            <FiBell size={20} />
            {countAlertas > 0 && (
              <Badge>{countAlertas > 99 ? '99+' : countAlertas}</Badge>
            )}
          </IconButton>

          {showAlertas && (
            <AlertasDropdown>
              <AlertasHeader>
                <AlertasTitle>
                  <FiBell size={18} />
                  Alertas de Inventario
                </AlertasTitle>
              </AlertasHeader>

              <AlertasList>
                {loading ? (
                  <AlertasLoading>
                    <LoadingSpinner />
                    <p>Cargando alertas...</p>
                  </AlertasLoading>
                ) : alertas.length === 0 ? (
                  <AlertasEmpty>
                    <FiPackage size={40} />
                    <p>No hay alertas</p>
                    <span>Todo el inventario está en niveles normales</span>
                  </AlertasEmpty>
                ) : (
                  alertas.slice(0, 5).map((alerta) => (
                    <AlertaItem 
                      key={alerta.id}
                      onClick={() => {
                        navigate('/alertas');
                        setShowAlertas(false);
                      }}
                    >
                      <AlertaIconWrapper $tipo={alerta.tipo_alerta}>
                        <FiAlertTriangle size={18} />
                      </AlertaIconWrapper>

                      <AlertaContent>
                        <AlertaTop>
                          <AlertaTipo $color={getTipoAlertaColor(alerta.tipo_alerta)}>
                            {getTipoAlertaText(alerta.tipo_alerta)}
                          </AlertaTipo>
                          <AlertaFecha>
                            {formatFecha(alerta.fecha_alerta || alerta.creado_en)}
                          </AlertaFecha>
                        </AlertaTop>

                        <AlertaMensaje>{alerta.mensaje}</AlertaMensaje>

                        {alerta.INVENTARIO && (
                          <AlertaInsumo>
                            {alerta.INVENTARIO.CATEGORIA_INSUMO?.nombre} - 
                            Stock: {alerta.INVENTARIO.stock} {alerta.INVENTARIO.unidad}
                          </AlertaInsumo>
                        )}
                      </AlertaContent>
                    </AlertaItem>
                  ))
                )}
              </AlertasList>

              {alertas.length > 0 && (
                <AlertasFooter>
                  <VerTodasBtn 
                    onClick={() => {
                      navigate('/alertas');
                      setShowAlertas(false);
                    }}
                  >
                    Ver todas las alertas ({alertas.length})
                  </VerTodasBtn>
                </AlertasFooter>
              )}
            </AlertasDropdown>
          )}
        </AlertasContainer>

        {/* Perfil del usuario */}
        <UserMenu ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)}>
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

// ============ ESTILOS ============

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
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.1);
    }
  }
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

const AlertasContainer = styled.div`
  position: relative;
`;

const AlertasDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 400px;
  max-height: 500px;
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 320px;
    right: -1rem;
  }
`;

const AlertasHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.bg2};
`;

const AlertasTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertasList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.bg2};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.bg3};
    border-radius: 3px;
  }
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.bg3};
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AlertasLoading = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: ${({ theme }) => theme.bg4};
  font-size: 0.9rem;

  p {
    margin: 0;
    color: ${({ theme }) => theme.text};
  }
`;

const AlertasEmpty = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: ${({ theme }) => theme.bg4};

  svg {
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  p {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.text};
  }

  span {
    font-size: 0.85rem;
    opacity: 0.7;
  }
`;

const AlertaItem = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
  transition: background 0.2s;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.bg2};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const AlertaIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => 
    props.$tipo === 'stock_critico' ? 'rgba(239, 68, 68, 0.1)' :
    props.$tipo === 'stock_bajo' ? 'rgba(245, 158, 11, 0.1)' :
    'rgba(59, 130, 246, 0.1)'
  };
  color: ${props => 
    props.$tipo === 'stock_critico' ? '#ef4444' :
    props.$tipo === 'stock_bajo' ? '#f59e0b' :
    '#3b82f6'
  };
`;

const AlertaContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const AlertaTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  gap: 0.5rem;
`;

const AlertaTipo = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.$color};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AlertaFecha = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.bg4};
  white-space: nowrap;
`;

const AlertaMensaje = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`;

const AlertaInsumo = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.bg4};
  background: ${({ theme }) => theme.bg2};
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  display: inline-block;
`;

const AlertasFooter = styled.div`
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.bg3};
  background: ${({ theme }) => theme.bg2};
`;

const VerTodasBtn = styled.button`
  width: 100%;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid #d97706;
  color: #d97706;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #d97706;
    color: white;
  }
`;