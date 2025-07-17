/**
 * 🤖 Classe Principal do Servidor MCP - Projeto Argos
 * 
 * Gerencia todas as funcionalidades do servidor MCP incluindo tools, resources e prompts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ReadResourceRequestSchema,
    ErrorCode,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from '../utils/logger.js';
import { validateToolInput } from '../utils/validation.js';
import { EchoTool } from '../tools/echo.js';
import { CalculatorTool } from '../tools/calculator.js';
import { FileReaderTool } from '../tools/fileReader.js';
import { SystemInfoTool } from '../tools/systemInfo.js';

export class MCPServer {
    private server: Server;
    private tools: Map<string, any>;
    private resources: Map<string, any>;

    constructor() {
        logger.info('🔧 Inicializando servidor MCP...');

        // Configurar servidor MCP
        this.server = new Server(
            {
                name: 'projeto-argos-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                },
            }
        );

        // Inicializar coleções
        this.tools = new Map();
        this.resources = new Map();

        // Configurar handlers
        this.setupToolHandlers();
        this.setupResourceHandlers();
        this.setupPromptHandlers();
        this.setupErrorHandling();

        // Registrar ferramentas
        this.registerTools();
        this.registerResources();

        logger.info('✅ Servidor MCP configurado');
    }

    /**
     * Configura os handlers de ferramentas
     */
    private setupToolHandlers(): void {
        // Lista todas as ferramentas disponíveis
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const toolList = Array.from(this.tools.values()).map(tool => ({
                name: tool.definition.name,
                description: tool.definition.description,
                inputSchema: tool.definition.inputSchema,
            }));

            logger.debug(`📋 Listando ${toolList.length} ferramentas disponíveis`);
            return { tools: toolList };
        });

        // Executa uma ferramenta específica
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            logger.info(`🔧 Executando ferramenta: ${name}`);

            try {
                const tool = this.tools.get(name);
                if (!tool) {
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Ferramenta não encontrada: ${name}`
                    );
                }

                // Validar entrada
                const validatedArgs = validateToolInput(tool.definition.inputSchema, args);

                // Executar ferramenta
                const result = await tool.execute(validatedArgs);

                logger.info(`✅ Ferramenta ${name} executada com sucesso`);
                return result;

            } catch (error) {
                logger.error(`❌ Erro ao executar ferramenta ${name}:`, error);
                
                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Erro interno na ferramenta ${name}: ${error.message}`
                );
            }
        });
    }

    /**
     * Configura os handlers de recursos
     */
    private setupResourceHandlers(): void {
        // Lista todos os recursos disponíveis
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resourceList = Array.from(this.resources.values()).map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType,
            }));

            logger.debug(`📚 Listando ${resourceList.length} recursos disponíveis`);
            return { resources: resourceList };
        });

        // Lê um recurso específico
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;

            logger.info(`📖 Lendo recurso: ${uri}`);

            try {
                const resource = this.resources.get(uri);
                if (!resource) {
                    throw new McpError(
                        ErrorCode.InvalidRequest,
                        `Recurso não encontrado: ${uri}`
                    );
                }

                const contents = await resource.read();
                
                logger.info(`✅ Recurso ${uri} lido com sucesso`);
                return { contents };

            } catch (error) {
                logger.error(`❌ Erro ao ler recurso ${uri}:`, error);
                
                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Erro interno ao ler recurso ${uri}: ${error.message}`
                );
            }
        });
    }

    /**
     * Configura os handlers de prompts
     */
    private setupPromptHandlers(): void {
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return { prompts: [] }; // Implementar prompts futuramente
        });

        this.server.setRequestHandler(GetPromptRequestSchema, async () => {
            throw new McpError(ErrorCode.MethodNotFound, 'Prompts não implementados ainda');
        });
    }

    /**
     * Configura tratamento de erros
     */
    private setupErrorHandling(): void {
        this.server.onerror = (error) => {
            logger.error('💥 Erro no servidor MCP:', error);
        };
    }

    /**
     * Registra todas as ferramentas disponíveis
     */
    private registerTools(): void {
        logger.info('🔧 Registrando ferramentas MCP...');

        const tools = [
            new EchoTool(),
            new CalculatorTool(),
            new FileReaderTool(),
            new SystemInfoTool(),
        ];

        for (const tool of tools) {
            this.tools.set(tool.definition.name, tool);
            logger.debug(`✅ Ferramenta registrada: ${tool.definition.name}`);
        }

        logger.info(`🎯 ${tools.length} ferramentas registradas com sucesso`);
    }

    /**
     * Registra todos os recursos disponíveis
     */
    private registerResources(): void {
        logger.info('📚 Registrando recursos MCP...');

        // Adicionar recursos básicos
        this.resources.set('argos://readme', {
            uri: 'argos://readme',
            name: 'README do Projeto',
            description: 'Documentação principal do Projeto Argos',
            mimeType: 'text/markdown',
            read: () => this.readProjectFile('README.md')
        });

        this.resources.set('argos://package', {
            uri: 'argos://package',
            name: 'Package.json',
            description: 'Configuração do projeto Node.js',
            mimeType: 'application/json',
            read: () => this.readProjectFile('package.json')
        });

        logger.info(`📖 ${this.resources.size} recursos registrados com sucesso`);
    }

    /**
     * Lê um arquivo do projeto
     */
    private async readProjectFile(filename: string): Promise<any[]> {
        try {
            const fs = await import('fs/promises');
            const content = await fs.readFile(filename, 'utf-8');
            
            return [{
                type: 'text',
                text: content
            }];
        } catch (error) {
            logger.error(`❌ Erro ao ler arquivo ${filename}:`, error);
            throw new Error(`Não foi possível ler o arquivo: ${filename}`);
        }
    }

    /**
     * Inicia o servidor MCP
     */
    async start(): Promise<void> {
        try {
            logger.info('🚀 Iniciando transporte stdio...');
            
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            
            logger.info('🎉 Servidor MCP rodando com transporte stdio');
            
        } catch (error) {
            logger.error('💥 Erro ao iniciar servidor MCP:', error);
            throw error;
        }
    }
} 