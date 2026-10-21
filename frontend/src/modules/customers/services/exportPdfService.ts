import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function exportarReportePDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Elemento no encontrado para PDF:', elementId);
    return;
  }

  const wasHidden = element.classList.contains('hidden');
  const prevPosition = element.style.position;
  const prevLeft = element.style.left;
  const prevTop = element.style.top;
  const prevWidth = element.style.width;
  const prevDisplay = element.style.display;
  const prevZIndex = element.style.zIndex;

  if (wasHidden) {
    element.classList.remove('hidden');
    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.zIndex = '-9999';
    element.style.width = '840px';
    element.style.display = 'block';
  }

  try {
    const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.pdf-page'));
    const elementsToCapture = pageElements.length > 0 ? pageElements : [element];

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
      element.classList.add('hidden');
      element.style.position = prevPosition;
      element.style.left = prevLeft;
      element.style.top = prevTop;
      element.style.width = prevWidth;
      element.style.display = prevDisplay;
      element.style.zIndex = prevZIndex;
    }
  }
}
