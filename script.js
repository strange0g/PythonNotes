document.addEventListener('DOMContentLoaded', function() {
    // --- API Endpoint for the AI Worker ---
    const API_ENDPOINT = 'https://python-notes-ai.raied-faisal.workers.dev';

    // --- Initialize External Libraries ---
    AOS.init({ duration: 600, once: true, easing: 'ease-in-out' });

    // --- Page Element Selectors ---
    const homepage = document.getElementById('homepage');
    const notesPage = document.getElementById('notes-page');
    const mainContent = document.getElementById('main-content');
    const progressBar = document.getElementById('progress-bar');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    // --- Chat UI Selectors ---
    const chatToggleBtn = document.getElementById('ai-chat-toggle');
    const chatModal = document.getElementById('chat-modal');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history-container');
    let isWelcomeMessageShown = false;


    // --- Page Navigation and Content Loading Logic ---
    function showHomepage() {
        homepage.classList.remove('hidden');
        notesPage.classList.add('hidden');
        window.location.hash = 'home';
        document.title = 'Advanced Python Notes - Homepage';
        window.scrollTo(0, 0);
    }

    function showNotesPage() {
        homepage.classList.add('hidden');
        notesPage.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    async function loadAndShowNote(noteFile) {
        showNotesPage();
        mainContent.innerHTML = '<h2><i class="fas fa-spinner fa-spin"></i> Loading Note...</h2>';

        try {
            const response = await fetch(noteFile);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            
            const noteHtml = await response.text();
            mainContent.innerHTML = noteHtml;

            const noteTitle = mainContent.querySelector('h1').textContent;
            document.title = `Note: ${noteTitle}`;
            
            initializeNoteContent();

        } catch (error) {
            mainContent.innerHTML = `<h2>Error Loading Note</h2><p>Could not fetch the note content. Please try again later.</p>`;
            console.error('Failed to load note:', error);
        }
    }

    function initializeNoteContent() {
        AOS.refresh();
        hljs.highlightAll();

        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showHomepage();
            });
        }
        
        mainContent.querySelectorAll('pre').forEach(block => {
            if (block.querySelector('.copy-code-btn')) return;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
            copyBtn.setAttribute('title', 'Copy code');
            block.appendChild(copyBtn);

            copyBtn.addEventListener('click', () => {
                const code = block.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.setAttribute('title', 'Copied!');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                        copyBtn.setAttribute('title', 'Copy code');
                    }, 2000);
                });
            });
        });
    }

    // --- Event Listeners for Note Cards ---
    document.querySelectorAll('.note-link').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const noteFile = card.dataset.noteFile;
            window.location.hash = `notes/${noteFile.split('/')[1]}`;
            loadAndShowNote(noteFile);
        });
    });

    // --- Router: Handle page load based on URL hash ---
    function handleRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#notes/')) {
            const noteFileName = hash.substring(7);
            loadAndShowNote(`notes/${noteFileName}`);
        } else {
            showHomepage();
        }
    }
    
    handleRouting();
    window.addEventListener('hashchange', handleRouting);


    // --- UI Widgets ---

    // Scroll to Top Button
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Scroll Progress Bar & Scroll-to-Top Button Visibility
    window.addEventListener('scroll', () => {
        scrollToTopBtn.classList.toggle('visible', window.pageYOffset > 300);

        const isNotesPageVisible = !notesPage.classList.contains('hidden');
        if (isNotesPageVisible) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        } else {
            progressBar.style.width = '0%';
        }
    });

    // --- AI Chat Logic (Now Connected) ---

    function toggleChat() {
        chatModal.classList.toggle('hidden');
        if (!chatModal.classList.contains('hidden')) {
            if (!isWelcomeMessageShown) {
                displayMessage("Hello! I'm your AI assistant. Ask me anything about Python!", 'ai');
                isWelcomeMessageShown = true;
            }
            chatInput.focus();
        }
    }

    function displayMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        if (isError) {
            messageDiv.classList.add('error-message');
        }
        messageDiv.textContent = text;
        chatHistoryContainer.appendChild(messageDiv);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }

    function displayLoadingIndicator() {
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'chat-message ai-message';
        loaderDiv.id = 'loading-indicator';
        loaderDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
        chatHistoryContainer.appendChild(loaderDiv);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.remove();
        }
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        displayMessage(userInput, 'user');
        chatInput.value = '';
        displayLoadingIndicator();

        try {
            // Make a real API call to the Cloudflare Worker
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userInput })
            });

            const data = await response.json();

            // Always remove the loading indicator
            removeLoadingIndicator();

            if (!response.ok) {
                // Handle errors returned from the API (e.g., status 400 or 500)
                throw new Error(data.error || 'The AI assistant is having trouble. Please try again.');
            }
            
            // Display the successful response from the AI
            displayMessage(data.answer, 'ai');

        } catch (error) {
            // Handle network errors or other issues with the fetch call
            console.error("Chat API Error:", error);
            removeLoadingIndicator();
            displayMessage(error.message, 'ai', true);
        }
    }

    chatToggleBtn.addEventListener('click', toggleChat);
    chatCloseBtn.addEventListener('click', toggleChat);
    chatForm.addEventListener('submit', handleChatSubmit);
});