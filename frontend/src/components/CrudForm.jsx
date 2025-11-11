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
        try {
            await onSubmit?.(formValues);
            setLoading(true);
        } catch (err) {
            setErrorMessage(err?.message || "Đã xảy ra lỗi.");
        }
        finally {
            setLoading(false);
        }
    }

    function renderField(field) {
        const { name, label, type = "text", required = false, options = [] } = field;
        const value = formValues[name] ?? "";

        if (type === "select") {
            return (
                <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                    <select
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                    <input
                        name={name}
                        type="file"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />

                    {fileUrl && (
                        <div className="mt-2 text-sm text-blue-600">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                            >
                                📎 Xem file hiện tại
                            </a>
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required={required}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl w-full max-w-3xl p-8 shadow-2xl border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {title && <h3 className="text-2xl font-semibold text-gray-900 mb-8">{title}</h3>}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((f) => renderField(f))}
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
            {loading && <LoadingIcon loading={true} />}
        </div>
    );

}
