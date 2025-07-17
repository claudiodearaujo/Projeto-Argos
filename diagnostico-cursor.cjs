#!/usr/bin/env node

/**
 * 🔍 Diagnóstico Completo - Cursor IDE MCP
 * 
 * Identifica problemas específicos do Cursor IDE com MCP
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🔍 DIAGNÓSTICO COMPLETO - CURSOR IDE MCP\n');

// 1. Verificar ambiente básico
console.log('📋 1. VERIFICANDO AMBIENTE BÁSICO');
console.log('================================');

try {
    const nodeVersion = process.version;
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    const nodePath = execSync('where node', { encoding: 'utf-8' }).trim();
    console.log(`✅ Caminho Node.js: ${nodePath}`);
} catch (error) {
    console.log(`❌ Problema com Node.js: ${error.message}`);
}

console.log(`✅ Sistema: ${os.platform()} ${os.arch()}`);
console.log(`✅ Diretório atual: ${process.cwd()}`);

// 2. Verificar arquivos MCP
console.log('\n📁 2. VERIFICANDO ARQUIVOS MCP');
console.log('==============================');

const mcpServerPath = 'src/mcp-server/index.cjs';
if (fs.existsSync(mcpServerPath)) {
    const stats = fs.statSync(mcpServerPath);
    console.log(`✅ Servidor MCP existe: ${mcpServerPath}`);
    console.log(`   Tamanho: ${stats.size} bytes`);
    console.log(`   Modificado: ${stats.mtime}`);
} else {
    console.log(`❌ Servidor MCP NÃO existe: ${mcpServerPath}`);
}

// 3. Testar servidor MCP
console.log('\n🧪 3. TESTANDO SERVIDOR MCP');
console.log('==========================');

try {
    console.log('Executando teste básico...');
    const result = execSync('node test-mcp.cjs', { encoding: 'utf-8', timeout: 10000 });
    
    if (result.includes('funcionando corretamente')) {
        console.log('✅ Servidor MCP funcionando');
    } else {
        console.log('⚠️ Resposta inesperada do servidor');
        console.log('Saída:', result.substring(0, 200));
    }
} catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
}

// 4. Verificar configurações do Cursor
console.log('\n⚙️ 4. VERIFICANDO CONFIGURAÇÕES CURSOR');
console.log('=====================================');

const cursorPaths = [
    '.cursor/mcp.json',
    path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
];

let configFound = false;
for (const configPath of cursorPaths) {
    if (fs.existsSync(configPath)) {
        console.log(`✅ Configuração encontrada: ${configPath}`);
        
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            console.log('   Conteúdo:', JSON.stringify(config, null, 2));
            configFound = true;
        } catch (error) {
            console.log(`   ❌ Erro ao ler configuração: ${error.message}`);
        }
    } else {
        console.log(`❌ Não encontrado: ${configPath}`);
    }
}

// 5. Testar comando exato do Cursor
console.log('\n🎯 5. TESTANDO COMANDO EXATO DO CURSOR');
console.log('=====================================');

const projectPath = process.cwd().replace(/\\/g, '/');
const testCommand = `node "${projectPath}/src/mcp-server/index.cjs"`;

console.log(`Comando que o Cursor executaria: ${testCommand}`);

try {
    // Testar se o comando pode ser executado
    const child = require('child_process').spawn('node', [path.join(projectPath, 'src/mcp-server/index.cjs')], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let hasOutput = false;
    
    child.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Iniciando') || output.includes('rodando')) {
            console.log('✅ Servidor iniciou corretamente');
            hasOutput = true;
        }
    });
    
    // Enviar comando de teste
    setTimeout(() => {
        const testMsg = JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/list",
            id: 1
        }) + '\n';
        
        child.stdin.write(testMsg);
    }, 1000);
    
    child.stdout.on('data', (data) => {
        try {
            const response = JSON.parse(data.toString());
            if (response.result && response.result.tools) {
                console.log(`✅ Resposta válida com ${response.result.tools.length} ferramentas`);
                hasOutput = true;
            }
        } catch (e) {
            // Ignorar erros de parsing
        }
    });
    
    setTimeout(() => {
        child.kill();
        if (!hasOutput) {
            console.log('⚠️ Servidor não respondeu no tempo esperado');
        }
    }, 3000);
    
} catch (error) {
    console.log(`❌ Erro ao executar comando: ${error.message}`);
}

// 6. Sugestões específicas
console.log('\n💡 6. SOLUÇÕES RECOMENDADAS');
console.log('==========================');

console.log('Para resolver o problema "0 tools enabled":');
console.log('');
console.log('A) USAR CAMINHO ABSOLUTO COMPLETO:');
console.log('   Edite .cursor/mcp.json e use:');
console.log(`   "args": ["${projectPath}/src/mcp-server/index.cjs"]`);
console.log('');
console.log('B) TESTAR CAMINHO DO NODE.JS:');
console.log('   Se não funcionar, use caminho completo do Node:');
try {
    const nodePath = execSync('where node', { encoding: 'utf-8' }).trim().split('\n')[0];
    console.log(`   "command": "${nodePath}"`);
} catch (e) {
    console.log('   "command": "C:/Program Files/nodejs/node.exe"');
}
console.log('');
console.log('C) VERIFICAR LOGS DO CURSOR:');
console.log('   1. Abra Cursor IDE');
console.log('   2. Help → Toggle Developer Tools');
console.log('   3. Vá para aba Console');
console.log('   4. Procure por erros relacionados a MCP');
console.log('');
console.log('D) CONFIGURAÇÃO ALTERNATIVA:');
console.log('   Se nada funcionar, tente criar em:');
console.log(`   ${path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json')}`);
console.log('   Com formato:');
console.log('   {"mcp": {"servers": {"projeto-argos-mcp": {...}}}}');

console.log('\n🎯 PRÓXIMOS PASSOS IMEDIATOS:');
console.log('1. Copie uma das configurações sugeridas acima');
console.log('2. Cole no arquivo .cursor/mcp.json');
console.log('3. Reinicie completamente o Cursor IDE');
console.log('4. Verifique se aparece "tools enabled" > 0');

console.log('\n📞 Se ainda não funcionar:');
console.log('- Verifique se a extensão Claude/Cline está atualizada');
console.log('- Tente executar Cursor como administrador');
console.log('- Verifique se há antivírus bloqueando');

console.log('\n✅ Diagnóstico concluído!'); 