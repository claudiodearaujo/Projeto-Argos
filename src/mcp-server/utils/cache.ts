import { logger } from './logger.js';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Interfaces para o sistema de cache
interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number;
    compressed: boolean;
    accessCount: number;
    lastAccessed: number;
    tags: string[];
}

interface CacheOptions {
    ttl?: number; // Time To Live em milissegundos
    compress?: boolean; // Compressão automática para valores grandes
    tags?: string[]; // Tags para invalidação em grupo
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
    entries: number;
    hitRate: number;
}

interface CacheMetrics {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    averageResponseTime: number;
    memoryUsage: number;
    compressionRatio: number;
}

// Sistema de cache inteligente
export class IntelligentCache {
    private static instance: IntelligentCache;
    private cache: Map<string, CacheEntry<any>> = new Map();
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        entries: 0,
        hitRate: 0
    };
    private readonly maxSize: number;
    private readonly defaultTTL: number;
    private readonly compressionThreshold: number;
    private readonly cleanupInterval: NodeJS.Timeout;

    constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.compressionThreshold = 1024; // 1KB - comprimir valores maiores que isso
        
        // Limpeza automática a cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    public static getInstance(): IntelligentCache {
        if (!IntelligentCache.instance) {
            IntelligentCache.instance = new IntelligentCache();
        }
        return IntelligentCache.instance;
    }

    // Obter valor do cache
    public async get<T>(key: string): Promise<T | null> {
        const startTime = Date.now();
        
        try {
            const entry = this.cache.get(key);
            
            if (!entry) {
                this.stats.misses++;
                this.updateHitRate();
                logger.debug(`[CACHE] Miss: ${key}`);
                return null;
            }

            // Verificar se expirou
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.stats.misses++;
                this.stats.evictions++;
                this.updateHitRate();
                logger.debug(`[CACHE] Expired: ${key}`);
                return null;
            }

            // Atualizar estatísticas de acesso
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            
            this.stats.hits++;
            this.updateHitRate();

            // Descomprimir se necessário
            let value = entry.value;
            if (entry.compressed) {
                value = await this.decompress(entry.value);
            }

            const responseTime = Date.now() - startTime;
            logger.debug(`[CACHE] Hit: ${key} (${responseTime}ms)`);
            
            return value;
        } catch (error) {
            logger.error(`[CACHE] Erro ao obter ${key}:`, error);
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }
    }

    // Armazenar valor no cache
    public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
        const startTime = Date.now();
        
        try {
            const ttl = options.ttl || this.defaultTTL;
            const tags = options.tags || [];
            
            // Verificar se deve comprimir
            const shouldCompress = options.compress !== false && this.shouldCompress(value);
            let finalValue = value;
            
            if (shouldCompress) {
                finalValue = await this.compress(value);
            }

            const entry: CacheEntry<T> = {
                value: finalValue,
                timestamp: Date.now(),
                ttl,
                compressed: shouldCompress,
                accessCount: 0,
                lastAccessed: Date.now(),
                tags
            };

            // Verificar capacidade e fazer eviction se necessário
            if (this.cache.size >= this.maxSize) {
                this.evictLRU();
            }

            this.cache.set(key, entry);
            this.stats.entries = this.cache.size;
            this.updateTotalSize();

            const responseTime = Date.now() - startTime;
            logger.debug(`[CACHE] Set: ${key} (${responseTime}ms, compressed: ${shouldCompress})`);
        } catch (error) {
            logger.error(`[CACHE] Erro ao definir ${key}:`, error);
            throw error;
        }
    }

    // Invalidar por key
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.entries = this.cache.size;
            this.updateTotalSize();
            logger.debug(`[CACHE] Deleted: ${key}`);
        }
        return deleted;
    }

    // Invalidar por tags
    public invalidateByTags(tags: string[]): number {
        let deletedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.some(tag => tags.includes(tag))) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        
        this.stats.entries = this.cache.size;
        this.stats.evictions += deletedCount;
        this.updateTotalSize();
        
        logger.info(`[CACHE] Invalidated ${deletedCount} entries by tags:`, tags);
        return deletedCount;
    }

    // Limpeza automática
    private cleanup(): void {
        const before = this.cache.size;
        const now = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.stats.evictions++;
            }
        }
        
        const after = this.cache.size;
        this.stats.entries = after;
        this.updateTotalSize();
        
        if (before !== after) {
            logger.info(`[CACHE] Cleanup: removed ${before - after} expired entries`);
        }
    }

    // Verificar se entrada expirou
    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    // Eviction LRU (Least Recently Used)
    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            logger.debug(`[CACHE] Evicted LRU: ${oldestKey}`);
        }
    }

    // Verificar se deve comprimir
    private shouldCompress(value: any): boolean {
        try {
            const serialized = JSON.stringify(value);
            return serialized.length > this.compressionThreshold;
        } catch {
            return false;
        }
    }

    // Comprimir valor
    private async compress(value: any): Promise<Buffer> {
        const serialized = JSON.stringify(value);
        return await gzipAsync(Buffer.from(serialized, 'utf8'));
    }

    // Descomprimir valor
    private async decompress(compressedValue: Buffer): Promise<any> {
        const decompressed = await gunzipAsync(compressedValue);
        return JSON.parse(decompressed.toString('utf8'));
    }

    // Atualizar hit rate
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }

    // Atualizar tamanho total
    private updateTotalSize(): void {
        this.stats.totalSize = this.cache.size;
    }

    // Obter estatísticas
    public getStats(): CacheStats {
        return { ...this.stats };
    }

    // Obter métricas detalhadas
    public getMetrics(): CacheMetrics {
        const totalRequests = this.stats.hits + this.stats.misses;
        let totalMemory = 0;
        let totalCompressed = 0;
        let totalUncompressed = 0;

        for (const entry of this.cache.values()) {
            const size = this.getEntrySize(entry);
            totalMemory += size;
            
            if (entry.compressed) {
                totalCompressed += size;
            } else {
                totalUncompressed += size;
            }
        }

        return {
            totalRequests,
            cacheHits: this.stats.hits,
            cacheMisses: this.stats.misses,
            averageResponseTime: 0, // Será calculado dinamicamente
            memoryUsage: totalMemory,
            compressionRatio: totalCompressed > 0 ? (totalCompressed / (totalCompressed + totalUncompressed)) * 100 : 0
        };
    }

    // Calcular tamanho da entrada
    private getEntrySize(entry: CacheEntry<any>): number {
        try {
            if (entry.compressed) {
                return (entry.value as Buffer).length;
            }
            return JSON.stringify(entry.value).length;
        } catch {
            return 0;
        }
    }

    // Limpar cache completo
    public clear(): void {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            entries: 0,
            hitRate: 0
        };
        logger.info('[CACHE] Cache cleared');
    }

    // Obter informações detalhadas sobre entradas
    public getEntryInfo(key: string): any {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        return {
            key,
            exists: true,
            timestamp: new Date(entry.timestamp).toISOString(),
            ttl: entry.ttl,
            remainingTTL: Math.max(0, entry.ttl - (Date.now() - entry.timestamp)),
            compressed: entry.compressed,
            accessCount: entry.accessCount,
            lastAccessed: new Date(entry.lastAccessed).toISOString(),
            tags: entry.tags,
            size: this.getEntrySize(entry),
            expired: this.isExpired(entry)
        };
    }

    // Listar todas as keys
    public getAllKeys(): string[] {
        return Array.from(this.cache.keys());
    }

    // Listar keys por tag
    public getKeysByTag(tag: string): string[] {
        const keys: string[] = [];
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.includes(tag)) {
                keys.push(key);
            }
        }
        return keys;
    }

    // Destruir cache
    public destroy(): void {
        clearInterval(this.cleanupInterval);
        this.clear();
        logger.info('[CACHE] Cache destroyed');
    }
}

// Classe para cache específico de ferramentas MCP
export class MCPToolCache {
    private cache: IntelligentCache;
    private readonly toolResultTTL = 10 * 60 * 1000; // 10 minutos para resultados
    private readonly toolMetadataTTL = 60 * 60 * 1000; // 1 hora para metadados

    constructor() {
        this.cache = IntelligentCache.getInstance();
    }

    // Cache para resultados de ferramentas
    public async cacheToolResult(toolName: string, args: any, result: any): Promise<void> {
        const key = this.generateToolKey(toolName, args);
        await this.cache.set(key, result, {
            ttl: this.toolResultTTL,
            tags: ['tool-result', toolName],
            compress: true
        });
    }

    // Obter resultado cacheado
    public async getCachedToolResult(toolName: string, args: any): Promise<any> {
        const key = this.generateToolKey(toolName, args);
        return await this.cache.get(key);
    }

    // Cache para metadados de ferramentas
    public async cacheToolMetadata(toolName: string, metadata: any): Promise<void> {
        const key = `tool-metadata:${toolName}`;
        await this.cache.set(key, metadata, {
            ttl: this.toolMetadataTTL,
            tags: ['tool-metadata', toolName]
        });
    }

    // Obter metadados cacheados
    public async getCachedToolMetadata(toolName: string): Promise<any> {
        const key = `tool-metadata:${toolName}`;
        return await this.cache.get(key);
    }

    // Invalidar cache de ferramenta específica
    public invalidateToolCache(toolName: string): void {
        this.cache.invalidateByTags([toolName]);
    }

    // Gerar chave única para ferramenta + argumentos
    private generateToolKey(toolName: string, args: any): string {
        const argsHash = createHash('md5').update(JSON.stringify(args)).digest('hex');
        return `tool-result:${toolName}:${argsHash}`;
    }

    // Obter estatísticas específicas de ferramentas
    public getToolCacheStats(): any {
        const stats = this.cache.getStats();
        const toolKeys = this.cache.getAllKeys().filter(key => key.startsWith('tool-'));
        
        return {
            ...stats,
            toolEntries: toolKeys.length,
            toolResultEntries: toolKeys.filter(key => key.startsWith('tool-result:')).length,
            toolMetadataEntries: toolKeys.filter(key => key.startsWith('tool-metadata:')).length
        };
    }
}

// Instâncias globais
export const intelligentCache = IntelligentCache.getInstance();
export const mcpToolCache = new MCPToolCache();

// Decorador para cache automático
export function CacheResult(ttl?: number, tags?: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `method:${target.constructor.name}:${propertyKey}:${createHash('md5').update(JSON.stringify(args)).digest('hex')}`;
            
            // Tentar obter do cache
            const cachedResult = await intelligentCache.get(cacheKey);
            if (cachedResult !== null) {
                return cachedResult;
            }

            // Executar método original
            const result = await originalMethod.apply(this, args);
            
            // Armazenar no cache
            await intelligentCache.set(cacheKey, result, {
                ttl: ttl || 5 * 60 * 1000, // 5 minutos por padrão
                tags: tags || [target.constructor.name, propertyKey]
            });
            
            return result;
        };
    };
}

export default IntelligentCache; 