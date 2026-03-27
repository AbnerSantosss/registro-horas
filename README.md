<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Banner do Projeto" width="100%" />

  <br />
  <br />

  <h1>⏰ Registro de Horas</h1>
  
  <p>
    <strong>Sistema completo para gestão de horas de equipes e projetos.</strong>
  </p>
</div>

<br />

## 📋 Sobre o Projeto

O **Registro de Horas** é uma plataforma desenvolvida para facilitar o controle de ponto, gerenciamento de projetos e análise de produtividade das equipes. O sistema provê um painel intuitivo para usuários lançarem suas horas diárias e gerentes avaliarem as métricas de trabalho.

Dividido em um ecossistema com um backend em Node.js veloz acoplado a um banco de dados relacional e um frontend moderno com React.

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura:** Login, Logout e gestão de JWT seguro.
- 🕒 **Registro de Ponto:** Marcação de entradas, saídas e pausas com histórico.
- 📊 **Dashboards Inteligentes:** Gráficos e painéis informativos de controle de horas por usuário e equipe.
- ✉️ **Comunicação por E-mail:** Envio automatizado de lembretes e e-mails aos membros integrados com a plataforma.
- 📱 **Interface Responsiva:** Uma UI adaptada tanto para smartphones quanto telas grandes, desenhada elegantemente com o Tailwind.

## 💻 Tecnologias Utilizadas

A stack foi cuidadosamente escolhida para oferecer escalabilidade, segurança e excelente experiência de desenvolvimento:

**🚀 Frontend**
- **React.js** + **Vite**
- **Tailwind CSS** para estilização
- **Framer Motion** para animações
- **TypeScript** 

**⚙️ Backend**
- **Node.js** + **Express**
- **Prisma ORM**
- **TiDB (MySQL)**
- **Zod & JWT** para validação e autenticação

---

## 🚀 Como rodar o projeto localmente

Siga o passo a passo abaixo para rodar o ambiente de desenvolvimento em sua máquina.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (versão 18+)
- Banco de dados MySQL/MariaDB (ou conta TiDB)

### 1. Clonando o repositório
```bash
git clone https://github.com/AbnerSantosss/registro-horas.git
cd registro-horas
```

### 2. Configurando o Ambiente
Copie o arquivo `.env.example` do diretório raiz do backend para gerar os arquivos contendo os segredos. 
- Defina o `DATABASE_URL` no `.env` do backend com suas credenciais do banco de dados (TiDB Serverless/MySQL2).
- Preencha o `JWT_SECRET` para habilitar processos vitais do back.

### 3. Instalando e Executando
O projeto utiliza a biblioteca **concurrently** para facilitar o seu dia, subindo front e back juntos.

```bash
# Na raiz do projeto, instale todas as dependências do Frontend e Backend:
npm run install:all

# Rode o sistema inteiro com um único comando:
npm run dev
```
> O backend rodará nativamente na sua porta tradicional local, enquanto o frontend iniciará pelo Vite em `http://localhost:5173`. 

<br />

<div align="center">
  Feito com dedicação e propósito. 🚀
</div>
