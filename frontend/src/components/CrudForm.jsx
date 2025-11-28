import React, { useEffect, useRef, useState } from "react";
import LoadingIcon from './button/LoadingIcon'
import { normalizeFileUpload, buildFileUrlFromUpload } from '../ulities/fileHelpers';

export default function CrudForm({
    title = "",
    fields = [],
    initialValues = {},
    submitLabel = "Lưu",
    onSubmit,
    onCancel,
}) {
    const [loading, setLoading] = useState(false);
    const buildValues = (flds, init) => {
        const vals = {};
        for (const f of flds || []) {
            if (f.type === "checkbox") vals[f.name] = init[f.name] ?? false;
            else if (f.type === "file") vals[f.name] = init[f.name] ?? null;
            else vals[f.name] = init[f.name] ?? "";
        }
        return vals;
    };

    const [formValues, setFormValues] = useState(() => buildValues(fields, initialValues));
    const [errorMessage, setErrorMessage] = useState(null);

    const prevInitialJson = useRef(null);
    const prevFieldsJson = useRef(null);

    useEffect(() => {
        let newInitialJson;
        let newFieldsJson;
        try {
            newInitialJson = JSON.stringify(initialValues ?? {});
            newFieldsJson = JSON.stringify(fields ?? []);
        } catch (e) {
            newInitialJson = String(initialValues);
            newFieldsJson = String(fields);
        }

        const initialChanged = newInitialJson !== prevInitialJson.current;
        const fieldsChanged = newFieldsJson !== prevFieldsJson.current;

        if (initialChanged || fieldsChanged) {
            prevInitialJson.current = newInitialJson;
            prevFieldsJson.current = newFieldsJson;
            setFormValues(buildValues(fields, initialValues));
        }
    }, [initialValues, fields]);

    function handleChange(event) {
        if (!event || !event.target) return;
        const { name, type } = event.target;
        if (!name) return;

        if (type === "checkbox") {
            setFormValues((prev) => ({ ...prev, [name]: event.target.checked }));
        } else if (type === "file") {
            const file = event.target.files && event.target.files.length ? event.target.files[0] : null;
            setFormValues((prev) => ({ ...prev, [name]: file }));
        } else {
            setFormValues((prev) => ({ ...prev, [name]: event.target.value }));
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage(null);
        setLoading(true);
        try {
            await onSubmit?.(formValues);
        } catch (err) {
            setErrorMessage(err?.message || "Đã xảy ra lỗi.");
        } finally {
            setLoading(false);
        }
    }

    function renderField(field) {
        const { name, label, type = "text", required = false, options = [], spanFull = false } = field;
        const value = formValues[name] ?? "";

        const fieldClasses = spanFull ? "md:col-span-2" : "";

        if (type === "select") {
            return (
                <div key={name} className={fieldClasses}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        required={required}
                    >
                        <option value="">-- Chọn --</option>
                        {options.map((option) => {
                            const optionValue = option.value ?? option.id ?? option.key;
                            const optionLabel = option.label ?? option.name ?? String(optionValue);
                            return (
                                <option key={optionValue} value={optionValue}>
                                    {optionLabel}
                                </option>
                            );
                        })}
                    </select>
                </div>
            );
        }

        if (type === "textarea") {
            return (
                <div key={name} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none min-h-[120px]"
                        required={required}
                        rows={4}
                    />
                </div>
            );
        }

        if (type === "file") {
            const fileObj = normalizeFileUpload(initialValues[name]);
            const fileUrl = buildFileUrlFromUpload(fileObj);

            return (
                <div key={name} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                    </label>
                    <input
                        name={name}
                        type="file"
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {fileUrl && (
                        <div className="mt-3">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700  hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                            >
                                📎 Xem file hiện tại
                            </a>
                        </div>
                    )}
                </div>
            );
        }

        if (type === "checkbox") {
            return (
                <div key={name} className="flex items-center space-x-3 md:col-span-2">
                    <input
                        name={name}
                        type="checkbox"
                        checked={value}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 border-gray-300  focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                </div>
            );
        }

        return (
            <div key={name} className={fieldClasses}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required={required}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div
                className="bg-white  w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-8 py-6 ">
                    <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
                </div>

                {/* Form Content */}
                <div className="p-8">
                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200  text-red-700 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map((f) => renderField(f))}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 
                                 hover:bg-blue-700 transition-all duration-200 hover:shadow-sm flex items-center justify-center min-w-[100px]"
                                disabled={loading}
                            >
                                {loading && <LoadingIcon loading={true} />}
                                {submitLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}