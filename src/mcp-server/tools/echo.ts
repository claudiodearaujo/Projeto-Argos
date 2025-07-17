/**
 * 🔄 Ferramenta Echo - Projeto Argos MCP
 * 
 * Ferramenta simples que retorna exatamente o que foi enviado
 */

import { CommonSchemas } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class EchoTool {
    public readonly definition = {
        name: 'echo',
        description: 'Retorna exatamente a mensagem que foi enviada. Útil para testes e debugging.',
        inputSchema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'A mensagem a ser ecoada de volta'
                }
            },
            required: ['message']
        }
    };

    async execute(args: { message: string }): Promise<any> {
        logger.info(`🔄 Echo executado com mensagem: "${args.message}"`);

        return {
            content: [
                {
                    type: 'text',
                    text: args.message
                }
            ]
        };
    }
} 