// Home.jsx - Dashboard Principal conectado a la API
// Ubicación: src/pages/Home.jsx
// NOTA: Requiere instalar recharts: npm install recharts

import { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { ThemeContext } from "../App";
import { 
  IoWarningOutline, 
  IoCheckmarkCircle, 
  IoCube, 
  IoArrowDownCircle,
  IoArrowUpCircle,
  IoAlertCircle,
  IoCalendarOutline,
  IoRefreshOutline,
  IoStatsChartOutline,
  IoTrendingUp
} from "react-icons/io5";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

// Importar servicios
import { inventarioService } from "../services/inventarioService";
import { recepcionService } from "../services/recepcionService";
import { entregaService } from "../services/entregaService";

// Colores para gráficas (inspirados en la imagen - azul y naranja/dorado)
const COLORS = {
  primary: '#1e3a5f',      // Azul oscuro
  secondary: '#f5a623',    // Naranja/dorado
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  blue: '#3b82f6',
  lightBlue: '#60a5fa'
};

const PIE_COLORS = ['#1e3a5f', '#f5a623', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

export function Home() {
  const { theme } = useContext(ThemeContext);
  
  // Estados para datos
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalInsumos: 0,
    recepcionesMes: 0,
    entregasMes: 0,
    alertasActivas: 0,
    stockAdecuado: 0,
    stockBajo: 0,
    stockCritico: 0
  });
  const [movimientosMensuales, setMovimientosMensuales] = useState([]);
  const [distribucionCategorias, setDistribucionCategorias] = useState([]);
  const [movimientosArea, setMovimientosArea] = useState([]);
  const [alertasRecientes, setAlertasRecientes] = useState([]);

  // Cargar datos al montar
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar datos en paralelo
      const [inventarioRes, recepcionesRes, entregasRes] = await Promise.all([
        inventarioService.getAll().catch(() => ({ data: [] })),
        recepcionService.getAll().catch(() => ({ data: [] })),
        entregaService.getAll().catch(() => ({ data: [] }))
      ]);

      const inventarioData = inventarioRes.data || inventarioRes || [];
      const recepcionesData = recepcionesRes.data || recepcionesRes || [];
      const entregasData = entregasRes.data || entregasRes || [];

      // Calcular KPIs
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filtrar recepciones y entregas del mes actual
      const recepcionesMes = recepcionesData.filter(r => {
        const fecha = new Date(r.fecha_recepcion || r.creado_en);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });

      const entregasMes = entregasData.filter(e => {
        const fecha = new Date(e.fecha_entrega || e.creado_en);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });

      // Calcular estado del stock
      let stockAdecuado = 0;
      let stockBajo = 0;
      let stockCritico = 0;
      const alertas = [];

      inventarioData.forEach(item => {
        const stock = item.stock || 0;
        const stockMinimo = item.stock_minimo || 100;
        const porcentaje = stockMinimo > 0 ? (stock / stockMinimo) * 100 : 100;

        if (porcentaje >= 100) {
          stockAdecuado++;
        } else if (porcentaje >= 30) {
          stockBajo++;
          alertas.push({
            id: item.id,
            type: 'low_stock',
            categoria: item.categoria?.nombre || 'Sin categoría',
            cliente: item.cliente?.nombre || 'Sin cliente',
            stock: stock,
            stockMinimo: stockMinimo,
            porcentaje: porcentaje.toFixed(0)
          });
        } else {
          stockCritico++;
          alertas.push({
            id: item.id,
            type: 'critical_stock',
            categoria: item.categoria?.nombre || 'Sin categoría',
            cliente: item.cliente?.nombre || 'Sin cliente',
            stock: stock,
            stockMinimo: stockMinimo,
            porcentaje: porcentaje.toFixed(0)
          });
        }
      });

      // Ordenar alertas (críticas primero)
      alertas.sort((a, b) => parseFloat(a.porcentaje) - parseFloat(b.porcentaje));
      setAlertasRecientes(alertas.slice(0, 5));

      // Actualizar KPIs
      setDashboardData({
        totalInsumos: inventarioData.length,
        recepcionesMes: recepcionesMes.length,
        entregasMes: entregasMes.length,
        alertasActivas: stockBajo + stockCritico,
        stockAdecuado,
        stockBajo,
        stockCritico
      });

      // Calcular movimientos mensuales (últimos 6 meses) para gráfica de barras
      const movimientos = calcularMovimientosMensuales(recepcionesData, entregasData);
      setMovimientosMensuales(movimientos);

      // Datos para gráfica de área
      setMovimientosArea(movimientos);

      // Calcular distribución por categorías
      const distribucion = calcularDistribucionCategorias(inventarioData);
      setDistribucionCategorias(distribucion);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular movimientos de los últimos 6 meses
  const calcularMovimientosMensuales = (recepciones, entregas) => {
    const meses = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = fecha.toLocaleString('es-MX', { month: 'short' }).toUpperCase();
      const año = fecha.getFullYear();
      const mesNum = fecha.getMonth();
      
      const recepcionesMes = recepciones.filter(r => {
        const f = new Date(r.fecha_recepcion || r.creado_en);
        return f.getMonth() === mesNum && f.getFullYear() === año;
      }).length;

      const entregasMes = entregas.filter(e => {
        const f = new Date(e.fecha_entrega || e.creado_en);
        return f.getMonth() === mesNum && f.getFullYear() === año;
      }).length;

      meses.push({
        mes: mes,
        recepciones: recepcionesMes,
        entregas: entregasMes
      });
    }
    
    return meses;
  };

  // Calcular distribución por categorías
  const calcularDistribucionCategorias = (inventario) => {
    const categorias = {};
    
    inventario.forEach(item => {
      const cat = item.categoria?.nombre || 'Sin categoría';
      if (!categorias[cat]) {
        categorias[cat] = 0;
      }
      categorias[cat]++;
    });

    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Calcular porcentaje de stock saludable
  const porcentajeSaludable = dashboardData.totalInsumos > 0 
    ? ((dashboardData.stockAdecuado / dashboardData.totalInsumos) * 100).toFixed(0)
    : 0;

  // Custom tooltip para gráficas
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <TooltipContainer>
          <TooltipLabel>{label}</TooltipLabel>
          {payload.map((entry, index) => (
            <TooltipItem key={index} $color={entry.color}>
              {entry.name}: <strong>{entry.value}</strong>
            </TooltipItem>
          ))}
        </TooltipContainer>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando dashboard...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>Dashboard Principal</Title>
          <Subtitle>
            <IoCalendarOutline size={16} />
            {new Date().toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Subtitle>
        </HeaderContent>
        <RefreshButton onClick={loadDashboardData}>
          <IoRefreshOutline size={18} />
          Actualizar
        </RefreshButton>
      </Header>

      {/* KPIs - 4 tarjetas en fila */}
      <KPIsRow>
        <KPICard>
          <KPIHeader>
            <KPILabel>Total Insumos</KPILabel>
            <KPIIconBadge $color={COLORS.primary}>
              <IoCube size={16} />
            </KPIIconBadge>
          </KPIHeader>
          <KPINumber>{dashboardData.totalInsumos}</KPINumber>
          <KPITrend $positive>
            <IoTrendingUp size={14} />
            Registrados
          </KPITrend>
        </KPICard>

        <KPICard>
          <KPIHeader>
            <KPILabel>Recepciones</KPILabel>
            <KPIIconBadge $color={COLORS.success}>
              <IoArrowDownCircle size={16} />
            </KPIIconBadge>
          </KPIHeader>
          <KPINumber>{dashboardData.recepcionesMes}</KPINumber>
          <KPITrend>Este mes</KPITrend>
        </KPICard>

        <KPICard>
          <KPIHeader>
            <KPILabel>Entregas</KPILabel>
            <KPIIconBadge $color={COLORS.secondary}>
              <IoArrowUpCircle size={16} />
            </KPIIconBadge>
          </KPIHeader>
          <KPINumber>{dashboardData.entregasMes}</KPINumber>
          <KPITrend>Este mes</KPITrend>
        </KPICard>

        <KPICard>
          <KPIHeader>
            <KPILabel>Alertas</KPILabel>
            <KPIIconBadge $color={dashboardData.alertasActivas > 0 ? COLORS.warning : COLORS.success}>
              {dashboardData.alertasActivas > 0 ? <IoAlertCircle size={16} /> : <IoCheckmarkCircle size={16} />}
            </KPIIconBadge>
          </KPIHeader>
          <KPINumber $alert={dashboardData.alertasActivas > 0}>{dashboardData.alertasActivas}</KPINumber>
          <KPITrend $alert={dashboardData.alertasActivas > 0}>
            {dashboardData.alertasActivas > 0 ? 'Requieren atención' : 'Todo en orden'}
          </KPITrend>
        </KPICard>
      </KPIsRow>

      {/* Grid Principal - Gráficas */}
      <MainGrid>
        {/* Gráfica de Barras - Resultados Mensuales (ocupa 2 columnas) */}
        <ChartCard $large>
          <ChartHeader>
            <ChartTitle>
              <IoStatsChartOutline size={20} />
              Movimientos Mensuales
            </ChartTitle>
            <ChartBadge>Últimos 6 meses</ChartBadge>
          </ChartHeader>
          <ChartBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={movimientosMensuales} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar 
                  dataKey="recepciones" 
                  name="Recepciones" 
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="entregas" 
                  name="Entregas" 
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBody>
        </ChartCard>

        {/* Gráfica de Dona - Distribución */}
        <ChartCard>
          <ChartHeader>
            <ChartTitle>Stock por Categoría</ChartTitle>
          </ChartHeader>
          <DonutWrapper>
            <DonutChartContainer>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={distribucionCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distribucionCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenterText>
                <DonutPercentage>{porcentajeSaludable}%</DonutPercentage>
                <DonutLabel>Stock OK</DonutLabel>
              </DonutCenterText>
            </DonutChartContainer>
            <DonutLegend>
              {distribucionCategorias.map((item, index) => (
                <LegendRow key={index}>
                  <LegendDot $color={PIE_COLORS[index % PIE_COLORS.length]} />
                  <LegendName>{item.name}</LegendName>
                </LegendRow>
              ))}
            </DonutLegend>
          </DonutWrapper>
        </ChartCard>

        {/* Gráfica de Área - Tendencia */}
        <ChartCard>
          <ChartHeader>
            <ChartTitle>Tendencia de Movimientos</ChartTitle>
            <LegendInline>
              <LegendItemInline>
                <LegendDot $color={COLORS.primary} />
                Recepciones
              </LegendItemInline>
              <LegendItemInline>
                <LegendDot $color={COLORS.secondary} />
                Entregas
              </LegendItemInline>
            </LegendInline>
          </ChartHeader>
          <ChartBody $small>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={movimientosArea} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecepciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="mes" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="recepciones" 
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRecepciones)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="entregas" 
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEntregas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBody>
        </ChartCard>

        {/* Alertas de Stock */}
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <IoWarningOutline size={18} />
              Alertas de Stock
            </ChartTitle>
            <AlertCount $hasAlerts={alertasRecientes.length > 0}>
              {alertasRecientes.length}
            </AlertCount>
          </ChartHeader>
          <AlertsBody>
            {alertasRecientes.length > 0 ? (
              <AlertsList>
                {alertasRecientes.map((alerta, index) => (
                  <AlertRow key={index} $type={alerta.type}>
                    <AlertIndicator $type={alerta.type} />
                    <AlertInfo>
                      <AlertCategory>{alerta.categoria}</AlertCategory>
                      <AlertClient>{alerta.cliente}</AlertClient>
                    </AlertInfo>
                    <AlertStock>
                      <AlertStockValue $type={alerta.type}>{alerta.stock}</AlertStockValue>
                      <AlertStockMin>/ {alerta.stockMinimo}</AlertStockMin>
                    </AlertStock>
                  </AlertRow>
                ))}
              </AlertsList>
            ) : (
              <EmptyAlerts>
                <IoCheckmarkCircle size={40} />
                <EmptyText>¡Todo en orden!</EmptyText>
                <EmptySubtext>No hay alertas activas</EmptySubtext>
              </EmptyAlerts>
            )}
          </AlertsBody>
        </ChartCard>
      </MainGrid>

      {/* Resumen de Estado del Inventario */}
      <StockSummary>
        <SummaryTitle>Estado General del Inventario</SummaryTitle>
        <SummaryCards>
          <SummaryCard $type="success">
            <SummaryIcon $type="success">
              <IoCheckmarkCircle size={24} />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryValue>{dashboardData.stockAdecuado}</SummaryValue>
              <SummaryLabel>Stock Adecuado</SummaryLabel>
            </SummaryInfo>
            <SummaryBar>
              <SummaryProgress 
                $type="success" 
                $width={dashboardData.totalInsumos > 0 ? (dashboardData.stockAdecuado / dashboardData.totalInsumos) * 100 : 0} 
              />
            </SummaryBar>
          </SummaryCard>

          <SummaryCard $type="warning">
            <SummaryIcon $type="warning">
              <IoWarningOutline size={24} />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryValue>{dashboardData.stockBajo}</SummaryValue>
              <SummaryLabel>Stock Bajo</SummaryLabel>
            </SummaryInfo>
            <SummaryBar>
              <SummaryProgress 
                $type="warning" 
                $width={dashboardData.totalInsumos > 0 ? (dashboardData.stockBajo / dashboardData.totalInsumos) * 100 : 0} 
              />
            </SummaryBar>
          </SummaryCard>

          <SummaryCard $type="danger">
            <SummaryIcon $type="danger">
              <IoAlertCircle size={24} />
            </SummaryIcon>
            <SummaryInfo>
              <SummaryValue>{dashboardData.stockCritico}</SummaryValue>
              <SummaryLabel>Stock Crítico</SummaryLabel>
            </SummaryInfo>
            <SummaryBar>
              <SummaryProgress 
                $type="danger" 
                $width={dashboardData.totalInsumos > 0 ? (dashboardData.stockCritico / dashboardData.totalInsumos) * 100 : 0} 
              />
            </SummaryBar>
          </SummaryCard>
        </SummaryCards>
      </StockSummary>
    </Container>
  );
}

// ==================== STYLED COMPONENTS ====================

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.bg};
  padding: 1.5rem 2rem;
  overflow-y: auto;
  
  /* Personalizar scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.bg2};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.barrascroll};
    border-radius: 4px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${props => props.theme.bg3};
  border-top-color: ${COLORS.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme.texttertiary};
  font-size: 0.95rem;
`;

// Header
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 0.875rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: capitalize;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: ${props => props.theme.bgtgderecha};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.bg2};
    border-color: ${COLORS.primary};
  }
`;

// KPIs Row
const KPIsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const KPICard = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const KPIHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const KPILabel = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.texttertiary};
  font-weight: 500;
`;

const KPIIconBadge = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => `${props.$color}15`};
  color: ${props => props.$color};
`;

const KPINumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.$alert ? COLORS.warning : props.theme.textprimary};
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const KPITrend = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$alert ? COLORS.warning : props.$positive ? COLORS.success : props.theme.texttertiary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// Main Grid
const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto;
  gap: 1.25rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  
  ${props => props.$large && `
    grid-row: span 1;
  `}
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const ChartTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartBadge = styled.span`
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  background: ${COLORS.primary}15;
  color: ${COLORS.primary};
  border-radius: 12px;
  font-weight: 500;
`;

const ChartBody = styled.div`
  padding: ${props => props.$small ? '1rem' : '1rem 0.5rem'};
`;

// Donut Chart
const DonutWrapper = styled.div`
  padding: 1rem;
`;

const DonutChartContainer = styled.div`
  position: relative;
  margin-bottom: 0.5rem;
`;

const DonutCenterText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const DonutPercentage = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
`;

const DonutLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.texttertiary};
`;

const DonutLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.5rem;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LegendDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${props => props.$color};
  flex-shrink: 0;
`;

const LegendName = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LegendInline = styled.div`
  display: flex;
  gap: 1rem;
`;

const LegendItemInline = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: ${props => props.theme.texttertiary};
`;

// Alerts
const AlertsBody = styled.div`
  padding: 1rem;
  max-height: 220px;
  overflow-y: auto;
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const AlertRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: ${props => props.$type === 'critical_stock' ? '#fef2f2' : '#fffbeb'};
  border-radius: 8px;
`;

const AlertIndicator = styled.div`
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: ${props => props.$type === 'critical_stock' ? COLORS.danger : COLORS.warning};
`;

const AlertInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AlertCategory = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlertClient = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.texttertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlertStock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
`;

const AlertStockValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.$type === 'critical_stock' ? COLORS.danger : COLORS.warning};
`;

const AlertStockMin = styled.span`
  font-size: 0.7rem;
  color: ${props => props.theme.texttertiary};
`;

const AlertCount = styled.span`
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.$hasAlerts ? '#fef3c7' : '#d1fae5'};
  color: ${props => props.$hasAlerts ? '#92400e' : '#065f46'};
`;

const EmptyAlerts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: ${COLORS.success};
`;

const EmptyText = styled.div`
  font-weight: 600;
  margin-top: 0.5rem;
  color: ${props => props.theme.textprimary};
`;

const EmptySubtext = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.texttertiary};
`;

// Stock Summary
const StockSummary = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const SummaryTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 1rem 0;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.bg2};
  border-radius: 10px;
`;

const SummaryIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch(props.$type) {
      case 'success': return '#d1fae5';
      case 'warning': return '#fef3c7';
      case 'danger': return '#fee2e2';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'danger': return COLORS.danger;
      default: return '#6b7280';
    }
  }};
`;

const SummaryInfo = styled.div`
  flex: 1;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
  line-height: 1;
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  margin-top: 0.25rem;
`;

const SummaryBar = styled.div`
  width: 60px;
  height: 6px;
  background: ${props => props.theme.bg3};
  border-radius: 3px;
  overflow: hidden;
`;

const SummaryProgress = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$width, 100)}%;
  border-radius: 3px;
  background: ${props => {
    switch(props.$type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'danger': return COLORS.danger;
      default: return '#6b7280';
    }
  }};
  transition: width 0.5s ease;
`;

// Tooltip
const TooltipContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const TooltipLabel = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: #374151;
`;

const TooltipItem = styled.div`
  font-size: 0.8rem;
  color: ${props => props.$color || '#6b7280'};
  
  strong {
    color: #111827;
  }
`;

export default Home;