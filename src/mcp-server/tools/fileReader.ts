/**
 * 📁 Ferramenta File Reader - Projeto Argos MCP
 * 
 * Lê arquivos do sistema de forma segura
 */

import { readFile } from 'fs/promises';
import { join, resolve, normalize } from 'path';
import { logger } from '../utils/logger.js';

export class FileReaderTool {
    // Lista de arquivos permitidos para leitura (segurança)
    private readonly allowedFiles = [
        'README.md',
        'package.json',
        'tsconfig.json',
        'src/mcp-server/README.md'
    ];

    public readonly definition = {
        name: 'read_file',
        description: 'Lê o conteúdo de arquivos do projeto de forma segura. Apenas arquivos específicos são permitidos.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'Caminho relativo do arquivo a ser lido'
                },
                encoding: {
                    type: 'string',
                    enum: ['utf-8', 'base64'],
                    default: 'utf-8',
                    description: 'Codificação do arquivo'
                }
            },
            required: ['filePath']
        }
    };

    async execute(args: { filePath: string, encoding?: 'utf-8' | 'base64' }): Promise<any> {
        const { filePath, encoding = 'utf-8' } = args;
        
        logger.info(`📁 Tentando ler arquivo: ${filePath}`);

        try {
            // Normalizar caminho para evitar path traversal
            const normalizedPath = normalize(filePath);
            
            // Verificar se o arquivo está na lista de permitidos
            if (!this.allowedFiles.includes(normalizedPath)) {
                throw new Error(`Arquivo não permitido: ${filePath}. Arquivos permitidos: ${this.allowedFiles.join(', ')}`);
            }

            // Ler arquivo
            const content = await readFile(normalizedPath, encoding);
            
            logger.info(`✅ Arquivo lido com sucesso: ${filePath}`);

            return {
                content: [
                    {
                        type: 'text',
                        text: `📄 **Conteúdo do arquivo: ${filePath}**\n\n\`\`\`\n${content}\n\`\`\``
                    }
                ]
            };

        } catch (error) {
            logger.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Erro ao ler arquivo: ${filePath}**\n\nErro: ${error.message}\n\nArquivos disponíveis:\n${this.allowedFiles.map(f => `• ${f}`).join('\n')}`
                    }
                ]
            };
        }
    }
} 