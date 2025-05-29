// src/types/jspdf-autotable.d.ts
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number }; // Add other properties if needed
  }
}
