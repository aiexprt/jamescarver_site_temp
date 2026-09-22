(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  const motionLabel = motionButton.querySelector('span');
  const motionIcon = motionButton.querySelector('use');
  const art = document.querySelector('.hero-art');
  const artLayer = document.querySelector('.art-parallax');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let motionPreference = null;
  let pointerFrame = 0;
  let animationActive = false;

  try { motionPreference = sessionStorage.getItem('james-carver-motion'); } catch { /* Storage can be unavailable in private browsing. */ }

  function applyMotionPreference() {
    animationActive = motionPreference ? motionPreference === 'active' : !reducedMotion.matches;
    root.dataset.motion = animationActive ? 'active' : 'paused';
    motionButton.setAttribute('aria-pressed', String(!animationActive));
    motionLabel.textContent = animationActive ? 'Pause motion' : 'Resume motion';
    motionIcon.setAttribute('href', animationActive ? '#icon-pause' : '#icon-play');
    if (!animationActive) {
      cancelAnimationFrame(pointerFrame);
      artLayer.style.removeProperty('--rotate-x');
      artLayer.style.removeProperty('--rotate-y');
      document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
    }
  }

  motionButton.hidden = false;
  applyMotionPreference();
  motionButton.addEventListener('click', () => {
    motionPreference = animationActive ? 'paused' : 'active';
    try { sessionStorage.setItem('james-carver-motion', motionPreference); } catch { /* The control still works without persistence. */ }
    applyMotionPreference();
  });
  reducedMotion.addEventListener('change', () => {
    motionPreference = null;
    try { sessionStorage.removeItem('james-carver-motion'); } catch { /* Optional preference only. */ }
    applyMotionPreference();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (animationActive && element.getBoundingClientRect().top > window.innerHeight) element.classList.add('is-pending');
      observer.observe(element);
    });
  }

  art.addEventListener('pointermove', event => {
    if (!animationActive || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = art.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      artLayer.style.setProperty('--rotate-y', `${x * 9}deg`);
      artLayer.style.setProperty('--rotate-x', `${-y * 7}deg`);
    });
  });
  art.addEventListener('pointerleave', () => {
    cancelAnimationFrame(pointerFrame);
    artLayer.style.removeProperty('--rotate-x');
    artLayer.style.removeProperty('--rotate-y');
  });

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  function selectTab(tab, moveFocus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[nextIndex], true);
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
