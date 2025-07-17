import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';
import { z } from 'zod';
import { logger } from './logger.js';

// Tipos de eventos de segurança
export enum SecurityEventType {
    AUTH_SUCCESS = 'auth_success',
    AUTH_FAILURE = 'auth_failure',
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    INVALID_INPUT = 'invalid_input',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    DATA_ACCESS = 'data_access',
    TOOL_EXECUTION = 'tool_execution'
}

// Interface para eventos de auditoria
interface SecurityEvent {
    type: SecurityEventType;
    timestamp: Date;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

// Interface para rate limiting
interface RateLimitEntry {
    count: number;
    resetTime: number;
    blocked: boolean;
}

// Classe principal do framework de segurança
export class SecurityFramework {
    private static instance: SecurityFramework;
    private auditLog: SecurityEvent[] = [];
    private rateLimitStore: Map<string, RateLimitEntry> = new Map();
    private blockedIPs: Set<string> = new Set();
    private readonly maxAuditLogSize = 10000;
    private readonly rateLimitWindowMs = 15 * 60 * 1000; // 15 minutos
    private readonly rateLimitMaxRequests = 100;

    private constructor() {
        this.startCleanupTask();
    }

    public static getInstance(): SecurityFramework {
        if (!SecurityFramework.instance) {
            SecurityFramework.instance = new SecurityFramework();
        }
        return SecurityFramework.instance;
    }

    // Audit Logging
    public logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
        const fullEvent: SecurityEvent = {
            ...event,
            timestamp: new Date()
        };

        this.auditLog.push(fullEvent);
        
        // Manter tamanho do log controlado
        if (this.auditLog.length > this.maxAuditLogSize) {
            this.auditLog.shift();
        }

        // Log para Winston também
        const logLevel = this.getLogLevel(event.severity);
        logger.log(logLevel, `[SECURITY] ${event.type}`, {
            type: event.type,
            userId: event.userId,
            ipAddress: event.ipAddress,
            resource: event.resource,
            action: event.action,
            details: event.details,
            severity: event.severity
        });

        // Alertas para eventos críticos
        if (event.severity === 'critical') {
            this.handleCriticalEvent(fullEvent);
        }
    }

    private getLogLevel(severity: string): string {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warn';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'info';
        }
    }

    private handleCriticalEvent(event: SecurityEvent): void {
        logger.error(`[SECURITY ALERT] Evento crítico detectado: ${event.type}`, event);
        
        // Implementar notificações futuras (email, webhook, etc.)
        if (event.ipAddress) {
            this.blockIP(event.ipAddress);
        }
    }

    // Rate Limiting
    public checkRateLimit(identifier: string): boolean {
        const now = Date.now();
        const entry = this.rateLimitStore.get(identifier);

        if (!entry) {
            this.rateLimitStore.set(identifier, {
                count: 1,
                resetTime: now + this.rateLimitWindowMs,
                blocked: false
            });
            return true;
        }

        if (now > entry.resetTime) {
            // Reset da janela
            entry.count = 1;
            entry.resetTime = now + this.rateLimitWindowMs;
            entry.blocked = false;
            return true;
        }

        if (entry.blocked) {
            return false;
        }

        entry.count++;

        if (entry.count > this.rateLimitMaxRequests) {
            entry.blocked = true;
            this.logSecurityEvent({
                type: SecurityEventType.RATE_LIMIT_EXCEEDED,
                ipAddress: identifier,
                severity: 'high',
                details: { count: entry.count, limit: this.rateLimitMaxRequests }
            });
            return false;
        }

        return true;
    }

    // Bloqueio de IPs
    public blockIP(ip: string): void {
        this.blockedIPs.add(ip);
        logger.warn(`[SECURITY] IP bloqueado: ${ip}`);
    }

    public unblockIP(ip: string): void {
        this.blockedIPs.delete(ip);
        logger.info(`[SECURITY] IP desbloqueado: ${ip}`);
    }

    public isIPBlocked(ip: string): boolean {
        return this.blockedIPs.has(ip);
    }

    // Sanitização de dados
    public sanitizeInput(input: any): any {
        if (typeof input === 'string') {
            return input
                .replace(/[<>]/g, '') // Remove caracteres HTML perigosos
                .replace(/javascript:/gi, '') // Remove javascript: URLs
                .replace(/data:/gi, '') // Remove data: URLs
                .replace(/vbscript:/gi, '') // Remove vbscript: URLs
                .trim();
        }

        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }

        if (typeof input === 'object' && input !== null) {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
            }
            return sanitized;
        }

        return input;
    }

    // Validação de entrada com segurança
    public validateAndSanitize<T>(schema: z.ZodSchema<T>, data: any): T {
        try {
            const sanitized = this.sanitizeInput(data);
            return schema.parse(sanitized);
        } catch (error) {
            this.logSecurityEvent({
                type: SecurityEventType.INVALID_INPUT,
                severity: 'medium',
                details: { error: error instanceof Error ? error.message : 'Erro desconhecido', data }
            });
            throw error;
        }
    }

    // Criptografia básica para dados sensíveis
    public encryptSensitiveData(data: string, key?: string): string {
        const encryptionKey = key || process.env.ENCRYPTION_KEY || 'argos-default-key';
        const cipher = createCipher('aes192', encryptionKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    public decryptSensitiveData(encryptedData: string, key?: string): string {
        const encryptionKey = key || process.env.ENCRYPTION_KEY || 'argos-default-key';
        const decipher = createDecipher('aes192', encryptionKey);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Geração de tokens seguros
    public generateSecureToken(length: number = 32): string {
        return randomBytes(length).toString('hex');
    }

    // Hash seguro de senhas
    public hashPassword(password: string, salt?: string): string {
        const actualSalt = salt || randomBytes(16).toString('hex');
        const hash = createHash('sha256');
        hash.update(password + actualSalt);
        return hash.digest('hex') + ':' + actualSalt;
    }

    public verifyPassword(password: string, hashedPassword: string): boolean {
        const [hash, salt] = hashedPassword.split(':');
        const newHash = createHash('sha256');
        newHash.update(password + salt);
        return newHash.digest('hex') === hash;
    }

    // Métricas de segurança
    public getSecurityMetrics(): any {
        const now = Date.now();
        const last24Hours = now - (24 * 60 * 60 * 1000);
        
        const recentEvents = this.auditLog.filter(event => 
            event.timestamp.getTime() > last24Hours
        );

        const eventsByType = recentEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventsBySeverity = recentEvents.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalEvents: recentEvents.length,
            eventsByType,
            eventsBySeverity,
            blockedIPs: Array.from(this.blockedIPs),
            activeRateLimits: Array.from(this.rateLimitStore.entries())
                .filter(([_, entry]) => entry.blocked)
                .map(([identifier, entry]) => ({
                    identifier,
                    count: entry.count,
                    resetTime: new Date(entry.resetTime)
                }))
        };
    }

    // Auditoria de acesso a ferramentas
    public logToolExecution(toolName: string, arguments: any, userId?: string, ipAddress?: string): void {
        this.logSecurityEvent({
            type: SecurityEventType.TOOL_EXECUTION,
            userId,
            ipAddress,
            resource: toolName,
            action: 'execute',
            severity: 'low',
            details: {
                toolName,
                arguments: this.sanitizeInput(arguments)
            }
        });
    }

    // Detecção de atividade suspeita
    public detectSuspiciousActivity(userId?: string, ipAddress?: string): boolean {
        const now = Date.now();
        const last5Minutes = now - (5 * 60 * 1000);
        
        const recentEvents = this.auditLog.filter(event => 
            event.timestamp.getTime() > last5Minutes &&
            (event.userId === userId || event.ipAddress === ipAddress)
        );

        // Muitas tentativas de execução de ferramentas
        const toolExecutions = recentEvents.filter(event => 
            event.type === SecurityEventType.TOOL_EXECUTION
        );

        if (toolExecutions.length > 20) {
            this.logSecurityEvent({
                type: SecurityEventType.SUSPICIOUS_ACTIVITY,
                userId,
                ipAddress,
                severity: 'high',
                details: {
                    reason: 'Muitas execuções de ferramentas em pouco tempo',
                    count: toolExecutions.length
                }
            });
            return true;
        }

        // Muitos erros de validação
        const validationErrors = recentEvents.filter(event => 
            event.type === SecurityEventType.INVALID_INPUT
        );

        if (validationErrors.length > 5) {
            this.logSecurityEvent({
                type: SecurityEventType.SUSPICIOUS_ACTIVITY,
                userId,
                ipAddress,
                severity: 'medium',
                details: {
                    reason: 'Muitos erros de validação',
                    count: validationErrors.length
                }
            });
            return true;
        }

        return false;
    }

    // Limpeza periódica
    private startCleanupTask(): void {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000); // A cada 5 minutos
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now();
        
        // Limpar rate limits expirados
        for (const [identifier, entry] of this.rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                this.rateLimitStore.delete(identifier);
            }
        }

        // Limpar eventos de auditoria muito antigos
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        this.auditLog = this.auditLog.filter(event => 
            event.timestamp.getTime() > oneWeekAgo
        );

        logger.debug('[SECURITY] Limpeza de dados expirados concluída');
    }

    // Exportar logs de auditoria
    public exportAuditLogs(startDate?: Date, endDate?: Date): SecurityEvent[] {
        let filteredLogs = this.auditLog;

        if (startDate) {
            filteredLogs = filteredLogs.filter(event => 
                event.timestamp >= startDate
            );
        }

        if (endDate) {
            filteredLogs = filteredLogs.filter(event => 
                event.timestamp <= endDate
            );
        }

        return filteredLogs.map(event => ({
            ...event,
            // Remover dados sensíveis se necessário
            details: event.details ? this.sanitizeInput(event.details) : undefined
        }));
    }
}

// Instância singleton
export const securityFramework = SecurityFramework.getInstance();

// Decorador para auditoria automática
export function AuditLog(eventType: SecurityEventType, severity: 'low' | 'medium' | 'high' | 'critical' = 'low') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startTime = Date.now();
            
            try {
                const result = await originalMethod.apply(this, args);
                
                securityFramework.logSecurityEvent({
                    type: eventType,
                    resource: target.constructor.name,
                    action: propertyKey,
                    severity,
                    details: {
                        arguments: securityFramework.sanitizeInput(args),
                        duration: Date.now() - startTime,
                        success: true
                    }
                });
                
                return result;
            } catch (error) {
                securityFramework.logSecurityEvent({
                    type: eventType,
                    resource: target.constructor.name,
                    action: propertyKey,
                    severity: 'high',
                    details: {
                        arguments: securityFramework.sanitizeInput(args),
                        duration: Date.now() - startTime,
                        success: false,
                        error: error instanceof Error ? error.message : 'Erro desconhecido'
                    }
                });
                
                throw error;
            }
        };
    };
}

export default SecurityFramework; 