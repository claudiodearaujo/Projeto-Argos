#!/usr/bin/env node

/**
 * 🤖 Projeto Argos - MCP Server
 * 
 * Servidor MCP (Model Context Protocol) para integração com assistentes IA
 * como Claude Desktop e Cursor IDE.
 */

import { MCPServer } from './server/MCPServer.js';
import { logger } from './utils/logger.js';

async function main() {
    try {
        logger.info('🚀 Iniciando Projeto Argos MCP Server...');
        
        const server = new MCPServer();
        await server.start();
        
        logger.info('✅ Servidor MCP iniciado com sucesso!');
        
    } catch (error) {
        logger.error('❌ Erro ao iniciar servidor MCP:', error);
        process.exit(1);
    }
}

// Tratamento de sinais do sistema
process.on('SIGINT', () => {
    logger.info('🛑 Recebido SIGINT, finalizando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Recebido SIGTERM, finalizando servidor...');
    process.exit(0);
});

// Executar apenas se este for o arquivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        logger.error('💥 Erro fatal no servidor MCP:', error);
        process.exit(1);
    });
} 