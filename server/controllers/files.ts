import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { s3 } from '../lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export const getFiles = catchAsync(async (req: Request, res: Response) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
        throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const isMember = project.members.some(m => m.id === req.user.id);
    if (!isMember) {
        throw new AppError('You do not have permission to view files in this project.', 403);
    }

    const files = await prisma.file.findMany({
        where: { projectId },
        include: {
            uploader: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.url,
        type: file.mimeType === 'FOLDER' ? 'FOLDER' : (file.mimeType.startsWith('image/') ? 'IMAGE' : (file.mimeType.startsWith('video/') ? 'VIDEO' : 'DOCUMENT')),
        mimeType: file.mimeType,
        size: file.size,
        parentId: file.folderId,
        createdAt: file.createdAt,
        uploaderId: file.uploaderId,
        user: {
            id: file.uploader.id,
            name: file.uploader.name,
            avatar: file.uploader.avatar
        }
    }));

    res.status(200).json(formattedFiles);
});

export const createFolder = catchAsync(async (req: Request, res: Response) => {
    const { name, folderId, projectId } = req.body;

    if (!name || !projectId) {
        throw new AppError('Name and projectId are required', 400);
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) throw new AppError('Project not found', 404);

    const isMember = project.members.some(m => m.id === req.user.id);
    if (!isMember) throw new AppError('You do not have permission.', 403);

    const newFolder = await prisma.file.create({
        data: {
            name,
            url: '', // Folders don't have S3 URLs
            mimeType: 'FOLDER',
            size: 0,
            projectId,
            folderId: folderId || null,
            uploaderId: req.user.id
        }
    });

    res.status(201).json({ status: 'success', data: { folder: newFolder } });
});

export const uploadFile = catchAsync(async (req: Request, res: Response) => {
    //1.check if multer actually caught a file
    if (!req.file) {
        throw new AppError('No file provide', 400);
    }

    //In 'multipart/form-data',text fields come through req.body not req.query
    const { projectId, folderId } = req.body;

    if (!projectId) {
        throw new AppError('Please select a project to upload this file to.', 400);
    }

    //2.verify the project exists and user is a member
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 400);
    }

    const isMember = project.members.some(m => m.id === req.user.id);

    if (!isMember) {
        throw new AppError('You do not have permission to upload files to this project.', 403);
    }

    //3.generate a safe,unique filename for AWS S3
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = req.file.originalname.split('.').pop();
    const uniqueFileName = `${projectId}/${randomName}.${extension}`;

    //4.send the file from RAM directly to AWS S3 (via Supabase)
    const command = new PutObjectCommand({
        Bucket: process.env.SUPABASE_BUCKET!,
        Key: uniqueFileName,
        Body: req.file.buffer,//this is the file sitting in RAM from Multer;
        ContentType: req.file.mimetype,
    });

    await s3.send(command);

    //5.Construct the permanent public URL
    // Converts https://[ref].supabase.co/storage/v1/s3 to https://[ref].supabase.co/storage/v1/object/public
    const baseUrl = process.env.SUPABASE_S3_ENDPOINT!.replace('/s3', '/object/public');
    const fileUrl = `${baseUrl}/${process.env.SUPABASE_BUCKET}/${uniqueFileName}`;

    //6.save the meatadata to our PostgreSql database
    const newFile = await prisma.file.create({
        data: {
            name: req.file.originalname,
            url: fileUrl,
            mimeType: req.file.mimetype,
            size: req.file.size,
            projectId,
            folderId: folderId || null,
            uploaderId: req.user.id
        }
    });

    res.status(201).json({
        status: 'success',
        data: { file: newFile }
    });
});

export const deleteFile = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
        where: { id }
    });

    if (!file) {
        throw new AppError('File not found', 404);
    }

    // Only the uploader can delete their own files/folders
    if (file.uploaderId !== req.user.id) {
        throw new AppError('You can only delete files you uploaded.', 403);
    }

    // If it's a folder, also delete all files inside it
    if (file.mimeType === 'FOLDER') {
        // Get all files in this folder to delete from S3
        const filesInFolder = await prisma.file.findMany({
            where: { folderId: id, mimeType: { not: 'FOLDER' } }
        });

        // Delete each file from S3
        for (const f of filesInFolder) {
            if (f.url) {
                try {
                    // Extract the S3 key from the URL
                    const bucket = process.env.SUPABASE_BUCKET!;
                    const urlParts = f.url.split(`/${bucket}/`);
                    if (urlParts[1]) {
                        await s3.send(new DeleteObjectCommand({
                            Bucket: bucket,
                            Key: urlParts[1]
                        }));
                    }
                } catch (err) {
                    console.error('Failed to delete file from S3:', err);
                }
            }
        }

        // Delete all children from DB, then the folder itself
        await prisma.file.deleteMany({ where: { folderId: id } });
    } else {
        // Delete the actual file from S3
        if (file.url) {
            try {
                const bucket = process.env.SUPABASE_BUCKET!;
                const urlParts = file.url.split(`/${bucket}/`);
                if (urlParts[1]) {
                    await s3.send(new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: urlParts[1]
                    }));
                }
            } catch (err) {
                console.error('Failed to delete file from S3:', err);
            }
        }
    }

    // Delete from database
    await prisma.file.delete({ where: { id } });

    res.status(204).send();
});