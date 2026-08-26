import { Router } from "express";
import authRoutes        from "./auth.routes";
import locationsRoutes   from "./locations.routes";
import productRoutes     from "./products.routes";
import inventoryRoutes   from "./inventory.routes";
import receivingRoutes   from "./receiving.routes";
import transferRoutes    from "./transfers.routes";
import branchTransfers   from "./branch-transfers.routes";
import salesRoutes       from "./sales.routes";
import expenseRoutes     from "./expenses.routes";
import debtRoutes        from "./debts.routes";
import analyticsRoutes   from "./analytics.routes";

const router = Router();

router.use("/auth",            authRoutes);
router.use("/locations",       locationsRoutes);
router.use("/products",        productRoutes);
router.use("/inventory",       inventoryRoutes);
router.use("/receiving",       receivingRoutes);
router.use("/transfers",       transferRoutes);
router.use("/branch-transfers", branchTransfers);
router.use("/sales",           salesRoutes);
router.use("/expenses",        expenseRoutes);
router.use("/debts",           debtRoutes);
router.use("/analytics",       analyticsRoutes);

export default router;
