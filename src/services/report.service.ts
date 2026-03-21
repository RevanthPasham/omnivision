import { pool } from "../config/neon";
import ExcelJS from "exceljs";

export interface TopProduct {
  title: string;
  slug: string;
  price: number;
  stock: number;
  brand: string | null;
}

export interface LowStockProduct {
  title: string;
  slug: string;
  price: number;
  stock: number;
  brand: string | null;
}

export interface SellingProduct {
  title: string;
  slug: string;
  brand: string | null;
  price: number;
  stock: number;
  soldQuantity: number;
  orderCount: number;
  revenue: number;
}

/**
 * Get top products (highest stock quantity)
 */
export async function getTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const result = await pool.query(
    `SELECT 
       p.title, p.slug, p.brand,
       COALESCE(SUM(pv.stock_quantity), 0) as total_stock,
       COALESCE(MIN(pv.price), 0) as min_price
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.is_active = true
     GROUP BY p.id, p.title, p.slug, p.brand
     HAVING SUM(pv.stock_quantity) > 0
     ORDER BY total_stock DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    title: row.title,
    slug: row.slug,
    price: Number(row.min_price),
    stock: Number(row.total_stock),
    brand: row.brand,
  }));
}

/**
 * Get low stock products (stock <= threshold)
 */
export async function getLowStockProducts(threshold: number = 10): Promise<LowStockProduct[]> {
  const result = await pool.query(
    `SELECT 
       p.title, p.slug, p.brand,
       COALESCE(SUM(pv.stock_quantity), 0) as total_stock,
       COALESCE(MIN(pv.price), 0) as min_price
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.is_active = true
     GROUP BY p.id, p.title, p.slug, p.brand
     HAVING SUM(pv.stock_quantity) <= $1
     ORDER BY total_stock ASC, p.title ASC`,
    [threshold]
  );

  return result.rows.map((row) => ({
    title: row.title,
    slug: row.slug,
    price: Number(row.min_price),
    stock: Number(row.total_stock),
    brand: row.brand,
  }));
}

/**
 * Generate Excel file for sales report
 * Note: This is a placeholder - you may need to add an orders/sales table later
 */
export async function generateSalesExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Get all products with their variants
  const result = await pool.query(
    `SELECT 
       p.title, p.slug, p.brand, p.material,
       pv.sku, pv.price, pv.stock_quantity,
       p.created_at
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.is_active = true
     ORDER BY p.title ASC, pv.price ASC`
  );

  // Define columns
  worksheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Slug", key: "slug", width: 25 },
    { header: "Brand", key: "brand", width: 20 },
    { header: "Material", key: "material", width: 20 },
    { header: "SKU", key: "sku", width: 25 },
    { header: "Price", key: "price", width: 15 },
    { header: "Stock", key: "stock", width: 15 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  for (const row of result.rows) {
    worksheet.addRow({
      title: row.title,
      slug: row.slug,
      brand: row.brand || "",
      material: row.material || "",
      sku: row.sku || "",
      price: row.price ? Number(row.price).toFixed(2) : "0.00",
      stock: row.stock_quantity || 0,
      createdAt: row.created_at ? new Date(row.created_at).toLocaleString() : "",
    });
  }

  // Format price column as number
  worksheet.getColumn("price").numFmt = "#,##0.00";

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Format top products as text message
 */
export function formatTopProducts(products: TopProduct[]): string {
  if (products.length === 0) {
    return "No products found with stock.";
  }

  let message = "📊 *Top Products (Highest Stock)*\n\n";
  products.forEach((product, index) => {
    message += `${index + 1}. *${product.title}*\n`;
    message += `   Slug: ${product.slug}\n`;
    message += `   Price: ₹${product.price.toFixed(2)}\n`;
    message += `   Stock: ${product.stock}\n`;
    if (product.brand) {
      message += `   Brand: ${product.brand}\n`;
    }
    message += "\n";
  });

  return message;
}

/**
 * Format low stock products as text message
 */
export function formatLowStockProducts(products: LowStockProduct[]): string {
  if (products.length === 0) {
    return "No products with low stock found.";
  }

  let message = "⚠️ *Low Stock Products*\n\n";
  products.forEach((product, index) => {
    message += `${index + 1}. *${product.title}*\n`;
    message += `   Slug: ${product.slug}\n`;
    message += `   Price: ₹${product.price.toFixed(2)}\n`;
    message += `   Stock: ${product.stock}\n`;
    if (product.brand) {
      message += `   Brand: ${product.brand}\n`;
    }
    message += "\n";
  });

  return message;
}

async function fetchSellingProducts(
  direction: "ASC" | "DESC",
  limit: number
): Promise<SellingProduct[]> {
  try {
    const result = await pool.query(
      `SELECT
         p.title,
         p.slug,
         p.brand,
         COALESCE(MIN(pv.price), 0) AS min_price,
         COALESCE(SUM(pv.stock_quantity), 0) AS total_stock,
         COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0) AS sold_quantity,
         COALESCE(COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN o.id END), 0) AS order_count,
         COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.subtotal ELSE 0 END), 0) AS revenue
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o
         ON o.id = oi.order_id
         AND COALESCE(o.order_status, '') NOT IN ('Cancelled', 'Canceled', 'Failed')
       WHERE p.is_active = true
       GROUP BY p.id, p.title, p.slug, p.brand
       ORDER BY sold_quantity ${direction}, order_count ${direction}, revenue ${direction}, p.title ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      title: row.title,
      slug: row.slug,
      brand: row.brand,
      price: Number(row.min_price),
      stock: Number(row.total_stock),
      soldQuantity: Number(row.sold_quantity),
      orderCount: Number(row.order_count),
      revenue: Number(row.revenue),
    }));
  } catch (error: any) {
    // Fallback when orders/order_items tables don't exist yet.
    if (error?.code === "42P01") {
      const stockRows =
        direction === "DESC" ? await getTopProducts(limit) : await getLowStockProducts(10);
      const rows = (direction === "DESC" ? stockRows : stockRows.slice(0, limit)) as Array<
        TopProduct | LowStockProduct
      >;
      return rows.map((p) => ({
        title: p.title,
        slug: p.slug,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
        soldQuantity: 0,
        orderCount: 0,
        revenue: 0,
      }));
    }
    throw error;
  }
}

export async function getTopSellingProducts(limit: number = 10): Promise<SellingProduct[]> {
  return fetchSellingProducts("DESC", limit);
}

export async function getLessSellingProducts(limit: number = 10): Promise<SellingProduct[]> {
  return fetchSellingProducts("ASC", limit);
}

export async function generateTopSellingExcel(limit: number = 10): Promise<Buffer> {
  const rows = await getTopSellingProducts(limit);
  return generateSellingExcel(rows, "Top Selling Products");
}

export async function generateLessSellingExcel(limit: number = 10): Promise<Buffer> {
  const rows = await getLessSellingProducts(limit);
  return generateSellingExcel(rows, "Less Selling Products");
}

async function generateSellingExcel(rows: SellingProduct[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = [
    { header: "Product Name", key: "title", width: 36 },
    { header: "Slug", key: "slug", width: 28 },
    { header: "Brand", key: "brand", width: 20 },
    { header: "Price", key: "price", width: 12 },
    { header: "Current Stock", key: "stock", width: 14 },
    { header: "Sold Quantity", key: "soldQuantity", width: 14 },
    { header: "Orders Count", key: "orderCount", width: 14 },
    { header: "Revenue", key: "revenue", width: 14 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };

  rows.forEach((row) => {
    worksheet.addRow({
      ...row,
      brand: row.brand || "",
    });
  });

  worksheet.getColumn("price").numFmt = "#,##0.00";
  worksheet.getColumn("revenue").numFmt = "#,##0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
