'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { useRef } from 'react';

export function QrLabelGenerator({ batchId, productName, serial }: { batchId: string, productName: string, serial: string }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${batchId}`;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="brutal-card p-6 bg-white flex flex-col items-center max-w-sm mx-auto my-6 print-container">
      <div className="text-center mb-4 pb-4 border-b-2 border-black w-full print-header">
        <h2 className="text-[14px] display-heavy uppercase tracking-[0.1em] mb-1">Shipping Label</h2>
        <div className="mono-data text-[10px] text-black/60">Attach to Physical Pallet</div>
      </div>
      
      <div className="bg-white p-4 border-2 border-black brutal-shadow-sm mb-6">
        <QRCodeSVG 
          value={url} 
          size={200}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"Q"}
        />
      </div>

      <div className="w-full space-y-2 mb-6">
        <div className="flex justify-between border-b border-black/10 pb-1">
          <span className="mono-data text-[10px] text-black/60">Product</span>
          <span className="font-bold text-[12px] uppercase">{productName}</span>
        </div>
        <div className="flex justify-between border-b border-black/10 pb-1">
          <span className="mono-data text-[10px] text-black/60">Batch ID</span>
          <span className="font-bold text-[12px] mono-data">{batchId}</span>
        </div>
        <div className="flex justify-between border-b border-black/10 pb-1">
          <span className="mono-data text-[10px] text-black/60">GS1 Serial</span>
          <span className="font-bold text-[12px] mono-data">{serial}</span>
        </div>
      </div>

      <button 
        onClick={handlePrint}
        className="print-hide w-full flex items-center justify-center gap-2 border-2 border-black bg-black text-white px-4 py-3 text-[12px] font-bold uppercase tracking-[0.14em] brutal-press hover:bg-[#102A43]"
      >
        <Printer className="h-4 w-4" />
        Print Physical Label
      </button>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-header {
            border-bottom: 2px solid black !important;
          }
        }
      `}</style>
    </div>
  );
}
