# 🚀 EchoTap - Sistema de Cartões NFC Dinâmicos

Sistema automatizado para configuração de cartões NFC onde os clientes podem configurar seus próprios perfis sem intervenção manual.

## 📋 Como Funciona

### 🔄 Fluxo Anterior (Manual)
1. Cliente compra cartão
2. Você cria manualmente uma página
3. Você configura as rotas
4. Cartão é programado com URL fixa

### ✨ Novo Fluxo (Automático)
1. Cliente compra cartão
2. Cartão vem com URL de configuração: `seusite.com/config/ABC123`
3. Cliente acessa a URL e configura seus dados
4. Sistema gera automaticamente a página: `seusite.com/card/ABC123`
5. Cartão funciona imediatamente após configuração

## 🎯 Funcionalidades

### 📱 Para o Cliente
- **Página de Configuração**: Interface amigável para inserir dados
- **Personalização Completa**: Nome, bio, foto, cores e links
- **Preview em Tempo Real**: Vê como ficará o cartão
- **Múltiplos Links**: Adiciona quantos links quiser
- **Ícones Personalizáveis**: Escolhe ícones para cada link

### 🛠️ Para o Administrador
- **Gerenciador de Cartões**: Visualiza todos os cartões configurados
- **Estatísticas**: Quantos cartões ativos e links totais
- **Ações por Cartão**: Ver, editar, exportar ou excluir
- **Geração Automática**: Cria novos IDs de cartão automaticamente

## 🔧 URLs do Sistema

### Principais Rotas
- `/` - Página inicial da EchoTap
- `/config/:cardId` - Configuração de cartão (ex: `/config/ABC123`)
- `/card/:cardId` - Cartão configurado (ex: `/card/ABC123`)
- `/manager` - Gerenciador de cartões (admin)

### Rotas Existentes (mantidas)
- `/fabriciobettarello`
- `/danielfilgueira`
- `/hbfretamento`
- `/fredsonnunes`
- `/gabrielarodrigues`
- `/thiagoassis`

## 🔥 Integração Firebase

### 🔐 Sistema de Autenticação
- **Login obrigatório** para acessar o gerenciador
- **Autenticação com email/senha**
- **Login com Google** (opcional)
- **Recuperação de senha**
- **Sessões seguras**

### 🗄️ Banco de Dados na Nuvem
- **Firestore Database** para armazenar cartões
- **Backup automático** na nuvem
- **Sincronização em tempo real**
- **Acesso de qualquer dispositivo**
- **Fallback para localStorage** em caso de erro

## 💾 Armazenamento

### Dados Salvos no Firestore + LocalStorage
```json
{
  "name": "Nome do Cliente",
  "bio": "Biografia do cliente",
  "profileImage": "base64_da_imagem",
  "primaryColor": "#2563EB",
  "cardId": "ABC123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isConfigured": true,
  "links": [
    {
      "title": "Meu Website",
      "description": "Site pessoal",
      "icon": "bi-globe",
      "path": "https://exemplo.com",
      "color": "#2563EB",
      "isExternal": true
    }
  ]
}
```

## 🎨 Personalização

### Cores Disponíveis
- Azul: `#2563EB`
- Roxo: `#7C3AED`
- Vermelho: `#DC2626`
- Verde: `#059669`
- Laranja: `#D97706`
- Rosa: `#DB2777`
- Ciano: `#0891B2`
- Índigo: `#4F46E5`

### Ícones Disponíveis
- Website: `bi-globe`
- WhatsApp: `bi-whatsapp`
- Instagram: `bi-instagram`
- LinkedIn: `bi-linkedin`
- GitHub: `bi-github`
- Facebook: `bi-facebook`
- Twitter: `bi-twitter`
- YouTube: `bi-youtube`
- Email: `bi-envelope`
- Telefone: `bi-telephone`

## 🚀 Como Usar

### 0. Configuração Inicial
1. **Configure o Firebase** seguindo `CONFIGURACAO_FIREBASE.md`
2. **Substitua** as credenciais em `/src/config/firebase.js`
3. **Execute** `npm install && npm run dev`

### 1. Para Novos Cartões
1. Acesse `/manager` (será pedido login)
2. **Faça login** ou crie uma conta
3. Clique em "Criar Novo Cartão"
4. Um ID será gerado automaticamente (ex: `ABC123`)
5. Configure o cartão NFC com a URL: `seusite.com/config/ABC123`
6. Entregue o cartão ao cliente

### 2. Cliente Configura
1. Cliente aproxima celular do cartão
2. Abre automaticamente: `seusite.com/config/ABC123`
3. **Sistema pede login** (cliente cria conta ou faz login)
4. Preenche seus dados pessoais
5. Adiciona links desejados
6. Escolhe cores e ícones
7. Clica em "Salvar e Ativar Cartão"
8. **Dados salvos na nuvem** automaticamente
9. É redirecionado para: `seusite.com/card/ABC123`

### 3. Gerenciamento
- Acesse `/manager` para ver todos os cartões
- Visualize estatísticas
- Edite, exporte ou exclua cartões
- Monitore atividade

## 🛠️ Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🔮 Melhorias Futuras

### 🗄️ Backend (Recomendado)
- Substituir localStorage por banco de dados
- API REST para gerenciamento
- Autenticação de administrador
- Analytics de uso

### 📊 Funcionalidades Extras
- QR Code para cada cartão
- Templates pré-definidos
- Integração com redes sociais
- Sistema de notificações
- Backup automático

### 🎯 Integrações
- Google Analytics
- WhatsApp Business API
- Sistema de pagamento
- CRM integration

## 📝 Estrutura dos Arquivos

```
src/
├── pages/
│   ├── ConfigCard.jsx      # Página de configuração
│   ├── DynamicCard.jsx     # Página do cartão configurado
│   ├── CardManager.jsx     # Gerenciador de cartões
│   └── ...
├── css/
│   ├── config.css          # Estilos das novas páginas
│   └── ...
└── main.jsx                # Rotas atualizadas
```

## 🎉 Vantagens do Novo Sistema

### ✅ Para Você
- **Zero Trabalho Manual**: Não precisa mais criar páginas
- **Escalabilidade**: Suporta milhares de cartões
- **Gerenciamento Fácil**: Interface visual para administrar
- **Tempo Economizado**: Foco no negócio, não na programação

### ✅ Para o Cliente
- **Autonomia Total**: Configura quando quiser
- **Personalização**: Controle completo sobre aparência
- **Instantâneo**: Cartão funciona imediatamente
- **Flexibilidade**: Pode alterar dados depois

---

🚀 **Agora seus clientes têm total autonomia para configurar seus cartões NFC!** 