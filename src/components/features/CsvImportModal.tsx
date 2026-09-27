import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { lookupMerchantCategory } from '../../utils/merchantRules';
import { Transaction } from '../../types/finance';

export const CsvImportModal: React.FC = () => {
  const { isCsvImportOpen, setIsCsvImportOpen, bulkImportTransactions, preferences } = useFinance();
  const [parsedRows, setParsedRows] = useState<Omit<Transaction, 'id'>[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCsvImportOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setErrorMsg('CSV file is empty or does not contain enough data.');
          return;
        }

        // Header detection
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
        const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('payee') || h.includes('merchant') || h.includes('memo') || h.includes('name'));
        const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('debit') || h.includes('price') || h.includes('total'));

        const validDateIdx = dateIdx !== -1 ? dateIdx : 0;
        const validDescIdx = descIdx !== -1 ? descIdx : 1;
        const validAmountIdx = amountIdx !== -1 ? amountIdx : 2;

        const results: Omit<Transaction, 'id'>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length <= Math.max(validDateIdx, validDescIdx, validAmountIdx)) continue;

          const rawDate = cols[validDateIdx];
          const rawMerchant = cols[validDescIdx] || 'Merchant';
          const rawAmount = cols[validAmountIdx]?.replace(/[^0-9.-]/g, '');

          const parsedAmount = Math.abs(parseFloat(rawAmount) || 0);
          if (parsedAmount === 0) continue;

          const isIncome = (cols[validAmountIdx] && !cols[validAmountIdx].includes('-') && parseFloat(cols[validAmountIdx]) > 0 && /deposit|salary|payroll/i.test(rawMerchant));
          const autoCategory = isIncome ? 'Income' : (lookupMerchantCategory(rawMerchant) || 'Groceries');

          results.push({
            merchant: rawMerchant,
            amount: parsedAmount,
            category: autoCategory,
            date: rawDate.length === 10 ? rawDate : new Date().toISOString().split('T')[0],
            type: isIncome ? 'income' : 'expense',
            notes: `Imported from ${file.name}`,
          });
        }

        if (results.length === 0) {
          setErrorMsg('Could not find valid transaction rows in this CSV.');
        } else {
          setParsedRows(results);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error parsing CSV file. Please ensure standard comma-separated format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    bulkImportTransactions(parsedRows);
    setIsCsvImportOpen(false);
    setParsedRows([]);
    setFileName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0c283f] via-[#093a5c] to-[#061e31] text-white flex items-center justify-between shrink-0 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Import Bank Statement (CSV)</h3>
              <p className="text-xs text-cyan-200/80">
                100% private & client-side. Your financial data never leaves your computer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCsvImportOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Dropzone */}
          <div className="border-2 border-dashed border-cyan-200 hover:border-cyan-400 bg-cyan-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Click or drag a bank CSV file here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports statements from Chase, Bank of America, Wells Fargo, Revolut, etc.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Found {parsedRows.length} transactions ready to import
                </span>
                <span className="text-slate-400">Previewing first 5</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Merchant</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500">{row.date}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{row.merchant}</td>
                        <td className="p-2.5 text-cyan-700 font-medium">{row.category}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {preferences.currencySymbol}{row.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => setIsCsvImportOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Import {parsedRows.length} Transactions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
