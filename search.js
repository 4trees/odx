// search
const searchInput = document.querySelector('#searchBar').querySelector('input');
const suggestions = document.querySelector('#searchBar').querySelector('.suggestions');
searchInput.addEventListener('change', displayMatches);
searchInput.addEventListener('keyup', displayMatches);


//click map, clear search box and draw layer
map.on('click',function(){
  searchInput.value = ''
  suggestions.classList.add('hidden')
  
  drawnItems.clearLayers()
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
  const hintText = matchArray.length > 10 ? '<li class="text-center">show at most 10 results</li>' : ''
  suggestions.innerHTML = html + hintText;

  listenMatches()
}

function findMatches(wordToMatch, stopAndRoute) {
  //get the first 6 matchs
  return stopAndRoute.filter(function(item){
    const regex = new RegExp(wordToMatch, 'gi');
    return item.name.match(regex)
  }).slice(0, 12);
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