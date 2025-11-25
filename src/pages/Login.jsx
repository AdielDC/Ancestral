import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import authService from "../services/authService";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      toast.success(`Bienvenido, ${response.user.nombre}!`);
      
      // Redirigir según el rol del usuario
      if (response.user.rol === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.rol === 'operador') {
        navigate('/operador/dashboard');
      } else {
        navigate('/dashboard');
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
            <LogoSection>
              <Logo>EA</Logo>
              <CompanyTitle>Somos Envasadora Ancestral</CompanyTitle>
            </LogoSection>

            <WelcomeText>Por favor inicia sesión en tu cuenta</WelcomeText>

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
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
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
          <ContentSection>
            <RightTitle>Más que una empresa de envasado</RightTitle>
            <RightDescription>
              En Envasadora Ancestral nos especializamos en el envasado artesanal de mezcal, 
              preservando las tradiciones oaxaqueñas mientras implementamos tecnología moderna 
              para garantizar la más alta calidad en cada botella que producimos.
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
  background: linear-gradient(135deg, #fef7e6 0%, #f7f3e9 100%);
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
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
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
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #2e2d2cff, #2b1f11ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 auto 1rem auto;
  box-shadow: 0 4px 15px rgba(146, 64, 14, 0.3);
`;

const CompanyTitle = styled.h4`
  color: #92400e;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
`;

const WelcomeText = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 2rem;
  text-align: left;
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
    border-color: #d97706;
    background: white;
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonSection = styled.div`
  margin-bottom: 2rem;
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #d97706, #92400e);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #b45309, #78350f);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
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
    color: #d97706;
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
  color: #dc2626;
  border: 2px solid #dc2626;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #dc2626;
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
  background: linear-gradient(135deg, #191512ff, #140303ff, #0f0c0dff, #403b3eff);
  display: flex;
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
`;

const RightDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.95;
`;