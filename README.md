# Atividade Backend — Node.js

## 1. Sobre o projeto

Este projeto foi desenvolvido como parte de uma atividade técnica de backend, com o objetivo de demonstrar conhecimentos em desenvolvimento de APIs REST, autenticação, modelagem de banco de dados, processamento assíncrono, containerização e gerenciamento de transações.

A aplicação utiliza Node.js e Express para disponibilizar endpoints de cadastro, autenticação e checkout. O PostgreSQL é utilizado para persistência dos dados, enquanto o RabbitMQ permite o processamento assíncrono dos pedidos por meio de um worker.

## 2. Tecnologias utilizadas

- **Node.js:** ambiente de execução JavaScript.
- **Express:** desenvolvimento da API REST.
- **PostgreSQL:** banco de dados relacional.
- **node-postgres (pg):** conexão e execução de comandos SQL.
- **JWT:** autenticação baseada em tokens.
- **bcrypt:** geração e validação de hashes de senha.
- **RabbitMQ:** mensageria e processamento assíncrono.
- **Docker:** containerização da aplicação.
- **Docker Compose:** inicialização e integração dos serviços.

## 3. Requisitos implementados

### 3.1. Fluxo de autenticação

Implementação do fluxo de login entre cliente, API Node.js e PostgreSQL, incluindo validação das credenciais e geração de token JWT após autenticação bem-sucedida.

### 3.2. Modelagem do banco de dados

O modelo relacional contempla as seguintes entidades:

- `users`: armazena os dados dos usuários.
- `accounts`: representa as contas vinculadas aos usuários.
- `transactions`: registra as transações associadas às contas.

As relações são estabelecidas por chaves primárias e estrangeiras, garantindo a integridade referencial entre as entidades.

### 3.3. Processamento assíncrono de checkout

O endpoint de checkout recebe o pedido e o encaminha ao RabbitMQ. Um worker consome a mensagem, processa o pedido e persiste o resultado no PostgreSQL.

Essa abordagem desacopla o recebimento da solicitação do processamento posterior.

### 3.4. Containerização

O projeto possui um `Dockerfile` para execução da aplicação Node.js com `npm start` e um arquivo `compose.yaml` para orquestrar os serviços necessários ao ambiente de desenvolvimento.

### 3.5. Transação PostgreSQL

Foi implementada uma função utilizando `node-postgres` para criar um usuário e sua conta vinculada dentro de uma única transação.

A implementação utiliza:

- `BEGIN`: inicia a transação.
- `COMMIT`: confirma as operações.
- `ROLLBACK`: desfaz as alterações em caso de falha.
- `client.release()`: libera a conexão após a execução.

As consultas utilizam parâmetros para evitar a concatenação direta de valores fornecidos pelo usuário no SQL. Os comentários do código explicam as principais decisões de implementação.

## 4. Estrutura do projeto

```text
atividade-backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── env.js
│   ├── database/
│   │   ├── pool.js
│   │   └── user-account.transaction.js
│   ├── messaging/
│   │   └── rabbitmq.js
│   ├── middlewares/
│   │   └── error-handler.js
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js
│       │   ├── auth.repository.js
│       │   ├── auth.routes.js
│       │   └── auth.service.js
│       └── checkout/
│           ├── checkout.controller.js
│           ├── checkout.routes.js
│           └── checkout.service.js
├── worker.js
├── Dockerfile
├── compose.yaml
├── package.json
└── README.md
```

## 5. Pré-requisitos

Para executar o projeto, é necessário ter:

- Git.
- Docker Desktop com Docker Compose.
- Uma ferramenta para realizar requisições HTTP, como Postman, Insomnia ou `curl`.

O PostgreSQL e o RabbitMQ são inicializados pelos containers, conforme a configuração do Docker Compose.

## 6. Como executar o projeto

### 6.1. Clonar o repositório

Substitua `SEU_USUARIO` pelo usuário correspondente ao repositório no GitHub.

```bash
git clone https://github.com/SEU_USUARIO/atividade-backend-nodejs.git
cd atividade-backend-nodejs
```

### 6.2. Configurar o ambiente

Confira as variáveis exigidas em `src/config/env.js`, no `compose.yaml` e nos arquivos de configuração do projeto.

Se a aplicação exigir um arquivo `.env`, crie-o conforme as variáveis esperadas pelo código. Não utilize credenciais de produção.

### 6.3. Iniciar os containers

```bash
docker compose up --build -d
```

O comando constrói a imagem da aplicação, quando necessário, e inicia os serviços definidos no Compose.

### 6.4. Verificar o estado dos serviços

```bash
docker compose ps
```

Confira se a API, o PostgreSQL, o RabbitMQ e o worker estão ativos.

Para acompanhar os logs:

```bash
docker compose logs -f app worker
```

A API deve estar disponível em:

`http://localhost:3000`

### 6.5. Encerrar a aplicação

```bash
docker compose down
```

Esse comando encerra e remove os containers e a rede criada pelo Compose. Os dados persistidos dependem da configuração dos volumes do projeto.

## 7. Como testar a API

As requisições abaixo demonstram os principais fluxos. Os nomes dos campos devem corresponder aos definidos nos controllers e serviços da versão publicada.

### 7.1. Cadastro de usuário

**Método:** `POST`

**Endpoint:** `http://localhost:3000/register`

**Exemplo de corpo JSON:**

```json
{
  "name": "Maria Silva",
  "email": "maria.teste@example.com",
  "password": "SenhaTeste123!"
}
```

**Resultado esperado:** HTTP `201 Created`, indicando que o cadastro foi realizado. A resposta não deve expor o hash da senha.

Utilize um e-mail novo se o sistema impedir cadastros duplicados.

### 7.2. Login

**Método:** `POST`

**Endpoint:** `http://localhost:3000/login`

**Exemplo de corpo JSON:**

```json
{
  "email": "maria.teste@example.com",
  "password": "SenhaTeste123!"
}
```

**Resultado esperado:** HTTP `200 OK` e retorno de um token JWT.

Para validar o tratamento de credenciais inválidas, repita a requisição com uma senha incorreta. O comportamento validado é HTTP `401 Unauthorized`.

### ### 7.3. Testar o checkout

**Método:** `POST`

**Endpoint:** `http://localhost:3000/checkout`

**Cabeçalho:**

```http
Content-Type: application/json
```

**Corpo da requisição:**

```json
{
  "customerName": "Maria Silva",
  "product": "Teclado Mecanico",
  "amount": 249.90
}
```

**Resposta esperada — HTTP 202 Accepted:**

```json
{
  "message": "Checkout recebido para processamento.",
  "order": {
    "customerName": "Maria Silva",
    "product": "Teclado Mecanico",
    "amount": 249.9
  }
}
```

O serviço valida os dados recebidos, normaliza os campos de texto, converte o valor para número e publica o pedido no RabbitMQ.

**Validações realizadas pelo endpoint:**

- Nome do cliente obrigatório e não vazio.
- Produto obrigatório e não vazio.
- Valor deve ser numérico, finito e maior que zero.
- Dados inválidos devem gerar erro HTTP 400.

**Como confirmar o processamento:**

Acompanhe os logs do worker:

```bash
docker compose logs -f worker
```

O worker deve consumir a mensagem e processar o pedido. Para confirmar a persistência, consulte a tabela `orders` no PostgreSQL.

**Importante:** o HTTP 202 indica que a solicitação foi aceita para processamento. A conclusão deve ser confirmada separadamente nos logs e no banco de dados.

{
  "customerName": "",
  "product": "Teclado",
  "amount": -10
}

## 8. Como testar a transação PostgreSQL

O arquivo `src/database/user-account.transaction.js` contém a função `createUserAndAccount`, responsável pela criação do usuário e da conta vinculada.

A função recebe os dados do usuário, incluindo o hash da senha, e o saldo inicial da conta.

### 8.1. Cenário de sucesso

Execute a função com dados válidos.

**Resultado esperado:**

- O usuário é inserido na tabela `users`.
- A conta é inserida na tabela `accounts`, vinculada ao usuário.
- A transação é confirmada com `COMMIT`.

### 8.2. Cenário de falha

Execute a função provocando um erro durante a inserção da conta, por exemplo, utilizando um valor inválido para o saldo em um ambiente de teste.

**Resultado esperado:**

- A operação gera um erro.
- O `ROLLBACK` desfaz as alterações realizadas na transação.
- O usuário inserido naquela tentativa não permanece no banco.

### 8.3. Executar o teste automatizado da transação

O arquivo `test-transaction.js` valida dois cenários:

- **Sucesso:** cria um usuário e sua conta vinculada, verificando o saldo persistido.
- **Falha:** provoca um erro durante a criação da conta e verifica se o usuário criado nessa tentativa foi removido pela transação.

Com os serviços Docker em execução, execute na raiz do projeto:

```bash
node test-transaction.js
```

O arquivo requer as dependências instaladas, incluindo `bcryptjs`, e uma variável `DATABASE_URL` compatível com o ambiente de execução.

Se executar o teste diretamente no computador, fora dos containers, configure a conexão para a porta local do PostgreSQL. No PowerShell, considerando as credenciais do ambiente de desenvolvimento:

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/atividade_db"
node test-transaction.js
```

**Resultados esperados:**

1. O primeiro cenário exibe o usuário e a conta criados, com saldo `100.00`.
2. O segundo cenário exibe o erro provocado pela tentativa de inserir um saldo inválido.
3. A verificação final exibe `Usuário permaneceu após rollback? false`.

Esse último resultado demonstra que a falha na criação da conta também desfaz a inserção do usuário.

O teste utiliza dados de demonstração e gera e-mails únicos a cada execução. Os registros do cenário de sucesso permanecem no banco até serem removidos manualmente.

## 9. Resultados validados durante o desenvolvimento

Durante a validação local, foram verificados os seguintes comportamentos:

| Validação | Resultado |
|---|---|
| Cadastro de usuário | HTTP 201 |
| Login com credenciais válidas | HTTP 200 e JWT |
| Login com senha incorreta | HTTP 401 |
| Envio de checkout | Solicitação aceita para processamento |
| Processamento assíncrono | Worker processou o pedido |
| Persistência do checkout | Pedido registrado no PostgreSQL |
| Transação bem-sucedida | Usuário e conta criados |
| Falha na criação da conta | Rollback confirmado |

Os resultados acima correspondem aos testes executados no ambiente local durante o desenvolvimento. O avaliador pode reproduzir os fluxos seguindo as instruções deste documento.

## 10. Documentação complementar

A documentação complementar da atividade apresenta os diagramas e os trechos de código referentes aos requisitos solicitados:

- Diagrama do fluxo de autenticação.
- Modelo entidade-relacionamento.
- Diagrama de sequência do checkout.
- Dockerfile para execução da aplicação.
- Código da transação PostgreSQL com comentários explicativos.

## 11. Considerações finais

O projeto demonstra a aplicação de conceitos de desenvolvimento backend com Node.js, autenticação, banco de dados relacional, mensageria, processamento assíncrono, Docker e transações SQL.

A implementação busca manter responsabilidades organizadas em módulos e permitir a reprodução dos principais fluxos em um ambiente local de desenvolvimento.