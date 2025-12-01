// pdfService.js - Servicio para generación de PDFs con jsPDF
// Ubicación: src/services/pdfService.js

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importar el logo desde assets
import logoImage from '../assets/logo.png';

/**
 * Configuración general del PDF
 */
const PDF_CONFIG = {
  pageWidth: 210,
  pageHeight: 297,
  margin: {
    left: 20,
    right: 20,
    top: 15,
    bottom: 25
  },
  fonts: {
    title: 14,
    subtitle: 11,
    normal: 9,
    small: 8
  }
};

/**
 * Convierte una imagen a base64
 */
const getImageBase64 = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
};

/**
 * Dibuja el encabezado del documento
 */
const drawHeader = async (doc, formatTitle, documentType = 'RECIBO') => {
  const { margin, pageWidth, fonts } = PDF_CONFIG;
  
  let yPos = margin.top;
  
  // Intentar cargar el logo
  try {
    const logoBase64 = await getImageBase64(logoImage);
    doc.addImage(logoBase64, 'PNG', margin.left, yPos, 28, 28);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
    // Placeholder si no hay logo
    doc.setFillColor(30, 30, 30);
    doc.circle(margin.left + 14, yPos + 14, 14, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ANCESTRAL', margin.left + 14, yPos + 15, { align: 'center' });
  }
  
  // Título "ENVASADORA ANCESTRAL" alineado a la derecha
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(fonts.title + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('ENVASADORA ANCESTRAL', pageWidth - margin.right, yPos + 12, { align: 'right' });
  
  // Línea decorativa bajo el título de la empresa
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(pageWidth - margin.right - 65, yPos + 16, pageWidth - margin.right, yPos + 16);
  
  yPos += 45;
  
  // Título del documento centrado
  doc.setFontSize(fonts.title + 2);
  doc.setFont('helvetica', 'bold');
  const docTitle = documentType === 'ENTREGA' ? 'FORMATO DE ENTREGA DE INSUMOS' : 'FORMATO DE RECIBO DE INSUMOS';
  doc.text(docTitle, pageWidth / 2, yPos, { align: 'center' });
  
  // Línea horizontal bajo el título del documento
  yPos += 4;
  doc.setLineWidth(1);
  doc.line(margin.left, yPos, pageWidth - margin.right, yPos);
  
  yPos += 10;
  
  // Subtítulo con formato del producto
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(formatTitle, pageWidth / 2, yPos, { align: 'center' });
  
  return yPos + 10;
};

/**
 * Dibuja la tabla de información general
 */
const drawInfoTable = (doc, data, startY) => {
  const { margin, pageWidth, fonts } = PDF_CONFIG;
  const contentWidth = pageWidth - margin.left - margin.right;
  
  let yPos = startY;
  const rowHeight = 6.5;
  const labelWidth = 55;
  
  doc.setFontSize(fonts.normal);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  
  const infoRows = [
    { label: 'FECHA:', value: data.date || '' },
    { label: 'RESPONSABLE DEL REGISTRO:', value: data.responsibleRegistry || '' },
    { label: 'CLIENTE:', value: data.client || '' },
    { label: 'ORDEN DE ENVASADO:', value: data.shippingOrder || '' },
    { label: 'LOTE:', value: data.lote || '' }
  ];
  
  infoRows.forEach((row) => {
    // Borde superior de la fila
    doc.line(margin.left, yPos, margin.left + contentWidth, yPos);
    
    // Bordes verticales
    doc.line(margin.left, yPos, margin.left, yPos + rowHeight);
    doc.line(margin.left + labelWidth, yPos, margin.left + labelWidth, yPos + rowHeight);
    doc.line(margin.left + contentWidth, yPos, margin.left + contentWidth, yPos + rowHeight);
    
    // Texto de etiqueta
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(row.label, margin.left + 2, yPos + 4.5);
    
    // Texto de valor
    doc.setFont('helvetica', 'normal');
    doc.text(row.value, margin.left + labelWidth + 3, yPos + 4.5);
    
    yPos += rowHeight;
  });
  
  // Borde inferior de la última fila
  doc.line(margin.left, yPos, margin.left + contentWidth, yPos);
  
  return yPos + 6;
};

/**
 * Dibuja la tabla de insumos/requerimientos
 */
const drawSuppliesTable = (doc, supplies, startY, includeMerma = false) => {
  const { margin, pageWidth, fonts } = PDF_CONFIG;
  const contentWidth = pageWidth - margin.left - margin.right;
  
  let yPos = startY;
  
  // Título "REQUERIMIENTOS:"
  doc.setFontSize(fonts.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REQUERIMIENTOS:', margin.left, yPos);
  
  yPos += 5;
  
  // Preparar datos para la tabla
  const tableData = supplies.map(supply => {
    if (includeMerma) {
      return [supply.name || '', supply.quantity || '', supply.merma || ''];
    }
    return [supply.name || '', supply.quantity || ''];
  });
  
  // Agregar filas vacías para completar (menos filas para dejar espacio)
  const minRows = 10;
  while (tableData.length < minRows) {
    if (includeMerma) {
      tableData.push(['', '', '']);
    } else {
      tableData.push(['', '']);
    }
  }
  
  // Configurar encabezados y columnas
  const headers = includeMerma 
    ? [['NOMBRE DEL INSUMO', 'CANTIDAD', 'MERMA']]
    : [['NOMBRE DEL INSUMO', 'CANTIDAD']];
  
  const columnStyles = includeMerma 
    ? {
        0: { cellWidth: contentWidth * 0.55, halign: 'left' },
        1: { cellWidth: contentWidth * 0.225, halign: 'center' },
        2: { cellWidth: contentWidth * 0.225, halign: 'center' }
      }
    : {
        0: { cellWidth: contentWidth * 0.70, halign: 'left' },
        1: { cellWidth: contentWidth * 0.30, halign: 'center' }
      };
  
  // Generar tabla con autoTable
  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: tableData,
    margin: { left: margin.left, right: margin.right },
    styles: {
      fontSize: fonts.normal,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
      minCellHeight: 6
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.3
    },
    bodyStyles: {
      fillColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: columnStyles,
    theme: 'grid',
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.3
  });
  
  return doc.lastAutoTable.finalY + 8;
};

/**
 * Dibuja la sección de notas adicionales (SIN cuadro, solo título)
 */
const drawNotesSection = (doc, notes, startY) => {
  const { margin, pageWidth, fonts } = PDF_CONFIG;
  const contentWidth = pageWidth - margin.left - margin.right;
  
  let yPos = startY;
  
  // Título en negrita
  doc.setFontSize(fonts.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('NOTAS ADICIONALES:', margin.left, yPos);
  
  // Contenido de las notas (si hay)
  if (notes && notes.trim()) {
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fonts.small);
    const splitNotes = doc.splitTextToSize(notes, contentWidth);
    doc.text(splitNotes, margin.left + 2, yPos);
    yPos += splitNotes.length * 4;
  }
  
  return yPos + 15;
};

/**
 * Dibuja la sección de firmas
 */
const drawSignatures = (doc, data, startY) => {
  const { margin, pageWidth, fonts } = PDF_CONFIG;
  
  let yPos = startY;
  const signatureWidth = 70;
  const spacing = 50;
  
  // Calcular posiciones centradas
  const totalWidth = (signatureWidth * 2) + spacing;
  const startX = (pageWidth - totalWidth) / 2;
  const leftSignatureX = startX;
  const rightSignatureX = startX + signatureWidth + spacing;
  
  // Líneas de firma
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftSignatureX, yPos, leftSignatureX + signatureWidth, yPos);
  doc.line(rightSignatureX, yPos, rightSignatureX + signatureWidth, yPos);
  
  yPos += 5;
  
  // Etiquetas de firma
  doc.setFontSize(fonts.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('ENTREGA', leftSignatureX + signatureWidth / 2, yPos, { align: 'center' });
  doc.text('RECIBE', rightSignatureX + signatureWidth / 2, yPos, { align: 'center' });
  
  // Nombres (si están disponibles)
  if (data.deliveredBy || data.receivedBy) {
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fonts.small);
    
    if (data.deliveredBy) {
      doc.text(data.deliveredBy, leftSignatureX + signatureWidth / 2, yPos, { align: 'center' });
    }
    
    if (data.receivedBy) {
      doc.text(data.receivedBy, rightSignatureX + signatureWidth / 2, yPos, { align: 'center' });
    }
  }
  
  return yPos + 10;
};

/**
 * Dibuja el pie de página
 */
const drawFooter = (doc) => {
  const { pageWidth, pageHeight, fonts } = PDF_CONFIG;
  
  const footerHeight = 12;
  const footerY = pageHeight - footerHeight;
  
  // Barra negra de fondo
  doc.setFillColor(0, 0, 0);
  doc.rect(0, footerY, pageWidth, footerHeight, 'F');
  
  // Texto del footer en blanco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(fonts.small - 1);
  doc.setFont('helvetica', 'normal');
  
  const footerText1 = 'Prolongación Pinos #110, Eucaliptos, Pueblo Nuevo, Oaxaca de Juárez, Oax. C.P.: 68274';
  const footerText2 = 'contacto@envasadoraancestral.mx     Tel.: 951 750 6689';
  
  doc.text(footerText1, pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text(footerText2, pageWidth / 2, footerY + 8, { align: 'center' });
};

/**
 * Genera un PDF de recepción de insumos
 */
export const generateRecepcionPDF = async (data) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Dibujar todas las secciones
  let yPosition = await drawHeader(doc, data.format || '', 'RECIBO');
  yPosition = drawInfoTable(doc, data, yPosition);
  yPosition = drawSuppliesTable(doc, data.supplies || [], yPosition, false);
  yPosition = drawNotesSection(doc, data.additionalNotes || '', yPosition);
  
  // Calcular posición de firmas (asegurar que haya espacio antes del footer)
  const footerY = PDF_CONFIG.pageHeight - 25;
  const firmasY = Math.min(yPosition, footerY - 25);
  
  drawSignatures(doc, data, firmasY);
  drawFooter(doc);
  
  return doc;
};

/**
 * Genera un PDF de entrega de insumos (incluye columna de merma)
 */
export const generateEntregaPDF = async (data) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let yPosition = await drawHeader(doc, data.format || '', 'ENTREGA');
  yPosition = drawInfoTable(doc, data, yPosition);
  yPosition = drawSuppliesTable(doc, data.supplies || [], yPosition, true);
  yPosition = drawNotesSection(doc, data.additionalNotes || '', yPosition);
  
  // Calcular posición de firmas
  const footerY = PDF_CONFIG.pageHeight - 25;
  const firmasY = Math.min(yPosition, footerY - 25);
  
  drawSignatures(doc, data, firmasY);
  drawFooter(doc);
  
  return doc;
};

/**
 * Genera y descarga el PDF de recepción
 */
export const downloadRecepcionPDF = async (data, filename = null) => {
  const doc = await generateRecepcionPDF(data);
  const clientName = (data.client || 'Cliente').replace(/\s+/g, '_');
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const defaultFilename = `Recepcion_${clientName}_${dateStr}.pdf`;
  doc.save(filename || defaultFilename);
};

/**
 * Genera y descarga el PDF de entrega
 */
export const downloadEntregaPDF = async (data, filename = null) => {
  const doc = await generateEntregaPDF(data);
  const clientName = (data.client || 'Cliente').replace(/\s+/g, '_');
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const defaultFilename = `Entrega_${clientName}_${dateStr}.pdf`;
  doc.save(filename || defaultFilename);
};

/**
 * Abre el PDF de recepción en una nueva pestaña
 */
export const previewRecepcionPDF = async (data) => {
  const doc = await generateRecepcionPDF(data);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Abre el PDF de entrega en una nueva pestaña
 */
export const previewEntregaPDF = async (data) => {
  const doc = await generateEntregaPDF(data);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Obtiene el PDF como base64
 */
export const getPDFBase64 = async (data, type = 'recepcion') => {
  const doc = type === 'entrega' 
    ? await generateEntregaPDF(data) 
    : await generateRecepcionPDF(data);
  return doc.output('datauristring');
};

/**
 * Obtiene el PDF como Blob
 */
export const getPDFBlob = async (data, type = 'recepcion') => {
  const doc = type === 'entrega' 
    ? await generateEntregaPDF(data) 
    : await generateRecepcionPDF(data);
  return doc.output('blob');
};

export default {
  generateRecepcionPDF,
  generateEntregaPDF,
  downloadRecepcionPDF,
  downloadEntregaPDF,
  previewRecepcionPDF,
  previewEntregaPDF,
  getPDFBase64,
  getPDFBlob
};