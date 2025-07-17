import { z } from 'zod';
import { logger } from './logger.js';
import { validateToolInput } from './validation.js';
import { intelligentCache } from './cache.js';
import { securityFramework, SecurityEventType } from './security.js';
import { createHash } from 'crypto';

// Schemas para colaboração assíncrona
const CommentSchema = z.object({
    id: z.string().optional(),
    content: z.string().min(1, 'Conteúdo do comentário é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
    targetType: z.enum(['code', 'task', 'document', 'wireframe']),
    targetId: z.string().min(1, 'ID do target é obrigatório'),
    parentId: z.string().optional(),
    mentions: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['open', 'resolved', 'acknowledged']).optional()
});

const TaskSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    assignee: z.string().optional(),
    creator: z.string().min(1, 'Criador é obrigatório'),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    linkedCode: z.array(z.string()).optional()
});

const DocumentSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Título é obrigatório'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    lastModified: z.string().optional(),
    collaborators: z.array(z.string()).optional()
});

const NotificationSchema = z.object({
    id: z.string().optional(),
    recipient: z.string().min(1, 'Destinatário é obrigatório'),
    sender: z.string().min(1, 'Remetente é obrigatório'),
    type: z.enum(['comment', 'task_assigned', 'mention', 'task_updated', 'document_shared']),
    title: z.string().min(1, 'Título é obrigatório'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    targetId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    read: z.boolean().optional()
});

// Interfaces para colaboração
interface Comment {
    id: string;
    content: string;
    author: string;
    targetType: 'code' | 'task' | 'document' | 'wireframe';
    targetId: string;
    parentId?: string;
    mentions: string[];
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'resolved' | 'acknowledged';
    createdAt: string;
    updatedAt: string;
    reactions: Record<string, string[]>; // emoji -> users
    replies: Comment[];
}

interface Task {
    id: string;
    title: string;
    description?: string;
    assignee?: string;
    creator: string;
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    labels: string[];
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    dependencies: string[];
    linkedCode: string[];
    createdAt: string;
    updatedAt: string;
    history: TaskHistoryEntry[];
    comments: Comment[];
}

interface TaskHistoryEntry {
    timestamp: string;
    user: string;
    action: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
}

interface Document {
    id: string;
    title: string;
    content: string;
    author: string;
    version: string;
    tags: string[];
    isPublic: boolean;
    lastModified: string;
    collaborators: string[];
    versions: DocumentVersion[];
    comments: Comment[];
}

interface DocumentVersion {
    version: string;
    content: string;
    author: string;
    timestamp: string;
    changes: string;
}

interface Notification {
    id: string;
    recipient: string;
    sender: string;
    type: 'comment' | 'task_assigned' | 'mention' | 'task_updated' | 'document_shared';
    title: string;
    content: string;
    targetId?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    read: boolean;
    createdAt: string;
    expiresAt?: string;
}

// Sistema de colaboração assíncrona
export class AsyncCollaboration {
    private static instance: AsyncCollaboration;
    private comments: Map<string, Comment> = new Map();
    private tasks: Map<string, Task> = new Map();
    private documents: Map<string, Document> = new Map();
    private notifications: Map<string, Notification> = new Map();
    private userSessions: Map<string, { lastSeen: string, status: string }> = new Map();

    private constructor() {
        this.startPeriodicCleanup();
    }

    public static getInstance(): AsyncCollaboration {
        if (!AsyncCollaboration.instance) {
            AsyncCollaboration.instance = new AsyncCollaboration();
        }
        return AsyncCollaboration.instance;
    }

    // === SISTEMA DE COMENTÁRIOS ===

    public async createComment(input: any): Promise<Comment> {
        const data = validateToolInput(CommentSchema, input);
        
        const comment: Comment = {
            id: data.id || this.generateId(),
            content: data.content,
            author: data.author,
            targetType: data.targetType,
            targetId: data.targetId,
            parentId: data.parentId,
            mentions: data.mentions || [],
            tags: data.tags || [],
            priority: data.priority || 'medium',
            status: data.status || 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reactions: {},
            replies: []
        };

        this.comments.set(comment.id, comment);
        
        // Processar menções
        if (comment.mentions.length > 0) {
            await this.processMentions(comment);
        }
        
        // Cache do comentário
        await intelligentCache.set(`comment:${comment.id}`, comment, {
            ttl: 24 * 60 * 60 * 1000, // 24 horas
            tags: ['comments', data.targetType, data.targetId]
        });

        securityFramework.logSecurityEvent({
            type: SecurityEventType.DATA_ACCESS,
            userId: data.author,
            resource: 'comment',
            action: 'create',
            severity: 'low'
        });

        logger.info(`[COLLABORATION] Comentário criado: ${comment.id} por ${comment.author}`);
        return comment;
    }

    public async getComments(targetType: string, targetId: string): Promise<Comment[]> {
        const comments = Array.from(this.comments.values())
            .filter(c => c.targetType === targetType && c.targetId === targetId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Organizar replies
        const topLevelComments = comments.filter(c => !c.parentId);
        for (const comment of topLevelComments) {
            comment.replies = comments.filter(c => c.parentId === comment.id);
        }

        return topLevelComments;
    }

    public async addReaction(commentId: string, emoji: string, userId: string): Promise<void> {
        const comment = this.comments.get(commentId);
        if (!comment) {
            throw new Error('Comentário não encontrado');
        }

        if (!comment.reactions[emoji]) {
            comment.reactions[emoji] = [];
        }

        if (!comment.reactions[emoji].includes(userId)) {
            comment.reactions[emoji].push(userId);
        }

        comment.updatedAt = new Date().toISOString();
        await intelligentCache.set(`comment:${commentId}`, comment, { tags: ['comments'] });
    }

    // === SISTEMA DE TAREFAS ===

    public async createTask(input: any): Promise<Task> {
        const data = validateToolInput(TaskSchema, input);
        
        const task: Task = {
            id: data.id || this.generateId(),
            title: data.title,
            description: data.description,
            assignee: data.assignee,
            creator: data.creator,
            status: data.status || 'todo',
            priority: data.priority || 'medium',
            labels: data.labels || [],
            dueDate: data.dueDate,
            estimatedHours: data.estimatedHours,
            actualHours: data.actualHours,
            dependencies: data.dependencies || [],
            linkedCode: data.linkedCode || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [],
            comments: []
        };

        this.tasks.set(task.id, task);
        
        // Notificar assignee
        if (task.assignee && task.assignee !== task.creator) {
            await this.createNotification({
                recipient: task.assignee,
                sender: task.creator,
                type: 'task_assigned',
                title: `Nova tarefa atribuída: ${task.title}`,
                content: `Você foi atribuído à tarefa "${task.title}"`,
                targetId: task.id,
                priority: task.priority
            });
        }

        await intelligentCache.set(`task:${task.id}`, task, {
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 dias
            tags: ['tasks', task.status, task.priority]
        });

        securityFramework.logSecurityEvent({
            type: SecurityEventType.DATA_ACCESS,
            userId: data.creator,
            resource: 'task',
            action: 'create',
            severity: 'low'
        });

        logger.info(`[COLLABORATION] Tarefa criada: ${task.id} por ${task.creator}`);
        return task;
    }

    public async updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<Task> {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error('Tarefa não encontrada');
        }

        const oldValues: any = {};
        const newValues: any = {};

        for (const [key, value] of Object.entries(updates)) {
            if (key in task && (task as any)[key] !== value) {
                oldValues[key] = (task as any)[key];
                newValues[key] = value;
                (task as any)[key] = value;
            }
        }

        task.updatedAt = new Date().toISOString();

        // Registrar no histórico
        for (const [field, newValue] of Object.entries(newValues)) {
            task.history.push({
                timestamp: new Date().toISOString(),
                user: userId,
                action: 'update',
                field,
                oldValue: oldValues[field],
                newValue
            });
        }

        // Notificar sobre mudanças importantes
        if (updates.status || updates.assignee) {
            await this.notifyTaskUpdate(task, userId, updates);
        }

        await intelligentCache.set(`task:${taskId}`, task, { tags: ['tasks'] });

        logger.info(`[COLLABORATION] Tarefa atualizada: ${taskId} por ${userId}`);
        return task;
    }

    public async getTasks(filter: { status?: string, assignee?: string, creator?: string } = {}): Promise<Task[]> {
        let tasks = Array.from(this.tasks.values());

        if (filter.status) {
            tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter.assignee) {
            tasks = tasks.filter(t => t.assignee === filter.assignee);
        }
        if (filter.creator) {
            tasks = tasks.filter(t => t.creator === filter.creator);
        }

        return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // === SISTEMA DE DOCUMENTOS ===

    public async createDocument(input: any): Promise<Document> {
        const data = validateToolInput(DocumentSchema, input);
        
        const document: Document = {
            id: data.id || this.generateId(),
            title: data.title,
            content: data.content,
            author: data.author,
            version: data.version || '1.0.0',
            tags: data.tags || [],
            isPublic: data.isPublic || false,
            lastModified: new Date().toISOString(),
            collaborators: data.collaborators || [],
            versions: [{
                version: data.version || '1.0.0',
                content: data.content,
                author: data.author,
                timestamp: new Date().toISOString(),
                changes: 'Documento criado'
            }],
            comments: []
        };

        this.documents.set(document.id, document);
        
        await intelligentCache.set(`document:${document.id}`, document, {
            ttl: 30 * 24 * 60 * 60 * 1000, // 30 dias
            tags: ['documents', ...document.tags]
        });

        securityFramework.logSecurityEvent({
            type: SecurityEventType.DATA_ACCESS,
            userId: data.author,
            resource: 'document',
            action: 'create',
            severity: 'low'
        });

        logger.info(`[COLLABORATION] Documento criado: ${document.id} por ${document.author}`);
        return document;
    }

    public async updateDocument(documentId: string, content: string, author: string, changes: string): Promise<Document> {
        const document = this.documents.get(documentId);
        if (!document) {
            throw new Error('Documento não encontrado');
        }

        const versionParts = document.version.split('.').map(Number);
        versionParts[2]++; // Incrementar patch version
        const newVersion = versionParts.join('.');

        document.content = content;
        document.version = newVersion;
        document.lastModified = new Date().toISOString();
        
        document.versions.push({
            version: newVersion,
            content,
            author,
            timestamp: new Date().toISOString(),
            changes
        });

        await intelligentCache.set(`document:${documentId}`, document, { tags: ['documents'] });

        logger.info(`[COLLABORATION] Documento atualizado: ${documentId} v${newVersion} por ${author}`);
        return document;
    }

    // === SISTEMA DE NOTIFICAÇÕES ===

    public async createNotification(input: any): Promise<Notification> {
        const data = validateToolInput(NotificationSchema, input);
        
        const notification: Notification = {
            id: data.id || this.generateId(),
            recipient: data.recipient,
            sender: data.sender,
            type: data.type,
            title: data.title,
            content: data.content,
            targetId: data.targetId,
            priority: data.priority || 'medium',
            read: data.read || false,
            createdAt: new Date().toISOString(),
            expiresAt: data.type === 'mention' ? 
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : // 7 dias
                undefined
        };

        this.notifications.set(notification.id, notification);
        
        await intelligentCache.set(`notification:${notification.id}`, notification, {
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 dias
            tags: ['notifications', data.recipient, data.type]
        });

        logger.info(`[COLLABORATION] Notificação criada: ${notification.id} para ${notification.recipient}`);
        return notification;
    }

    public async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
        let notifications = Array.from(this.notifications.values())
            .filter(n => n.recipient === userId);

        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }

        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public async markNotificationRead(notificationId: string): Promise<void> {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            notification.read = true;
            await intelligentCache.set(`notification:${notificationId}`, notification, { tags: ['notifications'] });
        }
    }

    // === FUNÇÕES AUXILIARES ===

    private generateId(): string {
        return createHash('md5').update(Date.now().toString() + Math.random().toString()).digest('hex').substring(0, 8);
    }

    private async processMentions(comment: Comment): Promise<void> {
        for (const mention of comment.mentions) {
            await this.createNotification({
                recipient: mention,
                sender: comment.author,
                type: 'mention',
                title: `Você foi mencionado em um comentário`,
                content: comment.content.substring(0, 100) + '...',
                targetId: comment.id,
                priority: comment.priority
            });
        }
    }

    private async notifyTaskUpdate(task: Task, userId: string, updates: Partial<Task>): Promise<void> {
        if (updates.assignee && updates.assignee !== userId) {
            await this.createNotification({
                recipient: updates.assignee,
                sender: userId,
                type: 'task_assigned',
                title: `Tarefa atribuída: ${task.title}`,
                content: `Você foi atribuído à tarefa "${task.title}"`,
                targetId: task.id,
                priority: task.priority
            });
        }

        if (updates.status && task.assignee && task.assignee !== userId) {
            await this.createNotification({
                recipient: task.assignee,
                sender: userId,
                type: 'task_updated',
                title: `Tarefa atualizada: ${task.title}`,
                content: `Status alterado para: ${updates.status}`,
                targetId: task.id,
                priority: task.priority
            });
        }
    }

    private startPeriodicCleanup(): void {
        setInterval(() => {
            this.cleanupExpiredNotifications();
        }, 60 * 60 * 1000); // A cada hora
    }

    private cleanupExpiredNotifications(): void {
        const now = new Date();
        let cleanedCount = 0;

        for (const [id, notification] of this.notifications.entries()) {
            if (notification.expiresAt && new Date(notification.expiresAt) < now) {
                this.notifications.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`[COLLABORATION] Limpeza: ${cleanedCount} notificações expiradas removidas`);
        }
    }

    // === MÉTRICAS ===

    public getCollaborationMetrics(): any {
        return {
            totalComments: this.comments.size,
            totalTasks: this.tasks.size,
            totalDocuments: this.documents.size,
            totalNotifications: this.notifications.size,
            tasksByStatus: this.getTasksByStatus(),
            activeUsers: this.getActiveUsers(),
            recentActivity: this.getRecentActivity()
        };
    }

    private getTasksByStatus(): Record<string, number> {
        const statusCounts: Record<string, number> = {};
        for (const task of this.tasks.values()) {
            statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        }
        return statusCounts;
    }

    private getActiveUsers(): string[] {
        const users = new Set<string>();
        for (const task of this.tasks.values()) {
            users.add(task.creator);
            if (task.assignee) users.add(task.assignee);
        }
        for (const comment of this.comments.values()) {
            users.add(comment.author);
        }
        return Array.from(users);
    }

    private getRecentActivity(): any[] {
        const activities: any[] = [];
        
        // Atividades recentes de tarefas
        for (const task of this.tasks.values()) {
            if (task.history.length > 0) {
                const lastActivity = task.history[task.history.length - 1];
                activities.push({
                    type: 'task',
                    action: lastActivity.action,
                    user: lastActivity.user,
                    timestamp: lastActivity.timestamp,
                    target: task.title
                });
            }
        }

        // Atividades recentes de comentários
        for (const comment of this.comments.values()) {
            activities.push({
                type: 'comment',
                action: 'create',
                user: comment.author,
                timestamp: comment.createdAt,
                target: comment.targetId
            });
        }

        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);
    }
}

// Instância singleton
export const asyncCollaboration = AsyncCollaboration.getInstance();

// Ferramentas MCP para colaboração
export const collaborationTools = {
    'create-comment': {
        name: 'create-comment',
        description: 'Criar comentário em código, tarefa ou documento',
        inputSchema: CommentSchema,
        handler: async (args: any) => {
            return await asyncCollaboration.createComment(args);
        }
    },
    'create-task': {
        name: 'create-task',
        description: 'Criar nova tarefa',
        inputSchema: TaskSchema,
        handler: async (args: any) => {
            return await asyncCollaboration.createTask(args);
        }
    },
    'create-document': {
        name: 'create-document',
        description: 'Criar novo documento colaborativo',
        inputSchema: DocumentSchema,
        handler: async (args: any) => {
            return await asyncCollaboration.createDocument(args);
        }
    },
    'get-notifications': {
        name: 'get-notifications',
        description: 'Obter notificações do usuário',
        inputSchema: z.object({
            userId: z.string().min(1),
            unreadOnly: z.boolean().optional()
        }),
        handler: async (args: any) => {
            return await asyncCollaboration.getNotifications(args.userId, args.unreadOnly);
        }
    }
};

export default AsyncCollaboration; 