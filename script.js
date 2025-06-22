document.addEventListener('DOMContentLoaded', function() {
    // --- API Endpoint for the AI Worker ---
    const API_ENDPOINT = 'https://python-notes-ai.raied-faisal.workers.dev';

    // --- Global Context Variables ---
    let allNotesContext = '';
    let attachedFile = { name: null, content: null };

    // --- Initialize External Libraries ---
    AOS.init({ duration: 600, once: true, easing: 'ease-in-out' });

    // --- Page Element Selectors ---
    const homepage = document.getElementById('homepage');
    const notesPage = document.getElementById('notes-page');
    const mainContent = document.getElementById('main-content');
    const progressBar = document.getElementById('progress-bar');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const notesGrid = document.querySelector('.notes-grid');
    
    // --- Chat UI Selectors ---
    const chatToggleBtn = document.getElementById('ai-chat-toggle');
    const chatModal = document.getElementById('chat-modal');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history-container');
    const fileUploadInput = document.getElementById('file-upload-input');
    const attachedFileDisplay = document.getElementById('attached-file-display');

    // --- Step 1: Load All Context on Page Start ---
    async function loadAllContexts() {
        console.log("Loading all notes for AI context...");
        try {
            const manifestResponse = await fetch('notes-manifest.json');
            if (!manifestResponse.ok) throw new Error("Could not load notes-manifest.json");
            const manifest = await manifestResponse.json();
            
            buildHomepage(manifest);

            const availableNotes = manifest.filter(note => note.available && note.file);
            const fetchPromises = availableNotes.map(note => fetch(note.file).then(res => res.text()));
            const noteHtmls = await Promise.all(fetchPromises);
            
            const tempDiv = document.createElement('div');
            let combinedText = '';
            noteHtmls.forEach((html, index) => {
                tempDiv.innerHTML = html;
                const title = tempDiv.querySelector('h1')?.innerText || `Note ${index + 1}`;
                const content = tempDiv.innerText;
                combinedText += `\n\n--- START OF NOTE: ${title} ---\n\n${content}\n\n--- END OF NOTE: ${title} ---\n\n`;
            });
            
            allNotesContext = combinedText;
            console.log("All notes context loaded and stored for AI.");

        } catch (error) {
            console.error("Failed to load notes context:", error);
            allNotesContext = "Error: Could not load the notes content.";
        }
    }
    
    function buildHomepage(manifest) {
        if (!notesGrid) return;
        notesGrid.innerHTML = ''; // Clear existing static cards
        manifest.forEach((note, index) => {
            const card = document.createElement(note.available ? 'a' : 'div');
            card.className = 'note-card';
            card.dataset.aos = 'fade-up';
            card.dataset.aosDelay = index * 50;

            if (note.available) {
                card.href = `#notes/${note.file.split('/')[1]}`;
                card.classList.add('note-link');
                card.dataset.noteFile = note.file;
                card.innerHTML = `<i class="fas fa-book-open card-icon"></i><h3>${note.title}</h3><p>${note.description}</p>`;
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.hash = card.getAttribute('href');
                });
            } else {
                card.classList.add('placeholder');
                card.setAttribute('aria-label', `${note.title} is currently unavailable.`);
                card.innerHTML = `<i class="fas fa-lock card-icon"></i><h3>${note.title}</h3><p>${note.description}</p>`;
            }
            notesGrid.appendChild(card);
        });
    }

    // --- Page Navigation and Content Loading Logic ---
    function showHomepage() {
        homepage.classList.remove('hidden');
        notesPage.classList.add('hidden');
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
                window.location.hash = 'home';
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

    // --- Router ---
    function handleRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#notes/')) {
            const noteFileName = hash.substring(7);
            loadAndShowNote(`notes/${noteFileName}`);
        } else {
            showHomepage();
        }
    }
    window.addEventListener('hashchange', handleRouting);

    // --- UI Widgets ---
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
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

    // --- AI Chat Logic ---
    function toggleChat() {
        chatModal.classList.toggle('hidden');
        if (!chatModal.classList.contains('hidden')) {
            if (chatHistoryContainer.children.length === 0) {
                displayMessage("Hello! I'm PyPro-AI, your Python learning assistant. Ask a question or attach a code file to get started.", 'ai');
            }
            chatInput.focus();
        }
    }
    function displayMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        if (isError) messageDiv.classList.add('error-message');
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
        document.getElementById('loading-indicator')?.remove();
    }
    
    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            attachedFile = { name: file.name, content: event.target.result };
            updateAttachedFileUI();
        };
        reader.onerror = () => {
            displayMessage(`Error reading file: ${file.name}`, 'ai', true);
            clearAttachedFile();
        };
        reader.readAsText(file);
    });

    function updateAttachedFileUI() {
        if (attachedFile.name) {
            attachedFileDisplay.innerHTML = `
                <span><i class="fas fa-file-code"></i> ${attachedFile.name}</span>
                <button title="Remove file" id="remove-file-btn">×</button>
            `;
            attachedFileDisplay.classList.remove('hidden');
            document.getElementById('remove-file-btn').addEventListener('click', clearAttachedFile);
        } else {
            attachedFileDisplay.classList.add('hidden');
            attachedFileDisplay.innerHTML = '';
        }
    }
    
    function clearAttachedFile() {
        attachedFile = { name: null, content: null };
        fileUploadInput.value = ''; // Reset file input
        updateAttachedFileUI();
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        let userMessage = userInput;
        if (attachedFile.name) {
            userMessage += `\n(Attached file: ${attachedFile.name})`;
        }
        displayMessage(userMessage, 'user');
        
        chatInput.value = '';
        displayLoadingIndicator();

        const payload = {
            query: userInput,
            notesContext: allNotesContext,
            fileContext: attachedFile.content
        };
        
        clearAttachedFile();

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            removeLoadingIndicator();
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'The AI assistant is having trouble. Please try again.');
            }
            displayMessage(data.answer, 'ai');
        } catch (error) {
            console.error("Chat API Error:", error);
            removeLoadingIndicator();
            displayMessage(error.message, 'ai', true);
        }
    }

    chatToggleBtn.addEventListener('click', toggleChat);
    chatCloseBtn.addEventListener('click', toggleChat);
    chatForm.addEventListener('submit', handleChatSubmit);

    // --- Initial Load ---
    loadAllContexts().then(() => {
        handleRouting();
    });
});