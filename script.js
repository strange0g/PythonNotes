document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize External Libraries ---
    AOS.init({
        duration: 600,
        once: true,
        easing: 'ease-in-out',
    });
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
        const mainTitle = document.getElementById('main-title').textContent;
        document.title = `Note: ${mainTitle}`;
        window.scrollTo(0, 0);
    }

    if (card1) {
        card1.addEventListener('click', (e) => {
            e.preventDefault();
            showNotesPage();
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showHomepage();
        });
    }

    if (window.location.hash === '#notes') {
        showNotesPage();
    } else {
        showHomepage();
    }

    // --- Scroll to Top Button ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

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
            }).catch(err => console.error('Failed to copy: ', err));
        });
    });

    // --- TOC Generation and Active State on Scroll ---
    const tocList = document.getElementById('toc-list');
    const sections = document.querySelectorAll('#main-content > section');
    const tocLinks = [];

    if (tocList) {
        sections.forEach(section => {
            const titleEl = section.querySelector('h2');
            if (!titleEl) return;
            const id = section.id;
            const title = titleEl.textContent;
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = title;
            li.appendChild(a);
            tocList.appendChild(li);
            tocLinks.push(a);
        });

        const observer = new IntersectionObserver(entries => {
            let visibleSections = [];
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleSections.push(entry.target);
                }
            });

            if (visibleSections.length > 0) {
                // Find the topmost visible section
                const topSection = visibleSections.reduce((prev, current) => {
                    return prev.getBoundingClientRect().top < current.getBoundingClientRect().top ? prev : current;
                });

                const id = topSection.getAttribute('id');
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        }, { rootMargin: '0px 0px -50% 0px', threshold: 0.1 });

        sections.forEach(section => {
            observer.observe(section);
        });
    }
});