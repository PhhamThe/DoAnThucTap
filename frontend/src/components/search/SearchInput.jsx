import React, { useState } from "react";

function SearchInput({ placeholder = "Tìm kiếm...", onSearch }) {
    const [text, setText] = useState("");

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className="border rounded px-2 py-1 text-sm"
            />
            <button
                onClick={() => onSearch?.(text)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
                Tìm
            </button>
        </div>
    );
}

export default SearchInput;
