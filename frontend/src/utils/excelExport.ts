import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  title: string;
  width?: number;
}

export interface ExportData {
  [key: string]: any;
}

export const exportToExcel = (
  data: ExportData[],
  columns: ExportColumn[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Transform data to match column structure
  const exportData = data.map(row => {
    const exportRow: { [key: string]: any } = {};
    columns.forEach(col => {
      exportRow[col.title] = row[col.key] || '';
    });
    return exportRow;
  });

  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map(col => ({
    wch: col.width || 15
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Write and download file
  XLSX.writeFile(wb, fullFilename);
};

// Inventory export helper
export const exportInventoryToExcel = (
  inventory: any[],
  locationName: string = 'All Locations'
) => {
  const columns: ExportColumn[] = [
    { key: 'product', title: 'Product Name', width: 25 },
    { key: 'sku', title: 'SKU', width: 15 },
    { key: 'category', title: 'Category', width: 15 },
    { key: 'location', title: 'Location', width: 20 },
    { key: 'quantity', title: 'Units', width: 10 },
    { key: 'cartoons', title: 'Cartons', width: 10 },
    { key: 'minStock', title: 'Min Stock', width: 10 },
    { key: 'costPerUnit', title: 'Cost/Unit ($)', width: 12 },
    { key: 'sellPrice', title: 'Sell/Unit ($)', width: 12 },
    { key: 'status', title: 'Status', width: 10 },
    { key: 'lastUpdated', title: 'Last Updated', width: 15 },
  ];

  const filename = `Inventory_${locationName.replace(/\s+/g, '_')}`;
  
  exportToExcel(inventory, columns, filename, 'Inventory');
};

// Products export helper
export const exportProductsToExcel = (products: any[]) => {
  const columns: ExportColumn[] = [
    { key: 'name', title: 'Product Name', width: 25 },
    { key: 'sku', title: 'SKU', width: 15 },
    { key: 'category', title: 'Category', width: 15 },
    { key: 'unit', title: 'Unit', width: 10 },
    { key: 'qtyPerCtn', title: 'Qty/Carton', width: 12 },
    { key: 'costPerCtn', title: 'Cost/Carton ($)', width: 15 },
    { key: 'sellPerCtn', title: 'Sell/Carton ($)', width: 15 },
    { key: 'minStockCtn', title: 'Min Stock (CTN)', width: 15 },
    { key: 'status', title: 'Status', width: 10 },
    { key: 'createdAt', title: 'Created Date', width: 15 },
  ];

  exportToExcel(products, columns, 'Products_List', 'Products');
};

// Users export helper
export const exportUsersToExcel = (users: any[]) => {
  const columns: ExportColumn[] = [
    { key: 'name', title: 'Full Name', width: 20 },
    { key: 'email', title: 'Email/Username', width: 25 },
    { key: 'role', title: 'Role', width: 20 },
    { key: 'locationName', title: 'Assigned Location', width: 20 },
    { key: 'createdAt', title: 'Created Date', width: 15 },
  ];

  exportToExcel(users, columns, 'Users_List', 'Users');
};