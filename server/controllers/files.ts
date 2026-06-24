import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { s3 } from '../lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export const uploadFile = catchAsync(async (req: Request, res: Response) => {
    //1.check if multer actually caught a file
    if (!req.file) {
        throw new AppError('No file provide', 400);
    }

    //In 'multipart/form-data',text fields come through req.body not req.query
    const { projectId } = req.body;

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

    //4.send the file from RAM directly to AWS S3
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: uniqueFileName,
        Body: req.file.buffer,//this is the file sitting in RAM from Multer;
        ContentType: req.file.mimetype,
    });

    await s3.send(command);

    //5.Construct the permanent public URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    //6.save the meatadata to our PostgreSql database
    const newFile = await prisma.file.create({
        data: {
            name: req.file.originalname,
            url: fileUrl,
            mimeType: req.file.mimetype,
            size: req.file.size,
            projectId,
            uploaderId: req.user.id
        }
    });

    res.status(201).json({
        status: 'success',
        data: { file: newFile }
    });
});