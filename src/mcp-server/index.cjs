#!/usr/bin/env node

/**
 * 🤖 Projeto Argos - MCP Server (Versão Corrigida)
 * 
 * Servidor MCP compatível com protocolo oficial
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Configuração do servidor
const SERVER_INFO = {
    name: 'projeto-argos-mcp',
    version: '1.0.0'
};

// Ferramentas disponíveis
const TOOLS = [
    {
        name: 'echo',
        description: 'Retorna exatamente a mensagem que foi enviada',
        inputSchema: {
            type: 'object',
            properties: {
                message: { 
                    type: 'string', 
                    description: 'A mensagem a ser ecoada' 
                }
            },
            required: ['message']
        }
    },
    {
        name: 'calculator',
        description: 'Realiza operações matemáticas básicas',
        inputSchema: {
            type: 'object',
            properties: {
                operation: { 
                    type: 'string', 
                    enum: ['add', 'subtract', 'multiply', 'divide'],
                    description: 'Operação matemática a ser realizada'
                },
                a: { 
                    type: 'number',
                    description: 'Primeiro número' 
                },
                b: { 
                    type: 'number',
                    description: 'Segundo número' 
                }
            },
            required: ['operation', 'a', 'b']
        }
    },
    {
        name: 'system_info',
        description: 'Obtém informações do sistema operacional',
        inputSchema: {
            type: 'object',
            properties: {
                detailed: { 
                    type: 'boolean', 
                    description: 'Se deve retornar informações detalhadas',
                    default: false 
                }
            }
        }
    },
    {
        name: 'read_file',
        description: 'Lê arquivos do projeto de forma segura',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { 
                    type: 'string', 
                    description: 'Caminho do arquivo a ser lido' 
                },
                encoding: { 
                    type: 'string', 
                    enum: ['utf-8', 'base64'],
                    description: 'Codificação do arquivo',
                    default: 'utf-8' 
                }
            },
            required: ['filePath']
        }
    }
];

// Arquivos permitidos para leitura
const ALLOWED_FILES = [
    'README.md',
    'package.json',
    'tsconfig.json',
    'src/mcp-server/README.md',
    'scratchpad.md',
    'memories.md',
    'lessons-learned.md'
];

// Função para log de debug
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
        console.error(logMessage, JSON.stringify(data, null, 2));
    } else {
        console.error(logMessage);
    }
}

// Handler para inicialização
function handleInitialize(request) {
    debugLog('Inicializando servidor MCP');
    
    return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {}
            },
            serverInfo: SERVER_INFO
        }
    };
}

// Handler para listagem de ferramentas
function handleListTools(request) {
    debugLog('Listando ferramentas disponíveis');
    
    return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
            tools: TOOLS
        }
    };
}

// Handler para execução de ferramentas
function handleCallTool(request) {
    const { name, arguments: args } = request.params;
    
    debugLog(`Executando ferramenta: ${name}`, args);
    
    try {
        let result;
        
        switch (name) {
            case 'echo':
                result = {
                    content: [{
                        type: 'text',
                        text: args.message
                    }]
                };
                break;
                
            case 'calculator':
                const { operation, a, b } = args;
                let calcResult;
                let symbol;
                
                switch (operation) {
                    case 'add': calcResult = a + b; symbol = '+'; break;
                    case 'subtract': calcResult = a - b; symbol = '-'; break;
                    case 'multiply': calcResult = a * b; symbol = '×'; break;
                    case 'divide': 
                        if (b === 0) throw new Error('Divisão por zero não é permitida');
                        calcResult = a / b; 
                        symbol = '÷'; 
                        break;
                    default: 
                        throw new Error(`Operação inválida: ${operation}`);
                }
                
                result = {
                    content: [{
                        type: 'text',
                        text: `📊 **Resultado**: ${a} ${symbol} ${b} = ${calcResult}`
                    }]
                };
                break;
                
            case 'system_info':
                const detailed = args.detailed || false;
                let info = `🖥️ **Sistema**: ${os.platform()}\n`;
                info += `**Arquitetura**: ${os.arch()}\n`;
                info += `**Node.js**: ${process.version}\n`;
                
                if (detailed) {
                    info += `**Memória Total**: ${Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100} GB\n`;
                    info += `**CPUs**: ${os.cpus().length} núcleos\n`;
                    info += `**Uptime**: ${Math.round(os.uptime() / 3600 * 100) / 100} horas\n`;
                    info += `**Diretório**: ${process.cwd()}\n`;
                }
                
                result = {
                    content: [{
                        type: 'text',
                        text: info
                    }]
                };
                break;
                
            case 'read_file':
                const { filePath, encoding = 'utf-8' } = args;
                
                try {
                    // Normalizar caminho
                    const normalizedPath = path.normalize(filePath);
                    
                    // Verificar se é permitido
                    if (!ALLOWED_FILES.includes(normalizedPath)) {
                        throw new Error(`Arquivo não permitido: ${normalizedPath}\n\nArquivos disponíveis:\n${ALLOWED_FILES.map(f => `• ${f}`).join('\n')}`);
                    }
                    
                    // Verificar se arquivo existe
                    if (!fs.existsSync(normalizedPath)) {
                        throw new Error(`Arquivo não encontrado: ${normalizedPath}`);
                    }
                    
                    // Ler arquivo
                    const content = fs.readFileSync(normalizedPath, encoding);
                    
                    result = {
                        content: [{
                            type: 'text',
                            text: `📄 **Arquivo**: ${filePath}\n\n\`\`\`\n${content}\n\`\`\``
                        }]
                    };
                    
                } catch (error) {
                    result = {
                        content: [{
                            type: 'text',
                            text: `❌ **Erro**: ${error.message}`
                        }]
                    };
                }
                break;
                
            default:
                throw new Error(`Ferramenta não encontrada: ${name}`);
        }
        
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: result
        };
        
    } catch (error) {
        debugLog(`Erro na ferramenta ${name}:`, error.message);
        
        return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
                code: -32000,
                message: error.message
            }
        };
    }
}

// Processador principal de mensagens
function processMessage(message) {
    try {
        const request = JSON.parse(message);
        debugLog(`Recebida requisição: ${request.method}`);
        
        let response;
        
        switch (request.method) {
            case 'initialize':
                response = handleInitialize(request);
                break;
                
            case 'tools/list':
                response = handleListTools(request);
                break;
                
            case 'tools/call':
                response = handleCallTool(request);
                break;
                
            default:
                response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    error: {
                        code: -32601,
                        message: `Método não suportado: ${request.method}`
                    }
                };
        }
        
        return JSON.stringify(response);
        
    } catch (error) {
        debugLog('Erro ao processar mensagem:', error.message);
        
        return JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -32700,
                message: 'Erro de parsing JSON'
            }
        });
    }
}

// Configuração do servidor
function startServer() {
    debugLog('🚀 Iniciando Projeto Argos MCP Server...');
    debugLog(`📋 Ferramentas disponíveis: ${TOOLS.map(t => t.name).join(', ')}`);
    
    // Configurar stdin
    process.stdin.setEncoding('utf-8');
    process.stdin.resume();
    
    // Buffer para mensagens incompletas
    let buffer = '';
    
    process.stdin.on('data', (data) => {
        buffer += data;
        
        // Processar todas as mensagens completas no buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Manter a última linha incompleta
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
                const response = processMessage(trimmed);
                console.log(response);
            }
        }
    });
    
    process.stdin.on('end', () => {
        debugLog('💔 Conexão stdin encerrada');
        process.exit(0);
    });
    
    process.stdin.on('error', (error) => {
        debugLog('❌ Erro na stdin:', error.message);
        process.exit(1);
    });
    
    // Manter o processo vivo
    process.on('SIGINT', () => {
        debugLog('🛑 Recebido SIGINT, encerrando servidor...');
        process.exit(0);
    });
    
    debugLog('✅ Servidor MCP iniciado e aguardando conexões...');
}

// Iniciar servidor
startServer(); 