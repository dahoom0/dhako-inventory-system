import React from "react";
import ProductsLibrary from "./ProductsLibrary";

interface Props {
  onBack: () => void;
  branchName?: string; // kept for compat, unused
}

// AddNewItem delegates to ProductsLibrary which already handles
// real product creation + stock receiving against the database.
const AddNewItem: React.FC<Props> = ({ onBack }) => {
  return <ProductsLibrary onBack={onBack} />;
};

export default AddNewItem;
