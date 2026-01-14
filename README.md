# 📦 Sistema de Gestión de Inventario - Frontend

## 🎯 Descripción del Proyecto

Sistema web de gestión de inventario para **Envasadora Ancestral**, empresa dedicada al envasado de mezcal. La aplicación permite controlar inventarios de insumos (botellas, tapones, etiquetas, cajas, etc.), gestionar recepciones y entregas, monitorear alertas de stock, y administrar usuarios con diferentes niveles de permisos.

## 🛠️ Tecnologías Utilizadas

### Core
- **React** 18.x - Biblioteca principal para UI
- **React Router DOM** - Navegación y enrutamiento
- **Styled Components** - Estilos CSS-in-JS

### Estado y Comunicación
- **Axios** - Cliente HTTP para consumo de API REST
- **React Hot Toast** - Notificaciones y alertas elegantes

### UI/UX
- **React Icons** - Iconografía (Font Awesome, Material Design)
- **jsPDF** & **jsPDF-AutoTable** - Generación de documentos PDF

### Herramientas de Desarrollo
- **Vite** - Build tool y dev server
- **ESLint** - Linter de código

## 📁 Estructura del Proyecto

```
frontend/
├── public/                    # Archivos estáticos
│   └── logo.png              # Logo de la empresa
│
├── src/
│   ├── components/           # Componentes React
│   │   ├── Login.jsx        # Autenticación de usuarios
│   │   ├── Dashboard.jsx    # Panel principal
│   │   ├── Configuracion.jsx # Gestión de usuarios
│   │   ├── Profile.jsx      # Perfil de usuario
│   │   ├── Clientes.jsx     # Gestión de clientes
│   │   ├── Inventario.jsx   # Control de inventario
│   │   ├── Recepciones.jsx  # Recepción de insumos
│   │   ├── Entregas.jsx     # Entregas de insumos
│   │   ├── Alertas.jsx      # Alertas de stock bajo
│   │   └── Navbar.jsx       # Barra de navegación
│   │
│   ├── services/            # Servicios de API
│   │   ├── authService.js   # Autenticación y JWT
│   │   ├── usuarioService.js # CRUD de usuarios
│   │   ├── clienteService.js # CRUD de clientes
│   │   ├── inventarioService.js # CRUD de inventario
│   │   ├── recepcionService.js # Gestión de recepciones
│   │   ├── entregaService.js # Gestión de entregas
│   │   └── alertaService.js # Gestión de alertas
│   │
│   ├── contexts/            # Contextos de React
│   │   └── ThemeContext.jsx # Tema claro/oscuro
│   │
│   ├── App.jsx              # Componente raíz
│   ├── main.jsx             # Punto de entrada
│   └── index.css            # Estilos globales
│
├── package.json             # Dependencias del proyecto
└── vite.config.js          # Configuración de Vite
```

## 🎨 Características Principales

### 🔐 Autenticación y Autorización
- **Sistema de Login** con validación de credenciales
- **JWT (JSON Web Tokens)** para sesiones seguras
- **Roles de usuario**:
  - 👑 **Admin**: Acceso total al sistema
  - 📝 **Operador**: Puede crear y editar registros
  - 👁️ **Visualizador**: Solo lectura

### 👥 Gestión de Usuarios
- CRUD completo de usuarios
- Cambio de contraseña con validación de seguridad:
  - Indicador de fuerza de contraseña
  - Validación en tiempo real
  - Requisitos visuales (mayúsculas, números, caracteres especiales)
- Activación/desactivación de usuarios
- Búsqueda y filtrado por rol y estado
- Estadísticas de usuarios activos

### 📊 Dashboard
- **Estadísticas generales**:
  - Total de insumos en inventario
  - Valor total del inventario
  - Clientes activos
  - Alertas pendientes
- **Gráficas interactivas** de stock por categoría
- **Alertas críticas** destacadas
- **Accesos rápidos** a funciones principales

### 📦 Gestión de Inventario
- **Registro de insumos** por:
  - Cliente
  - Marca
  - Variedad de agave
  - Presentación (50ml, 200ml, 375ml, 500ml, 750ml, 1000ml)
  - Tipo (Nacional/Exportación)
- **Control de stock**:
  - Stock actual
  - Stock mínimo
  - Alertas automáticas
- **Categorías de insumos**:
  - Botellas
  - Tapones/Corchos
  - Cintillos
  - Sellos térmicos
  - Etiquetas
  - Cajas
  - Bolsas de papel

### 📥 Recepciones de Insumos
- Registro de recepción con:
  - Número de recepción automático
  - Proveedor
  - Cliente
  - Orden de compra
  - Factura
  - Detalles de insumos recibidos
- **Generación de PDF** con formato profesional
- Estados: Pendiente, Completado, Cancelado
- Actualización automática de inventario

### 📤 Entregas de Insumos
- Registro de entregas con:
  - Número de entrega automático
  - Cliente destinatario
  - Orden de producción
  - Lote de producción
  - Control de desperdicios
- **Generación de PDF** personalizado
- Actualización automática de stock
- Historial de movimientos

### 🔔 Sistema de Alertas
- **Alertas automáticas** cuando el stock llega a niveles críticos:
  - 🔴 **Crítico**: ≤30% del stock mínimo
  - 🟡 **Bajo**: 30-100% del stock mínimo
- **Notificaciones en tiempo real**
- **Navegación directa** al insumo desde la alerta
- Contador de alertas en navbar
- Auto-refresh de alertas

### 🎨 Temas
- **Modo Claro** y **Modo Oscuro**
- Cambio dinámico sin recargar página
- Persistencia de preferencia en localStorage
- Diseño completamente responsive

### 📱 Interfaz Responsive
- Diseño adaptable a:
  - 💻 Desktop (>900px)
  - 📱 Tablet (600px - 900px)
  - 📱 Mobile (<600px)
- Navegación optimizada para móviles
- Tablas con scroll horizontal

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js >= 16.x
npm >= 8.x
```

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Ejecutar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### 5. Build para producción
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`

## 📚 Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",            // Build de producción
  "preview": "vite preview",        // Preview del build
  "lint": "eslint . --ext js,jsx"   // Linter de código
}
```

## 🔌 Integración con Backend

### Configuración de Axios

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

### Endpoints Consumidos

| Módulo | Endpoint | Método | Descripción |
|--------|----------|--------|-------------|
| Auth | `/auth/login` | POST | Login de usuario |
| Auth | `/auth/me` | GET | Obtener usuario actual |
| Usuarios | `/usuarios` | GET | Listar usuarios |
| Usuarios | `/usuarios/:id` | GET | Obtener usuario |
| Usuarios | `/usuarios` | POST | Crear usuario |
| Usuarios | `/usuarios/:id` | PUT | Actualizar usuario |
| Usuarios | `/usuarios/:id/password` | PATCH | Cambiar contraseña |
| Usuarios | `/usuarios/:id/toggle` | PATCH | Activar/Desactivar |
| Clientes | `/clientes` | GET | Listar clientes |
| Clientes | `/clientes/:id` | GET/PUT/DELETE | CRUD cliente |
| Inventario | `/inventario` | GET | Listar inventario |
| Inventario | `/inventario/:id` | GET/PUT/DELETE | CRUD insumo |
| Recepciones | `/recepciones` | GET/POST | Gestión recepciones |
| Entregas | `/entregas` | GET/POST | Gestión entregas |
| Alertas | `/alertas` | GET | Obtener alertas |

## 🎨 Componentes Destacados

### 1. Sistema de Toast Personalizado
```jsx
// Confirmación de desactivar usuario
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
      <ConfirmButton cancel onClick={() => toast.dismiss(t.id)}>
        Cancelar
      </ConfirmButton>
      <ConfirmButton warning onClick={handleConfirm}>
        Desactivar
      </ConfirmButton>
    </ConfirmToastActions>
  </ConfirmToastContainer>
), { duration: 8000 });
```

### 2. Validación de Contraseña con Indicadores
```jsx
// Validación en tiempo real
const [passwordValidation, setPasswordValidation] = useState({
  minLength: false,
  hasUpperCase: false,
  hasLowerCase: false,
  hasNumber: false,
  hasSpecialChar: false,
  passwordsMatch: false
});

// Barra de fuerza de contraseña
<PasswordStrengthBar>
  <PasswordStrengthFill 
    strength={passwordStrength}
    color={strengthInfo.color}
  />
</PasswordStrengthBar>
```

### 3. Generación de PDFs
```jsx
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generarPDF = (datos) => {
  const doc = new jsPDF();
  
  // Logo
  doc.addImage(logo, 'PNG', 15, 10, 30, 30);
  
  // Título
  doc.setFontSize(18);
  doc.text('RECIBO DE INSUMOS', 105, 25, { align: 'center' });
  
  // Tabla
  doc.autoTable({
    startY: 80,
    head: [['Insumo', 'Cantidad', 'Unidad']],
    body: datos.detalles.map(d => [
      d.nombre,
      d.cantidad,
      d.unidad
    ]),
  });
  
  doc.save(`recepcion_${datos.numero}.pdf`);
};
```

## 🔒 Seguridad

### Protección de Rutas
```jsx
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};
```

### Manejo de JWT
```javascript
// Almacenamiento seguro
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));

// Expiración de token (30 minutos)
const TOKEN_EXPIRY = 30 * 60 * 1000;

// Auto-logout al expirar
setTimeout(() => {
  authService.logout();
  window.location.href = '/login';
}, TOKEN_EXPIRY);
```

## 🎯 Mejores Prácticas Implementadas

✅ **Componentes funcionales** con hooks
✅ **Styled Components** para estilos encapsulados
✅ **Separación de concerns** (componentes, servicios, contextos)
✅ **Manejo de errores** consistente
✅ **Loading states** en todas las operaciones asíncronas
✅ **Validación de formularios** en cliente
✅ **Feedback visual** con toast notifications
✅ **Responsive design** mobile-first
✅ **Código limpio** y comentado
✅ **Soft delete** en lugar de eliminación permanente

## 📈 Mejoras Futuras

- [ ] Implementar PWA (Progressive Web App)
- [ ] Agregar pruebas unitarias (Jest/Vitest)
- [ ] Implementar lazy loading de componentes
- [ ] Agregar modo offline con Service Workers
- [ ] Implementar filtros avanzados y exportación a Excel
- [ ] Agregar gráficas más detalladas con Chart.js
- [ ] Implementar sistema de notificaciones push
- [ ] Agregar tutorial interactivo para nuevos usuarios

## 👥 Roles y Permisos

| Funcionalidad | Admin | Operador | Visualizador |
|---------------|-------|----------|--------------|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Ver Inventario | ✅ | ✅ | ✅ |
| Crear/Editar Inventario | ✅ | ✅ | ❌ |
| Eliminar Inventario | ✅ | ❌ | ❌ |
| Gestionar Recepciones | ✅ | ✅ | ❌ |
| Gestionar Entregas | ✅ | ✅ | ❌ |
| Gestionar Usuarios | ✅ | ❌ | ❌ |
| Ver Alertas | ✅ | ✅ | ✅ |
| Configuración Sistema | ✅ | ❌ | ❌ |

## 📞 Soporte y Contacto

**Envasadora Ancestral**
- 📍 Prolongación Pinos #110, Eucaliptos, Pueblo Nuevo, Oaxaca de Juárez, Oax. C.P.: 68274
- 📧 contacto@envasadoraancestral.mx
- 📱 Tel.: 951 750 6689

## 📄 Licencia

Copyright © 2025 Envasadora Ancestral. Todos los derechos reservados.

---

Desarrollado con ❤️ para la industria del mezcal artesanal
