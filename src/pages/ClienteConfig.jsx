// ClienteConfig.jsx - Componente para administrar la configuración de clientes
// Ubicación: src/pages/ClienteConfig.jsx

import { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import {
  IoSaveOutline,
  IoRefreshOutline,
  IoClose,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoBusinessOutline,
  IoLeafOutline,
  IoWineOutline,
  IoGlobeOutline
} from "react-icons/io5";
import { ThemeContext } from "../App";
import { clienteService, presentacionService } from "../services/inventarioService";
import { variedadAgaveService } from "../services/inventarioService"; // Ajusta según tu estructura
import { 
  obtenerTodasConfiguraciones, 
  actualizarConfiguracionCliente 
} from "../services/clienteConfigService";

export function ClienteConfig() {
  const { theme } = useContext(ThemeContext);
  
  // Estados
  const [clientes, setClientes] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [configuraciones, setConfiguraciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Toast
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4250);
  };

  // Cargar datos al montar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Cargar clientes, variedades y presentaciones
      const [clientesRes, variedadesRes, presentacionesRes] = await Promise.all([
        clienteService.getAll(),
        variedadAgaveService.getAll().catch(() => ({ data: [] })),
        presentacionService.getAll()
      ]);

      setClientes((clientesRes.data || clientesRes || []).filter(c => c.activo));
      setVariedades(variedadesRes.data || variedadesRes || []);
      setPresentaciones(presentacionesRes.data || presentacionesRes || []);

      // Cargar configuraciones existentes
      try {
        const configRes = await obtenerTodasConfiguraciones();
        if (configRes.success) {
          setConfiguraciones(configRes.data);
        }
      } catch (err) {
        console.warn('No se pudieron cargar las configuraciones existentes');
        setConfiguraciones({});
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Obtener configuración de un cliente
  const getClienteConfig = (clienteNombre) => {
    return configuraciones[clienteNombre] || {
      variedades: [],
      presentaciones: [],
      tipos: []
    };
  };

  // Estado local para edición
  const [editConfig, setEditConfig] = useState({
    variedades: [],
    presentaciones: [],
    tipos: []
  });

  // Seleccionar cliente para editar
  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    const config = getClienteConfig(cliente.nombre);
    setEditConfig({
      variedades: config.variedades || [],
      presentaciones: config.presentaciones || [],
      tipos: config.tipos || []
    });
  };

  // Toggle variedad
  const toggleVariedad = (variedadNombre) => {
    setEditConfig(prev => {
      const exists = prev.variedades.includes(variedadNombre);
      return {
        ...prev,
        variedades: exists
          ? prev.variedades.filter(v => v !== variedadNombre)
          : [...prev.variedades, variedadNombre]
      };
    });
  };

  // Toggle presentación
  const togglePresentacion = (volumen) => {
    setEditConfig(prev => {
      const exists = prev.presentaciones.includes(volumen);
      return {
        ...prev,
        presentaciones: exists
          ? prev.presentaciones.filter(p => p !== volumen)
          : [...prev.presentaciones, volumen]
      };
    });
  };

  // Toggle tipo
  const toggleTipo = (tipo) => {
    setEditConfig(prev => {
      const exists = prev.tipos.includes(tipo);
      return {
        ...prev,
        tipos: exists
          ? prev.tipos.filter(t => t !== tipo)
          : [...prev.tipos, tipo]
      };
    });
  };

  // Guardar configuración
  const handleSaveConfig = async () => {
    if (!selectedCliente) return;

    setSaving(selectedCliente.id);

    try {
      // Convertir nombres a IDs para el backend
      const variedadIds = variedades
        .filter(v => editConfig.variedades.includes(v.nombre))
        .map(v => v.id);

      const presentacionIds = presentaciones
        .filter(p => editConfig.presentaciones.includes(p.volumen))
        .map(p => p.id);

      await actualizarConfiguracionCliente(selectedCliente.id, {
        variedades: variedadIds,
        presentaciones: presentacionIds,
        tipos: editConfig.tipos
      });

      // Actualizar estado local
      setConfiguraciones(prev => ({
        ...prev,
        [selectedCliente.nombre]: {
          id: selectedCliente.id,
          ...editConfig
        }
      }));

      showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showToast('Error al guardar la configuración', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando configuración...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} $type={toast.type}>
            {toast.type === 'success' ? <IoCheckmarkCircle /> : <IoWarningOutline />}
            <span>{toast.message}</span>
            <CloseToast onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <IoClose />
            </CloseToast>
          </Toast>
        ))}
      </ToastContainer>

      <PageHeader>
        <HeaderContent>
          <Title>Configuración de Clientes</Title>
          <Subtitle>
            Define qué variedades, presentaciones y tipos están disponibles para cada cliente
          </Subtitle>
        </HeaderContent>
        <HeaderActions>
          <ActionButton onClick={loadAllData}>
            <IoRefreshOutline size={17} />
            Actualizar
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      <MainContent>
        {/* Lista de Clientes */}
        <ClientesList>
          <SectionHeader>
            <IoBusinessOutline size={17} />
            <span>Clientes ({clientes.length})</span>
          </SectionHeader>
          
          {clientes.map(cliente => {
            const config = getClienteConfig(cliente.nombre);
            const hasConfig = config.variedades.length > 0 || 
                              config.presentaciones.length > 0 || 
                              config.tipos.length > 0;
            
            return (
              <ClienteItem 
                key={cliente.id}
                $selected={selectedCliente?.id === cliente.id}
                onClick={() => handleSelectCliente(cliente)}
              >
                <ClienteInfo>
                  <ClienteName>{cliente.nombre}</ClienteName>
                  <ClienteStatus $hasConfig={hasConfig}>
                    {hasConfig ? (
                      <>
                        <IoCheckmarkCircle />
                        Configurado
                      </>
                    ) : (
                      <>
                        <IoWarningOutline />
                        Sin configurar
                      </>
                    )}
                  </ClienteStatus>
                </ClienteInfo>
                {hasConfig && (
                  <ClientePreview>
                    <PreviewItem>{config.variedades.length} variedades</PreviewItem>
                    <PreviewItem>{config.presentaciones.length} presentaciones</PreviewItem>
                    <PreviewItem>{config.tipos.join(', ') || 'Sin tipos'}</PreviewItem>
                  </ClientePreview>
                )}
              </ClienteItem>
            );
          })}
        </ClientesList>

        {/* Panel de Configuración */}
        <ConfigPanel>
          {!selectedCliente ? (
            <EmptySelection>
              <IoBusinessOutline size={40.8} />
              <p>Selecciona un cliente para configurar sus opciones</p>
            </EmptySelection>
          ) : (
            <>
              <PanelHeader>
                <PanelTitle>
                  Configurando: <strong>{selectedCliente.nombre}</strong>
                </PanelTitle>
                <SaveButton 
                  onClick={handleSaveConfig}
                  disabled={saving === selectedCliente.id}
                >
                  <IoSaveOutline />
                  {saving === selectedCliente.id ? 'Guardando...' : 'Guardar Cambios'}
                </SaveButton>
              </PanelHeader>

              {/* Variedades */}
              <ConfigSection>
                <SectionHeader>
                  <IoLeafOutline size={17} />
                  <span>Variedades de Agave</span>
                  <Counter>{editConfig.variedades.length} seleccionadas</Counter>
                </SectionHeader>
                <OptionsGrid>
                  {variedades.map(variedad => (
                    <OptionChip
                      key={variedad.id}
                      $selected={editConfig.variedades.includes(variedad.nombre)}
                      onClick={() => toggleVariedad(variedad.nombre)}
                    >
                      {editConfig.variedades.includes(variedad.nombre) && (
                        <IoCheckmarkCircle />
                      )}
                      {variedad.nombre}
                    </OptionChip>
                  ))}
                </OptionsGrid>
              </ConfigSection>

              {/* Presentaciones */}
              <ConfigSection>
                <SectionHeader>
                  <IoWineOutline size={17} />
                  <span>Presentaciones</span>
                  <Counter>{editConfig.presentaciones.length} seleccionadas</Counter>
                </SectionHeader>
                <OptionsGrid>
                  {presentaciones.map(presentacion => (
                    <OptionChip
                      key={presentacion.id}
                      $selected={editConfig.presentaciones.includes(presentacion.volumen)}
                      onClick={() => togglePresentacion(presentacion.volumen)}
                    >
                      {editConfig.presentaciones.includes(presentacion.volumen) && (
                        <IoCheckmarkCircle />
                      )}
                      {presentacion.volumen}
                    </OptionChip>
                  ))}
                </OptionsGrid>
              </ConfigSection>

              {/* Tipos */}
              <ConfigSection>
                <SectionHeader>
                  <IoGlobeOutline size={17} />
                  <span>Tipos de Producto</span>
                  <Counter>{editConfig.tipos.length} seleccionados</Counter>
                </SectionHeader>
                <OptionsGrid>
                  {['Nacional', 'Exportación'].map(tipo => (
                    <OptionChip
                      key={tipo}
                      $selected={editConfig.tipos.includes(tipo)}
                      onClick={() => toggleTipo(tipo)}
                      $large
                    >
                      {editConfig.tipos.includes(tipo) && (
                        <IoCheckmarkCircle />
                      )}
                      {tipo}
                    </OptionChip>
                  ))}
                </OptionsGrid>
                {editConfig.tipos.length === 1 && (
                  <WarningNote>
                    ⚠️ Este cliente solo podrá seleccionar productos de tipo "{editConfig.tipos[0]}"
                  </WarningNote>
                )}
              </ConfigSection>

              {/* Resumen */}
              <SummarySection>
                <SummaryTitle>Resumen de Configuración</SummaryTitle>
                <SummaryContent>
                  <SummaryItem>
                    <strong>Variedades:</strong> {editConfig.variedades.join(', ') || 'Ninguna seleccionada'}
                  </SummaryItem>
                  <SummaryItem>
                    <strong>Presentaciones:</strong> {editConfig.presentaciones.join(', ') || 'Ninguna seleccionada'}
                  </SummaryItem>
                  <SummaryItem>
                    <strong>Tipos:</strong> {editConfig.tipos.join(', ') || 'Ninguno seleccionado'}
                  </SummaryItem>
                </SummaryContent>
              </SummarySection>
            </>
          )}
        </ConfigPanel>
      </MainContent>
    </Container>
  );
}

// ==================== STYLED COMPONENTS ====================

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.bg};
  padding: 1.275rem;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.7rem;
  flex-wrap: wrap;
  gap: 0.85rem;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 1.7rem;
  font-weight: bold;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.425rem 0;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 0.85rem;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.85rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.425rem;
  padding: 0.637rem 1.275rem;
  border: 0.85px solid ${props => props.theme.bg3};
  border-radius: 6.8px;
  background: ${props => props.theme.bgtgderecha};
  color: ${props => props.theme.textprimary};
  cursor: pointer;
  font-size: 0.744rem;
  transition: all 0.17s;

  &:hover {
    background: ${props => props.theme.bg2};
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 297.5px 1fr;
  gap: 1.275rem;
  
  @media (max-width: 765px) {
    grid-template-columns: 1fr;
  }
`;

const ClientesList = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 10.2px;
  padding: 0.85rem;
  height: fit-content;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.425rem;
  padding: 0.637rem;
  color: ${props => props.theme.textprimary};
  font-weight: 600;
  border-bottom: 0.85px solid ${props => props.theme.bg3};
  margin-bottom: 0.425rem;
`;

const ClienteItem = styled.div`
  padding: 0.85rem;
  border-radius: 6.8px;
  cursor: pointer;
  border: 1.7px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  background: ${props => props.$selected ? props.theme.bg2 : 'transparent'};
  margin-bottom: 0.425rem;
  transition: all 0.17s;

  &:hover {
    background: ${props => props.theme.bg2};
  }
`;

const ClienteInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.425rem;
`;

const ClienteName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.textprimary};
`;

const ClienteStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.212rem;
  font-size: 0.637rem;
  color: ${props => props.$hasConfig ? '#10b981' : '#d97706'};
`;

const ClientePreview = styled.div`
  display: flex;
  gap: 0.425rem;
  flex-wrap: wrap;
`;

const PreviewItem = styled.span`
  font-size: 0.595rem;
  padding: 0.17rem 0.425rem;
  background: ${props => props.theme.bg3};
  color: ${props => props.theme.texttertiary};
  border-radius: 3.4px;
`;

const ConfigPanel = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 10.2px;
  padding: 1.275rem;
`;

const EmptySelection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 255px;
  color: ${props => props.theme.texttertiary};
  gap: 0.85rem;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.275rem;
  padding-bottom: 0.85rem;
  border-bottom: 0.85px solid ${props => props.theme.bg3};
`;

const PanelTitle = styled.h2`
  font-size: 1.062rem;
  color: ${props => props.theme.textprimary};
  margin: 0;
  
  strong {
    color: #3b82f6;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.425rem;
  padding: 0.637rem 1.275rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6.8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.17s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfigSection = styled.div`
  margin-bottom: 1.275rem;
`;

const Counter = styled.span`
  margin-left: auto;
  font-size: 0.637rem;
  color: ${props => props.theme.texttertiary};
  font-weight: normal;
`;

const OptionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.425rem;
  padding: 0.425rem 0;
`;

const OptionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.297rem;
  padding: ${props => props.$large ? '0.637rem 1.275rem' : '0.425rem 0.85rem'};
  border-radius: 17px;
  border: 1.7px solid ${props => props.$selected ? '#3b82f6' : props.theme.bg3};
  background: ${props => props.$selected ? '#dbeafe' : 'transparent'};
  color: ${props => props.$selected ? '#1e40af' : props.theme.textprimary};
  cursor: pointer;
  font-size: ${props => props.$large ? '0.807rem' : '0.722rem'};
  font-weight: ${props => props.$selected ? '600' : '400'};
  transition: all 0.17s;

  &:hover {
    border-color: #3b82f6;
    background: ${props => props.$selected ? '#dbeafe' : props.theme.bg2};
  }

  svg {
    color: #3b82f6;
  }
`;

const WarningNote = styled.div`
  margin-top: 0.425rem;
  padding: 0.425rem 0.637rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 5.1px;
  font-size: 0.68rem;
`;

const SummarySection = styled.div`
  background: ${props => props.theme.bg2};
  border-radius: 6.8px;
  padding: 0.85rem;
  margin-top: 1.275rem;
`;

const SummaryTitle = styled.h3`
  font-size: 0.765rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.637rem 0;
`;

const SummaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.425rem;
`;

const SummaryItem = styled.div`
  font-size: 0.722rem;
  color: ${props => props.theme.texttertiary};
  
  strong {
    color: ${props => props.theme.textprimary};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 42.5vh;
  gap: 0.85rem;
`;

const LoadingSpinner = styled.div`
  width: 40.8px;
  height: 40.8px;
  border: 3.4px solid ${props => props.theme.bg3};
  border-top-color: #3b82f6;
  border-radius: 42.5%;
  animation: spin 0.68s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme.texttertiary};
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.425rem;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 0.637rem;
  padding: 0.85rem;
  background: ${props => props.theme.bgtgderecha};
  border-radius: 6.8px;
  border-left: 3.4px solid ${props => props.$type === 'success' ? '#10b981' : '#dc2626'};
  box-shadow: 0 3.4px 10.2px rgba(0, 0, 0, 0.15);
  color: ${props => props.theme.textprimary};
  
  svg {
    color: ${props => props.$type === 'success' ? '#10b981' : '#dc2626'};
  }
`;

const CloseToast = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.texttertiary};
  margin-left: auto;
  display: flex;
`;

export default ClienteConfig;