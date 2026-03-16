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

  // The section contains: .default-content-wrapper (nav text) + plain divs for icons and copyright.
  // The icons/copyright blocks have no class because their first cell has no text block name.
  const section = fragment.querySelector('.section');
  const iconsRow = document.createElement('div');
  iconsRow.className = 'footer-social-icons';
  const copyrightDiv = document.createElement('div');
  copyrightDiv.className = 'footer-copyright';

  if (section) {
    // Extra wrappers = direct div children that are NOT default-content-wrapper
    [...section.querySelectorAll(':scope > div:not(.default-content-wrapper)')].forEach((wrapper) => {
      if (wrapper.querySelector('picture')) {
        // icons block: each icon is in its own nested div cell
        wrapper.querySelectorAll('picture').forEach((pic) => iconsRow.append(pic));
      } else {
        // copyright block: text lives in the innermost div cell
        const cell = wrapper.querySelector('div > div > div') ?? wrapper;
        copyrightDiv.textContent = cell.textContent;
      }
      wrapper.remove();
    });
  }

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);

  footer.querySelectorAll('strong').forEach((strong) => {
    strong.replaceWith(...strong.childNodes);
  });

  const contentEl = footer.querySelector('.default-content-wrapper') ?? footer.querySelector('div');
  if (!contentEl) return;

  const children = [...contentEl.children];
  const company = document.createElement('div');
  company.className = 'footer-company';
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
  });

  const navRow = document.createElement('div');
  navRow.className = 'footer-nav';
  navRow.append(company, linksWrapper);

  const bottomBar = document.createElement('div');
  bottomBar.className = 'footer-bottom';
  bottomBar.append(iconsRow, copyrightDiv);

  contentEl.innerHTML = '';
  contentEl.append(navRow, bottomBar);
}
