# Mapa da Arquitetura do Site (Sitemap Visual)

Como este projeto é uma **Single Page Application (SPA)** sem rotas de URL distintas (navegação baseada em estado), o Sitemap tradicional XML contém apenas a raiz.

Abaixo está o gráfico representativo da estrutura lógica e fluxo de navegação do aplicativo:

```mermaid
graph TD
    %% Nós Principais
    User((Usuário))
    App[App Container]
    
    %% Estrutura de Layout
    subgraph Layout [MainLayout]
        Header[Header Topo]
        Sidebar[Sidebar Lateral]
        Workspace[ActivityArea Workspace]
        Tabs[TabsBar Navegação]
        Modals[Gerenciador de Modais]
        Footer[Rodapé]
    end

    %% Fluxo de Dados
    subgraph State [Contextos Globais]
        ActCtx[ActivityContext]
        GemCtx[GeminiContext]
        AudCtx[AudioContext]
    end

    %% Conexões Principais
    User -->|Acessa| App
    App --> Layout
    Layout -.-> State

    %% Detalhes dos Componentes
    Header --> AudioControls[Controles de Áudio/Voz]
    Header --> Backup[Backup & Restore]
    
    Sidebar --> APISettings[Configuração API Gemini]
    Sidebar --> Inputs[Parâmetros de Geração]
    Sidebar --> GenButton[Botão Criar Atividade]
    
    Inputs -- Define --> Params(Tema, Tipo, Dificuldade)
    GenButton -- Dispara --> GemCtx
    GemCtx -- Retorna Dados --> ActCtx
    
    Tabs -- Seleciona --> ActCtx
    ActCtx -- Renderiza --> Workspace
    
    %% Tipos de Atividades (Renderização Condicional)
    Workspace --> Switch{Tipo Ativo?}
    Switch -->|Quiz| C_Quiz[QuizGame]
    Switch -->|Caça-Palavras| C_Word[WordSearchGame]
    Switch -->|Música| C_Music[MusicActivity]
    Switch -->|História| C_Story[DrackerStory]
    Switch -->|Cruzadinha| C_Cross[CrosswordActivity]
    Switch -->|Liga Pontos| C_Dots[ConnectDotsGame]
    Switch -->|Galeria| C_Video[DrackerVideoGallery]
    
    %% Modais e Editores
    Modals --> Edit_Quiz[Editor de Quiz]
    Modals --> Edit_Music[Editor de Música]
    Modals --> Wiz_Word[Wizard Caça-Palavras]
    Modals --> Edit_Dots[Editor Liga Pontos]
    Modals --> Config_Voice[Config Voz]

    %% Estilização do Gráfico
    classDef container fill:#f9f4ef,stroke:#5d4037,stroke-width:2px;
    classDef component fill:#fff,stroke:#8d6e63,stroke-width:1px;
    classDef logic fill:#eefebe,stroke:#827717,stroke-width:1px;
    
    class App,Layout,Header,Sidebar,Workspace,Tabs,Footer container;
    class C_Quiz,C_Word,C_Music,C_Story,C_Cross,C_Dots,C_Video component;
    class ActCtx,GemCtx,AudCtx logic;
```

## Estrutura de Arquivos

- **public/**: `sitemap.xml` (Índice para motores de busca)
- **src/**: Código Fonte
  - **components/**: Componentes de UI e Atividades
  - **contexts/**: Gerenciamento de Estado
  - **services/**: Integração com Gemini AI
