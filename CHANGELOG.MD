**Changelog**

Todas as mudanças neste projeto estarão documentadas neste arquivo.

O formato é baseado no [Mantenha um Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

- [Futuras versões](#futuras-versões)
- [Versão 1.1.0 - 2024-06-19](#versão-110---2024-06-19)
  - [Adicionado](#adicionado)
- [Versão 1.0.0 - 2024-06-19](#versão-100---2024-06-19)
  - [Ordem das ações](#ordem-das-ações)

# Futuras versões

- **Não concluídos**
  - Centralizar os métodos relacionados a `csv` em um arquivo separado.
  - Na primeira vez que tenta baixar a nova lista, o bot não consegue baixá-la.
  - Notificar quando algum erro ocorre. (Seja por discord, email ou alguma outra forma além do terminal)
  - Liberar para que o bot consiga mudar o acesso dos assinantes nas pastas.
  - Pessoas que trocarem de tier, devem perder o acesso a pasta anterior, tendo acesso somente a nova.
  - Mudar o acesso dos assinantes a pasta de recompensas gerais ao mudarem de tier.
- **Concluídos**
  - *2024-06-19*
  - Notificar os assinantes por email somente no primeiro mês de assinatura.
  - Agora é possível obter o id de assinante usando `GetSubInfo()`.
  - *2024-06-20*
  - Adicionada uma verificação final nas duplicatas.
    - Caso ambas as duplicatas estejam inativas, mantenha o registro somente da com o último pagamento mais recente.

# Versão 1.1.0 - 2024-06-19
## Adicionado
- Opção para habilitar ou não as mensagens no terminal.

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