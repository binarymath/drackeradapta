# 🐉 Dracker AdaptAI

**Dracker AdaptAI** é uma ferramenta pedagógica inteligente projetada para auxiliar professores na adaptação e criação de materiais didáticos inclusivos e envolventes. Utilizando o poder da **Inteligência Artificial (Google Gemini)**, o sistema gera atividades personalizadas, simplifica textos e cria recursos visuais e lúdicos em instantes.

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-amber)
![License](https://img.shields.io/badge/Licenca-MIT-blue)

## ✨ Principais Funcionalidades

### 1. 📝 Criação de Atividades
Gere automaticamente diferentes tipos de atividades baseadas em qualquer tema ou conteúdo:
*   **Quiz Educativo**: Perguntas de múltipla escolha com gabarito.
*   **Resumo com Drácker**: Uma história envolvente narrada pelo mascote Drácker, com atividades de fixação integradas em um design lúdico.
*   **Simplificação de Texto**: Transforma textos complexos em versões mais acessíveis, incluindo letras de músicas e perguntas de interpretação.
*   **Caça-Palavras Interativo**: Criação completa de caça-palavras com níveis de dificuldade, temas personalizados e opção de ocultar o banco de palavras.

### 2. 🎨 Geração de Imagens
Crie ilustrações personalizadas para acompanhar as atividades (sujeito à disponibilidade da API de imagem). Estilos variados como:
*   Infantil/Cartoon
*   Aquarela
*   Flat Design

### 3. 🔊 Acessibilidade e Áudio
*   **Leitura em Voz Alta (TTS)**: Sistema integrado para leitura dos textos gerados, facilitando a acessibilidade para alunos com dificuldades de leitura ou deficiência visual.
*   Controles de velocidade e seleção de vozes do sistema.

### 4. 🖨️ Exportação e Organização
*   **Abas Múltiplas**: Gerencie várias atividades simultaneamente com sistema de abas "drag-and-drop".
*   **Exportação**: Baixe as atividades em **DOCX** (Word) ou **PDF** pronto para impressão.
*   **Backup e Restauração**: Salve todo o seu trabalho (abas e configurações) em um arquivo `.json` e restaure quando quiser.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com uma stack moderna e robusta:

*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Estilização**: [TailwindCSS](https://tailwindcss.com/)
*   **Ícones**: [Lucide React](https://lucide.dev/)
*   **IA Generativa**: [Google Gemini API](https://ai.google.dev/)
*   **Gerenciamento de Estado/Drag-n-Drop**: `@dnd-kit`

## 🚀 Como Rodar o Projeto

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).
*   Uma chave de API do Google Gemini (Google AI Studio).

### Passos

1.  **Clone o repositório** (ou baixe os arquivos):
    ```bash
    git clone https://github.com/seu-usuario/dracker-adaptai.git
    cd dracker-adaptai
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```
    Isso iniciará tanto o servidor frontend (Vite) quanto o backend proxy local necessário para algumas operações.

4.  **Acesse o sistema**:
    Abra seu navegador em `http://localhost:5173` (ou a porta indicada no terminal).

5.  **Configure a API**:
    No painel lateral, insira sua **Chave Gemini API** para começar a gerar atividades.

## 📁 Estrutura do Projeto

```
/src
  ├── /components       # Componentes React (Header, Sidebar, ActivityArea, etc.)
  ├── /services         # Serviços de integração (Gemini API, Exportação)
  ├── /utils            # Funções utilitárias e helpers
  ├── App.jsx           # Componente principal e gerenciamento de estado
  └── main.jsx          # Ponto de entrada
/server.js              # Servidor proxy simples (Node/Express)
```

## 🎨 Identidade Visual

O sistema utiliza uma paleta de cores acolhedora e temática:
*   **Âmbar/Marrom**: Cor primária, remetendo a livros antigos e aventura (Drácker).
*   **Azul**: Cor de ação e sucesso.
*   **Mascote**: O dragãozinho **Drácker** guia os alunos nas atividades de resumo.

---
Desenvolvido com 💙 e ☕ para a educação inovadora.
