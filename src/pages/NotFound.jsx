import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../App';

export function NotFound() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  return (
    <Container theme={theme}>
      <Content>
        <Title>Página No Encontrada</Title>
        <Message>
          Lo sentimos, la página que buscas no existe.
          <br />
          Puede que haya sido movida o eliminada.
        </Message>
        <ButtonGroup>
          <BackButton onClick={() => navigate(-1)}>
            Volver
          </BackButton>
          <HomeButton onClick={() => navigate('/')}>
            Ir al Inicio
          </HomeButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.bg};
  padding: 2rem;
  transition: all 0.3s;
`;

const Content = styled.div`
  text-align: center;
  max-width: 500px;
`;

const Title = styled.h2`
  font-size: 3rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  margin: 1rem 0;
  transition: color 0.3s;
`;

const Message = styled.p`
  font-size: 1.125rem;
  color: ${(props) => props.theme.textSecondary || props.theme.text};
  opacity: 0.8;
  line-height: 1.6;
  margin: 1.5rem 0 2.5rem;
  transition: color 0.3s;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const BackButton = styled.button`
  padding: 0.875rem 2rem;
  background: ${(props) => props.theme.bg3};
  color: ${(props) => props.theme.text};
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg4};
    transform: translateY(-1px);
  }
`;

const HomeButton = styled.button`
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #d97706, #92400e);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(135deg, #b45309, #78350f);
    transform: translateY(-1px);
  }
`;