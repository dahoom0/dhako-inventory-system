import { Request, Response } from "express";
import { db } from "../config/db";

export async function getDashboard(req: Request, res: Response) {
  const [revenue, expenses, debts, alerts] = await Promise.all([
    db.query(`
      SELECT
        SUM(si.line_revenue)      AS total_revenue,
        SUM(si.qty_ctn * si.cost_per_ctn_at_sale) AS total_cogs,
        SUM(si.line_gross_profit) AS total_gross_profit
      FROM sale_items si
    `),
    db.query("SELECT SUM(amount) AS total_expenses FROM expenses"),
    db.query("SELECT SUM(original_amount - paid_amount) AS total_outstanding FROM debts WHERE status != 'PAID'"),
    db.query("SELECT COUNT(*) AS alert_count FROM low_stock_alerts"),
  ]);

  const grossProfit = parseFloat(revenue.rows[0].total_gross_profit || "0");
  const totalExpenses = parseFloat(expenses.rows[0].total_expenses || "0");

  res.json({
    success: true,
    data: {
      totalRevenue:     parseFloat(revenue.rows[0].total_revenue    || "0"),
      totalCOGS:        parseFloat(revenue.rows[0].total_cogs       || "0"),
      grossProfit,
      totalExpenses,
      netProfit:        grossProfit - totalExpenses,
      outstandingDebt:  parseFloat(debts.rows[0].total_outstanding  || "0"),
      lowStockAlerts:   parseInt(alerts.rows[0].alert_count         || "0"),
    },
  });
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
      SUM(si.line_revenue)      AS revenue,
      SUM(si.qty_ctn * si.cost_per_ctn_at_sale) AS cogs,
      SUM(si.line_gross_profit) AS gross_profit,
      COALESCE(e.total_expenses, 0) AS expenses,
      SUM(si.line_gross_profit) - COALESCE(e.total_expenses, 0) AS net_profit
    FROM locations l
    JOIN sales s ON s.location_id = l.id
    JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN (
      SELECT location_id, SUM(amount) AS total_expenses FROM expenses GROUP BY location_id
    ) e ON e.location_id = l.id
    WHERE l.type = 'BRANCH'
    GROUP BY l.id, l.name, e.total_expenses
    ORDER BY revenue DESC
  `);
  res.json({ success: true, data: rows });
}
