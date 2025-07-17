/**
 * 🧮 Ferramenta Calculator - Projeto Argos MCP
 * 
 * Realiza operações matemáticas básicas
 */

import { CommonSchemas } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class CalculatorTool {
    public readonly definition = {
        name: 'calculator',
        description: 'Realiza operações matemáticas básicas: adição, subtração, multiplicação e divisão.',
        inputSchema: {
            type: 'object',
            properties: {
                operation: {
                    type: 'string',
                    enum: ['add', 'subtract', 'multiply', 'divide'],
                    description: 'Tipo de operação matemática'
                },
                a: {
                    type: 'number',
                    description: 'Primeiro número'
                },
                b: {
                    type: 'number',
                    description: 'Segundo número'
                }
            },
            required: ['operation', 'a', 'b']
        }
    };

    async execute(args: { operation: 'add' | 'subtract' | 'multiply' | 'divide', a: number, b: number }): Promise<any> {
        logger.info(`🧮 Calculadora executando: ${args.a} ${args.operation} ${args.b}`);

        let result: number;
        let operationSymbol: string;

        switch (args.operation) {
            case 'add':
                result = args.a + args.b;
                operationSymbol = '+';
                break;
            case 'subtract':
                result = args.a - args.b;
                operationSymbol = '-';
                break;
            case 'multiply':
                result = args.a * args.b;
                operationSymbol = '×';
                break;
            case 'divide':
                if (args.b === 0) {
                    throw new Error('Divisão por zero não é permitida');
                }
                result = args.a / args.b;
                operationSymbol = '÷';
                break;
            default:
                throw new Error(`Operação não suportada: ${args.operation}`);
        }

        const calculation = `${args.a} ${operationSymbol} ${args.b} = ${result}`;
        logger.info(`✅ Resultado: ${calculation}`);

        return {
            content: [
                {
                    type: 'text',
                    text: `📊 **Cálculo Realizado**\n\n${calculation}\n\nResultado: **${result}**`
                }
            ]
        };
    }
} 