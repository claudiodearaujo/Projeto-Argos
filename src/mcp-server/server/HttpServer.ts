import * as http from 'http';
import * as url from 'url';
import { MCPServer } from './MCPServer.js';
import { logger } from '../utils/logger.js';

// Interface estendida para requisições HTTP
interface HttpRequest extends http.IncomingMessage {
    body?: any;
    params?: { [key: string]: string };
    query?: { [key: string]: string };
}

export class HttpServer {
    private server: any;
    private mcpServer: MCPServer;
    private port: number;

    constructor(port: number = 3000) {
        this.mcpServer = new MCPServer();
        this.port = port;
        this.server = createServer(this.handleRequest.bind(this));
    }

    private async handleRequest(req: HttpRequest, res: ServerResponse): Promise<void> {
        // Configurar headers CORS básicos
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
        res.setHeader('Content-Type', 'application/json');

        // Responder OPTIONS para preflight CORS
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            // Parse da URL
            const parsedUrl = new URL(req.url || '', `http://localhost:${this.port}`);
            const pathname = parsedUrl.pathname;
            const query = Object.fromEntries(parsedUrl.searchParams);

            // Parse do body para requisições POST/PUT
            if (req.method === 'POST' || req.method === 'PUT') {
                req.body = await this.parseBody(req);
            }

            // Gerar request ID para logging
            const requestId = (req.headers && req.headers['x-request-id']) || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            logger.info(`[${requestId}] ${req.method} ${pathname}`, {
                method: req.method,
                url: pathname,
                query,
                ip: req.socket && req.socket.remoteAddress
            });

            // Roteamento
            await this.route(req, res, pathname, query, requestId);

        } catch (error) {
            logger.error('Erro ao processar requisição:', error);
            this.sendError(res, 500, 'Erro interno do servidor');
        }
    }

    private async parseBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (error) {
                    reject(new Error('JSON inválido'));
                }
            });
            req.on('error', reject);
        });
    }

    private async route(req: HttpRequest, res: ServerResponse, pathname: string, query: any, requestId: string): Promise<void> {
        try {
            // Health check endpoint
            if (pathname === '/health' && req.method === 'GET') {
                await this.handleHealthCheck(req, res, query);
                return;
            }

            // API para listar ferramentas
            if (pathname === '/api/tools' && req.method === 'GET') {
                await this.handleListTools(req, res);
                return;
            }

            // API para executar ferramentas
            const toolExecuteMatch = pathname.match(/^\/api\/tools\/([^\/]+)\/execute$/);
            if (toolExecuteMatch && req.method === 'POST') {
                const toolName = toolExecuteMatch[1];
                await this.handleExecuteTool(req, res, toolName);
                return;
            }

            // API para métricas
            if (pathname === '/api/metrics' && req.method === 'GET') {
                await this.handleMetrics(req, res);
                return;
            }

            // API para documentação
            if (pathname === '/api/docs' && req.method === 'GET') {
                await this.handleDocs(req, res);
                return;
            }

            // API para status
            if (pathname === '/api/status' && req.method === 'GET') {
                await this.handleStatus(req, res);
                return;
            }

            // Rota não encontrada
            logger.warn(`Rota não encontrada: ${req.method} ${pathname}`);
            this.sendError(res, 404, 'Endpoint não encontrado');

        } catch (error) {
            logger.error(`Erro no roteamento:`, error);
            this.sendError(res, 500, 'Erro interno do servidor');
        }
    }

    private async handleHealthCheck(req: HttpRequest, res: ServerResponse, query: any): Promise<void> {
        try {
            const validQuery = validateToolInput(HealthCheckSchema, query);
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: validQuery.service || 'argos-mcp-server',
                version: '1.1.0',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development'
            };
            
            logger.info('Health check realizado com sucesso', health);
            this.sendJSON(res, 200, health);
        } catch (error) {
            logger.error('Erro no health check:', error);
            this.sendError(res, 500, 'Erro no health check');
        }
    }

    private async handleListTools(req: HttpRequest, res: ServerResponse): Promise<void> {
        try {
            const tools = await this.mcpServer.listTools();
            logger.info('Ferramentas listadas com sucesso', { count: tools.length });
            this.sendJSON(res, 200, {
                success: true,
                data: tools,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Erro ao listar ferramentas:', error);
            this.sendError(res, 500, 'Erro ao listar ferramentas');
        }
    }

    private async handleExecuteTool(req: HttpRequest, res: ServerResponse, toolName: string): Promise<void> {
        try {
            const body = validateToolInput(ToolCallSchema, { name: toolName, arguments: req.body });
            
            logger.info(`Executando ferramenta: ${toolName}`, { arguments: body.arguments });
            
            const result = await this.mcpServer.callTool(toolName, body.arguments || {});
            
            logger.info(`Ferramenta ${toolName} executada com sucesso`);
            this.sendJSON(res, 200, {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
                tool: toolName
            });
        } catch (error) {
            logger.error(`Erro ao executar ferramenta ${toolName}:`, error);
            this.sendError(res, 400, `Erro ao executar ferramenta ${toolName}`);
        }
    }

    private async handleMetrics(req: HttpRequest, res: ServerResponse): Promise<void> {
        try {
            const metrics = {
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    version: '1.1.0'
                },
                tools: await this.mcpServer.getToolMetrics(),
                timestamp: new Date().toISOString()
            };
            
            logger.info('Métricas coletadas com sucesso');
            this.sendJSON(res, 200, metrics);
        } catch (error) {
            logger.error('Erro ao coletar métricas:', error);
            this.sendError(res, 500, 'Erro ao coletar métricas');
        }
    }

    private async handleDocs(req: HttpRequest, res: ServerResponse): Promise<void> {
        try {
            const docs = await this.mcpServer.getToolDocumentation();
            logger.info('Documentação gerada dinamicamente');
            this.sendJSON(res, 200, {
                success: true,
                data: docs,
                timestamp: new Date().toISOString(),
                version: '1.1.0'
            });
        } catch (error) {
            logger.error('Erro ao gerar documentação:', error);
            this.sendError(res, 500, 'Erro ao gerar documentação');
        }
    }

    private async handleStatus(req: HttpRequest, res: ServerResponse): Promise<void> {
        try {
            const status = {
                server: 'running',
                mcp: await this.mcpServer.getStatus(),
                timestamp: new Date().toISOString(),
                version: '1.1.0'
            };
            
            this.sendJSON(res, 200, status);
        } catch (error) {
            logger.error('Erro ao obter status:', error);
            this.sendError(res, 500, 'Erro ao obter status');
        }
    }

    private sendJSON(res: ServerResponse, statusCode: number, data: any): void {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }

    private sendError(res: ServerResponse, statusCode: number, message: string): void {
        this.sendJSON(res, statusCode, {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    logger.info(`🚀 Servidor HTTP Argos iniciado na porta ${this.port}`, {
                        port: this.port,
                        environment: process.env.NODE_ENV || 'development',
                        version: '1.1.0'
                    });
                    resolve();
                });

                this.server.on('error', (error: Error) => {
                    logger.error('Erro no servidor HTTP:', error);
                    reject(error);
                });
            } catch (error) {
                logger.error('Erro ao iniciar servidor HTTP:', error);
                reject(error);
            }
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((error?: Error) => {
                    if (error) {
                        logger.error('Erro ao parar servidor HTTP:', error);
                        reject(error);
                    } else {
                        logger.info('Servidor HTTP parado com sucesso');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

export default HttpServer; 