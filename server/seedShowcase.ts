import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function seed() {
  console.log('🚀 Starting Showcase Project Seeding...');

  const password = 'Demo@2026Password!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 1. Create or upsert users with rich database attributes
  const userData = [
    {
      name: 'Elena Rostova',
      email: 'admin.elena@cloudscale.io',
      role: 'ADMIN' as const,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      title: 'Engineering Director & Enterprise Architect',
      department: 'Engineering Leadership',
      bio: 'Leading cloud architecture modernization, cross-functional engineering teams, and enterprise SLAs for CloudScale.',
      skills: ['Distributed Systems', 'System Architecture', 'Zero-Trust Security', 'Team Leadership', 'Kubernetes'],
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Principal Cloud Architect',
      department: 'Backend Platform',
      bio: 'Specializing in real-time streaming architectures, event-driven microservices, Redis Pub/Sub, and gateway authorization.',
      skills: ['High-Concurrency Backends', 'Redis Pub/Sub', 'Stateless JWT', 'PostgreSQL', 'Node.js', 'System Design'],
    },
    {
      name: 'Sophia Lin',
      email: 'sophia.l@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      title: 'Principal Frontend Engineer',
      department: 'Frontend Engineering',
      bio: 'Crafting responsive design systems, interactive data visualizations, and high-performance frontend interfaces.',
      skills: ['React 19', 'TypeScript', 'Tailwind CSS', 'Interactive Timelines', 'Web Performance', 'Micro-Frontends'],
    },
    {
      name: "David O'Connor",
      email: 'david.devops@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'DevOps & SRE Lead',
      department: 'Infrastructure & Reliability',
      bio: 'Driving cloud infrastructure automation, CI/CD pipelines, and high-availability multi-region resilience.',
      skills: ['Kubernetes (EKS)', 'Helm', 'ArgoCD GitOps', 'Disaster Recovery', 'Multi-Region Failover', 'Terraform'],
    },
    {
      name: 'Amara Okafor',
      email: 'amara.design@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      title: 'Principal Product Designer',
      department: 'Product & UX',
      bio: 'Creating cohesive design tokens, typography hierarchies, and intuitive user experiences for enterprise platforms.',
      skills: ['Figma Tokens', 'Design Systems', 'WCAG AA Accessibility', 'User Research', 'Rapid Prototyping'],
    },
    {
      name: 'Kenji Takahashi',
      email: 'kenji.sec@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Senior Security & Compliance Engineer',
      department: 'InfoSec & Compliance',
      bio: 'Ensuring zero-trust perimeter security, cryptographic key governance, and automated regulatory compliance.',
      skills: ['SOC2 Type II', 'AWS KMS Envelope Encryption', 'Secrets Rotation', 'Vulnerability Audits', 'Zero-Trust'],
    },
    {
      name: 'Rachel Green',
      email: 'rachel.qa@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'Lead QA Automation Engineer',
      department: 'Quality Engineering',
      bio: 'Architecting scalable automated test frameworks, regression suites, and CI/CD quality gates.',
      skills: ['Playwright', 'Cypress', 'End-to-End Testing', 'Smoke Regression', 'API Contract Testing', 'CI Automation'],
    },
    {
      name: 'Tariq Al-Mansoor',
      email: 'tariq.data@cloudscale.io',
      role: 'MEMBER' as const,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      title: 'Staff Data Engineer',
      department: 'Data Platform',
      bio: 'Building low-latency data ingestion pipelines, analytical warehouses, and event-driven observability.',
      skills: ['Kafka Event Streaming', 'ClickHouse', 'ETL Data Pipelines', 'Real-Time Analytics', 'Python', 'SQL'],
    },
  ];

  const users: Record<string, any> = {};

  for (const u of userData) {
    const user = await (prisma.user as any).upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        avatar: u.avatar,
        title: u.title,
        department: u.department,
        bio: u.bio,
        skills: u.skills,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        avatar: u.avatar,
        title: u.title,
        department: u.department,
        bio: u.bio,
        skills: u.skills,
      },
    });
    users[u.email] = user;
    console.log(`✓ User synced with DB profile: ${user.name} (${user.email}) - Title: ${(user as any).title}`);
  }

  // 2. Create or sync Project: CloudScale Enterprise 2.0
  const projectName = 'CloudScale Enterprise 2.0';
  let project = await prisma.project.findFirst({
    where: { name: projectName },
  });

  const memberConnect = Object.values(users).map((u) => ({ id: u.id }));

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: projectName,
        description: 'Next-generation distributed microservices architecture, zero-trust cloud security, and real-time event streaming platform.',
        status: 'ACTIVE',
        members: {
          connect: memberConnect,
        },
      },
    });
    console.log(`✓ Created project: ${project.name} (${project.id})`);
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        description: 'Next-generation distributed microservices architecture, zero-trust cloud security, and real-time event streaming platform.',
        status: 'ACTIVE',
        members: {
          set: memberConnect,
        },
      },
    });
    console.log(`✓ Updated project: ${project.name} (${project.id}) with ${memberConnect.length} members`);
  }

  // 3. Clear existing tasks for clean seeding
  await prisma.comment.deleteMany({
    where: { task: { projectId: project.id } },
  });
  await prisma.task.deleteMany({
    where: { projectId: project.id },
  });

  // 4. Create rich tasks across all statuses and priorities
  const elena = users['admin.elena@cloudscale.io'];
  const marcus = users['marcus.v@cloudscale.io'];
  const sophia = users['sophia.l@cloudscale.io'];
  const david = users['david.devops@cloudscale.io'];
  const amara = users['amara.design@cloudscale.io'];
  const kenji = users['kenji.sec@cloudscale.io'];
  const rachel = users['rachel.qa@cloudscale.io'];
  const tariq = users['tariq.data@cloudscale.io'];

  const tasksData = [
    // COMPLETED Tasks
    {
      title: 'Zero-Trust JWT & OAuth2 Authorization Gateway',
      description: 'Implement distributed stateless session verification and role-based permissions at the edge gateway.',
      status: 'COMPLETED' as const,
      priority: 'CRITICAL' as const,
      startDate: new Date('2026-10-01T09:00:00Z'),
      dueDate: new Date('2026-10-06T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: marcus.id,
    },
    {
      title: 'Kubernetes Multi-Cluster Helm Deployment Automation',
      description: 'Configure automated GitOps sync using ArgoCD and multi-zone ingress failover on EKS.',
      status: 'COMPLETED' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-10-03T09:00:00Z'),
      dueDate: new Date('2026-10-08T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: david.id,
    },
    {
      title: 'Design System & Dark Mode Design Tokens Specification',
      description: 'Audit WCAG AA compliance, establish typography scales, and publish Figma library variables.',
      status: 'COMPLETED' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2026-10-02T09:00:00Z'),
      dueDate: new Date('2026-10-07T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: amara.id,
    },

    // IN_PROGRESS Tasks
    {
      title: 'Real-Time WebSocket Notification Bus with Redis Adapter',
      description: 'Scale WebSocket room broadcasting with Pub/Sub Redis backing and instant Sonner toast alerts.',
      status: 'IN_PROGRESS' as const,
      priority: 'CRITICAL' as const,
      startDate: new Date('2026-10-08T09:00:00Z'),
      dueDate: new Date('2026-10-18T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: marcus.id,
    },
    {
      title: 'Interactive Timeline & Gantt Calendar Glow Visualization',
      description: 'Build glowing row-spanning date bars with active status color indicators and tooltip details.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-10-09T09:00:00Z'),
      dueDate: new Date('2026-10-19T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: sophia.id,
    },
    {
      title: 'SOC2 Type II Audit & Secrets Vault Rotation System',
      description: 'Implement automated envelope encryption via AWS KMS and schedule 30-day credential recycling.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-10-07T09:00:00Z'),
      dueDate: new Date('2026-10-17T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: kenji.id,
    },
    {
      title: 'Kafka Event Streaming Pipeline for Real-Time Analytics',
      description: 'Stream transaction events into ClickHouse with exactly-once consumer group semantics.',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2026-10-10T09:00:00Z'),
      dueDate: new Date('2026-10-22T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: tariq.id,
    },

    // OVERDUE Task (To test the Bright Red Overdue Badge!)
    {
      title: 'SSL Certificate Automated Wildcard Renewal Test',
      description: 'Verify Let’s Encrypt ACME automated DNS challenge rotation across all staging domains.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-09-25T09:00:00Z'),
      dueDate: new Date('2026-10-05T18:00:00Z'), // Past due date!
      creatorId: elena.id,
      assigneeId: kenji.id,
    },

    // REVIEW Tasks
    {
      title: 'End-to-End Cypress & Playwright Automated Smoke Suites',
      description: 'Validate cross-browser rendering, session resumption, and multi-tenant project switching in CI.',
      status: 'REVIEW' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-10-06T09:00:00Z'),
      dueDate: new Date('2026-10-14T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: rachel.id,
    },
    {
      title: 'Brand & Digital Assets S3 Multipart Upload Optimization',
      description: 'Implement direct client-to-S3 presigned uploads with chunked parallel transfer and instant preview.',
      status: 'REVIEW' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2026-10-08T09:00:00Z'),
      dueDate: new Date('2026-10-15T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: sophia.id,
    },
    {
      title: 'Global Search Indexing with Fuzzy Match & Keyboard Navigation',
      description: 'Support Ctrl+K spotlight modal, real-time query filtering, and keyboard arrow selection.',
      status: 'REVIEW' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2026-10-09T09:00:00Z'),
      dueDate: new Date('2026-10-16T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: sophia.id,
    },

    // TODO Tasks
    {
      title: 'Disaster Recovery Multi-Region Database Failover Drill',
      description: 'Execute automated cross-region Aurora PostgreSQL replica promotion within 45 seconds RTO.',
      status: 'TODO' as const,
      priority: 'CRITICAL' as const,
      startDate: new Date('2026-10-15T09:00:00Z'),
      dueDate: new Date('2026-10-28T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: david.id,
    },
    {
      title: 'GraphQL Federation Subgraph Migration',
      description: 'Consolidate REST endpoints into Apollo Federation subgraphs with unified schema contract testing.',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2026-10-18T09:00:00Z'),
      dueDate: new Date('2026-10-30T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: marcus.id,
    },
    {
      title: 'Mobile Responsive Navigation & Adaptive Viewport Refactor',
      description: 'Optimize sheet drawer transitions, touch-target sizes, and compact breadcrumbs on small screens.',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      startDate: new Date('2026-10-20T09:00:00Z'),
      dueDate: new Date('2026-11-05T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: amara.id,
    },
    {
      title: 'Legacy API Sunset & Deprecation Notice',
      description: 'Issue HTTP 299 warning headers and provide 60-day migration guides for legacy clients.',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      startDate: new Date('2026-10-22T09:00:00Z'),
      dueDate: new Date('2026-11-10T18:00:00Z'),
      creatorId: elena.id,
      assigneeId: elena.id,
    },
  ];

  const createdTasks: any[] = [];
  for (const t of tasksData) {
    const task = await prisma.task.create({
      data: {
        ...t,
        projectId: project.id,
      },
    });
    createdTasks.push(task);
  }
  console.log(`✓ Created ${createdTasks.length} rich showcase tasks`);

  // 5. Add comments to showcase task discussion feed
  const primaryTask = createdTasks.find((t) => t.title.includes('WebSocket'));
  if (primaryTask) {
    await prisma.comment.createMany({
      data: [
        {
          taskId: primaryTask.id,
          authorId: elena.id,
          content: 'Benchmark tests show we can handle 50,000 concurrent socket connections per node. Excellent work Marcus.',
        },
        {
          taskId: primaryTask.id,
          authorId: marcus.id,
          content: 'Thanks Elena! Redis adapter replication is verified across 3 availability zones.',
        },
        {
          taskId: primaryTask.id,
          authorId: sophia.id,
          content: 'Frontend listener hooks are wired up with Sonner toast triggers. Smooth and instant.',
        },
      ],
    });
    console.log(`✓ Added comments on task: ${primaryTask.title}`);
  }

  // 6. Add team chat messages in the project room
  await prisma.message.deleteMany({ where: { projectId: project.id } });
  await prisma.message.createMany({
    data: [
      {
        projectId: project.id,
        senderId: elena.id,
        content: 'Welcome everyone to the CloudScale Enterprise 2.0 sprint kickoff! All core milestones and SLAs are scheduled on the timeline.',
      },
      {
        projectId: project.id,
        senderId: david.id,
        content: 'Infrastructure clusters on EKS us-east-1 and us-west-2 are green and running ArgoCD sync.',
      },
      {
        projectId: project.id,
        senderId: amara.id,
        content: 'Brand guidelines and digital assets are uploaded to the Assets suite. Check out the typography and color tokens!',
      },
      {
        projectId: project.id,
        senderId: kenji.id,
        content: 'Security scan passed with zero high-severity vulnerabilities. Audit logs are streaming to Datadog.',
      },
      {
        projectId: project.id,
        senderId: sophia.id,
        content: 'Search bar (Ctrl+K) and interactive glowing timeline are fully integrated with real-time updates.',
      },
    ],
  });
  console.log(`✓ Seeded team chat messages`);

  // 7. Add an active Poll for team decision making
  await prisma.poll.deleteMany({ where: { projectId: project.id } });
  const poll = await prisma.poll.create({
    data: {
      projectId: project.id,
      creatorId: elena.id,
      question: 'Which cloud provider should we use for secondary Disaster Recovery (DR) region?',
      options: {
        create: [
          { text: 'AWS (us-east-2 Ohio)' },
          { text: 'Google Cloud (us-central1 Iowa)' },
          { text: 'Microsoft Azure (East US 2 Virginia)' },
        ],
      },
    },
    include: { options: true },
  });

  // Cast initial votes
  if (poll.options.length >= 3) {
    await prisma.vote.createMany({
      data: [
        { userId: elena.id, pollOptionId: poll.options[0].id },
        { userId: marcus.id, pollOptionId: poll.options[0].id },
        { userId: david.id, pollOptionId: poll.options[0].id },
        { userId: sophia.id, pollOptionId: poll.options[1].id },
        { userId: kenji.id, pollOptionId: poll.options[0].id },
        { userId: tariq.id, pollOptionId: poll.options[1].id },
      ],
      skipDuplicates: true,
    });
    console.log(`✓ Seeded poll and votes: "${poll.question}"`);
  }

  // 8. Add project files / brand assets
  await prisma.file.deleteMany({ where: { projectId: project.id } });
  await prisma.file.createMany({
    data: [
      {
        name: 'CloudScale_Architecture_v2.png',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/png',
        size: 1420000,
        projectId: project.id,
        uploaderId: marcus.id,
      },
      {
        name: 'Design_System_Tokens.png',
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/png',
        size: 980000,
        projectId: project.id,
        uploaderId: amara.id,
      },
      {
        name: 'SOC2_Compliance_Report_Q3.png',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/png',
        size: 2150000,
        projectId: project.id,
        uploaderId: kenji.id,
      },
    ],
  });
  console.log(`✓ Seeded project files & brand assets`);

  // 9. Add real-time notifications for Elena, Marcus, and Sophia
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [elena.id, marcus.id, sophia.id] },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: elena.id,
        title: 'Sprint Milestone Completed',
        message: 'Marcus Vance completed task "Zero-Trust JWT & OAuth2 Authorization Gateway".',
        type: 'task_assigned',
        read: false,
      },
      {
        userId: elena.id,
        title: 'New PR Ready for Review',
        message: 'Sophia Lin submitted "Interactive Timeline & Gantt Calendar Glow Visualization" for review.',
        type: 'task_assigned',
        read: false,
      },
      {
        userId: marcus.id,
        title: 'High Priority Assignment',
        message: 'You have been assigned to "Real-Time WebSocket Notification Bus with Redis Adapter".',
        type: 'task_assigned',
        read: false,
      },
      {
        userId: sophia.id,
        title: 'Design Specification Updated',
        message: 'Amara Okafor updated color palette tokens for Dark Mode and Gold Accents.',
        type: 'project_invite',
        read: false,
      },
    ],
  });
  console.log(`✓ Seeded real-time notifications`);

  console.log('\n========================================');
  console.log('🎉 SHOWCASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log(`Project: "${project.name}" (ID: ${project.id})`);
  console.log(`Admin User: ${elena.email}`);
  console.log(`Password (for all users): ${password}`);
  console.log(`Total Team Members: ${userData.length}`);
  console.log(`Total Tasks: ${tasksData.length}`);
  console.log('========================================\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
