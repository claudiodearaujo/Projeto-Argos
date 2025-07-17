import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { validateToolInput } from '../utils/validation.js';
import { securityFramework, SecurityEventType } from '../utils/security.js';
import { mcpToolCache } from '../utils/cache.js';

// Schemas de validação para integração com IA
const AIAssistantSchema = z.object({
    prompt: z.string().min(1, 'Prompt é obrigatório'),
    model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2', 'copilot']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
    systemPrompt: z.string().optional(),
    context: z.array(z.string()).optional(),
    codeContext: z.object({
        language: z.string(),
        code: z.string(),
        fileName: z.string().optional()
    }).optional()
});

const CodeAnalysisSchema = z.object({
    code: z.string().min(1, 'Código é obrigatório'),
    language: z.string(),
    analysisType: z.enum(['quality', 'security', 'performance', 'bugs', 'suggestions']),
    fileName: z.string().optional()
});

const DocumentationSchema = z.object({
    code: z.string().min(1, 'Código é obrigatório'),
    language: z.string(),
    style: z.enum(['jsdoc', 'markdown', 'inline', 'comprehensive']).optional(),
    includeExamples: z.boolean().optional()
});

const RefactoringSchema = z.object({
    code: z.string().min(1, 'Código é obrigatório'),
    language: z.string(),
    refactoringType: z.enum(['optimize', 'modernize', 'clean', 'extract-functions', 'improve-readability']),
    targetVersion: z.string().optional()
});

// Interface para providers de IA
interface AIProvider {
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    maxTokens: number;
    supportedFeatures: string[];
}

// Configuração de providers de IA
const AI_PROVIDERS: Record<string, AIProvider> = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        supportedFeatures: ['chat', 'code-completion', 'analysis', 'documentation']
    },
    claude: {
        name: 'Claude',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        supportedFeatures: ['chat', 'analysis', 'documentation', 'refactoring']
    },
    copilot: {
        name: 'GitHub Copilot',
        baseUrl: 'https://api.github.com/copilot',
        apiKey: process.env.GITHUB_TOKEN || '',
        model: 'copilot',
        maxTokens: 2000,
        supportedFeatures: ['code-completion', 'suggestions', 'chat']
    }
};

// Sistema de contexto para IA
class AIContext {
    private context: Map<string, any> = new Map();
    private conversation: Array<{role: string, content: string, timestamp: number}> = [];
    private maxContextSize = 50;

    public addContext(key: string, value: any): void {
        this.context.set(key, value);
    }

    public getContext(key: string): any {
        return this.context.get(key);
    }

    public addToConversation(role: string, content: string): void {
        this.conversation.push({
            role,
            content,
            timestamp: Date.now()
        });

        // Manter tamanho da conversa controlado
        if (this.conversation.length > this.maxContextSize) {
            this.conversation = this.conversation.slice(-this.maxContextSize);
        }
    }

    public getConversation(): Array<{role: string, content: string, timestamp: number}> {
        return [...this.conversation];
    }

    public clearContext(): void {
        this.context.clear();
        this.conversation = [];
    }

    public getSystemPrompt(): string {
        return `Você é um assistente de IA especializado em desenvolvimento de software integrado ao Projeto Argos.
        
Contexto do Sistema:
- Projeto: ${this.context.get('project') || 'Projeto Argos MCP Server'}
- Tecnologias: ${this.context.get('technologies') || 'TypeScript, Node.js, MCP Protocol'}
- Arquitetura: ${this.context.get('architecture') || 'Modular, Segura, Escalável'}

Diretrizes:
- Forneça respostas práticas e implementáveis
- Foque em código limpo e manutenível
- Considere segurança e performance
- Inclua exemplos quando apropriado
- Mantenha consistência com o estilo do projeto`;
    }
}

// Classe principal para integração com IA
export class AIIntegration {
    private static instance: AIIntegration;
    private context: AIContext;
    private rateLimiter: Map<string, number> = new Map();
    private readonly maxRequestsPerMinute = 60;

    private constructor() {
        this.context = new AIContext();
        this.setupDefaultContext();
    }

    public static getInstance(): AIIntegration {
        if (!AIIntegration.instance) {
            AIIntegration.instance = new AIIntegration();
        }
        return AIIntegration.instance;
    }

    private setupDefaultContext(): void {
        this.context.addContext('project', 'Projeto Argos MCP Server');
        this.context.addContext('technologies', 'TypeScript, Node.js, MCP Protocol, Zod, Winston');
        this.context.addContext('architecture', 'Modular, Segura, Escalável');
        this.context.addContext('codeStyle', 'Clean Code, SOLID Principles, TypeScript Best Practices');
    }

    // Assistente de IA geral
    public async aiAssistant(input: any): Promise<any> {
        try {
            const params = validateToolInput(AIAssistantSchema, input);
            
            // Verificar rate limiting
            if (!this.checkRateLimit('ai-assistant')) {
                throw new Error('Rate limit excedido para assistente de IA');
            }

            // Verificar se há resultado em cache
            const cachedResult = await mcpToolCache.getCachedToolResult('ai-assistant', params);
            if (cachedResult) {
                return cachedResult;
            }

            // Log de auditoria
            securityFramework.logToolExecution('ai-assistant', params);

            // Selecionar provider baseado no modelo
            const provider = this.selectProvider(params.model);
            if (!provider) {
                throw new Error(`Modelo ${params.model} não suportado`);
            }

            // Preparar contexto
            const systemPrompt = params.systemPrompt || this.context.getSystemPrompt();
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.context.getConversation(),
                { role: 'user', content: params.prompt }
            ];

            // Fazer chamada para IA
            const response = await this.callAIProvider(provider, messages, {
                temperature: params.temperature || 0.7,
                maxTokens: params.maxTokens || 1500
            });

            // Adicionar à conversa
            this.context.addToConversation('user', params.prompt);
            this.context.addToConversation('assistant', response.content);

            const result = {
                content: response.content,
                model: provider.model,
                provider: provider.name,
                tokens: response.tokens || 0,
                timestamp: new Date().toISOString()
            };

            // Cache do resultado
            await mcpToolCache.cacheToolResult('ai-assistant', params, result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            logger.error('Erro no assistente de IA:', error);
            throw error;
        }
    }

    // Análise de código com IA
    public async analyzeCode(input: any): Promise<any> {
        try {
            const params = validateToolInput(CodeAnalysisSchema, input);
            
            if (!this.checkRateLimit('code-analysis')) {
                throw new Error('Rate limit excedido para análise de código');
            }

            const cachedResult = await mcpToolCache.getCachedToolResult('code-analysis', params);
            if (cachedResult) {
                return cachedResult;
            }

            securityFramework.logToolExecution('code-analysis', params);

            const analysisPrompts = {
                quality: `Analise a qualidade do código ${params.language} a seguir e forneça sugestões de melhoria:`,
                security: `Analise o código ${params.language} para vulnerabilidades de segurança:`,
                performance: `Analise o código ${params.language} para problemas de performance:`,
                bugs: `Identifique possíveis bugs no código ${params.language}:`,
                suggestions: `Forneça sugestões de melhoria para o código ${params.language}:`
            };

            const prompt = `${analysisPrompts[params.analysisType]}

\`\`\`${params.language}
${params.code}
\`\`\`

Por favor, forneça uma análise detalhada incluindo:
1. Problemas identificados
2. Sugestões de melhoria
3. Código corrigido (se aplicável)
4. Explicação das mudanças`;

            const provider = this.selectProvider('gpt-4');
            const response = await this.callAIProvider(provider, [
                { role: 'system', content: this.context.getSystemPrompt() },
                { role: 'user', content: prompt }
            ]);

            const result = {
                analysis: response.content,
                analysisType: params.analysisType,
                language: params.language,
                fileName: params.fileName,
                timestamp: new Date().toISOString()
            };

            await mcpToolCache.cacheToolResult('code-analysis', params, result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            logger.error('Erro na análise de código:', error);
            throw error;
        }
    }

    // Geração de documentação
    public async generateDocumentation(input: any): Promise<any> {
        try {
            const params = validateToolInput(DocumentationSchema, input);
            
            if (!this.checkRateLimit('documentation')) {
                throw new Error('Rate limit excedido para geração de documentação');
            }

            const cachedResult = await mcpToolCache.getCachedToolResult('documentation', params);
            if (cachedResult) {
                return cachedResult;
            }

            securityFramework.logToolExecution('documentation', params);

            const style = params.style || 'comprehensive';
            const includeExamples = params.includeExamples !== false;

            const prompt = `Gere documentação ${style} para o código ${params.language} a seguir:

\`\`\`${params.language}
${params.code}
\`\`\`

Requisitos:
- Estilo: ${style}
- Incluir exemplos: ${includeExamples}
- Documentar todas as funções, classes e interfaces
- Explicar parâmetros e valores de retorno
- Incluir exemplos de uso ${includeExamples ? 'com código' : ''}`;

            const provider = this.selectProvider('claude-3');
            const response = await this.callAIProvider(provider, [
                { role: 'system', content: this.context.getSystemPrompt() },
                { role: 'user', content: prompt }
            ]);

            const result = {
                documentation: response.content,
                style: style,
                language: params.language,
                includeExamples: includeExamples,
                timestamp: new Date().toISOString()
            };

            await mcpToolCache.cacheToolResult('documentation', params, result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            logger.error('Erro na geração de documentação:', error);
            throw error;
        }
    }

    // Refatoração de código
    public async refactorCode(input: any): Promise<any> {
        try {
            const params = validateToolInput(RefactoringSchema, input);
            
            if (!this.checkRateLimit('refactoring')) {
                throw new Error('Rate limit excedido para refatoração');
            }

            const cachedResult = await mcpToolCache.getCachedToolResult('refactoring', params);
            if (cachedResult) {
                return cachedResult;
            }

            securityFramework.logToolExecution('refactoring', params);

            const refactoringPrompts = {
                optimize: 'Otimize o código para melhor performance',
                modernize: 'Modernize o código usando as melhores práticas atuais',
                clean: 'Limpe o código seguindo princípios de clean code',
                'extract-functions': 'Extraia funções para melhorar a organização',
                'improve-readability': 'Melhore a legibilidade do código'
            };

            const prompt = `${refactoringPrompts[params.refactoringType]} no código ${params.language} a seguir:

\`\`\`${params.language}
${params.code}
\`\`\`

Requisitos:
- Tipo de refatoração: ${params.refactoringType}
- Manter funcionalidade original
- Melhorar qualidade do código
- Explicar as mudanças realizadas
${params.targetVersion ? `- Versão alvo: ${params.targetVersion}` : ''}`;

            const provider = this.selectProvider('gpt-4');
            const response = await this.callAIProvider(provider, [
                { role: 'system', content: this.context.getSystemPrompt() },
                { role: 'user', content: prompt }
            ]);

            const result = {
                refactoredCode: response.content,
                refactoringType: params.refactoringType,
                language: params.language,
                targetVersion: params.targetVersion,
                timestamp: new Date().toISOString()
            };

            await mcpToolCache.cacheToolResult('refactoring', params, result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            logger.error('Erro na refatoração:', error);
            throw error;
        }
    }

    // Selecionar provider de IA
    private selectProvider(model?: string): AIProvider | null {
        if (!model) {
            return AI_PROVIDERS.openai; // Padrão
        }

        for (const provider of Object.values(AI_PROVIDERS)) {
            if (provider.model === model || provider.name.toLowerCase() === model.toLowerCase()) {
                return provider;
            }
        }

        return AI_PROVIDERS.openai; // Fallback
    }

    // Verificar rate limiting
    private checkRateLimit(operation: string): boolean {
        const now = Date.now();
        const key = `${operation}-${Math.floor(now / 60000)}`; // Por minuto
        
        const currentCount = this.rateLimiter.get(key) || 0;
        if (currentCount >= this.maxRequestsPerMinute) {
            return false;
        }

        this.rateLimiter.set(key, currentCount + 1);
        return true;
    }

    // Chamada para provider de IA (simulada)
    private async callAIProvider(provider: AIProvider, messages: any[], options: any = {}): Promise<any> {
        // Simular chamada real para API
        logger.info(`Chamando ${provider.name} com ${messages.length} mensagens`);
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simular resposta
        const mockResponse = {
            content: `Resposta simulada do ${provider.name} para a solicitação. Em uma implementação real, isso seria a resposta da API.`,
            tokens: Math.floor(Math.random() * 500) + 100,
            model: provider.model
        };

        return mockResponse;
    }

    // Obter métricas de uso
    public getUsageMetrics(): any {
        return {
            totalRequests: Array.from(this.rateLimiter.values()).reduce((sum, count) => sum + count, 0),
            conversationLength: this.context.getConversation().length,
            availableProviders: Object.keys(AI_PROVIDERS),
            rateLimitStatus: Object.fromEntries(this.rateLimiter.entries())
        };
    }

    // Limpar contexto
    public clearContext(): void {
        this.context.clearContext();
        this.setupDefaultContext();
    }
}

// Ferramentas MCP para integração com IA
export const aiIntegrationTools = {
    'ai-assistant': {
        name: 'ai-assistant',
        description: 'Assistente de IA geral para desenvolvimento',
        inputSchema: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'Prompt para o assistente' },
                model: { type: 'string', enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'copilot'] },
                temperature: { type: 'number', minimum: 0, maximum: 2 },
                maxTokens: { type: 'number', minimum: 1, maximum: 4000 }
            },
            required: ['prompt']
        },
        handler: async (args: any) => {
            return await AIIntegration.getInstance().aiAssistant(args);
        }
    },

    'analyze-code': {
        name: 'analyze-code',
        description: 'Análise de código com IA',
        inputSchema: {
            type: 'object',
            properties: {
                code: { type: 'string', description: 'Código a ser analisado' },
                language: { type: 'string', description: 'Linguagem do código' },
                analysisType: { type: 'string', enum: ['quality', 'security', 'performance', 'bugs', 'suggestions'] },
                fileName: { type: 'string' }
            },
            required: ['code', 'language', 'analysisType']
        },
        handler: async (args: any) => {
            return await AIIntegration.getInstance().analyzeCode(args);
        }
    },

    'generate-documentation': {
        name: 'generate-documentation',
        description: 'Gerar documentação com IA',
        inputSchema: {
            type: 'object',
            properties: {
                code: { type: 'string', description: 'Código para documentar' },
                language: { type: 'string', description: 'Linguagem do código' },
                style: { type: 'string', enum: ['jsdoc', 'markdown', 'inline', 'comprehensive'] },
                includeExamples: { type: 'boolean' }
            },
            required: ['code', 'language']
        },
        handler: async (args: any) => {
            return await AIIntegration.getInstance().generateDocumentation(args);
        }
    },

    'refactor-code': {
        name: 'refactor-code',
        description: 'Refatorar código com IA',
        inputSchema: {
            type: 'object',
            properties: {
                code: { type: 'string', description: 'Código a ser refatorado' },
                language: { type: 'string', description: 'Linguagem do código' },
                refactoringType: { type: 'string', enum: ['optimize', 'modernize', 'clean', 'extract-functions', 'improve-readability'] },
                targetVersion: { type: 'string' }
            },
            required: ['code', 'language', 'refactoringType']
        },
        handler: async (args: any) => {
            return await AIIntegration.getInstance().refactorCode(args);
        }
    }
};

export default AIIntegration; 