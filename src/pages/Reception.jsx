import { useState, useContext, useEffect, useMemo } from "react";
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
  IoWarningOutline,
  IoDownloadOutline,
  IoEyeOutline
} from "react-icons/io5";
import { ThemeContext } from "../App";
import { useRecepciones } from "../hooks/useRecepciones";
import { recepcionService } from "../services/recepcionService";
import { 
  clienteService, 
  presentacionService, 
  categoriaService, 
  inventarioService
} from "../services/inventarioService";

// Importar el servicio de PDF
import { downloadRecepcionPDF, previewRecepcionPDF } from "../services/pdfService";

// Importar servicio de configuración de clientes (opcional, con fallback)
import { obtenerTodasConfiguraciones } from "../services/clienteConfigService";

// ==================== CONFIGURACIÓN LOCAL DE RESPALDO ====================
// Esta configuración se usa si no se puede cargar del backend
const CLIENTE_CONFIG_FALLBACK = {
  'THE PRODUCER': {
    variedades: ['ESPADÍN', 'ENSAMBLE', 'SAN MARTÍN', 'TEPEZTATE', 'ARROQUEÑO'],
    presentaciones: ['1000 ml', '750 ml', '700 ml', '200 ml'],
    tipos: ['Nacional', 'Exportación']
  },
  'ESPÍRITU CORSA': {
    variedades: ['ESPADÍN', 'ENSAMBLE', 'ENSAMBLE MADURADO'],
    presentaciones: ['1000 ml', '750 ml', '200 ml', '50 ml'],
    tipos: ['Nacional']
  },
  'ESPIRITU CORSA': {
    variedades: ['ESPADÍN', 'ENSAMBLE', 'ENSAMBLE MADURADO'],
    presentaciones: ['1000 ml', '750 ml', '200 ml', '50 ml'],
    tipos: ['Nacional']
  },
  'ANCESTRAL': {
    variedades: ['ESPADÍN'],
    presentaciones: ['750 ml', '375 ml'],
    tipos: ['Nacional', 'Exportación']
  }
};

// Función para normalizar nombres de cliente (quitar acentos, mayúsculas)
const normalizeClientName = (name) => {
  if (!name) return '';
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Función para obtener configuración del cliente desde un objeto de configuraciones
const getClientConfigFromData = (clientName, configuraciones) => {
  if (!clientName) return null;
  
  const normalized = normalizeClientName(clientName);
  
  // Buscar coincidencia exacta primero
  for (const [key, config] of Object.entries(configuraciones)) {
    if (normalizeClientName(key) === normalized) {
      return config;
    }
  }
  
  // Buscar coincidencia parcial
  for (const [key, config] of Object.entries(configuraciones)) {
    if (normalized.includes(normalizeClientName(key)) || 
        normalizeClientName(key).includes(normalized)) {
      return config;
    }
  }
  
  // Si no hay configuración específica, devolver null
  return null;
};

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

// Todas las variedades disponibles (por defecto)
const TODAS_VARIEDADES = [
  'ESPADÍN', 'ENSAMBLE', 'ENSAMBLE MADURADO', 'SAN MARTÍN', 
  'TEPEZTATE', 'ARROQUEÑO', 'TOBALÁ', 'CUISHE', 'MADRECUISHE', 
  'COYOTE', 'MEXICANO', 'BARRIL'
];

// Todas las presentaciones disponibles (por defecto)
const TODAS_PRESENTACIONES = ['1000 ml', '750 ml', '700 ml', '375 ml', '200 ml', '50 ml'];

// Todos los tipos disponibles (por defecto)
const TODOS_TIPOS = ['Nacional', 'Exportación'];

export function Reception() {
  const { theme } = useContext(ThemeContext);
  const [showForm, setShowForm] = useState(false);
  const [editingReception, setEditingReception] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados para datos del backend
  const [clientes, setClientes] = useState([]);
  const [presentacionesDB, setPresentacionesDB] = useState([]);
  const [clienteConfiguraciones, setClienteConfiguraciones] = useState(CLIENTE_CONFIG_FALLBACK);
  const [loadingData, setLoadingData] = useState(true);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Modal para crear insumos faltantes
  const [showCreateInsumosModal, setShowCreateInsumosModal] = useState(false);
  const [insumosFaltantes, setInsumosFaltantes] = useState([]);
  const [pendingReceptionData, setPendingReceptionData] = useState(null);

  // Estado para generación de PDF
  const [generatingPDF, setGeneratingPDF] = useState(null);

  // Usar el custom hook solo para recepciones
  const {
    recepciones: receptions,
    loading,
    error,
    loadRecepciones
  } = useRecepciones();

  // Mostrar notificaciones toast
  const showToast = (message, type, items = []) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, items }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 8000);
  };

  // Cargar clientes y presentaciones al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [clientesRes, presentacionesRes] = await Promise.all([
          clienteService.getAll().catch(err => {
            console.error('Error cargando clientes:', err);
            return { data: [] };
          }),
          presentacionService.getAll().catch(err => {
            console.error('Error cargando presentaciones:', err);
            return { data: [] };
          })
        ]);

        const clientesData = clientesRes.data || clientesRes || [];
        const presentacionesData = presentacionesRes.data || presentacionesRes || [];

        setClientes(clientesData);
        setPresentacionesDB(presentacionesData);

        // Intentar cargar configuraciones desde el backend
        try {
          const configRes = await obtenerTodasConfiguraciones();
          if (configRes.success && Object.keys(configRes.data).length > 0) {
            console.log('✅ Configuraciones cargadas desde el backend');
            setClienteConfiguraciones(configRes.data);
          } else {
            console.log('ℹ️ Usando configuraciones locales de respaldo');
          }
        } catch (configError) {
          console.warn('⚠️ No se pudieron cargar las configuraciones del backend, usando fallback local');
          // Mantener las configuraciones de fallback
        }

        console.log('✅ Clientes cargados:', clientesData.length);
        console.log('✅ Presentaciones cargadas:', presentacionesData.length);
      } catch (err) {
        console.error('❌ Error cargando datos:', err);
        showToast('Error al cargar datos iniciales', 'error');
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

  // Estado del formulario
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    responsibleRegistry: "",
    client: "",
    shippingOrder: "",
    variety: "",
    presentation: "",
    type: "",
    format: "",
    lote: "",
    supplies: [],
    additionalNotes: "",
    deliveredBy: "",
    receivedBy: ""
  });

  // ==================== FILTRADO DINÁMICO POR CLIENTE ====================
  
  // Obtener configuración del cliente seleccionado (desde backend o fallback)
  const clientConfig = useMemo(() => {
    return getClientConfigFromData(formData.client, clienteConfiguraciones);
  }, [formData.client, clienteConfiguraciones]);

  // Variedades filtradas según el cliente
  const variedadesFiltradas = useMemo(() => {
    if (clientConfig && clientConfig.variedades) {
      return clientConfig.variedades;
    }
    return TODAS_VARIEDADES;
  }, [clientConfig]);

  // Presentaciones filtradas según el cliente
  const presentacionesFiltradas = useMemo(() => {
    if (clientConfig && clientConfig.presentaciones) {
      return clientConfig.presentaciones;
    }
    // Si no hay configuración, usar las de la BD
    if (presentacionesDB.length > 0) {
      return presentacionesDB.map(p => p.volumen).sort();
    }
    return TODAS_PRESENTACIONES;
  }, [clientConfig, presentacionesDB]);

  // Tipos filtrados según el cliente
  const tiposFiltrados = useMemo(() => {
    if (clientConfig && clientConfig.tipos) {
      return clientConfig.tipos;
    }
    return TODOS_TIPOS;
  }, [clientConfig]);

  // Función para generar el formato: CLIENTE - VARIEDAD PRESENTACION TIPO
  const generateFormat = (client, variety, presentation, type) => {
    if (!client || !variety || !presentation || !type) return '';
    return `${client} - ${variety} ${presentation} ${type.toUpperCase()}`;
  };

  // Generar insumos automáticamente según tipo y presentación
  const generateSupplies = (type, presentation) => {
    if (!type || !presentation) return [];

    const insumosBase = INSUMOS_POR_TIPO[type] || [];

    return insumosBase.map(insumo => ({
      name: insumo.replace('{PRESENTACION}', presentation),
      quantity: ""
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Si cambia el cliente, resetear variedad, presentación y tipo
      if (field === 'client') {
        newData.variety = "";
        newData.presentation = "";
        newData.type = "";
        newData.format = "";
        newData.supplies = [];
        
        // Si el cliente solo tiene un tipo disponible, seleccionarlo automáticamente
        const config = getClientConfigFromData(value, clienteConfiguraciones);
        if (config && config.tipos && config.tipos.length === 1) {
          newData.type = config.tipos[0];
        }
      }

      // Auto-generar formato cuando cambian variety, presentation o type
      if (['variety', 'presentation', 'type'].includes(field)) {
        const client = prev.client;
        const variety = field === 'variety' ? value : prev.variety;
        const presentation = field === 'presentation' ? value : prev.presentation;
        const type = field === 'type' ? value : prev.type;

        // Generar formato
        newData.format = generateFormat(client, variety, presentation, type);

        // Generar supplies solo cuando cambian presentation o type
        if (field === 'presentation' || field === 'type') {
          const currentPresentation = field === 'presentation' ? value : prev.presentation;
          const currentType = field === 'type' ? value : prev.type;
          
          if (currentPresentation && currentType) {
            newData.supplies = generateSupplies(currentType, currentPresentation);
          }
        }
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

  // Función mejorada para mapear nombre de insumo a categoría ESPECÍFICA
  const getCategoriaForInsumo = (nombreInsumo, presentacion = '') => {
    const nombreUpper = nombreInsumo.toUpperCase().trim();

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
        return `BOTELLA ${presentacionEnNombre.toUpperCase()} Y CAJA`;
      }
      return null;
    }

    // ========== TAPONES CÓNICOS ==========
    if ((nombreUpper.includes('TAPÓN') && nombreUpper.includes('CÓNICO')) ||
      (nombreUpper.includes('TAPON') && nombreUpper.includes('CONICO'))) {
      return 'TAPONES CONICOS NATURALES O NEGROS';
    }

    // ========== CORCHO CON TAPA ==========
    if (nombreUpper.includes('CORCHO') && nombreUpper.includes('TAPA')) {
      return 'CORCHO CON TAPA NATURAL O NEGRA';
    }

    // ========== CUERITOS ==========
    if (nombreUpper.includes('CUERITO') || nombreUpper.includes('CUERITOS')) {
      return 'CUERITOS NEGROS O NATURALES';
    }

    // ========== CINTILLO ==========
    if (nombreUpper.includes('CINTILLO')) {
      return 'CINTILLO';
    }

    // ========== SELLOS TÉRMICOS ==========
    if (nombreUpper.includes('SELLO') && (nombreUpper.includes('TÉRMI') || nombreUpper.includes('TERMI'))) {
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
        return `ETIQUETA FRENTE ${tipo} ${presentacionEnNombre.toUpperCase()}`;
      }
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
        return `ETIQUETA TRASERA ${tipo} ${presentacionEnNombre.toUpperCase()}`;
      }
      return null;
    }

    // ========== STICKER PARA CAJA ==========
    if (nombreUpper.includes('STICKER') && nombreUpper.includes('CAJA')) {
      return 'STICKER PARA CAJA';
    }

    // ========== CÓDIGO DE BARRAS ==========
    if ((nombreUpper.includes('CÓDIGO') || nombreUpper.includes('CODIGO')) &&
      (nombreUpper.includes('BARRAS') || nombreUpper.includes('BARRA'))) {
      return 'CODIGO DE BARRAS PARA CAJAS';
    }

    // ========== BOLSAS DE PAPEL ==========
    if (nombreUpper.includes('BOLSA') && nombreUpper.includes('PAPEL')) {
      return 'BOLSAS DE PAPEL';
    }

    return null;
  };

  // ==================== MAPEOS DE IDs ====================
  // Mapeo de variedades a IDs (basado en tu BD)
  const VARIEDAD_IDS = {
    'ESPADÍN': 1, 'ESPADIN': 1,
    'ENSAMBLE': 2,
    'SAN MARTÍN': 3, 'SAN MARTIN': 3,
    'TEPEZTATE': 4,
    'ARROQUEÑO': 5, 'ARROQUENO': 5,
    'ENSAMBLE MADURADO': 6
  };

  // Mapeo de presentaciones a IDs (basado en tu BD)
  const PRESENTACION_IDS = {
    '50 ML': 1, '50 ml': 1,
    '200 ML': 2, '200 ml': 2,
    '375 ML': 3, '375 ml': 3,
    '700 ML': 4, '700 ml': 4,
    '750 ML': 5, '750 ml': 5,
    '1000 ML': 6, '1000 ml': 6
  };

  // Convertir del formato original al formato del backend
  const convertToBackendFormat = async (data, autoCreateMissing = false) => {
    const clienteId = clientes.find(c => c.nombre === data.client)?.id;

    // ========================================
    // OBTENER IDs DE VARIEDAD Y PRESENTACIÓN
    // ========================================
    const variedadNormalizada = data.variety.toUpperCase().trim();
    const presentacionNormalizada = data.presentation.toUpperCase().trim();

    // Buscar ID de variedad
    const variedad_agave_id = VARIEDAD_IDS[variedadNormalizada] || null;
    
    // Buscar ID de presentación (primero en mapeo, luego en BD)
    let presentacion_id = PRESENTACION_IDS[presentacionNormalizada];
    if (!presentacion_id && presentacionesDB.length > 0) {
      const presentacionDB = presentacionesDB.find(p => 
        p.volumen.toUpperCase().trim() === presentacionNormalizada
      );
      presentacion_id = presentacionDB?.id || null;
    }

    console.log('📦 Datos para actualizar inventario:');
    console.log('  - Variedad:', data.variety, '→ ID:', variedad_agave_id);
    console.log('  - Presentación:', data.presentation, '→ ID:', presentacion_id);
    console.log('  - Tipo:', data.type);

    let inventarioData = [];
    try {
      const inventarioResponse = await inventarioService.buscar({
        cliente_nombre: data.client,
        tipo: data.type
      });

      inventarioData = inventarioResponse.data || inventarioResponse || [];
    } catch (err) {
      console.error('❌ Error cargando inventario:', err);
    }

    const detallesPromises = data.supplies.map(async (supply) => {
      const categoriaNombreExacto = getCategoriaForInsumo(supply.name, data.presentation);

      if (!categoriaNombreExacto) {
        return {
          inventario_id: null,
          cantidad: parseInt(supply.quantity) || 0,
          unidad: "unidades",
          notas: supply.name,
          error: 'Sin categoría',
          missing: true,
          supplyData: supply
        };
      }

      const itemInventario = inventarioData.find(item => {
        const itemCategoria = item.categoria || item.CATEGORIA_INSUMO;
        const itemCliente = item.cliente || item.CLIENTE;

        const matchCategoria = itemCategoria?.nombre === categoriaNombreExacto;
        const matchCliente = itemCliente?.nombre === data.client;
        const matchTipo = item.tipo === data.type;

        return matchCategoria && matchCliente && matchTipo;
      });

      if (!itemInventario) {
        return {
          inventario_id: null,
          cantidad: parseInt(supply.quantity) || 0,
          unidad: "unidades",
          notas: supply.name,
          error: 'No encontrado en inventario',
          missing: true,
          supplyData: supply,
          categoriaNombre: categoriaNombreExacto
        };
      }

      return {
        inventario_id: itemInventario.id,
        cantidad: parseInt(supply.quantity) || 0,
        unidad: "unidades",
        notas: supply.name,
        missing: false
      };
    });

    const detalles = await Promise.all(detallesPromises);

    const detallesValidos = detalles.filter(d => d.inventario_id !== null);
    const detallesInvalidos = detalles.filter(d => d.inventario_id === null);

    if (detallesInvalidos.length > 0 && !autoCreateMissing) {
      return {
        error: 'MISSING_INVENTORY',
        missingItems: detallesInvalidos,
        validItems: detallesValidos,
        formData: data
      };
    }

    if (detallesValidos.length === 0) {
      throw new Error('No se encontró inventario para ninguno de los insumos.');
    }

    return {
      fecha_recepcion: data.date,
      orden_compra: data.shippingOrder,
      factura: "",
      proveedor_id: null,
      cliente_id: clienteId || null,
      entregado_por: data.deliveredBy,
      recibido_por: data.receivedBy,
      notas_adicionales: `${data.format}|${data.lote}|${data.additionalNotes}|${data.responsibleRegistry}`,
      usuario_id: localStorage.getItem('usuario_id') || 1,
      detalles: detallesValidos,
      // ========================================
      // NUEVOS CAMPOS PARA ACTUALIZAR INVENTARIO
      // ========================================
      variedad_agave_id,
      presentacion_id,
      tipo: data.type
    };
  };

  // Convertir del formato backend al formato original
  const convertFromBackendFormat = (backendData) => {
    const notasParts = (backendData.notas_adicionales || "").split('|');
    const format = notasParts[0] || "";
    const lote = notasParts[1] || "";
    const additionalNotes = notasParts[2] || "";
    const responsibleRegistry = notasParts[3] || "";

    const isExportacion = format.toUpperCase().includes('EXPORTACIÓN') || format.toUpperCase().includes('EXPORTACION');
    const type = isExportacion ? 'Exportación' : 'Nacional';

    // Extraer presentación del formato
    const presentationMatch = format.match(/(\d+\s*(?:ML|L|ml|l))/i);
    const presentation = presentationMatch ? presentationMatch[1].toLowerCase().replace(' ', ' ') : "";

    // Extraer cliente (antes del guión)
    const clientMatch = format.match(/^([^-]+)/);
    const client = clientMatch ? clientMatch[1].trim() : (backendData.cliente?.nombre || "");

    // Extraer variedad (después del guión y antes de la presentación)
    const varietyMatch = format.match(/-\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*\d+\s*(?:ML|ml))/i);
    const variety = varietyMatch ? varietyMatch[1].trim().toUpperCase() : "";

    return {
      date: backendData.fecha_recepcion?.split('T')[0] || '',
      responsibleRegistry: responsibleRegistry,
      client: client,
      shippingOrder: backendData.orden_compra || "",
      variety: variety,
      presentation: presentation,
      type: type,
      format: format,
      lote: lote,
      supplies: backendData.detalles?.map(d => ({
        name: d.notas || "",
        quantity: d.cantidad?.toString() || ""
      })) || [],
      additionalNotes: additionalNotes,
      deliveredBy: backendData.entregado_por || "",
      receivedBy: backendData.recibido_por || ""
    };
  };

  // ==================== FUNCIONES DE PDF (ASYNC) ====================

  const handleDownloadPDF = async (reception) => {
    setGeneratingPDF(reception.id);
    
    try {
      const displayData = reception.supplies ? reception : convertFromBackendFormat(reception);
      await downloadRecepcionPDF(displayData);
      showToast('PDF descargado exitosamente', 'success');
    } catch (err) {
      console.error('❌ Error al descargar PDF:', err);
      showToast('Error al generar el PDF', 'error');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handlePreviewPDF = async (reception) => {
    setGeneratingPDF(reception.id);
    
    try {
      const displayData = reception.supplies ? reception : convertFromBackendFormat(reception);
      await previewRecepcionPDF(displayData);
    } catch (err) {
      console.error('❌ Error al previsualizar PDF:', err);
      showToast('Error al generar la vista previa', 'error');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handlePrintPDF = async (reception) => {
    setGeneratingPDF(reception.id);
    
    try {
      const displayData = reception.supplies ? reception : convertFromBackendFormat(reception);
      await previewRecepcionPDF(displayData);
      showToast('PDF abierto para impresión', 'info');
    } catch (err) {
      console.error('❌ Error al imprimir PDF:', err);
      showToast('Error al preparar impresión', 'error');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const backendData = await convertToBackendFormat(formData);

      if (backendData.error === 'MISSING_INVENTORY') {
        setPendingReceptionData(backendData.formData);
        setInsumosFaltantes(backendData.missingItems);
        setShowCreateInsumosModal(true);
        setSubmitting(false);
        return;
      }

      if (editingReception) {
        const response = await recepcionService.update(editingReception.id, {
          estado: backendData.estado || 'completado',
          notas_adicionales: backendData.notas_adicionales
        });

        if (response.success) {
          showToast('Recepción actualizada exitosamente', 'success');
          await loadRecepciones();
        }
      } else {
        const response = await recepcionService.create(backendData);

        if (response.success) {
          showToast(
            `Recepción creada exitosamente`,
            'success',
            [{
              id: 1,
              CATEGORIA_INSUMO: { nombre: 'Recepción' },
              codigo_lote: response.data.numero_recepcion,
              stock: backendData.detalles.length,
              unidad: 'insumos'
            }]
          );
          await loadRecepciones();
        }
      }

      resetForm();
      setShowForm(false);
      setEditingReception(null);
    } catch (err) {
      console.error('❌ Error al guardar recepción:', err);
      showToast(err.message || 'Error desconocido al guardar la recepción', 'error');
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
      variety: "",
      presentation: "",
      type: "",
      format: "",
      lote: "",
      supplies: [],
      additionalNotes: "",
      deliveredBy: "",
      receivedBy: ""
    });
  };

  const editReception = async (reception) => {
    try {
      const response = await recepcionService.getById(reception.id);
      const recepcionCompleta = response.data;

      const formattedData = convertFromBackendFormat(recepcionCompleta);
      setFormData(formattedData);

      setEditingReception(recepcionCompleta);
      setShowForm(true);
    } catch (err) {
      console.error('Error al cargar recepción:', err);
      showToast('Error al cargar la recepción', 'error');
    }
  };

  const handleDeleteReception = async (id) => {
    if (window.confirm("⚠️ ¿Está seguro de eliminar esta recepción?\n\nNOTA: Solo se pueden eliminar recepciones en estado 'pendiente'.")) {
      try {
        const response = await recepcionService.delete(id);

        if (response.success) {
          showToast('Recepción eliminada exitosamente', 'success');
          await loadRecepciones();
        }
      } catch (err) {
        console.error('❌ Error al eliminar recepción:', err);

        if (err.response?.data?.message) {
          showToast(err.response.data.message, 'error');
        } else {
          showToast('Error al eliminar la recepción', 'error');
        }
      }
    }
  };

  // Crear registros de inventario faltantes
  const handleCreateMissingInventory = async () => {
    setSubmitting(true);

    try {
      const clienteId = clientes.find(c => c.nombre === pendingReceptionData.client)?.id;
      const presentacionId = presentacionesDB.find(p => p.volumen === pendingReceptionData.presentation)?.id;

      const categoriasResponse = await categoriaService.getAll();
      const categoriasData = categoriasResponse.data || categoriasResponse;

      const createdItems = [];

      for (const item of insumosFaltantes) {
        const categoria = categoriasData.find(c => c.nombre === item.categoriaNombre);

        if (!categoria) {
          continue;
        }

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        const prefijo = categoria.nombre.substring(0, 3).toUpperCase().replace(/\s/g, '');
        const codigoLote = `REC-${prefijo}-${timestamp}-${randomSuffix}`;

        const necesitaPresentacion = categoria.nombre.includes('BOTELLA') ||
          categoria.nombre.includes('ETIQUETA');

        const nuevoInventario = {
          categoria_insumo_id: categoria.id,
          cliente_id: clienteId,
          presentacion_id: necesitaPresentacion ? presentacionId : null,
          tipo: pendingReceptionData.type,
          codigo_lote: codigoLote,
          stock: 0,
          stock_minimo: 500, //Cambio de minimo de stock de acuerdo a la empresa 
          unidad: 'unidades',
          activo: true
        };

        const response = await inventarioService.create(nuevoInventario);

        if (response.success || response.data) {
          createdItems.push(response.data || response);
        }
      }

      showToast(
        `${createdItems.length} registro(s) de inventario creados`,
        'success'
      );

      setShowCreateInsumosModal(false);

      await new Promise(resolve => setTimeout(resolve, 500));

      const backendData = await convertToBackendFormat(pendingReceptionData, true);

      if (backendData.error === 'MISSING_INVENTORY') {
        showToast('Aún faltan algunos insumos en el inventario', 'warning');
        return;
      }

      const response = await recepcionService.create(backendData);

      if (response.success) {
        showToast(
          `Recepción creada exitosamente`,
          'success'
        );
        await loadRecepciones();
        resetForm();
        setShowForm(false);
      }

      setPendingReceptionData(null);
      setInsumosFaltantes([]);

    } catch (err) {
      console.error('❌ Error creando inventario:', err);
      showToast('Error al crear los registros de inventario', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Mostrar recepciones
  const displayReceptions = receptions.map(reception => {
    if (reception.supplies) return reception;
    return {
      ...reception,
      ...convertFromBackendFormat(reception)
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
          <Title>Recepción de Insumos</Title>
          <Subtitle>Gestión de recepciones de materiales para envasado</Subtitle>
        </HeaderContent>
        <HeaderActions>
          <ActionButton onClick={() => loadRecepciones()} disabled={loading}>
            <IoRefreshOutline size={20} />
            Actualizar
          </ActionButton>
          <ActionButton onClick={() => setShowForm(true)} $primary>
            <IoAddOutline size={20} />
            Nueva Recepción
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
                {editingReception ? "Editar Recepción" : "Nueva Recepción"}
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowForm(false);
                setEditingReception(null);
                resetForm();
              }}>×</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormSection>
                <SectionTitle>Información General</SectionTitle>
                <FormGrid>
                  <FormGroup>
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Responsable del Registro *</Label>
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
                    <Label>Orden de Envasado *</Label>
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
                      value={formData.lote}
                      onChange={(e) => handleInputChange('lote', e.target.value)}
                      placeholder="Número de lote"
                    />
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormSection>
                <SectionTitle>
                  Formato del Producto
                  {formData.client && clientConfig && (
                    <ClientConfigBadge>
                      Configuración: {formData.client}
                    </ClientConfigBadge>
                  )}
                </SectionTitle>
                
                {!formData.client && (
                  <InfoMessage>
                    ℹ️ Seleccione un cliente para ver las variedades y presentaciones disponibles
                  </InfoMessage>
                )}

                <FormGrid>
                  <FormGroup>
                    <Label>Variedad de Agave *</Label>
                    <Select
                      value={formData.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      required
                      disabled={!formData.client}
                    >
                      <option value="">
                        {!formData.client ? 'Primero seleccione un cliente' : 'Seleccionar variedad'}
                      </option>
                      {variedadesFiltradas.map((variety, index) => (
                        <option key={index} value={variety}>
                          {variety}
                        </option>
                      ))}
                    </Select>
                    {formData.client && (
                      <FieldHint>
                        {variedadesFiltradas.length} variedad(es) disponible(s) para {formData.client}
                      </FieldHint>
                    )}
                  </FormGroup>

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
                      {presentacionesFiltradas.map((presentacion, index) => (
                        <option key={index} value={presentacion}>
                          {presentacion}
                        </option>
                      ))}
                    </Select>
                    {formData.client && (
                      <FieldHint>
                        {presentacionesFiltradas.length} presentación(es) disponible(s)
                      </FieldHint>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      required
                      disabled={!formData.client}
                    >
                      <option value="">
                        {!formData.client ? 'Primero seleccione un cliente' : 'Seleccionar tipo'}
                      </option>
                      {tiposFiltrados.map((tipo, index) => (
                        <option key={index} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </Select>
                    {formData.client && tiposFiltrados.length === 1 && (
                      <FieldHint $warning>
                        ⚠️ Este cliente solo maneja producto {tiposFiltrados[0]}
                      </FieldHint>
                    )}
                  </FormGroup>

                  <FormGroup $fullWidth>
                    <Label>Formato Generado</Label>
                    <FormatoDisplay $hasValue={!!formData.format}>
                      {formData.format || 'Complete los campos anteriores para generar el formato'}
                    </FormatoDisplay>
                    <FormatoHint>
                      Formato: CLIENTE - VARIEDAD PRESENTACIÓN TIPO
                    </FormatoHint>
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormSection>
                <SectionTitleRow>
                  <SectionTitle>Insumos Requeridos ({formData.supplies.length})</SectionTitle>
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
                  setEditingReception(null);
                  resetForm();
                }}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={submitting}>
                  <IoSaveOutline size={16} />
                  {submitting ? 'Guardando...' : (editingReception ? "Actualizar" : "Guardar")} Recepción
                </PrimaryButton>
              </FormActions>
            </Form>
          </ModalContent>
        </Modal>
      )}

      <ContentCard>
        <CardHeader>
          <CardTitle>Entradas Registradas</CardTitle>
          <CardSubtitle>{displayReceptions.length} recepciones en total</CardSubtitle>
        </CardHeader>

        {loading && displayReceptions.length === 0 ? (
          <EmptyState>
            <IoRefreshOutline size={48} />
            <EmptyTitle>Cargando recepciones...</EmptyTitle>
          </EmptyState>
        ) : displayReceptions.length === 0 ? (
          <EmptyState>
            <IoDocumentTextOutline size={48} />
            <EmptyTitle>No hay recepciones registradas</EmptyTitle>
            <EmptyText>Comience creando su primera recepción de insumos</EmptyText>
          </EmptyState>
        ) : (
          <ReceptionsList>
            {displayReceptions.map(reception => (
              <ReceptionCard key={reception.id}>
                <ReceptionHeader>
                  <ReceptionInfo>
                    <ReceptionTitle>
                      {reception.format || `${reception.client} - Recepción`}
                    </ReceptionTitle>
                    <ReceptionDetails>
                      <Detail>
                        <IoCalendarOutline size={14} />
                        {reception.date}
                      </Detail>
                      <Detail>Orden: {reception.shippingOrder}</Detail>
                      {reception.lote && <Detail>Lote: {reception.lote}</Detail>}
                      <Detail>Insumos: {reception.supplies?.length || 0}</Detail>
                      {reception.estado && (
                        <StatusBadge $estado={reception.estado}>
                          {reception.estado}
                        </StatusBadge>
                      )}
                    </ReceptionDetails>
                  </ReceptionInfo>
                  <ReceptionActions>
                    <IconButton 
                      onClick={() => handlePreviewPDF(reception)}
                      title="Ver PDF"
                      disabled={generatingPDF === reception.id}
                    >
                      {generatingPDF === reception.id ? (
                        <SmallSpinner />
                      ) : (
                        <IoEyeOutline size={16} />
                      )}
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => handleDownloadPDF(reception)}
                      title="Descargar PDF"
                      disabled={generatingPDF === reception.id}
                    >
                      <IoDownloadOutline size={16} />
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => handlePrintPDF(reception)}
                      title="Imprimir"
                      disabled={generatingPDF === reception.id}
                    >
                      <IoPrintOutline size={16} />
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => editReception(reception)}
                      title="Editar"
                    >
                      <IoDocumentTextOutline size={16} />
                    </IconButton>
                    
                    <IconButton
                      $danger
                      onClick={() => handleDeleteReception(reception.id)}
                      title="Eliminar"
                    >
                      <IoTrashOutline size={16} />
                    </IconButton>
                  </ReceptionActions>
                </ReceptionHeader>

                <SuppliesPreview>
                  {reception.supplies?.slice(0, 3).map((supply, index) => (
                    <SupplyTag key={index}>
                      {supply.name}: {supply.quantity}
                    </SupplyTag>
                  ))}
                  {reception.supplies?.length > 3 && (
                    <SupplyTag $more>+{reception.supplies.length - 3} más</SupplyTag>
                  )}
                </SuppliesPreview>
              </ReceptionCard>
            ))}
          </ReceptionsList>
        )}
      </ContentCard>

      {/* Modal para crear insumos faltantes */}
      {showCreateInsumosModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                <IoWarningOutline style={{ color: '#d97706' }} />
                Inventario Faltante
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowCreateInsumosModal(false);
                setInsumosFaltantes([]);
                setPendingReceptionData(null);
                setSubmitting(false);
              }}>×</CloseButton>
            </ModalHeader>

            <AlertModalBody>
              <AlertMessage>
                No se encontró inventario para los siguientes insumos:
              </AlertMessage>

              <MissingItemsList>
                {insumosFaltantes.map((item, index) => (
                  <MissingItem key={index}>
                    <MissingItemIcon>📦</MissingItemIcon>
                    <MissingItemInfo>
                      <MissingItemName>{item.notas}</MissingItemName>
                      <MissingItemCategory>Categoría: {item.categoriaNombre || 'Desconocida'}</MissingItemCategory>
                    </MissingItemInfo>
                  </MissingItem>
                ))}
              </MissingItemsList>

              <AlertQuestion>
                ¿Desea crear automáticamente estos registros en el inventario?
              </AlertQuestion>

              <AlertNote>
                Los registros se crearán con stock inicial de 0 y se actualizarán al registrar la recepción.
              </AlertNote>
            </AlertModalBody>

            <FormActions>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setShowCreateInsumosModal(false);
                  setInsumosFaltantes([]);
                  setPendingReceptionData(null);
                  setSubmitting(false);
                }}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleCreateMissingInventory}
                disabled={submitting}
              >
                <IoSaveOutline size={16} />
                {submitting ? 'Creando...' : 'Crear Registros'}
              </PrimaryButton>
            </FormActions>
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
  padding: 1.5rem;
  transition: background 0.3s ease;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
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
  flex-wrap: wrap;
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

const InfoMessage = styled.div`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #93c5fd;
  font-size: 0.875rem;
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

const SmallSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.bg3};
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ClientConfigBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
`;

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    background: ${props => props.theme.bg2};
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

const FieldHint = styled.div`
  font-size: 0.7rem;
  color: ${props => props.$warning ? '#d97706' : props.theme.texttertiary};
  margin-top: 0.25rem;
  font-style: italic;
`;

const FormatoDisplay = styled.div`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.$hasValue ? '#10b981' : props.theme.bg3};
  border-radius: 6px;
  font-size: 0.95rem;
  background: ${props => props.$hasValue ? '#ecfdf5' : props.theme.bg2};
  color: ${props => props.$hasValue ? '#065f46' : props.theme.texttertiary};
  min-height: 42px;
  display: flex;
  align-items: center;
  font-weight: ${props => props.$hasValue ? '600' : '400'};
  transition: all 0.2s;
`;

const FormatoHint = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.texttertiary};
  margin-top: 0.25rem;
  font-style: italic;
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
  grid-template-columns: 2fr 1fr;
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
  padding: 1rem 1.5rem;
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

const ReceptionsList = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReceptionCard = styled.div`
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

const ReceptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ReceptionInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ReceptionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin: 0 0 0.5rem 0;
  transition: color 0.3s ease;
`;

const ReceptionDetails = styled.div`
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

const ReceptionActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  min-width: 32px;
  min-height: 32px;
  
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

// Alert Modal para crear insumos
const AlertModalBody = styled.div`
  padding: 1.5rem;
`;

const AlertMessage = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.textprimary};
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const MissingItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: ${props => props.theme.bg};
  border-radius: 8px;
`;

const MissingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.bgtgderecha};
  border-radius: 8px;
  border-left: 3px solid #d97706;
`;

const MissingItemIcon = styled.div`
  font-size: 1.5rem;
`;

const MissingItemInfo = styled.div`
  flex: 1;
`;

const MissingItemName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.textprimary};
  margin-bottom: 0.25rem;
`;

const MissingItemCategory = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
`;

const AlertQuestion = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.textprimary};
  font-weight: 600;
  margin-bottom: 1rem;
`;

const AlertNote = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.texttertiary};
  padding: 0.75rem;
  background: ${props => props.theme.bg2};
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
`;

export default Reception;