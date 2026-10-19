# Sistema de Gestão e Emissão de Recibos de Material - Corpo de Bombeiros (6º GB - 3º SGB)

Sistema web operacional para o Almoxarifado/Intendência (B4) do Corpo de Bombeiros, automatizando o controle, emissão, assinatura digital flexível (rubrica na tela OU autenticação via conta Google/Gmail) e impressão oficial de recibos de carga de materiais.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisão Atualizada sobre Assinatura**: O militar receptor pode escolher livremente a forma de validação que preferir:
> - **Opção A - Rubrica Digital**: Desenhar a assinatura na tela (touch no celular ou mouse no computador).
> - **OU Opção B - Autenticação Google / Gmail**: Validar o recebimento com 1 clique usando sua conta Google (`@gmail.com` ou corporativa), registrando e-mail, nome, data e hora com carimbo eletrônico.
>
> Ambas as opções geram o recibo autenticado pronto para visualização, guarda e impressão em padrão oficial A4.

- **Armazenamento**: Banco de dados na nuvem com sincronização em tempo real (Firebase Firestore) e autenticação.
- **Link/QR Code no Celular**: O encarregado de B4 pode gerar o QR Code ou copiar o link direto do recibo (para enviar via WhatsApp) para que o receptor assine diretamente pelo celular sem precisar usar o computador do quartel.
- **Base Inicial**: Iniciação limpa e ágil para novos recibos, com catálogo inteligente pré-carregado de materiais típicos do Corpo de Bombeiros (Pás de DEA, Talões de ocorrência, Cilindros de AR/EPR Dräger e MSA, Coletes Balísticos, Lanternas Nightstick, Pranchas, AMBU, LGE, etc.) e estações do 6º GB / 3º e 4º SGB (EB Praia Grande, EB São Vicente, EB Itanhaém, BB Rio Branco, EB Registro, Peruíbe, Iguape, Jacupiranga, Mongaguá, etc.).

---

## 1. Overview & Core Concept

- **O que faz**: Permite cadastrar a entrega de materiais entre quartéis e militares, gerar o recibo numerado oficial no padrão militar `Recibo Nº 6GB-3ºSGB-B4-XXXX/300/26`, colher a assinatura de forma flexível (rubrica touch OU login Google) e imprimir a via oficial em folha A4 com brasão e termos legais.
- **Público-alvo**: Militares do 6º Grupamento de Bombeiros (B4, almoxarifado, comandantes de guarnição e socorristas).
- **Valor agregado**: Elimina o papel manual, impede perda de comprovantes de materiais controlados e agiliza a conferência de transferências entre estações de bombeiros.

---

## 2. User Experience & Visual Design

### Fluxos Principais do Usuário
1. **Painel de Controle e Histórico**:
   - Lista organizada de recibos com numeração, data, estação de destino, militar recebedor e status (Assinado ou Pendente).
   - Busca em tempo real por material (ex: busca por "DEA" ou número de série do cilindro), estação ou militar.
   - Filtros rápidos por período e estação.
2. **Emissão de Novo Recibo**:
   - Geração automática da numeração sequencial do ano corrente.
   - Preenchimento rápido da estação e entregador (CB PM SEDREZ, CB PM MOLINA, etc.).
   - Dados do recebedor (Posto/Graduação, RE e Nome).
   - Inserção dinâmica de materiais com unidades (Unid, CX, Lts) e quantidades.
   - Campo para detalhes e observações específicas (talões de chamado, números de série, testes de funcionamento).
3. **Assinatura Flexível (Tela OU Conta Google)**:
   - Ao clicar em "Coletar Assinatura" ou abrir pelo link/QR Code no celular:
     - **Aba 1 - Assinatura na Tela**: Canvas touch suave para rubricar com o dedo ou caneta stylus no smartphone.
     - **Aba 2 - Assinar com Conta Google**: Botão de login do Google; ao conectar sua conta, o sistema registra "Assinado digitalmente por [Nome/Email do militar receptor] em [Data e Hora]".
4. **Impressão e PDF Oficial A4**:
   - Layout formal do Corpo de Bombeiros da PMESP com cabeçalho institucional.
   - Quadro organizado dos materiais transferidos.
   - Termo formal de cautela e responsabilidade.
   - Carimbo e imagem da rubrica ou selo de autenticação eletrônica Google com carimbo de data/hora.

### Identidade Visual & Diretrizes de Design
- **Paleta de Cores**:
  - Vermelho institucional Bombeiros (`#DC2626` / `#B91C1C`) aplicado com sobriedade em cabeçalhos e ações primárias.
  - Azul marinho escuro militar (`#0F172A` / `#1E293B`) para estrutura e contraste.
  - Fundo claro profissional (`#F8FAFC`) com cartões em branco puro e linhas finas (`#E2E8F0`).
- **Tipografia**:
  - `Plus Jakarta Sans` para textos e títulos com alto padrão editorial.
  - `JetBrains Mono` / `tabular-nums` para números de recibo, séries de equipamentos e quantidades.
- **Zero-Pill Discipline**: Metadados limpos sem pílulas coloridas estáticas desnecessárias; tabelas de alta densidade e legibilidade.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Assinatura Opcional (Rubrica Touch OU Autenticação Google)**
  - *Abordagem*: Modal e tela móvel oferecendo as duas abas limpas. O receptor decide na hora: se prefere rubricar rápido com o dedo no celular, assina; se prefere validar com sua conta Google, clica no botão do Google.
  - *Justificativa*: Dá autonomia total e agilidade operacional máxima para diferentes situações no quartel ou na prontidão.
- **Decisão 2: Persistência Cloud com Firebase Firestore**
  - *Abordagem*: Sincronização em tempo real de modo que a assinatura feita no celular atualize imediatamente a tela do computador no B4.
  - *Justificativa*: Atende à necessidade de armazenar em banco de dados seguro e organizado na nuvem acessível de qualquer dispositivo.
- **Decisão 3: Formatação Direta para Impressão A4**
  - *Abordagem*: Template CSS otimizado para impressão direta em impressora física ou salvamento em PDF nativo sem distorções.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA DE RECIBOS B4 CB                        │
├────────────────────────────────┬───────────────────────────────────────┤
│        ÁREA ADMINISTRATIVA     │      PORTAL DE ASSINATURA MÓVEL       │
│  - Dashboard de Recibos        │  - Acesso via Link direto / QR Code   │
│  - Emissão de Novos Recibos    │  - Visualização dos Itens             │
│  - Busca por Série/Talão/Posto │  - Escolha: Rubrica OU Conta Google   │
│  - Impressão A4 & Exportação   │  - Confirmação Imediata               │
└───────────────┬────────────────┴───────────────────┬───────────────────┘
                │                                    │
                ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE ESTADO & REGRAS                       │
│  - useReceipts: Sincronização em tempo real com Firestore              │
│  - useSignature: Gerencia captura de canvas OU token do Google         │
│  - useOfficialPrint: Formatação A4 conforme portaria do CB             │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FIREBASE FIRESTORE & AUTH                         │
│  - /receipts/{id} : Dados do recibo, itens e dados de assinatura       │
│  - /presets : Sugestões de materiais e estações operacionais           │
└────────────────────────────────────────────────────────────────────────┘
```

### Estrutura do Documento de Recibo
- `id`: Identificador único do documento
- `receiptNumber`: ex: `Recibo Nº 6GB-3ºSGB-B4-01/300/26`
- `consecutiveNumber`: número sequencial (1, 2, 3...)
- `year`: ano de referência (2026)
- `date`: data da emissão (ex: 12/10/2026)
- `station`: posto/estação (ex: EB Praia Grande, EB São Vicente)
- `deliveredBy`: responsável pela entrega (ex: CB PM SEDREZ)
- `receivedBy`: militar recebedor (ex: CB PM CHARLES)
- `items`: array de itens (`material`, `unit`, `quantity`, `notes`)
- `status`: `'pending'` (aguardando assinatura) | `'signed'` (assinado)
- `signatureMethod`: `'canvas'` | `'google_auth'`
- `signatureData`: imagem base64 da rubrica (se escolhido canvas)
- `googleAuthData`: e-mail, nome e identificador Google (se escolhido Google)
- `signedAt`: data e hora da assinatura

---

## 5. Sequência de Execução

1. **Configuração do Firebase**: Execução da ferramenta `set_up_firebase` para disponibilizar Firestore e Google Auth.
2. **Modelagem e Segurança**: Geração do `firebase-blueprint.json` e `firestore.rules` com regras de integridade.
3. **Desenvolvimento da Interface**:
   - Dashboard com visualização tabular e busca rápida.
   - Formulário de emissão com numeração automática e itens dinâmicos.
   - Módulo de assinatura dual (Aba 1: Touch Canvas; Aba 2: Login Google) com geração de QR Code/Link para celular.
   - Visualização e impressão oficial A4 do recibo militar.
4. **Validação & Compilação**: Verificação completa com `compile_applet`.
