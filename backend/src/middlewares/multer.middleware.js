import multer from 'multer'

// copy from express multer github diskstorage section, we can also use memory storage.

const storage = multer.diskStorage({
    destination: function (req, file, cb) { // cb : callback , req is from user, in express we only get request, hence we're using multer, here we also get file.
      cb(null, "./public/temp") // hence we created public and temp in the beginning.
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage: storage })