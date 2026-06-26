import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// 1. Get all notifications for the logged-in user
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' } // Newest first!
    });

    res.status(200).json({ status: 'success', data: { notifications } });
});

// 2. Mark a specific notification as Read
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    // Verify ownership before updating
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    });

    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.userId !== req.user.id) {
        throw new AppError('You do not have permission to modify this.', 403);
    }

    const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    });

    res.status(200).json({ status: 'success', data: { notification: updated } });
});

// 3. Mark ALL notifications as Read (Quality of Life feature)
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
        where: { userId: req.user.id, read: false },
        data: { read: true }
    });

    res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
});
