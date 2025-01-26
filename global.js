console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Find the current page link
const currentLink = navLinks.find(a => {
  const url = new URL(a.href, location.origin); // Convert to absolute URL
  return url.host === location.host && url.pathname === location.pathname;
});

// Add the "current" class to the current link
if (currentLink) {
  currentLink.classList.add("current");
}

let pages = [
    { url: '/index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'contacts/index.html', title: 'Contact' },
    // Add more pages as needed
  ];
  
  let nav = document.createElement('nav');
  document.body.prepend(nav);

  for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // TODO create link and add it to nav
    if (ARE_WE_HOME && title === 'Home') {
        url = '';
      } 
    else if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
      }
    
    // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
      );
    
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-switch">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

const select = document.querySelector('#theme-switch');

select.addEventListener('input', function (event) {
    const value = event.target.value;
    console.log('Color scheme changed to', value);
    document.documentElement.style.setProperty('color-scheme', value);
    localStorage.colorScheme = value;
});

  
  
  
 