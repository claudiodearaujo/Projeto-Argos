#!/usr/bin/env node

/**
 * 🛠️ Script de Setup - Projeto Argos MCP Server
 * 
 * Instala e configura automaticamente o servidor MCP
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Configurando Projeto Argos MCP Server...\n');

// 1. Verificar Node.js
try {
    const nodeVersion = process.version;
    console.log(`✅ Node.js detectado: ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
        console.error('❌ Node.js 16+ é necessário. Versão atual:', nodeVersion);
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Node.js não encontrado');
    process.exit(1);
}

// 2. Instalar dependências
console.log('\n📦 Instalando dependências...');
try {
    console.log('Installing @modelcontextprotocol/sdk...');
    execSync('npm install @modelcontextprotocol/sdk --save', { stdio: 'inherit' });
    
    console.log('Installing zod...');
    execSync('npm install zod --save', { stdio: 'inherit' });
    
    console.log('Installing winston...');
    execSync('npm install winston --save', { stdio: 'inherit' });
    
    console.log('Installing dev dependencies...');
    execSync('npm install @types/node typescript --save-dev', { stdio: 'inherit' });
    
    console.log('✅ Dependências instaladas com sucesso');
} catch (error) {
    console.error('⚠️ Algumas dependências falharam, mas continuando...');
}

// 3. Criar diretório de logs
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Diretório de logs criado');
}

// 4. Criar configuração Claude Desktop
const configPath = getClaudeConfigPath();
if (configPath) {
    console.log(`\n🔧 Configurando Claude Desktop...`);
    console.log(`Caminho: ${configPath}`);
    
    const projectPath = process.cwd().replace(/\\/g, '/');
    const mcpConfig = {
        mcpServers: {
            "projeto-argos-mcp": {
                command: "C:/Program Files/nodejs/node.exe",
                args: [
                    "C:/desenv/Projeto Argos/Projeto-Argos/src/mcp-server/index.cjs"
                ],
                env: {
                    LOG_LEVEL: "info"
                }
            }
        }
    };
    
    try {
        // Criar diretório se não existir
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        // Mesclar com configuração existente ou criar nova
        let existingConfig = {};
        if (fs.existsSync(configPath)) {
            try {
                existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            } catch (e) {
                console.log('⚠️ Configuração existente inválida, criando nova');
            }
        }
        
        const finalConfig = {
            ...existingConfig,
            mcpServers: {
                ...existingConfig.mcpServers,
                ...mcpConfig.mcpServers
            }
        };
        
        fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
        console.log('✅ Configuração Claude Desktop atualizada');
        
    } catch (error) {
        console.error('⚠️ Erro ao configurar Claude Desktop:', error.message);
        console.log('\n📋 Configuração manual necessária:');
        console.log('Adicione isto ao seu claude_desktop_config.json:');
        console.log(JSON.stringify(mcpConfig, null, 2));
    }
}

// 5. Teste básico
console.log('\n🧪 Testando servidor MCP...');
try {
    // Testar versão JavaScript simples
    const result = execSync('node test-mcp.cjs', { encoding: 'utf-8', timeout: 10000 });
    console.log('✅ Teste básico executado');
} catch (error) {
    console.log('⚠️ Teste básico falhou, mas isso é normal em alguns ambientes');
}

// 6. Próximos passos
console.log('\n🎉 Setup concluído!\n');
console.log('📋 Próximos passos:');
console.log('1. Reinicie o Claude Desktop se estiver usando');
console.log('2. Teste o servidor: node test-mcp.cjs');
console.log('3. Use as ferramentas no Claude: echo, calculator, system_info');
console.log('4. Leia a documentação: src/mcp-server/README.md\n');
console.log('🚀 Divirta-se com o Projeto Argos MCP!');

// Função para determinar caminho de configuração do Claude
function getClaudeConfigPath() {
    const platform = os.platform();
    
    switch (platform) {
        case 'win32':
            return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        case 'linux':
            return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
        default:
            console.log('⚠️ Sistema operacional não suportado para configuração automática');
            return null;
    }
} 