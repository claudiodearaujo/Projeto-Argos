#!/usr/bin/env node

/**
 * 🎯 Script de Configuração Automática - Cursor IDE MCP
 * 
 * Configura automaticamente o servidor MCP para o Cursor IDE
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🎯 Configurando MCP para Cursor IDE...\n');

// Testar se o servidor funciona primeiro
console.log('🧪 Testando servidor MCP...');
try {
    const { execSync } = require('child_process');
    const result = execSync('node test-mcp.cjs', { encoding: 'utf-8', timeout: 5000 });
    
    if (result.includes('funcionando corretamente')) {
        console.log('✅ Servidor MCP testado e funcionando!\n');
    } else {
        console.log('⚠️ Servidor funcionando mas resposta inesperada\n');
    }
} catch (error) {
    console.error('❌ Erro no teste do servidor:', error.message);
    console.log('🔧 Continuando com a configuração...\n');
}

// Determinar caminhos de configuração do Cursor
function getCursorConfigPaths() {
    const platform = os.platform();
    const homedir = os.homedir();
    
    const paths = [];
    
    switch (platform) {
        case 'win32':
            paths.push(
                path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'settings.json')
            );
            break;
        case 'darwin':
            paths.push(
                path.join(homedir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, 'Library', 'Application Support', 'Code', 'User', 'settings.json')
            );
            break;
        case 'linux':
            paths.push(
                path.join(homedir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, '.config', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
                path.join(homedir, '.config', 'Code', 'User', 'settings.json')
            );
            break;
    }
    
    return paths;
}

// Configuração MCP
const projectPath = process.cwd().replace(/\\/g, '/');
const mcpConfig = {
    mcpServers: {
        "projeto-argos-mcp": {
            command: "node",
            args: ["src/mcp-server/index.cjs"],
            cwd: projectPath,
            env: {
                LOG_LEVEL: "info"
            }
        }
    }
};

// Tentar configurar em todos os locais possíveis
const configPaths = getCursorConfigPaths();
let successCount = 0;

for (const configPath of configPaths) {
    try {
        console.log(`🔧 Tentando configurar: ${configPath}`);
        
        // Criar diretório se não existir
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`📁 Diretório criado: ${configDir}`);
        }
        
        let config = {};
        
        // Se é settings.json do VS Code, usar formato diferente
        if (configPath.includes('settings.json')) {
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                } catch (e) {
                    console.log('⚠️ Arquivo settings.json inválido, criando novo');
                }
            }
            
            config.mcp = {
                servers: {
                    "projeto-argos-mcp": {
                        command: "node",
                        args: [`${projectPath}/src/mcp-server/index.cjs`]
                    }
                }
            };
        } else {
            // Para arquivos cline_mcp_settings.json
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                } catch (e) {
                    console.log('⚠️ Arquivo MCP settings inválido, criando novo');
                }
            }
            
            config = {
                ...config,
                ...mcpConfig
            };
        }
        
        // Escrever configuração
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`✅ Configurado: ${configPath}`);
        successCount++;
        
    } catch (error) {
        console.log(`⚠️ Falha em ${configPath}: ${error.message}`);
    }
}

console.log(`\n📊 Resultado: ${successCount}/${configPaths.length} configurações aplicadas`);

// Criar arquivo de exemplo manual
const exampleConfig = path.join(process.cwd(), 'cursor_mcp_example.json');
fs.writeFileSync(exampleConfig, JSON.stringify(mcpConfig, null, 2));
console.log(`📄 Exemplo salvo em: ${exampleConfig}`);

// Instruções finais
console.log('\n🎯 Próximos passos:');
console.log('1. Reinicie o Cursor IDE');
console.log('2. Abra o chat do Claude/Cline');
console.log('3. Verifique se aparece "MCP tools: 4 enabled"');
console.log('4. Teste: "Calcule 10 + 15"');

console.log('\n📋 Se não funcionar, configure manualmente:');
console.log('- Copie o conteúdo de cursor_mcp_example.json');
console.log('- Cole no arquivo de configuração do seu Cursor');

console.log('\n🧪 Para debugging:');
console.log('- Abra Developer Tools no Cursor (Help → Toggle Developer Tools)');
console.log('- Verifique console por erros MCP');

console.log('\n🎉 Configuração concluída!');
console.log('📖 Leia CONFIGURAR_CURSOR_MCP.md para mais detalhes'); 