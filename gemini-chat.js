document.addEventListener("DOMContentLoaded", () => {
    // 1. Seleciona os elementos do DOM
    const chatWindow = document.getElementById("chatbot-window");
    const messagesContainer = document.getElementById("chatbot-messages");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send-btn");

    // Verifica se todos os elementos essenciais existem
    if (!chatWindow || !messagesContainer || !input || !sendBtn) {
        console.error("Erro: Elementos do DOM do chatbot não encontrados.");
        return;
    }

    // URL do seu backend Python (FastAPI)
    const API_URL = "http://127.0.0.1:8001/api/chat";

    // 2. Adiciona os Event Listeners
    sendBtn.addEventListener("click", handleSendMessage);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });

    /**
     * Função principal para enviar a mensagem
     */
    async function handleSendMessage() {
        const userInput = input.value.trim();
        if (userInput === "") return;

        // Limpa o input
        input.value = "";

        // Adiciona a mensagem do usuário à tela
        addMessage(userInput, "user");

        // Mostra o indicador "digitando"
        const typingIndicator = addMessage("...", "bot", true);

        try {
            // Envia a mensagem para o backend Python
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userInput }),
            });

            if (!response.ok) {
                throw new Error("Erro na resposta da API.");
            }

            const data = await response.json();
            
            // Atualiza a mensagem do bot com a resposta real
            updateBotMessage(typingIndicator, data.response);

        } catch (error) {
            console.error("Erro ao conectar com o backend:", error);
            updateBotMessage(typingIndicator, "Desculpe, não consegui me conectar ao meu cérebro. Tente novamente mais tarde.");
        }
    }

    /**
     * Adiciona uma nova mensagem ao container do chat
     * @param {string} text - O texto da mensagem
     * @param {'bot'|'user'} sender - Quem enviou
     * @param {boolean} isLoading - Se é um indicador de "digitando"
     * @returns {HTMLElement} - O elemento da mensagem criado
     */
    function addMessage(text, sender, isLoading = false) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message", sender);

        const content = document.createElement("p");
        
        if (isLoading) {
            // Cria os 3 pontos do "digitando" (conforme seu CSS)
            messageElement.classList.add("loading");
            content.innerHTML = `
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            `;
        } else {
            // Converte quebras de linha (\n) em <br> para formatação
            content.innerHTML = text.replace(/\n/g, '<br>');
        }
        
        messageElement.appendChild(content);

        // Adiciona o botão de "falar" nas mensagens do bot (conforme seu CSS)
        if (sender === 'bot' && !isLoading) {
            messageElement.appendChild(createSpeakButton(text));
        }

        messagesContainer.appendChild(messageElement);
        
        // Rola para o final
        scrollToBottom();
        return messageElement;
    }

    /**
     * Atualiza uma mensagem existente (usado para trocar "digitando" pela resposta)
     * @param {HTMLElement} messageElement - O elemento da mensagem a ser atualizado
     * @param {string} newText - O novo texto
     */
    function updateBotMessage(messageElement, newText) {
        messageElement.classList.remove("loading");
        
        // Limpa os pontos
        const content = messageElement.querySelector("p");
        if(content) {
            content.innerHTML = newText.replace(/\n/g, '<br>');
        }
        
        // Adiciona o botão de "falar"
        messageElement.appendChild(createSpeakButton(newText));

        scrollToBottom();
    }

    /**
     * Cria o botão de áudio (TTS)
     * @param {string} textToSpeak - O texto que o botão deve falar
     * @returns {HTMLButtonElement}
     */
    function createSpeakButton(textToSpeak) {
        const speakBtn = document.createElement("button");
        speakBtn.classList.add("chatbot-speak-btn");
        speakBtn.setAttribute("aria-label", "Ouvir resposta");
        speakBtn.innerHTML = '<i class="fa-solid fa-volume-up"></i>';
        
        speakBtn.addEventListener("click", () => {
            speakText(textToSpeak);
        });

        return speakBtn;
    }

    /**
     * Função para falar o texto (Text-to-Speech do navegador)
     * @param {string} text 
     */
    function speakText(text) {
        if ('speechSynthesis' in window) {
            // Para qualquer fala anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR'; // Define o idioma
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Seu navegador não suporta a função de áudio.");
        }
    }

    /**
     * Rola o container de mensagens para o final
     */
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Mostra a mensagem de boas-vindas inicial do bot
     */
    function showWelcomeMessage() {
        // Remove a mensagem estática do seu HTML
        messagesContainer.innerHTML = "";
        
        // Adiciona a nova mensagem de boas-vindas
        const welcomeText = "Olá! 👋 Eu sou o NutriFases, seu assistente virtual. Como posso te ajudar hoje a navegar pelo mundo da nutrição e das fases da vida?";
        addMessage(welcomeText, "bot");
    }

    // Inicia o chat com a mensagem de boas-vindas
    showWelcomeMessage();
});