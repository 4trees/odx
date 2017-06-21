// search
const searchInput = document.querySelector('#searchBar').querySelector('input');
const suggestions = document.querySelector('#searchBar').querySelector('.suggestions');
searchInput.addEventListener('change', displayMatches);
searchInput.addEventListener('keyup', displayMatches);

function displayMatches() {
  if(this.value == ''){
      suggestions.classList.add('hidden')
      return
  }
  suggestions.classList.remove('hidden')
  const matchArray = findMatches(this.value, stopAndRoute);
  const html = matchArray.map(item => {
    const regex = new RegExp(this.value, 'gi');
    const itemName = item.name.replace(regex, `<span class="hl">${this.value}</span>`);
    return `
      <li>
        <span class="name">${itemName}</span>
        <span class="type">${item.type}</span>
      </li>
    `;
  }).join('');
  suggestions.innerHTML = html;
}

function findMatches(wordToMatch, stopAndRoute) {
  return stopAndRoute.filter(item => {
    // here we need to figure out if the city or state matches what was searched
    const regex = new RegExp(wordToMatch, 'gi');
    return item.name.match(regex)
  });
}