import { Router } from "express";
import { getAllProducts } from "../controllers/product.controller";


const router = Router()

router.route("/all-products").get(getAllProducts)

