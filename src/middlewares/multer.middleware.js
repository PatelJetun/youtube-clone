import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //add an unique suffix to filename and use a different name other than original name in prefix
  },
});

export const upload = multer({
  storage,
});
