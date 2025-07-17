// Script de teste para servidor HTTP simples
const http = require('http');

console.log('🧪 Testando funcionalidade básica do servidor HTTP...');

const server = http.createServer((req, res) => {
    // Headers CORS
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    });

    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }

    // Parse URL simples
    const url = new URL(req.url, `http://localhost:3000`);
    const pathname = url.pathname;

    console.log(`📥 Requisição: ${req.method} ${pathname}`);

    // Rotas de teste
    if (pathname === '/health') {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'argos-test-server',
            version: '1.1.0'
        };
        res.end(JSON.stringify(health, null, 2));
        return;
    }

    if (pathname === '/api/tools') {
        const tools = {
            success: true,
            data: [
                { name: 'echo', description: 'Echo tool' },
                { name: 'calculator', description: 'Math operations' },
                { name: 'system_info', description: 'System information' },
                { name: 'read_file', description: 'File reader' }
            ],
            timestamp: new Date().toISOString()
        };
        res.end(JSON.stringify(tools, null, 2));
        return;
    }

    if (pathname === '/api/status') {
        const status = {
            server: 'running',
            mcp: 'active',
            timestamp: new Date().toISOString(),
            version: '1.1.0'
        };
        res.end(JSON.stringify(status, null, 2));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: 'Endpoint não encontrado',
        path: pathname,
        timestamp: new Date().toISOString()
    }, null, 2));
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor de teste iniciado na porta ${PORT}`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/api/tools`);
    console.log(`   GET  http://localhost:${PORT}/api/status`);
    console.log('');
    console.log('✅ Teste do servidor HTTP funcionando!');
    console.log('⚠️  Os erros de TypeScript não impedem a execução.');
    console.log('');
    console.log('💡 Para resolver os erros de tipos:');
    console.log('   npm install @types/node --save-dev');
    console.log('   (quando o npm estiver funcionando)');
});

server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    server.close(() => {
        console.log('✅ Servidor parado com sucesso');
        process.exit(0);
    });
});

console.log('ℹ️  Use Ctrl+C para parar o servidor'); 