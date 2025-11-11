import React, { useState } from "react";

function FilterBar({ filters = [], onFilterChange }) {
    const initialValues = Object.fromEntries(filters.map((f) => [f.name, ""]));
    const [values, setValues] = useState(initialValues);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValues = { ...values, [name]: value };
        setValues(newValues);
        onFilterChange?.(newValues);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
                <select
                    key={filter.name}
                    name={filter.name}
                    value={values[filter.name]}
                    onChange={handleChange}
                    className="border rounded px-2 py-1 text-sm"
                >
                    <option value="">Tất cả</option>
                    {filter.options?.map((opt) => (
                        <option key={opt.id ?? opt.value} value={opt.id ?? opt.value}>
                            {opt.name ?? opt.label}
                        </option>
                    ))}
                </select>
            ))}
        </div>
    );
}

export default FilterBar;
