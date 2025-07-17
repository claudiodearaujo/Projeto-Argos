# 🚀 Guia de Migração: TypeScript + ES Modules

## 📊 Visão Geral da Migração

Este documento detalha a migração completa do Projeto Argos de JavaScript/CommonJS para TypeScript com ES Modules, seguindo as melhores práticas de 2025.

### 🎯 Objetivos
- **Type Safety**: Detecção de erros em tempo de compilação
- **Developer Experience**: IntelliSense, refactoring automático
- **Performance**: Tree-shaking, otimizações modernas
- **Padrões Modernos**: ES2022 + TypeScript 5.6+
- **Futuro-proof**: Alinhado com tendências atuais

---

## 📋 FASE 1: Fundação

### 1.1 tsconfig.json Otimizado

```json
{
  "compilerOptions": {
    // ES2022 para recursos modernos (top-level await, etc)
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    
    // Diretórios
    "rootDir": "./src",
    "outDir": "./dist",
    
    // Type checking rigoroso
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    // ES Modules
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    
    // Source maps para debugging
    "sourceMap": true,
    "inlineSourceMap": false,
    
    // Imports limpos com path mapping
    "baseUrl": "./src",
    "paths": {
      "#types/*": ["./types/*"],
      "#utils/*": ["./utils/*"],
      "#server/*": ["./mcp-server/*"],
      "#tools/*": ["./mcp-server/tools/*"]
    },
    
    // Resolução de módulos
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    
    // Otimizações
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    
    // Decorators (futuro)
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ts-node": {
    "esm": true,
    "files": true
  }
}
```

### 1.2 package.json Atualizado

```json
{
  "name": "projeto-argos",
  "version": "1.2.0",
  "description": "Projeto Argos - Sistema inteligente com TypeScript + ES Modules",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./server": {
      "import": "./dist/mcp-server/index.js",
      "types": "./dist/mcp-server/index.d.ts"
    }
  },
  "files": [
    "dist",
    "src",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsx --watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "clean": "rimraf dist",
    "mcp:dev": "tsx --watch src/mcp-server/index.ts",
    "mcp:build": "tsc && node dist/mcp-server/index.js",
    "mcp:test": "tsx src/test-mcp.ts"
  },
  "keywords": [
    "typescript",
    "esm",
    "argos",
    "ai",
    "mcp",
    "modern-nodejs"
  ],
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.29.0",
    "prettier": "^3.0.0",
    "rimraf": "^5.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.6.0",
    "vitest": "^1.0.0"
  }
}
```

### 1.3 Nova Estrutura de Diretórios

```
Projeto-Argos/
├── src/                          # Código fonte TypeScript
│   ├── index.ts                  # Entry point principal
│   ├── types/                    # Definições de tipos
│   │   ├── global.d.ts          # Tipos globais
│   │   ├── mcp.ts               # Tipos MCP
│   │   └── config.ts            # Tipos de configuração
│   ├── utils/                    # Utilitários compartilhados
│   │   ├── logger.ts            # Sistema de logging
│   │   ├── validation.ts        # Validações
│   │   └── helpers.ts           # Funções auxiliares
│   ├── mcp-server/              # Servidor MCP
│   │   ├── index.ts             # Entry point do servidor
│   │   ├── server/              # Classes do servidor
│   │   │   └── MCPServer.ts     # Implementação principal
│   │   ├── tools/               # Ferramentas MCP
│   │   │   ├── echo.ts
│   │   │   ├── calculator.ts
│   │   │   ├── fileReader.ts
│   │   │   └── systemInfo.ts
│   │   └── handlers/            # Handlers de requisições
│   ├── config/                  # Configurações
│   │   ├── index.ts             # Configuração principal
│   │   └── mcp.ts               # Configuração MCP
│   └── test/                    # Arquivos de teste
│       ├── setup.ts             # Setup dos testes
│       ├── mcp-server.test.ts   # Testes do servidor
│       └── tools/               # Testes das ferramentas
├── dist/                        # Código compilado (build output)
├── docs/                        # Documentação
└── scripts/                     # Scripts de build e deploy
```

---

## 🔧 FASE 2: Configuração de Ferramentas

### 2.1 ESLint Configuration (.eslintrc.cjs)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // TypeScript específico
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Imports
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external', 
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc' }
    }],
    
    // Geral
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es2022: true
  }
};
```

### 2.2 Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed"
}
```

### 2.3 Vitest Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'coverage/', '**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '#types': resolve(__dirname, './src/types'),
      '#utils': resolve(__dirname, './src/utils'),
      '#server': resolve(__dirname, './src/mcp-server'),
      '#tools': resolve(__dirname, './src/mcp-server/tools')
    }
  }
});
```

---

## 🎯 FASE 3: Migração de Código

### 3.1 Exemplo: Migração do MCPServer

**Antes (CommonJS):**
```javascript
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');

class MCPServer {
  constructor(options) {
    this.options = options;
    this.server = new Server(/* ... */);
  }
  
  async start() {
    // implementação
  }
}

module.exports = { MCPServer };
```

**Depois (TypeScript + ESM):**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ServerOptions, MCPRequest, MCPResponse } from '#types/mcp.js';
import { logger } from '#utils/logger.js';

export class MCPServer {
  private readonly options: ServerOptions;
  private readonly server: Server;

  constructor(options: ServerOptions) {
    this.options = options;
    this.server = new Server({
      name: options.name,
      version: options.version,
    });
  }

  public async start(): Promise<void> {
    try {
      await this.server.start();
      logger.info('MCP Server started successfully', {
        name: this.options.name,
        version: this.options.version,
      });
    } catch (error) {
      logger.error('Failed to start MCP Server', { error });
      throw error;
    }
  }

  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    // implementação tipada
  }
}
```

### 3.2 Definições de Tipos (#types/mcp.ts)

```typescript
export interface ServerOptions {
  name: string;
  version: string;
  capabilities?: ServerCapabilities;
}

export interface ServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}
```

### 3.3 Exemplo: Tool com Tipagem

```typescript
import type { Tool, ToolResult, ToolContent } from '#types/mcp.js';
import { z } from 'zod';
import { logger } from '#utils/logger.js';

// Schema de validação
const CalculatorInputSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

type CalculatorInput = z.infer<typeof CalculatorInputSchema>;

export class CalculatorTool implements Tool {
  public readonly name = 'calculator';
  public readonly description = 'Perform basic mathematical operations';
  public readonly inputSchema = CalculatorInputSchema.schema;

  public async execute(input: unknown): Promise<ToolResult> {
    try {
      const { operation, a, b } = CalculatorInputSchema.parse(input);
      
      const result = this.calculate(operation, a, b);
      
      logger.debug('Calculator operation completed', {
        operation,
        a,
        b,
        result,
      });

      return {
        content: [{
          type: 'text',
          text: `Result: ${result}`,
        }] as ToolContent[],
      };
    } catch (error) {
      logger.error('Calculator operation failed', { error, input });
      
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }] as ToolContent[],
        isError: true,
      };
    }
  }

  private calculate(operation: CalculatorInput['operation'], a: number, b: number): number {
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return a / b;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
}
```

---

## 🚀 FASE 4: Entry Points Modernos

### 4.1 src/index.ts (Principal)

```typescript
import process from 'node:process';
import { MCPServer } from '#server/MCPServer.js';
import { logger } from '#utils/logger.js';
import type { ServerOptions } from '#types/mcp.js';

async function main(): Promise<void> {
  try {
    const options: ServerOptions = {
      name: 'projeto-argos',
      version: '1.2.0',
      capabilities: {
        tools: true,
        resources: true,
        prompts: false,
      },
    };

    const server = new MCPServer(options);
    await server.start();

    logger.info('Projeto Argos initialized successfully');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to initialize Projeto Argos', { error });
    process.exit(1);
  }
}

// Top-level await (ES2022)
await main();
```

### 4.2 src/mcp-server/index.ts

```typescript
import { MCPServer } from './server/MCPServer.js';
import { CalculatorTool } from './tools/calculator.js';
import { EchoTool } from './tools/echo.js';
import { FileReaderTool } from './tools/fileReader.js';
import { SystemInfoTool } from './tools/systemInfo.js';
import { logger } from '#utils/logger.js';

async function startMCPServer(): Promise<void> {
  const server = new MCPServer({
    name: 'projeto-argos-mcp',
    version: '1.2.0',
  });

  // Registrar ferramentas
  server.addTool(new CalculatorTool());
  server.addTool(new EchoTool());
  server.addTool(new FileReaderTool());
  server.addTool(new SystemInfoTool());

  await server.start();
  logger.info('MCP Server ready for connections');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  await startMCPServer();
}

export { MCPServer, startMCPServer };
```

---

## 🧪 FASE 5: Configuração de Testes

### 5.1 src/test/setup.ts

```typescript
import { beforeAll, afterAll } from 'vitest';
import { logger } from '#utils/logger.js';

beforeAll(async () => {
  logger.info('Starting test suite');
});

afterAll(async () => {
  logger.info('Test suite completed');
});
```

### 5.2 Exemplo de Teste (src/test/tools/calculator.test.ts)

```typescript
import { describe, it, expect } from 'vitest';
import { CalculatorTool } from '#tools/calculator.js';

describe('CalculatorTool', () => {
  const calculator = new CalculatorTool();

  it('should add numbers correctly', async () => {
    const result = await calculator.execute({
      operation: 'add',
      a: 2,
      b: 3,
    });

    expect(result.isError).toBe(false);
    expect(result.content[0]?.text).toBe('Result: 5');
  });

  it('should handle division by zero', async () => {
    const result = await calculator.execute({
      operation: 'divide',
      a: 10,
      b: 0,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('Division by zero');
  });

  it('should validate input types', async () => {
    const result = await calculator.execute({
      operation: 'add',
      a: 'invalid',
      b: 3,
    });

    expect(result.isError).toBe(true);
  });
});
```

---

## 📚 FASE 6: Documentação e Scripts

### 6.1 Scripts de Build (scripts/build.ts)

```typescript
import { execSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { logger } from '../src/utils/logger.js';

async function build(): Promise<void> {
  try {
    logger.info('Starting build process...');

    // Limpar diretório de saída
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true });
      logger.info('Cleaned dist directory');
    }

    // Type checking
    logger.info('Running type check...');
    execSync('tsc --noEmit', { stdio: 'inherit' });

    // Build
    logger.info('Compiling TypeScript...');
    execSync('tsc', { stdio: 'inherit' });

    logger.info('Build completed successfully');
  } catch (error) {
    logger.error('Build failed', { error });
    process.exit(1);
  }
}

await build();
```

### 6.2 README.md Atualizado

```markdown
# 🎯 Projeto Argos - TypeScript + ES Modules

Sistema inteligente de desenvolvimento com suporte completo a TypeScript e ES Modules.

## 🚀 Getting Started

### Requisitos
- Node.js 20+ 
- pnpm (recomendado)

### Instalação
```bash
pnpm install
```

### Development
```bash
pnpm dev          # Desenvolvimento com hot-reload
pnpm build        # Build para produção
pnpm test         # Executar testes
pnpm lint         # Linting do código
```

## 📁 Estrutura do Projeto

```
src/              # Código fonte TypeScript
├── types/        # Definições de tipos
├── utils/        # Utilitários compartilhados  
├── mcp-server/   # Servidor MCP
└── test/         # Testes
```

## 🔧 Scripts Disponíveis

- `pnpm dev` - Desenvolvimento com tsx watch
- `pnpm build` - Compilação TypeScript
- `pnpm test` - Testes com Vitest
- `pnpm type-check` - Verificação de tipos
- `pnpm lint` - ESLint
- `pnpm format` - Prettier
```

---

## 🎯 Cronograma de Implementação

### Semana 1: Fundação
- [ ] Criar tsconfig.json otimizado
- [ ] Atualizar package.json com scripts
- [ ] Reestruturar diretórios
- [ ] Configurar ESLint + Prettier

### Semana 2: Migração Core  
- [ ] Converter arquivos para TypeScript
- [ ] Adicionar tipagens explícitas
- [ ] Migrar para ES Modules
- [ ] Configurar testes

### Semana 3: Otimização
- [ ] Implementar strict mode
- [ ] Configurar path aliases
- [ ] Setup hot-reload
- [ ] CI/CD pipeline

---

## 🏆 Benefícios Esperados

- **50% menos erros** em tempo de execução
- **Melhor DX** com IntelliSense e refactoring
- **Performance** melhorada com tree-shaking
- **Manutenibilidade** com tipagem estática
- **Escalabilidade** com arquitetura moderna

---

*Última atualização: Janeiro 2025* 