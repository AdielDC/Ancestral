//Para que el usuario autenticado pueda cambiar su contraseña 

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
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
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaLock
} from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

export function Profile() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Estado para validaciones de contraseña
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  // Validar contraseña en tiempo real
  useEffect(() => {
    const { new_password, confirm_password } = passwordData;
    
    setPasswordValidation({
      minLength: new_password.length >= 6,
      hasUpperCase: /[A-Z]/.test(new_password),
      hasLowerCase: /[a-z]/.test(new_password),
      hasNumber: /[0-9]/.test(new_password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(new_password),
      passwordsMatch: new_password === confirm_password && new_password !== ''
    });
  }, [passwordData.new_password, passwordData.confirm_password]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

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
      toast.success('¡Contraseña actualizada exitosamente!');
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

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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

  // Calcular fuerza de la contraseña
  const getPasswordStrength = () => {
    const { minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar } = passwordValidation;
    let strength = 0;
    
    if (minLength) strength += 20;
    if (hasUpperCase) strength += 20;
    if (hasLowerCase) strength += 20;
    if (hasNumber) strength += 20;
    if (hasSpecialChar) strength += 20;

    return strength;
  };

  const getStrengthLabel = (strength) => {
    if (strength === 0) return { label: '', color: '' };
    if (strength <= 40) return { label: 'Débil', color: '#dc2626' };
    if (strength <= 60) return { label: 'Media', color: '#f59e0b' };
    if (strength <= 80) return { label: 'Buena', color: '#3b82f6' };
    return { label: 'Excelente', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength();
  const strengthInfo = getStrengthLabel(passwordStrength);

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

      {/* Modal de cambio de contraseña mejorado */}
      {showPasswordModal && (
        <ModalOverlay onClick={closePasswordModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitleSection>
                <ModalIconWrapper>
                  <FaLock />
                </ModalIconWrapper>
                <div>
                  <ModalTitle>Cambiar Contraseña</ModalTitle>
                  <ModalSubtitle>Actualiza tu contraseña para mantener tu cuenta segura</ModalSubtitle>
                </div>
              </ModalTitleSection>
              <CloseButton onClick={closePasswordModal}>
                &times;
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handlePasswordSubmit}>
                {/* Contraseña actual */}
                <FormGroup>
                  <Label>
                    <FaKey />
                    Contraseña Actual
                  </Label>
                  <PasswordInputWrapper>
                    <PasswordInput
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Ingresa tu contraseña actual"
                      required
                    />
                    <PasswordToggle
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </PasswordToggle>
                  </PasswordInputWrapper>
                </FormGroup>

                <Divider />

                {/* Nueva contraseña */}
                <FormGroup>
                  <Label>
                    <FaKey />
                    Nueva Contraseña
                  </Label>
                  <PasswordInputWrapper>
                    <PasswordInput
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                    <PasswordToggle
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </PasswordToggle>
                  </PasswordInputWrapper>

                  {/* Indicador de fuerza de contraseña */}
                  {passwordData.new_password && (
                    <PasswordStrengthSection>
                      <PasswordStrengthBar>
                        <PasswordStrengthFill 
                          strength={passwordStrength}
                          color={strengthInfo.color}
                        />
                      </PasswordStrengthBar>
                      {strengthInfo.label && (
                        <PasswordStrengthLabel color={strengthInfo.color}>
                          {strengthInfo.label}
                        </PasswordStrengthLabel>
                      )}
                    </PasswordStrengthSection>
                  )}
                </FormGroup>

                {/* Confirmar nueva contraseña */}
                <FormGroup>
                  <Label>
                    <FaCheck />
                    Confirmar Nueva Contraseña
                  </Label>
                  <PasswordInputWrapper>
                    <PasswordInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Repite la nueva contraseña"
                      minLength={6}
                      required
                      $hasError={passwordData.confirm_password && !passwordValidation.passwordsMatch}
                      $hasSuccess={passwordData.confirm_password && passwordValidation.passwordsMatch}
                    />
                    <PasswordToggle
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </PasswordToggle>
                    {passwordData.confirm_password && (
                      <ValidationIcon $isValid={passwordValidation.passwordsMatch}>
                        {passwordValidation.passwordsMatch ? <FaCheck /> : <FaTimes />}
                      </ValidationIcon>
                    )}
                  </PasswordInputWrapper>
                  {passwordData.confirm_password && !passwordValidation.passwordsMatch && (
                    <ErrorText>Las contraseñas no coinciden</ErrorText>
                  )}
                </FormGroup>

                {/* Requisitos de contraseña */}
                {passwordData.new_password && (
                  <RequirementsSection>
                    <RequirementsTitle>Requisitos de contraseña:</RequirementsTitle>
                    <RequirementsList>
                      <RequirementItem $met={passwordValidation.minLength}>
                        {passwordValidation.minLength ? <FaCheck /> : <FaTimes />}
                        Al menos 6 caracteres
                      </RequirementItem>
                      <RequirementItem $met={passwordValidation.hasUpperCase}>
                        {passwordValidation.hasUpperCase ? <FaCheck /> : <FaTimes />}
                        Una letra mayúscula
                      </RequirementItem>
                      <RequirementItem $met={passwordValidation.hasLowerCase}>
                        {passwordValidation.hasLowerCase ? <FaCheck /> : <FaTimes />}
                        Una letra minúscula
                      </RequirementItem>
                      <RequirementItem $met={passwordValidation.hasNumber}>
                        {passwordValidation.hasNumber ? <FaCheck /> : <FaTimes />}
                        Un número
                      </RequirementItem>
                      <RequirementItem $met={passwordValidation.hasSpecialChar}>
                        {passwordValidation.hasSpecialChar ? <FaCheck /> : <FaTimes />}
                        Un carácter especial (!@#$%^&*)
                      </RequirementItem>
                    </RequirementsList>
                  </RequirementsSection>
                )}

                <ModalActions>
                  <ButtonSecondary type="button" onClick={closePasswordModal}>
                    Cancelar
                  </ButtonSecondary>
                  <ButtonPrimary 
                    type="submit" 
                    disabled={saving || !passwordValidation.minLength || !passwordValidation.passwordsMatch}
                  >
                    <FaKey />
                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </ButtonPrimary>
                </ModalActions>
              </Form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

// Animaciones
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const progressAnimation = keyframes`
  from {
    width: 0;
  }
  to {
    width: var(--target-width);
  }
`;

// Styled Components - REDUCIDOS 20%
const Container = styled.div`
  padding: 1.6rem;
  width: 100%;
  min-height: 100px;
`;

const Header = styled.div`
  margin-bottom: 1.6rem;
`;

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto auto;
  gap: 1.2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 13px;
  padding: 1.6rem;
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
  padding-bottom: 1.2rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #92400e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);
`;

const UserMainInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
`;

const UserName = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  margin: 0;
`;

const UserEmail = styled.span`
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  font-size: 0.7rem;
`;

const RolBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 0.4rem;

  svg {
    font-size: 0.6rem;
  }
`;

const RolBadgeSmall = styled.span`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: ${(props) => props.color}20;
  color: ${(props) => props.color};
  font-size: 0.6rem;
  font-weight: 600;
`;

const StatusSection = styled.div`
  padding-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const StatusIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${(props) => props.theme.bg3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.text};

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.$active ? '#10b981' : '#6b7280')};
  }

  svg {
    font-size: 0.8rem;
    opacity: 0.7;
  }
`;

const StatusText = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.6rem;
    color: ${(props) => props.theme.text};
    opacity: 0.6;
  }

  .value {
    font-size: 0.7rem;
    color: ${(props) => props.theme.text};
    font-weight: 500;
  }
`;

const FormCard = styled.div`
  background: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 13px;
  padding: 1.2rem;
`;

const SecurityCard = styled(FormCard)``;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
`;

const FormTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;

  svg {
    color: #d97706;
  }
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg4};
  }
`;

const Form = styled.form`
  padding: 0 0.8rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  color: ${(props) => props.theme.text};
  font-weight: 600;
  font-size: 0.7rem;

  svg {
    font-size: 0.7rem;
    opacity: 0.7;
  }
`;

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

const StaticValue = styled.div`
  padding: 0.6rem 0;
  color: ${(props) => props.theme.text};
  font-size: 0.88rem;
`;

const HelpText = styled.small`
  display: block;
  margin-top: 0.4rem;
  color: ${(props) => props.theme.text};
  opacity: 0.6;
  font-size: 0.6rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
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
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonSecondary = styled.button`
  padding: 0.6rem 1.2rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 6px;
  font-size: 0.88rem;
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
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: transparent;
  color: #d97706;
  border: 1px solid #d97706;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #d9770610;
  }
`;

const SecurityContent = styled.div`
  padding: 0 0.8rem;
`;

const SecurityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const SecurityInfo = styled.div`
  h4 {
    margin: 0 0 0.2rem 0;
    color: ${(props) => props.theme.text};
    font-size: 0.88rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${(props) => props.theme.text};
    opacity: 0.6;
    font-size: 0.7rem;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2.4rem;
  font-size: 1rem;
  color: ${(props) => props.theme.text};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2.4rem;
  font-size: 1rem;
  color: #dc2626;
`;

// Modal mejorado
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 0.8rem;
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.bg};
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid ${(props) => props.theme.bg3};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.bg3};
  background: ${(props) => props.theme.bg2};
`;

const ModalTitleSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const ModalIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d97706, #92400e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
  margin: 0 0 0.3rem 0;
`;

const ModalSubtitle = styled.p`
  font-size: 0.75rem;
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  margin: 0;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.5;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  &:hover {
    opacity: 1;
    background: ${(props) => props.theme.bg3};
    color: #dc2626;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 0.7rem 2.8rem 0.7rem 0.8rem;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};
  border: 1px solid ${(props) => 
    props.$hasError ? '#dc2626' : 
    props.$hasSuccess ? '#10b981' : 
    props.theme.bg3};
  border-radius: 8px;
  font-size: 0.88rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => 
      props.$hasError ? '#dc2626' : 
      props.$hasSuccess ? '#10b981' : 
      '#d97706'};
    box-shadow: 0 0 0 3px ${(props) => 
      props.$hasError ? '#dc262615' : 
      props.$hasSuccess ? '#10b98115' : 
      '#d9770615'};
  }

  &::placeholder {
    color: ${(props) => props.theme.text};
    opacity: 0.5;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: ${(props) => props.theme.text};
  opacity: 0.5;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    background: ${(props) => props.theme.bg3};
  }

  svg {
    font-size: 1rem;
  }
`;

const ValidationIcon = styled.div`
  position: absolute;
  right: 2.5rem;
  color: ${(props) => props.$isValid ? '#10b981' : '#dc2626'};
  font-size: 0.9rem;
  pointer-events: none;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Divider = styled.div`
  height: 1px;
  background: ${(props) => props.theme.bg3};
  margin: 1.2rem 0;
`;

const PasswordStrengthSection = styled.div`
  margin-top: 0.6rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const PasswordStrengthBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${(props) => props.theme.bg3};
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.4rem;
`;

const PasswordStrengthFill = styled.div`
  height: 100%;
  --target-width: ${(props) => props.strength}%;
  width: var(--target-width);
  background: ${(props) => props.color};
  border-radius: 3px;
  transition: all 0.3s ease;
  animation: ${progressAnimation} 0.5s ease-out;
`;

const PasswordStrengthLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${(props) => props.color};
`;

const ErrorText = styled.span`
  display: block;
  margin-top: 0.4rem;
  color: #dc2626;
  font-size: 0.7rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const RequirementsSection = styled.div`
  background: ${(props) => props.theme.bg2};
  border: 1px solid ${(props) => props.theme.bg3};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const RequirementsTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  margin-bottom: 0.6rem;
  opacity: 0.8;
`;

const RequirementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const RequirementItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${(props) => props.$met ? '#10b981' : props.theme.text};
  opacity: ${(props) => props.$met ? 1 : 0.6};
  transition: all 0.2s;

  svg {
    font-size: 0.7rem;
    color: ${(props) => props.$met ? '#10b981' : '#6b7280'};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.2rem;
  border-top: 1px solid ${(props) => props.theme.bg3};
`;

export default Profile;