import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import authService from "../services/authService";
import logo from "../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Necesitarás instalar react-icons

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ Estado para mostrar/ocultar contraseña

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      toast.success(`Bienvenido, ${response.user.nombre}!`);
      
      // Redirigir según el rol del usuario
      if (response.user.rol === 'admin') {
        navigate('');
      } else if (response.user.rol === 'operador') {
        navigate('/');
      } else {
        navigate('/');
      }

    } catch (error) {
      toast.error(error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <LoginContainer>
      <ContentWrapper>
        <LeftSection>
          <FormContainer>
            <WelcomeText> INICIA SESIÓN </WelcomeText>

            <LoginForm onSubmit={handleSubmit}>
              <InputGroup>
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  disabled={loading}
                />
              </InputGroup>

              <InputGroup>
                <Label>Contraseña</Label>
                <PasswordWrapper>
                  <PasswordInput
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </TogglePasswordButton>
                </PasswordWrapper>
              </InputGroup>

              <ButtonSection>
                <LoginButton type="submit" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </LoginButton>
                <ForgotPasswordLink onClick={handleForgotPassword} disabled={loading}>
                  ¿Olvidaste tu contraseña?
                </ForgotPasswordLink>
              </ButtonSection>

              <SignUpSection>
                <SignUpText>¿No tienes una cuenta?</SignUpText>
                <SignUpButton type="button" onClick={handleSignUp} disabled={loading}>
                  Registrarse
                </SignUpButton>
              </SignUpSection>
            </LoginForm>
          </FormContainer>
        </LeftSection>

        <RightSection>
          <LogoSection>
            <Logo>
              <img src={logo} alt="Logo Ancestral" />
            </Logo>
          </LogoSection>
          <ContentSection>
            <RightTitle>Tradición y calidad</RightTitle>
            <RightDescription>
              El Mezcal más que una bebida en Oaxaca, es un legado Ancestral. En Envasadora Ancestral preservamos las tradiciones oaxaqueñas con tecnología moderna para la más alta calidad.
            </RightDescription>
          </ContentSection>
        </RightSection>
      </ContentWrapper>
    </LoginContainer>
  );
}

// Styled Components
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 0;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    flex-direction: row;
    height: 600px;
  }
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 2rem 2rem 2rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem 3rem 3rem;
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 350px;
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Logo = styled.div`
  img {
    width: 50%;
    height: 50%;
    object-fit: contain;
    border-radius: 50%;
  }
`;

const WelcomeText = styled.p`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  line-height: 1.3;
  text-align: center;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fafafa;

  &:focus {
    outline: none;
    border-color: #d4af37;
    background: white;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 🆕 Nuevos componentes para el campo de contraseña con visibilidad
const PasswordWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(Input)`
  padding-right: 3rem; /* Espacio para el botón del ojo */
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  font-size: 1.1rem;

  &:hover:not(:disabled) {
    color: #d4af37;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ButtonSection = styled.div`
  margin-bottom: 2rem;
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #d4af37, #b8860b);
  color: #000000;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #b8860b, #a67c00);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: #d4af37;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SignUpSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;

  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const SignUpText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
`;

const SignUpButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: transparent;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #000000;
    color: white;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const RightSection = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #000000 0%, #333333 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
  }

  @media (min-width: 768px) {
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    padding: 3rem;
  }
`;

const ContentSection = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  max-width: 300px;

  @media (min-width: 768px) {
    text-align: left;
  }
`;

const RightTitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  line-height: 1.3;
  text-align: center;
`;

const RightDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.95;
  text-align: justify;
`;