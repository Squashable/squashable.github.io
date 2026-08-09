document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Header Component
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    fetch('header.html')
      .then(res => res.text())
      .then(html => { headerPlaceholder.innerHTML = html; })
      .catch(err => console.error('Failed to load header:', err));
  }

  // 2. Load Footer Component
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    fetch('footer.html')
      .then(res => res.text())
      .then(html => { footerPlaceholder.innerHTML = html; })
      .catch(err => console.error('Failed to load footer:', err));
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
