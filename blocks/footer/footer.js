import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';


/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);

  footer.querySelectorAll('strong').forEach((strong) => {
    strong.replaceWith(...strong.childNodes);
  });

  const contentEl = footer.querySelector('.default-content-wrapper') || footer.querySelector('div div') || footer.querySelector('div');
  if (!contentEl) return;

  const children = [...contentEl.children];

  const company = document.createElement('div');
  company.className = 'footer-company';

  const linksWrapper = document.createElement('div');
  linksWrapper.className = 'footer-links';

  let currentCol = null;
  let reachedLinks = false;
  let copyrightEl = null;

  children.forEach((el) => {
    const tag = el.tagName;
    if (tag === 'P' && el.querySelector('picture')) {
      company.append(el);
    } else if (tag === 'P' && !reachedLinks) {
      company.append(el);
    } else if (tag === 'H3') {
      reachedLinks = true;
      currentCol = document.createElement('div');
      currentCol.className = 'footer-col';
      currentCol.append(el);
      linksWrapper.append(currentCol);
    } else if (tag === 'UL' && currentCol) {
      currentCol.append(el);
    } else if (tag === 'P' && reachedLinks) {
      copyrightEl = el;
    } else if (tag === 'DIV') {
      // columns block containing social icons + copyright
      copyrightEl = el;
    }
  });


  // nav row
  const navRow = document.createElement('div');
  navRow.className = 'footer-nav';
  navRow.append(company, linksWrapper);

  // bottom bar: copyright only
  const bottomBar = document.createElement('div');
  bottomBar.className = 'footer-bottom';
  if (copyrightEl) {
    copyrightEl.className = 'footer-copyright';
    bottomBar.append(copyrightEl);
  }

  contentEl.innerHTML = '';
  contentEl.append(navRow, bottomBar);
}
