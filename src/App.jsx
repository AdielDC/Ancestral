import React, { useState } from 'react';
import { MyRoutes } from './routers/routes';
import styled from 'styled-components';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Light, Dark } from './styles/Themes';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { SessionMonitor } from './components/SessionMonitor'; // 🆕 Importar monitor de sesión

export const ThemeContext = React.createContext(null);

// Componente interno que puede usar useLocation
function AppContent() {
  const [theme, setTheme] = useState("light");
  const themeStyle = theme === "light" ? Light : Dark;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Rutas donde NO debe aparecer el Sidebar
  const rutasSinSidebar = ['/login', '/register'];
  const mostrarSidebar = !rutasSinSidebar.includes(location.pathname);

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      <ThemeProvider theme={themeStyle}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'light' ? '#fff' : '#363636',
              color: theme === 'light' ? '#363636' : '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {mostrarSidebar ? (
          <Container className={sidebarOpen ? "sidebarState active" : ""}>
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <MainWrapper>
              <Navbar />
              <ContentArea>
                <MyRoutes />
              </ContentArea>
            </MainWrapper>
          </Container>
        ) : (
          <FullScreenContainer>
            <MyRoutes />
          </FullScreenContainer>
        )}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 80px auto;
  background: ${({ theme }) => theme.bgtotal};
  transition: all 0.3s;
  &.active {
    grid-template-columns: 260px auto;
  }
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${({ theme }) => theme.bgtotal};
`;

const FullScreenContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
`;

export default App;