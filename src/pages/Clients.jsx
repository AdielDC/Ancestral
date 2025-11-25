import { useState, useContext } from "react";
import styled from "styled-components";
import { IoClose, IoAddOutline, IoSearchOutline, IoPencilOutline, IoTrashOutline, IoCheckmarkOutline, IoPersonOutline } from "react-icons/io5";
import { ThemeContext } from "../App";
import { useClientes } from "../hooks/useClientes";

export function Clients() {
  const { theme } = useContext(ThemeContext);
  const { clientes, loading, error, createCliente, updateCliente, deleteCliente } = useClientes();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    persona_contacto: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  // Mostrar toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  // Filtrar clientes por búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.persona_contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.includes(searchTerm)
  );

  // Abrir modal para crear
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      nombre: '',
      persona_contacto: '',
      direccion: '',
      telefono: '',
      email: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const openEditModal = (cliente) => {
    setModalMode('edit');
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      persona_contacto: cliente.persona_contacto || '',
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      email: cliente.email || ''
    });
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
    setFormData({
      nombre: '',
      persona_contacto: '',
      direccion: '',
      telefono: '',
      email: ''
    });
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      showToast('El nombre es requerido', 'error');
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      showToast('Email inválido', 'error');
      return false;
    }
    return true;
  };

  // Guardar cliente (crear o actualizar)
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'create') {
        await createCliente(formData);
        showToast('Cliente creado exitosamente', 'success');
      } else {
        await updateCliente(selectedCliente.id, formData);
        showToast('Cliente actualizado exitosamente', 'success');
      }
      closeModal();
    } catch (err) {
      showToast(
        `Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} el cliente`,
        'error'
      );
    }
  };

  // Eliminar cliente
  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al cliente "${nombre}"?`)) {
      return;
    }

    try {
      await deleteCliente(id);
      showToast('Cliente eliminado exitosamente', 'success');
    } catch (err) {
      showToast('Error al eliminar el cliente', 'error');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando clientes...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
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
              {toast.type === 'success' ? <IoCheckmarkOutline size={24} /> : <IoClose size={24} />}
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
        <HeaderLeft>
          <Title>Gestión de Clientes</Title>
          <Subtitle>{filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}</Subtitle>
        </HeaderLeft>
        <CreateButton onClick={openCreateModal}>
          <IoAddOutline size={20} />
          Nuevo Cliente
        </CreateButton>
      </Header>

      {/* Search */}
      <SearchContainer>
        <SearchIcon>
          <IoSearchOutline />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="Buscar por nombre, contacto, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      {/* Table */}
      <TableContainer>
        <Table>
          <thead>
            <TableHeader>
              <th>Cliente</th>
              <th>Persona de Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </TableHeader>
          </thead>
          <tbody>
            {filteredClientes.length === 0 ? (
              <tr>
                <NoResults colSpan="7">
                  No se encontraron clientes
                </NoResults>
              </tr>
            ) : (
              filteredClientes.map(cliente => (
                <TableRow key={cliente.id}>
                  <td>
                    <ClientName>
                      <ClientIcon>
                        <IoPersonOutline />
                      </ClientIcon>
                      {cliente.nombre}
                    </ClientName>
                  </td>
                  <td>{cliente.persona_contacto || '-'}</td>
                  <td>{cliente.telefono || '-'}</td>
                  <td>{cliente.email || '-'}</td>
                  <td>
                    <AddressCell>{cliente.direccion || '-'}</AddressCell>
                  </td>
                  <td>
                    <StatusBadge $active={cliente.activo}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </td>
                  <td>
                    <ActionsContainer>
                      <ActionButton
                        $type="edit"
                        onClick={() => openEditModal(cliente)}
                        title="Editar"
                      >
                        <IoPencilOutline />
                      </ActionButton>
                      <ActionButton
                        $type="delete"
                        onClick={() => handleDelete(cliente.id, cliente.nombre)}
                        title="Eliminar"
                      >
                        <IoTrashOutline />
                      </ActionButton>
                    </ActionsContainer>
                  </td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modal */}
      {showModal && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {modalMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>
                <IoClose />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>Nombre del Cliente *</Label>
                <Input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Destilería Oaxaca Premium"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Persona de Contacto</Label>
                <Input
                  type="text"
                  name="persona_contacto"
                  placeholder="Ej: Juan Pérez"
                  value={formData.persona_contacto}
                  onChange={handleInputChange}
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: 9511234567"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Ej: contacto@cliente.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label>Dirección</Label>
                <Textarea
                  name="direccion"
                  placeholder="Dirección completa del cliente"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  rows={3}
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={closeModal}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave}>
                {modalMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

// ============ STYLED COMPONENTS ============

const Container = styled.div`
  padding: 2rem;
  max-width: 100%;
  min-height: 100vh;
  background: ${props => props.theme.bg};
  transition: background 0.3s ease;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${props => props.theme.bg3};
  border-top: 4px solid #d97706;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.texttertiary};
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: ${props => props.theme.texttertiary};
`;

const ErrorText = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.textprimary};
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.bgtgderecha};
  border-left: 4px solid ${props => props.$type === 'success' ? '#10b981' : '#ef4444'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(400px);
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
  flex-shrink: 0;
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
  align-items: center;
  font-size: 1.25rem;

  &:hover {
    color: ${props => props.theme.textprimary};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.textprimary};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #d97706;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #b45309;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.texttertiary};
  font-size: 1.25rem;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.bgtgderecha};
  color: ${props => props.theme.textprimary};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #d97706;
  }

  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

const TableContainer = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.tr`
  background: ${props => props.theme.bg2};
  
  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    color: ${props => props.theme.texttertiary};
    border-bottom: 2px solid ${props => props.theme.bg3};
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.2s;
  background: ${props => props.theme.bgtgderecha};
  
  td {
    padding: 1rem;
    border-bottom: 1px solid ${props => props.theme.bg3};
    font-size: 0.875rem;
    color: ${props => props.theme.textprimary};
  }
  
  &:hover {
    background: ${props => props.theme.bg2};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const ClientName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
`;

const ClientIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
`;

const AddressCell = styled.div`
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$active ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.$active ? '#047857' : '#dc2626'};
`;

const NoResults = styled.td`
  padding: 3rem 1rem;
  text-align: center;
  color: ${props => props.theme.texttertiary};
  font-style: italic;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.125rem;
  
  background: ${props => props.$type === 'edit' ? '#3b82f6' : '#ef4444'};
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    background: ${props => props.$type === 'edit' ? '#2563eb' : '#dc2626'};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
`;

const CloseButton = styled.button`
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
  
  &:hover {
    background: ${props => props.theme.bg3};
    color: ${props => props.theme.textprimary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #d97706;
  }
  
  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 0.875rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #d97706;
  }
  
  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }
`;

const ModalFooter = styled.div`
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

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #d97706;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #b45309;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;