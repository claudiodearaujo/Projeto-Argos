import { MCPServer } from './MCPServer.js';
import { logger } from '../utils/logger.js';

// Tipos básicos para HTTP
interface SimpleRequest {
    method?: string;
    url?: string;
    headers?: any;
    body?: any;
    query?: Record<string, string>;
}

interface SimpleResponse {
    writeHead: (statusCode: number, headers?: any) => void;
    end: (data?: string) => void;
    write: (data: string) => void;
}

// Servidor HTTP simplificado
export class SimpleHttpServer {
    private mcpServer: MCPServer;
    private port: number;
    private server: any;

    constructor(port: number = 3000) {
        this.mcpServer = new MCPServer();
        this.port = port;
    }

    private async handleRequest(req: any, res: any): Promise<void> {
        // Headers CORS básicos
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        });

        // Responder OPTIONS
        if (req.method === 'OPTIONS') {
            res.end();
            return;
        }

        try {
            // Parse da URL básico
            const urlParts = (req.url || '').split('?');
            const pathname = urlParts[0];
            const queryString = urlParts[1] || '';
            
            // Parse query string simples
            const query: Record<string, string> = {};
            if (queryString) {
                queryString.split('&').forEach((pair: string) => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        query[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });
            }

            // Parse do body para POST/PUT
            if (req.method === 'POST' || req.method === 'PUT') {
                req.body = await this.parseBody(req);
            }

            // Log da requisição
            logger.info(`[HTTP] ${req.method} ${pathname}`, { query });

            // Roteamento
            await this.route(req, res, pathname, query);

        } catch (error) {
            logger.error('[HTTP] Erro ao processar requisição:', error);
            this.sendError(res, 500, 'Erro interno do servidor');
        }
    }

    private async parseBody(req: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk: any) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (error) {
                    resolve({});
                }
            });
            req.on('error', () => resolve({}));
        });
    }

    private async route(req: any, res: any, pathname: string, query: any): Promise<void> {
        try {
            // Health check
            if (pathname === '/health' && req.method === 'GET') {
                await this.handleHealthCheck(req, res, query);
                return;
            }

            // API para listar ferramentas
            if (pathname === '/api/tools' && req.method === 'GET') {
                await this.handleListTools(req, res);
                return;
            }

            // API para executar ferramentas - pattern matching simples
            if (pathname.startsWith('/api/tools/') && pathname.endsWith('/execute') && req.method === 'POST') {
                const toolName = pathname.split('/')[3]; // /api/tools/{toolName}/execute
                await this.handleExecuteTool(req, res, toolName);
                return;
            }

            // API para métricas
            if (pathname === '/api/metrics' && req.method === 'GET') {
                await this.handleMetrics(req, res);
                return;
            }

            // API para status
            if (pathname === '/api/status' && req.method === 'GET') {
                await this.handleStatus(req, res);
                return;
            }

            // Rota não encontrada
            this.sendError(res, 404, 'Endpoint não encontrado');

        } catch (error) {
            logger.error('[HTTP] Erro no roteamento:', error);
            this.sendError(res, 500, 'Erro interno do servidor');
        }
    }

    private async handleHealthCheck(req: any, res: any, query: any): Promise<void> {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: query.service || 'argos-mcp-server',
                version: '1.1.0',
                uptime: Math.floor(Date.now() / 1000), // Uptime simples
                environment: 'development'
            };
            
            this.sendJSON(res, 200, health);
        } catch (error) {
            logger.error('[HTTP] Erro no health check:', error);
            this.sendError(res, 500, 'Erro no health check');
        }
    }

    private async handleListTools(req: any, res: any): Promise<void> {
        try {
            // Lista simples de ferramentas disponíveis
            const tools = [
                { name: 'echo', description: 'Retorna a mensagem enviada' },
                { name: 'calculator', description: 'Realiza operações matemáticas' },
                { name: 'system_info', description: 'Informações do sistema' },
                { name: 'read_file', description: 'Lê arquivos do projeto' }
            ];
            
            this.sendJSON(res, 200, {
                success: true,
                data: tools,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('[HTTP] Erro ao listar ferramentas:', error);
            this.sendError(res, 500, 'Erro ao listar ferramentas');
        }
    }

    private async handleExecuteTool(req: any, res: any, toolName: string): Promise<void> {
        try {
            logger.info(`[HTTP] Executando ferramenta: ${toolName}`, { arguments: req.body });
            
            // Simulação de execução de ferramenta
            const result = {
                tool: toolName,
                arguments: req.body || {},
                result: `Ferramenta ${toolName} executada com sucesso`,
                timestamp: new Date().toISOString()
            };
            
            this.sendJSON(res, 200, {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
                tool: toolName
            });
        } catch (error) {
            logger.error(`[HTTP] Erro ao executar ferramenta ${toolName}:`, error);
            this.sendError(res, 400, `Erro ao executar ferramenta ${toolName}`);
        }
    }

    private async handleMetrics(req: any, res: any): Promise<void> {
        try {
            const metrics = {
                server: {
                    uptime: Math.floor(Date.now() / 1000),
                    memory: { used: 0, total: 0 }, // Simplificado
                    version: '1.1.0'
                },
                tools: {
                    totalCalls: 0,
                    successRate: 100
                },
                timestamp: new Date().toISOString()
            };
            
            this.sendJSON(res, 200, metrics);
        } catch (error) {
            logger.error('[HTTP] Erro ao coletar métricas:', error);
            this.sendError(res, 500, 'Erro ao coletar métricas');
        }
    }

    private async handleStatus(req: any, res: any): Promise<void> {
        try {
            const status = {
                server: 'running',
                mcp: 'active',
                timestamp: new Date().toISOString(),
                version: '1.1.0'
            };
            
            this.sendJSON(res, 200, status);
        } catch (error) {
            logger.error('[HTTP] Erro ao obter status:', error);
            this.sendError(res, 500, 'Erro ao obter status');
        }
    }

    private sendJSON(res: any, statusCode: number, data: any): void {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }

    private sendError(res: any, statusCode: number, message: string): void {
        this.sendJSON(res, statusCode, {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Usar import dinâmico para contornar problemas de tipos
                import('http').then(http => {
                    this.server = http.createServer(this.handleRequest.bind(this));
                    
                    this.server.listen(this.port, () => {
                        logger.info(`🚀 Servidor HTTP Argos iniciado na porta ${this.port}`, {
                            port: this.port,
                            version: '1.1.0'
                        });
                        resolve();
                    });

                    this.server.on('error', (error: Error) => {
                        logger.error('[HTTP] Erro no servidor:', error);
                        reject(error);
                    });
                }).catch(error => {
                    logger.error('[HTTP] Erro ao importar módulo http:', error);
                    reject(error);
                });
            } catch (error) {
                logger.error('[HTTP] Erro ao iniciar servidor:', error);
                reject(error);
            }
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((error?: Error) => {
                    if (error) {
                        logger.error('[HTTP] Erro ao parar servidor:', error);
                        reject(error);
                    } else {
                        logger.info('[HTTP] Servidor parado com sucesso');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

export default SimpleHttpServer; 