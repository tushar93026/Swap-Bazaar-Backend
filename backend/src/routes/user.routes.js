import {Router} from 'express'
import { changeCurrentPassword, getCurrentUser, getSavedProducts, loginUser, logoutUser, refreshAccessToken, registerUser, removeProductFromSavedContent, saveProductToSavedContent, updateAccountDetails, updateUserAvatar } from '../controllers/user.controller.js'
import { upload }  from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'


const router = Router()


// Route For Registering The User
router.route("/register").post(
    upload.single("avatar"),
    registerUser

)


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(verifyJWT,refreshAccessToken)

router.route("/change-password").post(verifyJWT ,changeCurrentPassword)

router.route("/current-user").get( verifyJWT,getCurrentUser)

router.route("update-account").patch(verifyJWT ,updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/save-product-to-saved-content").post( verifyJWT,saveProductToSavedContent)

router.route("/remove-product").delete( verifyJWT,removeProductFromSavedContent)

router.route("/saved-products").get( verifyJWT,getSavedProducts)


export default router