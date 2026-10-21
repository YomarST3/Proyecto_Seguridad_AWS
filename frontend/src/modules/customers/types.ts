import { Customer, Sale, Order, UsuarioEmpresarial } from '../../types';

export interface IdeaMejora {
  id: number;
  area: string;
  diagnostico: string;
  accion: string;
  impacto: string;
}

export interface ProductReportItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  totalRevenue: number;
  avgPrice: number;
  pctRevenue: number;
  demandLevel: string;
}

export interface CustomerOperationItem {
  id: string;
  tipo: 'VENTA' | 'PEDIDO';
  codigo: string;
  fecha: string;
  vendedor: string;
  items: any[];
  total: number;
  estado: string;
  badgeColor: string;
}

export const DEFAULT_IDEAS_MEJORA: IdeaMejora[] = [
  {
    id: 1,
    area: 'Fidelización VIP & Cuentas Clave',
    diagnostico: 'Alta concentración de ingresos en el cliente destacado y primeros 3 compradores.',
    accion: 'Implementar acuerdos comerciales marco con bonificación por volumen y ejecutivo de cuenta asignado.',
    impacto: 'Garantizar el 60% de facturación recurrente y proteger las cuentas ante la competencia.'
  },
  {
    id: 2,
    area: 'Venta Cruzada (Cross-Selling)',
    diagnostico: 'Clientes que adquieren hardware principal registran baja incorporación de periféricos o garantías.',
    accion: 'Ofrecer paquetes promocionales integrados con 15% de descuento en periféricos al comprar equipos.',
    impacto: 'Incremento proyectado del ticket promedio de compra entre un 18% y 25%.'
  },
  {
    id: 3,
    area: 'Formalización a Persona Jurídica (RUC)',
    diagnostico: 'Múltiples clientes registrados como Persona Natural tienen volúmenes de consumo empresarial.',
    accion: 'Ofrecer incentivo tributario (factura electrónica) y línea de crédito comercial a 15 días.',
    impacto: 'Mayor facilidad de financiamiento, mayor ticket y acuerdos institucionales duraderos.'
  },
  {
    id: 4,
    area: 'Abastecimiento de Productos Top',
    diagnostico: 'Los productos con mayor rotación presentan una velocidad de venta acelerada quincenal.',
    accion: 'Ajustar el stock mínimo de seguridad a 45 días de cobertura con proveedores prioritarios.',
    impacto: 'Eliminar quiebres de stock en temporadas altas y garantizar entrega inmediata en 24h.'
  },
  {
    id: 5,
    area: 'Reactivación de Cuentas Inactivas',
    diagnostico: 'Clientes regulares sin órdenes registradas en las últimas cuatro semanas.',
    accion: 'Envío quincenal automatizado de catálogo con promociones especiales según su historial de compras.',
    impacto: 'Recuperar entre 10% y 15% de clientes sin incurrir en costes publicitarios adicionales.'
  }
];
