import { Request, Response } from "express";
import { db } from "../config/db";

// GET /analytics/dashboard-stats
// Returns all KPIs the admin dashboard needs, with optional date range + branch filter
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const {
      locationId,
      dateFrom,
      dateTo,
    } = req.query as { locationId?: string; dateFrom?: string; dateTo?: string };

    const from = dateFrom || new Date().toISOString().split("T")[0];
    const to   = dateTo   || new Date().toISOString().split("T")[0];

    const locFilter    = locationId ? `AND s.location_id = '${locationId}'`  : "";
    const expLocFilter = locationId ? `AND e.location_id = '${locationId}'`  : "";

    const [
      periodRevenue,
      expenses,
      debts,
      inventory,
      products,
      alerts,
      salesTrend,
      topProducts,
      branchPerf,
    ] = await Promise.all([
      // Period sales
      db.query(`
        SELECT
          COALESCE(SUM(si.line_revenue), 0)      AS revenue,
          COALESCE(SUM(si.line_gross_profit), 0)  AS gross_profit,
          COUNT(DISTINCT s.id)                    AS sale_count
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        WHERE s.date BETWEEN $1 AND $2 ${locFilter}
      `, [from, to]),

      // Expenses in period
      db.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses e
        WHERE date BETWEEN $1 AND $2 ${expLocFilter}
      `, [from, to]),

      // Outstanding debt
      db.query(`SELECT COALESCE(SUM(original_amount - paid_amount), 0) AS total FROM debts WHERE status != 'PAID'`),

      // Inventory value
      db.query(`SELECT COALESCE(SUM(il.qty_ctn * p.cost_per_ctn), 0) AS value FROM inventory_levels il JOIN products p ON p.id = il.product_id`),

      // Total active products
      db.query(`SELECT COUNT(*) AS count FROM products WHERE status = 'ACTIVE'`),

      // Low stock alerts
      db.query(`SELECT COUNT(*) AS count FROM low_stock_alerts`),

      // Daily sales trend
      db.query(`
        SELECT
          s.date::text AS date,
          COALESCE(SUM(si.line_revenue), 0)      AS revenue,
          COALESCE(SUM(si.line_gross_profit), 0) AS profit
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        WHERE s.date BETWEEN $1 AND $2 ${locFilter}
        GROUP BY s.date ORDER BY s.date
      `, [from, to]),

      // Top products by revenue + profit + units sold
      db.query(`
        SELECT
          p.id,
          p.name,
          p.sku,
          COALESCE(SUM(si.qty_ctn), 0)               AS qty_ctns_sold,
          COALESCE(SUM(si.qty_units), 0)              AS qty_units_sold,
          COALESCE(SUM(si.line_revenue), 0)           AS revenue,
          COALESCE(SUM(si.line_gross_profit), 0)      AS gross_profit,
          CASE WHEN SUM(si.line_revenue) > 0
            THEN ROUND((SUM(si.line_gross_profit) / SUM(si.line_revenue) * 100)::numeric, 1)
            ELSE 0 END                                AS margin_pct
        FROM products p
        LEFT JOIN sale_items si ON si.product_id = p.id
        LEFT JOIN sales s ON s.id = si.sale_id
          AND s.date BETWEEN $1 AND $2 ${locFilter}
        GROUP BY p.id, p.name, p.sku
        ORDER BY revenue DESC
        LIMIT 10
      `, [from, to]),

      // Branch performance
      db.query(`
        SELECT
          l.id,
          l.name,
          l.type,
          COALESCE(SUM(si.line_revenue), 0)      AS revenue,
          COALESCE(SUM(si.line_gross_profit), 0) AS gross_profit,
          COALESCE(e.total_expenses, 0)           AS expenses,
          COALESCE(SUM(si.line_gross_profit), 0) - COALESCE(e.total_expenses, 0) AS net_profit,
          COUNT(DISTINCT s.id)                    AS sale_count
        FROM locations l
        LEFT JOIN sales s ON s.location_id = l.id
          AND s.date BETWEEN $1 AND $2
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN (
          SELECT location_id, SUM(amount) AS total_expenses
          FROM expenses
          WHERE date BETWEEN $1 AND $2
          GROUP BY location_id
        ) e ON e.location_id = l.id
        GROUP BY l.id, l.name, l.type, e.total_expenses
        ORDER BY revenue DESC
      `, [from, to]),
    ]);

    const rev       = parseFloat(periodRevenue.rows[0].revenue);
    const gp        = parseFloat(periodRevenue.rows[0].gross_profit);
    const saleCount = parseInt(periodRevenue.rows[0].sale_count);
    const totalExp  = parseFloat(expenses.rows[0].total);

    res.json({
      success: true,
      data: {
        todayRevenue:       rev,
        todayGrossProfit:   gp,
        todayExpenses:      totalExp,
        todayNetProfit:     gp - totalExp,
        todaySalesCount:    saleCount,
        monthlyRevenue:     rev,
        monthlyGrossProfit: gp,
        monthlyExpenses:    totalExp,
        monthlyNetProfit:   gp - totalExp,
        inventoryValue:     parseFloat(inventory.rows[0].value),
        outstandingDebt:    parseFloat(debts.rows[0].total),
        totalProducts:      parseInt(products.rows[0].count),
        stockAlerts:        parseInt(alerts.rows[0].count),
        salesTrend: salesTrend.rows.map(r => ({
          date:    r.date,
          revenue: parseFloat(r.revenue),
          profit:  parseFloat(r.profit),
        })),
        topProducts: topProducts.rows.map(r => ({
          id:           r.id,
          name:         r.name,
          sku:          r.sku,
          qtyCtnsSold:  parseInt(r.qty_ctns_sold),
          qtyUnitsSold: parseInt(r.qty_units_sold),
          revenue:      parseFloat(r.revenue),
          grossProfit:  parseFloat(r.gross_profit),
          marginPct:    parseFloat(r.margin_pct),
        })),
        branchPerf: branchPerf.rows.map(r => ({
          id:          r.id,
          name:        r.name,
          type:        r.type,
          revenue:     parseFloat(r.revenue),
          grossProfit: parseFloat(r.gross_profit),
          expenses:    parseFloat(r.expenses),
          netProfit:   parseFloat(r.net_profit),
          saleCount:   parseInt(r.sale_count),
        })),
        dateFrom: from,
        dateTo:   to,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ success: false, error: "Failed to load dashboard stats" });
  }
}

// GET /analytics/dashboard  (kept for backwards compatibility)
export async function getDashboard(req: Request, res: Response) {
  return getDashboardStats(req, res);
}

export async function getSalesTrend(req: Request, res: Response) {
  const { rows } = await db.query(`
    SELECT
      s.date::text,
      SUM(si.line_revenue)      AS revenue,
      SUM(si.line_gross_profit) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE s.date >= now() - INTERVAL '30 days'
    GROUP BY s.date
    ORDER BY s.date
  `);
  res.json({ success: true, data: rows });
}

export async function getBranchPerformance(req: Request, res: Response) {
  const { rows } = await db.query(`
    SELECT
      l.id AS location_id,
      l.name AS location_name,
      COALESCE(SUM(si.line_revenue), 0)      AS revenue,
      COALESCE(SUM(si.qty_ctn * si.cost_per_ctn_at_sale), 0) AS cogs,
      COALESCE(SUM(si.line_gross_profit), 0) AS gross_profit,
      COALESCE(e.total_expenses, 0) AS expenses,
      COALESCE(SUM(si.line_gross_profit), 0) - COALESCE(e.total_expenses, 0) AS net_profit
    FROM locations l
    LEFT JOIN sales s ON s.location_id = l.id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN (
      SELECT location_id, SUM(amount) AS total_expenses FROM expenses GROUP BY location_id
    ) e ON e.location_id = l.id
    WHERE l.type = 'BRANCH'
    GROUP BY l.id, l.name, e.total_expenses
    ORDER BY revenue DESC
  `);
  res.json({ success: true, data: rows });
}
