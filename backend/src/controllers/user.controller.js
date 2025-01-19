import { asyncHandler } from '../utilities/asyncHandler.js'
import { ApiError } from '../utilities/ApiError.js'
import { ApiResponse } from '../utilities/ApiResponse.js'
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utilities/cloudinary.js'


// Access and Refresh Token Generation Controller
const generateAccessAndRefreshTokens = async(userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
    }
}



// User Registration Controller
const registerUser = asyncHandler( async(req,res) => {

    const {username, email, fullName, password} = req.body

    if([username,email,fullName,password].some((field)=>(field?.trim()==""))){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    
    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        password,
        username: username.toLowerCase(),
        email
    })

    const createdUser = await User.findById(user?._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(400, "Something went wrong while registering the user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} )





// User Login Controller
const loginUser = asyncHandler( async(req,res) => {
    const { email, username, password } = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }


    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // now we'll send these accessToken and refreshToken into cookies
    // by doing below code now your cookie can only be modified through server, and not through frontend
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200,{
            user: loggedInUser, accessToken, refreshToken
        }, "User logged In Successfully" )
    )


} )




// User Logout Controller

const logoutUser = asyncHandler( async (req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // remove refresh token from the db
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200,{},"User logged Out"))

} )





// Controller For Refreshing Access Token

const refreshAccessToken = asyncHandler( async(req,res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {

        const decodedToken = await json.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"

        )
        
    } catch (error) {
        throw new ApiError(401, error?.messsage || "Invalid refresh token")
    }


} )






// Controller For Changing Password

const changeCurrentPassword = asyncHandler( async(req,res) => {

    const {oldPassword, newPassword, confirmPassword} = req.body
    

    if(!(newPassword===confirmPassword)){
        throw new ApiError(400,"Password and confirm password don't match")
    }

    const user = await User.findById(user._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password changed successfully")
    )


} )





// Controller For Getting Current User

const getCurrentUser = asyncHandler( async(req,res) =>{
    return res.status(200).json(
        200,
        req.user,
        "Current user fetched successfully"
    )
} )




// Controller For Updating User Details

const updateAccountDetails = asyncHandler( async(req,res) => {

    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {fullName, email}
        },
        {new: true}
    ).select("-password")


    return res.status(200).json(
        new ApiResponse(200,user,"Account details updated successfully")
    )

} )







// Controller for updating user avatar

const updateUserAvatar = asyncHandler( async(req,res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar: avatar.url}
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )

} )






// Controller to save a product to saved content
const saveProductToSavedContent = async (req, res) => {
    try {
        const userId = req.user._id; // Authenticated user ID
        const productId = req.body.productId; // Product ID from the request body

        // Find the user and check if the product is already saved
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(400,"User not found")
        }

        if (user.savedContent.includes(productId)) {
            return res.status(400).json(
                new ApiResponse(
                    200,
                    "Product is already in saved content"
                )
            )
        }

        // Add the product to the savedContent array
        user.savedContent.push(productId);
        await user.save({validateBeforeSave: false});

        res.status(200).json(
            new ApiResponse(
                200,
                "Product added to saved content successfully"
            )
        );

    } catch (error) {
        throw new ApiError(500, error.messsage || "An error occurred while saving the product")
    }
}






// Controller to remove a product from saved content
const removeProductFromSavedContent = async (req, res) => {
    try {
        const userId = req.user._id; // Authenticated user ID
        const productId = req.body.productId; // Product ID from the request body

        // Find the user and remove the product from savedContent
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404,"User not found")
        }

        if (!user.savedContent.includes(productId)) {
            throw new ApiError(400, "Product is not in saved content")
        }

        user.savedContent = user.savedContent.filter(
            (savedProductId) => savedProductId.toString() !== productId
        );
        await user.save({validateBeforeSave: true});

        res.status(200).json(
            new ApiResponse(
                200,
                "Product removed from saved content successfully",
            )
        );
    } catch (error) {
        throw new ApiError(500, error.messsage || "An error occurred while removing the product")
    }
};




// Controller to get saved content
const getSavedProducts = async (req, res) => {
    try {
        // Extract user ID from the request (assuming it's in req.user)
        const userId = req.user._id;

        // Find the user and populate the savedContent field with product details
        const user = await User.findById(userId).populate({
            path: 'savedContent',
            select: 'title description price images seller category isSold',
            populate: [
                { path: 'seller', select: 'username fullName avatar' },
                { path: 'category', select: 'name' }
            ]
        });

        // If user is not found
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        // Return the saved content
        res.status(200).json({
            message: 'Saved content retrieved successfully',
            savedContent: user.savedContent
        });

        res.status(200).json(
            new ApiResponse(
                200,
                'Saved content retrieved successfully',
                user.savedContent
            )
        )
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while retrieving saved content', error: error.message });
    }
};



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    saveProductToSavedContent,
    removeProductFromSavedContent,
    getSavedProducts
}
