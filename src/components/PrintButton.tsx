import React from "react";

interface ExcelButtonProps {
  label?: string;
  className?: string;
  onExport?: () => void;
}

export const PrintButton: React.FC<ExcelButtonProps> = ({
  label = "Excel",
  className = "",
  onExport,
}) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`no-print px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors ${className}`}
      title="Download as Excel file"
    >
      📊 {label}
    </button>
  );
};
