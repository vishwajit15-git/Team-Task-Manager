import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const now = new Date();
    const queryProjectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() !== ''
        ? req.query.projectId.trim()
        : undefined;

    // 1. Projects user is a member of
    const userProjects = await prisma.project.findMany({
        where: { members: { some: { id: userId } } },
        include: { members: { select: { id: true } } }
    });
    const userProjectIds = userProjects.map(p => p.id);

    // If queryProjectId specified and user is a member of it, scope to that project, else all user projects
    const targetProjectIds = (queryProjectId && userProjectIds.includes(queryProjectId))
        ? [queryProjectId]
        : userProjectIds;

    // Active Projects Count
    const activeProjects = userProjects.filter(p => p.status === 'ACTIVE').length;
    const totalProjects = userProjects.length;

    // 2. My Open Tasks (Tasks assigned to the current user that are not completed)
    const openTasks = await prisma.task.count({
        where: {
            projectId: { in: targetProjectIds },
            assigneeId: userId,
            status: { not: 'COMPLETED' }
        }
    });

    // Total tasks assigned to the current user
    const myTotalTasks = await prisma.task.count({
        where: {
            projectId: { in: targetProjectIds },
            assigneeId: userId
        }
    });

    // 3. Completed Tasks across the project(s)
    const completedTasks = await prisma.task.count({
        where: {
            projectId: { in: targetProjectIds },
            status: 'COMPLETED'
        }
    });

    // Total tasks across the project(s) (for completion % bar)
    const totalTasks = await prisma.task.count({
        where: {
            projectId: { in: targetProjectIds }
        }
    });

    // 4. Team Capacity (Total unique members across projects)
    const uniqueMemberIds = new Set<string>();
    const scopedProjects = (queryProjectId && userProjectIds.includes(queryProjectId))
        ? userProjects.filter(p => p.id === queryProjectId)
        : userProjects;
    scopedProjects.forEach(p => p.members.forEach(m => uniqueMemberIds.add(m.id)));
    const teamCapacity = uniqueMemberIds.size;

    // 5. Ongoing Tasks (IN_PROGRESS, not overdue)
    const ongoingTasks = await prisma.task.findMany({
        where: {
            projectId: { in: targetProjectIds },
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
            projectId: { in: targetProjectIds },
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
            projectId: { in: targetProjectIds },
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
        where: { task: { projectId: { in: targetProjectIds } } },
        include: {
            author: { select: { name: true } },
            task: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
    });

    const recentTasks = await prisma.task.findMany({
        where: { projectId: { in: targetProjectIds } },
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
                myTotalTasks,
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
