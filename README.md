# 🎯 Sistema de Regras de Contexto AI

## 🌟 Visão Geral Rápida
Um sistema abrangente para gerenciar interações de IA através de gerenciamento de memória, rastreamento de lições aprendidas e operação em modo duplo (Planejamento/Agente). Este sistema garante desenvolvimento consistente e de alta qualidade enquanto mantém documentação detalhada do projeto e retenção de conhecimento.

## 🔄 Componentes Principais
1. **Sistema de Memória** (`@memories.md`)
   - Rastreia todas as interações cronologicamente
   - Atualiza automaticamente com timestamps e tags
   - Mantém contexto do projeto e decisões
   - Usa formato de controle de versão [v1.0.0]
   - Suporta #tags para busca fácil

2. **Lições Aprendidas** (`@lessons-learned.md`)
   - Captura soluções e melhores práticas
   - Usa formato estruturado: Problema → Solução → Impacto
   - Categoriza por componente, TypeScript, erros, etc.
   - Prioriza problemas (Crítico/Importante/Melhoria)
   - Vincula a exemplos de código relacionados

3. **Scratchpad** (`@scratchpad.md`)
   - Gerencia fase atual e tarefas
   - Rastreia progresso de implementação
   - Usa marcadores de status claros [X], [-], [ ], [!], [?]
   - Mantém dependências de tarefas
   - Atualiza métricas de confiança

## 🎯 Operação do Sistema de Modos

### Modo Planejamento 🎯
```markdown
Gatilho: "plan"
Propósito: Coleta de informações e planejamento
Requisitos:
- Analisar entrada do usuário
- Cruzar referências de requisitos
- Gerar perguntas esclarecedoras
- Calcular pontuação de confiança
- Criar divisão de tarefas
```

### Modo Agente ⚡
```markdown
Gatilho: "agent"
Requisitos de Ativação:
- 95% de nível de confiança
- Todas as perguntas respondidas
- Tarefas definidas
- Nenhum problema bloqueante
- Requisitos verificados
```

## 🚀 Etapas do Fluxo de Trabalho

1. **Inicializar Planejamento** 🎯
   ```markdown
   - Usar gatilho "plan"
   - Sistema cria nova entrada no scratchpad
   - Gera mínimo 3 perguntas
   - Define pontuação inicial de confiança
   ```

2. **Construir Confiança** 📈
   ```markdown
   - Responder todas as perguntas
   - Verificar requisitos
   - Atualizar dependências de tarefas
   - Monitorar pontuação de confiança
   ```

3. **Executar Implementação** ⚡
   ```markdown
   - Alcançar 95% de confiança
   - Usar gatilho "agent"
   - Sistema implementa solução
   - Atualiza documentação
   ```

## 🎮 Exemplos de Fluxo de Trabalho

### Exemplo 1: Criando uma Nova Funcionalidade
```markdown
USUÁRIO: "plan implementar um novo componente de botão"

IA: 🎯 MODO PLANEJAMENTO ATIVADO
Tarefa Atual: Implementar novo componente de botão
Perguntas:
1. Quais variantes são necessárias? (primário/secundário/contorno)
2. Deve suportar ícones?
3. Quais tamanhos são necessários?
Confiança: 65%

USUÁRIO: "variantes primário e secundário, com ícones, três tamanhos"

IA: Entendimento Atualizado:
- Variantes Primário/Secundário
- Suporte a ícones
- Tamanhos Pequeno/Médio/Grande
Confiança: 95%

USUÁRIO: "agent"

IA: ⚡ MODO AGENTE ATIVADO
- Criando componente Button
- Implementando variantes
- Adicionando suporte a ícones
- Testando acessibilidade
```

### Exemplo 2: Corrigindo um Bug
```markdown
USUÁRIO: "plan corrigir o erro de envio do formulário"

IA: 🎯 MODO PLANEJAMENTO ATIVADO
Tarefa Atual: Debugar erro de envio do formulário
Perguntas:
1. Quando o erro ocorre?
2. Alguma mensagem de erro no console?
3. Qual componente de formulário é afetado?
Confiança: 50%

USUÁRIO: "acontece no formulário de login, console mostra erro de validação"

IA: Análise de Cadeia de Pensamento:
1. Validação do formulário de login
2. Verificação de erro no console
3. Regras de validação de entrada
Confiança: 95%

USUÁRIO: "agent"

IA: ⚡ MODO AGENTE ATIVADO
- Debugar validação
- Corrigir tratamento de erro
- Testar envio
```

### Exemplo 3: Configuração do Projeto
```markdown
USUÁRIO: "plan configurar novo projeto Next.js"

IA: 🎯 MODO PLANEJAMENTO ATIVADO
Tarefa Atual: Inicializar projeto Next.js
Perguntas:
1. Qual versão do Next.js?
2. TypeScript ou JavaScript?
3. Quais componentes UI são necessários?
Confiança: 70%

USUÁRIO: "Next.js 14, TypeScript, Shadcn UI"

IA: Estrutura do Projeto:
- Configuração Next.js 14
- Configuração TypeScript
- Integração Shadcn UI
Confiança: 95%

USUÁRIO: "agent"

IA: ⚡ MODO AGENTE ATIVADO
- Criando projeto
- Configurando TypeScript
- Instalando dependências
```

### Exemplo 4: Atualização de Documentação
```markdown
USUÁRIO: "plan atualizar documentação da API"

IA: 🎯 MODO PLANEJAMENTO ATIVADO
Tarefa Atual: Atualizar documentação da API
Perguntas:
1. Quais endpoints precisam de atualizações?
2. Algum novo parâmetro adicionado?
3. Mudanças no formato de resposta?
Confiança: 60%

USUÁRIO: "novos endpoints de autenticação"

IA: Plano de Documentação:
- Endpoints de autenticação
- Formatos de Requisição/Resposta
- Exemplo de uso
Confiança: 95%

USUÁRIO: "agent"

IA: ⚡ MODO AGENTE ATIVADO
- Atualizando documentação
- Adicionando exemplos
- Verificando formatos
```

## 📝 Padrões de Documentação

### Atualizações em Tempo Real
- Memórias: Toda interação
- Lições: Após soluções
- Scratchpad: Durante implementação

### Controle de Versão
```markdown
[v1.0.0] Formato para todas as entradas
- Atualizações de desenvolvimento
- Atualizações manuais
- Rastreamento de progresso
```

### Cruzamento de Referências
```markdown
@memories.md ↔️ @lessons-learned.md ↔️ @scratchpad.md
```

## 🔍 Estrutura de Diretórios
```
.cursor/
├── memories.md          # Histórico de interações
├── lessons-learned.md   # Soluções e práticas
├── scratchpad.md       # Rastreamento da fase atual
├── project-requirements.md  # Especificações do projeto
└── rules/              # Regras do sistema
    └── .cursorrules    # Arquivo de regras principais
```

## 🛠️ Melhores Práticas

1. **Gerenciamento de Memória**
   - Usar timestamps consistentemente
   - Incluir #tags relevantes
   - Cruzar referências de entradas relacionadas
   - Manter formato de linha única

2. **Rastreamento de Tarefas**
   - Gerar IDs únicos de tarefas
   - Rastrear dependências
   - Atualizar status em tempo real
   - Manter hierarquia

3. **Documentação**
   - Atualizar em tempo real
   - Incluir números de versão
   - Cruzar referências de arquivos relacionados
   - Seguir formatos estruturados

## 🎯 Dicas e Truques

### 🔄 Lidando com Problemas de IA e Cursor
1. **Abas Obrigatórias**:
   ```
   1️⃣ Arquivo de trabalho ativo
   2️⃣ Configurações do Cursor (Feature → Resync)
   3️⃣ .cursorrules (para recarregamento automático)
   ```

2. **Processo de Recarregamento Rápido**:
   ```
   1. Ctrl+Shift+P
   2. "Developer: Reload Window"
   3. Aguardar 3-10 segundos
   ```

### 💡 Dicas Profissionais
- Manter arquivo .cursorrules aberto
- Monitorar pontuações de confiança
- Usar gatilhos apropriados
- Seguir formato de versão
- Cruzar referências frequentemente

## 🤝 Contribuindo
Sinta-se livre para melhorar este sistema:
1. Adicionar regras personalizadas
2. Melhorar rastreamento
3. Aprimorar métricas
4. Compartilhar práticas

## 📝 Licença
Licença MIT - Livre para usar e modificar!

## 👋 Contatos / Contrate-me
- Instagram: https://www.instagram.com/clover_nat/
- Facebook: https://www.facebook.com/nathanielmarquez.20
- Twitter: https://x.com/T1nker1220

## 💖 Apoie Este Projeto
Se este sistema te ajuda, considere apoiar:
- PayPal: https://www.paypal.me/JohnNathanielMarquez
- GCash: 09605088715

## 📚 Saiba Mais
Para contexto completo e discussões:
https://forum.cursor.com/t/rules-for-ultra-context-memories-lessons-scratchpad-with-plan-and-act-modes/48792/22?u=t1nker-1220

---

*Nota: Este sistema é projetado para gerenciamento perfeito de interações de IA. Para diretrizes detalhadas de implementação, consulte os arquivos de regras individuais.* 🚀
