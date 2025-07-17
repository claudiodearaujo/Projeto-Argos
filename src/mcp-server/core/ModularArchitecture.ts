import { logger } from '../utils/logger.js';
import { z } from 'zod';

// Interfaces para sistema modular
interface ModuleMetadata {
    name: string;
    version: string;
    description: string;
    author: string;
    dependencies: string[];
    provides: string[];
    requires: string[];
    main: string;
    type: 'core' | 'plugin' | 'extension';
    enabled: boolean;
    priority: number;
}

interface ModuleConfig {
    enabled: boolean;
    config: Record<string, any>;
    hooks: Record<string, Function[]>;
}

interface ModuleHook {
    name: string;
    handler: Function;
    priority: number;
    module: string;
}

interface ServiceDescriptor {
    name: string;
    implementation: any;
    dependencies: string[];
    lifecycle: 'singleton' | 'transient' | 'scoped';
    factory?: Function;
}

// Schema para validação de módulos
const ModuleSchema = z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string(),
    author: z.string(),
    dependencies: z.array(z.string()).optional(),
    provides: z.array(z.string()).optional(),
    requires: z.array(z.string()).optional(),
    main: z.string(),
    type: z.enum(['core', 'plugin', 'extension']),
    enabled: z.boolean().optional(),
    priority: z.number().optional()
});

// Classe base para módulos
export abstract class BaseModule {
    protected metadata: ModuleMetadata;
    protected config: Record<string, any> = {};
    protected services: Map<string, any> = new Map();
    
    constructor(metadata: ModuleMetadata) {
        this.metadata = metadata;
    }

    // Métodos do ciclo de vida
    abstract async initialize(): Promise<void>;
    abstract async start(): Promise<void>;
    abstract async stop(): Promise<void>;
    abstract async destroy(): Promise<void>;

    // Getters
    public getName(): string {
        return this.metadata.name;
    }

    public getVersion(): string {
        return this.metadata.version;
    }

    public getMetadata(): ModuleMetadata {
        return { ...this.metadata };
    }

    public isEnabled(): boolean {
        return this.metadata.enabled;
    }

    // Configuração
    public setConfig(config: Record<string, any>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfig(): Record<string, any> {
        return { ...this.config };
    }

    // Serviços
    public registerService(name: string, service: any): void {
        this.services.set(name, service);
    }

    public getService<T = any>(name: string): T | undefined {
        return this.services.get(name);
    }

    public getServices(): Map<string, any> {
        return new Map(this.services);
    }
}

// Container de injeção de dependências
export class DependencyContainer {
    private static instance: DependencyContainer;
    private services: Map<string, ServiceDescriptor> = new Map();
    private instances: Map<string, any> = new Map();
    private resolving: Set<string> = new Set();

    private constructor() {}

    public static getInstance(): DependencyContainer {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }

    // Registrar serviço
    public register<T>(descriptor: ServiceDescriptor): void {
        this.services.set(descriptor.name, descriptor);
        logger.debug(`[DI] Serviço registrado: ${descriptor.name}`);
    }

    // Resolver dependência
    public resolve<T>(name: string): T {
        if (this.resolving.has(name)) {
            throw new Error(`Dependência circular detectada: ${name}`);
        }

        const descriptor = this.services.get(name);
        if (!descriptor) {
            throw new Error(`Serviço não encontrado: ${name}`);
        }

        // Singleton - retornar instância existente
        if (descriptor.lifecycle === 'singleton' && this.instances.has(name)) {
            return this.instances.get(name);
        }

        this.resolving.add(name);

        try {
            // Resolver dependências
            const dependencies = descriptor.dependencies.map(dep => this.resolve(dep));
            
            // Criar instância
            let instance: T;
            if (descriptor.factory) {
                instance = descriptor.factory(...dependencies);
            } else {
                instance = new descriptor.implementation(...dependencies);
            }

            // Armazenar se singleton
            if (descriptor.lifecycle === 'singleton') {
                this.instances.set(name, instance);
            }

            logger.debug(`[DI] Serviço resolvido: ${name}`);
            return instance;

        } finally {
            this.resolving.delete(name);
        }
    }

    // Verificar se serviço está registrado
    public isRegistered(name: string): boolean {
        return this.services.has(name);
    }

    // Limpar instâncias
    public clear(): void {
        this.instances.clear();
        this.resolving.clear();
    }

    // Obter informações sobre serviços
    public getServiceInfo(): Array<{ name: string; lifecycle: string; hasInstance: boolean }> {
        return Array.from(this.services.entries()).map(([name, descriptor]) => ({
            name,
            lifecycle: descriptor.lifecycle,
            hasInstance: this.instances.has(name)
        }));
    }
}

// Sistema de hooks
export class HookSystem {
    private static instance: HookSystem;
    private hooks: Map<string, ModuleHook[]> = new Map();

    private constructor() {}

    public static getInstance(): HookSystem {
        if (!HookSystem.instance) {
            HookSystem.instance = new HookSystem();
        }
        return HookSystem.instance;
    }

    // Registrar hook
    public register(hookName: string, handler: Function, priority: number = 0, module: string = 'unknown'): void {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }

        const hook: ModuleHook = {
            name: hookName,
            handler,
            priority,
            module
        };

        this.hooks.get(hookName)!.push(hook);
        
        // Ordenar por prioridade (maior primeiro)
        this.hooks.get(hookName)!.sort((a, b) => b.priority - a.priority);
        
        logger.debug(`[HOOKS] Hook registrado: ${hookName} por ${module}`);
    }

    // Executar hook
    public async execute(hookName: string, ...args: any[]): Promise<any[]> {
        const hooks = this.hooks.get(hookName) || [];
        const results: any[] = [];

        logger.debug(`[HOOKS] Executando hook: ${hookName} (${hooks.length} handlers)`);

        for (const hook of hooks) {
            try {
                const result = await hook.handler(...args);
                results.push(result);
            } catch (error) {
                logger.error(`[HOOKS] Erro no hook ${hookName} (${hook.module}):`, error);
            }
        }

        return results;
    }

    // Remover hooks de um módulo
    public removeByModule(module: string): void {
        for (const [hookName, hooks] of this.hooks.entries()) {
            this.hooks.set(hookName, hooks.filter(h => h.module !== module));
        }
        logger.debug(`[HOOKS] Hooks removidos do módulo: ${module}`);
    }

    // Listar hooks
    public listHooks(): Record<string, ModuleHook[]> {
        const result: Record<string, ModuleHook[]> = {};
        for (const [name, hooks] of this.hooks.entries()) {
            result[name] = [...hooks];
        }
        return result;
    }
}

// Gerenciador de módulos
export class ModuleManager {
    private static instance: ModuleManager;
    private modules: Map<string, BaseModule> = new Map();
    private configs: Map<string, ModuleConfig> = new Map();
    private dependencyContainer: DependencyContainer;
    private hookSystem: HookSystem;
    private loadOrder: string[] = [];

    private constructor() {
        this.dependencyContainer = DependencyContainer.getInstance();
        this.hookSystem = HookSystem.getInstance();
    }

    public static getInstance(): ModuleManager {
        if (!ModuleManager.instance) {
            ModuleManager.instance = new ModuleManager();
        }
        return ModuleManager.instance;
    }

    // Registrar módulo
    public async registerModule(module: BaseModule): Promise<void> {
        const metadata = module.getMetadata();
        const name = metadata.name;

        // Validar metadados
        ModuleSchema.parse(metadata);

        // Verificar dependências
        await this.checkDependencies(metadata);

        this.modules.set(name, module);
        this.configs.set(name, {
            enabled: metadata.enabled,
            config: {},
            hooks: {}
        });

        logger.info(`[MODULES] Módulo registrado: ${name} v${metadata.version}`);
        
        // Executar hook de registro
        await this.hookSystem.execute('module:registered', module);
    }

    // Inicializar módulo
    public async initializeModule(name: string): Promise<void> {
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        const config = this.configs.get(name)!;
        if (!config.enabled) {
            logger.warn(`[MODULES] Módulo desabilitado: ${name}`);
            return;
        }

        try {
            // Executar hook de pré-inicialização
            await this.hookSystem.execute('module:pre-init', module);
            
            // Inicializar módulo
            await module.initialize();
            
            // Executar hook de pós-inicialização
            await this.hookSystem.execute('module:post-init', module);
            
            logger.info(`[MODULES] Módulo inicializado: ${name}`);
        } catch (error) {
            logger.error(`[MODULES] Erro ao inicializar módulo ${name}:`, error);
            throw error;
        }
    }

    // Inicializar todos os módulos
    public async initializeAll(): Promise<void> {
        const sortedModules = this.sortModulesByDependencies();
        
        for (const moduleName of sortedModules) {
            await this.initializeModule(moduleName);
        }
        
        this.loadOrder = sortedModules;
        logger.info(`[MODULES] Todos os módulos inicializados. Ordem: ${sortedModules.join(', ')}`);
    }

    // Iniciar módulo
    public async startModule(name: string): Promise<void> {
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        try {
            await this.hookSystem.execute('module:pre-start', module);
            await module.start();
            await this.hookSystem.execute('module:post-start', module);
            
            logger.info(`[MODULES] Módulo iniciado: ${name}`);
        } catch (error) {
            logger.error(`[MODULES] Erro ao iniciar módulo ${name}:`, error);
            throw error;
        }
    }

    // Iniciar todos os módulos
    public async startAll(): Promise<void> {
        for (const moduleName of this.loadOrder) {
            await this.startModule(moduleName);
        }
        logger.info(`[MODULES] Todos os módulos iniciados`);
    }

    // Parar módulo
    public async stopModule(name: string): Promise<void> {
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        try {
            await this.hookSystem.execute('module:pre-stop', module);
            await module.stop();
            await this.hookSystem.execute('module:post-stop', module);
            
            logger.info(`[MODULES] Módulo parado: ${name}`);
        } catch (error) {
            logger.error(`[MODULES] Erro ao parar módulo ${name}:`, error);
            throw error;
        }
    }

    // Parar todos os módulos
    public async stopAll(): Promise<void> {
        const reverseOrder = [...this.loadOrder].reverse();
        
        for (const moduleName of reverseOrder) {
            await this.stopModule(moduleName);
        }
        logger.info(`[MODULES] Todos os módulos parados`);
    }

    // Recarregar módulo (hot reload)
    public async reloadModule(name: string): Promise<void> {
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        logger.info(`[MODULES] Recarregando módulo: ${name}`);
        
        try {
            await this.stopModule(name);
            await this.hookSystem.execute('module:pre-reload', module);
            await this.startModule(name);
            await this.hookSystem.execute('module:post-reload', module);
            
            logger.info(`[MODULES] Módulo recarregado: ${name}`);
        } catch (error) {
            logger.error(`[MODULES] Erro ao recarregar módulo ${name}:`, error);
            throw error;
        }
    }

    // Configurar módulo
    public setModuleConfig(name: string, config: Record<string, any>): void {
        const moduleConfig = this.configs.get(name);
        if (!moduleConfig) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        moduleConfig.config = { ...moduleConfig.config, ...config };
        
        const module = this.modules.get(name);
        if (module) {
            module.setConfig(moduleConfig.config);
        }
        
        logger.debug(`[MODULES] Configuração atualizada para: ${name}`);
    }

    // Habilitar/desabilitar módulo
    public setModuleEnabled(name: string, enabled: boolean): void {
        const config = this.configs.get(name);
        if (!config) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }

        config.enabled = enabled;
        logger.info(`[MODULES] Módulo ${name} ${enabled ? 'habilitado' : 'desabilitado'}`);
    }

    // Obter informações sobre módulos
    public getModuleInfo(): Array<{ name: string; version: string; enabled: boolean; type: string }> {
        return Array.from(this.modules.entries()).map(([name, module]) => {
            const metadata = module.getMetadata();
            const config = this.configs.get(name)!;
            
            return {
                name,
                version: metadata.version,
                enabled: config.enabled,
                type: metadata.type
            };
        });
    }

    // Verificar dependências
    private async checkDependencies(metadata: ModuleMetadata): Promise<void> {
        for (const dep of metadata.dependencies || []) {
            if (!this.modules.has(dep)) {
                throw new Error(`Dependência não encontrada: ${dep} (requerida por ${metadata.name})`);
            }
        }
    }

    // Ordenar módulos por dependências
    private sortModulesByDependencies(): string[] {
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const result: string[] = [];

        const visit = (name: string) => {
            if (visiting.has(name)) {
                throw new Error(`Dependência circular detectada: ${name}`);
            }
            if (visited.has(name)) {
                return;
            }

            visiting.add(name);
            
            const module = this.modules.get(name);
            if (module) {
                const dependencies = module.getMetadata().dependencies || [];
                for (const dep of dependencies) {
                    visit(dep);
                }
            }

            visiting.delete(name);
            visited.add(name);
            result.push(name);
        };

        for (const name of this.modules.keys()) {
            visit(name);
        }

        return result;
    }

    // Obter estatísticas
    public getStats(): any {
        const modules = Array.from(this.modules.values());
        const configs = Array.from(this.configs.values());
        
        return {
            totalModules: modules.length,
            enabledModules: configs.filter(c => c.enabled).length,
            disabledModules: configs.filter(c => !c.enabled).length,
            coreModules: modules.filter(m => m.getMetadata().type === 'core').length,
            plugins: modules.filter(m => m.getMetadata().type === 'plugin').length,
            extensions: modules.filter(m => m.getMetadata().type === 'extension').length,
            loadOrder: this.loadOrder,
            services: this.dependencyContainer.getServiceInfo(),
            hooks: Object.keys(this.hookSystem.listHooks())
        };
    }
}

// Exemplo de módulo core
export class CoreModule extends BaseModule {
    constructor() {
        super({
            name: 'argos-core',
            version: '1.1.0',
            description: 'Módulo core do Projeto Argos',
            author: 'Argos Team',
            dependencies: [],
            provides: ['logger', 'cache', 'security'],
            requires: [],
            main: 'CoreModule',
            type: 'core',
            enabled: true,
            priority: 100
        });
    }

    async initialize(): Promise<void> {
        logger.info(`[CORE] Inicializando módulo core...`);
        
        // Registrar serviços core
        const container = DependencyContainer.getInstance();
        
        container.register({
            name: 'logger',
            implementation: logger,
            dependencies: [],
            lifecycle: 'singleton'
        });

        // Registrar hooks core
        const hooks = HookSystem.getInstance();
        hooks.register('system:startup', this.onSystemStartup.bind(this), 100, 'argos-core');
        hooks.register('system:shutdown', this.onSystemShutdown.bind(this), 100, 'argos-core');
    }

    async start(): Promise<void> {
        logger.info(`[CORE] Módulo core iniciado`);
    }

    async stop(): Promise<void> {
        logger.info(`[CORE] Módulo core parado`);
    }

    async destroy(): Promise<void> {
        logger.info(`[CORE] Módulo core destruído`);
    }

    private async onSystemStartup(): Promise<void> {
        logger.info(`[CORE] Sistema iniciando...`);
    }

    private async onSystemShutdown(): Promise<void> {
        logger.info(`[CORE] Sistema parando...`);
    }
}

// Instâncias globais
export const moduleManager = ModuleManager.getInstance();
export const dependencyContainer = DependencyContainer.getInstance();
export const hookSystem = HookSystem.getInstance();

// Utilitários para criação de módulos
export function createModule(metadata: ModuleMetadata, implementation: any): BaseModule {
    class DynamicModule extends BaseModule {
        constructor() {
            super(metadata);
        }

        async initialize(): Promise<void> {
            if (implementation.initialize) {
                await implementation.initialize.call(this);
            }
        }

        async start(): Promise<void> {
            if (implementation.start) {
                await implementation.start.call(this);
            }
        }

        async stop(): Promise<void> {
            if (implementation.stop) {
                await implementation.stop.call(this);
            }
        }

        async destroy(): Promise<void> {
            if (implementation.destroy) {
                await implementation.destroy.call(this);
            }
        }
    }

    return new DynamicModule();
}

// Decorador para injeção de dependências
export function Inject(serviceName: string) {
    return function (target: any, propertyKey: string) {
        const getter = () => dependencyContainer.resolve(serviceName);
        
        Object.defineProperty(target, propertyKey, {
            get: getter,
            enumerable: true,
            configurable: true
        });
    };
}

export default ModuleManager; 