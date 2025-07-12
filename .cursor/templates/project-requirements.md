`Regras de Requisitos do Projeto *@docs/project-requirements.md* Você usará ferramentas de base de código para saber quais são os detalhes dos arquivos deste diretório *@docs/project-requirements.md* para verificar os requisitos do projeto e os padrões do projeto que você precisa seguir. Este será o guia para você garantir que está seguindo os padrões do projeto. Então certifique-se de ler isso ao planejar e implementar o projeto para evitar duplicações, conflitos e erros. Não toque nessa pasta e arquivos, você apenas lerá. Não exagere ao ponto de não estar seguindo os requisitos do projeto. NÃO REMOVA ESTA LINHA 1!!!!`


# Requisitos do Projeto Website de Contabilidade

## Funcionalidades Principais
1. **Motor de Cálculo**
   - Análise de índices financeiros
   - Cálculos de depreciação (linha reta e saldo decrescente)
   - Cálculos de impostos
   - Análise de ponto de equilíbrio
   - Projeções de fluxo de caixa

2. **Gerador de Demonstrações Financeiras**
   - Modelos de balanço patrimonial
   - Construtor de demonstração de resultados
   - Assistente de demonstração de fluxo de caixa
   - Criação de relatórios personalizados

3. **Colaboração em Tempo Real**
   - Edição multi-usuário
   - Controle de versão
   - Rastreamento de mudanças
   - Trilhas de auditoria

4. **Gerenciamento de Dados**
   - Importação/exportação CSV/Excel
   - Capacidades de sincronização em nuvem
   - Regras de validação de dados
   - Comparação de dados históricos

## Especificações Técnicas
**Frontend:**
- Abordagem mobile first
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- Recharts (visualização de dados)
- Math.js (cálculos)
- Zustand (gerenciamento de estado)
- Framer motion (animação)

**Backend:**
- Rotas API do Next.js
- Supabase (Banco de Dados PostgreSQL)
- Supabase Auth
- Supabase Realtime
- Supabase Storage (para arquivos)
- Prisma ORM (opcional)
- Zod (validação)

**Integrações Principais:**
- Taxas de impostos: Supabase Edge Functions (autocontido)
- Taxas de câmbio: Extensões PostgreSQL do Supabase
- Exportação PDF: Supabase Storage + React-PDF
- Manipulação CSV: Supabase Import/Export

## Requisitos de Segurança
1. Criptografia AES-256 para dados em repouso
2. TLS 1.3 para dados em trânsito
3. Controle de acesso baseado em função (RBAC)
4. Registro de atividades e trilhas de auditoria
5. Conformidade SOC 2 (Fase Futura)

## Requisitos de Conformidade
- Verificações de conformidade GAAP/IFRS
- Atualizações de regulamentação fiscal
- Políticas de retenção de dados
- Acessibilidade (WCAG 2.1 AA)
- Arquitetura pronta para GDPR

## Padrões de Documentação
1. Comentários TSDoc inline para todos os cálculos
2. Especificação OpenAPI para APIs
3. Diagramas ER para esquema de banco de dados
4. Documentação de trilha de auditoria
5. Registro de fórmulas financeiras

## Roteiro do Projeto (Sequência de Implementação Atualizada)

### Fase 1 - Funcionalidades Principais de Contabilidade (2-3 semanas)
**Ordem de Implementação**:
1. **Configuração da Infraestrutura do Projeto** (1 dia)
   - Inicialização do Supabase
   - Boilerplate Next.js com TypeScript
   - Estrutura de componentes principais
   - Configuração de boundary de erro

2. **Fundação do Motor de Cálculo** (5 dias)
   - [ ] Integração Math.js
   - [ ] Calculadora de depreciação (linha reta)
   - [ ] Fórmulas de índices financeiros
   - [ ] Sistema de validação de cálculos
   - [ ] Configuração de testes unitários

3. **Modelos de Demonstrações Financeiras** (4 dias)
   - [ ] Componente de balanço patrimonial
   - [ ] Construtor de demonstração de resultados
   - [ ] Funcionalidade de exportação PDF
   - [ ] Esquemas de validação de dados

4. **Gerenciamento Local de Dados** (3 dias)
   - [ ] Integração de armazenamento local
   - [ ] Configuração de criptografia de dados
   - [ ] Versionamento histórico
   - [ ] Exportação CSV (básica)

5. **Fundação UI/UX** (3 dias)
   - [ ] Layout responsivo mobile-first
   - [ ] Componentes de formulário acessíveis
   - [ ] Visualização de dados (Recharts)
   - [ ] Suporte ao modo escuro
   - [ ] Estados de carregamento/erro

6. **Segurança Básica** (2 dias)
   - [ ] Sanitização de entrada
   - [ ] Registro de auditoria
   - [ ] Limitação de taxa
   - [ ] Boundaries de erro

### Fase 2 - Gerenciamento de Dados (1-2 semanas)
**Prioridade**: ★★★☆☆
**Ordem de Implementação**:
1. **Sistema de Autenticação** (3 dias)
   - [ ] Configuração auth do Supabase
   - [ ] Gerenciamento de perfil do usuário
   - [ ] Gerenciamento de sessão
   - [ ] Funções RBAC básicas

2. **Migração de Dados para Nuvem** (4 dias)
   - [ ] Esquema de banco de dados Supabase
   - [ ] Ferramenta de migração Local → Nuvem
   - [ ] Criptografia de dados em repouso
   - [ ] Resolução de conflitos

3. **Manipulação Avançada de CSV** (3 dias)
   - [ ] Importação/exportação em lote
   - [ ] Regras de validação de dados
   - [ ] Sistema de templates
   - [ ] Relatório de erros

### Fase 3 - Funcionalidades de Colaboração (2 semanas)
**Prioridade**: ★★☆☆☆
**Ordem de Implementação**:
1. **Fundação Realtime** (3 dias)
   - [ ] Configuração Supabase Realtime
   - [ ] Indicadores de presença
   - [ ] Co-edição básica
   - [ ] Status de conexão

2. **Controle de Versão** (4 dias)
   - [ ] Rastreamento de mudanças
   - [ ] Histórico de versões
   - [ ] Sistema de snapshot
   - [ ] Funcionalidade de rollback

3. **Ferramentas de Colaboração** (3 dias)
   - [ ] Sistema de comentários
   - [ ] @menções
   - [ ] Notificações
   - [ ] Feed de atividades

------`não leia e implemente esta fase 4, isso é apenas para você saber as funcionalidades futuras que implementaremos`------
### Fase 4 - Funcionalidades Avançadas (Opcional)
**Prioridade**: ★☆☆☆☆
**Ordem de Implementação**:
1. **Integrações Bancárias** (5 dias)
   - [ ] Configuração sandbox Plaid
   - [ ] Importação de transações
   - [ ] Ferramentas de reconciliação
   - [ ] Handlers de webhook

2. **Multi-moeda** (3 dias)
   - [ ] Sistema de taxa de câmbio
   - [ ] Conversor de moeda
   - [ ] Localização
   - [ ] Cálculo de ganho/perda FX

3. **Automação** (4 dias)
   - [ ] Motor de regras fiscais
   - [ ] Relatórios agendados
   - [ ] Verificações de conformidade
   - [ ] Trilhas de auditoria

4. **Relatórios Avançados** (3 dias)
   - [ ] Templates personalizados
   - [ ] Visualização de dados
   - [ ] Dashboards executivos
   - [ ] Formatos de exportação

------`não leia e implemente esta fase 4, isso é apenas para você saber as funcionalidades futuras que implementaremos`------

## Análise de Custos
| Funcionalidade   | Serviço Supabase        | Limites do Plano Gratuito     |
|------------------|--------------------------|-------------------------------|
| Banco de Dados   | PostgreSQL               | 500MB banco + 1GB banda       |
| Auth             | Autenticação             | 50k MAUs                      |
| Realtime         | Atualizações Realtime    | 50 conexões simultâneas       |
| Storage          | Armazenamento de Arquivos| 1GB armazenamento, 1M downloads|
| Edge Functions   | Funções Serverless       | 500k invocações/mês           |
| Vector           | Extensões PostgreSQL     | Gratuito com banco de dados   |

## Benefícios da Implementação
1. Provedor único para todas as necessidades de backend
2. Sistema de autenticação unificado
3. Integração direta banco de dados <> armazenamento
4. Faturamento e monitoramento simplificados
5. Limitação de taxa e segurança integradas

## Diretrizes de Arquitetura

### 1. Estrutura Modular
```
src/
├── app/               # Next.js app router
├── components/        # Componentes UI reutilizáveis
│   ├── core/          # Componentes base (botões, inputs)
│   ├── accounting/    # Componentes específicos do domínio
│   └── shared/       # Componentes entre funcionalidades
├── lib/
│   ├── api/           # Clientes API
│   ├── hooks/         # Hooks customizados
│   ├── utils/         # Funções auxiliares
│   └── validation/    # Esquemas Zod
├── types/             # Tipos TS globais
```

### 2. Separação Servidor/Cliente
- **Componentes Servidor**: Padrão para componentes servidor para:
  - Busca de dados
  - Operações sensíveis
  - Conteúdo estático
- **Componentes Cliente**: Use apenas quando necessário para:
  - Interatividade
  - APIs do navegador
  - Gerenciamento de estado

### 3. Componentes Reutilizáveis
1. Crie componentes atômicos com:
   - PropTypes usando interfaces TypeScript
   - Histórias Storybook para documentação
   - Atributos de acessibilidade por padrão
2. Siga convenção de nomenclatura:
   - `NomeComponenteFuncionalidade.tsx` (ex: `CalculadoraDepreciacao.tsx`)
   - `NomeComponenteCore.tsx` (ex: `InputFormulario.tsx`)

### 4. Regras de Design de API
- Endpoints versionados: `/api/v1/...`
- Estrutura RESTful para recursos
- Padronização de formato de erro:
  ```ts
  interface ErroAPI {
    codigo: string;
    mensagem: string;
    detalhes?: Record<string, unknown>;
  }
  ```
