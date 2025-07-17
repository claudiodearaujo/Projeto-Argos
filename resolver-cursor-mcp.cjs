#!/usr/bin/env node

/**
 * 🔧 Resolver Problema Cursor MCP - Limpar Conflitos
 * 
 * Remove configurações conflitantes e cria UMA configuração correta
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 RESOLVENDO CONFLITOS DE CONFIGURAÇÃO MCP\n');

// Configurações encontradas pelo diagnóstico
const configPaths = [
    '.cursor/mcp.json',
    path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
];

// 1. Backup das configurações existentes
console.log('📋 1. FAZENDO BACKUP DAS CONFIGURAÇÕES EXISTENTES');
console.log('=================================================');

for (let i = 0; i < configPaths.length; i++) {
    const configPath = configPaths[i];
    if (fs.existsSync(configPath)) {
        const backupPath = `${configPath}.backup-${Date.now()}`;
        try {
            fs.copyFileSync(configPath, backupPath);
            console.log(`✅ Backup criado: ${backupPath}`);
        } catch (error) {
            console.log(`⚠️ Erro no backup de ${configPath}: ${error.message}`);
        }
    }
}

// 2. Limpar configurações antigas
console.log('\n🧹 2. LIMPANDO CONFIGURAÇÕES CONFLITANTES');
console.log('==========================================');

// Remover .cursor/mcp.json (usa caminho relativo)
if (fs.existsSync('.cursor/mcp.json')) {
    try {
        fs.unlinkSync('.cursor/mcp.json');
        console.log('✅ Removido: .cursor/mcp.json (caminho relativo conflitante)');
    } catch (error) {
        console.log(`⚠️ Erro ao remover .cursor/mcp.json: ${error.message}`);
    }
}

// 3. Criar APENAS uma configuração correta
console.log('\n✨ 3. CRIANDO CONFIGURAÇÃO ÚNICA E CORRETA');
console.log('==========================================');

const projectPath = process.cwd().replace(/\\/g, '/');
const correctConfig = {
    mcpServers: {
        "projeto-argos-mcp": {
            command: "C:/Program Files/nodejs/node.exe", // Caminho absoluto do Node
            args: [`${projectPath}/src/mcp-server/index.cjs`], // Caminho absoluto do servidor
            env: {
                LOG_LEVEL: "info"
            }
        }
    }
};

// Usar configuração principal do Cursor
const mainConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');

try {
    // Criar diretório se não existir
    const configDir = path.dirname(mainConfigPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(`📁 Diretório criado: ${configDir}`);
    }
    
    // Escrever configuração única
    fs.writeFileSync(mainConfigPath, JSON.stringify(correctConfig, null, 2));
    console.log(`✅ Configuração única criada: ${mainConfigPath}`);
    
    console.log('\n📄 Configuração aplicada:');
    console.log(JSON.stringify(correctConfig, null, 2));
    
} catch (error) {
    console.log(`❌ Erro ao criar configuração: ${error.message}`);
}

// 4. Limpar outras configurações conflitantes
console.log('\n🗑️ 4. REMOVENDO OUTRAS CONFIGURAÇÕES CONFLITANTES');
console.log('=================================================');

const otherConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');

if (fs.existsSync(otherConfigPath)) {
    try {
        fs.unlinkSync(otherConfigPath);
        console.log('✅ Removida configuração conflitante do VS Code');
    } catch (error) {
        console.log(`⚠️ Erro ao remover configuração do VS Code: ${error.message}`);
    }
}

// 5. Verificar resultado
console.log('\n🧪 5. VERIFICANDO CONFIGURAÇÃO FINAL');
console.log('===================================');

if (fs.existsSync(mainConfigPath)) {
    try {
        const finalConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf-8'));
        console.log('✅ Configuração final válida');
        console.log(`📊 Servidores MCP configurados: ${Object.keys(finalConfig.mcpServers || {}).length}`);
    } catch (error) {
        console.log(`❌ Erro na configuração final: ${error.message}`);
    }
} else {
    console.log('❌ Configuração não foi criada');
}

// 6. Instruções finais
console.log('\n🎯 PRÓXIMOS PASSOS OBRIGATÓRIOS');
console.log('==============================');
console.log('1. ✅ Configurações conflitantes removidas');
console.log('2. ✅ Configuração única criada com caminhos absolutos');
console.log('');
console.log('🔄 AGORA VOCÊ DEVE:');
console.log('1. FECHAR COMPLETAMENTE o Cursor IDE');
console.log('2. AGUARDAR 5 segundos');
console.log('3. ABRIR o Cursor IDE novamente');
console.log('4. ABRIR o chat do Claude/Cline');
console.log('5. VERIFICAR se aparece "MCP tools: 4 enabled"');
console.log('');
console.log('🧪 TESTE:');
console.log('- Digite: "Calcule 25 + 17"');
console.log('- Deve usar a ferramenta calculator');
console.log('');
console.log('🔍 SE AINDA NÃO FUNCIONAR:');
console.log('1. Abra Developer Tools (Help → Toggle Developer Tools)');
console.log('2. Vá para Console');
console.log('3. Procure por erros MCP');
console.log('4. Execute: node test-mcp.cjs (para confirmar que servidor funciona)');

console.log('\n✅ RESOLUÇÃO DE CONFLITOS CONCLUÍDA!');
console.log('🎉 O Cursor agora deve detectar as 4 ferramentas MCP!'); 