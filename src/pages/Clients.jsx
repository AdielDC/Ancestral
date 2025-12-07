// Catalogos.jsx - Administración de Catálogos (Clientes, Variedades, Presentaciones) con Marcas
// Ubicación: src/pages/Catalogos.jsx

import { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { ThemeContext } from "../App";
import {
  IoClose,
  IoAddOutline,
  IoCheckmarkOutline,
  IoPersonOutline,
  IoLeafOutline,
  IoCubeOutline,
  IoTrashOutline,
  IoSaveOutline,
  IoBusinessOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoFlaskOutline,
  IoResizeOutline,
  IoPricetagOutline,
  IoToggle
} from "react-icons/io5";
import { GiAgave, GiSquareBottle } from "react-icons/gi";
import { LiaWineBottleSolid } from "react-icons/lia";

// Importar servicios
import { clienteService } from "../services/clienteService";
import { variedadAgaveService } from "../services/variedadAgaveService";
import { presentacionService } from "../services/presentacionService";
import { marcaService } from "../services/marcaService";

// Tipos de catálogo
const CATALOG_TYPES = {
  CLIENTES: 'clientes',
  VARIEDADES: 'variedades',
  PRESENTACIONES: 'presentaciones'
};

export function Clients() {
  const { theme } = useContext(ThemeContext);

  // Estados principales
  const [activeCatalog, setActiveCatalog] = useState(CATALOG_TYPES.CLIENTES);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos de catálogos
  const [clientes, setClientes] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  
  // Datos de marcas del cliente seleccionado
  const [marcasCliente, setMarcasCliente] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  
  // Modal para marcas
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [marcaFormData, setMarcaFormData] = useState({ nombre: '', descripcion: '' });
  const [editingMarca, setEditingMarca] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({});

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Cargar datos al montar
  useEffect(() => {
    loadAllData();
  }, []);

  // Cargar marcas cuando se selecciona un cliente
  useEffect(() => {
    if (activeCatalog === CATALOG_TYPES.CLIENTES && selectedItem?.id) {
      loadMarcasCliente(selectedItem.id);
    } else {
      setMarcasCliente([]);
    }
  }, [selectedItem, activeCatalog]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [clientesRes, variedadesRes, presentacionesRes] = await Promise.all([
        clienteService.getAll().catch(() => ({ data: [] })),
        variedadAgaveService.getAll().catch(() => ({ data: [] })),
        presentacionService.getAll().catch(() => ({ data: [] }))
      ]);

      setClientes(clientesRes.data || clientesRes || []);
      setVariedades(variedadesRes.data || variedadesRes || []);
      setPresentaciones(presentacionesRes.data || presentacionesRes || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('Error al cargar los catálogos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMarcasCliente = async (clienteId) => {
    try {
      setLoadingMarcas(true);
      const response = await marcaService.getByClienteId(clienteId);
      setMarcasCliente(response.data || response || []);
    } catch (error) {
      console.error('Error cargando marcas:', error);
      setMarcasCliente([]);
    } finally {
      setLoadingMarcas(false);
    }
  };

  // Mostrar toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  // Obtener lista actual según el catálogo activo
  const getCurrentList = () => {
    switch (activeCatalog) {
      case CATALOG_TYPES.CLIENTES:
        return clientes;
      case CATALOG_TYPES.VARIEDADES:
        return variedades;
      case CATALOG_TYPES.PRESENTACIONES:
        return presentaciones;
      default:
        return [];
    }
  };

  // Obtener configuración del catálogo activo
  const getCatalogConfig = () => {
    switch (activeCatalog) {
      case CATALOG_TYPES.CLIENTES:
        return {
          title: 'Clientes',
          icon: <IoPersonOutline size={20} />,
          fields: [
            { name: 'nombre', label: 'Nombre del Cliente', type: 'text', required: true, icon: <IoBusinessOutline /> },
            { name: 'persona_contacto', label: 'Persona de Contacto', type: 'text', icon: <IoPersonOutline /> },
            { name: 'telefono', label: 'Teléfono', type: 'tel', icon: <IoCallOutline /> },
            { name: 'email', label: 'Email', type: 'email', icon: <IoMailOutline /> },
            { name: 'direccion', label: 'Dirección', type: 'textarea', icon: <IoLocationOutline /> }
          ],
          emptyForm: { nombre: '', persona_contacto: '', telefono: '', email: '', direccion: '', activo: true }
        };
      case CATALOG_TYPES.VARIEDADES:
        return {
          title: 'Variedades de Agave',
          icon: <GiAgave size={40} />,
          fields: [
            { name: 'nombre', label: 'Nombre de la Variedad', type: 'text', required: true, icon: <IoFlaskOutline /> },
            { name: 'region', label: 'Región', type: 'text', icon: <IoLocationOutline /> },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', icon: null }
          ],
          emptyForm: { nombre: '', region: '', descripcion: '' }
        };
      case CATALOG_TYPES.PRESENTACIONES:
        return {
          title: 'Presentaciones',
          icon: <GiSquareBottle size={40} />,
          fields: [
            { name: 'volumen', label: 'Volumen (ej: 750 ML)', type: 'text', required: true, icon: <IoResizeOutline /> },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', icon: null }
          ],
          emptyForm: { volumen: '', descripcion: '' }
        };
      default:
        return { title: '', icon: null, fields: [], emptyForm: {} };
    }
  };

  // Cambiar catálogo activo
  const handleCatalogChange = (catalog) => {
    setActiveCatalog(catalog);
    setSelectedItem(null);
    setIsEditing(false);
    setIsCreating(false);
    setFormData({});
    setMarcasCliente([]);
  };

  // Seleccionar un item
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setIsEditing(false);
    setIsCreating(false);
  };

  // Iniciar creación
  const handleCreate = () => {
    const config = getCatalogConfig();
    setSelectedItem(null);
    setFormData(config.emptyForm);
    setIsCreating(true);
    setIsEditing(false);
  };

  // Iniciar edición
  const handleEdit = () => {
    setIsEditing(true);
    setIsCreating(false);
  };

  // Cancelar edición/creación
  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false);
      setFormData({});
    } else {
      setIsEditing(false);
      setFormData({ ...selectedItem });
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    const config = getCatalogConfig();
    
    // Validar campos requeridos
    const requiredFields = config.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]?.trim()) {
        showToast(`El campo "${field.label}" es requerido`, 'error');
        return;
      }
    }

    try {
      setSaving(true);

      if (isCreating) {
        // Crear nuevo
        let response;
        switch (activeCatalog) {
          case CATALOG_TYPES.CLIENTES:
            response = await clienteService.create(formData);
            setClientes(prev => [...prev, response.data || response]);
            break;
          case CATALOG_TYPES.VARIEDADES:
            response = await variedadAgaveService.create(formData);
            setVariedades(prev => [...prev, response.data || response]);
            break;
          case CATALOG_TYPES.PRESENTACIONES:
            response = await presentacionService.create(formData);
            setPresentaciones(prev => [...prev, response.data || response]);
            break;
        }
        showToast(`${config.title.slice(0, -1)} creado exitosamente`, 'success');
        setIsCreating(false);
        setSelectedItem(response.data || response);
        setFormData(response.data || response);
      } else {
        // Actualizar existente
        switch (activeCatalog) {
          case CATALOG_TYPES.CLIENTES:
            await clienteService.update(selectedItem.id, formData);
            setClientes(prev => prev.map(c => c.id === selectedItem.id ? { ...c, ...formData } : c));
            break;
          case CATALOG_TYPES.VARIEDADES:
            await variedadAgaveService.update(selectedItem.id, formData);
            setVariedades(prev => prev.map(v => v.id === selectedItem.id ? { ...v, ...formData } : v));
            break;
          case CATALOG_TYPES.PRESENTACIONES:
            await presentacionService.update(selectedItem.id, formData);
            setPresentaciones(prev => prev.map(p => p.id === selectedItem.id ? { ...p, ...formData } : p));
            break;
        }
        showToast('Cambios guardados exitosamente', 'success');
        setIsEditing(false);
        setSelectedItem({ ...selectedItem, ...formData });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    const config = getCatalogConfig();
    const itemName = selectedItem.nombre || selectedItem.volumen || 'este elemento';
    
    if (!window.confirm(`¿Estás seguro de eliminar "${itemName}"?`)) {
      return;
    }

    try {
      setSaving(true);
      
      switch (activeCatalog) {
        case CATALOG_TYPES.CLIENTES:
          await clienteService.delete(selectedItem.id);
          setClientes(prev => prev.filter(c => c.id !== selectedItem.id));
          break;
        case CATALOG_TYPES.VARIEDADES:
          await variedadAgaveService.delete(selectedItem.id);
          setVariedades(prev => prev.filter(v => v.id !== selectedItem.id));
          break;
        case CATALOG_TYPES.PRESENTACIONES:
          await presentacionService.delete(selectedItem.id);
          setPresentaciones(prev => prev.filter(p => p.id !== selectedItem.id));
          break;
      }
      
      showToast('Elemento eliminado exitosamente', 'success');
      setSelectedItem(null);
      setFormData({});
      setIsEditing(false);
    } catch (error) {
      console.error('Error al eliminar:', error);
      showToast('Error al eliminar el elemento', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle estado activo del cliente
  const handleToggleActivo = async () => {
    if (!selectedItem || activeCatalog !== CATALOG_TYPES.CLIENTES) return;

    const nuevoEstado = !selectedItem.activo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de ${mensaje} al cliente "${selectedItem.nombre}"?`)) {
      return;
    }

    try {
      setSaving(true);
      await clienteService.update(selectedItem.id, { activo: nuevoEstado });
      
      // Actualizar en la lista
      setClientes(prev => prev.map(c => 
        c.id === selectedItem.id ? { ...c, activo: nuevoEstado } : c
      ));
      
      // Actualizar el item seleccionado
      const updatedItem = { ...selectedItem, activo: nuevoEstado };
      setSelectedItem(updatedItem);
      setFormData(updatedItem);
      
      showToast(`Cliente ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
      showToast('Error al cambiar el estado del cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============ FUNCIONES PARA MARCAS ============

  const handleOpenMarcaModal = (marca = null) => {
    if (marca) {
      setEditingMarca(marca);
      setMarcaFormData({ nombre: marca.nombre, descripcion: marca.descripcion || '' });
    } else {
      setEditingMarca(null);
      setMarcaFormData({ nombre: '', descripcion: '' });
    }
    setShowMarcaModal(true);
  };

  const handleCloseMarcaModal = () => {
    setShowMarcaModal(false);
    setEditingMarca(null);
    setMarcaFormData({ nombre: '', descripcion: '' });
  };

  const handleMarcaInputChange = (e) => {
    const { name, value } = e.target;
    setMarcaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMarca = async () => {
    if (!marcaFormData.nombre.trim()) {
      showToast('El nombre de la marca es requerido', 'error');
      return;
    }

    try {
      if (editingMarca) {
        // Actualizar marca existente
        await marcaService.update(editingMarca.id, marcaFormData);
        setMarcasCliente(prev => 
          prev.map(m => m.id === editingMarca.id ? { ...m, ...marcaFormData } : m)
        );
        showToast('Marca actualizada exitosamente', 'success');
      } else {
        // Crear nueva marca
        const response = await marcaService.create({
          ...marcaFormData,
          cliente_id: selectedItem.id
        });
        setMarcasCliente(prev => [...prev, response.data || response]);
        showToast('Marca creada exitosamente', 'success');
      }
      handleCloseMarcaModal();
    } catch (error) {
      console.error('Error al guardar marca:', error);
      showToast('Error al guardar la marca', 'error');
    }
  };

  const handleDeleteMarca = async (marca) => {
    if (!window.confirm(`¿Estás seguro de eliminar la marca "${marca.nombre}"?`)) {
      return;
    }

    try {
      await marcaService.delete(marca.id);
      setMarcasCliente(prev => prev.filter(m => m.id !== marca.id));
      showToast('Marca eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      showToast('Error al eliminar la marca', 'error');
    }
  };

  // Obtener nombre para mostrar en la lista
  const getItemDisplayName = (item) => {
    if (activeCatalog === CATALOG_TYPES.PRESENTACIONES) {
      return item.volumen;
    }
    return item.nombre;
  };

  // Obtener subtítulo para mostrar en la lista
  const getItemSubtitle = (item) => {
    switch (activeCatalog) {
      case CATALOG_TYPES.CLIENTES:
        return item.persona_contacto || item.email || '';
      case CATALOG_TYPES.VARIEDADES:
        return item.region || '';
      case CATALOG_TYPES.PRESENTACIONES:
        return item.descripcion || '';
      default:
        return '';
    }
  };

  const config = getCatalogConfig();
  const currentList = getCurrentList();

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando catálogos...</LoadingText>
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
            <ToastIcon $type={toast.type}>
              {toast.type === 'success' ? <IoCheckmarkOutline size={20} /> : <IoClose size={20} />}
            </ToastIcon>
            <ToastContent>{toast.message}</ToastContent>
            <ToastClose onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <IoClose />
            </ToastClose>
          </Toast>
        ))}
      </ToastContainer>

      {/* Header */}
      <Header>
        <Title>Administración de Catálogos</Title>
        <Subtitle>Gestiona clientes, variedades de agave y presentaciones</Subtitle>
      </Header>

      {/* Main Content */}
      <MainContent>
        {/* Panel Izquierdo */}
        <LeftPanel>
          {/* Tabs de Catálogos */}
          <CatalogTabs>
            <CatalogTab 
              $active={activeCatalog === CATALOG_TYPES.CLIENTES}
              onClick={() => handleCatalogChange(CATALOG_TYPES.CLIENTES)}
            >
              <IoPersonOutline size={18} />
              Clientes
              <TabBadge>{clientes.length}</TabBadge>
            </CatalogTab>
            <CatalogTab 
              $active={activeCatalog === CATALOG_TYPES.VARIEDADES}
              onClick={() => handleCatalogChange(CATALOG_TYPES.VARIEDADES)}
            >
              <IoLeafOutline size={18} />
              Variedades
              <TabBadge>{variedades.length}</TabBadge>
            </CatalogTab>
            <CatalogTab 
              $active={activeCatalog === CATALOG_TYPES.PRESENTACIONES}
              onClick={() => handleCatalogChange(CATALOG_TYPES.PRESENTACIONES)}
            >
              <LiaWineBottleSolid size={18} />
              Presentaciones
              <TabBadge>{presentaciones.length}</TabBadge>
            </CatalogTab>
          </CatalogTabs>

          {/* Lista de elementos */}
          <ListSection>
            <ListHeader>
              <ListTitle>
                {config.icon}
                {config.title} ({currentList.length})
              </ListTitle>
              <AddButton onClick={handleCreate}>
                <IoAddOutline size={18} />
              </AddButton>
            </ListHeader>

            <ItemsList>
              {currentList.length === 0 ? (
                <EmptyList>
                  No hay {config.title.toLowerCase()} registrados
                </EmptyList>
              ) : (
                currentList.map(item => (
                  <ListItem 
                    key={item.id}
                    $active={selectedItem?.id === item.id && !isCreating}
                    onClick={() => handleSelectItem(item)}
                  >
                    <ItemIcon $catalog={activeCatalog}>
                      {activeCatalog === CATALOG_TYPES.CLIENTES && <IoPersonOutline />}
                      {activeCatalog === CATALOG_TYPES.VARIEDADES && <IoLeafOutline />}
                      {activeCatalog === CATALOG_TYPES.PRESENTACIONES && <GiSquareBottle />}
                    </ItemIcon>
                    <ItemInfo>
                      <ItemName>{getItemDisplayName(item)}</ItemName>
                      {getItemSubtitle(item) && (
                        <ItemSubtitle>{getItemSubtitle(item)}</ItemSubtitle>
                      )}
                    </ItemInfo>
                    {item.activo !== undefined && (
                      <StatusDot $active={item.activo} title={item.activo ? 'Activo' : 'Inactivo'} />
                    )}
                  </ListItem>
                ))
              )}
            </ItemsList>
          </ListSection>
        </LeftPanel>

        {/* Panel Derecho */}
        <RightPanel>
          {!selectedItem && !isCreating ? (
            <EmptyState>
              <EmptyStateIcon>
                {config.icon}
              </EmptyStateIcon>
              <EmptyStateTitle>Selecciona un elemento</EmptyStateTitle>
              <EmptyStateText>
                Elige un elemento de la lista para ver sus detalles o crea uno nuevo
              </EmptyStateText>
              <CreateButton onClick={handleCreate}>
                <IoAddOutline size={20} />
                Crear {config.title.slice(0, -1)}
              </CreateButton>
            </EmptyState>
          ) : (
            <>
              {/* Header del detalle */}
              <DetailHeader>
                <DetailTitle>
                  {isCreating ? (
                    <>Nuevo {config.title.slice(0, -1)}</>
                  ) : (
                    <>
                      <span>Detalle:</span> {getItemDisplayName(selectedItem)}
                    </>
                  )}
                </DetailTitle>
                
                <DetailActions>
                  {isCreating || isEditing ? (
                    <>
                      <CancelButton onClick={handleCancel} disabled={saving}>
                        Cancelar
                      </CancelButton>
                      <SaveButton onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <SmallSpinner />
                        ) : (
                          <>
                            <IoSaveOutline size={18} />
                            {isCreating ? 'Crear' : 'Guardar'}
                          </>
                        )}
                      </SaveButton>
                    </>
                  ) : (
                    <>
                      {/* Botón de Activar/Desactivar solo para clientes */}
                      {activeCatalog === CATALOG_TYPES.CLIENTES && (
                        <ToggleButton 
                          $active={selectedItem.activo}
                          onClick={handleToggleActivo}
                          disabled={saving}
                        >
                          <IoToggle size={20} />
                          {selectedItem.activo ? 'Desactivar' : 'Activar'}
                        </ToggleButton>
                      )}
                      <EditButton onClick={handleEdit}>
                        Editar
                      </EditButton>
                      <DeleteButton onClick={handleDelete} disabled={saving}>
                        <IoTrashOutline size={18} />
                      </DeleteButton>
                    </>
                  )}
                </DetailActions>
              </DetailHeader>

              {/* Formulario de detalle */}
              <DetailContent>
                <FormContainer>
                  {config.fields.map(field => (
                    <FormGroup key={field.name} $fullWidth={field.type === 'textarea'}>
                      <Label>
                        {field.icon && <LabelIcon>{field.icon}</LabelIcon>}
                        {field.label}
                        {field.required && <Required>*</Required>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing && !isCreating}
                          placeholder={`Ingresa ${field.label.toLowerCase()}`}
                          rows={3}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing && !isCreating}
                          placeholder={`Ingresa ${field.label.toLowerCase()}`}
                        />
                      )}
                    </FormGroup>
                  ))}
                </FormContainer>

                {/* Sección de Marcas - Solo para clientes */}
                {activeCatalog === CATALOG_TYPES.CLIENTES && selectedItem && !isCreating && (
                  <MarcasSection>
                    <MarcasHeader>
                      <MarcasTitle>
                        <IoPricetagOutline size={20} />
                        Marcas de Mezcal
                      </MarcasTitle>
                      <AddMarcaButton onClick={() => handleOpenMarcaModal()}>
                        <IoAddOutline size={16} />
                        Nueva Marca
                      </AddMarcaButton>
                    </MarcasHeader>

                    {loadingMarcas ? (
                      <MarcasLoading>Cargando marcas...</MarcasLoading>
                    ) : marcasCliente.length === 0 ? (
                      <MarcasEmpty>
                        Este cliente aún no tiene marcas registradas
                      </MarcasEmpty>
                    ) : (
                      <MarcasList>
                        {marcasCliente.map(marca => (
                          <MarcaItem key={marca.id}>
                            <MarcaIcon>
                              <IoPricetagOutline />
                            </MarcaIcon>
                            <MarcaInfo>
                              <MarcaNombre>{marca.nombre}</MarcaNombre>
                              {marca.descripcion && (
                                <MarcaDescripcion>{marca.descripcion}</MarcaDescripcion>
                              )}
                            </MarcaInfo>
                            <MarcaActions>
                              <MarcaActionButton onClick={() => handleOpenMarcaModal(marca)}>
                                Editar
                              </MarcaActionButton>
                              <MarcaActionButton $danger onClick={() => handleDeleteMarca(marca)}>
                                Eliminar
                              </MarcaActionButton>
                            </MarcaActions>
                          </MarcaItem>
                        ))}
                      </MarcasList>
                    )}
                  </MarcasSection>
                )}

                {/* Información adicional para clientes */}
                {activeCatalog === CATALOG_TYPES.CLIENTES && selectedItem && !isCreating && (
                  <InfoCard>
                    <InfoCardTitle>Información del Registro</InfoCardTitle>
                    <InfoRow>
                      <InfoLabel>Estado:</InfoLabel>
                      <StatusBadge $active={selectedItem.activo !== false}>
                        {selectedItem.activo !== false ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </InfoRow>
                    {selectedItem.creado_en && (
                      <InfoRow>
                        <InfoLabel>Creado:</InfoLabel>
                        <InfoValue>
                          {new Date(selectedItem.creado_en).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </InfoValue>
                      </InfoRow>
                    )}
                  </InfoCard>
                )}
              </DetailContent>
            </>
          )}
        </RightPanel>
      </MainContent>

      {/* Modal para crear/editar marca */}
      {showMarcaModal && (
        <Modal onClick={handleCloseMarcaModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
              </ModalTitle>
              <CloseButton onClick={handleCloseMarcaModal}>
                <IoClose />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>
                  <LabelIcon><IoPricetagOutline /></LabelIcon>
                  Nombre de la Marca
                  <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Valle Sagrado"
                  value={marcaFormData.nombre}
                  onChange={handleMarcaInputChange}
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Descripción</Label>
                <Textarea
                  name="descripcion"
                  placeholder="Descripción opcional de la marca"
                  value={marcaFormData.descripcion}
                  onChange={handleMarcaInputChange}
                  rows={3}
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={handleCloseMarcaModal}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSaveMarca}>
                {editingMarca ? 'Guardar Cambios' : 'Crear Marca'}
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

// ==================== STYLED COMPONENTS ====================

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.bg};
  padding: 1.5rem 2rem;
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
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
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme.texttertiary};
`;

// Toast
const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.theme.bgtgderecha};
  border-left: 4px solid ${props => props.$type === 'success' ? '#10b981' : '#ef4444'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
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
  color: ${props => props.$type === 'success' ? '#10b981' : '#ef4444'};
`;

const ToastContent = styled.div`
  flex: 1;
  font-size: 0.875rem;
  color: ${props => props.theme.textprimary};
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.texttertiary};
  cursor: pointer;
  padding: 0;
  display: flex;
  font-size: 1.25rem;

  &:hover {
    color: ${props => props.theme.textprimary};
  }
`;

// Header
const Header = styled.header`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 0.9rem;
  margin: 0;
`;

// Main Content
const MainContent = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  min-height: calc(100vh - 140px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

// Left Panel
const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CatalogTabs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  padding: 0.75rem;
`;

const CatalogTab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.textprimary};
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: ${props => props.$active ? '#3b82f6' : props.theme.bg2};
  }
`;

const TabBadge = styled.span`
  margin-left: auto;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ListSection = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const ListTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: scale(1.05);
  }
`;

const ItemsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const EmptyList = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  color: ${props => props.theme.texttertiary};
  font-size: 0.875rem;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: ${props => props.$active ? '#3b82f615' : 'transparent'};
  border: 2px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.25rem;

  &:hover {
    background: ${props => props.$active ? '#3b82f615' : props.theme.bg2};
  }
`;

const ItemIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: ${props => {
    switch (props.$catalog) {
      case CATALOG_TYPES.CLIENTES: return '#f59e0b15';
      case CATALOG_TYPES.VARIEDADES: return '#10b98115';
      case CATALOG_TYPES.PRESENTACIONES: return '#8b5cf615';
      default: return props.theme.bg2;
    }
  }};
  color: ${props => {
    switch (props.$catalog) {
      case CATALOG_TYPES.CLIENTES: return '#f59e0b';
      case CATALOG_TYPES.VARIEDADES: return '#10b981';
      case CATALOG_TYPES.PRESENTACIONES: return '#8b5cf6';
      default: return props.theme.texttertiary;
    }
  }};
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemSubtitle = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#10b981' : '#ef4444'};
`;

// Right Panel
const RightPanel = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme.bg2};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: ${props => props.theme.texttertiary};
  margin-bottom: 1.5rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.5rem 0;
`;

const EmptyStateText = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 0.9rem;
  margin: 0 0 1.5rem 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }
`;

// Detail Header
const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const DetailTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;

  span {
    color: ${props => props.theme.texttertiary};
    font-weight: 400;
  }
`;

const DetailActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: ${props => props.$active ? '#fee2e2' : '#d1fae5'};
  color: ${props => props.$active ? '#dc2626' : '#047857'};
  border: 1px solid ${props => props.$active ? '#fecaca' : '#a7f3d0'};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#fecaca' : '#a7f3d0'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  padding: 0.6rem 1.25rem;
  background: ${props => props.theme.bg2};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.bg3};
  }
`;

const DeleteButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 0.6rem 1.25rem;
  background: ${props => props.theme.bg2};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.bg3};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  justify-content: center;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SmallSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
`;

// Detail Content
const DetailContent = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  grid-column: ${props => props.$fullWidth ? 'span 2' : 'auto'};

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.5rem;
`;

const LabelIcon = styled.span`
  color: ${props => props.theme.texttertiary};
  display: flex;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${props => props.disabled ? props.theme.bg2 : props.theme.bg};
  color: ${props => props.theme.textprimary};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &:disabled {
    cursor: default;
  }

  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  background: ${props => props.disabled ? props.theme.bg2 : props.theme.bg};
  color: ${props => props.theme.textprimary};
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &:disabled {
    cursor: default;
  }

  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

// Sección de Marcas
const MarcasSection = styled.div`
  margin-top: 2rem;
  padding: 1.25rem;
  background: ${props => props.theme.bg2};
  border-radius: 10px;
`;

const MarcasHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MarcasTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddMarcaButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const MarcasLoading = styled.div`
  text-align: center;
  padding: 1.5rem;
  color: ${props => props.theme.texttertiary};
  font-size: 0.875rem;
`;

const MarcasEmpty = styled.div`
  text-align: center;
  padding: 1.5rem;
  color: ${props => props.theme.texttertiary};
  font-size: 0.875rem;
  font-style: italic;
`;

const MarcasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MarcaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: ${props => props.theme.bg};
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.bg3};
  }
`;

const MarcaIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #8b5cf615;
  color: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const MarcaInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MarcaNombre = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
`;

const MarcaDescripcion = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MarcaActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const MarcaActionButton = styled.button`
  padding: 0.4rem 0.75rem;
  background: ${props => props.$danger ? '#fee2e2' : props.theme.bg3};
  color: ${props => props.$danger ? '#ef4444' : props.theme.textprimary};
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$danger ? '#fecaca' : props.theme.bg};
  }
`;

// Info Card
const InfoCard = styled.div`
  margin-top: 2rem;
  padding: 1.25rem;
  background: ${props => props.theme.bg2};
  border-radius: 10px;
`;

const InfoCardTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 1rem 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.texttertiary};
`;

const InfoValue = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.textprimary};
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$active ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.$active ? '#047857' : '#dc2626'};
`;

// Modal
const Modal = styled.div`
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

const ModalContent = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const ModalTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: ${props => props.theme.texttertiary};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.bg3};
    color: ${props => props.theme.textprimary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid ${props => props.theme.bg3};
`;

export default Clients;