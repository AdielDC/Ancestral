import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiAlertTriangle, 
  FiPackage, 
  FiRefreshCw, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle
} from 'react-icons/fi';
import { ThemeContext } from '../App';
import { inventarioService } from '../services/inventarioService';

export function Alerts() {
  const { theme } = useContext(ThemeContext);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAlerta, setExpandedAlerta] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, stock_critico, stock_bajo

  const navigate = useNavigate();

  useEffect(() => {
    cargarAlertas();
  }, []);

  // Función para mapear los alias del backend a mayúsculas
  const mapearInventarioItem = (item) => {
    return {
      ...item,
      CATEGORIA_INSUMO: item.categoria || item.CATEGORIA_INSUMO,
      CLIENTE: item.cliente || item.CLIENTE,
      MARCA: item.marca || item.MARCA,
      VARIEDADES_AGAVE: item.variedad || item.VARIEDADES_AGAVE,
      PRESENTACION: item.presentacion || item.PRESENTACION,
      PROVEEDOR: item.proveedor || item.PROVEEDOR
    };
  };

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔔 Iniciando carga de alertas...');

      // Obtener items con stock bajo del inventario
      const response = await inventarioService.getStockBajo();
      
      console.log('📦 Respuesta de getStockBajo:', response);

      // Asegurarnos de que tenemos un array
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        items = response.data;
      }

      console.log(`📊 Items con stock bajo encontrados: ${items.length}`);

      if (items.length > 0) {
        console.log('🔍 Primer item SIN mapear:', items[0]);
        console.log('🔑 Claves del primer item:', Object.keys(items[0]));

        // Mapear items para convertir alias a mayúsculas
        const itemsMapeados = items.map(item => mapearInventarioItem(item));
        
        console.log('✅ Primer item MAPEADO:', itemsMapeados[0]);
        console.log('📋 Categoría mapeada:', itemsMapeados[0].CATEGORIA_INSUMO);
        console.log('👤 Cliente mapeado:', itemsMapeados[0].CLIENTE);

        // Transformar los items en alertas
        const alertasTransformadas = itemsMapeados.map(item => {
          const stockPercentage = item.stock_minimo > 0 
            ? (item.stock / item.stock_minimo) * 100 
            : 100;
          
          const tipoAlerta = item.stock <= (item.stock_minimo * 0.3) 
            ? 'stock_critico' 
            : 'stock_bajo';

          // Obtener nombre de categoría de forma segura
          const categoriaNombre = item.CATEGORIA_INSUMO?.nombre || 'Insumo';
          
          return {
            id: item.id,
            tipo_alerta: tipoAlerta,
            inventario_id: item.id,
            fecha_alerta: item.ultima_actualizacion || new Date().toISOString(),
            vista: false,
            resuelta: false,
            mensaje: `${categoriaNombre} - ${item.codigo_lote}: Stock ${tipoAlerta === 'stock_critico' ? 'crítico' : 'bajo'}`,
            INVENTARIO: {
              id: item.id,
              codigo_lote: item.codigo_lote,
              stock: item.stock,
              stock_minimo: item.stock_minimo,
              unidad: item.unidad,
              tipo: item.tipo,
              ultima_actualizacion: item.ultima_actualizacion,
              CATEGORIA_INSUMO: item.CATEGORIA_INSUMO,
              CLIENTE: item.CLIENTE,
              MARCA: item.MARCA,
              VARIEDADES_AGAVE: item.VARIEDADES_AGAVE,
              PRESENTACION: item.PRESENTACION
            },
            stockPercentage,
            stockDifference: item.stock_minimo - item.stock
          };
        });

        // Ordenar por criticidad y luego por fecha
        alertasTransformadas.sort((a, b) => {
          if (a.tipo_alerta === 'stock_critico' && b.tipo_alerta !== 'stock_critico') return -1;
          if (a.tipo_alerta !== 'stock_critico' && b.tipo_alerta === 'stock_critico') return 1;
          return new Date(b.fecha_alerta) - new Date(a.fecha_alerta);
        });

        console.log(`✨ Alertas transformadas: ${alertasTransformadas.length}`);
        console.log('📋 Primera alerta de ejemplo:', alertasTransformadas[0]);
        
        setAlertas(alertasTransformadas);
      } else {
        console.log('ℹ️ No se encontraron items con stock bajo');
        setAlertas([]);
      }
    } catch (err) {
      console.error('❌ Error completo al cargar alertas:', err);
      console.error('📍 Stack trace:', err.stack);
      setError(`Error al cargar alertas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTipoAlertaColor = (tipo) => {
    if (tipo === "stock_critico") return "#ef4444";
    if (tipo === "stock_bajo") return "#f59e0b";
    return "#3b82f6";
  };

  const getTipoAlertaIcon = (tipo) => {
    if (tipo === "stock_critico") return <FiAlertCircle />;
    if (tipo === "stock_bajo") return <FiAlertTriangle />;
    return <FiInfo />;
  };

  const getTipoAlertaText = (tipo) => {
    if (tipo === "stock_critico") return "Stock Crítico";
    if (tipo === "stock_bajo") return "Stock Bajo";
    return "Alerta";
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const now = new Date();
    const alertaFecha = new Date(fecha);
    const diffMs = now - alertaFecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;

    return alertaFecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStockStatusText = (alerta) => {
    const percentage = alerta.stockPercentage;
    if (percentage <= 30) return "Crítico - Requiere atención inmediata";
    if (percentage <= 50) return "Muy bajo - Planificar reabastecimiento";
    if (percentage <= 80) return "Bajo - Monitorear de cerca";
    return "Requiere atención";
  };

  const filteredAlertas = filterType === 'all' 
    ? alertas 
    : alertas.filter(a => a.tipo_alerta === filterType);

  const estadisticas = {
    total: alertas.length,
    criticas: alertas.filter(a => a.tipo_alerta === 'stock_critico').length,
    bajas: alertas.filter(a => a.tipo_alerta === 'stock_bajo').length
  };

  return (
    <Container>
      {/* Header con estadísticas */}
      <Header>
        <HeaderLeft>
          <Title>Alertas del Sistema</Title>
          <StatsRow>
            <StatBadge $type="total">
              <FiPackage />
              {estadisticas.total} Total
            </StatBadge>
            <StatBadge $type="critical">
              <FiAlertCircle />
              {estadisticas.criticas} Críticas
            </StatBadge>
            <StatBadge $type="warning">
              <FiAlertTriangle />
              {estadisticas.bajas} Bajas
            </StatBadge>
          </StatsRow>
        </HeaderLeft>

        <ReloadButton onClick={cargarAlertas} disabled={loading}>
          <FiRefreshCw size={18} className={loading ? 'spinning' : ''} />
          Recargar
        </ReloadButton>
      </Header>

      {/* Filtros */}
      <FiltersContainer>
        <FilterLabel>
          <FiFilter />
          Filtrar por:
        </FilterLabel>
        <FilterButtons>
          <FilterButton 
            $active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          >
            Todas ({estadisticas.total})
          </FilterButton>
          <FilterButton 
            $active={filterType === 'stock_critico'}
            $type="critical"
            onClick={() => setFilterType('stock_critico')}
          >
            Críticas ({estadisticas.criticas})
          </FilterButton>
          <FilterButton 
            $active={filterType === 'stock_bajo'}
            $type="warning"
            onClick={() => setFilterType('stock_bajo')}
          >
            Bajas ({estadisticas.bajas})
          </FilterButton>
        </FilterButtons>
      </FiltersContainer>

      {/* Lista de alertas */}
      <AlertasList>
        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingMsg>Cargando alertas...</LoadingMsg>
          </LoadingContainer>
        ) : error ? (
          <ErrorMsg>
            <FiAlertTriangle size={32} />
            {error}
          </ErrorMsg>
        ) : filteredAlertas.length === 0 ? (
          <EmptyState>
            <FiCheckCircle size={48} color="#10b981" />
            <p>
              {filterType === 'all' 
                ? 'No hay alertas registradas. ¡Todo en orden!' 
                : `No hay alertas de tipo "${getTipoAlertaText(filterType)}"`}
            </p>
          </EmptyState>
        ) : (
          filteredAlertas.map((alerta) => (
            <AlertaCard
              key={alerta.id}
              $type={alerta.tipo_alerta}
              onClick={() =>
                setExpandedAlerta(
                  expandedAlerta === alerta.id ? null : alerta.id
                )
              }
            >
              {/* Header de la alerta */}
              <AlertaHeader>
                <AlertaHeaderLeft>
                  <AlertaTipo color={getTipoAlertaColor(alerta.tipo_alerta)}>
                    {getTipoAlertaIcon(alerta.tipo_alerta)}
                    {getTipoAlertaText(alerta.tipo_alerta)}
                  </AlertaTipo>
                  <Fecha>{formatFecha(alerta.fecha_alerta)}</Fecha>
                </AlertaHeaderLeft>
                <ExpandIcon $expanded={expandedAlerta === alerta.id}>
                  {expandedAlerta === alerta.id ? <FiChevronUp /> : <FiChevronDown />}
                </ExpandIcon>
              </AlertaHeader>

              {/* Mensaje principal */}
              <Mensaje>{alerta.mensaje}</Mensaje>

              {/* Barra de progreso del stock */}
              <StockProgress>
                <StockProgressBar 
                  $percentage={alerta.stockPercentage}
                  $type={alerta.tipo_alerta}
                />
              </StockProgress>
              <StockInfo>
                <span>Stock actual: <strong>{alerta.INVENTARIO.stock} {alerta.INVENTARIO.unidad}</strong></span>
                <span>Mínimo: <strong>{alerta.INVENTARIO.stock_minimo} {alerta.INVENTARIO.unidad}</strong></span>
              </StockInfo>

              {/* Detalles expandibles */}
              {expandedAlerta === alerta.id && alerta.INVENTARIO && (
                <Detalles>
                  <DetallesHeader>
                    <FiInfo />
                    Información Detallada
                  </DetallesHeader>
                  
                  <DetallesGrid>
                    <DetalleItem>
                      <DetalleLabel>Categoría:</DetalleLabel>
                      <DetalleValue>
                        <CategoryBadge $category={alerta.INVENTARIO.CATEGORIA_INSUMO?.nombre}>
                          {alerta.INVENTARIO.CATEGORIA_INSUMO?.nombre || 'Sin categoría'}
                        </CategoryBadge>
                      </DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Código de Lote:</DetalleLabel>
                      <DetalleValue><CodeBadge>{alerta.INVENTARIO.codigo_lote}</CodeBadge></DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Cliente:</DetalleLabel>
                      <DetalleValue>{alerta.INVENTARIO.CLIENTE?.nombre || '-'}</DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Marca:</DetalleLabel>
                      <DetalleValue>{alerta.INVENTARIO.MARCA?.nombre || '-'}</DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Variedad de Agave:</DetalleLabel>
                      <DetalleValue>{alerta.INVENTARIO.VARIEDADES_AGAVE?.nombre || '-'}</DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Presentación:</DetalleLabel>
                      <DetalleValue>
                        <PresentationBadge>
                          {alerta.INVENTARIO.PRESENTACION?.volumen || '-'}
                        </PresentationBadge>
                      </DetalleValue>
                    </DetalleItem>

                    <DetalleItem>
                      <DetalleLabel>Destino:</DetalleLabel>
                      <DetalleValue>
                        <TypeBadge $type={alerta.INVENTARIO.tipo}>
                          {alerta.INVENTARIO.tipo}
                        </TypeBadge>
                      </DetalleValue>
                    </DetalleItem>
                  </DetallesGrid>

                  {/* Información de estado */}
                  <StatusSection>
                    <StatusTitle>Estado del Stock</StatusTitle>
                    <StatusMessage $type={alerta.tipo_alerta}>
                      <FiAlertTriangle />
                      {getStockStatusText(alerta)}
                    </StatusMessage>
                    <StatusDetails>
                      <StatusDetailItem>
                        <span>Porcentaje del mínimo:</span>
                        <strong style={{color: getTipoAlertaColor(alerta.tipo_alerta)}}>
                          {alerta.stockPercentage.toFixed(1)}%
                        </strong>
                      </StatusDetailItem>
                      <StatusDetailItem>
                        <span>Unidades faltantes:</span>
                        <strong>{alerta.stockDifference} {alerta.INVENTARIO.unidad}</strong>
                      </StatusDetailItem>
                      <StatusDetailItem>
                        <span>Última actualización:</span>
                        <strong>{formatFecha(alerta.INVENTARIO.ultima_actualizacion)}</strong>
                      </StatusDetailItem>
                    </StatusDetails>
                  </StatusSection>

                  {/* Botones de acción */}
                  <ActionsRow>
                    <ActionButton 
                      $primary 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/inventary');
                      }}
                    >
                      <FiPackage />
                      Ver en Inventario
                    </ActionButton>
                    <ActionButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/reception');
                      }}
                    >
                      Registrar Recepción
                    </ActionButton>
                  </ActionsRow>
                </Detalles>
              )}
            </AlertaCard>
          ))
        )}
      </AlertasList>
    </Container>
  );
}

/* ========================= ESTILOS ========================= */

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textprimary};
`;

const StatsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ theme, $type }) => 
    $type === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
    $type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
    theme.bg2
  };
  color: ${({ $type }) => 
    $type === 'critical' ? '#ef4444' :
    $type === 'warning' ? '#f59e0b' :
    '#3b82f6'
  };
  border: 1px solid ${({ $type }) => 
    $type === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
    $type === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
    'rgba(59, 130, 246, 0.2)'
  };
`;

const ReloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #d97706;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #b45309;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.bgtgderecha};
  border-radius: 10px;
  flex-wrap: wrap;
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textprimary};
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 2px solid ${({ theme, $active, $type }) => 
    $active 
      ? ($type === 'critical' ? '#ef4444' : $type === 'warning' ? '#f59e0b' : '#3b82f6')
      : theme.bg3
  };
  background: ${({ theme, $active, $type }) => 
    $active 
      ? ($type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : $type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)')
      : theme.bg
  };
  color: ${({ theme, $active, $type }) => 
    $active 
      ? ($type === 'critical' ? '#ef4444' : $type === 'warning' ? '#f59e0b' : '#3b82f6')
      : theme.textprimary
  };
  cursor: pointer;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const AlertasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const AlertaCard = styled.div`
  background: ${({ theme }) => theme.bgtgderecha};
  border: 2px solid ${({ $type }) => 
    $type === 'stock_critico' ? 'rgba(239, 68, 68, 0.3)' :
    $type === 'stock_bajo' ? 'rgba(245, 158, 11, 0.3)' :
    'rgba(59, 130, 246, 0.2)'
  };
  padding: 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: ${({ $type }) => 
      $type === 'stock_critico' ? '#ef4444' :
      $type === 'stock_bajo' ? '#f59e0b' :
      '#3b82f6'
    };
  }
`;

const AlertaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const AlertaHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const AlertaTipo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: ${(p) => p.color};
`;

const Fecha = styled.span`
  color: ${({ theme }) => theme.texttertiary};
  font-size: 0.875rem;
  font-weight: 500;
`;

const ExpandIcon = styled.div`
  color: ${({ theme }) => theme.texttertiary};
  font-size: 1.25rem;
  transition: transform 0.2s;
  transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0)'};
`;

const Mensaje = styled.p`
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.textprimary};
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
`;

const StockProgress = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.bg3};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const StockProgressBar = styled.div`
  height: 100%;
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  background: ${({ $type }) => 
    $type === 'stock_critico' ? '#ef4444' :
    $type === 'stock_bajo' ? '#f59e0b' :
    '#10b981'
  };
  transition: width 0.3s ease;
`;

const StockInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.texttertiary};
  margin-bottom: 0.5rem;

  strong {
    color: ${({ theme }) => theme.textprimary};
  }
`;

const Detalles = styled.div`
  background: ${({ theme }) => theme.bg2};
  padding: 1.25rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.9rem;
  overflow: visible;
`;

const DetallesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: ${({ theme }) => theme.textprimary};
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${({ theme }) => theme.bg3};
`;

const DetallesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DetalleItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetalleLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.texttertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetalleValue = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textprimary};
  font-weight: 500;
  word-break: break-word;
  white-space: pre-wrap;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    const colors = {
      'BOTELLAS': '#dbeafe',
      'TAPONES': '#d1fae5',
      'CINTILLOS': '#fef3c7',
      'SELLOS TÉRMICOS': '#ede9fe',
      'ETIQUETAS': '#fce7f3',
      'CAJAS': '#f0f9ff'
    };
    return colors[props.$category?.toUpperCase()] || '#f3f4f6';
  }};
  color: ${props => {
    const colors = {
      'BOTELLAS': '#1e40af',
      'TAPONES': '#047857',
      'CINTILLOS': '#d97706',
      'SELLOS TÉRMICOS': '#7c3aed',
      'ETIQUETAS': '#be185d',
      'CAJAS': '#0284c7'
    };
    return colors[props.$category?.toUpperCase()] || '#374151';
  }};
`;

const CodeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: ${({ theme }) => theme.bg3};
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.85rem;
`;

const PresentationBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${props => props.theme.bg3};
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.$type === 'Exportación' ? '#dbeafe' : '#d1fae5'};
  color: ${props => props.$type === 'Exportación' ? '#1e40af' : '#047857'};
`;

const StatusSection = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.bg};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const StatusTitle = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textprimary};
  margin-bottom: 0.75rem;
`;

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ $type }) => 
    $type === 'stock_critico' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(245, 158, 11, 0.1)'
  };
  border-left: 3px solid ${({ $type }) => 
    $type === 'stock_critico' ? '#ef4444' : '#f59e0b'
  };
  border-radius: 4px;
  color: ${({ $type }) => 
    $type === 'stock_critico' ? '#ef4444' : '#f59e0b'
  };
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

const StatusDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatusDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.texttertiary};

  strong {
    color: ${({ theme }) => theme.textprimary};
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $primary, theme }) => 
    $primary ? '#d97706' : theme.bg3
  };
  color: ${({ $primary, theme }) => 
    $primary ? 'white' : theme.textprimary
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: ${({ $primary }) => 
      $primary ? '#b45309' : '#94a3b8'
    };
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.bg3};
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingMsg = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.texttertiary};
  font-size: 1rem;
`;

const ErrorMsg = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  text-align: center;
  color: #ef4444;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: ${({ theme }) => theme.texttertiary};

  p {
    margin-top: 1rem;
    font-size: 1.125rem;
    font-weight: 500;
  }
`;