import { Sale, Product, InventoryItem, Employee, Order, Customer } from '../../types';

export type ReportTab = 'gerencial' | 'comercial' | 'inventario' | 'vendedores';
export type ReportPeriod = 'HOY' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANUAL';

export interface CommercialReportRow {
  id: number;
  saleCode: string;
  customerName: string;
  salespersonName: string;
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  paymentStatus: string;
  itemsCount: number;
}

export interface InventoryReportRow {
  id: number;
  sku: string;
  name: string;
  category: string;
  physicalStock: number;
  availableStock: number;
  minStockAlert: number;
  costPrice: number;
  salePrice: number;
  totalValuation: number;
  status: 'OPTIMO' | 'CRITICO' | 'AGOTADO';
}

export interface SalespersonReportRow {
  id: number;
  name: string;
  jobTitle: string;
  monthlyTarget: number;
  salesAchieved: number;
  fulfillmentPct: number;
  commissionRate: number;
  commissionEarned: number;
  salesCount: number;
}

export interface ExecutiveReportParams {
  titulo: string;
  periodo: ReportPeriod;
  observaciones: string;
  incluirGerencial: boolean;
  incluirComercial: boolean;
  incluirInventario: boolean;
  incluirVendedores: boolean;
  kpis: {
    facturacionTotal: number;
    costoTotal: number;
    gananciaTotal: number;
    margenPromedio: number;
    cobradoTotal: number;
    pendienteTotal: number;
    valorizacionInventario: number;
    productosCriticosCount: number;
  };
  commercialRows: CommercialReportRow[];
  inventoryRows: InventoryReportRow[];
  salespersonRows: SalespersonReportRow[];
}
