**Changelog**

Todas as mudanças neste projeto estarão documentadas neste arquivo.

Caso queira ver mais detalhes sobre o propósito deste projeto, visite o [ReadMe](./README.MD).

O formato é baseado no [Mantenha um Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

- [Futuras versões](#futuras-versões)
- [Versão 1.8.3 - 2024-09-12](#versão-183---2024-09-12)
- [Versão 1.8.2 - 2024-09-11](#versão-182---2024-09-11)
- [Versão 1.8.1 - 2024-08-27](#versão-181---2024-08-27)
- [Versão 1.8.0 - 2024-08-27](#versão-180---2024-08-27)
- [Versão 1.7.1 - 2024-08-23](#versão-171---2024-08-23)
- [Versão 1.7.0 - 2024-08-19](#versão-170---2024-08-19)
- [Versão 1.6.10 - 2024-08-12](#versão-1610---2024-08-12)
- [Versão 1.6.9 - 2024-08-12](#versão-169---2024-08-12)
- [Versão 1.6.8 - 2024-08-12](#versão-168---2024-08-12)
- [Versão 1.6.7 - 2024-08-11](#versão-167---2024-08-11)
- [Versão 1.4.0 - 2024-07-04](#versão-140---2024-07-04)
- [Versão 1.3.0 - 2024-07-03](#versão-130---2024-07-03)
- [Versão 1.2.2 - 2024-06-27](#versão-122---2024-06-27)
- [Versão 1.1.0 - 2024-06-19](#versão-110---2024-06-19)
- [Versão 1.0.0 - 2024-06-19](#versão-100---2024-06-19)
___
# Futuras versões

- [ ] Notificar quando algum erro ocorre:
  - [x] Utilizar `try` e `catch` para pegar o erro sem crashar o bot.
  - [ ] Notificar o erro. (Discord no futuro, mas no momento pode ser um aviso por email talvez.)
- [ ] Ao iniciar o programa, deve-se fazer uma rápida verificação se as pastas principais existem, caso contrário, crie-as.
  - [ ] `csv`
  - [ ] `DONT_GIT`
  - [ ] `logs`
- [x] [googleDrive.js](./js/googleDrive.js):
  - `loadSavedCredentialsIfExist()` agora registra o erro no log ao invés de só enviar uma mensagem vaga no console.

# Versão 1.8.3 - 2024-09-12
**Adicionado**
- Criado um arquivo `AgerStellas.bat` para fazer o bot rodar localmente.

**Modificado**
- [subsList.js](./js/subsList.js):
  - `RemoveAndRenameCSVFile()` foi dividido em dois métodos (`RemoveOldCSV()` & `RenameCSV()`).
  - `RemoveOldCSV()` adicionada verificação para não ficar sem arquivos na pasta.
  - `RenameCSV()` não vai renomear um arquivo que já foi renomeado.
  - `TransformCsvIntoJson()` Adicionado try catch para resolver o erro de não conseguir transformar o csv em json.
    - *Talvez adicionar uma verificação de só rodar o código caso o arquivo csv exista.*

# Versão 1.8.2 - 2024-09-11
**Modificado**
- Alguns delays foram modificados:
  - O tempo de espera entre cada rodagem do bot: ***300s (5 mins) -> 900s (15 mins)***
  - Cada tentativa de download do arquivo `csv`: ***20s -> 10s***;
  - Delay de remover o antigo `csv`, e renomear o novo: ***5s -> 2.5s***;

# Versão 1.8.1 - 2024-08-27
**Modificado**
- Agora o bot notifica por email quando o assinante recebe o acesso as pastas do drive.
  - Isso resolve o problema de não conseguir compartilhar o acesso a contas que não tem acesso ao google drive normalmente.

# Versão 1.8.0 - 2024-08-27
**Adicionado**
- Adicionada funcionalidade para atualizar um arquivo de texto com os nomes dos assinantes ativos.

**Modificado**
- `subsList.GetSubInfo()` agora retorna o nome público, nome completo, e se o assinante é anonimo.

# Versão 1.7.1 - 2024-08-23
**Modificado**
- Antes de criar um novo arquivo de log, verifica se há uma pasta logs no diretório.
  - Caso não tenha, crie a pasta.

# Versão 1.7.0 - 2024-08-19
**Adicionado**
- Criado sistema básico para registro de eventos.
  - Inicialmente é registrado novas rodagens, e alguns possíveis erros, mas não todos.

**Modificado**
- A tabela de conteúdo do `CHANGELOG` agora está mais enxuta.

# Versão 1.6.10 - 2024-08-12
**Modificado**
- Agora o bot avisa quando começa a rodar novamente.
  - Junto disso, ele salva o novo horário de rodagem para o `getLastRuntime.js`.

# Versão 1.6.9 - 2024-08-12
**Modificado**
- Ao mandar uma mensagem de confirmação da alteração de acesso do assinante a alguma pasta, era mencionada o nome da pasta de recompensa do assinante, e não a qual ele havia perdido/ganhado acesso.
  - Agora deve mostrar corretamente qual o nome da pasta que sofreu a alteração.

# Versão 1.6.8 - 2024-08-12
**Modificado**
- Diminuído o tempo da tentativa de baixar o novo arquivo `csv`. (30s -> 20s).

**Corrigido**
- Antes de remover o acesso do assinante a pasta do drive, agora o bot verifica se a pasta atual do loop tem o mesmo id que a pasta de recompensas do assinante.

# Versão 1.6.7 - 2024-08-11
**Adicionado**
- Liberado o bot para alterar o acesso as pastas de recompensas. (Ainda não foi tirado o acesso por link direto)
- Adicionada uma verificação no `StartCatarse()` para confirmar se a página do browser está correta.
- Adicionado um argumento extra ao inciar o puppeteer. ( -> `--no-sandbox`)
- Criado o `getLastRuntime.js` para armazenar qual foi a última data e horário que o bot rodou. (É preciso criar logs que contenham mais informações sobre aquela rodagem.)
- Criado o `UserHasAccessToFolder()` para descobrir se determinado email tem acesso a determinada pasta.
- No `GiveAccessToFolders()` foi adicionada a verificação do `UserHasAccessToFolder()` para não causar problemas de liberar novamente o acesso para alguém que já tem acesso individual.
- Novo comentário no `googleDrive.js` pedindo pra fazer uma verificação de ID da pasta antes de retirar o acesso, já que algumas pastas são compartilhadas entre diferentes tiers de assinatura.
- No `BulkChangeSubsAccess()`, foi adicionado comentário sobre o erro de compartilhar o arquivo com email que não estão vinculados de forma alguma com uma Conta do Google.
- Adicionado comentário no `entraCatarse.js` para lembrar de usar `try` e `catch` para não crashar o bot.
- Criado o script `testeDoBot.js` para realizar testes sem o problema de acabar enviado ao repositório.
- `SaveLastRuntime()` agora printa no console quando ele está salvando a última data/horário. 

**Modificado**
- Agora o `SomethingWentWrong()` requer o argumento de `page` do puppeteer para poder tirar uma screenshot da página.
- Diminuido o tempo de espera entre cada atualização do bot. (15 mins -> 10 mins)
- No `RemoveAccessFromAllFolders()`, agora usa a verificação do `UserHasAccessToFolder()` para saber se o assinante tem acesso aquela pasta no loop.
- `UnshareFolder()` agora requer `subInfo` ao invés do email direto da pessoa como argumento.
  - Também alterado o print de retorno para mostrar o tier de assinatura junto do ID da pasta no drive.

**Removido**
- Retirado o `BulkChangeAccess()` do `GoogleDriveTest()`. (Método de testes do módulo)
- No `BulkChangeSubsAccess()`, foi removido comentários dizendo que não se pode alterar o acesso as pastas no drive.
- Retirado `process.exit(1)` do `InitBot()` para que o bot continue rodando sem finalizar.
- Removido o `ExitProgram()` e o `TesteDoBot()` do `index.js`, e enviado ao novo arquivo `testeDoBot.js` fora do controle de versão.

**Corrigido**
- Agora o `ProgramCooldown()` usa o `RepeatBot()` ao invés de só atualizar o google drive com `googleDrive.UpdateDrive()`.
- Arrumado um typo.
- O print de retorno do `ShareFolder()` agora mostra o email ao invés do nome da pessoa, e mostra o tier de assinatura junto do ID da pasta no drive.
- Removido um espaço desnecessário num print de console dentro do `DownloadCooldown`.
- A chamada do `ProgramCooldown()` dentro do próprio método não estava sendo enviada com o argumento `catarse` que o faz funcionar.

# Versão 1.4.0 - 2024-07-04
**Adicionado**
  - Criado novo arquivo `subsList.js`, sendo responsável pelo tratamento dos arquivos `csv` e métodos gerais relacionados a lista de assinantes.
  - Adicionada a chamada dos métodos no `subsList.js` ao `InitBot()` no `index.js`.

**Modificado**
  - Alguns métodos foram levados para o arquivo `subsList.js`:
    - Como o `TransformCsvIntoJson()`, `GetSubInfo()`, e os métodos relacionados a checagem de duplicatas nas lista de assinantes. (Antes era do `googleDrive.js`)
    - E o `RemoveAndRenameCSVFile()` do `entraCatarse.js`.
  - Limitado a quantidade de tentativas para baixar a nova lista de assinantes para 5.
  - Agora o `TryToDownloadListFile()` não precisa mais do caminho para a pasta `csv`.

**Removido**
  - Removida importações não mais usadas no `googleDrive.js`.

**Corrigido**
  - Antes o programa não baixava a nova lista de assinantes caso a pasta `csv` estivesse vazia.

# Versão 1.3.0 - 2024-07-03
**Adicionado**
  - Adicionada informações no `package.json` para a implantação no Google Cloud Run.

**Corrigido**
  - Corrigida a requisição da variável `isHeadless` no `entraCatarse.js`.
  - Agora o programa deve esperar a alteração de permissões no Google Drive terminar antes de entrar em dormência.
  - Mais tentativas de baixar o arquivo `csv` da lista de assinantes até o arquivo ser baixado.
  - Corrigido erros de digitação no [README](README.MD).

# Versão 1.2.2 - 2024-06-27
**Adicionado**
  - Notificar os assinantes por email somente na primeira vez que disponibilizar o acesso.

**Modificado**
  - Agora é possível obter o id de assinante usando `GetSubInfo()`.

**Corrigido**
  - Adicionada uma verificação final nas duplicatas.
    - Caso ambas as duplicatas estejam inativas, mantenha o registro somente da com o último pagamento mais recente.
  - Agora primeiro retira o acesso dos assinantes as pastas.
  - Quando for remover o acesso, verifica se está ativo ou não:
    - **Se Ativo:** Retirar o acesso de todas as pastas, exceto a de Recompensas Gerais, e a respectiva do seu nível de assinatura.
    - **Se *NÃO* Ativo:** Retira o acesso de ***TODAS*** as pastas.
  - E então libera o acesso **SE ESTIVER ATIVO** a pasta de Recompensas Gerais, e do seu nível.

# Versão 1.1.0 - 2024-06-19
**Adicionado**
  - Opção para habilitar ou não as mensagens no terminal.

# Versão 1.0.0 - 2024-06-19
Essa é a versão inicial do Bot, contendo a automação da autorização dos assinantes do Catarse para o Google Drive.

**Ordem das ações**
  - Entra no Catarse.
    - Solicita a lista atualizada dos assinantes.
    - Baixa a lista em `csv`.
    - Deleta a lista antiga e renomea a nova para padronizar.
  - Converte a lista `csv` para `json`.
  - Verifica se há assinantes duplicados.
  - Entra no Google Drive.
    - Muda o acesso das pastas aos assinantes.
  - Fica em "dormência" por 15 minutos, e então repete todo o processo.
