import { useState, useRef, useContext, useEffect } from "react";
import styled from "styled-components";
import {
  IoAddOutline,
  IoTrashOutline,
  IoPrintOutline,
  IoSaveOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoRefreshOutline,
  IoClose,
  IoWarningOutline
} from "react-icons/io5";
import { ThemeContext } from "../App";
import { entregaService } from "../services/entregaService";
import { clienteService, presentacionService, inventarioService } from "../services/inventarioService";

// Definir insumos según tipo (Exportación o Nacional)
const INSUMOS_POR_TIPO = {
  Exportación: [
    "BOTELLA {PRESENTACION} Y CAJA",
    "TAPONES CÓNICOS NATURALES O NEGROS",
    "CUERITOS NEGROS O NATURALES",
    "SELLOS TÉRMICOS",
    "ETIQUETA FRENTE EXPORTACIÓN",
    "ETIQUETA TRASERA EXPORTACIÓN",
    "STICKER PARA CAJA",
    "CÓDIGO DE BARRAS PARA CAJAS",
    "BOLSAS DE PAPEL"
  ],
  Nacional: [
    "BOTELLA {PRESENTACION} Y CAJA",
    "CORCHO CON TAPA NATURAL O NEGRA",
    "CINTILLO",
    "SELLOS TÉRMICOS",
    "ETIQUETA FRENTE NACIONAL",
    "ETIQUETA TRASERA NACIONAL",
    "STICKER PARA CAJA",
    "CÓDIGO DE BARRAS PARA CAJAS"
  ]
};

export function Delivery() {
  const { theme } = useContext(ThemeContext);
  const [showForm, setShowForm] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef();

  // Estados para datos del backend
  const [clientes, setClientes] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Mostrar notificaciones toast
  const showToast = (message, type, items = []) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, items }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 8000);
  };

  // Cargar entregas
  const loadEntregas = async () => {
    try {
      setLoading(true);
      const response = await entregaService.getAll();
      const entregasData = response.data || response || [];
      setEntregas(entregasData);
      console.log('✅ Entregas cargadas:', entregasData.length);
    } catch (err) {
      console.error('❌ Error cargando entregas:', err);
      setError('Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes y presentaciones al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [clientesRes, presentacionesRes] = await Promise.all([
          clienteService.getAll(),
          presentacionService.getAll()
        ]);

        const clientesData = clientesRes.data || clientesRes || [];
        const presentacionesData = presentacionesRes.data || presentacionesRes || [];

        setClientes(clientesData);
        setPresentaciones(presentacionesData);

        console.log('✅ Clientes cargados:', clientesData);
        console.log('✅ Presentaciones cargadas:', presentacionesData);

        // Cargar entregas
        await loadEntregas();
      } catch (err) {
        console.error('❌ Error cargando datos:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Construir lista de clientes
  const clientsList = clientes.map(c => ({
    id: c.id,
    name: c.nombre,
    contact: c.persona_contacto
  }));

  // Construir lista de presentaciones
  const presentacionesList = presentaciones.map(p => p.volumen).sort();

  // Estado del formulario
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    responsibleRegistry: "",
    client: "",
    shippingOrder: "",
    batch: "",
    variety: "ENSAMBLE",
    presentation: "",
    type: "Exportación",
    format: "",
    supplies: [],
    additionalNotes: "",
    deliveredBy: "",
    receivedBy: ""
  });

  // Generar insumos automáticamente según tipo y presentación
  const generateSupplies = (type, presentation) => {
    if (!type || !presentation) return [];

    const insumosBase = INSUMOS_POR_TIPO[type] || [];

    return insumosBase.map(insumo => ({
      name: insumo.replace('{PRESENTACION}', presentation),
      quantity: "",
      waste: ""
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-generar formato y supplies cuando cambian presentation o type
      if (field === 'presentation' || field === 'type') {
        const presentation = field === 'presentation' ? value : prev.presentation;
        const type = field === 'type' ? value : prev.type;
        const variety = prev.variety;

        if (presentation && type) {
          newData.format = `${prev.client} - ${variety} ${presentation} ${type}`;
          newData.supplies = generateSupplies(type, presentation);
        }
      }

      // Si cambia el cliente, resetear algunos campos
      if (field === 'client') {
        newData.presentation = '';
        newData.format = '';
        newData.supplies = [];
      }

      return newData;
    });
  };

  const handleSupplyChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      supplies: prev.supplies.map((supply, i) =>
        i === index ? { ...supply, [field]: value } : supply
      )
    }));
  };

  // ==================== FUNCIÓN PARA MAPEO DE CATEGORÍAS (IGUAL QUE RECEPTION) ====================
  const getCategoriaForInsumo = (nombreInsumo, presentacion = '') => {
    const nombreUpper = nombreInsumo.toUpperCase().trim();

    console.log('🔍 Buscando categoría exacta para:', nombreInsumo, '| Presentación:', presentacion);

    // ========== BOTELLAS CON PRESENTACIÓN ==========
    if (nombreUpper.includes('BOTELLA') && nombreUpper.includes('CAJA')) {
      let presentacionEnNombre = presentacion;

      if (!presentacionEnNombre) {
        const match = nombreUpper.match(/(\d+\s*(?:ML|L))/i);
        if (match) {
          presentacionEnNombre = match[1].trim();
        }
      }

      if (presentacionEnNombre) {
        const categoriaNombre = `BOTELLA ${presentacionEnNombre.toUpperCase()} Y CAJA`;
        console.log('✅ Categoría botella:', categoriaNombre);
        return categoriaNombre;
      }

      console.warn('⚠️ Botella sin presentación identificable');
      return null;
    }

    // ========== TAPONES CÓNICOS ==========
    if ((nombreUpper.includes('TAPÓN') && nombreUpper.includes('CÓNICO')) ||
      (nombreUpper.includes('TAPON') && nombreUpper.includes('CONICO'))) {
      console.log('✅ Categoría: TAPONES CONICOS NATURALES O NEGROS');
      return 'TAPONES CONICOS NATURALES O NEGROS';
    }

    // ========== CORCHO CON TAPA ==========
    if (nombreUpper.includes('CORCHO') && nombreUpper.includes('TAPA')) {
      console.log('✅ Categoría: CORCHO CON TAPA NATURAL O NEGRA');
      return 'CORCHO CON TAPA NATURAL O NEGRA';
    }

    // ========== CUERITOS ==========
    if (nombreUpper.includes('CUERITO') || nombreUpper.includes('CUERITOS')) {
      console.log('✅ Categoría: CUERITOS NEGROS O NATURALES');
      return 'CUERITOS NEGROS O NATURALES';
    }

    // ========== CINTILLO ==========
    if (nombreUpper.includes('CINTILLO')) {
      console.log('✅ Categoría: CINTILLO');
      return 'CINTILLO';
    }

    // ========== SELLOS TÉRMICOS ==========
    if (nombreUpper.includes('SELLO') && (nombreUpper.includes('TÉRMI') || nombreUpper.includes('TERMI'))) {
      console.log('✅ Categoría: SELLOS TERMICOS');
      return 'SELLOS TERMICOS';
    }

    // ========== ETIQUETAS FRENTE ==========
    if (nombreUpper.includes('ETIQUETA') && nombreUpper.includes('FRENTE')) {
      const esExportacion = nombreUpper.includes('EXPORTACIÓN') || nombreUpper.includes('EXPORTACION');
      const tipo = esExportacion ? 'EXPORTACIÓN' : 'NACIONAL';

      let presentacionEnNombre = presentacion;
      if (!presentacionEnNombre) {
        const match = nombreUpper.match(/(\d+\s*(?:ML|L))/i);
        if (match) {
          presentacionEnNombre = match[1].trim();
        }
      }

      if (presentacionEnNombre) {
        const categoriaNombre = `ETIQUETA FRENTE ${tipo} ${presentacionEnNombre.toUpperCase()}`;
        console.log('✅ Categoría etiqueta frente:', categoriaNombre);
        return categoriaNombre;
      }

      console.warn('⚠️ Etiqueta frente sin presentación identificable');
      return null;
    }

    // ========== ETIQUETAS TRASERA ==========
    if (nombreUpper.includes('ETIQUETA') && nombreUpper.includes('TRASERA')) {
      const esExportacion = nombreUpper.includes('EXPORTACIÓN') || nombreUpper.includes('EXPORTACION');
      const tipo = esExportacion ? 'EXPORTACIÓN' : 'NACIONAL';

      let presentacionEnNombre = presentacion;
      if (!presentacionEnNombre) {
        const match = nombreUpper.match(/(\d+\s*(?:ML|L))/i);
        if (match) {
          presentacionEnNombre = match[1].trim();
        }
      }

      if (presentacionEnNombre) {
        const categoriaNombre = `ETIQUETA TRASERA ${tipo} ${presentacionEnNombre.toUpperCase()}`;
        console.log('✅ Categoría etiqueta trasera:', categoriaNombre);
        return categoriaNombre;
      }

      console.warn('⚠️ Etiqueta trasera sin presentación identificable');
      return null;
    }

    // ========== STICKER PARA CAJA ==========
    if (nombreUpper.includes('STICKER') && nombreUpper.includes('CAJA')) {
      console.log('✅ Categoría: STICKER PARA CAJA');
      return 'STICKER PARA CAJA';
    }

    // ========== CÓDIGO DE BARRAS ==========
    if ((nombreUpper.includes('CÓDIGO') || nombreUpper.includes('CODIGO')) &&
      (nombreUpper.includes('BARRAS') || nombreUpper.includes('BARRA'))) {
      console.log('✅ Categoría: CODIGO DE BARRAS PARA CAJAS');
      return 'CODIGO DE BARRAS PARA CAJAS';
    }

    // ========== BOLSAS DE PAPEL ==========
    if (nombreUpper.includes('BOLSA') && nombreUpper.includes('PAPEL')) {
      console.log('✅ Categoría: BOLSAS DE PAPEL');
      return 'BOLSAS DE PAPEL';
    }

    console.warn('❌ Categoría no encontrada para:', nombreInsumo);
    return null;
  };

  // ==================== CONVERTIR AL FORMATO BACKEND ====================
  const convertToBackendFormat = async (data) => {
    const clienteId = clientes.find(c => c.nombre === data.client)?.id;

    // Obtener el inventario completo filtrado por cliente y tipo
    let inventarioData = [];
    try {
      console.log('🔍 Buscando inventario con:', {
        cliente: data.client,
        tipo: data.type,
        presentacion: data.presentation
      });

      const inventarioResponse = await inventarioService.buscar({
        cliente_nombre: data.client,
        tipo: data.type
      });

      inventarioData = inventarioResponse.data || inventarioResponse || [];

      console.log('📦 Inventario cargado para búsqueda:', inventarioData.length, 'items');
    } catch (err) {
      console.error('❌ Error cargando inventario:', err);
    }

    // Procesar cada insumo para encontrar su inventario_id
    const detallesPromises = data.supplies.map(async (supply) => {
      const categoriaNombreExacto = getCategoriaForInsumo(supply.name, data.presentation);

      if (!categoriaNombreExacto) {
        console.warn(`⚠️ No se encontró categoría exacta para insumo: ${supply.name}`);
        return {
          inventario_id: null,
          cantidad: parseInt(supply.quantity) || 0,
          cantidad_desperdicio: parseInt(supply.waste) || 0,
          unidad: "unidades",
          notas: supply.name,
          error: 'Sin categoría',
          missing: true
        };
      }

      console.log(`🔎 Buscando en inventario con categoría exacta: "${categoriaNombreExacto}"`);

      const itemInventario = inventarioData.find(item => {
        const itemCategoria = item.categoria || item.CATEGORIA_INSUMO;
        const itemCliente = item.cliente || item.CLIENTE;

        const matchCategoria = itemCategoria?.nombre === categoriaNombreExacto;
        const matchCliente = itemCliente?.nombre === data.client;
        const matchTipo = item.tipo === data.type;

        return matchCategoria && matchCliente && matchTipo;
      });

      if (!itemInventario) {
        console.warn(`⚠️ No se encontró inventario para: ${supply.name} (categoría: ${categoriaNombreExacto})`);
        return {
          inventario_id: null,
          cantidad: parseInt(supply.quantity) || 0,
          cantidad_desperdicio: parseInt(supply.waste) || 0,
          unidad: "unidades",
          notas: supply.name,
          error: 'No encontrado en inventario',
          missing: true
        };
      }

      console.log(`✅ Inventario encontrado para ${supply.name}: ID=${itemInventario.id}`);

      // VALIDAR STOCK DISPONIBLE
      const cantidadTotal = parseInt(supply.quantity) + parseInt(supply.waste || 0);
      if (itemInventario.stock < cantidadTotal) {
        console.warn(`⚠️ Stock insuficiente para ${supply.name}. Disponible: ${itemInventario.stock}, Requerido: ${cantidadTotal}`);
        return {
          inventario_id: itemInventario.id,
          cantidad: parseInt(supply.quantity) || 0,
          cantidad_desperdicio: parseInt(supply.waste) || 0,
          unidad: "unidades",
          notas: supply.name,
          error: `Stock insuficiente (disponible: ${itemInventario.stock})`,
          stockInsuficiente: true
        };
      }

      return {
        inventario_id: itemInventario.id,
        cantidad: parseInt(supply.quantity) || 0,
        cantidad_desperdicio: parseInt(supply.waste) || 0,
        unidad: "unidades",
        notas: supply.name,
        missing: false
      };
    });

    const detalles = await Promise.all(detallesPromises);

    // Separar detalles válidos e inválidos
    const detallesValidos = detalles.filter(d => d.inventario_id !== null && !d.stockInsuficiente);
    const detallesInvalidos = detalles.filter(d => d.inventario_id === null || d.stockInsuficiente);

    // Si hay problemas de inventario
    if (detallesInvalidos.length > 0) {
      console.log('⚠️ Problemas con inventario detectados:', detallesInvalidos);
      throw new Error(`Problemas con inventario: ${detallesInvalidos.map(d => d.error).join(', ')}`);
    }

    if (detallesValidos.length === 0) {
      throw new Error('No se encontró inventario para ninguno de los insumos.');
    }

    return {
      fecha_entrega: data.date,
      orden_produccion: data.shippingOrder,
      lote_produccion_id: null, // Por ahora null, se puede agregar después
      cliente_id: clienteId || null,
      entregado_por: data.deliveredBy,
      recibido_por: data.receivedBy,
      notas_adicionales: `${data.format}\n\n${data.additionalNotes}\n\nResponsable: ${data.responsibleRegistry}\nLote: ${data.batch}`,
      usuario_id: localStorage.getItem('usuario_id') || 1,
      detalles: detallesValidos
    };
  };

  // Convertir del formato backend al formato original
  const convertFromBackendFormat = (backendData) => {
    const notasParts = (backendData.notas_adicionales || "").split('\n\n');
    const format = notasParts[0] || "";
    const additionalNotes = notasParts[1] || "";
    const infoLines = notasParts[2] || "";
    
    const responsibleMatch = infoLines.match(/Responsable: (.+)/);
    const batchMatch = infoLines.match(/Lote: (.+)/);
    
    const responsibleRegistry = responsibleMatch ? responsibleMatch[1] : "";
    const batch = batchMatch ? batchMatch[1] : "";

    const isExportacion = format.includes('Exportación');
    const type = isExportacion ? 'Exportación' : 'Nacional';

    const presentationMatch = format.match(/(\d+\s*(?:ML|L|ml|l))/i);
    const presentation = presentationMatch ? presentationMatch[1].toUpperCase() : "";

    return {
      date: backendData.fecha_entrega.split('T')[0],
      responsibleRegistry: responsibleRegistry,
      client: backendData.cliente?.nombre || "",
      shippingOrder: backendData.orden_produccion || "",
      batch: batch,
      variety: "ENSAMBLE",
      presentation: presentation,
      type: type,
      format: format,
      supplies: backendData.detalles?.map(d => ({
        name: d.notas || "",
        quantity: d.cantidad.toString(),
        waste: d.cantidad_desperdicio?.toString() || "0"
      })) || [],
      additionalNotes: additionalNotes,
      deliveredBy: backendData.entregado_por || "",
      receivedBy: backendData.recibido_por || ""
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const backendData = await convertToBackendFormat(formData);

      console.log('📤 Enviando entrega al backend:', backendData);

      if (editingDelivery) {
        const response = await entregaService.update(editingDelivery.id, {
          estado: backendData.estado || 'completado',
          notas_adicionales: backendData.notas_adicionales
        });

        if (response.success) {
          showToast('Entrega actualizada exitosamente', 'success');
          await loadEntregas();
        }
      } else {
        const response = await entregaService.create(backendData);

        if (response.success) {
          showToast(
            `Entrega creada exitosamente`,
            'success',
            [{
              id: 1,
              CATEGORIA_INSUMO: { nombre: 'Entrega' },
              codigo_lote: response.data.numero_entrega,
              stock: backendData.detalles.length,
              unidad: 'insumos'
            }]
          );
          await loadEntregas();
        }
      }

      resetForm();
      setShowForm(false);
      setEditingDelivery(null);
    } catch (err) {
      console.error('❌ Error al guardar entrega:', err);
      showToast(err.message || 'Error desconocido al guardar la entrega', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      responsibleRegistry: "",
      client: "",
      shippingOrder: "",
      batch: "",
      variety: "ENSAMBLE",
      presentation: "",
      type: "Exportación",
      format: "",
      supplies: [],
      additionalNotes: "",
      deliveredBy: "",
      receivedBy: ""
    });
  };

  const editDelivery = async (delivery) => {
    try {
      const response = await entregaService.getById(delivery.id);
      const entregaCompleta = response.data;

      const formattedData = convertFromBackendFormat(entregaCompleta);
      setFormData(formattedData);

      setEditingDelivery(entregaCompleta);
      setShowForm(true);
    } catch (err) {
      console.error('Error al cargar entrega:', err);
      alert('Error al cargar la entrega');
    }
  };

  const handleDeleteDelivery = async (id) => {
    if (window.confirm("⚠️ ¿Está seguro de eliminar esta entrega?\n\nNOTA: Solo se pueden eliminar entregas en estado 'pendiente'.")) {
      try {
        const response = await entregaService.delete(id);

        if (response.success) {
          showToast('Entrega eliminada exitosamente', 'success');
          await loadEntregas();
        }
      } catch (err) {
        console.error('❌ Error al eliminar entrega:', err);

        if (err.response?.data?.message) {
          showToast(err.response.data.message, 'error');
        } else {
          showToast('Error al eliminar la entrega', 'error');
        }
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Formato de Entrega de Insumos</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: white;
              color: black;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: #333;
              border-radius: 50%;
              margin-right: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }
            .title-section {
              flex: 1;
              text-align: center;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .format-title {
              font-size: 14px;
              margin-bottom: 10px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table th, .info-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }
            .info-table th {
              background: #f5f5f5;
              font-weight: bold;
            }
            .supplies-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .supplies-table th, .supplies-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }
            .supplies-table th {
              background: #f5f5f5;
              font-weight: bold;
              text-align: center;
            }
            .notes-section {
              margin-bottom: 30px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-bottom: 5px;
              margin-top: 40px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintableContent = (delivery) => {
    const displayData = delivery.supplies ? delivery : convertFromBackendFormat(delivery);

    return (
      <PrintContainer ref={printRef}>
        <PrintHeader>
          <Logo>RM</Logo>
          <TitleSection>
            <CompanyName>ENVASADORA ANCESTRAL</CompanyName>
            <DocumentTitle>FORMATO DE ENTREGA DE INSUMOS</DocumentTitle>
            <FormatTitle>{displayData.format}</FormatTitle>
          </TitleSection>
        </PrintHeader>

        <InfoTable>
          <tbody>
            <tr>
              <InfoHeader>FECHA:</InfoHeader>
              <InfoCell>{displayData.date}</InfoCell>
            </tr>
            <tr>
              <InfoHeader>RESPONSABLE DEL REGISTRO:</InfoHeader>
              <InfoCell>{displayData.responsibleRegistry}</InfoCell>
            </tr>
            <tr>
              <InfoHeader>CLIENTE:</InfoHeader>
              <InfoCell>{displayData.client}</InfoCell>
            </tr>
            <tr>
              <InfoHeader>ORDEN DE ENVASADO:</InfoHeader>
              <InfoCell>{displayData.shippingOrder}</InfoCell>
            </tr>
            <tr>
              <InfoHeader>LOTE:</InfoHeader>
              <InfoCell>{displayData.batch}</InfoCell>
            </tr>
          </tbody>
        </InfoTable>

        <RequirementsTitle>REQUERIMIENTOS:</RequirementsTitle>

        <SuppliesTable>
          <thead>
            <tr>
              <SuppliesHeader>NOMBRE DEL INSUMO</SuppliesHeader>
              <SuppliesHeader>CANTIDAD</SuppliesHeader>
              <SuppliesHeader>MERMA</SuppliesHeader>
            </tr>
          </thead>
          <tbody>
            {displayData.supplies.map((supply, index) => (
              <tr key={index}>
                <SuppliesCell>{supply.name}</SuppliesCell>
                <SuppliesCell>{supply.quantity}</SuppliesCell>
                <SuppliesCell>{supply.waste || '0'}</SuppliesCell>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - displayData.supplies.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <SuppliesCell>&nbsp;</SuppliesCell>
                <SuppliesCell>&nbsp;</SuppliesCell>
                <SuppliesCell>&nbsp;</SuppliesCell>
              </tr>
            ))}
          </tbody>
        </SuppliesTable>

        <NotesSection>
          <NotesTitle>NOTAS ADICIONALES:</NotesTitle>
          <NotesContent>{displayData.additionalNotes || ""}</NotesContent>
        </NotesSection>

        <Signatures>
          <Signature>
            <SignatureLine />
            <SignatureLabel>ENTREGA</SignatureLabel>
            <SignatureName>{displayData.deliveredBy}</SignatureName>
          </Signature>
          <Signature>
            <SignatureLine />
            <SignatureLabel>RECIBE</SignatureLabel>
            <SignatureName>{displayData.receivedBy}</SignatureName>
          </Signature>
        </Signatures>

        <Footer>
          Prolongación Portes # 1135, Esq. senderos, Pueblo Nuevo Oaxaca de Juárez, Oax. C.P. 68274<br />
          contacto@envasadoraancestral.mx Tel: 951 756 0687
        </Footer>
      </PrintContainer>
    );
  };

  // Mostrar entregas
  const displayDeliveries = entregas.map(entrega => {
    if (entrega.supplies) return entrega;
    return {
      ...entrega,
      ...convertFromBackendFormat(entrega)
    };
  });

  if (loadingData) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando datos...</LoadingText>
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
              <IoWarningOutline size={24} />
            </ToastIcon>
            <ToastContent>
              <ToastTitle>{toast.message}</ToastTitle>
              {toast.items && toast.items.length > 0 && (
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

      <PageHeader>
        <HeaderContent>
          <Title>Entrega de Insumos</Title>
          <Subtitle>Gestión de entregas de materiales para clientes</Subtitle>
        </HeaderContent>
        <HeaderActions>
          <ActionButton onClick={() => loadEntregas()} disabled={loading}>
            <IoRefreshOutline size={20} />
            Actualizar
          </ActionButton>
          <ActionButton onClick={() => setShowForm(true)} $primary>
            <IoAddOutline size={20} />
            Nueva Entrega
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {showForm && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingDelivery ? "Editar Entrega" : "Nueva Entrega"}
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowForm(false);
                setEditingDelivery(null);
                resetForm();
              }}>×</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormSection>
                <SectionTitle>Información General</SectionTitle>
                <FormGrid>
                  <FormGroup>
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Responsable del Registro</Label>
                    <Input
                      type="text"
                      value={formData.responsibleRegistry}
                      onChange={(e) => handleInputChange('responsibleRegistry', e.target.value)}
                      placeholder="Nombre del responsable"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Cliente *</Label>
                    <Select
                      value={formData.client}
                      onChange={(e) => handleInputChange('client', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientsList.map(client => (
                        <option key={client.id} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Orden de Envasado</Label>
                    <Input
                      type="text"
                      value={formData.shippingOrder}
                      onChange={(e) => handleInputChange('shippingOrder', e.target.value)}
                      placeholder="Número de orden"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Lote</Label>
                    <Input
                      type="text"
                      value={formData.batch}
                      onChange={(e) => handleInputChange('batch', e.target.value)}
                      placeholder="Número de lote"
                      required
                    />
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormSection>
                <SectionTitle>Formato del Producto</SectionTitle>
                <FormGrid>
                  <FormGroup>
                    <Label>Presentación *</Label>
                    <Select
                      value={formData.presentation}
                      onChange={(e) => handleInputChange('presentation', e.target.value)}
                      required
                      disabled={!formData.client}
                    >
                      <option value="">
                        {!formData.client ? 'Primero seleccione un cliente' : 'Seleccionar presentación'}
                      </option>
                      {presentacionesList.map((presentacion, index) => (
                        <option key={index} value={presentacion}>
                          {presentacion}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      required
                    >
                      <option value="Exportación">Exportación</option>
                      <option value="Nacional">Nacional</option>
                    </Select>
                  </FormGroup>

                  <FormGroup $fullWidth>
                    <Label>Formato Generado</Label>
                    <FormatoDisplay>
                      {formData.format || 'Seleccione presentación y tipo para generar el formato'}
                    </FormatoDisplay>
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormSection>
                <SectionTitleRow>
                  <SectionTitle>Insumos a Entregar ({formData.supplies.length})</SectionTitle>
                </SectionTitleRow>

                {formData.supplies.length === 0 ? (
                  <EmptySuppliesMessage>
                    Seleccione presentación y tipo para generar la lista de insumos automáticamente
                  </EmptySuppliesMessage>
                ) : (
                  <SuppliesList>
                    {formData.supplies.map((supply, index) => (
                      <SupplyRow key={index}>
                        <SupplyName>{supply.name}</SupplyName>
                        <FormGroup style={{ marginBottom: 0 }}>
                          <Input
                            type="number"
                            value={supply.quantity}
                            onChange={(e) => handleSupplyChange(index, 'quantity', e.target.value)}
                            placeholder="Cantidad"
                            min="0"
                            required
                          />
                        </FormGroup>
                        <FormGroup style={{ marginBottom: 0 }}>
                          <Input
                            type="number"
                            value={supply.waste}
                            onChange={(e) => handleSupplyChange(index, 'waste', e.target.value)}
                            placeholder="Merma"
                            min="0"
                          />
                        </FormGroup>
                      </SupplyRow>
                    ))}
                  </SuppliesList>
                )}
              </FormSection>

              <FormSection>
                <SectionTitle>Información Adicional</SectionTitle>
                <FormGrid>
                  <FormGroup>
                    <Label>Entregado por</Label>
                    <Input
                      type="text"
                      value={formData.deliveredBy}
                      onChange={(e) => handleInputChange('deliveredBy', e.target.value)}
                      placeholder="Nombre de quien entrega"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Recibido por</Label>
                    <Input
                      type="text"
                      value={formData.receivedBy}
                      onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                      placeholder="Nombre de quien recibe"
                    />
                  </FormGroup>

                  <FormGroup $fullWidth>
                    <Label>Notas Adicionales</Label>
                    <Textarea
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      placeholder="Observaciones, comentarios adicionales..."
                      rows="3"
                    />
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormActions>
                <SecondaryButton type="button" onClick={() => {
                  setShowForm(false);
                  setEditingDelivery(null);
                  resetForm();
                }}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={submitting}>
                  <IoSaveOutline size={16} />
                  {submitting ? 'Guardando...' : (editingDelivery ? "Actualizar" : "Guardar")} Entrega
                </PrimaryButton>
              </FormActions>
            </Form>
          </ModalContent>
        </Modal>
      )}

      <ContentCard>
        <CardHeader>
          <CardTitle>Entregas Registradas</CardTitle>
          <CardSubtitle>{displayDeliveries.length} entregas en total</CardSubtitle>
        </CardHeader>

        {loading && displayDeliveries.length === 0 ? (
          <EmptyState>
            <IoRefreshOutline size={48} />
            <EmptyTitle>Cargando entregas...</EmptyTitle>
          </EmptyState>
        ) : displayDeliveries.length === 0 ? (
          <EmptyState>
            <IoDocumentTextOutline size={48} />
            <EmptyTitle>No hay entregas registradas</EmptyTitle>
            <EmptyText>Comience creando su primera entrega de insumos</EmptyText>
          </EmptyState>
        ) : (
          <DeliveriesList>
            {displayDeliveries.map(delivery => (
              <DeliveryCard key={delivery.id}>
                <DeliveryHeader>
                  <DeliveryInfo>
                    <DeliveryTitle>
                      {delivery.client} - {delivery.format}
                    </DeliveryTitle>
                    <DeliveryDetails>
                      <Detail>
                        <IoCalendarOutline size={14} />
                        {delivery.date}
                      </Detail>
                      <Detail>Orden: {delivery.shippingOrder}</Detail>
                      <Detail>Lote: {delivery.batch}</Detail>
                      <Detail>Insumos: {delivery.supplies?.length || 0}</Detail>
                      {delivery.estado && (
                        <StatusBadge $estado={delivery.estado}>
                          {delivery.estado}
                        </StatusBadge>
                      )}
                    </DeliveryDetails>
                  </DeliveryInfo>
                  <DeliveryActions>
                    <IconButton onClick={() => {
                      generatePrintableContent(delivery);
                      handlePrint();
                    }}>
                      <IoPrintOutline size={16} />
                    </IconButton>
                    <IconButton onClick={() => editDelivery(delivery)}>
                      <IoDocumentTextOutline size={16} />
                    </IconButton>
                    <IconButton
                      $danger
                      onClick={() => handleDeleteDelivery(delivery.id)}
                    >
                      <IoTrashOutline size={16} />
                    </IconButton>
                  </DeliveryActions>
                </DeliveryHeader>

                <SuppliesPreview>
                  {delivery.supplies?.slice(0, 3).map((supply, index) => (
                    <SupplyTag key={index}>
                      {supply.name}: {supply.quantity}
                      {supply.waste && supply.waste !== '0' && ` (Merma: ${supply.waste})`}
                    </SupplyTag>
                  ))}
                  {delivery.supplies?.length > 3 && (
                    <SupplyTag $more>+{delivery.supplies.length - 3} más</SupplyTag>
                  )}
                </SuppliesPreview>
              </DeliveryCard>
            ))}
          </DeliveriesList>
        )}
      </ContentCard>

      <div style={{ display: 'none' }}>
        {editingDelivery && generatePrintableContent(editingDelivery)}
      </div>
    </Container>
  );
}

// ==================== STYLED COMPONENTS (IGUAL QUE RECEPTION) ====================

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.bg};
  padding: 1.5rem;
  transition: background 0.3s ease;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$primary ? '#3b82f6' : props.theme.bgtgderecha};
  color: ${props => props.$primary ? 'white' : props.theme.textprimary};
  border: ${props => props.$primary ? 'none' : `1px solid ${props.theme.bg3}`};
  
  &:hover:not(:disabled) {
    background: ${props => props.$primary ? '#2563eb' : props.theme.bg2};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #fecaca;
`;

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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  transition: background 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
  position: sticky;
  top: 0;
  background: ${props => props.theme.bgtgderecha};
  z-index: 1;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0;
  transition: color 0.3s ease;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
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

const Form = styled.form`
  padding: 1.5rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 1rem 0;
  transition: color 0.3s ease;
`;

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: ${props => props.theme.texttertiary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 6px;
  font-size: 0.875rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  cursor: pointer;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 6px;
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

const FormatoDisplay = styled.div`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.theme.bg3};
  border-radius: 6px;
  font-size: 0.875rem;
  background: ${props => props.theme.bg2};
  color: ${props => props.theme.textprimary};
  min-height: 42px;
  display: flex;
  align-items: center;
  font-weight: 600;
  transition: all 0.2s;
`;

const EmptySuppliesMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.texttertiary};
  background: ${props => props.theme.bg2};
  border-radius: 8px;
  font-style: italic;
`;

const SuppliesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SupplyRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: ${props => props.theme.bg2};
  border-radius: 8px;
  transition: background 0.3s ease;
`;

const SupplyName = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.textprimary};
  font-weight: 500;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.bg3};
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.theme.bg};
  color: ${props => props.theme.textprimary};
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.bg2};
  }
`;

const ContentCard = styled.div`
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.bg3};
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.25rem 0;
  transition: color 0.3s ease;
`;

const CardSubtitle = styled.p`
  color: ${props => props.theme.texttertiary};
  font-size: 0.875rem;
  margin: 0;
  transition: color 0.3s ease;
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: ${props => props.theme.textprimary};
  transition: color 0.3s ease;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;

const DeliveriesList = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DeliveryCard = styled.div`
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
  background: ${props => props.theme.bg};
  
  &:hover {
    border-color: ${props => props.theme.texttertiary};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DeliveryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const DeliveryInfo = styled.div`
  flex: 1;
`;

const DeliveryTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.5rem 0;
  transition: color 0.3s ease;
`;

const DeliveryDetails = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Detail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  transition: color 0.3s ease;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$estado) {
      case 'completado': return '#d1fae5';
      case 'pendiente': return '#fef3c7';
      case 'cancelado': return '#fee2e2';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.$estado) {
      case 'completado': return '#065f46';
      case 'pendiente': return '#92400e';
      case 'cancelado': return '#991b1b';
      default: return '#374151';
    }
  }};
`;

const DeliveryActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  background: ${props => props.$danger ? '#fee2e2' : props.theme.bg2};
  color: ${props => props.$danger ? '#dc2626' : props.theme.textprimary};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$danger ? '#fecaca' : props.theme.bg3};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuppliesPreview = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SupplyTag = styled.span`
  padding: 0.25rem 0.75rem;
  background: ${props => props.$more ? props.theme.bg3 : '#dbeafe'};
  color: ${props => props.$more ? props.theme.texttertiary : '#1e40af'};
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background 0.3s ease;
`;

// Print Components
const PrintContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  font-family: Arial, sans-serif;
  color: black;
`;

const PrintHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
`;

const Logo = styled.div`
  width: 60px;
  height: 60px;
  background: #333;
  border-radius: 50%;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
`;

const TitleSection = styled.div`
  flex: 1;
  text-align: center;
`;

const CompanyName = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const DocumentTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const FormatTitle = styled.div`
  font-size: 14px;
  margin-bottom: 10px;
`;

const InfoTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const InfoHeader = styled.th`
  border: 1px solid #333;
  padding: 8px;
  background: #f5f5f5;
  font-weight: bold;
  text-align: left;
  width: 30%;
`;

const InfoCell = styled.td`
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
`;

const RequirementsTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
`;

const SuppliesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const SuppliesHeader = styled.th`
  border: 1px solid #333;
  padding: 8px;
  background: #f5f5f5;
  font-weight: bold;
  text-align: center;
`;

const SuppliesCell = styled.td`
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
  min-height: 30px;
`;

const NotesSection = styled.div`
  margin-bottom: 30px;
`;

const NotesTitle = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
`;

const NotesContent = styled.div`
  min-height: 40px;
  border: 1px solid #333;
  padding: 8px;
`;

const Signatures = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
`;

const Signature = styled.div`
  text-align: center;
  width: 200px;
`;

const SignatureLine = styled.div`
  border-top: 1px solid #333;
  margin-bottom: 5px;
  margin-top: 40px;
`;

const SignatureLabel = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 12px;
`;

const SignatureName = styled.div`
  font-size: 12px;
  color: #666;
`;

const Footer = styled.div`
  margin-top: 30px;
  text-align: center;
  font-size: 10px;
  color: #666;
  border-top: 1px solid #ccc;
  padding-top: 10px;
`;

// Toast Notifications
const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
`;

const Toast = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.bgtgderecha};
  border-radius: 12px;
  border-left: 4px solid ${props =>
    props.$type === 'critical' ? '#dc2626' :
      props.$type === 'warning' ? '#d97706' :
        props.$type === 'success' ? '#10b981' :
          props.$type === 'error' ? '#dc2626' :
            '#3b82f6'
  };
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  
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
  color: ${props =>
    props.$type === 'critical' ? '#dc2626' :
      props.$type === 'warning' ? '#d97706' :
        props.$type === 'success' ? '#10b981' :
          props.$type === 'error' ? '#dc2626' :
            '#3b82f6'
  };
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: ${props => props.theme.textprimary};
`;

const ToastList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
`;

const ToastItem = styled.li`
  margin: 0.25rem 0;
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.texttertiary};
  font-size: 1.25rem;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${props => props.theme.textprimary};
  }
`;