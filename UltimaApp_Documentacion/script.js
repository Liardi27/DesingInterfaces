// === Dark Mode Toggle ===
const darkToggle = document.getElementById('dark-toggle');
const html = document.documentElement;

function setDark(isDark) {
  html.classList.toggle('dark', isDark);
  darkToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  localStorage.setItem('pf-docs-dark', isDark);
}
darkToggle.addEventListener('click', () => setDark(!html.classList.contains('dark')));
if (localStorage.getItem('pf-docs-dark') === 'true' || (!localStorage.getItem('pf-docs-dark') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  setDark(true);
}

// === Scroll Reveal ===
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-up, .timeline-item').forEach(el => observer.observe(el));

// === Prompt Accordion ===
document.querySelectorAll('.prompt-card').forEach(card => {
  card.querySelector('.prompt-card-header').addEventListener('click', () => {
    card.classList.toggle('open');
  });
});

// === Mobile Menu ===
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
}

// === Smooth Scroll for nav ===
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// === Navbar scroll effect ===
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 100) {
    navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

// === Counter animation for stats ===
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString() + suffix;
    }, 30);
  });
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); statsObserver.disconnect(); } });
}, { threshold: 0.3 });
const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);
