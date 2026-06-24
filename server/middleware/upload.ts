import multer from "multer";

//we do not want to save files to the local disk/server.
//we want to keep the file in RAM, and immediately stream it to AWS s3
const storage = multer.memoryStorage();

//add file size limits to prevent DDOS attacks
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, //5mb limits
    },
});