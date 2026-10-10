import React, { useState } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  Store,
  Calendar,
  User,
  Phone,
  FileText,
  Receipt,
  FileBox,
} from 'lucide-react';
import { Memo, BusinessSettings } from '../types';
import { exportToCSV } from '../services/storage';

interface MemoModalProps {
  memo: Memo | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const MemoModal: React.FC<MemoModalProps> = ({ memo, settings, onClose }) => {
  if (!memo) return null;

  const [printFormat, setPrintFormat] = useState<'A4' | 'POS'>('A4');
  const currency = settings.currency || '৳';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['SL', 'Product', 'Supplier/Factory', 'Quantity', 'Unit Price', 'Line Total'];
    const rows = memo.items.map((it, idx) => [
      idx + 1,
      it.productName,
      it.supplierName,
      it.quantity,
      it.unitPrice,
      it.total,
    ]);
    exportToCSV(`Memo_${memo.memoNumber}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Printable Memo: #{memo.memoNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: A4 vs POS */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  printFormat === 'A4'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Standard
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('POS')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  printFormat === 'POS'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Thermal
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              title="Download CSV"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Memo Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print-container">
          {printFormat === 'A4' ? (
            /* ================== A4 FORMAT ================== */
            <div className="space-y-6 max-w-2xl mx-auto border border-slate-200 p-8 rounded-xl print:border-none print:p-0">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {settings.businessName || 'LIMA GARMENTS'}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Wholesale & Retail Clothing Merchant
                </p>
                <p className="text-xs text-slate-500">
                  {settings.address || 'Shop #42, 2nd Floor, Bango Islamia Super Market, Gulistan, Dhaka'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: {settings.phone || '+880 1712-345678'}
                </p>
                <div className="inline-block mt-3 px-4 py-0.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xs">
                  Cash / Credit Sales Memo
                </div>
              </div>

              {/* Memo Info Row */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Customer:</span>{' '}
                    <strong className="text-slate-900 text-sm">{memo.customerName}</strong>
                  </div>
                  {(memo.customerDistrict || memo.customerArea) && (
                    <div className="text-slate-700">
                      <span className="text-slate-500">Location:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        {memo.customerDistrict || 'Dhaka'}
                        {memo.customerArea ? ` (${memo.customerArea})` : ''}
                      </span>
                    </div>
                  )}
                  {memo.customerPhone && (
                    <div>
                      <span className="text-slate-500">Phone:</span>{' '}
                      <span className="font-mono text-slate-800">{memo.customerPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Payment Mode:</span>{' '}
                    <span className="font-semibold text-slate-800">{memo.paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-500">Memo No:</span>{' '}
                    <strong className="font-mono text-indigo-600 text-sm">#{memo.memoNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>{' '}
                    <span className="font-medium text-slate-800">{memo.date}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-10">SL</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Product Description</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Factory / Supplier</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-20">Qty (pcs)</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300 w-24">Unit Price</th>
                    <th className="py-2 px-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {memo.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-300">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-300">
                        {item.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold border-r border-slate-300">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">
                        {currency} {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {currency} {item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Totals */}
              <div className="flex justify-between items-start gap-6 pt-2">
                <div className="flex-1 text-xs text-slate-600">
                  {memo.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold block text-slate-700 mb-0.5">Notes:</span>
                      {memo.notes}
                    </div>
                  )}
                  <p className="mt-3 text-[11px] text-slate-500 italic">
                    Goods sold once can only be replaced within 3 days with this original memo.
                  </p>
                </div>

                <div className="w-64 space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>Total Amount:</span>
                    <strong className="text-slate-900">{currency} {memo.subtotal.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid Amount:</span>
                    <strong>{currency} {memo.paid.toLocaleString()}</strong>
                  </div>
                  <div className="border-t-2 border-slate-300 pt-1 flex justify-between text-amber-700 font-bold text-sm">
                    <span>Current Due:</span>
                    <span>{currency} {memo.due.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Clean Signature Areas */}
              <div className="pt-14 grid grid-cols-2 gap-12 text-xs">
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                    Customer Signature
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                    Authorized Signature (Lima Garments)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================== 80MM POS THERMAL FORMAT ================== */
            <div className="max-w-[80mm] mx-auto p-4 border border-dashed border-slate-300 text-[11px] font-mono leading-tight space-y-3 bg-white print:border-none print:p-0">
              <div className="text-center pb-2 border-b border-slate-400">
                <div className="font-extrabold text-sm uppercase">{settings.businessName}</div>
                <div className="text-[10px] text-slate-600">{settings.address}</div>
                <div className="text-[10px] text-slate-600">Mob: {settings.phone}</div>
                <div className="mt-1 font-bold text-xs uppercase">-- SALES MEMO --</div>
              </div>

              <div className="space-y-0.5 text-[10px] border-b border-slate-300 pb-2">
                <div>MEMO: #{memo.memoNumber}</div>
                <div>DATE: {memo.date}</div>
                <div>CLIENT: {memo.customerName}</div>
                {(memo.customerDistrict || memo.customerArea) && (
                  <div>AREA: {memo.customerDistrict || 'Dhaka'}{memo.customerArea ? ` (${memo.customerArea})` : ''}</div>
                )}
                {memo.customerPhone && <div>PHONE: {memo.customerPhone}</div>}
              </div>

              {/* Items */}
              <div className="border-b border-slate-300 pb-2">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-1">
                  <span>ITEM</span>
                  <span>QTY x RATE = TOT</span>
                </div>
                {memo.items.map((it) => (
                  <div key={it.id} className="mb-1">
                    <div className="font-bold">{it.productName}</div>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>Fac: {it.supplierName}</span>
                      <span>
                        {it.quantity} x {it.unitPrice} = {currency}{it.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 font-bold pt-1 border-b border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>{currency} {memo.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAID:</span>
                  <span>{currency} {memo.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DUE:</span>
                  <span>{currency} {memo.due.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center pt-2 space-y-2 text-[10px]">
                <div>Thank You For Shopping!</div>
                <div className="pt-6 border-t border-dotted border-slate-400">
                  Authorized Sign
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Close */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Memo
          </button>
        </div>
      </div>
    </div>
  );
};
