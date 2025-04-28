import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { FileDown } from 'lucide-react';
import { StatisticsPDF } from './StatisticsPDF';

interface PDFComponentsProps {
  readings: any[];
  stats: {
    average: number;
    highest: number;
    lowest: number;
    total: number;
    totalInsulin: number;
  };
  userName: string;
}

const PDFComponents: React.FC<PDFComponentsProps> = ({ readings, stats, userName }) => {
  return (
    <PDFDownloadLink
      document={
        <StatisticsPDF
          readings={readings}
          stats={stats}
          userName={userName}
        />
      }
      fileName={`glimind-relatorio-${format(new Date(), 'dd-MM-yyyy')}.pdf`}
      className="w-full flex items-center justify-center space-x-2 p-4 bg-accent-600 hover:bg-accent-700 rounded-lg text-white font-medium transition-colors"
    >
      {({ loading: pdfLoading }) => (
        <>
          {pdfLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileDown className="w-5 h-5" />
          )}
          <span>Exportar Relatório PDF</span>
        </>
      )}
    </PDFDownloadLink>
  );
};

export default PDFComponents;