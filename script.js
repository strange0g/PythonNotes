document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize External Libraries ---
    AOS.init({ duration: 600, once: true, easing: 'ease-in-out' });

    // --- Page Element Selectors ---
    const homepage = document.getElementById('homepage');
    const notesPage = document.getElementById('notes-page');
    const mainContent = document.getElementById('main-content');
    const progressBar = document.getElementById('progress-bar');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

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
        mainContent.innerHTML = '<h2><i class="fas fa-spinner fa-spin"></i> Loading Note...</h2>'; // Loading state

        try {
            const response = await fetch(noteFile);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            
            const noteHtml = await response.text();
            mainContent.innerHTML = noteHtml;

            const noteTitle = mainContent.querySelector('h1').textContent;
            document.title = `Note: ${noteTitle}`;
            
            initializeNoteContent();

        } catch (error) {
            mainContent.innerHTML = `<h2>Error Loading Note</h2><p>Could not fetch the note content. Please try again later.</p><p><em>${error}</em></p>`;
            console.error('Failed to load note:', error);
        }
    }

    function initializeNoteContent() {
        // Re-initialize AOS for newly added content
        AOS.init({ duration: 600, once: true, easing: 'ease-in-out' });
        // Re-run syntax highlighting
        hljs.highlightAll();

        // Re-bind back button as it's part of the loaded content
        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showHomepage();
            });
        }
        
        // Add "Copy" button to all new code blocks
        mainContent.querySelectorAll('pre').forEach(block => {
            // Prevent adding a button if one already exists
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
            window.location.hash = `notes/${noteFile.split('/')[1]}`; // Set a clean hash
            loadAndShowNote(noteFile);
        });
    });

    // --- Router: Handle initial page load based on URL hash ---
    function handleRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#notes/')) {
            const noteFileName = hash.substring(7); // Remove '#notes/'
            loadAndShowNote(`notes/${noteFileName}`);
        } else {
            showHomepage();
        }
    }
    
    // Initial routing
    handleRouting();

    // Listen for hash changes to allow browser back/forward buttons to work
    window.addEventListener('hashchange', handleRouting);


    // --- UI Widgets ---

    // Scroll to Top Button
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Scroll Progress Bar and Scroll-to-Top visibility
    window.addEventListener('scroll', () => {
        const isNotesPageVisible = !notesPage.classList.contains('hidden');
        
        // Handle Scroll-to-Top button visibility
        scrollToTopBtn.classList.toggle('visible', window.pageYOffset > 300);

        // Handle Progress Bar
        if (isNotesPageVisible) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        } else {
            progressBar.style.width = '0%';
        }
    });
});