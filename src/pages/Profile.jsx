//Para que el usuario autenticado pueda cambiar su contraseña 

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';
import usuarioService from '../services/usuarioService';
import { 
  FaUser, 
  FaEnvelope, 
  FaKey, 
  FaSave, 
  FaUserCircle,
  FaCalendarAlt,
  FaShieldAlt
} from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

export function Profile() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Obtener datos actualizados del servidor
      const response = await usuarioService.obtenerUsuario(currentUser.id);
      setUsuario(response);
      setFormData({
        nombre: response.nombre,
        email: response.email
      });
    } catch (error) {
      toast.error('Error al cargar el perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await usuarioService.actualizarUsuario(usuario.id, formData);
      
      // Actualizar el usuario en localStorage
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUsuario(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setSaving(true);
      await usuarioService.cambiarPassword(usuario.id, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      toast.success('Contraseña actualizada exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email
    });
    setEditMode(false);
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'operador': return 'Operador';
      case 'visualizador': return 'Visualizador';
      default: return rol;
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin': return '#dc2626';
      case 'operador': return '#2563eb';
      case 'visualizador': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Cargando perfil...</LoadingSpinner>
      </Container>
    );
  }

  if (!usuario) {
    return (
      <Container>
        <ErrorMessage>No se pudo cargar el perfil</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaUserCircle />
          Mi Perfil
        </Title>
        <Subtitle>Gestiona tu información personal y seguridad</Subtitle>
      </Header>

      <ContentGrid>
        {/* Tarjeta de información principal */}
        <ProfileCard>
          <CardHeader>
            <Avatar>
              {usuario.nombre?.charAt(0).toUpperCase()}
            </Avatar>
            <UserMainInfo>
              <UserName>{usuario.nombre}</UserName>
              <UserEmail>{usuario.email}</UserEmail>
              <RolBadge color={getRolColor(usuario.rol)}>
                <FaShieldAlt />
                {getRolLabel(usuario.rol)}
              </RolBadge>
            </UserMainInfo>
          </CardHeader>

          <StatusSection>
            <StatusItem>
              <StatusIcon $active={usuario.activo}>
                <div className="dot" />
              </StatusIcon>
              <StatusText>
                <span className="label">Estado</span>
                <span className="value">{usuario.activo ? 'Activo' : 'Inactivo'}</span>
              </StatusText>
            </StatusItem>
            
            <StatusItem>
              <StatusIcon>
                <FaCalendarAlt />
              </StatusIcon>
              <StatusText>
                <span className="label">Miembro desde</span>
                <span className="value">{formatDate(usuario.creado_en)}</span>
              </StatusText>
            </StatusItem>
          </StatusSection>
        </ProfileCard>

        {/* Formulario de edición */}
        <FormCard>
          <FormHeader>
            <FormTitle>
              <FaUser />
              Información Personal
            </FormTitle>
            {!editMode && (
              <EditButton onClick={() => setEditMode(true)}>
                <MdEdit />
                Editar
              </EditButton>
            )}
          </FormHeader>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                <FaUser />
                Nombre
              </Label>
              {editMode ? (
                <Input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  required
                />
              ) : (
                <StaticValue>{usuario.nombre}</StaticValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                <FaEnvelope />
                Correo Electrónico
              </Label>
              {editMode ? (
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                />
              ) : (
                <StaticValue>{usuario.email}</StaticValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                <FaShieldAlt />
                Rol
              </Label>
              <StaticValue>
                <RolBadgeSmall color={getRolColor(usuario.rol)}>
                  {getRolLabel(usuario.rol)}
                </RolBadgeSmall>
                <HelpText>El rol solo puede ser modificado por un administrador</HelpText>
              </StaticValue>
            </FormGroup>

            {editMode && (
              <ButtonGroup>
                <ButtonSecondary type="button" onClick={cancelEdit}>
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit" disabled={saving}>
                  <FaSave />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </ButtonPrimary>
              </ButtonGroup>
            )}
          </Form>
        </FormCard>

        {/* Sección de seguridad */}
        <SecurityCard>
          <FormHeader>
            <FormTitle>
              <FaKey />
              Seguridad
            </FormTitle>
          </FormHeader>

          <SecurityContent>
            <SecurityItem>
              <SecurityInfo>
                <h4>Contraseña</h4>
                <p>Última actualización: {formatDate(usuario.actualizado_en) || 'Nunca'}</p>
              </SecurityInfo>
              <ButtonOutline onClick={() => setShowPasswordModal(true)}>
                <FaKey />
                Cambiar Contraseña
              </ButtonOutline>
            </SecurityItem>
          </SecurityContent>
        </SecurityCard>
      </ContentGrid>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <ModalOverlay onClick={() => setShowPasswordModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <FaKey />
                Cambiar Contraseña
              </ModalTitle>
              <CloseButton onClick={() => setShowPasswordModal(false)}>
                &times;
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handlePasswordSubmit}>
              <FormGroup>
                <Label>Contraseña Actual</Label>
                <Input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Nueva Contraseña</Label>
                <Input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Confirmar Nueva Contraseña</Label>
                <Input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Repite la nueva contraseña"
                  minLength={6}
                  required
                />
              </FormGroup>

              <ModalActions>
                <ButtonSecondary type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit" disabled={saving}>
                  <FaKey />
                  {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
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
  margin-bottom: 2rem;
`;

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  grid-template-rows: auto auto;
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 16px;
  padding: 2rem;
  grid-row: span 2;

  @media (max-width: 900px) {
    grid-row: span 1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #92400e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);
`;

const UserMainInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  margin: 0;
`;

const UserEmail = styled.span`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.875rem;
`;

const RolBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;

  svg {
    font-size: 0.75rem;
  }
`;

const RolBadgeSmall = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusSection = styled.div`
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${(props) => props.theme.bg3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.text};

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${(props) => (props.$active ? '#10b981' : '#6b7280')};
  }

  svg {
    font-size: 1rem;
    opacity: 0.7;
  }
`;

const StatusText = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.75rem;
    color: ${(props) => props.theme.text};
    opacity: 0.6;
  }

  .value {
    font-size: 0.875rem;
    color: ${(props) => props.theme.text};
    font-weight: 500;
  }
`;

const FormCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 16px;
  padding: 1.5rem;
`;

const SecurityCard = styled(FormCard)``;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const FormTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;

  svg {
    color: #d97706;
  }
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg4};
  }
`;

const Form = styled.form``;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${(props) => props.theme.text};
  font-weight: 600;
  font-size: 0.875rem;

  svg {
    font-size: 0.875rem;
    opacity: 0.7;
  }
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

const StaticValue = styled.div`
  padding: 0.75rem 0;
  color: ${(props) => props.theme.text};
  font-size: 1rem;
`;

const HelpText = styled.small`
  display: block;
  margin-top: 0.5rem;
  color: ${(props) => props.theme.text};
  opacity: 0.6;
  font-size: 0.75rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
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

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const ButtonOutline = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #d97706;
  border: 1px solid #d97706;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #d9770610;
  }
`;

const SecurityContent = styled.div``;

const SecurityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SecurityInfo = styled.div`
  h4 {
    margin: 0 0 0.25rem 0;
    color: ${(props) => props.theme.text};
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${(props) => props.theme.text};
    opacity: 0.6;
    font-size: 0.875rem;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.25rem;
  color: ${(props) => props.theme.text};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.25rem;
  color: #dc2626;
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
  border-radius: 16px;
  max-width: 450px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;

  svg {
    color: #d97706;
  }
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

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
`;

export default Profile;