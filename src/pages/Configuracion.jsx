import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import usuarioService from '../services/usuarioService';
import { 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaKey, 
  FaUserCheck, 
  FaUserTimes,
  FaSearch,
  FaUsers,
  FaExclamationTriangle,
  FaEye,        // 🆕 Importar iconos
  FaEyeSlash    // 🆕 Importar iconos
} from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';

export function Configuracion() {
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagination, setPagination] = useState(null);
  
  // 🆕 Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'visualizador'
  });

  useEffect(() => {
    cargarDatos();
  }, [filtroRol, filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filtroRol) params.rol = filtroRol;
      if (filtroEstado) params.activo = filtroEstado;
      if (busqueda) params.search = busqueda;

      const [usuariosData, statsData] = await Promise.all([
        usuarioService.listarUsuarios(params),
        usuarioService.obtenerEstadisticas()
      ]);
      
      setUsuarios(usuariosData.usuarios);
      setPagination(usuariosData.pagination);
      setEstadisticas(statsData);
    } catch (error) {
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const abrirModalCrear = () => {
    setModalType('crear');
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'visualizador'
    });
    setShowPassword(false); // 🆕 Reset estado de visibilidad
    setShowModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setModalType('editar');
    setUsuarioSeleccionado(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
    setShowModal(true);
  };

  const abrirModalPassword = (usuario) => {
    setModalType('password');
    setUsuarioSeleccionado(usuario);
    setFormData({ new_password: '' });
    setShowNewPassword(false); // 🆕 Reset estado de visibilidad
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setModalType('');
    setUsuarioSeleccionado(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'visualizador'
    });
    // 🆕 Reset estados de visibilidad al cerrar
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'crear') {
        await usuarioService.crearUsuario(formData);
        toast.success('✅ Usuario creado exitosamente');
      } else if (modalType === 'editar') {
        await usuarioService.actualizarUsuario(usuarioSeleccionado.id, formData);
        toast.success('✅ Usuario actualizado exitosamente');
      } else if (modalType === 'password') {
        await usuarioService.cambiarPassword(usuarioSeleccionado.id, {
          new_password: formData.new_password
        });
        toast.success('✅ Contraseña actualizada exitosamente');
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud');
    }
  };

  // Confirmación con Toast para desactivar usuario
  const handleDesactivar = (usuario) => {
    toast((t) => (
      <ConfirmToastContainer>
        <ConfirmToastHeader>
          <ConfirmToastIcon warning>
            <FaUserTimes />
          </ConfirmToastIcon>
          <div>
            <ConfirmToastTitle>¿Desactivar usuario?</ConfirmToastTitle>
            <ConfirmToastMessage>
              <strong>{usuario.nombre}</strong> no podrá acceder al sistema
            </ConfirmToastMessage>
          </div>
        </ConfirmToastHeader>
        <ConfirmToastActions>
          <ConfirmButton 
            cancel 
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </ConfirmButton>
          <ConfirmButton
            warning
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await usuarioService.desactivarUsuario(usuario.id);
                toast.success('✅ Usuario desactivado exitosamente');
                cargarDatos();
              } catch (error) {
                toast.error(error.message || 'Error al desactivar usuario');
              }
            }}
          >
            <FaUserTimes />
            Desactivar
          </ConfirmButton>
        </ConfirmToastActions>
      </ConfirmToastContainer>
    ), {
      duration: 8000,
      position: 'top-center',
      style: {
        background: '#1f2937',
        color: '#f9fafb',
        padding: '0',
        borderRadius: '12px',
        border: '1px solid #374151',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }
    });
  };

  const handleActivar = async (usuario) => {
    try {
      await usuarioService.activarUsuario(usuario.id);
      toast.success(`✅ ${usuario.nombre} activado exitosamente`);
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al activar usuario');
    }
  };

  // Confirmación con Toast para eliminar usuario
  const handleEliminar = (usuario) => {
    toast((t) => (
      <ConfirmToastContainer>
        <ConfirmToastHeader>
          <ConfirmToastIcon danger>
            <FaExclamationTriangle />
          </ConfirmToastIcon>
          <div>
            <ConfirmToastTitle>⚠️ Eliminar permanentemente</ConfirmToastTitle>
            <ConfirmToastMessage>
              Se eliminará a <strong>{usuario.nombre}</strong>
              <br />
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Esta acción no se puede deshacer
              </span>
            </ConfirmToastMessage>
          </div>
        </ConfirmToastHeader>
        <ConfirmToastActions>
          <ConfirmButton 
            cancel 
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </ConfirmButton>
          <ConfirmButton
            danger
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await usuarioService.eliminarUsuario(usuario.id);
                toast.success('✅ Usuario eliminado exitosamente');
                cargarDatos();
              } catch (error) {
                toast.error(error.message || 'Error al eliminar usuario');
              }
            }}
          >
            <FaTrash />
            Eliminar
          </ConfirmButton>
        </ConfirmToastActions>
      </ConfirmToastContainer>
    ), {
      duration: 10000,
      position: 'top-center',
      style: {
        background: '#1f2937',
        color: '#f9fafb',
        padding: '0',
        borderRadius: '12px',
        border: '1px solid #dc2626',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.3), 0 10px 10px -5px rgba(220, 38, 38, 0.2)',
      }
    });
  };

  const getRolBadgeColor = (rol) => {
    switch (rol) {
      case 'admin': return '#dc2626';
      case 'operador': return '#2563eb';
      case 'visualizador': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'operador': return 'Operador';
      case 'visualizador': return 'Visualizador';
      default: return rol;
    }
  };

  const getRolCount = (rol) => {
    if (!estadisticas?.usersByRole) return 0;
    const found = estadisticas.usersByRole.find(r => r.rol === rol);
    return found ? found.count : 0;
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Cargando...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Title>
            <MdAdminPanelSettings />
            Configuración de Usuarios
          </Title>
          <Subtitle>Gestiona usuarios, roles y permisos del sistema</Subtitle>
        </HeaderLeft>
        <ButtonPrimary onClick={abrirModalCrear}>
          <FaUserPlus /> Nuevo Usuario
        </ButtonPrimary>
      </Header>

      {/* Estadísticas */}
      {estadisticas && (
        <StatsGrid>
          <StatCard color="#3b82f6">
            <StatIcon><FaUsers /></StatIcon>
            <StatInfo>
              <StatNumber>{estadisticas.totalUsers}</StatNumber>
              <StatLabel>Total Usuarios</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard color="#10b981">
            <StatIcon><FaUserCheck /></StatIcon>
            <StatInfo>
              <StatNumber>{estadisticas.activeUsers}</StatNumber>
              <StatLabel>Activos</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard color="#dc2626">
            <StatIcon><MdAdminPanelSettings /></StatIcon>
            <StatInfo>
              <StatNumber>{getRolCount('admin')}</StatNumber>
              <StatLabel>Administradores</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard color="#2563eb">
            <StatIcon><FaUsers /></StatIcon>
            <StatInfo>
              <StatNumber>{getRolCount('operador')}</StatNumber>
              <StatLabel>Operadores</StatLabel>
            </StatInfo>
          </StatCard>
        </StatsGrid>
      )}

      {/* Filtros y Búsqueda */}
      <FiltersContainer>
        <SearchForm onSubmit={handleBuscar}>
          <SearchInput
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
          </SearchButton>
        </SearchForm>

        <FilterGroup>
          <FilterLabel>Rol:</FilterLabel>
          <Select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="">Todos</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
            <option value="visualizador">Visualizador</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Estado:</FilterLabel>
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </FilterGroup>
      </FiltersContainer>

      {/* Tabla de Usuarios */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Fecha Creación</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <Tr key={usuario.id}>
                <Td>
                  <UserName>{usuario.nombre}</UserName>
                </Td>
                <Td>{usuario.email}</Td>
                <Td>
                  <Badge color={getRolBadgeColor(usuario.rol)}>
                    {getRolLabel(usuario.rol)}
                  </Badge>
                </Td>
                <Td>
                  <StatusBadge activo={usuario.activo}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </StatusBadge>
                </Td>
                <Td>{new Date(usuario.creado_en).toLocaleDateString('es-MX')}</Td>
                <Td>
                  <ActionsContainer>
                    <ActionButton 
                      title="Editar"
                      onClick={() => abrirModalEditar(usuario)}
                    >
                      <FaEdit />
                    </ActionButton>
                    <ActionButton 
                      title="Cambiar Contraseña"
                      onClick={() => abrirModalPassword(usuario)}
                    >
                      <FaKey />
                    </ActionButton>
                    {usuario.activo ? (
                      <ActionButton 
                        warning
                        title="Desactivar"
                        onClick={() => handleDesactivar(usuario)}
                      >
                        <FaUserTimes />
                      </ActionButton>
                    ) : (
                      <ActionButton 
                        success
                        title="Activar"
                        onClick={() => handleActivar(usuario)}
                      >
                        <FaUserCheck />
                      </ActionButton>
                    )}
                    <ActionButton 
                      danger
                      title="Eliminar Permanentemente"
                      onClick={() => handleEliminar(usuario)}
                    >
                      <FaTrash />
                    </ActionButton>
                  </ActionsContainer>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {usuarios.length === 0 && (
          <EmptyState>No se encontraron usuarios</EmptyState>
        )}
      </TableContainer>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <PaginationContainer>
          <PaginationInfo>
            Mostrando página {pagination.currentPage} de {pagination.pages} ({pagination.total} usuarios)
          </PaginationInfo>
        </PaginationContainer>
      )}

      {/* Modal */}
      {showModal && (
        <ModalOverlay onClick={cerrarModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {modalType === 'crear' && 'Crear Nuevo Usuario'}
                {modalType === 'editar' && 'Editar Usuario'}
                {modalType === 'password' && 'Cambiar Contraseña'}
              </ModalTitle>
              <CloseButton onClick={cerrarModal}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              {(modalType === 'crear' || modalType === 'editar') && (
                <>
                  <FormGroup>
                    <Label>Nombre</Label>
                    <Input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre completo"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Rol</Label>
                    <Select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      required
                    >
                      <option value="visualizador">Visualizador</option>
                      <option value="operador">Operador</option>
                      <option value="admin">Administrador</option>
                    </Select>
                    <HelpText>
                      {formData.rol === 'admin' && '⚠️ Tendrá acceso total al sistema'}
                      {formData.rol === 'operador' && '📝 Puede crear y editar registros'}
                      {formData.rol === 'visualizador' && '👁️ Solo puede ver información'}
                    </HelpText>
                  </FormGroup>
                </>
              )}

              {/* 🆕 Campo de contraseña con visibilidad (Crear Usuario) */}
              {modalType === 'crear' && (
                <FormGroup>
                  <Label>Contraseña</Label>
                  <PasswordWrapper>
                    <PasswordInput
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={6}
                      required
                      placeholder="Mínimo 6 caracteres"
                    />
                    <TogglePasswordButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </TogglePasswordButton>
                  </PasswordWrapper>
                </FormGroup>
              )}

              {/* 🆕 Campo de nueva contraseña con visibilidad (Cambiar Contraseña) */}
              {modalType === 'password' && (
                <FormGroup>
                  <Label>Nueva Contraseña</Label>
                  <PasswordWrapper>
                    <PasswordInput
                      type={showNewPassword ? "text" : "password"}
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      minLength={6}
                      required
                      placeholder="Mínimo 6 caracteres"
                    />
                    <TogglePasswordButton
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </TogglePasswordButton>
                  </PasswordWrapper>
                  <HelpText>
                    La contraseña para: {usuarioSeleccionado?.email}
                  </HelpText>
                </FormGroup>
              )}

              <ModalActions>
                <ButtonSecondary type="button" onClick={cerrarModal}>
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit">
                  {modalType === 'crear' && 'Crear Usuario'}
                  {modalType === 'editar' && 'Guardar Cambios'}
                  {modalType === 'password' && 'Cambiar Contraseña'}
                </ButtonPrimary>
              </ModalActions>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

// Styled Components para Toast de Confirmación
const ConfirmToastContainer = styled.div`
  padding: 1.2rem;
  width: 100%;
  background: transparent;
`;

const ConfirmToastHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ConfirmToastIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  background: ${props => 
    props.danger ? 'rgba(220, 38, 38, 0.15)' : 
    props.warning ? 'rgba(245, 158, 11, 0.15)' : 
    'rgba(59, 130, 246, 0.15)'};
  color: ${props => 
    props.danger ? '#f87171' : 
    props.warning ? '#fbbf24' : 
    '#60a5fa'};
`;

const ConfirmToastTitle = styled.div`
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.4rem;
  color: #f9fafb;
`;

const ConfirmToastMessage = styled.div`
  font-size: 0.875rem;
  color: #d1d5db;
  line-height: 1.5;

  strong {
    font-weight: 600;
    color: #f9fafb;
  }
`;

const ConfirmToastActions = styled.div`
  display: flex;
  gap: 0.7rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid #374151;
`;

const ConfirmButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background: ${props => 
    props.cancel ? '#4b5563' : 
    props.danger ? '#dc2626' : 
    props.warning ? '#f59e0b' : 
    '#3b82f6'};
  
  color: white;

  &:hover {
    transform: translateY(-1px);
    background: ${props => 
      props.cancel ? '#6b7280' : 
      props.danger ? '#ef4444' : 
      props.warning ? '#fbbf24' : 
      '#60a5fa'};
    box-shadow: 0 4px 12px ${props => 
      props.cancel ? 'rgba(75, 85, 99, 0.4)' : 
      props.danger ? 'rgba(220, 38, 38, 0.4)' : 
      props.warning ? 'rgba(245, 158, 11, 0.4)' : 
      'rgba(59, 130, 246, 0.4)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

// Styled Components - REDUCIDOS 20%
const Container = styled.div`
  padding: 1.6rem;
  width: 100%;
  min-height: 100px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.6rem;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;

  svg {
    color: #d97706;
    font-size: 1.8rem;
  }
`;

const Subtitle = styled.p`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  margin-top: 0.4rem;
  margin-bottom: 0;
  font-size: 0.88rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(176px, 1fr));
  gap: 1.2rem;
  margin-bottom: 1.6rem;
`;

const StatCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 10px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-left: 3px solid ${(props) => props.color};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${(props) => props.theme.bg3};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: ${(props) => props.theme.text};
`;

const StatInfo = styled.div``;

const StatNumber = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
`;

const StatLabel = styled.div`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.7rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.6rem 0.8rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.7rem;

  &:focus {
    outline: none;
    border-color: #d97706;
  }

  &::placeholder {
    color: ${(props) => props.theme.text};
    opacity: 0.5;
  }
`;

const SearchButton = styled.button`
  padding: 0.6rem 0.8rem;
  background: #d97706;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.88rem;

  &:hover {
    background: #b45309;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const FilterLabel = styled.label`
  color: ${(props) => props.theme.text};
  font-weight: 500;
  font-size: 0.7rem;
`;

const TableContainer = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 10px;
  overflow: hidden;
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
  table-layout: auto;
`;

const Th = styled.th`
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  padding: 0.8rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.bg3};

  &:hover {
    background: ${(props) => props.theme.bg3}30;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 0.8rem;
  color: ${(props) => props.theme.text};
  font-size: 0.7rem;
`;

const UserName = styled.span`
  font-weight: 600;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.6rem;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: ${(props) => (props.activo ? '#10b98120' : '#6b728020')};
  color: ${(props) => (props.activo ? '#10b981' : '#6b7280')};
  font-size: 0.6rem;
  font-weight: 600;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${(props) => (props.activo ? '#10b981' : '#6b7280')};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const ActionButton = styled.button`
  padding: 0.4rem;
  background: ${(props) => 
    props.danger ? '#dc262615' : 
    props.warning ? '#f59e0b15' :
    props.success ? '#10b98115' : 
    props.theme.bg3};
  color: ${(props) => 
    props.danger ? '#dc2626' : 
    props.warning ? '#f59e0b' :
    props.success ? '#10b981' : 
    props.theme.text};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.88rem;

  &:hover {
    background: ${(props) => 
      props.danger ? '#dc262630' : 
      props.warning ? '#f59e0b30' :
      props.success ? '#10b98130' : 
      props.theme.bg4};
    transform: scale(1.1);
  }
`;

const ButtonPrimary = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #d97706, #92400e);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
`;

const ButtonSecondary = styled.button`
  padding: 0.6rem 1.2rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg4};
  }
`;

const Select = styled.select`
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.7rem;

  &:focus {
    outline: none;
    border-color: #d97706;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2.4rem;
  color: ${(props) => props.theme.text};
  opacity: 0.5;
  font-size: 0.88rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2.4rem;
  font-size: 1rem;
  color: ${(props) => props.theme.text};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 1.2rem;
`;

const PaginationInfo = styled.span`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.7rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 0.8rem;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.bg};
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const ModalTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.4rem;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
    color: #dc2626;
  }
`;

const Form = styled.form`
  padding: 1.2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  color: ${(props) => props.theme.text};
  font-weight: 600;
  font-size: 0.7rem;
`;

// ⚠️ IMPORTANTE: Define Input PRIMERO
const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 6px;
  font-size: 0.88rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #d97706;
  }

  &::placeholder {
    color: ${(props) => props.theme.text};
    opacity: 0.5;
  }
`;

// 🆕 LUEGO define los componentes de password que extienden Input
const PasswordWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(Input)`
  padding-right: 2.8rem; /* Espacio para el botón del ojo */
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: ${(props) => props.theme.text};
  opacity: 0.6;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1rem;
  border-radius: 4px;

  &:hover {
    opacity: 1;
    background: ${(props) => props.theme.bg3};
  }

  &:focus {
    outline: none;
    opacity: 1;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// Continúa con los demás styled components...
const HelpText = styled.small`
  display: block;
  margin-top: 0.4rem;
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.6rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
`;

export default Configuracion;