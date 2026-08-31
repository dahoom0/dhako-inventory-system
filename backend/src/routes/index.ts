import { Router } from "express";
import authRoutes        from "./auth.routes";
import locationsRoutes   from "./locations.routes";
import productRoutes     from "./products.routes";
import inventoryRoutes   from "./inventory.routes";
import receivingRoutes   from "./receiving.routes";
import adjustmentsRoutes from "./adjustments.routes";
import transferRoutes    from "./transfers.routes";
import branchTransfers   from "./branch-transfers.routes";
import salesRoutes       from "./sales.routes";
import expenseRoutes     from "./expenses.routes";
import debtRoutes        from "./debts.routes";
import analyticsRoutes   from "./analytics.routes";
import customersRoutes   from "./customers.routes";
import categoriesRoutes  from "./categories.routes";

const router = Router();

router.use("/auth",            authRoutes);
router.use("/locations",       locationsRoutes);
router.use("/products",        productRoutes);
router.use("/customers",       customersRoutes);
router.use("/inventory",       inventoryRoutes);
router.use("/receiving",       receivingRoutes);
router.use("/adjustments",     adjustmentsRoutes);
router.use("/transfers",       transferRoutes);
router.use("/branch-transfers", branchTransfers);
router.use("/sales",           salesRoutes);
router.use("/expenses",        expenseRoutes);
router.use("/debts",           debtRoutes);
router.use("/analytics",       analyticsRoutes);
router.use("/categories",      categoriesRoutes);

export default router;