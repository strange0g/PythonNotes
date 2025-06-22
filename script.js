document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize External Libraries ---
    AOS.init({ duration: 600, once: true, easing: 'ease-in-out' });
    hljs.highlightAll();

    // --- Page Navigation Logic ---
    const homepage = document.getElementById('homepage');
    const notesPage = document.getElementById('notes-page');
    const card1 = document.getElementById('card-1');
    const backToHomeBtn = document.getElementById('back-to-home-btn');

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
        window.location.hash = 'notes';
        document.title = `Note: ${document.getElementById('main-title').textContent}`;
        window.scrollTo(0, 0);
    }

    if (card1) card1.addEventListener('click', (e) => { e.preventDefault(); showNotesPage(); });
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', (e) => { e.preventDefault(); showHomepage(); });
    if (window.location.hash === '#notes') showNotesPage();
    else showHomepage();

    // --- Scroll to Top Button ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        scrollToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // --- Code Block "Copy" Button ---
    document.querySelectorAll('#main-content pre').forEach(block => {
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

    // --- Hierarchical TOC Logic ---
    const tocList = document.getElementById('toc-list');
    const mainContent = document.getElementById('main-content');

    if (tocList && mainContent) {
        const headings = Array.from(mainContent.querySelectorAll('h2[id], h3[id]'));
        const tocLinks = [];

        // Clear existing TOC and rebuild it
        tocList.innerHTML = '';
        headings.forEach(heading => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.dataset.targetId = heading.id;
            
            if (heading.tagName === 'H3') {
                a.classList.add('sub-item');
            }

            li.appendChild(a);
            tocList.appendChild(li);
            tocLinks.push(a);
        });
        
        if (headings.length === 0) return;

        const headingStates = new Map();

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                headingStates.set(entry.target, entry.isIntersecting);
            });

            let activeHeading = null;
            
            headings.forEach(heading => {
                if (headingStates.get(heading)) {
                    activeHeading = heading;
                }
            });

            tocLinks.forEach(link => {
                link.classList.toggle('active', activeHeading && link.dataset.targetId === activeHeading.id);
            });

        }, { 
            rootMargin: '0px 0px -65% 0px',
            threshold: 0 
        });

        headings.forEach(heading => observer.observe(heading));
    }
});