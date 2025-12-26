import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

function ImportExcel({ onImport, onCancel, templateColumns = [], sampleData = [] }) {
    const fileInputRef = useRef(null);
    const [previewData, setPreviewData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mapping, setMapping] = useState({});

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length < 2) {
                    alert('File không có dữ liệu');
                    return;
                }

                const headers = jsonData[0];
                const allData = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });

                setPreviewData(allData.slice(0, 5));
                window.importData = allData;

                // Auto mapping
                const autoMapping = {};
                templateColumns.forEach(col => {
                    const matchedHeader = headers.find(header =>
                        header.toLowerCase().includes(col.label.toLowerCase())
                    );
                    if (matchedHeader) autoMapping[matchedHeader] = col.name;
                });
                setMapping(autoMapping);

            } catch (error) {
                alert('Không thể đọc file');
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        const allData = window.importData || previewData;
        if (!allData.length) {
            alert('Vui lòng chọn file');
            return;
        }

        const mappedData = allData.map(row => {
            const mappedRow = {};
            Object.entries(mapping).forEach(([excelCol, dbCol]) => {  //hàm entries trả về các cặp key, value 
                if (dbCol && row[excelCol] !== undefined) {
                    mappedRow[dbCol] = String(row[excelCol] || '');
                }
            });
            return mappedRow;
        });

        setIsLoading(true);
        try {
            await onImport(mappedData);
            onCancel?.();
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            templateColumns.map(col => col.label),
            ...sampleData.map(row => templateColumns.map(col => row[col.name] || ''))
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'template_import.xlsx');
    };

    const renderIcon = (name) => {
        const icons = {
            close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
            file: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
            spinner: <>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </>
        };
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[name]}</svg>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl border border-gray-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}>

                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900">Import từ Excel</h3>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                            {renderIcon('close')}
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-gray-700">Chọn file Excel</label>
                            <button onClick={downloadTemplate} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Tải template
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 bg-gray-50"
                            onClick={() => fileInputRef.current?.click()}>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
                            <div className="mx-auto h-10 w-10 text-gray-400 mb-3">{renderIcon('file')}</div>
                            <p className="text-sm text-gray-600 mb-1">{fileName || 'Click để chọn file'}</p>
                            <p className="text-xs text-gray-500">Hỗ trợ .xlsx, .xls, .csv</p>
                        </div>
                    </div>

                    {previewData.length > 0 && (
                        <>
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Ánh xạ cột dữ liệu</h4>
                                <div className="space-y-3">
                                    {templateColumns.map(col => (
                                        <div key={col.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">{col.label}</span>
                                                {col.required && <span className="ml-1 text-xs text-red-500">*</span>}
                                            </div>
                                            <select
                                                value={Object.keys(mapping).find(k => mapping[k] === col.name) || ''}
                                                onChange={(e) => {
                                                    const newMapping = { ...mapping };
                                                    Object.keys(newMapping).forEach(k => {
                                                        if (newMapping[k] === col.name) delete newMapping[k];
                                                    });
                                                    if (e.target.value) newMapping[e.target.value] = col.name;
                                                    setMapping(newMapping);
                                                }}
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48"
                                            >
                                                <option value="">-- Chọn cột --</option>
                                                {Object.keys(previewData[0] || {}).map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">Xem trước dữ liệu</h4>
                                    <span className="text-xs text-gray-500">{previewData.length} / {window.importData?.length || previewData.length} dòng</span>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60">
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    {Object.keys(previewData[0] || {}).map(header => (
                                                        <th key={header} className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 truncate max-w-[120px]">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        {Object.values(row).map((value, j) => (
                                                            <td key={j} className="px-4 py-3 border-b border-gray-100 text-gray-700 truncate max-w-[120px]">
                                                                {value || <span className="text-gray-400">-</span>}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="border-t border-gray-200 px-6 py-4 bg-white">
                    <div className="flex justify-end space-x-3">
                        <button onClick={onCancel} disabled={isLoading}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            Hủy bỏ
                        </button>
                        <button onClick={handleImport} disabled={isLoading || !previewData.length}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                        {renderIcon('spinner')}
                                    </svg>
                                    Đang import...
                                </>
                            ) : 'Import dữ liệu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImportExcel;