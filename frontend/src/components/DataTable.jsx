import React from "react";

export default function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = "Không có dữ liệu",
    onEdit,
    onDelete,
    onView,
    rowIndexBase = 0,
    title,
}) {
    const hasActions = Boolean(onEdit || onDelete || onView);

    return (
        <div className="bg-white  border border-gray-200 overflow-hidden">
            {/* Header */}
            {title && (
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                #
                            </th>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                >
                                    {column.header}
                                </th>
                            ))}
                            {hasActions && (
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={(columns.length || 0) + 1 + (hasActions ? 1 : 0)}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                        <span className="text-gray-600">Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : !data || data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={(columns.length || 0) + 1 + (hasActions ? 1 : 0)}
                                    className="px-6 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-base">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={row.id ?? index}
                                    className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {rowIndexBase + index + 1}
                                    </td>
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                        >
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {onView && (
                                                    <button
                                                        onClick={() => onView(row)}
                                                        className="px-4 py-2 text-xs font-medium text-white bg-blue-600  transition-colors duration-200 "
                                                    >
                                                        Xem
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(row)}
                                                        className="px-4 py-2 text-xs font-medium text-white bg-green-600 transition-colors duration-200 border"
                                                    >
                                                        Sửa
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(row)}
                                                        className="px-4 py-2 text-xs font-medium text-white bg-red-600 transition-colors duration-200 "
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
    );
}