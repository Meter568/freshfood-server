import express from "express";
import { addToBasket, getBasket, removeFromBasket, updateBasketItem } from "../controllers/basketController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addToBasket);
router.get("/", authMiddleware, getBasket);
router.put("/:productId", authMiddleware, updateBasketItem);
router.delete("/:productId", authMiddleware, removeFromBasket);

export default router;