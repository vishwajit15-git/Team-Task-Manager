import { Router } from "express";
import { uploadFile } from "../controllers/files";
import { protect } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();


//  /api/files/upload
router.post('/upload', protect, upload.single('file'), uploadFile);

export default router;