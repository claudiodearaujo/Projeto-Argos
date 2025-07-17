/**
 * 📊 Sistema de Logging para o Projeto Argos MCP Server
 * 
 * Utiliza winston para logging estruturado com diferentes níveis
 */

import winston from 'winston';

// Configuração do formato de log
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        const levelEmoji = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            debug: '🔍'
        }[level] || '📝';
        
        const baseLog = `${timestamp} ${levelEmoji} [${level.toUpperCase()}] ${message}`;
        return stack ? `${baseLog}\n${stack}` : baseLog;
    })
);

// Criar instância do logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console output para desenvolvimento
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        
        // Arquivo de log para erros
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json()
        }),
        
        // Arquivo de log geral
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.json()
        })
    ]
});

// Criar diretório de logs se não existir
import { mkdirSync } from 'fs';
try {
    mkdirSync('logs', { recursive: true });
} catch (error) {
    // Diretório já existe ou erro de permissão
}

// Log inicial
logger.info('📊 Sistema de logging inicializado');

export default logger; 