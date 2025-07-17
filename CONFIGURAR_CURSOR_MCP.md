# 🎯 **CONFIGURAR MCP NO CURSOR IDE - GUIA COMPLETO**

## ❌ **Problema: "0 tools enabled"**

Esse erro indica que o Cursor não conseguiu carregar o servidor MCP. Vamos resolver!

---

## 🔧 **SOLUÇÃO PASSO A PASSO**

### **1. Localizar Arquivo de Configuração Correto**

No **Cursor IDE**, a configuração MCP fica em:

**Windows:**
```
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**macOS:**
```
~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### **2. Configuração Correta para Cursor**

Crie ou edite o arquivo com esta configuração exata:

```json
{
  "mcpServers": {
    "projeto-argos-mcp": {
      "command": "node",
      "args": ["src/mcp-server/index.cjs"],
      "cwd": "C:/desenv/Projeto Argos/Projeto-Argos",
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### **3. Verificar Caminho Absoluto**

Se ainda não funcionar, use o caminho absoluto completo:

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

---

## 🧪 **TESTE ANTES DE CONFIGURAR**

Primeiro, confirme que o servidor funciona:

```bash
# No terminal do projeto
node test-mcp.cjs
```

**Deve mostrar**: ✅ Servidor MCP funcionando corretamente!

---

## 🔍 **DIAGNÓSTICO DE PROBLEMAS**

### **Problema 1: Caminho Incorreto**
**Erro**: Server not found
**Solução**: Use caminho absoluto completo

### **Problema 2: Permissões**
**Erro**: Permission denied
**Solução**: Execute Cursor como administrador

### **Problema 3: Node.js não encontrado**
**Erro**: 'node' is not recognized
**Solução**: 
```json
{
  "mcpServers": {
    "projeto-argos-mcp": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": ["C:/desenv/Projeto Argos/Projeto-Argos/src/mcp-server/index.cjs"]
    }
  }
}
```

### **Problema 4: Arquivo não existe**
**Erro**: ENOENT
**Solução**: Verificar se o arquivo existe:
```bash
dir "src/mcp-server/index.cjs"
```

---

## 🚀 **MÉTODO ALTERNATIVO: VS Code Settings**

Se o arquivo `cline_mcp_settings.json` não funcionar, tente adicionar diretamente no `settings.json` do VS Code:

1. **Abrir Settings (JSON)**:
   - `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"

2. **Adicionar configuração**:
```json
{
  "mcp": {
    "servers": {
      "projeto-argos-mcp": {
        "command": "node",
        "args": ["C:/desenv/Projeto Argos/Projeto-Argos/src/mcp-server/index.cjs"]
      }
    }
  }
}
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

- [ ] ✅ Servidor testado com `node test-mcp.cjs`
- [ ] ✅ Arquivo de configuração no local correto
- [ ] ✅ Caminho do servidor está correto
- [ ] ✅ Cursor IDE reiniciado após configuração
- [ ] ✅ Extensão Claude Dev/Cline atualizada

---

## 🔧 **SCRIPT AUTOMÁTICO DE CONFIGURAÇÃO**

Execute este comando para configurar automaticamente:

```bash
node setup-cursor-mcp.cjs
```

---

## 🧪 **TESTE FINAL**

Após configurar:

1. **Reiniciar Cursor IDE**
2. **Abrir o chat do Claude/Cline**
3. **Verificar se aparece**: "MCP tools: 4 enabled"
4. **Testar comando**: "Calcule 15 + 25"

---

## 🎯 **CONFIGURAÇÕES TESTADAS**

### **Configuração Básica (Recomendada)**
```json
{
  "mcpServers": {
    "projeto-argos-mcp": {
      "command": "node",
      "args": ["src/mcp-server/index.cjs"],
      "cwd": "C:/desenv/Projeto Argos/Projeto-Argos"
    }
  }
}
```

### **Configuração com Debug**
```json
{
  "mcpServers": {
    "projeto-argos-mcp": {
      "command": "node",
      "args": ["src/mcp-server/index.cjs"],
      "cwd": "C:/desenv/Projeto Argos/Projeto-Argos",
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

---

## 🆘 **SE AINDA NÃO FUNCIONAR**

1. **Verificar logs do Cursor**:
   - `Help` → `Toggle Developer Tools` → `Console`

2. **Testar comando direto**:
```bash
cd "C:\desenv\Projeto Argos\Projeto-Argos"
node src/mcp-server/index.cjs
```

3. **Verificar versão do Node.js**:
```bash
node --version
# Deve ser v16+ 
```

---

## ✅ **RESULTADO ESPERADO**

Após configuração correta, no Cursor você deve ver:
- 🔧 **MCP tools: 4 enabled**
- 🎯 **Ferramentas disponíveis**: echo, calculator, system_info, read_file

**🎉 Pronto para usar IA contextualizada no Cursor!** 