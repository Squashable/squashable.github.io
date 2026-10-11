document.addEventListener('DOMContentLoaded', () => {
  // Use the browser preference until the visitor chooses a theme themselves.
  const savedTheme = localStorage.getItem('site-theme');
  const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = initialTheme;

  function updateThemeToggle() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const isDark = document.documentElement.dataset.theme === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    button.title = `Switch to ${nextTheme} mode`;
    button.querySelector('.theme-toggle-icon').textContent = isDark ? String.fromCharCode(0x2600) : String.fromCharCode(0x263e);
    button.querySelector('.theme-toggle-label').textContent = isDark ? 'Light' : 'Dark';
  }
  updateThemeToggle();

  const useSystemThemeButton = document.getElementById('use-system-theme');
  if (useSystemThemeButton) {
    useSystemThemeButton.addEventListener('click', () => {
      localStorage.removeItem('site-theme');
      document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      updateThemeToggle();
      document.getElementById('theme-reset-status').textContent = 'The saved choice has been removed.';
    });
  }

  // 1. Load Header Component
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    (async () => {
      const paths = ['/', '/header.html', 'header.html', '../header.html'];
      for (const p of paths) {
        const url = (p === '/') ? '/header.html' : p;
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            headerPlaceholder.innerHTML = await res.text();
            updateThemeToggle();
            return;
          }
        } catch (e) {
          // try next path
        }
      }
      console.error('Failed to load header from known locations');
    })();
  }

  // 2. Load Footer Component
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    (async () => {
      const paths = ['/', '/footer.html', 'footer.html', '../footer.html'];
      for (const p of paths) {
        const url = (p === '/') ? '/footer.html' : p;
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            footerPlaceholder.innerHTML = await res.text();
            return;
          }
        } catch (e) {
          // try next path
        }
      }
      console.error('Failed to load footer from known locations');
    })();
  }

  // 3. Filter logic for project cards
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      projectCards.forEach(card => {
        const tags = card.dataset.tags ? card.dataset.tags.split(' ') : [];
        if (filter === 'all' || tags.includes(filter)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. Modal Overlay DOM creation
  let modalOverlay = document.querySelector('.modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Close modal">&times;</button>
        <div class="modal-body">Loading project details...</div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const modalBody = modalOverlay.querySelector('.modal-body');
  const closeBtn = modalOverlay.querySelector('.modal-close');

  function openModal(projectUrl) {
    modalBody.innerHTML = '<div style="padding: 3rem; text-align: center; color: #a1a1aa;">Loading story...</div>';
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    fetch(projectUrl)
      .then(response => {
        if (!response.ok) throw new Error('Project details page not found');
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.project-detail-container') || doc.body;
        modalBody.innerHTML = content.innerHTML;
      })
      .catch(err => {
        modalBody.innerHTML = `<div style="padding: 2rem; text-align: center;">
          <h3 style="color: #ef4444; margin-bottom: 0.5rem;">Unable to load story</h3>
          <p style="color: #a1a1aa;">${err.message}</p>
        </div>`;
      });
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Delegate click event for project cards / links
  document.body.addEventListener('click', (e) => {
    const themeToggle = e.target.closest('.theme-toggle');
    if (themeToggle) {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('site-theme', nextTheme);
      updateThemeToggle();
      return;
    }

    const card = e.target.closest('.project-card[data-project], .details-link[href]');
    if (card) {
      const projectUrl = card.dataset.project || card.getAttribute('href');
      if (projectUrl && projectUrl !== '#') {
        e.preventDefault();
        openModal(projectUrl);
      }
    }
  });
});
