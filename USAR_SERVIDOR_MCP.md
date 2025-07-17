# 🚀 **COMO USAR O SERVIDOR MCP - GUIA RÁPIDO**

## ✅ **Status: SERVIDOR FUNCIONANDO PERFEITAMENTE!**

O servidor MCP está **100% operacional**. O problema com npm não afeta seu funcionamento.

---

## 🏃 **Uso Imediato (SEM npm)**

### **1. Testar o Servidor**
```bash
node test-mcp.cjs
```
**Resultado Esperado**: ✅ Servidor MCP funcionando corretamente!

### **2. Iniciar o Servidor**
```bash
node src/mcp-server/index.cjs
```
**Resultado**: Servidor rodando e pronto para Claude Desktop

### **3. Testar Ferramentas Individuais**
```bash
# Echo
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"echo","arguments":{"message":"Olá Argos!"}},"id":1}' | node src/mcp-server/index.cjs

# Calculator
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"calculator","arguments":{"operation":"add","a":15,"b":27}},"id":2}' | node src/mcp-server/index.cjs

# System Info
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"system_info","arguments":{"detailed":true}},"id":3}' | node src/mcp-server/index.cjs
```

---

## 🔧 **Integração com Claude Desktop**

### **Configuração Manual**

1. **Localizar arquivo de configuração:**
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Adicionar configuração:**
```json
{
  "mcpServers": {
    "projeto-argos-mcp": {
      "command": "node",
      "args": ["C:/desenv/Projeto Argos/Projeto-Argos/src/mcp-server/index.cjs"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. **Reiniciar Claude Desktop**

---

## 🧪 **Verificar Funcionamento**

### **Teste Básico**
```bash
# Listar ferramentas disponíveis
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node src/mcp-server/index.cjs
```

**Saída Esperada:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {"name": "echo", "description": "Retorna exatamente a mensagem que foi enviada"},
      {"name": "calculator", "description": "Realiza operações matemáticas básicas"},
      {"name": "system_info", "description": "Obtém informações do sistema"},
      {"name": "read_file", "description": "Lê arquivos do projeto de forma segura"}
    ]
  },
  "id": 1
}
```

---

## 📋 **Comandos Úteis**

| Ação | Comando |
|------|---------|
| **Testar servidor** | `node test-mcp.cjs` |
| **Iniciar servidor** | `node src/mcp-server/index.cjs` |
| **Ver logs** | `type logs\combined.log` (Windows) |
| **Limpar logs** | `del logs\*.log` (Windows) |

---

## 🛡️ **Arquivos Disponíveis para Leitura**

O servidor pode ler estes arquivos com segurança:
- `README.md`
- `package.json` 
- `tsconfig.json`
- `src/mcp-server/README.md`

---

## 🎯 **Como Usar no Claude Desktop**

Após configurar, você pode usar estas ferramentas no Claude:

1. **"Calcule 25 + 17"** → Usará a ferramenta calculator
2. **"Me mostre informações do sistema"** → Usará system_info
3. **"Leia o arquivo README.md"** → Usará read_file
4. **"Ecoe esta mensagem: Teste"** → Usará echo

---

## 🎉 **Tudo Funcionando!**

✅ **Servidor MCP**: Operacional  
✅ **4 Ferramentas**: Implementadas  
✅ **Segurança**: Ativa  
✅ **Logs**: Funcionando  
✅ **Testes**: Passando  

**🚀 O Projeto Argos MCP está PRONTO PARA USO!** 