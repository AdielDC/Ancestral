import { useContext } from "react";
import styled from "styled-components";
import { ThemeContext } from "../App";
import { IoWarningOutline, IoCheckmarkCircle, IoStatsChart, IoCube, IoList, IoTrendingUp } from "react-icons/io5";

// Datos del inventario (puedes moverlos a un archivo JSON separado)
const inventoryData = {
  totalItems: 8,
  categories: 6,
  adequateStock: 4,
  lowStock: 3,
  criticalStock: 1,
  recentActivity: [
    {
      id: 1,
      type: "low_stock",
      category: "Botellas",
      client: "Destilados del Valle",
      brand: "Valle Sagrado",
      stock: 180,
      minStock: 250,
      unit: "piezas"
    },
    {
      id: 2,
      type: "critical_stock",
      category: "Botellas",
      client: "Destilados del Valle",
      brand: "Valle Sagrado",
      variety: "Espadín",
      stock: 25,
      minStock: 100,
      unit: "piezas"
    },
    {
      id: 3,
      type: "low_stock",
      category: "Cintillos",
      client: "Sabores Ancestrales",
      brand: "Ancestral",
      stock: 85,
      minStock: 150,
      unit: "piezas"
    }
  ],
  categoryBreakdown: [
    { name: "Botellas", count: 3, percentage: 37.5 },
    { name: "Tapones", count: 1, percentage: 12.5 },
    { name: "Cintillos", count: 1, percentage: 12.5 },
    { name: "Sellos Térmicos", count: 1, percentage: 12.5 },
    { name: "Etiquetas", count: 1, percentage: 12.5 },
    { name: "Cajas", count: 1, percentage: 12.5 }
  ]
};

export function Home() {
  const { theme } = useContext(ThemeContext);

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Dashboard Principal</Title>
          <Subtitle>Gestión integral de botellas, tapones, cintillos, sellos, etiquetas y cajas</Subtitle>
        </HeaderContent>
      </Header>

      {/* KPIs principales */}
      <KPIsContainer>
        <KPICard $type="primary">
          <KPIIcon>
            <IoCube size={32} />
          </KPIIcon>
          <KPIContent>
            <KPINumber>{inventoryData.totalItems}</KPINumber>
            <KPILabel>Total Insumos</KPILabel>
          </KPIContent>
        </KPICard>

        <KPICard $type="info">
          <KPIIcon>
            <IoList size={32} />
          </KPIIcon>
          <KPIContent>
            <KPINumber>{inventoryData.categories}</KPINumber>
            <KPILabel>Categorías</KPILabel>
          </KPIContent>
        </KPICard>

        <KPICard $type="success">
          <KPIIcon>
            <IoCheckmarkCircle size={32} />
          </KPIIcon>
          <KPIContent>
            <KPINumber>{inventoryData.adequateStock}</KPINumber>
            <KPILabel>Stock Adecuado</KPILabel>
          </KPIContent>
        </KPICard>

        <KPICard $type="warning">
          <KPIIcon>
            <IoWarningOutline size={32} />
          </KPIIcon>
          <KPIContent>
            <KPINumber>{inventoryData.lowStock}</KPINumber>
            <KPILabel>Stock Bajo</KPILabel>
          </KPIContent>
        </KPICard>
      </KPIsContainer>

      {/* Contenido del dashboard */}
      <DashboardGrid>
        {/* Alertas de Stock */}
        <DashboardCard>
          <CardHeader>
            <CardTitle>
              <IoWarningOutline size={20} />
              Alertas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryData.recentActivity.length > 0 ? (
              <AlertsList>
                {inventoryData.recentActivity.map(item => (
                  <AlertItem key={item.id} $type={item.type}>
                    <AlertBadge $type={item.type}>
                      {item.type === 'critical_stock' ? '🚨 Crítico' : '⚠️ Bajo'}
                    </AlertBadge>
                    <AlertDetails>
                      <AlertTitle>
                        {item.category} - {item.client}
                      </AlertTitle>
                      <AlertInfo>
                        Stock actual: <strong>{item.stock} {item.unit}</strong> | 
                        Mínimo: {item.minStock} {item.unit}
                      </AlertInfo>
                    </AlertDetails>
                  </AlertItem>
                ))}
              </AlertsList>
            ) : (
              <EmptyMessage>No hay alertas de inventario</EmptyMessage>
            )}
          </CardContent>
        </DashboardCard>

        {/* Distribución por Categorías */}
        <DashboardCard>
          <CardHeader>
            <CardTitle>
              <IoStatsChart size={20} />
              Distribución por Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriesList>
              {inventoryData.categoryBreakdown.map((category, index) => (
                <CategoryItem key={index}>
                  <CategoryInfo>
                    <CategoryName>{category.name}</CategoryName>
                    <CategoryCount>{category.count} insumos</CategoryCount>
                  </CategoryInfo>
                  <ProgressBar>
                    <ProgressFill $percentage={category.percentage} />
                  </ProgressBar>
                  <CategoryPercentage>{category.percentage}%</CategoryPercentage>
                </CategoryItem>
              ))}
            </CategoriesList>
          </CardContent>
        </DashboardCard>

        {/* Resumen Rápido */}
        <DashboardCard $span>
          <CardHeader>
            <CardTitle>
              <IoTrendingUp size={20} />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryGrid>
              <SummaryItem>
                <SummaryLabel>Insumos con Stock Crítico</SummaryLabel>
                <SummaryValue $critical>{inventoryData.criticalStock}</SummaryValue>
                <SummaryDescription>
                  Menos del 30% del stock mínimo
                </SummaryDescription>
              </SummaryItem>

              <SummaryItem>
                <SummaryLabel>Insumos con Stock Bajo</SummaryLabel>
                <SummaryValue $warning>{inventoryData.lowStock}</SummaryValue>
                <SummaryDescription>
                  Por debajo del stock mínimo
                </SummaryDescription>
              </SummaryItem>

              <SummaryItem>
                <SummaryLabel>Tasa de Stock Adecuado</SummaryLabel>
                <SummaryValue $success>
                  {((inventoryData.adequateStock / inventoryData.totalItems) * 100).toFixed(0)}%
                </SummaryValue>
                <SummaryDescription>
                  {inventoryData.adequateStock} de {inventoryData.totalItems} insumos
                </SummaryDescription>
              </SummaryItem>

              <SummaryItem>
                <SummaryLabel>Categorías Activas</SummaryLabel>
                <SummaryValue>{inventoryData.categories}</SummaryValue>
                <SummaryDescription>
                  Total de tipos de insumos
                </SummaryDescription>
              </SummaryItem>
            </SummaryGrid>
          </CardContent>
        </DashboardCard>
      </DashboardGrid>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  height: 100vh;
  overflow-y: auto;
  background: ${props => props.theme.bg};
  padding: 1.5rem;
  transition: background 0.3s ease;
  
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
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.texttertiary};
  }
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.5rem 0;
  transition: color 0.3s ease;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 1.1rem;
  margin: 0;
  transition: color 0.3s ease;
`;

const KPIsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const KPICard = styled.div`
  background: ${props => props.theme.bgtgderecha};
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid ${props => {
    switch(props.$type) {
      case 'primary': return '#3b82f6';
      case 'info': return '#8b5cf6';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  }};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const KPIIcon = styled.div`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.bg2};
  border-radius: 12px;
  color: ${props => props.theme.textprimary};
  transition: all 0.3s ease;
`;

const KPIContent = styled.div`
  flex: 1;
`;

const KPINumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.textprimary};
  line-height: 1;
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
`;

const KPILabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  transition: color 0.3s ease;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
`;

const DashboardCard = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  grid-column: ${props => props.$span ? '1 / -1' : 'auto'};
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.$type === 'critical_stock' ? 
    'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
  border-radius: 8px;
  border-left: 3px solid ${props => props.$type === 'critical_stock' ? 
    '#ef4444' : '#f59e0b'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$type === 'critical_stock' ? 
      'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
  }
`;

const AlertBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.$type === 'critical_stock' ? 
    '#ef4444' : '#f59e0b'};
  color: white;
  white-space: nowrap;
`;

const AlertDetails = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
`;

const AlertInfo = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
  
  strong {
    color: ${props => props.theme.textprimary};
    font-weight: 600;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.texttertiary};
  font-style: italic;
  transition: color 0.3s ease;
`;

const CategoriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CategoryInfo = styled.div`
  min-width: 150px;
`;

const CategoryName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
`;

const CategoryCount = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${props => props.theme.bg2};
  border-radius: 4px;
  overflow: hidden;
  transition: background 0.3s ease;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const CategoryPercentage = styled.div`
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  font-size: 0.875rem;
  transition: color 0.3s ease;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const SummaryItem = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: ${props => props.theme.bg2};
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  margin-bottom: 0.75rem;
  font-weight: 500;
  transition: color 0.3s ease;
`;

const SummaryValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
  color: ${props => {
    if (props.$critical) return '#ef4444';
    if (props.$warning) return '#f59e0b';
    if (props.$success) return '#10b981';
    return props.theme.textprimary;
  }};
`;

const SummaryDescription = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;