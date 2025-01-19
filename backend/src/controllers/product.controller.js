import { asyncHandler } from '../utilities/asyncHandler.js'
import { ApiError } from '../utilities/ApiError.js'
import { ApiResponse } from '../utilities/ApiResponse.js'

import { User } from '../models/user.model.js'
import { Product } from '../models/product.model.js'

import mongoose from 'mongoose'
import { uploadOnCloudinary } from '../utilities/cloudinary.js'




// Controller to get all products
const getAllProducts = async (req, res) => {

    try {
        // Extract query parameters for filtering, sorting, and pagination
        const { category, priceMin, priceMax, sortBy, page = 1, limit = 10 } = req.query;

        // Build a filter object based on the query parameters
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (priceMin) {
            filter.price = { ...filter.price, $gte: Number(priceMin) };
        }
        if (priceMax) {
            filter.price = { ...filter.price, $lte: Number(priceMax) };
        }

        // Define sorting logic
        const sortOptions = {};
        if (sortBy) {
            const [field, order] = sortBy.split(':'); // e.g., 'price:asc' or 'price:desc'
            sortOptions[field] = order === 'desc' ? -1 : 1;
        }

        // Fetch products with pagination and sorting
        const products = await Product.find(filter)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate({
                path: 'seller',
                select: 'username fullName avatar'
            })
            .populate({
                path: 'category',
                select: 'name'
            });

        // Get the total count of products matching the filter
        const totalProducts = await Product.countDocuments(filter);
 

        res.status(200).json(
            new ApiResponse(
                200,
                message = "Products retrieved successfully",
                data = {
                    products,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalProducts / limit),
                        totalProducts
                    }
                }
            )
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while retrieving products")
    }
};







// Controller To Get Product By Id
const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params
    //TODO: get video by id

    try {
        // Find the product by ID and populate necessary fields
        const product = await Product.findById(productId)
            .populate({
                path: 'seller',
                select: 'username fullName avatar'
            })
            .populate({
                path: 'category',
                select: 'name'
            });

        if (!product) {
            throw new ApiError(404, error.message || "Product not found")
        }

        res.status(200).json(
            new ApiResponse(
                200,
                message = "Product retrieved successfully",
                data = product
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while retrieving the product")

    }
})






// Control To Update Product Details
const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description, price, images, category } = req.body;

    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found")
        }

        // Update product fields with the new values if provided
        if (title) product.title = title;
        if (description) product.description = description;
        if (price) product.price = price;
        if (images) product.images = images;
        if (category) product.category = category;

        // Save the updated product
        const updatedProduct = await product.save();

        res.status(200).json(
            new ApiResponse(
                message = "Product updated successfully",
                data = updateProduct
            )
        )
    } catch (error) {
        throw new ApiError(500 , error.message || "An error occurred while updating the product")
    }

})







// Controller To Delete The Product
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params
    //TODO: delete video

    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found")
        }

        // Delete the product
        await product.deleteOne();

        res.status(200).jaon(
            new ApiResponse(
                message = "Product deleted successfully"
            )
        )
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while deleting the product', error: error.message });
        throw new ApiError(500, error.message || "An error occurred while deleting the product")
    }

})






// Controller To Toggle IsSold Status 
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { productId } = req.params

    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Toggle the `isSold` status
        product.isSold = !product.isSold;

        // Save the updated product
        const updatedProduct = await product.save();

        res.status(200).json({
            message: 'Product publish status updated successfully',
            product: updatedProduct
        });
        res.status(200).json(
            new ApiResponse(
                200,
                message = "Product publish status updated successfully",
                data = updatedProduct
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the product status")
    }

})




export {
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    togglePublishStatus
}




