// (*** Estrutura de perguntas ***)
const SUGGESTION_CATEGORIES = {
    "Fases da Vida 👶": [
        "O que é nutrição na infância?",
        "Quais os nutrientes da adolescência?",
        "Como ter lanches saudáveis no trabalho?",
        "Dicas para a terceira idade"
    ],
    "Recursos do Site 📚": [
        "Quero uma receita saudável",
        "Me fale sobre a origem da nossa comida",
        "O que é a 'lupa' nos rótulos?"
    ],
    "Dúvidas Gerais 💡": [
        "O que é 'comida de verdade'?",
        "Ultraprocessado faz mal?"
    ],
    "Acompanhe o Projeto 📱": [
        "Como posso acompanhar ou entrar em contato?"
    ]
};

let currentCategory = null; // Guarda a categoria atual


document.addEventListener("DOMContentLoaded", () => {
    // 1. Seleciona os elementos do DOM
    const chatWindow = document.getElementById("chatbot-window");
    const messagesContainer = document.getElementById("chatbot-messages");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send-btn");
    
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (chatWindow && chatWindow.classList.contains('hidden')) {
                setTimeout(showWelcomeMessage, 50);
            }
        });
    }

    if (!chatWindow || !messagesContainer || !input || !sendBtn) {
        console.error("Erro: Elementos do DOM do chatbot não encontrados.");
        return;
    }

    // 2. Adiciona os Event Listeners
    sendBtn.addEventListener("click", handleSendMessage);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });

    /**
     * Função principal para enviar uma MENSAGEM DIGITADA
     */
    function handleSendMessage() {
        const userInput = input.value.trim();
        if (userInput === "") return;

        input.value = "";
        addMessage(userInput, "user");
        removeSuggestions(); 
        currentCategory = null; 
        
        const typingIndicator = addMessage("...", "bot", true);

        setTimeout(() => {
            const botResponse = getBotResponse(userInput.toLowerCase());
            updateBotMessage(typingIndicator, botResponse);
        }, 1000); 
    }

    /**
     * Lida com cliques nas PERGUNTAS
     */
    function handleQuestionClick(question) {
        addMessage(question, "user");
        removeSuggestions();
        const typingIndicator = addMessage("...", "bot", true);
        
        setTimeout(() => {
            const botResponse = getBotResponse(question.toLowerCase());
            updateBotMessage(typingIndicator, botResponse);
        }, 1000);
    }
    
    /**
     * Lida com cliques nas CATEGORIAS
     */
    function handleCategoryClick(categoryName) {
        currentCategory = categoryName; 
        
        addMessage(`Quero saber sobre: "${categoryName}"`, "user");
        const questionList = SUGGESTION_CATEGORIES[categoryName];
        addQuestionButtons(questionList);
    }

    /**
     * (*** MUDANÇA 2: Resposta de Contato Atualizada ***)
     * Lógica central de respostas
     */
    function getBotResponse(normalizedInput) {
        if (normalizedInput.includes("infância") || normalizedInput.includes("criança")) {
            return "Estou vendo que você quer saber sobre a infância! 🧸<br><br>A nutrição nessa fase é crucial para o crescimento. Recomendo focar em alimentos *in natura* e evitar ultraprocessados. Você pode ver mais na nossa seção 'Fases da Vida'.";
        } 
        else if (normalizedInput.includes("adolescência")) {
            return "A adolescência é a fase do 'estirão'! 🏃‍♀️<br><br>O corpo precisa de mais energia, cálcio para os ossos, ferro para o sangue e zinco para a imunidade. Temos uma seção inteira sobre isso!";
        }
        else if (normalizedInput.includes("lanches saudáveis") || normalizedInput.includes("adulto")) {
            return "Ótima pergunta! Na fase adulta, o planejamento é tudo. 🧑‍💼<br><br>Tente levar de casa frutas, iogurtes naturais ou um mix de castanhas. Evite os ultraprocessados! Temos um planejador de lanches na página 'Fase Adulta'.";
        }
        else if (normalizedInput.includes("idoso") || normalizedInput.includes("terceira idade")) {
            return "Ah, a terceira idade! 🧓<br><br>Nessa fase, é muito importante focar em proteínas para evitar a sarcopenia (perda muscular) e manter uma boa hidratação. Visite nossa página 'Terceira Idade' para uma calculadora de água!";
        } 
        else if (normalizedInput.includes("receita")) {
            return "Adoro receitas! 🍳<br><br>Temos uma seção cheia de receitas saudáveis, veganas e de aproveitamento integral. Dê uma olhada no menu 'Recursos' > 'Receitas'.";
        }
        else if (normalizedInput.includes("origem") || normalizedInput.includes("ancestralidade")) {
            return "Nossa culinária é uma mistura incrível! 🇧🇷<br><br>Ela vem das matrizes Indígena (mandioca, açaí), Portuguesa (arroz, azeite) e Africana (dendê, leite de coco). Temos uma página inteira sobre 'Origem Alimentar'!";
        }
        else if (normalizedInput.includes("rótulo") || normalizedInput.includes("lupa")) {
             return "Entender rótulos é fundamental! 🔎<br><br>A nova 'lupa' na frente dos produtos indica excesso de açúcar, gordura ou sódio. Sempre leia a lista de ingredientes! Veja nosso guia completo em 'Recursos' > 'Rotulagem'.";
        }
        else if (normalizedInput.includes("comida de verdade") || normalizedInput.includes("in natura")) {
            return "'Comida de verdade' (ou *in natura*) são alimentos como frutas, legumes, ovos e carnes. 🍓🥦<br><br>Os minimamente processados são aqueles que passaram por pequenas alterações, como o arroz e o feijão. Eles devem ser a base da nossa alimentação!";
        }
        else if (normalizedInput.includes("ultraprocessado faz mal")) {
            return "Sim. O consumo excessivo de ultraprocessados está ligado ao aumento de obesidade, diabetes e pressão alta. 📈<br><br>Eles são formulações industriais cheias de aditivos, sal, açúcar e gordura, como salgadinhos, refrigerantes e bolachas recheadas. O Guia Alimentar recomenda evitar ao máximo!";
        }
        // NOVA RESPOSTA ATUALIZADA:
        else if (normalizedInput.includes("acompanhar") || normalizedInput.includes("contato")) {
            return "Que legal que você quer se conectar! 📱<br><br>" +
                   "Você pode nos encontrar de várias formas:<br><br>" +
                   "<b>Para parcerias e contato:</b><br>" +
                   "Visite nossa página 'Contato' no menu ou nos mande um email em <b>alimentandofases@gmail.com</b><br><br>" +
                   "<b>Para seguir o projeto:</b><br>" +
                   "Siga nosso Instagram oficial: <b>@alimentandofases</b><br><br>" +
                   "<b>Para ver os bastidores do dev:</b><br>" +
                   "Siga o desenvolvedor em <b>@tarxdev</b> no Instagram!";
        }
        else {
            return "Desculpe, ainda estou em modo de simulação! 🤖<br><br>No momento, só tenho respostas prontas para as perguntas dos botões de sugestão. Por favor, clique em uma delas!";
        }
    }


    // --- FUNÇÕES AUXILIARES ---

    function addMessage(text, sender, isLoading = false, shouldScroll = true) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message", sender);
        const content = document.createElement("p");
        
        if (isLoading) {
            messageElement.classList.add("loading");
            content.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
        } else {
            content.innerHTML = text.replace(/\n/g, '<br>');
        }
        
        messageElement.appendChild(content);

        if (sender === 'bot' && !isLoading) {
            messageElement.appendChild(createSpeakButton(text));
        }
        messagesContainer.appendChild(messageElement);
        
        if (!isLoading && shouldScroll) { 
            scrollToBottom();
        }
        return messageElement;
    }

    function updateBotMessage(messageElement, newText) {
        messageElement.classList.remove("loading");
        const content = messageElement.querySelector("p");
        if(content) {
            content.innerHTML = newText.replace(/\n/g, '<br>');
        }
        messageElement.appendChild(createSpeakButton(newText));
        
        if (currentCategory) {
            const questionList = SUGGESTION_CATEGORIES[currentCategory];
            addQuestionButtons(questionList, false); 
        } else {
            addCategoryButtons(false);
        }
    }

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

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Seu navegador não suporta a função de áudio.");
        }
    }

    function scrollToBottom() {
        setTimeout(() => {
            const lastElement = messagesContainer.lastElementChild;
            if (lastElement) {
                const lastElementRect = lastElement.getBoundingClientRect();
                const containerRect = messagesContainer.getBoundingClientRect();

                if (lastElementRect.bottom > containerRect.bottom) {
                    lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }, 50);
    }

    function showWelcomeMessage() {
        messagesContainer.innerHTML = "";
        currentCategory = null; 
        
        const welcomeText = "Olá! 👋 Eu sou o NutriFases, seu assistente virtual. Como posso te ajudar hoje?<br><br>Escolha uma das categorias abaixo:";
        
        addMessage(welcomeText, "bot", false, false); 
        addCategoryButtons(false); 
        messagesContainer.scrollTop = 0; // Força o scroll para o TOPO
    }
    
    function addCategoryButtons(shouldScroll = true) {
        removeSuggestions(); 
        currentCategory = null; 

        const suggestionsContainer = document.createElement("div");
        suggestionsContainer.classList.add("chat-suggestions-container");

        const categories = Object.keys(SUGGESTION_CATEGORIES);

        categories.forEach(categoryName => {
            const button = document.createElement("button");
            button.classList.add("chat-suggestion-btn");
            button.textContent = categoryName;
            button.addEventListener("click", () => handleCategoryClick(categoryName));
            suggestionsContainer.appendChild(button);
        });

        messagesContainer.appendChild(suggestionsContainer);
        
        if (shouldScroll) {
            scrollToBottom();
        }
    }
    
    function addQuestionButtons(questionList, shouldScroll = true) {
        removeSuggestions(); 

        const suggestionsContainer = document.createElement("div");
        suggestionsContainer.classList.add("chat-suggestions-container");

        questionList.forEach(question => {
            const button = document.createElement("button");
            button.classList.add("chat-suggestion-btn");
            button.textContent = question;
            button.addEventListener("click", () => handleQuestionClick(question));
            suggestionsContainer.appendChild(button);
        });
        
        const backButton = document.createElement("button");
        backButton.classList.add("chat-suggestion-btn", "back-btn");
        backButton.innerHTML = "&larr; Voltar ao menu";
        backButton.addEventListener("click", () => {
            addMessage("Voltar ao menu principal.", "user");
            addCategoryButtons(); 
        });
        suggestionsContainer.appendChild(backButton);

        messagesContainer.appendChild(suggestionsContainer);
        
        if (shouldScroll) {
            scrollToBottom(); 
        }
    }
    
    function removeSuggestions() {
        const container = document.querySelector(".chat-suggestions-container");
        if (container) {
            container.remove();
        }
    }

    // Inicia o chat com a mensagem de boas-vindas
    showWelcomeMessage();
});