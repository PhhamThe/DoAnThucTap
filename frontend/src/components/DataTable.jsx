import React, { useState } from "react";

export default function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = "Không có dữ liệu",
    onEdit,
    onDelete,
    onView,
    titleOnView,
    rowIndexBase = 0,
    headerActions = null,
}) {
    const [sorting, setSorting] = useState({ key: null, direction: 'asc' });
    const [columnVisibility, setColumnVisibility] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

    const hasActions = Boolean(onEdit || onDelete || onView);

    // Xử lý sắp xếp
    const handleSort = (columnKey) => {
        if (sorting.key === columnKey) {
            if (sorting.direction === 'asc') {
                setSorting({ key: columnKey, direction: 'desc' });
            } else {
                setSorting({ key: null, direction: 'asc' });
            }
        } else {
            setSorting({ key: columnKey, direction: 'asc' });
        }
    };

    // Lọc dữ liệu theo search term
    const filteredData = React.useMemo(() => {
        if (!searchTerm.trim()) return data || [];

        return (data || []).filter(row => {
            return columns.some(column => {
                const value = column.render ? column.render(row) : row[column.key];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [data, searchTerm, columns]);

    // Sắp xếp dữ liệu
    const sortedData = React.useMemo(() => {
        if (!sorting.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const column = columns.find(col => col.key === sorting.key);
            const aValue = column?.render ? column.render(a) : a[sorting.key];
            const bValue = column?.render ? column.render(b) : b[sorting.key];

            if (sorting.direction === 'asc') {
                return String(aValue).localeCompare(String(bValue));
            } else {
                return String(bValue).localeCompare(String(aValue));
            }
        });
    }, [filteredData, sorting, columns]);

    const visibleColumns = columns.filter(col => columnVisibility[col.key] !== false);

    return (
        <div className="w-full">
            {/* Header với search và controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
                <div className="w-full sm:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 pl-9 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Custom action buttons */}
                {headerActions && (
                    <div className="flex items-center gap-2">
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                {visibleColumns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => column.sortable !== false && handleSort(column.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {column.header}
                                            {column.sortable !== false && sorting.key === column.key && (
                                                <span className="ml-1">
                                                    {sorting.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {hasActions && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={visibleColumns.length + 1 + (hasActions ? 1 : 0)}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex items-center justify-center space-x-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                            <span className="text-gray-600">Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : !sortedData || sortedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={visibleColumns.length + 1 + (hasActions ? 1 : 0)}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 text-sm">{searchTerm ? "Không tìm thấy kết quả" : emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, index) => (
                                    <tr
                                        key={row.id ?? index}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {rowIndexBase + index + 1}
                                        </td>
                                        {visibleColumns.map((column) => (
                                            <td
                                                key={column.key}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                            >
                                                {column.render ? column.render(row) : row[column.key]}
                                            </td>
                                        ))}
                                        {hasActions && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {onView && (
                                                        <button
                                                            onClick={() => onView(row)}
                                                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
                                                        >
                                                            {titleOnView || "Xem"}
                                                        </button>
                                                    )}
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(row)}
                                                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors duration-200"
                                                        >
                                                            Sửa
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(row)}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}