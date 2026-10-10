import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Boxes,
  Banknote,
} from 'lucide-react';
import { Memo, AppState } from '../types';
import { createReturnTransaction } from '../services/storage';

interface ReturnModalProps {
  memo: Memo | null;
  appState: AppState;
  onClose: () => void;
  onReturnProcessed: (nextState: AppState) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  memo,
  appState,
  onClose,
  onReturnProcessed,
}) => {
  if (!memo) return null;

  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [selectedItemId, setSelectedItemId] = useState<string>(memo.items[0]?.id || '');
  const [returnQuantity, setReturnQuantity] = useState<number | ''>(1);
  const [refundMethod, setRefundMethod] = useState<'Adjust_Due' | 'Cash_Refund'>('Adjust_Due');
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedItem = memo.items.find((it) => it.id === selectedItemId);
  const maxReturnableQty = selectedItem ? selectedItem.quantity : 1;

  const returnQtyNum = Math.min(
    maxReturnableQty,
    Math.max(1, Number(returnQuantity) || 1)
  );

  const refundAmount = selectedItem ? returnQtyNum * selectedItem.unitPrice : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (!selectedItem) throw new Error('Please select an item to return.');
      if (returnQtyNum <= 0 || returnQtyNum > maxReturnableQty) {
        throw new Error(
          `Invalid return quantity. Must be between 1 and ${maxReturnableQty} pcs.`
        );
      }

      const nextState = createReturnTransaction(appState, {
        memoId: memo.id,
        productId: selectedItem.productId,
        supplierId: selectedItem.supplierId,
        quantity: returnQtyNum,
        refundAmount,
        refundMethod,
        date: today,
        reason: reason.trim() || 'Customer product return',
      });

      onReturnProcessed(nextState);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process sales return.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Process Sales Return</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Original Memo:</span>
              <strong className="font-mono text-indigo-600">#{memo.memoNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <strong className="text-slate-800">{memo.customerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date Billed:</span>
              <span>{memo.date}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product to Return *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setReturnQuantity(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {memo.items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.productName} ({it.quantity} pcs @ ৳{it.unitPrice}) - Factory: {it.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Return Qty */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Return Quantity (pcs) *</span>
              <span className="text-[11px] text-slate-500 font-mono">
                Max returnable: {maxReturnableQty} pcs
              </span>
            </label>
            <input
              type="number"
              min="1"
              max={maxReturnableQty}
              required
              value={returnQuantity}
              onChange={(e) =>
                setReturnQuantity(
                  e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0)
                )
              }
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Refund Value Calculation */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex justify-between items-center">
            <span className="font-semibold text-amber-900">Total Refund Value:</span>
            <span className="text-base font-extrabold text-amber-700 font-mono">
              {currency} {refundAmount.toLocaleString()}
            </span>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Refund Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                  refundMethod === 'Adjust_Due'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="refund_method"
                  checked={refundMethod === 'Adjust_Due'}
                  onChange={() => setRefundMethod('Adjust_Due')}
                  className="text-indigo-600"
                />
                <span>Adjust Customer Due</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                  refundMethod === 'Cash_Refund'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="refund_method"
                  checked={refundMethod === 'Cash_Refund'}
                  onChange={() => setRefundMethod('Cash_Refund')}
                  className="text-rose-600"
                />
                <span>Refund Cash Money</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {refundMethod === 'Adjust_Due'
                ? 'Reduces the customer outstanding balance. Cash in hand remains untouched.'
                : 'Deducts cash in hand immediately and logs a return refund cash transaction.'}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Return Reason / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Size misfit, defective stitching, exchange..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              Confirm Return & Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
