import { logger } from './logger.js';
import { moduleManager } from '../core/ModularArchitecture.js';
import { intelligentCache } from './cache.js';
import { metricsCollector } from './metrics.js';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, mkdirSync, watch } from 'fs';
import { join, dirname } from 'path';

// Interfaces para Developer Experience
interface DeveloperTool {
    name: string;
    description: string;
    category: 'debugging' | 'testing' | 'documentation' | 'analysis' | 'productivity';
    handler: Function;
    shortcuts?: string[];
    enabled: boolean;
}

interface DebugSession {
    id: string;
    startTime: string;
    context: Record<string, any>;
    breakpoints: BreakPoint[];
    variables: Record<string, any>;
    callStack: CallStackFrame[];
    status: 'active' | 'paused' | 'stopped';
}

interface BreakPoint {
    id: string;
    file: string;
    line: number;
    condition?: string;
    enabled: boolean;
}

interface CallStackFrame {
    function: string;
    file: string;
    line: number;
    variables: Record<string, any>;
}

interface CodeTemplate {
    name: string;
    category: string;
    description: string;
    template: string;
    variables: string[];
    examples?: string[];
}

interface ProjectScaffold {
    name: string;
    description: string;
    structure: ProjectStructure;
    files: Record<string, string>;
    commands: string[];
}

interface ProjectStructure {
    directories: string[];
    files: string[];
    templates: string[];
}

// Schema para validação
const DebugSessionSchema = z.object({
    context: z.record(z.any()).optional(),
    breakpoints: z.array(z.object({
        file: z.string(),
        line: z.number(),
        condition: z.string().optional()
    })).optional()
});

const TemplateSchema = z.object({
    name: z.string().min(1),
    variables: z.record(z.string()).optional(),
    outputPath: z.string().optional()
});

// Sistema de debugging
class DebugSystem {
    private static instance: DebugSystem;
    private sessions: Map<string, DebugSession> = new Map();
    private globalBreakpoints: Set<string> = new Set();
    private watchedFiles: Set<string> = new Set();

    private constructor() {}

    public static getInstance(): DebugSystem {
        if (!DebugSystem.instance) {
            DebugSystem.instance = new DebugSystem();
        }
        return DebugSystem.instance;
    }

    public startSession(context: Record<string, any> = {}): string {
        const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const session: DebugSession = {
            id: sessionId,
            startTime: new Date().toISOString(),
            context,
            breakpoints: [],
            variables: {},
            callStack: [],
            status: 'active'
        };

        this.sessions.set(sessionId, session);
        logger.info(`[DEBUG] Nova sessão iniciada: ${sessionId}`);
        return sessionId;
    }

    public addBreakpoint(sessionId: string, file: string, line: number, condition?: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Sessão não encontrada: ${sessionId}`);
        }

        const breakpoint: BreakPoint = {
            id: `bp-${Date.now()}`,
            file,
            line,
            condition,
            enabled: true
        };

        session.breakpoints.push(breakpoint);
        logger.debug(`[DEBUG] Breakpoint adicionado: ${file}:${line}`);
    }

    public getSessionInfo(sessionId: string): DebugSession | undefined {
        return this.sessions.get(sessionId);
    }

    public listSessions(): DebugSession[] {
        return Array.from(this.sessions.values());
    }

    public stopSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'stopped';
            logger.info(`[DEBUG] Sessão parada: ${sessionId}`);
        }
    }

    public inspect(obj: any, depth: number = 3): string {
        return JSON.stringify(obj, null, 2);
    }

    public trace(message: string, data?: any): void {
        logger.debug(`[TRACE] ${message}`, data);
    }
}

// Sistema de templates
class TemplateSystem {
    private static instance: TemplateSystem;
    private templates: Map<string, CodeTemplate> = new Map();

    private constructor() {
        this.loadDefaultTemplates();
    }

    public static getInstance(): TemplateSystem {
        if (!TemplateSystem.instance) {
            TemplateSystem.instance = new TemplateSystem();
        }
        return TemplateSystem.instance;
    }

    private loadDefaultTemplates(): void {
        const templates: CodeTemplate[] = [
            {
                name: 'mcp-tool',
                category: 'tools',
                description: 'Template para nova ferramenta MCP',
                template: `import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { validateToolInput } from '../utils/validation.js';

// Schema de validação
const {{NAME}}Schema = z.object({
    {{FIELDS}}
});

// Implementação da ferramenta
export async function {{NAME}}(input: any): Promise<any> {
    try {
        const params = validateToolInput({{NAME}}Schema, input);
        
        // Implementar lógica aqui
        {{IMPLEMENTATION}}
        
        return {
            success: true,
            data: result
        };
    } catch (error) {
        logger.error('Erro em {{NAME}}:', error);
        throw error;
    }
}

// Definição da ferramenta para MCP
export const {{NAME}}Tool = {
    name: '{{NAME}}',
    description: '{{DESCRIPTION}}',
    inputSchema: {{NAME}}Schema,
    handler: {{NAME}}
};`,
                variables: ['NAME', 'FIELDS', 'IMPLEMENTATION', 'DESCRIPTION']
            },
            {
                name: 'security-middleware',
                category: 'security',
                description: 'Template para middleware de segurança',
                template: `import { securityFramework, SecurityEventType } from '../utils/security.js';
import { logger } from '../utils/logger.js';

export function {{NAME}}Middleware(options: any = {}) {
    return async function(req: any, res: any, next: any) {
        const startTime = Date.now();
        
        try {
            // Validação de segurança
            {{VALIDATION}}
            
            // Log de auditoria
            securityFramework.logSecurityEvent({
                type: SecurityEventType.{{EVENT_TYPE}},
                userId: req.user?.id,
                ipAddress: req.ip,
                resource: '{{RESOURCE}}',
                action: '{{ACTION}}',
                severity: '{{SEVERITY}}'
            });
            
            next();
        } catch (error) {
            logger.error('[SECURITY] Erro no middleware {{NAME}}:', error);
            res.status(403).json({ error: 'Acesso negado' });
        }
    };
}`,
                variables: ['NAME', 'VALIDATION', 'EVENT_TYPE', 'RESOURCE', 'ACTION', 'SEVERITY']
            },
            {
                name: 'cache-service',
                category: 'performance',
                description: 'Template para serviço com cache',
                template: `import { intelligentCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

export class {{NAME}}Service {
    private readonly cachePrefix = '{{CACHE_PREFIX}}';
    private readonly cacheTTL = {{CACHE_TTL}};

    public async {{METHOD}}(params: any): Promise<any> {
        const cacheKey = \`\${this.cachePrefix}:\${JSON.stringify(params)}\`;
        
        // Tentar obter do cache
        const cached = await intelligentCache.get(cacheKey);
        if (cached) {
            logger.debug('[CACHE] Hit para {{NAME}}Service.{{METHOD}}');
            return cached;
        }
        
        // Executar lógica
        const result = await this.{{METHOD}}Internal(params);
        
        // Armazenar no cache
        await intelligentCache.set(cacheKey, result, {
            ttl: this.cacheTTL,
            tags: ['{{NAME}}', '{{METHOD}}']
        });
        
        logger.debug('[CACHE] Miss para {{NAME}}Service.{{METHOD}}');
        return result;
    }
    
    private async {{METHOD}}Internal(params: any): Promise<any> {
        // Implementar lógica real aqui
        {{IMPLEMENTATION}}
    }
}`,
                variables: ['NAME', 'CACHE_PREFIX', 'CACHE_TTL', 'METHOD', 'IMPLEMENTATION']
            }
        ];

        for (const template of templates) {
            this.templates.set(template.name, template);
        }
    }

    public getTemplate(name: string): CodeTemplate | undefined {
        return this.templates.get(name);
    }

    public listTemplates(): CodeTemplate[] {
        return Array.from(this.templates.values());
    }

    public generateCode(templateName: string, variables: Record<string, string>): string {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template não encontrado: ${templateName}`);
        }

        let code = template.template;
        
        // Substituir variáveis
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            code = code.replace(regex, value);
        }

        return code;
    }

    public addTemplate(template: CodeTemplate): void {
        this.templates.set(template.name, template);
        logger.info(`[TEMPLATE] Template adicionado: ${template.name}`);
    }
}

// Sistema de hot reload
class HotReloadSystem {
    private static instance: HotReloadSystem;
    private watchers: Map<string, any> = new Map();
    private reloadCallbacks: Map<string, Function[]> = new Map();

    private constructor() {}

    public static getInstance(): HotReloadSystem {
        if (!HotReloadSystem.instance) {
            HotReloadSystem.instance = new HotReloadSystem();
        }
        return HotReloadSystem.instance;
    }

    public watchFile(filePath: string, callback: Function): void {
        if (!this.watchers.has(filePath)) {
            const watcher = watch(filePath, (eventType, filename) => {
                if (eventType === 'change') {
                    logger.info(`[HOT RELOAD] Arquivo alterado: ${filePath}`);
                    this.triggerReload(filePath);
                }
            });
            
            this.watchers.set(filePath, watcher);
            this.reloadCallbacks.set(filePath, []);
        }

        this.reloadCallbacks.get(filePath)!.push(callback);
    }

    public watchDirectory(dirPath: string, callback: Function): void {
        const watcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
            if (eventType === 'change' && filename) {
                const fullPath = join(dirPath, filename);
                logger.info(`[HOT RELOAD] Arquivo alterado: ${fullPath}`);
                callback(fullPath);
            }
        });

        this.watchers.set(dirPath, watcher);
    }

    private triggerReload(filePath: string): void {
        const callbacks = this.reloadCallbacks.get(filePath) || [];
        for (const callback of callbacks) {
            try {
                callback(filePath);
            } catch (error) {
                logger.error(`[HOT RELOAD] Erro no callback para ${filePath}:`, error);
            }
        }
    }

    public stopWatching(filePath: string): void {
        const watcher = this.watchers.get(filePath);
        if (watcher) {
            watcher.close();
            this.watchers.delete(filePath);
            this.reloadCallbacks.delete(filePath);
        }
    }

    public stopAll(): void {
        for (const [path, watcher] of this.watchers.entries()) {
            watcher.close();
        }
        this.watchers.clear();
        this.reloadCallbacks.clear();
    }
}

// Sistema de produtividade
class ProductivitySystem {
    private static instance: ProductivitySystem;
    private shortcuts: Map<string, Function> = new Map();
    private commands: Map<string, Function> = new Map();

    private constructor() {
        this.setupDefaultCommands();
    }

    public static getInstance(): ProductivitySystem {
        if (!ProductivitySystem.instance) {
            ProductivitySystem.instance = new ProductivitySystem();
        }
        return ProductivitySystem.instance;
    }

    private setupDefaultCommands(): void {
        // Comandos de sistema
        this.commands.set('status', () => {
            return {
                modules: moduleManager.getStats(),
                cache: intelligentCache.getStats(),
                metrics: metricsCollector.getDashboard()
            };
        });

        this.commands.set('clear-cache', () => {
            intelligentCache.clear();
            return { success: true, message: 'Cache limpo' };
        });

        this.commands.set('reload-modules', async () => {
            await moduleManager.stopAll();
            await moduleManager.startAll();
            return { success: true, message: 'Módulos recarregados' };
        });

        // Comandos de debugging
        this.commands.set('debug-start', (context: any) => {
            const sessionId = DebugSystem.getInstance().startSession(context);
            return { sessionId, message: 'Sessão de debug iniciada' };
        });

        this.commands.set('debug-list', () => {
            return DebugSystem.getInstance().listSessions();
        });

        // Comandos de templates
        this.commands.set('template-list', () => {
            return TemplateSystem.getInstance().listTemplates();
        });

        this.commands.set('template-generate', (templateName: string, variables: Record<string, string>) => {
            const code = TemplateSystem.getInstance().generateCode(templateName, variables);
            return { code, message: 'Código gerado' };
        });
    }

    public registerCommand(name: string, handler: Function): void {
        this.commands.set(name, handler);
        logger.debug(`[PRODUCTIVITY] Comando registrado: ${name}`);
    }

    public executeCommand(name: string, ...args: any[]): any {
        const handler = this.commands.get(name);
        if (!handler) {
            throw new Error(`Comando não encontrado: ${name}`);
        }

        return handler(...args);
    }

    public listCommands(): string[] {
        return Array.from(this.commands.keys());
    }

    public registerShortcut(keys: string, handler: Function): void {
        this.shortcuts.set(keys, handler);
        logger.debug(`[PRODUCTIVITY] Atalho registrado: ${keys}`);
    }

    public getShortcuts(): Record<string, string> {
        const shortcuts: Record<string, string> = {};
        for (const [keys, handler] of this.shortcuts.entries()) {
            shortcuts[keys] = handler.name || 'anonymous';
        }
        return shortcuts;
    }
}

// Sistema principal de Developer Experience
export class DeveloperExperience {
    private static instance: DeveloperExperience;
    private debugSystem: DebugSystem;
    private templateSystem: TemplateSystem;
    private hotReloadSystem: HotReloadSystem;
    private productivitySystem: ProductivitySystem;
    private tools: Map<string, DeveloperTool> = new Map();

    private constructor() {
        this.debugSystem = DebugSystem.getInstance();
        this.templateSystem = TemplateSystem.getInstance();
        this.hotReloadSystem = HotReloadSystem.getInstance();
        this.productivitySystem = ProductivitySystem.getInstance();
        this.setupDefaultTools();
    }

    public static getInstance(): DeveloperExperience {
        if (!DeveloperExperience.instance) {
            DeveloperExperience.instance = new DeveloperExperience();
        }
        return DeveloperExperience.instance;
    }

    private setupDefaultTools(): void {
        const tools: DeveloperTool[] = [
            {
                name: 'debug-session',
                description: 'Iniciar sessão de debugging',
                category: 'debugging',
                handler: this.startDebugSession.bind(this),
                shortcuts: ['ctrl+d'],
                enabled: true
            },
            {
                name: 'generate-template',
                description: 'Gerar código a partir de template',
                category: 'productivity',
                handler: this.generateTemplate.bind(this),
                shortcuts: ['ctrl+g'],
                enabled: true
            },
            {
                name: 'hot-reload',
                description: 'Configurar hot reload',
                category: 'productivity',
                handler: this.setupHotReload.bind(this),
                shortcuts: ['ctrl+r'],
                enabled: true
            },
            {
                name: 'performance-analysis',
                description: 'Análise de performance',
                category: 'analysis',
                handler: this.analyzePerformance.bind(this),
                shortcuts: ['ctrl+p'],
                enabled: true
            }
        ];

        for (const tool of tools) {
            this.tools.set(tool.name, tool);
        }
    }

    // Ferramentas de debugging
    public async startDebugSession(input: any): Promise<any> {
        const params = DebugSessionSchema.parse(input);
        const sessionId = this.debugSystem.startSession(params.context);
        
        return {
            sessionId,
            message: 'Sessão de debug iniciada',
            commands: [
                'debug-add-breakpoint',
                'debug-inspect-variables',
                'debug-call-stack'
            ]
        };
    }

    // Ferramentas de templates
    public async generateTemplate(input: any): Promise<any> {
        const params = TemplateSchema.parse(input);
        const code = this.templateSystem.generateCode(params.name, params.variables || {});
        
        // Salvar arquivo se especificado
        if (params.outputPath) {
            const dir = dirname(params.outputPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            writeFileSync(params.outputPath, code);
        }
        
        return {
            code,
            outputPath: params.outputPath,
            message: 'Template gerado com sucesso'
        };
    }

    // Ferramentas de hot reload
    public async setupHotReload(input: any): Promise<any> {
        const { filePath, callback } = input;
        
        this.hotReloadSystem.watchFile(filePath, callback || (() => {
            logger.info(`[HOT RELOAD] Arquivo recarregado: ${filePath}`);
        }));
        
        return {
            message: `Hot reload configurado para: ${filePath}`,
            watching: true
        };
    }

    // Ferramentas de análise
    public async analyzePerformance(input: any): Promise<any> {
        const metrics = metricsCollector.getDashboard();
        const cacheStats = intelligentCache.getStats();
        
        const analysis = {
            performance: {
                responseTime: metrics.application.responseTime,
                throughput: metrics.application.throughput,
                errorRate: metrics.application.errorRate
            },
            cache: {
                hitRate: cacheStats.hitRate,
                efficiency: cacheStats.hitRate > 70 ? 'good' : 'needs improvement'
            },
            recommendations: []
        };

        // Gerar recomendações
        if (metrics.application.errorRate > 5) {
            analysis.recommendations.push('Alta taxa de erro - investigar logs');
        }
        
        if (cacheStats.hitRate < 50) {
            analysis.recommendations.push('Baixa eficiência de cache - revisar estratégia');
        }

        return analysis;
    }

    // Obter ferramentas disponíveis
    public getTools(): DeveloperTool[] {
        return Array.from(this.tools.values()).filter(tool => tool.enabled);
    }

    // Executar ferramenta
    public async executeTool(name: string, input: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Ferramenta não encontrada: ${name}`);
        }

        if (!tool.enabled) {
            throw new Error(`Ferramenta desabilitada: ${name}`);
        }

        return await tool.handler(input);
    }

    // Obter estatísticas
    public getStats(): any {
        return {
            enabledTools: Array.from(this.tools.values()).filter(t => t.enabled).length,
            totalTools: this.tools.size,
            debugSessions: this.debugSystem.listSessions().length,
            templates: this.templateSystem.listTemplates().length,
            watchers: this.hotReloadSystem['watchers'].size,
            commands: this.productivitySystem.listCommands().length
        };
    }
}

// Instâncias globais
export const developerExperience = DeveloperExperience.getInstance();
export const debugSystem = DebugSystem.getInstance();
export const templateSystem = TemplateSystem.getInstance();
export const hotReloadSystem = HotReloadSystem.getInstance();
export const productivitySystem = ProductivitySystem.getInstance();

// Ferramentas MCP para Developer Experience
export const developerTools = {
    'debug-session': {
        name: 'debug-session',
        description: 'Iniciar sessão de debugging',
        inputSchema: DebugSessionSchema,
        handler: async (args: any) => {
            return await developerExperience.startDebugSession(args);
        }
    },
    'generate-template': {
        name: 'generate-template',
        description: 'Gerar código a partir de template',
        inputSchema: TemplateSchema,
        handler: async (args: any) => {
            return await developerExperience.generateTemplate(args);
        }
    },
    'developer-stats': {
        name: 'developer-stats',
        description: 'Obter estatísticas de ferramentas de desenvolvimento',
        inputSchema: z.object({}),
        handler: async () => {
            return developerExperience.getStats();
        }
    }
};

export default DeveloperExperience; 