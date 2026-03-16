import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // unwrap all <strong> tags inside links (fm.com links are regular weight)
  footer.querySelectorAll('a strong, li strong').forEach((strong) => {
    strong.replaceWith(...strong.childNodes);
  });

  // collect all top-level content elements
  const contentEl = footer.querySelector('div');
  if (!contentEl) {
    block.append(footer);
    return;
  }
  const children = [...contentEl.children];

  // company section: logo picture + tagline
  const company = document.createElement('div');
  company.className = 'footer-company';

  // links section: H3 + UL pairs as columns
  const linksWrapper = document.createElement('div');
  linksWrapper.className = 'footer-links';

  let currentCol = null;
  let reachedLinks = false;

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
    }
    // copyright paragraph is omitted for brevity; add back if needed
  });

  // main nav row
  const navRow = document.createElement('div');
  navRow.className = 'footer-nav';
  navRow.append(company, linksWrapper);

  contentEl.innerHTML = '';
  contentEl.append(navRow);

  block.append(footer);
}
