import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const now = new Date();

    // 1. Active Projects Count
    const activeProjects = await prisma.project.count({
        where: {
            members: { some: { id: userId } },
            status: 'ACTIVE'
        }
    });

    // Total Projects (for percentage bar)
    const totalProjects = await prisma.project.count({
        where: { members: { some: { id: userId } } }
    });

    // 2. My Open Tasks (Tasks assigned to you that are not completed)
    const openTasks = await prisma.task.count({
        where: {
            assigneeId: userId,
            status: { not: 'COMPLETED' }
        }
    });

    // 3. Completed Tasks
    const completedTasks = await prisma.task.count({
        where: {
            assigneeId: userId,
            status: 'COMPLETED'
        }
    });

    // Total tasks assigned to user (for completion % bar)
    const totalTasks = await prisma.task.count({
        where: { assigneeId: userId }
    });

    // 4. Team Capacity (Total members across all your projects)
    const projects = await prisma.project.findMany({
        where: { members: { some: { id: userId } } },
        include: { members: { select: { id: true } } }
    });
    
    const uniqueMemberIds = new Set();
    projects.forEach(p => p.members.forEach(m => uniqueMemberIds.add(m.id)));
    const teamCapacity = uniqueMemberIds.size;

    // Base filter: tasks in projects the user is a member of
    const projectIds = projects.map(p => p.id);

    // 5. Ongoing Tasks (IN_PROGRESS, not overdue)
    const ongoingTasks = await prisma.task.findMany({
        where: {
            projectId: { in: projectIds },
            status: 'IN_PROGRESS',
            OR: [
                { dueDate: null },
                { dueDate: { gte: now } }
            ]
        },
        include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 20
    });

    // 6. Pending Tasks (TODO status)
    const pendingTasks = await prisma.task.findMany({
        where: {
            projectId: { in: projectIds },
            status: 'TODO'
        },
        include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    // 7. Overdue Tasks (dueDate < now, not completed)
    const overdueTasks = await prisma.task.findMany({
        where: {
            projectId: { in: projectIds },
            status: { not: 'COMPLETED' },
            dueDate: { lt: now }
        },
        include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 20
    });

    // 8. Rich Activity Log: recent comments + recently updated tasks in user's projects
    const recentComments = await prisma.comment.findMany({
        where: { task: { projectId: { in: projectIds } } },
        include: {
            author: { select: { name: true } },
            task: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
    });

    const recentTasks = await prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: { creator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8
    });

    // Merge and sort by date to build one unified activity log
    const activityLog = [
        ...recentComments.map(c => ({
            id: `comment-${c.id}`,
            message: `${c.author.name} commented on "${c.task.title}"`,
            createdAt: c.createdAt
        })),
        ...recentTasks.map(t => ({
            id: `task-${t.id}`,
            message: `${t.creator.name} created task "${t.title}"`,
            createdAt: t.createdAt
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                activeProjects,
                totalProjects,
                openTasks,
                completedTasks,
                totalTasks,
                teamCapacity
            },
            ongoingTasks,
            pendingTasks,
            overdueTasks,
            activityLog
        }
    });
});
