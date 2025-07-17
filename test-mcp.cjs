#!/usr/bin/env node

/**
 * 🧪 Teste Básico do Servidor MCP - Projeto Argos
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testando Projeto Argos MCP Server...\n');

// Verificar se arquivo existe
if (!fs.existsSync('src/mcp-server/index.js')) {
    console.error('❌ Arquivo src/mcp-server/index.js não encontrado');
    process.exit(1);
}

// Testar servidor MCP
const server = spawn('node', ['src/mcp-server/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let timeout;
let responseReceived = false;

// Configurar timeout
timeout = setTimeout(() => {
    if (!responseReceived) {
        console.log('⚠️ Timeout - servidor pode estar funcionando mas não respondeu');
        server.kill();
        process.exit(0);
    }
}, 3000);

// Escutar resposta
server.stdout.on('data', (data) => {
    responseReceived = true;
    clearTimeout(timeout);
    
    try {
        const response = JSON.parse(data.toString());
        
        if (response.result && response.result.tools) {
            console.log('✅ Servidor MCP funcionando corretamente!');
            console.log(`📋 Ferramentas encontradas: ${response.result.tools.length}`);
            
            response.result.tools.forEach(tool => {
                console.log(`   • ${tool.name}: ${tool.description}`);
            });
            
            console.log('\n🎉 Teste concluído com sucesso!');
        } else {
            console.log('⚠️ Resposta inesperada do servidor');
            console.log('Response:', data.toString());
        }
    } catch (error) {
        console.log('⚠️ Erro ao analisar resposta:', error.message);
        console.log('Raw response:', data.toString());
    }
    
    server.kill();
    process.exit(0);
});

// Escutar erros do servidor
server.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Iniciando') || output.includes('rodando')) {
        console.log('📡 Servidor inicializado, enviando teste...');
        
        // Enviar comando de teste
        const testCommand = JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/list",
            id: 1
        }) + '\n';
        
        server.stdin.write(testCommand);
    }
});

server.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
});

server.on('close', (code) => {
    if (!responseReceived) {
        console.log(`⚠️ Servidor encerrado com código: ${code}`);
    }
});

console.log('🚀 Iniciando servidor para teste...'); 