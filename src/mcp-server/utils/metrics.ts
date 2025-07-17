import { logger } from './logger.js';
import { intelligentCache } from './cache.js';
import { securityFramework } from './security.js';

// Interfaces para métricas
interface SystemMetrics {
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    loadAverage: number[];
    version: string;
    environment: string;
}

interface ToolMetrics {
    toolName: string;
    totalCalls: number;
    successCount: number;
    errorCount: number;
    averageResponseTime: number;
    lastUsed: string;
    errorRate: number;
    slowCalls: number;
}

interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    totalEntries: number;
    memoryUsage: number;
    compressionRatio: number;
}

interface SecurityMetrics {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: string[];
    rateLimitHits: number;
    suspiciousActivity: number;
}

interface ApplicationMetrics {
    requestCount: number;
    responseTime: {
        avg: number;
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    activeConnections: number;
    throughput: number;
}

interface MetricsDashboard {
    system: SystemMetrics;
    tools: ToolMetrics[];
    cache: CacheMetrics;
    security: SecurityMetrics;
    application: ApplicationMetrics;
    custom: Record<string, any>;
}

// Classe para coleta de métricas
class MetricsCollector {
    private static instance: MetricsCollector;
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private responseTimeBuffer: number[] = [];
    private requestCounter = 0;
    private errorCounter = 0;
    private activeConnections = 0;
    private readonly maxBufferSize = 1000;
    private readonly slowCallThreshold = 5000; // 5 segundos

    private constructor() {
        this.startPeriodicCollection();
    }

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    // Registrar chamada de ferramenta
    public recordToolCall(toolName: string, responseTime: number, success: boolean): void {
        let metric = this.toolMetrics.get(toolName);
        
        if (!metric) {
            metric = {
                toolName,
                totalCalls: 0,
                successCount: 0,
                errorCount: 0,
                averageResponseTime: 0,
                lastUsed: new Date().toISOString(),
                errorRate: 0,
                slowCalls: 0
            };
            this.toolMetrics.set(toolName, metric);
        }

        metric.totalCalls++;
        metric.lastUsed = new Date().toISOString();
        
        if (success) {
            metric.successCount++;
        } else {
            metric.errorCount++;
        }

        if (responseTime > this.slowCallThreshold) {
            metric.slowCalls++;
        }

        // Calcular média móvel do tempo de resposta
        const totalResponseTime = (metric.averageResponseTime * (metric.totalCalls - 1)) + responseTime;
        metric.averageResponseTime = totalResponseTime / metric.totalCalls;
        
        // Calcular taxa de erro
        metric.errorRate = (metric.errorCount / metric.totalCalls) * 100;
    }

    // Registrar tempo de resposta HTTP
    public recordResponseTime(responseTime: number): void {
        this.responseTimeBuffer.push(responseTime);
        
        if (this.responseTimeBuffer.length > this.maxBufferSize) {
            this.responseTimeBuffer.shift();
        }
        
        this.requestCounter++;
    }

    // Registrar erro
    public recordError(): void {
        this.errorCounter++;
    }

    // Registrar conexão ativa
    public recordActiveConnection(delta: number): void {
        this.activeConnections += delta;
    }

    // Obter métricas do sistema
    public getSystemMetrics(): SystemMetrics {
        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            loadAverage: process.platform === 'win32' ? [0, 0, 0] : (process as any).loadavg?.() || [0, 0, 0],
            version: process.version,
            environment: process.env.NODE_ENV || 'development'
        };
    }

    // Obter métricas de ferramentas
    public getToolMetrics(): ToolMetrics[] {
        return Array.from(this.toolMetrics.values());
    }

    // Obter métricas de cache
    public getCacheMetrics(): CacheMetrics {
        const cacheStats = intelligentCache.getStats();
        const cacheMetrics = intelligentCache.getMetrics();
        
        return {
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            hitRate: cacheStats.hitRate,
            evictions: cacheStats.evictions,
            totalEntries: cacheStats.entries,
            memoryUsage: cacheMetrics.memoryUsage,
            compressionRatio: cacheMetrics.compressionRatio
        };
    }

    // Obter métricas de segurança
    public getSecurityMetrics(): SecurityMetrics {
        const securityStats = securityFramework.getSecurityMetrics();
        
        return {
            totalEvents: securityStats.totalEvents,
            eventsByType: securityStats.eventsByType,
            eventsBySeverity: securityStats.eventsBySeverity,
            blockedIPs: securityStats.blockedIPs,
            rateLimitHits: securityStats.activeRateLimits.length,
            suspiciousActivity: securityStats.eventsByType.suspicious_activity || 0
        };
    }

    // Obter métricas da aplicação
    public getApplicationMetrics(): ApplicationMetrics {
        const responseTime = this.calculateResponseTimePercentiles();
        const errorRate = this.requestCounter > 0 ? (this.errorCounter / this.requestCounter) * 100 : 0;
        const throughput = this.requestCounter / (process.uptime() / 60); // requests per minute

        return {
            requestCount: this.requestCounter,
            responseTime,
            errorRate,
            activeConnections: this.activeConnections,
            throughput
        };
    }

    // Calcular percentis de tempo de resposta
    private calculateResponseTimePercentiles(): ApplicationMetrics['responseTime'] {
        if (this.responseTimeBuffer.length === 0) {
            return { avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
        }

        const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
        const length = sorted.length;
        
        const avg = sorted.reduce((sum, val) => sum + val, 0) / length;
        const p50 = sorted[Math.floor(length * 0.5)];
        const p90 = sorted[Math.floor(length * 0.9)];
        const p95 = sorted[Math.floor(length * 0.95)];
        const p99 = sorted[Math.floor(length * 0.99)];

        return { avg, p50, p90, p95, p99 };
    }

    // Coleta periódica de métricas
    private startPeriodicCollection(): void {
        setInterval(() => {
            this.collectAndLogMetrics();
        }, 60000); // A cada minuto
    }

    private collectAndLogMetrics(): void {
        const metrics = this.getDashboard();
        
        logger.info('[METRICS] Coleta periódica de métricas', {
            uptime: metrics.system.uptime,
            requestCount: metrics.application.requestCount,
            errorRate: metrics.application.errorRate,
            cacheHitRate: metrics.cache.hitRate,
            securityEvents: metrics.security.totalEvents
        });

        // Alertas baseados em métricas
        this.checkAlerts(metrics);
    }

    // Verificar alertas
    private checkAlerts(metrics: MetricsDashboard): void {
        // Alerta de alto uso de memória
        const memoryUsage = (metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100;
        if (memoryUsage > 85) {
            logger.warn('[ALERT] Alto uso de memória detectado', { usage: memoryUsage });
        }

        // Alerta de alta taxa de erro
        if (metrics.application.errorRate > 5) {
            logger.warn('[ALERT] Alta taxa de erro detectada', { errorRate: metrics.application.errorRate });
        }

        // Alerta de baixa performance de cache
        if (metrics.cache.hitRate < 70 && metrics.cache.totalEntries > 10) {
            logger.warn('[ALERT] Baixa performance de cache', { hitRate: metrics.cache.hitRate });
        }

        // Alerta de atividade suspeita
        if (metrics.security.suspiciousActivity > 0) {
            logger.warn('[ALERT] Atividade suspeita detectada', { count: metrics.security.suspiciousActivity });
        }
    }

    // Obter dashboard completo
    public getDashboard(): MetricsDashboard {
        return {
            system: this.getSystemMetrics(),
            tools: this.getToolMetrics(),
            cache: this.getCacheMetrics(),
            security: this.getSecurityMetrics(),
            application: this.getApplicationMetrics(),
            custom: {}
        };
    }

    // Resetar métricas
    public resetMetrics(): void {
        this.toolMetrics.clear();
        this.responseTimeBuffer = [];
        this.requestCounter = 0;
        this.errorCounter = 0;
        this.activeConnections = 0;
        logger.info('[METRICS] Métricas resetadas');
    }
}

// Classe para geração de relatórios
export class MetricsReporter {
    private collector: MetricsCollector;

    constructor() {
        this.collector = MetricsCollector.getInstance();
    }

    // Relatório de saúde geral
    public getHealthReport(): any {
        const metrics = this.collector.getDashboard();
        
        const health = {
            status: 'healthy',
            checks: {
                memory: this.checkMemoryHealth(metrics.system.memory),
                errors: this.checkErrorRate(metrics.application.errorRate),
                cache: this.checkCacheHealth(metrics.cache),
                security: this.checkSecurityHealth(metrics.security),
                tools: this.checkToolsHealth(metrics.tools)
            },
            timestamp: new Date().toISOString()
        };

        // Determinar status geral
        const failedChecks = Object.values(health.checks).filter(check => check.status !== 'healthy');
        if (failedChecks.length > 0) {
            health.status = failedChecks.some(check => check.status === 'critical') ? 'critical' : 'warning';
        }

        return health;
    }

    // Relatório de performance
    public getPerformanceReport(): any {
        const metrics = this.collector.getDashboard();
        
        return {
            uptime: metrics.system.uptime,
            responseTime: metrics.application.responseTime,
            throughput: metrics.application.throughput,
            errorRate: metrics.application.errorRate,
            cachePerformance: {
                hitRate: metrics.cache.hitRate,
                compressionRatio: metrics.cache.compressionRatio,
                memoryUsage: metrics.cache.memoryUsage
            },
            topTools: metrics.tools
                .sort((a, b) => b.totalCalls - a.totalCalls)
                .slice(0, 5)
                .map(tool => ({
                    name: tool.toolName,
                    calls: tool.totalCalls,
                    avgResponseTime: tool.averageResponseTime,
                    errorRate: tool.errorRate
                })),
            timestamp: new Date().toISOString()
        };
    }

    // Relatório de segurança
    public getSecurityReport(): any {
        const metrics = this.collector.getDashboard();
        
        return {
            totalEvents: metrics.security.totalEvents,
            eventsByType: metrics.security.eventsByType,
            eventsBySeverity: metrics.security.eventsBySeverity,
            blockedIPs: metrics.security.blockedIPs,
            rateLimitHits: metrics.security.rateLimitHits,
            suspiciousActivity: metrics.security.suspiciousActivity,
            recommendations: this.generateSecurityRecommendations(metrics.security),
            timestamp: new Date().toISOString()
        };
    }

    // Verificações de saúde
    private checkMemoryHealth(memory: NodeJS.MemoryUsage): any {
        const usage = (memory.heapUsed / memory.heapTotal) * 100;
        
        if (usage > 90) {
            return { status: 'critical', message: 'Uso crítico de memória', value: usage };
        } else if (usage > 75) {
            return { status: 'warning', message: 'Alto uso de memória', value: usage };
        }
        
        return { status: 'healthy', message: 'Uso normal de memória', value: usage };
    }

    private checkErrorRate(errorRate: number): any {
        if (errorRate > 10) {
            return { status: 'critical', message: 'Taxa de erro crítica', value: errorRate };
        } else if (errorRate > 5) {
            return { status: 'warning', message: 'Taxa de erro alta', value: errorRate };
        }
        
        return { status: 'healthy', message: 'Taxa de erro normal', value: errorRate };
    }

    private checkCacheHealth(cache: CacheMetrics): any {
        if (cache.hitRate < 50) {
            return { status: 'warning', message: 'Baixa performance de cache', value: cache.hitRate };
        }
        
        return { status: 'healthy', message: 'Cache funcionando bem', value: cache.hitRate };
    }

    private checkSecurityHealth(security: SecurityMetrics): any {
        if (security.suspiciousActivity > 5) {
            return { status: 'critical', message: 'Muita atividade suspeita', value: security.suspiciousActivity };
        } else if (security.suspiciousActivity > 0) {
            return { status: 'warning', message: 'Atividade suspeita detectada', value: security.suspiciousActivity };
        }
        
        return { status: 'healthy', message: 'Sem atividade suspeita', value: security.suspiciousActivity };
    }

    private checkToolsHealth(tools: ToolMetrics[]): any {
        const failingTools = tools.filter(tool => tool.errorRate > 10);
        
        if (failingTools.length > 0) {
            return { 
                status: 'warning', 
                message: 'Ferramentas com alta taxa de erro', 
                value: failingTools.length 
            };
        }
        
        return { status: 'healthy', message: 'Todas as ferramentas funcionando bem', value: tools.length };
    }

    // Gerar recomendações de segurança
    private generateSecurityRecommendations(security: SecurityMetrics): string[] {
        const recommendations: string[] = [];
        
        if (security.suspiciousActivity > 0) {
            recommendations.push('Revisar logs de atividade suspeita');
        }
        
        if (security.rateLimitHits > 10) {
            recommendations.push('Considerar diminuir limites de rate limiting');
        }
        
        if (security.blockedIPs.length > 5) {
            recommendations.push('Revisar IPs bloqueados e considerar whitelist');
        }
        
        return recommendations;
    }
}

// Middleware para coleta automática de métricas
export function metricsMiddleware(toolName: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const collector = MetricsCollector.getInstance();

        descriptor.value = async function (...args: any[]) {
            const startTime = Date.now();
            let success = true;
            
            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } catch (error) {
                success = false;
                collector.recordError();
                throw error;
            } finally {
                const responseTime = Date.now() - startTime;
                collector.recordToolCall(toolName, responseTime, success);
                collector.recordResponseTime(responseTime);
            }
        };
    };
}

// Instâncias globais
export const metricsCollector = MetricsCollector.getInstance();
export const metricsReporter = new MetricsReporter();

// Exportar ferramentas MCP para métricas
export const metricsTools = {
    'get-metrics': {
        name: 'get-metrics',
        description: 'Obter métricas completas do sistema',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['dashboard', 'health', 'performance', 'security'] }
            }
        },
        handler: async (args: any) => {
            const type = args.type || 'dashboard';
            
            switch (type) {
                case 'health':
                    return metricsReporter.getHealthReport();
                case 'performance':
                    return metricsReporter.getPerformanceReport();
                case 'security':
                    return metricsReporter.getSecurityReport();
                default:
                    return metricsCollector.getDashboard();
            }
        }
    }
};

export default MetricsCollector; 