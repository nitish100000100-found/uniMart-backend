// const multer=require("multer")
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null,req.params.username + '-' + file.originalname +  Date.now());
//   }
// });
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// }
// const multerOptions = {
//   storage, fileFilter
// };


// module.exports={multerOptions,cloudinary}



// await cloudinary.uploader.destroy(uploadedPublicId); this will delete from cloudinary


const cloudinary = require("cloudinary").v2;
cloudinary.config({
  secure: true,
});
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
},
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});




const uploadToCloudinary = (buffer, public_id) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "unimart",
        public_id: public_id,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = {upload,uploadToCloudinary,cloudinary}
