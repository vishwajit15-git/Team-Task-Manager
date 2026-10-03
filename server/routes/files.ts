import { Router } from "express";
import { uploadFile, getFiles, createFolder, deleteFile } from "../controllers/files";
import { protect } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

//  /api/files
router.get('/', protect, getFiles);

//  /api/files/folder
router.post('/folder', protect, createFolder);

//  /api/files/upload
router.post('/upload', protect, upload.single('file'), uploadFile);

//  /api/files/:id
router.delete('/:id', protect, deleteFile);

export default router;