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
  FaUsers
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'crear') {
        await usuarioService.crearUsuario(formData);
        toast.success('Usuario creado exitosamente');
      } else if (modalType === 'editar') {
        await usuarioService.actualizarUsuario(usuarioSeleccionado.id, formData);
        toast.success('Usuario actualizado exitosamente');
      } else if (modalType === 'password') {
        await usuarioService.cambiarPassword(usuarioSeleccionado.id, {
          new_password: formData.new_password
        });
        toast.success('Contraseña actualizada exitosamente');
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud');
    }
  };

  const handleDesactivar = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de desactivar al usuario ${usuario.nombre}?`)) {
      return;
    }

    try {
      await usuarioService.desactivarUsuario(usuario.id);
      toast.success('Usuario desactivado exitosamente');
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al desactivar usuario');
    }
  };

  const handleActivar = async (usuario) => {
    try {
      await usuarioService.activarUsuario(usuario.id);
      toast.success('Usuario activado exitosamente');
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al activar usuario');
    }
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de ELIMINAR PERMANENTEMENTE al usuario ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await usuarioService.eliminarUsuario(usuario.id);
      toast.success('Usuario eliminado exitosamente');
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
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

              {modalType === 'crear' && (
                <FormGroup>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    required
                    placeholder="Mínimo 6 caracteres"
                  />
                </FormGroup>
              )}

              {modalType === 'password' && (
                <FormGroup>
                  <Label>Nueva Contraseña</Label>
                  <Input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    minLength={6}
                    required
                    placeholder="Mínimo 6 caracteres"
                  />
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

// Styled Components
const Container = styled.div`
  padding: 2rem;
  width: 100%;
  min-height: 100px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;

  svg {
    color: #d97706;
    font-size: 2.25rem;
  }
`;

const Subtitle = styled.p`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid ${(props) => props.color};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: ${(props) => props.theme.bg3};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: ${(props) => props.theme.text};
`;

const StatInfo = styled.div``;

const StatNumber = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
`;

const StatLabel = styled.div`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.875rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 0.875rem;

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
  padding: 0.75rem 1rem;
  background: #d97706;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #b45309;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  color: ${(props) => props.theme.text};
  font-weight: 500;
  font-size: 0.875rem;
`;

const TableContainer = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 12px;
  overflow: hidden;
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  table-layout: auto;
`;

const Th = styled.th`
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
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
  padding: 1rem;
  color: ${(props) => props.theme.text};
  font-size: 0.875rem;
`;

const UserName = styled.span`
  font-weight: 600;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${(props) => (props.activo ? '#10b98120' : '#6b728020')};
  color: ${(props) => (props.activo ? '#10b981' : '#6b7280')};
  font-size: 0.75rem;
  font-weight: 600;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) => (props.activo ? '#10b981' : '#6b7280')};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
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
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

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
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #d97706, #92400e);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
`;

const ButtonSecondary = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg4};
  }
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #d97706;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${(props) => props.theme.text};
  opacity: 0.5;
  font-size: 1rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.25rem;
  color: ${(props) => props.theme.text};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 1.5rem;
`;

const PaginationInfo = styled.span`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.875rem;
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.bg};
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
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
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${(props) => props.theme.text};
  font-weight: 600;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 8px;
  font-size: 1rem;
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

const HelpText = styled.small`
  display: block;
  margin-top: 0.5rem;
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.75rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
`;

export default Configuracion;