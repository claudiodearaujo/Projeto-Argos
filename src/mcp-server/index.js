#!/usr/bin/env node

/**
 * 🤖 Projeto Argos - MCP Server (JavaScript Version)
 * 
 * Versão simplificada para testes iniciais
 */

console.error('🚀 Iniciando Projeto Argos MCP Server...');

// Simulação básica de servidor MCP
const server = {
    tools: new Map([
        ['echo', {
            name: 'echo',
            description: 'Retorna exatamente a mensagem que foi enviada',
            inputSchema: {
                type: 'object',
                properties: {
                    message: { type: 'string', description: 'A mensagem a ser ecoada' }
                },
                required: ['message']
            }
        }],
        ['calculator', {
            name: 'calculator',
            description: 'Realiza operações matemáticas básicas',
            inputSchema: {
                type: 'object',
                properties: {
                    operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                required: ['operation', 'a', 'b']
            }
        }],
        ['system_info', {
            name: 'system_info',
            description: 'Obtém informações do sistema',
            inputSchema: {
                type: 'object',
                properties: {
                    detailed: { type: 'boolean', default: false }
                }
            }
        }]
    ])
};

// Handler para listagem de ferramentas
function handleListTools() {
    const tools = Array.from(server.tools.values());
    return {
        jsonrpc: '2.0',
        result: { tools }
    };
}

// Handler para execução de ferramentas
function handleCallTool(params) {
    const { name, arguments: args } = params;
    
    console.error(`🔧 Executando ferramenta: ${name}`);
    
    switch (name) {
        case 'echo':
            return {
                jsonrpc: '2.0',
                result: {
                    content: [{ type: 'text', text: args.message }]
                }
            };
            
        case 'calculator':
            const { operation, a, b } = args;
            let result;
            let symbol;
            
            switch (operation) {
                case 'add': result = a + b; symbol = '+'; break;
                case 'subtract': result = a - b; symbol = '-'; break;
                case 'multiply': result = a * b; symbol = '×'; break;
                case 'divide': 
                    if (b === 0) throw new Error('Divisão por zero');
                    result = a / b; symbol = '÷'; break;
                default: throw new Error(`Operação inválida: ${operation}`);
            }
            
            return {
                jsonrpc: '2.0',
                result: {
                    content: [{ 
                        type: 'text', 
                        text: `📊 **Cálculo**: ${a} ${symbol} ${b} = ${result}` 
                    }]
                }
            };
            
        case 'system_info':
            const os = require('os');
            const detailed = args.detailed || false;
            
            let info = `🖥️ **Sistema**: ${os.platform()}\n`;
            info += `**Arquitetura**: ${os.arch()}\n`;
            info += `**Node.js**: ${process.version}\n`;
            
            if (detailed) {
                info += `**Memória Total**: ${Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100} GB\n`;
                info += `**CPUs**: ${os.cpus().length} núcleos\n`;
            }
            
            return {
                jsonrpc: '2.0',
                result: {
                    content: [{ type: 'text', text: info }]
                }
            };
            
        default:
            throw new Error(`Ferramenta não encontrada: ${name}`);
    }
}

// Processamento de mensagens via stdio
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (data) => {
    try {
        const lines = data.trim().split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const request = JSON.parse(line);
            console.error(`📨 Recebido: ${request.method}`);
            
            let response;
            
            switch (request.method) {
                case 'tools/list':
                    response = { ...handleListTools(), id: request.id };
                    break;
                    
                case 'tools/call':
                    response = { ...handleCallTool(request.params), id: request.id };
                    break;
                    
                case 'initialize':
                    response = {
                        jsonrpc: '2.0',
                        result: {
                            capabilities: {
                                tools: {}
                            },
                            serverInfo: {
                                name: 'projeto-argos-mcp',
                                version: '1.0.0'
                            }
                        },
                        id: request.id
                    };
                    break;
                    
                default:
                    response = {
                        jsonrpc: '2.0',
                        error: {
                            code: -32601,
                            message: `Método não encontrado: ${request.method}`
                        },
                        id: request.id
                    };
            }
            
            console.log(JSON.stringify(response));
        }
        
    } catch (error) {
        console.error(`❌ Erro ao processar mensagem:`, error.message);
        
        const errorResponse = {
            jsonrpc: '2.0',
            error: {
                code: -32700,
                message: 'Erro de parsing'
            },
            id: null
        };
        
        console.log(JSON.stringify(errorResponse));
    }
});

console.error('✅ Servidor MCP rodando via stdio');
console.error('📋 Ferramentas disponíveis:', Array.from(server.tools.keys()).join(', '));

// Manter o processo vivo
process.stdin.resume(); 