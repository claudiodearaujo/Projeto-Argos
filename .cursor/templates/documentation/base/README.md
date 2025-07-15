# 🔍 Profile Watcher Web

Sistema web moderno para monitoramento e gerenciamento de perfis de usuários, desenvolvido em Angular 19.2.0 com PrimeNG.

## 🚀 **Visão Geral**

O Profile Watcher Web é uma aplicação Angular robusta que oferece funcionalidades completas de gerenciamento de perfis com autenticação segura, validação de formulários e interface responsiva. Construído com arquitetura modular e padrões de desenvolvimento modernos.

## ✨ **Funcionalidades**

### 🔐 **Autenticação**

- Sistema de login/logout seguro
- Autenticação JWT
- Proteção de rotas com guards
- Interceptors para tratamento de tokens
- Registro de novos usuários

### 👥 **Gerenciamento de Perfis**

- Listagem completa de perfis
- Visualização detalhada de perfis
- Formulários de criação e edição
- Operações CRUD completas
- Validação robusta de dados

### 🎨 **Interface**

- Design responsivo e moderno
- Componentes PrimeNG
- Navegação intuitiva
- Validação visual de formulários
- Feedback consistente ao usuário

## 🛠️ **Stack Tecnológico**

### **Frontend**

- **Framework**: Angular 19.2.0
- **UI Library**: PrimeNG 19.0.9
- **Linguagem**: TypeScript
- **Build Tool**: Angular CLI
- **Styling**: CSS/SCSS

### **Principais Dependências**

- `@angular/core`: ^19.2.0
- `@angular/forms`: ^19.2.0
- `@angular/router`: ^19.2.0
- `primeng`: ^19.0.9
- `rxjs`: ~7.8.0

### **Desenvolvimento**

- Docker + Docker Compose
- ESLint + Prettier
- Jasmine + Karma (Testing)
- TypeScript (Strict mode)

## 🏗️ **Arquitetura**

### **Estrutura Modular**

```
src/app/
├── core/                    # Funcionalidades essenciais
│   ├── components/         # Componentes de validação
│   ├── guards/            # Guards de autenticação
│   ├── interceptors/      # Interceptors HTTP
│   ├── models/           # Interfaces e tipos
│   └── services/         # Serviços principais
├── features/              # Módulos de funcionalidades
│   ├── profiles/         # Gerenciamento de perfis
│   └── user/            # Autenticação e usuário
└── shared/               # Componentes compartilhados
    ├── components/       # Componentes reutilizáveis
    └── layout/          # Layout principal
```

### **Padrões Implementados**

- Lazy Loading de módulos
- Reactive Forms
- Guards de proteção
- Interceptors HTTP
- Sistema de validação consistente

## 🚀 **Início Rápido**

### **Pré-requisitos**

- Node.js 18+
- Angular CLI 19+
- Docker (opcional)

### **Instalação**

```bash
# Clonar o repositório
git clone <repository-url>
cd ProfileWatcherWeb

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start
```

### **Comandos Disponíveis**

```bash
npm start              # Desenvolvimento (ng serve)
npm run build         # Build de produção
npm test              # Executar testes
npm run lint          # Verificar código
```

### **Docker**

```bash
# Desenvolvimento
docker-compose up

# Build para produção
docker build -t profile-watcher-web .
```

## 🔧 **Configuração**

### **Ambiente de Desenvolvimento**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
};
```

### **Ambiente de Produção**

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.profilewatcher.com",
};
```

## 🧪 **Testes**

### **Executar Testes**

```bash
# Testes unitários
ng test

# Testes em modo watch
ng test --watch

# Testes com coverage
ng test --code-coverage
```

### **Estrutura de Testes**

- Unit tests: Jasmine + Karma
- Coverage mínimo: 80%
- Testes de componentes e serviços

## 📦 **Deploy**

### **Build de Produção**

```bash
ng build --configuration production
```

### **Docker Deploy**

```bash
# Build da imagem
docker build -t profile-watcher-web .

# Executar container
docker run -p 80:80 profile-watcher-web
```

## 🔒 **Segurança**

- Autenticação JWT
- Proteção de rotas
- Sanitização de inputs
- Interceptors de segurança
- Validação client-side e server-side

## 📱 **Responsividade**

- Mobile-first design
- Breakpoints otimizados
- Componentes adaptativos
- Touch-friendly interface

## ♿ **Acessibilidade**

- Padrões WCAG 2.1
- Navegação por teclado
- Screen reader support
- Contraste adequado
- Labels descritivos

## 📈 **Performance**

- Lazy loading de módulos
- OnPush change detection
- Tree shaking automático
- Otimização de assets
- SSR com Angular Universal

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 **Documentação**

- [Arquitetura](./ARCHITECTURE.md) - Documentação técnica detalhada
- [Changelog](./CHANGELOG.md) - Histórico de mudanças
- [Requisitos](./docs/project-requirements.md) - Requisitos do projeto

## 📝 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 **Suporte**

Para dúvidas ou problemas:

- Abra uma issue no GitHub
- Consulte a documentação técnica
- Verifique os exemplos de uso

---

**Desenvolvido com ❤️ usando Angular + PrimeNG**
