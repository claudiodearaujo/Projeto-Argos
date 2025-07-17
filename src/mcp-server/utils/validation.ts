/**
 * 🛡️ Sistema de Validação - Projeto Argos MCP
 * 
 * Utiliza Zod para validação robusta de esquemas de entrada
 */

import { z, ZodError, ZodSchema } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './logger.js';

/**
 * Valida entrada de ferramenta usando esquema Zod
 */
export function validateToolInput(schema: any, input: any): any {
    try {
        logger.debug('🔍 Validando entrada da ferramenta...');
        
        // Converter schema JSON para Zod se necessário
        const zodSchema = convertJSONSchemaToZod(schema);
        
        const validatedInput = zodSchema.parse(input);
        logger.debug('✅ Entrada validada com sucesso');
        
        return validatedInput;
        
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors.map(err => 
                `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            
            logger.warn(`⚠️ Erro de validação: ${errorMessages}`);
            
            throw new McpError(
                ErrorCode.InvalidParams,
                `Parâmetros inválidos: ${errorMessages}`
            );
        }
        
        logger.error('💥 Erro inesperado na validação:', error);
        throw new McpError(
            ErrorCode.InternalError,
            'Erro interno na validação de entrada'
        );
    }
}

/**
 * Converte esquema JSON Schema para esquema Zod
 */
function convertJSONSchemaToZod(jsonSchema: any): ZodSchema {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
        return z.any();
    }

    // Se já for um esquema Zod, retornar diretamente
    if (jsonSchema._def) {
        return jsonSchema;
    }

    // Converter baseado no tipo
    switch (jsonSchema.type) {
        case 'object':
            return buildObjectSchema(jsonSchema);
        case 'string':
            return buildStringSchema(jsonSchema);
        case 'number':
            return buildNumberSchema(jsonSchema);
        case 'boolean':
            return z.boolean();
        case 'array':
            return buildArraySchema(jsonSchema);
        default:
            return z.any();
    }
}

/**
 * Constrói esquema para objetos
 */
function buildObjectSchema(schema: any): z.ZodObject<any> {
    const shape: Record<string, ZodSchema> = {};
    
    if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            let fieldSchema = convertJSONSchemaToZod(propSchema);
            
            // Verificar se é obrigatório
            const isRequired = schema.required?.includes(key);
            if (!isRequired) {
                fieldSchema = fieldSchema.optional();
            }
            
            shape[key] = fieldSchema;
        }
    }
    
    return z.object(shape);
}

/**
 * Constrói esquema para strings
 */
function buildStringSchema(schema: any): z.ZodString {
    let stringSchema = z.string();
    
    if (schema.minLength !== undefined) {
        stringSchema = stringSchema.min(schema.minLength);
    }
    
    if (schema.maxLength !== undefined) {
        stringSchema = stringSchema.max(schema.maxLength);
    }
    
    if (schema.pattern) {
        stringSchema = stringSchema.regex(new RegExp(schema.pattern));
    }
    
    if (schema.enum) {
        return z.enum(schema.enum);
    }
    
    return stringSchema;
}

/**
 * Constrói esquema para números
 */
function buildNumberSchema(schema: any): z.ZodNumber {
    let numberSchema = z.number();
    
    if (schema.minimum !== undefined) {
        numberSchema = numberSchema.min(schema.minimum);
    }
    
    if (schema.maximum !== undefined) {
        numberSchema = numberSchema.max(schema.maximum);
    }
    
    if (schema.multipleOf !== undefined) {
        numberSchema = numberSchema.multipleOf(schema.multipleOf);
    }
    
    return numberSchema;
}

/**
 * Constrói esquema para arrays
 */
function buildArraySchema(schema: any): z.ZodArray<any> {
    const itemSchema = schema.items ? 
        convertJSONSchemaToZod(schema.items) : 
        z.any();
    
    let arraySchema = z.array(itemSchema);
    
    if (schema.minItems !== undefined) {
        arraySchema = arraySchema.min(schema.minItems);
    }
    
    if (schema.maxItems !== undefined) {
        arraySchema = arraySchema.max(schema.maxItems);
    }
    
    return arraySchema;
}

// Esquemas comuns para reutilização
export const CommonSchemas = {
    // Esquema para mensagens simples
    simpleMessage: z.object({
        message: z.string().min(1, 'Mensagem não pode estar vazia')
    }),
    
    // Esquema para operações matemáticas
    mathOperation: z.object({
        operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
        a: z.number(),
        b: z.number()
    }),
    
    // Esquema para leitura de arquivos
    fileRead: z.object({
        filePath: z.string().min(1, 'Caminho do arquivo é obrigatório'),
        encoding: z.enum(['utf-8', 'base64', 'ascii']).default('utf-8')
    }),
    
    // Esquema para informações do sistema
    systemInfo: z.object({
        detailed: z.boolean().default(false)
    })
};

export default { validateToolInput, CommonSchemas }; 