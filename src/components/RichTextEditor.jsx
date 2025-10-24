import React from "react";

// Helper function to strip HTML tags and convert to plain text
const stripHtml = (html) => {
  if (!html) return "";

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Get text content and clean up extra whitespace
  return tempDiv.textContent || tempDiv.innerText || "";
};

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start writing your article...",
  className = "",
  minHeight = "400px",
}) => {
  // Convert HTML content to plain text for display
  const plainTextValue = stripHtml(value);

  const handleChange = (e) => {
    if (onChange) {
      // Store as plain text (no HTML)
      onChange(e.target.value);
    }
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
    >
      <textarea
        value={plainTextValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ minHeight }}
        rows={Math.max(10, Math.ceil(parseInt(minHeight) / 24))}
      />
    </div>
  );
};

export default RichTextEditor;
