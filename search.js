// search
const searchInput = document.querySelector('#searchBar').querySelector('input');
const suggestions = document.querySelector('#searchBar').querySelector('.suggestions');
searchInput.addEventListener('change', displayMatches);
searchInput.addEventListener('keyup', displayMatches);

map.on('click',function(){
  searchInput.value = ''
  suggestions.classList.add('hidden')
})

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
    const children = item.type == 'stop' ? allData.stop.filter(function(d){return d.parent_station == item.id}).map(function(d){return d.stop_name}).join(', ') : ''
    return `
      <li data-id="${item.type + item.id}"" data-type="${item.type}">
        <p><span class="name">${itemName}</span>
        <span class="type">${item.type}</span></p>
        <p><small>${children}</small></p>
      </li>
    `;
  }).join('');
  suggestions.innerHTML = html;

  listenMatches()
}

function findMatches(wordToMatch, stopAndRoute) {
  return stopAndRoute.filter(item => {
    // here we need to figure out if the city or state matches what was searched
    const regex = new RegExp(wordToMatch, 'gi');
    return item.name.match(regex)
  });
}

function listenMatches(){
  let matchItems = document.querySelector('.suggestions').querySelectorAll('li')
  matchItems.forEach(function(item){
    item.addEventListener('mouseover',function(){
      fireMatches(this,'enter')
    })
    item.addEventListener('mouseout',function(){
      fireMatches(this,'out')
    })
    item.addEventListener('click',function(e){
      let type = this.getAttribute('data-type')
      fireMatches(this,'click')
      makeSelection(type,e.shiftKey,this.getAttribute('data-id').replace(type,''))

    })
  })
}
function fireMatches(e,type){
  let itemId = e.getAttribute('data-id')
  let datatype = e.getAttribute('data-type')
  let itemPath = datatype == 'stop' ? stopMarkers.find(function(stop){return ('stop' + stop.id) == slugStr(itemId)}) : routeMarkers.find(function(route){return ('route' + route.id) == slugStr(itemId)})
  if(type == 'enter'){
    map.setView(itemPath.marker.getBounds().getCenter(), 14);
    itemPath.marker.fire('mouseover')
  }else{
    itemPath.marker.fire('mouseout')
  }
}