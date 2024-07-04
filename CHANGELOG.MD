**Changelog**

Todas as mudanças neste projeto estarão documentadas neste arquivo.

O formato é baseado no [Mantenha um Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

- [Futuras versões](#futuras-versões)
- [Versão 1.4.0 - 2024-07-04](#versão-140---2024-07-04)
  - [Adicionado](#adicionado)
  - [Modificado](#modificado)
  - [Removido](#removido)
  - [Corrigido](#corrigido)
- [Versão 1.3.0 - 2024-07-03](#versão-130---2024-07-03)
  - [Adicionado](#adicionado-1)
  - [Corrigido](#corrigido-1)
- [Versão 1.2.2 - 2024-06-27](#versão-122---2024-06-27)
  - [Adicionado](#adicionado-2)
  - [Modificado](#modificado-1)
  - [Corrigido](#corrigido-2)
- [Versão 1.1.0 - 2024-06-19](#versão-110---2024-06-19)
  - [Adicionado](#adicionado-3)
- [Versão 1.0.0 - 2024-06-19](#versão-100---2024-06-19)
  - [Ordem das ações](#ordem-das-ações)
___
# Futuras versões

- [ ] Notificar quando algum erro ocorre. (Tem o Error Reporting do próprio google cloud)
- [ ] Liberar para que o bot consiga mudar o acesso dos assinantes nas pastas.

___
# Versão 1.4.0 - 2024-07-04
## Adicionado
  - Criado novo arquivo `subsList.js`, sendo responsável pelo tratamento dos arquivos `csv` e métodos gerais relacionados a lista de assinantes.
  - Adicionada a chamada dos métodos no `subsList.js` ao `InitBot()` no `index.js`.
## Modificado
  - Alguns métodos foram levados para o arquivo `subsList.js`:
    - Como o `TransformCsvIntoJson()`, `GetSubInfo()`, e os métodos relacionados a checagem de duplicatas nas lista de assinantes. (Antes era do `googleDrive.js`)
    - E o `RemoveAndRenameCSVFile()` do `entraCatarse.js`.
  - Limitado a quantidade de tentativas para baixar a nova lista de assinantes para 5.
  - Agora o `TryToDownloadListFile()` não precisa mais do caminho para a pasta `csv`.
## Removido
  - Removida importações não mais usadas no `googleDrive.js`.
## Corrigido
  - Antes o programa não baixava a nova lista de assinantes caso a pasta `csv` estivesse vazia.
___
# Versão 1.3.0 - 2024-07-03
## Adicionado
  - Adicionada informações no `package.json` para a implantação no Google Cloud Run.
## Corrigido
  - Corrigida a requisição da variável `isHeadless` no `entraCatarse.js`.
  - Agora o programa deve esperar a alteração de permissões no Google Drive terminar antes de entrar em dormência.
  - Mais tentativas de baixar o arquivo `csv` da lista de assinantes até o arquivo ser baixado.
  - Corrigido erros de digitação no [README](README.MD).
___
# Versão 1.2.2 - 2024-06-27
## Adicionado
  - Notificar os assinantes por email somente na primeira vez que disponibilizar o acesso.
## Modificado
  - Agora é possível obter o id de assinante usando `GetSubInfo()`.
## Corrigido
  - Adicionada uma verificação final nas duplicatas.
    - Caso ambas as duplicatas estejam inativas, mantenha o registro somente da com o último pagamento mais recente.
  - Agora primeiro retira o acesso dos assinantes as pastas.
  - Quando for remover o acesso, verifica se está ativo ou não:
    - **Se Ativo:** Retirar o acesso de todas as pastas, exceto a de Recompensas Gerais, e a respectiva do seu nível de assinatura.
    - **Se *NÃO* Ativo:** Retira o acesso de ***TODAS*** as pastas.
  - E então libera o acesso **SE ESTIVER ATIVO** a pasta de Recompensas Gerais, e do seu nível.
___
# Versão 1.1.0 - 2024-06-19
## Adicionado
  - Opção para habilitar ou não as mensagens no terminal.
___
# Versão 1.0.0 - 2024-06-19
Essa é a versão inicial do Bot, contendo a automação da autorização dos assinantes do Catarse para o Google Drive.

## Ordem das ações
  - Entra no Catarse.
    - Solicita a lista atualizada dos assinantes.
    - Baixa a lista em `csv`.
    - Deleta a lista antiga e renomea a nova para padronizar.
  - Converte a lista `csv` para `json`.
  - Verifica se há assinantes duplicados.
  - Entra no Google Drive.
    - Muda o acesso das pastas aos assinantes.
  - Fica em "dormência" por 15 minutos, e então repete todo o processo.
