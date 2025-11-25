import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline } from "react-icons/io5";
import authService from "../services/authService";

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    newsletter: false
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
    if (!formData.firstName.trim()) {
      toast.error('El nombre es requerido');
      setLoading(false);
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error('El apellido es requerido');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      
      toast.success('Registro exitoso! Bienvenido a Envasadora Ancestral');
      
      // Redirigir al dashboard
      navigate('/dashboard');

    } catch (error) {
      toast.error(error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Container>
      <ContentWrapper>
        {/* Left Side - Hero Section */}
        <LeftSection>
          <HeroTitle>
            La mejor solución <br />
            <HeroSubtitle>para tu negocio de mezcal</HeroSubtitle>
          </HeroTitle>

          <HeroDescription>
            Sistema integral de gestión de inventarios para envasadoras de mezcal. 
            Controla tus insumos, recepciones y entregas de manera eficiente 
            y profesional con nuestra plataforma especializada.
          </HeroDescription>
        </LeftSection>

        {/* Right Side - Register Form */}
        <RightSection>
          <ShapeOne />
          <ShapeTwo />

          <FormCard>
            <FormCardBody>
              <Form onSubmit={handleSubmit}>
                {/* Name Row */}
                <FormRow>
                  <FormGroup>
                    <FormLabel>Nombre</FormLabel>
                    <InputWrapper>
                      <InputIcon>
                        <IoPersonOutline />
                      </InputIcon>
                      <FormInput
                        type="text"
                        name="firstName"
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </InputWrapper>
                  </FormGroup>

                  <FormGroup>
                    <FormLabel>Apellido</FormLabel>
                    <InputWrapper>
                      <InputIcon>
                        <IoPersonOutline />
                      </InputIcon>
                      <FormInput
                        type="text"
                        name="lastName"
                        placeholder="Pérez"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </InputWrapper>
                  </FormGroup>
                </FormRow>

                {/* Email */}
                <FormGroup>
                  <FormLabel>Correo electrónico</FormLabel>
                  <InputWrapper>
                    <InputIcon>
                      <IoMailOutline />
                    </InputIcon>
                    <FormInput
                      type="email"
                      name="email"
                      placeholder="ejemplo@correo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </InputWrapper>
                </FormGroup>

                {/* Password */}
                <FormGroup>
                  <FormLabel>Contraseña</FormLabel>
                  <InputWrapper>
                    <InputIcon>
                      <IoLockClosedOutline />
                    </InputIcon>
                    <FormInput
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </InputWrapper>
                  <PasswordHint>Mínimo 6 caracteres</PasswordHint>
                </FormGroup>

                {/* Newsletter Checkbox */}
                <CheckboxContainer>
                  <CheckboxWrapper>
                    <Checkbox
                      type="checkbox"
                      name="newsletter"
                      id="newsletter"
                      checked={formData.newsletter}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    <CheckboxLabel htmlFor="newsletter">
                      Suscribirme a notificaciones del sistema
                    </CheckboxLabel>
                  </CheckboxWrapper>
                </CheckboxContainer>

                {/* Submit Button */}
                <SubmitButton type="submit" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrarse'}
                </SubmitButton>

                {/* Login Link */}
                <LoginLink>
                  ¿Ya tienes una cuenta? {' '}
                  <LoginLinkText onClick={handleLoginRedirect} disabled={loading}>
                    Iniciar sesión
                  </LoginLinkText>
                </LoginLink>
              </Form>
            </FormCardBody>
          </FormCard>
        </RightSection>
      </ContentWrapper>
    </Container>
  );
}

// ============ STYLED COMPONENTS ============

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
  overflow: hidden;
  position: relative;
  
  /* Background Radial Gradient */
  background-color: hsl(218, 41%, 15%);
  background-image: 
    radial-gradient(650px circle at 0% 0%,
      hsl(218, 41%, 35%) 15%,
      hsl(218, 41%, 30%) 35%,
      hsl(218, 41%, 20%) 75%,
      hsl(218, 41%, 19%) 80%,
      transparent 100%),
    radial-gradient(1250px circle at 100% 100%,
      hsl(218, 41%, 45%) 15%,
      hsl(218, 41%, 30%) 35%,
      hsl(218, 41%, 20%) 75%,
      hsl(218, 41%, 19%) 80%,
      transparent 100%);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  min-height: calc(100vh - 4rem);

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 968px) {
    text-align: center;
    padding: 1rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2rem;
  color: hsl(218, 81%, 95%);
  letter-spacing: -0.02em;

  @media (max-width: 1200px) {
    font-size: 3rem;
  }

  @media (max-width: 968px) {
    font-size: 2.5rem;
  }

  @media (max-width: 640px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.span`
  color: hsl(218, 81%, 75%);
  display: block;
`;

const HeroDescription = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: hsl(218, 81%, 85%);
  max-width: 500px;

  @media (max-width: 968px) {
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const RightSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShapeOne = styled.div`
  position: absolute;
  height: 220px;
  width: 220px;
  top: -60px;
  left: -130px;
  background: radial-gradient(#92400e, #d97706);
  border-radius: 50%;
  overflow: hidden;
  z-index: 0;
  animation: float 6s ease-in-out infinite;

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @media (max-width: 968px) {
    height: 150px;
    width: 150px;
    top: -30px;
    left: -70px;
  }
`;

const ShapeTwo = styled.div`
  position: absolute;
  border-radius: 38% 62% 63% 37% / 70% 33% 67% 30%;
  bottom: -60px;
  right: -110px;
  width: 300px;
  height: 300px;
  background: radial-gradient(#92400e, #d97706);
  overflow: hidden;
  z-index: 0;
  animation: morph 8s ease-in-out infinite;

  @keyframes morph {
    0%, 100% {
      border-radius: 38% 62% 63% 37% / 70% 33% 67% 30%;
    }
    50% {
      border-radius: 62% 38% 37% 63% / 33% 70% 30% 67%;
    }
  }

  @media (max-width: 968px) {
    width: 200px;
    height: 200px;
    bottom: -40px;
    right: -60px;
  }
`;

const FormCard = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 550px;
  background-color: hsla(0, 0%, 100%, 0.9);
  backdrop-filter: saturate(200%) blur(25px);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;

  @media (max-width: 968px) {
    max-width: 100%;
  }
`;

const FormCardBody = styled.div`
  padding: 3rem;

  @media (max-width: 640px) {
    padding: 2rem;
  }
`;

const Form = styled.form`
  width: 100%;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-left: 0.25rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #1f2937;
  transition: all 0.2s;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #d97706;
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f9fafb;
  }
`;

const PasswordHint = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.5rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:checked {
    background-color: #d97706;
    border-color: #d97706;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  user-select: none;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.5);
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

const LoginLink = styled.div`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1.5rem;
`;

const LoginLinkText = styled.span`
  color: #d97706;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: #b45309;
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;