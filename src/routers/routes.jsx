import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "../pages/Home";
import { Inventary } from "../pages/Inventary";
import { Delivery } from "../pages/Delivery";
import { Reception } from "../pages/Reception";
import { Login } from "../pages/Login";
import { Clients } from "../pages/Clients";
import { Register } from "../pages/Register";
import { Unauthorized } from "../pages/Unauthorized";
import { NotFound } from "../pages/NotFound";
import { Configuracion } from "../pages/Configuracion";
import { Profile } from "../pages/Profile";
import { ProtectedRoute } from "../components/Protectedroute";
import authService from "../services/authService";
import {ClienteConfig} from "../pages/ClienteConfig";
import {Alerts} from "../pages/Alerts";

export function MyRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={
          authService.isAuthenticated() ? 
          <Navigate to="/" replace /> : 
          <Login />
        } 
      />
      
      <Route 
        path="/register" 
        element={
          authService.isAuthenticated() ? 
          <Navigate to="/" replace /> : 
          <Register />
        } 
      />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventary"
        element={
          <ProtectedRoute>
            <Inventary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/delivery"
        element={
          <ProtectedRoute requireOperador>
            <Delivery />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reception"
        element={
          <ProtectedRoute requireOperador>
            <Reception />
          </ProtectedRoute>
        }
      />

      <Route
        path="/registros"
        element={
          <ProtectedRoute requireAdmin>
            <Clients />
          </ProtectedRoute>
        }
      />

            <Route
        path="/clientes"
        element={
          <ProtectedRoute requireAdmin>
            <ClienteConfig />
          </ProtectedRoute>
        }
      />
      
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute requireAdmin>
                <Configuracion/>
            </ProtectedRoute>
          }
        />

                <Route
          path="/alertas"
          element={
            <ProtectedRoute >
                <Alerts/>
            </ProtectedRoute>
          }
        />

              <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Página de acceso no autorizado */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 404 - Página no encontrada */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}