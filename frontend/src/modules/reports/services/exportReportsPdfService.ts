import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function exportarCentroReportesPDF(containerId: string, filename: string): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Contenedor no encontrado para PDF:', containerId);
    return;
  }

  const wasHidden = container.classList.contains('hidden');
  const prevPosition = container.style.position;
  const prevLeft = container.style.left;
  const prevTop = container.style.top;
  const prevWidth = container.style.width;
  const prevDisplay = container.style.display;
  const prevZIndex = container.style.zIndex;

  if (wasHidden) {
    container.classList.remove('hidden');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.zIndex = '-9999';
    container.style.width = '840px';
    container.style.display = 'block';
  }

  try {
    const pageElements = Array.from(container.querySelectorAll<HTMLElement>('.pdf-page'));
    const elementsToCapture = pageElements.length > 0 ? pageElements : [container];

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elementsToCapture.length; i++) {
      const pageEl = elementsToCapture[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    pdf.save(filename);
  } finally {
    if (wasHidden) {
      container.classList.add('hidden');
      container.style.position = prevPosition;
      container.style.left = prevLeft;
      container.style.top = prevTop;
      container.style.width = prevWidth;
      container.style.display = prevDisplay;
      container.style.zIndex = prevZIndex;
    }
  }
}
