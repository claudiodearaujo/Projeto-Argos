# 🤖 Projeto Argos - MCP Server

## Servidor MCP (Model Context Protocol) para Integração com Assistentes IA

Este servidor MCP permite que assistentes de IA como Claude Desktop e Cursor IDE interajam diretamente com o projeto Argos, fornecendo ferramentas inteligentes e acesso contextual aos recursos do projeto.

## 🚀 Funcionalidades

### 🛠️ Ferramentas Disponíveis

| Ferramenta | Descrição | Parâmetros |
|------------|-----------|------------|
| `echo` | Retorna exatamente a mensagem enviada | `message: string` |
| `calculator` | Operações matemáticas básicas | `operation: 'add'/'subtract'/'multiply'/'divide'`, `a: number`, `b: number` |
| `read_file` | Lê arquivos do projeto com segurança | `filePath: string`, `encoding?: 'utf-8'/'base64'` |
| `system_info` | Informações do sistema e ambiente | `detailed?: boolean` |

### 📚 Recursos Disponíveis

- **README do Projeto** (`argos://readme`)
- **Package.json** (`argos://package`)
- Logs e configurações do projeto

## 📦 Instalação e Configuração

### 1. Instalar Dependências

```bash
# No diretório raiz do projeto
npm install @modelcontextprotocol/sdk zod winston
npm install --save-dev @types/node typescript
```

### 2. Compilar TypeScript

```bash
# Compilar o código TypeScript
npm run mcp:build

# Ou usar o comando tsc diretamente
npx tsc src/mcp-server/index.ts --outDir build --target ES2022 --module Node16 --moduleResolution Node16
```

### 3. Testar o Servidor

```bash
# Testar com MCP Inspector
npm run mcp:inspect

# Ou executar diretamente
npx @modelcontextprotocol/inspector src/mcp-server/index.js
```

## 🔧 Integração com Claude Desktop

### Configuração no Windows

1. Localize o arquivo de configuração:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Adicione a configuração do servidor:
   ```json
   {
     "mcpServers": {
       "projeto-argos-mcp": {
         "command": "node",
         "args": ["C:/caminho/para/Projeto-Argos/src/mcp-server/index.js"],
         "env": {
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. Reinicie o Claude Desktop

### Configuração no macOS

1. Localize o arquivo de configuração:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. Use a mesma configuração JSON adaptando o caminho

## 🎯 Integração com Cursor IDE

### VS Code / Cursor

1. Abra as configurações do usuário (JSON):
   ```
   Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"
   ```

2. Adicione a configuração MCP:
   ```json
   {
     "mcp": {
       "servers": {
         "projeto-argos-mcp": {
           "command": "node",
           "args": ["caminho/para/src/mcp-server/index.js"]
         }
       }
     }
   }
   ```

## 🧪 Exemplos de Uso

### Teste da Ferramenta Echo
```json
{
  "tool": "echo",
  "arguments": {
    "message": "Olá, Projeto Argos!"
  }
}
```

### Calculadora
```json
{
  "tool": "calculator",
  "arguments": {
    "operation": "add",
    "a": 15,
    "b": 27
  }
}
```

### Leitura de Arquivo
```json
{
  "tool": "read_file",
  "arguments": {
    "filePath": "README.md"
  }
}
```

### Informações do Sistema
```json
{
  "tool": "system_info",
  "arguments": {
    "detailed": true
  }
}
```

## 🔒 Segurança

### Arquivos Permitidos
Por segurança, apenas estes arquivos podem ser lidos:
- `README.md`
- `package.json` 
- `tsconfig.json`
- `src/mcp-server/README.md`

### Logs
- Logs são salvos em `logs/combined.log` e `logs/error.log`
- Nível de log configurável via `LOG_LEVEL` (debug, info, warn, error)

## 🐛 Debugging

### MCP Inspector
```bash
# Usar o inspector para debugging
npm run mcp:inspect
```

### Logs Detalhados
```bash
# Executar com logs debug
LOG_LEVEL=debug node src/mcp-server/index.js
```

### Verificar Conectividade
```bash
# Teste básico de conectividade
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node src/mcp-server/index.js
```

## 📈 Roadmap

### Versão Atual (v1.0)
- ✅ Ferramentas básicas (echo, calculator, file reader, system info)
- ✅ Recursos do projeto
- ✅ Integração Claude Desktop
- ✅ Logging estruturado
- ✅ Validação com Zod

### Próximas Versões
- 🔄 Transporte HTTP para uso web
- 🔄 Mais ferramentas específicas do Argos
- 🔄 Sistema de cache avançado
- 🔄 Integração com APIs externas
- 🔄 Prompts pré-configurados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões existentes
4. Teste com o MCP Inspector
5. Envie um Pull Request

## 📝 Licença

Este projeto é parte do Projeto Argos e segue a mesma licença ISC.

---

**🎯 Transformando a experiência de desenvolvimento com IA contextual!** 