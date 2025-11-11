import React from "react";

/**
 * Generic data table for list views with optional action column
 */
export default function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = "Không có dữ liệu",
    onEdit,
    onDelete,
    rowIndexBase = 0,
}) {
    const hasActions = Boolean(onEdit || onDelete);

    return (
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                                {column.header}
                            </th>
                        ))}
                        {hasActions && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Hành động
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={(columns?.length || 0) + 1 + (hasActions ? 1 : 0)}
                                className="px-6 py-4 text-center"
                            >
                                Loading...
                            </td>
                        </tr>
                    ) : !data || data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={(columns?.length || 0) + 1 + (hasActions ? 1 : 0)}
                                className="px-6 py-4 text-center"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr key={row.id ?? index}>
                                <td className="px-6 py-4">{rowIndexBase + index + 1}</td>
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4">
                                        {column.render ? column.render(row) : row[column.key]}
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-6 py-4 text-right">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(row)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Sửa
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(row)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}