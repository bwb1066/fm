import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // if nav content is a single section, split brand / sections / tools
  if (!nav.querySelector('.nav-sections')) {
    const brand = nav.querySelector('.nav-brand');
    if (brand) {
      // move the ul into a new nav-sections div
      const ul = brand.querySelector('ul');
      if (ul) {
        const wrapper = document.createElement('div');
        wrapper.className = 'default-content-wrapper';
        wrapper.append(ul);
        const sectionsDiv = document.createElement('div');
        sectionsDiv.className = 'nav-sections';
        sectionsDiv.append(wrapper);
        brand.after(sectionsDiv);
      }
    }

    // build nav-tools from the icon pictures authored in nav-brand
    // (all <p> elements with only a picture after the first/logo one)
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'nav-tools';
    const brandContent = brand.querySelector('.default-content-wrapper') ?? brand;
    const iconParas = [...brandContent.querySelectorAll('p')].filter((p) => p.querySelector('picture'));
    // first picture-p is the logo — skip it, move the rest to tools
    iconParas.slice(1).forEach((p, i, arr) => {
      // add divider before the last icon
      if (i === arr.length - 1) {
        const divider = document.createElement('span');
        divider.className = 'nav-tool-divider';
        toolsDiv.append(divider);
      }
      const pic = p.querySelector('picture');
      const toolIcon = document.createElement('span');
      toolIcon.className = 'nav-tool-icon';
      toolIcon.append(pic);
      toolsDiv.append(toolIcon);
      p.remove();
    });
    nav.append(toolsDiv);
  }

  // strip <strong> from nav links and remove button styling added by decorateButtons
  nav.querySelectorAll('.nav-sections strong').forEach((s) => s.replaceWith(...s.childNodes));
  nav.querySelectorAll('.nav-sections a').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    const wrapper = a.closest('.button-wrapper');
    if (wrapper) wrapper.className = '';
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    const brandP = brandLink.closest('p');
    if (brandP) brandP.className = '';
    // move the Solutions link (and any other text links) into nav-sections as the first item
    const navSectionsUl = nav.querySelector('.nav-sections ul');
    if (navSectionsUl) {
      const li = document.createElement('li');
      li.append(brandLink);
      navSectionsUl.prepend(li);
    }
    // clean up the <br> left in the brand paragraph
    navBrand.querySelectorAll('br').forEach((br) => br.remove());
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const subList = navSection.querySelector(':scope > ul');
      if (subList) {
        navSection.classList.add('nav-drop');

        // build mega menu panel from the nested ul
        const sectionName = navSection.querySelector('a')?.textContent.trim().toUpperCase() || '';
        const megaMenu = document.createElement('div');
        megaMenu.className = 'mega-menu';
        megaMenu.addEventListener('click', (e) => e.stopPropagation());

        // extract fragment table (sidebar) before building grid
        const fragmentTable = navSection.querySelector('table');
        let fragmentPath = null;
        if (fragmentTable) {
          const rows = [...fragmentTable.querySelectorAll('tr')];
          const isFragment = rows[0]?.textContent.trim().toLowerCase() === 'fragment';
          if (isFragment && rows[1]) {
            const fragLink = rows[1].querySelector('a');
            if (fragLink) fragmentPath = new URL(fragLink.href).pathname;
          }
          fragmentTable.remove();
        }

        const megaMain = document.createElement('div');
        megaMain.className = 'mega-menu-main';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'mega-menu-section-header';
        sectionHeader.textContent = sectionName;

        const grid = document.createElement('ul');
        grid.className = 'mega-menu-grid';
        subList.querySelectorAll(':scope > li').forEach((item) => {
          const link = item.querySelector('a');
          if (!link) return;
          // description is a text node after the <a>, separated by |
          const fullText = item.textContent;
          const pipeIdx = fullText.indexOf('|');
          const desc = pipeIdx !== -1 ? fullText.substring(pipeIdx + 1).trim() : '';
          const gridItem = document.createElement('li');
          gridItem.className = 'mega-menu-item';
          gridItem.append(link);
          if (desc) {
            const descEl = document.createElement('p');
            descEl.className = 'mega-menu-item-desc';
            descEl.textContent = desc;
            gridItem.append(descEl);
          }
          grid.append(gridItem);
        });

        megaMain.append(sectionHeader, grid);
        megaMenu.append(megaMain);

        // load sidebar fragment if present
        if (fragmentPath) {
          loadFragment(fragmentPath).then((frag) => {
            if (frag) {
              const sidebar = document.createElement('div');
              sidebar.className = 'mega-menu-sidebar';
              while (frag.firstElementChild) sidebar.append(frag.firstElementChild);

              // style the first heading as section label
              const sectionLabel = sidebar.querySelector('h1, h2, h3, h4');
              if (sectionLabel) {
                // eslint-disable-next-line no-console
                console.log('[sidebar] section label tag:', sectionLabel.tagName, sectionLabel.textContent);
                sectionLabel.className = 'sidebar-section-label';
              }

              // wrap each h3 + following siblings (until next h3) into a card
              sidebar.querySelectorAll('h3').forEach((h3) => {
                const card = document.createElement('div');
                card.className = 'sidebar-article';
                h3.replaceWith(card);
                card.append(h3);
                let next = card.nextElementSibling;
                while (next && next.tagName !== 'H3') {
                  const following = next.nextElementSibling;
                  card.append(next);
                  next = following;
                }
              });

              megaMenu.append(sidebar);
            }
          });
        }

        subList.replaceWith(megaMenu);
      }

      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // hide nav on scroll down, show on scroll up
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
      navWrapper.classList.add('nav-hidden');
    } else {
      navWrapper.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
}
