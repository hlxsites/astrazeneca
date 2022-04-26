import {
  makeLinksRelative,
  readBlockConfig,
} from '../../scripts/scripts.js';

async function decorateIcons(element) {
  element.querySelectorAll('img.icon').forEach(async (img) => {
    const resp = await fetch(img.src);
    const svg = await resp.text();
    const span = document.createElement('span');
    span.className = img.className;
    span.innerHTML = svg;
    img.replaceWith(span);
  });
}

/**
 * collapses all open nav sections
 * @param {Element} sections The container element
 */

function collapseAllNavSections(sections) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch nav content
  const navPath = cfg.nav || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  const html = await resp.text();

  // decorate nav DOM
  const nav = document.createElement('nav');
  nav.innerHTML = html;
  decorateIcons(nav);
  makeLinksRelative(nav);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((e, j) => {
    nav.children[j].classList.add(`nav-${e}`);
  });

  const navSections = [...nav.children][1];

  navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
    navSection.addEventListener('click', () => {
      const expanded = navSection.getAttribute('aria-expanded') === 'true';
      collapseAllNavSections(navSections);
      navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
  hamburger.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    document.body.style.overflowY = expanded ? '' : 'hidden';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  block.append(nav);
}
