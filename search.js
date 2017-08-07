// search
const searchInput = document.querySelector('#searchBar').querySelector('input');
const suggestions = document.querySelector('#searchBar').querySelector('.suggestions');
searchInput.addEventListener('change', displayMatches);
searchInput.addEventListener('keyup', displayMatches);


//click map, clear search box and draw layer
map.on('click', function() {
    searchInput.value = ''
    suggestions.classList.add('hidden')

    drawnItems.clearLayers()
})

function displayMatches() {
    //set the route search only mode
    let searchValue, searchArray
    if (this.value.match(new RegExp('^route.*$', 'i'))) {
        searchValue = this.value.replace(new RegExp('^route.', 'i'), '')
        searchArray = stopAndRoute.filter(d => d.type == 'route')
    } else {
        searchValue = this.value
        searchArray = stopAndRoute
    }

    if (searchValue == '') {
        suggestions.classList.add('hidden')
        return
    }
    suggestions.classList.remove('hidden')
    const matchArray = findMatches(searchValue, searchArray);
    const html = matchArray.slice(0, 10).map(item => {
        const regex = new RegExp(searchValue, 'gi');
        const itemName = item.name.replace(regex, `<span class="hl">${searchValue}</span>`);
        const children = item.type == 'stop' ? allData.stop.filter(d => d.parent_station == item.id).map(d => d.stop_name).join(', ') : '';
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
    return stopAndRoute.filter(item => {
        const regex = new RegExp(wordToMatch, 'gi');
        return item.name.match(regex) || item.id.match(regex)
    });
}

function listenMatches() {
    let matchItems = document.querySelector('.suggestions').querySelectorAll('li')
    matchItems.forEach(item => {
        item.addEventListener('mouseover', function() {
            fireMatches(this, 'enter')
        })
        item.addEventListener('mouseout', function() {
            fireMatches(this, 'out')
        })
        item.addEventListener('click', function(e) {
            fireMatches(this, 'click', e.shiftKey)
        })
    })
}
//type: 'enter' || 'out' || 'click'
function fireMatches(e, type, key) {
    let itemId = e.getAttribute('data-id')
    let datatype = e.getAttribute('data-type')
    let itemPath = datatype == 'stop' ? stopMarkers.find(stop => ('stop' + stop.id) == slugStr(itemId)) : routeMarkers.find(route => ('route' + route.id) == slugStr(itemId))
    if (type == 'enter') {
        map.fitBounds(itemPath.marker.getBounds());
        itemPath.marker.fire('mouseover')
    } else if (type == 'out') {
        itemPath.marker.fire('mouseout')
    } else {
        // itemPath.marker.fire('click')
        // console.log()
        if (datatype == 'route') {
            if (!nonRouteList.includes(itemId.replace(datatype, ''))) {
                populateSelectionByRoute(key, itemId.replace(datatype, ''))
            }
        } else {
            populateSelectionByStop(key, itemId.replace(datatype, ''))
        }

    }
}