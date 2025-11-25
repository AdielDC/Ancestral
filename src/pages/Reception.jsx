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
import { useRecepciones } from "../hooks/useRecepciones";
import { recepcionService } from "../services/recepcionService";
import { clienteService, presentacionService, categoriaService, inventarioService } from "../services/inventarioService";

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

export function Reception() {
  const { theme } = useContext(ThemeContext);
  const [showForm, setShowForm] = useState(false);
  const [editingReception, setEditingReception] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef();

  // Estados para datos del backend
  const [clientes, setClientes] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Modal para crear insumos faltantes
  const [showCreateInsumosModal, setShowCreateInsumosModal] = useState(false);
  const [insumosFaltantes, setInsumosFaltantes] = useState([]);
  const [pendingReceptionData, setPendingReceptionData] = useState(null);

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
          clienteService.getAll(),
          presentacionService.getAll()
        ]);

        const clientesData = clientesRes.data || clientesRes || [];
        const presentacionesData = presentacionesRes.data || presentacionesRes || [];

        setClientes(clientesData);
        setPresentaciones(presentacionesData);

        console.log('✅ Clientes cargados:', clientesData);
        console.log('✅ Presentaciones cargadas:', presentacionesData);
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
      quantity: ""
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

  // ==================== FUNCIÓN ACTUALIZADA PARA MAPEO DE CATEGORÍAS ====================
  // Función mejorada para mapear nombre de insumo a categoría ESPECÍFICA
  const getCategoriaForInsumo = (nombreInsumo, presentacion = '') => {
    const nombreUpper = nombreInsumo.toUpperCase().trim();

    console.log('🔍 Buscando categoría exacta para:', nombreInsumo, '| Presentación:', presentacion);

    // ========== BOTELLAS CON PRESENTACIÓN ==========
    if (nombreUpper.includes('BOTELLA') && nombreUpper.includes('CAJA')) {
      // Extraer presentación del nombre del insumo
      let presentacionEnNombre = presentacion;

      // Intentar extraer del nombre si no se pasó como parámetro
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
      // Determinar si es Exportación o Nacional
      const esExportacion = nombreUpper.includes('EXPORTACIÓN') || nombreUpper.includes('EXPORTACION');
      const tipo = esExportacion ? 'EXPORTACIÓN' : 'NACIONAL';

      // Extraer presentación
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

  // ==================== FUNCIÓN ACTUALIZADA PARA CONVERTIR AL FORMATO BACKEND ====================
  // Convertir del formato original al formato del backend
  const convertToBackendFormat = async (data, autoCreateMissing = false) => {
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

      // Log de los primeros items para debug
      if (inventarioData.length > 0) {
        console.log('📋 Primeros 3 items del inventario:');
        inventarioData.slice(0, 3).forEach(item => {
          console.log({
            id: item.id,
            categoria: item.categoria?.nombre || item.CATEGORIA_INSUMO?.nombre,
            tipo: item.tipo,
            presentacion: item.presentacion?.volumen || item.PRESENTACION?.volumen,
            codigo: item.codigo_lote
          });
        });
      }
    } catch (err) {
      console.error('❌ Error cargando inventario:', err);
    }

    // Procesar cada insumo para encontrar su inventario_id
    const detallesPromises = data.supplies.map(async (supply) => {
      // Obtener nombre exacto de categoría
      const categoriaNombreExacto = getCategoriaForInsumo(supply.name, data.presentation);

      if (!categoriaNombreExacto) {
        console.warn(`⚠️ No se encontró categoría exacta para insumo: ${supply.name}`);
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

      console.log(`🔎 Buscando en inventario con categoría exacta: "${categoriaNombreExacto}"`);

      // Buscar en el inventario con el nombre EXACTO de la categoría
      const itemInventario = inventarioData.find(item => {
        const itemCategoria = item.categoria || item.CATEGORIA_INSUMO;
        const itemCliente = item.cliente || item.CLIENTE;
        const itemPresentacion = item.presentacion || item.PRESENTACION;

        // Comparación EXACTA del nombre de categoría
        const matchCategoria = itemCategoria?.nombre === categoriaNombreExacto;
        const matchCliente = itemCliente?.nombre === data.client;
        const matchTipo = item.tipo === data.type;

        console.log(`  🔍 Verificando item ${item.id}:`);
        console.log(`      Categoría item:`, itemCategoria?.nombre);
        console.log(`      Categoría buscada:`, categoriaNombreExacto);
        console.log(`      Match categoría:`, matchCategoria);
        console.log(`      Cliente item:`, itemCliente?.nombre);
        console.log(`      Cliente buscado:`, data.client);
        console.log(`      Match cliente:`, matchCliente);
        console.log(`      Tipo item:`, item.tipo);
        console.log(`      Tipo buscado:`, data.type);
        console.log(`      Match tipo:`, matchTipo);
        console.log(`      ¿Coincide TODO?:`, matchCategoria && matchCliente && matchTipo);

        return matchCategoria && matchCliente && matchTipo;
      });

      if (!itemInventario) {
        console.warn(`⚠️ No se encontró inventario para: ${supply.name} (categoría: ${categoriaNombreExacto})`);

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

      console.log(`✅ Inventario encontrado para ${supply.name}: ID=${itemInventario.id}, Categoría="${itemInventario.categoria?.nombre || itemInventario.CATEGORIA_INSUMO?.nombre}"`);

      return {
        inventario_id: itemInventario.id,
        cantidad: parseInt(supply.quantity) || 0,
        unidad: "unidades",
        notas: supply.name,
        missing: false
      };
    });

    const detalles = await Promise.all(detallesPromises);

    // Separar detalles válidos e inválidos
    const detallesValidos = detalles.filter(d => d.inventario_id !== null);
    const detallesInvalidos = detalles.filter(d => d.inventario_id === null);

    // Si hay insumos faltantes y no es auto-creación
    if (detallesInvalidos.length > 0 && !autoCreateMissing) {
      console.log('⚠️ Inventario faltante detectado:', detallesInvalidos);

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
      notas_adicionales: `${data.format}\n\n${data.additionalNotes}\n\nResponsable: ${data.responsibleRegistry}`,
      usuario_id: localStorage.getItem('usuario_id') || 1,
      detalles: detallesValidos
    };
  };

  // Convertir del formato backend al formato original
  const convertFromBackendFormat = (backendData) => {
    const notasParts = (backendData.notas_adicionales || "").split('\n\n');
    const format = notasParts[0] || "";
    const additionalNotes = notasParts[1] || "";
    const responsibleLine = notasParts[2] || "";
    const responsibleRegistry = responsibleLine.replace('Responsable: ', '');

    const isExportacion = format.includes('Exportación');
    const type = isExportacion ? 'Exportación' : 'Nacional';

    const presentationMatch = format.match(/(\d+\s*(?:ML|L|ml|l))/i);
    const presentation = presentationMatch ? presentationMatch[1].toUpperCase() : "";

    return {
      date: backendData.fecha_recepcion.split('T')[0],
      responsibleRegistry: responsibleRegistry || "",
      client: backendData.cliente?.nombre || "",
      shippingOrder: backendData.orden_compra || "",
      variety: "ENSAMBLE",
      presentation: presentation,
      type: type,
      format: format,
      supplies: backendData.detalles?.map(d => ({
        name: d.notas || "",
        quantity: d.cantidad.toString()
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

      // Si hay error de inventario faltante
      if (backendData.error === 'MISSING_INVENTORY') {
        console.log('⚠️ Inventario faltante detectado:', backendData.missingItems);

        setPendingReceptionData(backendData.formData);
        setInsumosFaltantes(backendData.missingItems);
        setShowCreateInsumosModal(true);
        setSubmitting(false);
        return;
      }

      console.log('📤 Enviando recepción al backend:', backendData);

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
      alert('Error al cargar la recepción');
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

  // ==================== FUNCIÓN ACTUALIZADA PARA CREAR INVENTARIO FALTANTE ====================
  // Crear registros de inventario faltantes
  const handleCreateMissingInventory = async () => {
    setSubmitting(true);

    try {
      console.log('📝 Creando registros de inventario faltantes...');

      const clienteId = clientes.find(c => c.nombre === pendingReceptionData.client)?.id;
      const presentacionId = presentaciones.find(p => p.volumen === pendingReceptionData.presentation)?.id;

      const categoriasResponse = await categoriaService.getAll();
      const categoriasData = categoriasResponse.data || categoriasResponse;

      console.log('📋 Categorías disponibles:', categoriasData.length);

      const createdItems = [];

      for (const item of insumosFaltantes) {
        console.log(`\n🔍 Buscando categoría exacta: "${item.categoriaNombre}"`);

        // Buscar por nombre EXACTO
        const categoria = categoriasData.find(c => c.nombre === item.categoriaNombre);

        if (!categoria) {
          console.warn(`⚠️ Categoría no encontrada: "${item.categoriaNombre}"`);
          console.log('Primeras 5 categorías disponibles:', categoriasData.slice(0, 5).map(c => c.nombre));
          continue;
        }

        console.log(`✅ Categoría encontrada: ID=${categoria.id}, Nombre="${categoria.nombre}"`);

        // Generar código de lote único
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        const prefijo = categoria.nombre.substring(0, 3).toUpperCase().replace(/\s/g, '');
        const codigoLote = `REC-${prefijo}-${timestamp}-${randomSuffix}`;

        // Determinar si necesita presentacion_id
        const necesitaPresentacion = categoria.nombre.includes('BOTELLA') ||
          categoria.nombre.includes('ETIQUETA');

        const nuevoInventario = {
          categoria_insumo_id: categoria.id,
          cliente_id: clienteId,
          presentacion_id: necesitaPresentacion ? presentacionId : null,
          tipo: pendingReceptionData.type,
          codigo_lote: codigoLote,
          stock: 0,
          stock_minimo: 100,
          unidad: 'unidades',
          activo: true
        };

        console.log('📦 Creando inventario:', nuevoInventario);

        const response = await inventarioService.create(nuevoInventario);

        if (response.success || response.data) {
          createdItems.push(response.data || response);
          console.log(`✅ Inventario creado: ${item.notas} (ID: ${response.data?.id || response.id})`);
        }
      }

      showToast(
        `${createdItems.length} registro(s) de inventario creados`,
        'success',
        createdItems.slice(0, 3).map(item => ({
          id: item.id,
          CATEGORIA_INSUMO: { nombre: item.categoria?.nombre || item.CATEGORIA_INSUMO?.nombre || 'Insumo' },
          codigo_lote: item.codigo_lote,
          stock: item.stock,
          unidad: item.unidad
        }))
      );

      setShowCreateInsumosModal(false);

      // Esperar un momento para que el backend procese
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🔄 Reintentando guardar recepción con inventario actualizado...');

      // Reintentar crear la recepción
      const backendData = await convertToBackendFormat(pendingReceptionData, true);

      if (backendData.error === 'MISSING_INVENTORY') {
        showToast('Aún faltan algunos insumos en el inventario', 'warning');
        return;
      }

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Formato de Recibo de Insumos</title>
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

  const generatePrintableContent = (reception) => {
    const displayData = reception.supplies ? reception : convertFromBackendFormat(reception);

    return (
      <PrintContainer ref={printRef}>
        <PrintHeader>
          <Logo>RM</Logo>
          <TitleSection>
            <CompanyName>ENVASADORA ANCESTRAL</CompanyName>
            <DocumentTitle>FORMATO DE RECIBO DE INSUMOS</DocumentTitle>
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
              <InfoCell></InfoCell>
            </tr>
          </tbody>
        </InfoTable>

        <RequirementsTitle>REQUERIMIENTOS:</RequirementsTitle>

        <SuppliesTable>
          <thead>
            <tr>
              <SuppliesHeader>NOMBRE DEL INSUMO</SuppliesHeader>
              <SuppliesHeader>CANTIDAD</SuppliesHeader>
            </tr>
          </thead>
          <tbody>
            {displayData.supplies.map((supply, index) => (
              <tr key={index}>
                <SuppliesCell>{supply.name}</SuppliesCell>
                <SuppliesCell>{supply.quantity}</SuppliesCell>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - displayData.supplies.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
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
          <CardTitle>Recepciones Registradas</CardTitle>
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
                      {reception.client} - {reception.format}
                    </ReceptionTitle>
                    <ReceptionDetails>
                      <Detail>
                        <IoCalendarOutline size={14} />
                        {reception.date}
                      </Detail>
                      <Detail>Orden: {reception.shippingOrder}</Detail>
                      <Detail>Insumos: {reception.supplies?.length || 0}</Detail>
                      {reception.estado && (
                        <StatusBadge $estado={reception.estado}>
                          {reception.estado}
                        </StatusBadge>
                      )}
                    </ReceptionDetails>
                  </ReceptionInfo>
                  <ReceptionActions>
                    <IconButton onClick={() => {
                      generatePrintableContent(reception);
                      handlePrint();
                    }}>
                      <IoPrintOutline size={16} />
                    </IconButton>
                    <IconButton onClick={() => editReception(reception)}>
                      <IoDocumentTextOutline size={16} />
                    </IconButton>
                    <IconButton
                      $danger
                      onClick={() => handleDeleteReception(reception.id)}
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

      <div style={{ display: 'none' }}>
        {editingReception && generatePrintableContent(editingReception)}
      </div>

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
`;

const ReceptionInfo = styled.div`
  flex: 1;
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
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.bg2};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.bg3};
    border-radius: 3px;
  }
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