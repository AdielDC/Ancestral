import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiAlertTriangle, 
  FiPackage, 
  FiRefreshCw, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp
} from 'react-icons/fi';
import { inventarioService } from '../services/inventarioService';
import { toast } from 'react-hot-toast';

export function Alerts() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAlerta, setExpandedAlerta] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventarioService.getAlertas();

      if (response.success && response.data) {
        setAlertas(response.data);
        toast.success(`Se cargaron ${response.data.length} alertas`);
      } else {
        setError("No se pudieron cargar las alertas");
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  };

  const getTipoAlertaColor = (tipo) => {
    if (tipo === "stock_critico") return "#ef4444";
    if (tipo === "stock_bajo") return "#f59e0b";
    return "#3b82f6";
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
    });
  };

  return (
    <Container>
      <Header>
        <Title>Alertas del Sistema</Title>

        <ReloadButton onClick={cargarAlertas}>
          <FiRefreshCw size={18} />
          Recargar
        </ReloadButton>
      </Header>

      {/* LISTADO DE ALERTAS */}
      <AlertasList>
        {loading ? (
          <LoadingMsg>Cargando alertas...</LoadingMsg>
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : alertas.length === 0 ? (
          <EmptyState>
            <FiPackage size={40} />
            <p>No hay alertas registradas</p>
          </EmptyState>
        ) : (
          alertas.map((alerta) => (
            <AlertaCard
              key={alerta.id}
              onClick={() =>
                setExpandedAlerta(
                  expandedAlerta === alerta.id ? null : alerta.id
                )
              }
            >
              <AlertaHeader>
                <AlertaTipo color={getTipoAlertaColor(alerta.tipo_alerta)}>
                  <FiAlertTriangle />
                  {getTipoAlertaText(alerta.tipo_alerta)}
                </AlertaTipo>
                <Fecha>{formatFecha(alerta.fecha_alerta || alerta.creado_en)}</Fecha>
              </AlertaHeader>

              <Mensaje>{alerta.mensaje}</Mensaje>

              {/* Detalles expandibles */}
              {expandedAlerta === alerta.id && alerta.INVENTARIO && (
                <Detalles>
                  <p>
                    <strong>Insumo:</strong> {alerta.INVENTARIO.nombre}
                  </p>
                  <p>
                    <strong>Categoría:</strong>{" "}
                    {alerta.INVENTARIO.CATEGORIA_INSUMO?.nombre}
                  </p>
                  <p>
                    <strong>Stock actual:</strong> {alerta.INVENTARIO.stock}{" "}
                    {alerta.INVENTARIO.unidad}
                  </p>
                </Detalles>
              )}

              <ExpandIcon>
                {expandedAlerta === alerta.id ? <FiChevronUp /> : <FiChevronDown />}
              </ExpandIcon>
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
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.4rem;
`;

const ReloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #d97706;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const AlertasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AlertaCard = styled.div`
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.bg3};
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.bg2};
  }
`;

const AlertaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const AlertaTipo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: ${(p) => p.color};
`;

const Fecha = styled.span`
  color: ${({ theme }) => theme.bg4};
  font-size: 0.8rem;
`;

const Mensaje = styled.p`
  margin: 0.3rem 0 0.6rem 0;
  color: ${({ theme }) => theme.text};
`;

const Detalles = styled.div`
  background: ${({ theme }) => theme.bg2};
  padding: 0.7rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const ExpandIcon = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: ${({ theme }) => theme.bg4};
`;

const LoadingMsg = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.bg4};
`;

const ErrorMsg = styled.p`
  text-align: center;
  color: #ef4444;
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.bg4};

  p {
    margin-top: 0.5rem;
    font-size: 1rem;
  }
`;
