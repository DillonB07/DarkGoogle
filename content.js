document.addEventListener('DOMContentLoaded', e => {

  console.log('[GDM] Google Dark Mode content script loaded');

  // Remove background styles that interfere with CSS
  document.body.style.background = '';
  document.body.style.backgroundColor = '';

  // Turn all white into dark
  // Array.from(document.getElementsByTagName('*')).forEach(elm => {
  //   const styles = getComputedStyle(elm);
  //   const bg = styles.backgroundColor.replace(/\s+/g, '');

  //   if (['white', '#fff', 'rgb(255,255,255)'].includes(bg)) {
  //     elm.classList.add('gdm-make-dark');
  //   }
  // });

  // Function to watch for changes in the DOM tree
  const observeDOM = (function(){
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    return (obj, callback, options = {}) => {
      if (!obj || obj.nodeType !== 1) return; 
  
      if (MutationObserver) {
        // define a new observer
        const mutationObserver = new MutationObserver(callback);
  
        // have the observer observe for changes in children
        mutationObserver.observe(obj, {
          childList: true,
          subtree: true,
          ...options
        });
        return mutationObserver;
      }
      
      // browser support fallback
      else if (window.addEventListener) {
        obj.addEventListener('DOMNodeInserted', callback, false);
        obj.addEventListener('DOMNodeRemoved', callback, false);
      }
    };
  })();

  // Function that replaces images with our own
  function replaceImages() {

    // Empty folder
    document.querySelectorAll('img[src$="empty_state_empty_folder.png"]').forEach(img => 
      img.src = chrome.runtime.getURL('assets/empty_state_empty_folder.png')
    );

  }

  // Add class to body for CSS to tell what page it is
  const gdmPage = window.location.host.split('.')[0];
  document.body.classList.add('gdm-page-' + gdmPage);

  // Distinguish between docs.google.* pages (docs, sheets, etc)
  if (window.location.host.startsWith('docs.google.')) {
    document.body.classList.add('gdm-docs-' + window.location.pathname.split('/')[1]);
  }

  // Add a class for iFrame name
  document.body.classList.add('gdm-win-name-' + window.name.toLowerCase().replace(/\W+/g, '-'));

  // Pages that have the Keep, Tasks, Contacts, etc bar to the right
  const pagesWithOtherAppsRightBar = ['gdm-page-docs', 'gdm-page-calendar', 'gdm-page-drive'];

  // Current page has the previous bar?
  let hasOtherAppsRightBar = pagesWithOtherAppsRightBar.some(className => document.body.classList.contains(className));
  let otherAppsRightBar = null;
  console.debug('[GDM] Has other apps right bar:', hasOtherAppsRightBar);

  // Current page is the accounts popup?
  let isAccountsPopup = document.body.classList.contains('gdm-page-ogs') && window.name == 'account';
  let accountsPopupDiv = null;

  // Style selected files in Google Drive
  let driveSelectedFileClass = null;
  let driveSelectedFileSelector = null;

  // When something is clicked
  document.addEventListener('click', e => {

    // Google Docs when a file is selected
    if (e.target.matches('c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz > div > div > div *')) {

      // Get the class that is used for selected files
      const fileDiv = document.querySelector('c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz > div:has(div[tabindex="0"] > div)');

      if (!fileDiv) return;

      driveSelectedFileClass = fileDiv.classList[fileDiv.classList.length - 2];
      driveSelectedFileSelector = `c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz c-wiz > div.${driveSelectedFileClass}`;

      // Deselect other files
      Array.from(document.getElementsByClassName('gdm-drive-file-selected')).forEach(elm => {
        elm.classList.remove('gdm-drive-file-selected');
      });

      // Select files
      document.querySelectorAll(driveSelectedFileSelector).forEach(elm => {
        elm.classList.add('gdm-drive-file-selected');
      });

    }

  });

  // When the page loads
  window.addEventListener('load', e => {

    // Find the bar and add a class to it
    if (hasOtherAppsRightBar) {
      otherAppsRightBar = dillselector(elm => {
        return (
          elm.dillpos.right == document.body.clientWidth &&
          elm.dillsize.height + elm.dillpos.top == document.body.clientHeight &&
          elm.dillpos.bottom == document.body.clientHeight &&
          elm.dillsize.width <= 80 &&
          elm.dillsize.width >= 10 &&
          elm.dillsize.height > elm.dillpos.top &&
          elm.dillpos.top <= 80
        );
      }, {
        pos: true,
        size: true
      }).next().value;

      if (otherAppsRightBar) {
        console.debug('[GDM] Found other apps right bar:', otherAppsRightBar);
        otherAppsRightBar.classList.add('gdm-other-apps-right-bar');
      }
    }

    // Find the main accounts popup div
    if (isAccountsPopup) {
      accountsPopupDiv = [...dillselector(e => {
        return (
          e.dillsize.height == window.innerHeight - 24
        );
      }, { size: true })][1];

      // Make it dark
      accountsPopupDiv.classList.add('gdm-make-dark');

      // Make some other parts of the popup dark
      const otherParts = dillselector(e => {
        return (
          e.tagName == 'DIV' &&
          e.dillsize.height > 100 &&
          e.dillsize.height < window.innerHeight - 50 &&
          e.parentElement.tagName == 'C-WIZ'
        );
      }, { size: true, pos: true });

      for (const part of otherParts) {
        part.classList.add('gdm-make-dark-2');
      }
    }

  });

  // When DOM changes
  if (gdmPage == 'drive') {
    replaceImages();

    window.addEventListener('load', e => {
      document.body.addEventListener('load', e => {
        if (e.target.tagName == 'IMG' && !e.target.src.startsWith('chrome-extension://')) {
          replaceImages();
        }
      }, true);
    });
  }

});