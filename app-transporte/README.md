# App Web Transportadoras

Sistema de gestão para transportadoras e motoristas, desenvolvido com Next.js, Prisma e PostgreSQL.

## Funcionalidades

- 🚚 **Gestão de Transportadoras**: Cadastro e gerenciamento de empresas transportadoras
- 👥 **Gestão de Motoristas**: Registro e validação de motoristas vinculados às transportadoras
- 🛣️ **Controle de Viagens**: Planejamento e acompanhamento de viagens
- 💰 **Gestão Financeira**: Controle de receitas, despesas e acertos
- 🔐 **Sistema de Autenticação**: Login seguro com JWT para transportadoras e motoristas
- 📊 **Dashboard**: Visão geral das operações e métricas

## Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: JWT com cookies httpOnly
- **UI Components**: Radix UI, Lucide Icons

## Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/RafaelDeMello/AppWebTransportadoras.git
cd AppWebTransportadoras/app-transporte
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (gere uma segura!)
- Configurações do Supabase (se aplicável)

### 4. Execute as migrações do banco
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Inicie a aplicação

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

## Deploy

### Vercel (Recomendado)
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático!

### Docker
```bash
# Build da imagem
docker build -t app-transportadoras .

# Executar container
docker run -p 3000:3000 --env-file .env app-transportadoras
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── login/             # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── motoristas/        # Gestão de motoristas
│   ├── viagens/           # Gestão de viagens
│   ├── receitas/          # Gestão de receitas
│   ├── despesas/          # Gestão de despesas
│   └── acertos/           # Gestão de acertos
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
└── generated/             # Arquivos gerados (Prisma)
```

## Modelos de Dados

- **Transportadora**: Empresas do sistema
- **Motorista**: Motoristas vinculados às transportadoras  
- **Viagem**: Viagens planejadas/executadas
- **Receita**: Receitas por viagem
- **Despesa**: Despesas por viagem
- **Acerto**: Acertos financeiros entre transportadora e motorista
- **Usuario**: Sistema de autenticação

## Segurança

- Autenticação JWT com cookies httpOnly
- Middleware de proteção de rotas
- Validação de dados com Zod
- Filtros de acesso por tipo de usuário
- Senhas criptografadas com bcrypt

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub.
