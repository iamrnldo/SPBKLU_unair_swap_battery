import React from 'react';

const Table = ({ headers, children, emptyMessage = 'Tidak ada data yang tersedia.' }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {React.Children.count(children) === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
