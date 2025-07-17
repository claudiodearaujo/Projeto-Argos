# Template Angular - Frontend

## 🎯 Configuração Inicial

### Angular CLI
```bash
npm install -g @angular/cli
ng new projeto-angular --routing --style=scss --strict
cd projeto-angular
ng serve
```

### Package.json Essencial
```json
{
  "name": "projeto-angular",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.7.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.2.0"
  }
}
```

### Estrutura de Pastas
```
src/
├── app/
│   ├── components/
│   │   ├── shared/
│   │   └── features/
│   ├── services/
│   ├── models/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── assets/
├── environments/
└── styles/
```

### Angular.json (Configuração Principal)
```json
{
  "projects": {
    "projeto-angular": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/projeto-angular",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}
```

## 🏗️ Padrões de Desenvolvimento

### Componentes
- Use Angular CLI: `ng generate component nome-componente`
- Implemente OnInit, OnDestroy
- Use ChangeDetectionStrategy.OnPush quando possível
- Documente com JSDoc

### Serviços
- Use Angular CLI: `ng generate service nome-servico`
- Implemente providedIn: 'root'
- Use RxJS para operações assíncronas
- Tratamento de erros obrigatório

### Roteamento
- Configure lazy loading
- Use guards para proteção de rotas
- Implemente resolvers para pré-carregamento

### Formulários
- Use Reactive Forms
- Implemente validação customizada
- Use FormBuilder para construção

## 📦 Bibliotecas Recomendadas

### UI/UX
- Angular Material
- PrimeNG
- Ng-Bootstrap

### Utilitários
- Lodash
- Moment.js / date-fns
- Chart.js / ng2-charts

### Testes
- Jasmine + Karma (padrão)
- Protractor (E2E)
- Cypress (alternativa E2E)

## 🔧 Configuração TypeScript
```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  }
}
```

## 🚀 Comandos Úteis

### Geração de Código
```bash
ng generate component components/nome-componente
ng generate service services/nome-servico
ng generate module modules/nome-modulo --routing
ng generate guard guards/nome-guard
ng generate pipe pipes/nome-pipe
```

### Build e Deploy
```bash
ng build --configuration production
ng test --watch=false --browsers=ChromeHeadless
ng lint
ng e2e
``` 