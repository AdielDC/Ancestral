import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { IoClose, IoWarningOutline, IoSearchOutline, IoFilterOutline, IoAddOutline, IoRemoveOutline } from "react-icons/io5";
import { ThemeContext } from "../App";
import { useInventario } from "../hooks/useInventario";

export function Inventary() {
  const { theme } = useContext(ThemeContext);

  // Hook personalizado para manejo de inventario
  const {
    inventory,
    filteredInventory,
    loading,
    error,
    clientes,
    marcas,
    categorias,
    variedades,
    presentaciones,
    proveedores,
    reloadInventory,
    registrarMovimiento,
    getAlertas,
    getStockBajo,
    applyFilters
  } = useInventario();

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState([]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [movementReference, setMovementReference] = useState('');

  const [filters, setFilters] = useState({
    category: "all",
    client: "all",
    variety: "all",
    presentation: "all",
    type: "all"
  });

  // Mostrar notificaciones toast
  const showToast = (message, type, items = []) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, items }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 8000);
  };

  // Cargar alertas al montar el componente
  useEffect(() => {
    const loadAlertas = async () => {
      try {
        const alertas = await getStockBajo();

        if (alertas && alertas.length > 0) {
          const criticalItems = alertas.filter(item =>
            item.stock <= (item.stock_minimo * 0.3)
          );

          const lowStockItems = alertas.filter(item =>
            item.stock > (item.stock_minimo * 0.3) &&
            item.stock < item.stock_minimo
          );

          if (criticalItems.length > 0) {
            showToast(
              `${criticalItems.length} insumo${criticalItems.length > 1 ? 's' : ''} en stock crítico`,
              'critical',
              criticalItems.slice(0, 3)
            );
          }

          if (lowStockItems.length > 0) {
            setTimeout(() => {
              showToast(
                `${lowStockItems.length} insumo${lowStockItems.length > 1 ? 's' : ''} con stock bajo`,
                'warning',
                lowStockItems.slice(0, 2)
              );
            }, 500);
          }
        }
      } catch (err) {
        console.error('Error cargando alertas:', err);
      }
    };

    if (!loading && inventory.length > 0) {
      loadAlertas();
    }
  }, [loading, inventory]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters(filters, searchTerm);
  }, [filters, searchTerm, inventory]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: "all",
      client: "all",
      variety: "all",
      presentation: "all",
      type: "all"
    });
    setSearchTerm("");
  };

  const openMovementModal = (item, type) => {
    setCurrentItem(item);
    setMovementType(type);
    setMovementQuantity('');
    setMovementNote('');
    setMovementReference('');
    setShowMovementModal(true);
  };

  const handleMovement = async () => {
    const quantity = parseInt(movementQuantity);

    if (!quantity || quantity <= 0) {
      showToast('Por favor ingrese una cantidad válida', 'error');
      return;
    }

    if (movementType === 'salida' && quantity > currentItem.stock) {
      showToast('No hay suficiente stock para esta salida', 'error');
      return;
    }

    try {
      const movementData = {
        inventario_id: currentItem.id,
        tipo_movimiento: movementType,
        cantidad: quantity,
        razon: movementNote || `${movementType === 'entrada' ? 'Entrada' : 'Salida'} manual`,
        referencia: movementReference || null,
        usuario_id: 1 // TODO: Obtener del contexto de usuario autenticado
      };

      await registrarMovimiento(movementData);

      showToast(
        `${movementType === 'entrada' ? 'Entrada' : 'Salida'} registrada: ${quantity} ${currentItem.unidad}`,
        'success'
      );

      setShowMovementModal(false);
      setCurrentItem(null);
      setMovementQuantity('');
      setMovementNote('');
      setMovementReference('');
    } catch (err) {
      showToast(
        'Error al registrar el movimiento. Por favor intente nuevamente.',
        'error'
      );
      console.error('Error en movimiento:', err);
    }
  };

  // Función auxiliar para obtener el estado del stock
  const getStockStatus = (item) => {
    if (!item.stock_minimo) return 'normal';
    if (item.stock <= item.stock_minimo * 0.3) return 'critical';
    if (item.stock < item.stock_minimo) return 'low';
    return 'normal';
  };

  // Función para formatear la fecha corrigiendo el offset de zona horaria
  const formatLocalDate = (dateString) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando inventario...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <IoWarningOutline size={48} />
          <ErrorText>{error}</ErrorText>
          <RetryButton onClick={() => reloadInventory()}>
            Reintentar
          </RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} $type={toast.type}>
            <ToastIcon $type={toast.type}>
              <IoWarningOutline size={24} />
            </ToastIcon>
            <ToastContent>
              <ToastTitle>{toast.message}</ToastTitle>
              {toast.items.length > 0 && (
                <ToastList>
                  {toast.items.map(item => (
                    <ToastItem key={item.id}>
                      {item.CATEGORIA_INSUMO?.nombre || 'Sin categoría'} - {item.codigo_lote} ({item.stock} {item.unidad})
                    </ToastItem>
                  ))}
                </ToastList>
              )}
            </ToastContent>
            <ToastClose onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <IoClose />
            </ToastClose>
          </Toast>
        ))}
      </ToastContainer>

      {/* Header */}
      <Header>
        <HeaderLeft>
          <Title>Inventario de Insumos</Title>
          <Subtitle>{filteredInventory.length} {filteredInventory.length === 1 ? 'artículo' : 'artículos'}</Subtitle>
        </HeaderLeft>
      </Header>

      {/* Search and Filters */}
      <FiltersContainer>
        <SearchContainer>
          <SearchIcon>
            <IoSearchOutline />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Buscar por categoría, cliente, variedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <FilterRow>
          <FilterGroup>
            <FilterIcon><IoFilterOutline /></FilterIcon>

            <Select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </Select>

            <Select value={filters.client} onChange={(e) => handleFilterChange('client', e.target.value)}>
              <option value="all">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.nombre}>{cliente.nombre}</option>
              ))}
            </Select>

            <Select value={filters.variety} onChange={(e) => handleFilterChange('variety', e.target.value)}>
              <option value="all">Todas las variedades</option>
              {variedades.map(variedad => (
                <option key={variedad.id} value={variedad.nombre}>{variedad.nombre}</option>
              ))}
            </Select>

            <Select value={filters.presentation} onChange={(e) => handleFilterChange('presentation', e.target.value)}>
              <option value="all">Todas las presentaciones</option>
              {presentaciones.map(pres => (
                <option key={pres.id} value={pres.volumen}>{pres.volumen}</option>
              ))}
            </Select>

            <Select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
              <option value="all">Todos los tipos</option>
              <option value="Nacional">Nacional</option>
              <option value="Exportación">Exportación</option>
            </Select>
          </FilterGroup>

          <ResetButton onClick={resetFilters}>Limpiar filtros</ResetButton>
        </FilterRow>
      </FiltersContainer>

      {/* Table */}
      <TableContainer>
        <StyledTable>
          <thead>
            <TableHeader>
              <th>Insumo</th>
              <th>Cliente</th>
              <th>Variedad</th>
              <th>Presentación</th>
              <th>Destino</th>
              <th>Stock</th>
              <th>Stock Mín.</th>
              <th>Última Act.</th>
              <th>Acciones</th>
            </TableHeader>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <NoResults colSpan="9">
                  No se encontraron resultados con los filtros aplicados
                </NoResults>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);

                return (
                  <TableRow
                    key={item.id}
                    $selected={selectedItem === item.id}
                    onClick={() => setSelectedItem(item.id)}
                  >
                    <td>
                      <CategoryBadge $category={item.CATEGORIA_INSUMO?.nombre}>
                        {item.CATEGORIA_INSUMO?.nombre || 'Sin categoría'}
                      </CategoryBadge>
                    </td>
                    <td>{item.CLIENTE?.nombre || '-'}</td>
                    <td>{item.VARIEDADES_AGAVE?.nombre || '-'}</td>
                    <td>
                      <PresentationBadge>
                        {item.PRESENTACION?.volumen || '-'}
                      </PresentationBadge>
                    </td>
                    <td>
                      <TypeBadge $type={item.tipo}>
                        {item.tipo}
                      </TypeBadge>
                    </td>
                    <td>
                      <StockValue
                        $critical={stockStatus === 'critical'}
                        $low={stockStatus === 'low'}
                      >
                        {item.stock} {item.unidad}
                      </StockValue>
                    </td>
                    <td>{item.stock_minimo} {item.unidad}</td>
                    <td>
                      {formatLocalDate(item.ultima_actualizacion)}
                    </td>
                    <td>
                      <ActionsContainer onClick={(e) => e.stopPropagation()}>
                        <ActionBtn
                          $type="entrada"
                          onClick={() => openMovementModal(item, 'entrada')}
                          title="Registrar entrada"
                        >
                          <IoAddOutline />
                        </ActionBtn>
                        <ActionBtn
                          $type="salida"
                          onClick={() => openMovementModal(item, 'salida')}
                          title="Registrar salida"
                        >
                          <IoRemoveOutline />
                        </ActionBtn>
                      </ActionsContainer>
                    </td>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </StyledTable>
      </TableContainer>

      {/* Movement Modal */}
      {showMovementModal && currentItem && (
        <MovementModal onClick={() => setShowMovementModal(false)}>
          <MovementModalContent onClick={(e) => e.stopPropagation()}>
            <MovementModalHeader>
              <MovementModalTitle>
                {movementType === 'entrada' ? <IoAddOutline /> : <IoRemoveOutline />}
                {movementType === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
              </MovementModalTitle>
              <CloseModalButton onClick={() => setShowMovementModal(false)}>
                <IoClose />
              </CloseModalButton>
            </MovementModalHeader>

            <MovementModalBody>
              <ItemInfo>
                <InfoLabel>Insumo:</InfoLabel>
                <InfoValue>{currentItem.CATEGORIA_INSUMO?.nombre} - {currentItem.codigo_lote}</InfoValue>
              </ItemInfo>

              <ItemInfo>
                <InfoLabel>Stock actual:</InfoLabel>
                <InfoValue>{currentItem.stock} {currentItem.unidad}</InfoValue>
              </ItemInfo>

              <MovementFormGroup>
                <MovementLabel>
                  Cantidad {movementType === 'entrada' ? 'a ingresar' : 'a retirar'} *
                </MovementLabel>
                <MovementInput
                  type="number"
                  min="1"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  placeholder="Ingrese la cantidad"
                  autoFocus
                />
              </MovementFormGroup>

              <MovementFormGroup>
                <MovementLabel>Referencia (opcional)</MovementLabel>
                <MovementInput
                  type="text"
                  value={movementReference}
                  onChange={(e) => setMovementReference(e.target.value)}
                  placeholder="Ej: Pedido #1234, Factura #5678"
                />
              </MovementFormGroup>

              <MovementFormGroup>
                <MovementLabel>Nota (opcional)</MovementLabel>
                <MovementTextarea
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Agregue una nota sobre este movimiento..."
                />
              </MovementFormGroup>
            </MovementModalBody>

            <MovementModalFooter>
              <CancelButton onClick={() => setShowMovementModal(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton
                $type={movementType}
                onClick={handleMovement}
              >
                Confirmar {movementType === 'entrada' ? 'Entrada' : 'Salida'}
              </ConfirmButton>
            </MovementModalFooter>
          </MovementModalContent>
        </MovementModal>
      )}
    </Container>
  );
}

// ==================== STYLED COMPONENTS ====================

const Container = styled.div`
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background: ${props => props.theme.bg};
  padding: 2rem;
  color: ${props => props.theme.textprimary};
  transition: all 0.3s ease;
  
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
  margin: 0;
  transition: color 0.3s ease;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  margin: 0;
  transition: color 0.3s ease;
`;

const FiltersContainer = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 10px;
  padding: 1.275rem;
  margin-bottom: 1.275rem;
  box-shadow: 0 0.85px 2.55px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 0.85rem;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.texttertiary};
  font-size: 1.0625rem;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6375rem 0.85rem 0.6375rem 2.55rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 7px;
  font-size: 0.85rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  transition: all 0.2s;

  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }

  &:focus {
    outline: none;
    border-color: #d97706;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.85rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.6375rem;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
`;

const FilterIcon = styled.div`
  color: ${props => props.theme.texttertiary};
  font-size: 1.0625rem;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
`;

const Select = styled.select`
  padding: 0.425rem 0.6375rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 5px;
  font-size: 0.74375rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #d97706;
  }
`;

const ResetButton = styled.button`
  padding: 0.425rem 0.85rem;
  background: ${props => props.theme.bg2};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 5px;
  font-size: 0.74375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme.bg3};
  }
`;

const TableContainer = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 10.2px;
  overflow: hidden;
  box-shadow: 0 0.85px 2.55px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.tr`
  background: ${props => props.theme.bg2};
  
  th {
    padding: 0.85rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.68rem;
    color: ${props => props.theme.textprimary};
    border-bottom: 1.7px solid ${props => props.theme.bg3};
    transition: color 0.3s ease;
  }
`;

const TableRow = styled.tr`
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? 'rgba(217, 119, 6, 0.1)' : 'transparent'};

  &:hover {
    background: ${props => props.$selected ? 'rgba(217, 119, 6, 0.15)' : props.theme.bg2};
  }
  
  td {
    padding: 0.85rem;
    border-bottom: 0.85px solid ${props => props.theme.bg3};
    font-size: 0.68rem;
    color: ${props => props.theme.textprimary};
    transition: all 0.3s ease;
  }
`;

const CategoryBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    const colors = {
      'Botellas': '#dbeafe',
      'Tapones': '#d1fae5',
      'Cintillos': '#fef3c7',
      'Sellos Térmicos': '#ede9fe',
      'Etiquetas': '#fce7f3',
      'Cajas': '#f0f9ff'
    };
    return colors[props.$category] || '#f3f4f6';
  }};
  color: ${props => {
    const colors = {
      'Botellas': '#1e40af',
      'Tapones': '#047857',
      'Cintillos': '#d97706',
      'Sellos Térmicos': '#7c3aed',
      'Etiquetas': '#be185d',
      'Cajas': '#0284c7'
    };
    return colors[props.$category] || '#374151';
  }};
`;

const PresentationBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: ${props => props.theme.bg3};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.theme.textprimary};
  transition: all 0.3s ease;
`;

const TypeBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$type === 'Exportación' ? '#dbeafe' : '#d1fae5'};
  color: ${props => props.$type === 'Exportación' ? '#1e40af' : '#047857'};
`;

const StockValue = styled.div`
  font-weight: ${props => (props.$low || props.$critical) ? 'bold' : 'normal'};
  color: ${props =>
    props.$critical ? '#dc2626' :
      props.$low ? '#d97706' :
        'inherit'};
`;

const NoResults = styled.td`
  padding: 3rem 1rem;
  text-align: center;
  color: ${props => props.theme.texttertiary};
  font-style: italic;
  transition: color 0.3s ease;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const ActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: ${props => props.$type === 'entrada' ? '#10b981' : '#ef4444'};
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    background: ${props => props.$type === 'entrada' ? '#059669' : '#dc2626'};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Toast Notifications
const ToastContainer = styled.div`
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5625rem;
  max-width: 300px;
`;

const Toast = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.theme.bgtgderecha};
  border-radius: 9px;
  border-left: 3px solid ${props =>
    props.$type === 'critical' ? '#dc2626' :
      props.$type === 'warning' ? '#d97706' :
        props.$type === 'success' ? '#10b981' :
          '#3b82f6'
  };
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ToastIcon = styled.div`
  color: ${props =>
    props.$type === 'critical' ? '#dc2626' :
      props.$type === 'warning' ? '#d97706' :
        props.$type === 'success' ? '#10b981' :
          '#3b82f6'
  };
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.1875rem;
  color: ${props => props.theme.textprimary};
`;

const ToastList = styled.ul`
  margin: 0.375rem 0 0 0;
  padding-left: 0.9375rem;
  font-size: 0.65625rem;
  color: ${props => props.theme.texttertiary};
`;

const ToastItem = styled.li`
  margin: 0.1875rem 0;
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.texttertiary};
  font-size: 0.9375rem;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${props => props.theme.textprimary};
  }
`;

// Loading States
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${props => props.theme.bg3};
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme.texttertiary};
  font-size: 1rem;
`;

// Error States
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
  color: ${props => props.theme.texttertiary};
`;

const ErrorText = styled.div`
  font-size: 1.125rem;
  text-align: center;
  max-width: 500px;
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }
`;

// Movement Modal
const MovementModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const MovementModalContent = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transition: background 0.3s ease;
`;

const MovementModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const MovementModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: ${props => props.theme.texttertiary};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
  
  &:hover {
    background: ${props => props.theme.bg3};
    color: ${props => props.theme.textprimary};
  }
`;

const MovementModalBody = styled.div`
  padding: 1.5rem;
`;

const ItemInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: ${props => props.theme.bg2};
  border-radius: 6px;
  margin-bottom: 0.75rem;
  transition: background 0.3s ease;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;

const InfoValue = styled.span`
  color: ${props => props.theme.textprimary};
  transition: color 0.3s ease;
`;

const MovementFormGroup = styled.div`
  margin-top: 1.5rem;
`;

const MovementLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
`;

const MovementInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const MovementTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  transition: all 0.2s;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

const MovementModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.bg3};
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.theme.bg2};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.bg3};
  }
`;

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$type === 'entrada' ? '#10b981' : '#ef4444'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$type === 'entrada' ? '#059669' : '#dc2626'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;