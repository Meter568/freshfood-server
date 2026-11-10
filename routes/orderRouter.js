import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, getOrders, adminGetAllOrders, adminUpdateOrderStatus, getOrdersByGuestEmail, resendOrderCheck, adminDeleteOrder, getOrdersByUserId } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.get('/guest', getOrdersByGuestEmail);
router.post("/:orderId/resend-check", authMiddleware, resendOrderCheck);

// admin endpoints
router.get("/admin/all", authMiddleware, adminGetAllOrders);
router.patch("/admin/status/:id", authMiddleware, adminUpdateOrderStatus);
router.delete("/admin/:id", authMiddleware, adminDeleteOrder);
router.get("/user/:id", authMiddleware, getOrdersByUserId);

export default router;