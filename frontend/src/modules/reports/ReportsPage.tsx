import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Printer, CheckCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (format: 'csv' | 'pdf') => {
    setDownloading(format);
    const token = localStorage.getItem('salesia_token');
    const url = `/api/v1/reports/export/${format}`;

    // Create anchor with auth token
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `reporte_ventas_salesia.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setDownloading(null);
      })
      .catch((err) => {
        console.error(err);
        setDownloading(null);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centro de Reportes Empresariales</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generación y exportación de reportes tabulares y ejecutivos en formatos CSV y PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Reporte CSV */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Reporte Tabular de Ventas (CSV)</h3>
              <p className="text-xs text-slate-500">Dataset detallado con subtotales, impuestos, clientes y estado de cobro.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Ideal para auditorías externas, consolidación en hojas de cálculo y análisis avanzado en herramientas de BI.
          </p>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading === 'csv'}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'csv' ? 'Generando CSV...' : 'Descargar Archivo CSV'}</span>
          </button>
        </div>

        {/* Card 2: Reporte PDF */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Reporte Ejecutivo Formal (PDF)</h3>
              <p className="text-xs text-slate-500">Documento membretado con resumen gerencial y detalle de facturación.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Generado directamente en el backend mediante ReportLab con firmas de tiempo y parámetros de empresa.
          </p>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading === 'pdf'}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'pdf' ? 'Generando PDF...' : 'Descargar Documento PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
