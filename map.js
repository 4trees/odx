// MAP
var map = L.map('mapid');
map.setView(new L.LatLng(42.351486, -71.066829), 15);
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
// possible tile values 
// light_all,
// dark_all,
// light_nolabels,
// light_only_labels,
// dark_nolabels,
// dark_only_labels



//search on the map
var searchMap = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.innerHTML = `
        <div id="searchBar">
        <div class="input-group input-group-sm" >  
        <label class="input-group-addon"><i class="fa fa-search" aria-hidden="true"></i></label>            
        <input type="text" class="form-control" name="search" placeholder="stop id, stop name, or route" title="Limit to route only by starting with 'route'">               
        </div>
        <div><ul class="suggestions hidden"></ul></div>
        </div>`
        container.onclick = function() {
            this.querySelector('div').classList.remove('hidden')
        }
        return container;
    },
});
map.addControl(new searchMap());

//visual map layer
var VlayerMap = L.Control.extend({
    options: {
        position: 'bottomright'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.innerHTML = `
        <div class="dropdown">
        <a class="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded="false" onclick="toggleBox(this)" ><i class="fa fa-eye" aria-hidden="true"></i></a>
        <ul class="dropdown-menu pull-right box">
            <li>
            <a title = "Show all variants" role="button" class="custom-botton">
            <input type="checkbox" name="showallVariants" id="showallVariants" onclick="toggleVariants()"><label for="showallVariants">All Variants</label>
            </a>
            </li>
            <li>
            <a title = "Show/Hidden filtered routes" role="button" class="custom-botton" onclick="togglefilteredRoutes()">
            <input type="checkbox" name="filteredRoutes" id="filteredRoutes" checked><label for="filteredRoutes">Routes <i class="fa fa-filter light" aria-hidden="true"></i></label>
            </a>
            </li>
            <li class="dropup">
            <a title = "Show/Hidden filtered variants" class="dropdown-toggle custom-botton" role="button" onclick="toggleBox(this)" aria-haspopup="true" aria-expanded="false"><i class="fa fa-list-ul" aria-hidden="true"></i> Variants</a>
            <ul class="dropdown-menu scroll scrollbar scrollNormal pull-right" id="variantsList">Select a route firsts</ul>
            </li>
        </ul>
        </div>`
        return container;
    },
});
map.addControl(new VlayerMap());
//stop scroll map when scroll the list of variants on the map
var VariantDropdown = L.DomUtil.get('variantsList');
L.DomEvent.on(VariantDropdown, 'mousewheel', L.DomEvent.stopPropagation);

//set the zoomcontrol's position
map.zoomControl.setPosition('bottomright')
//reset map view
var resetMap = L.Control.extend({
    options: {
        position: 'bottomright'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.innerHTML = '<a title = "Back to Boston" role="button"><i class="fa fa-dot-circle-o" aria-hidden="true"></i></a>'
        container.onclick = function() {
            map.setView(new L.LatLng(42.351486, -71.066829), 15);

        }
        return container;
    },
});
map.addControl(new resetMap());


//set a drawcontrol
var drawnItems = new L.FeatureGroup();
drawnItems.options.pane = 'draw';
drawnItems.addTo(map)
var drawControl = new L.Control.Draw({
    draw: {
        marker: false,
        polyline: false,
        circle: false,
    },
    position: 'topright'
});
map.addControl(drawControl)

//TAZs visual map layer
var TAZslayerMap = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom imageButton');
        container.innerHTML = `
 
        <a title = "Select by TAZ" role="button">
        <input type="checkbox" name="TAZs" id="showTAZ" onchange="toggleTAZs(this)"><label for="showTAZ"><img src="../images/taz.svg"></label>
        </a>

        <a title = "Select by cluster" role="button">
        <input type="checkbox" name="TAZs" id="showCluster" onchange="toggleTAZs(this)"><label for="showCluster"><img src="../images/cluster.svg"></label>
        </a>
        `
        return container;
    },

});
map.addControl(new TAZslayerMap());

//add TAZs for selectable-action from map
var clusterLayer = L.geoJSON();
clusterLayer.options.pane = 'TAZs';
clusterLayer.addTo(map)
var tazLayer = L.geoJSON();
tazLayer.options.pane = 'TAZs';
tazLayer.addTo(map)

//add TAZs for view from preview panel
var odClusterLayer = L.geoJSON();
odClusterLayer.options.pane = 'odTAZs';
odClusterLayer.addTo(map)
var odTazLayer = L.geoJSON();
odTazLayer.options.pane = 'odTAZs';
odTazLayer.addTo(map)



//add legend on the map, default is hidden
var legend = L.Control.extend({
    options: {
        position: 'bottomleft'
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-legend-box hidden');
        container.innerHTML = `
        <div>
            <h5>Where do people go?</h5>
            <p><small>Destination reference rate: 0.3</small></p>
            <ul class="radio-group">
            <li class="radio" title = "Cluster perspective">
                <input type="radio" name="odAnalysis" id="showByCluster" onchange="showOD()" checked>
                <label for="showByCluster">Cluster</label>
            </li>
            <li class="radio" title = "TAZ perspective">
                <input type="radio" name="odAnalysis" id="showByTAZ" onchange="showOD()">
                <label for="showByTAZ">TAZ</label>
            </li>
            <li class="radio" title = "Stop perspective">
                <input type="radio" name="odAnalysis" id="showByStop" onchange="showOD()">
                <label for="showByStop">Stop</label>
            </li>
            </ul>
            <svg></svg>
        </div>
        `
        return container;
    },

});
map.addControl(new legend());




//create a popup
var popup = L.popup({ className: 'popup', closeButton: false })

//create panes for stops
var stopPanes = map.createPane('stops');
stopPanes.style.zIndex = 550;
stopPanes.style.pointerEvents = 'none';
//create panes for shapes
var routePanes = map.createPane('routes');
routePanes.style.zIndex = 440;
routePanes.style.pointerEvents = 'none';
//create panes for hlshapes
var hlshapePanes = map.createPane('hlshapes');
hlshapePanes.style.zIndex = 450;
hlshapePanes.style.pointerEvents = 'none';
//create panes for shapes
var shapePanes = map.createPane('shapes');
shapePanes.style.zIndex = 410;
shapePanes.style.pointerEvents = 'none';
//create panes for draw 
var drawPanes = map.createPane('draw');
drawPanes.style.zIndex = 555;
drawPanes.style.pointerEvents = 'none';
//create panes for cluster 
var tazsPanes = map.createPane('TAZs');
tazsPanes.style.zIndex = 390;
tazsPanes.style.pointerEvents = 'none';
//create panes for cluster 
var odTazsPanes = map.createPane('odTAZs');
odTazsPanes.style.zIndex = 380;
odTazsPanes.style.pointerEvents = 'none';


//TOOLTIP EDIT
map.on('draw:created', function(e) {

    let layer = e.layer;
    let drawSelection = getInsideMarkers(layer)
    if (drawSelection.length == 0) return

    drawnItems.addLayer(layer)
    selectionPopup(layer, drawSelection, false)
    layer.on('mouseover', function() { selectionPopup(layer, drawSelection, false) })
});
//add a cover layer when drawing to avoid other events fire
map.on('draw:drawstart', function(e) {
    document.querySelector('.leaflet-popup-pane').classList.add('hidden')
    if (L.DomUtil.get('.leaflet-TAZs-pane')) {
        const clusters = L.DomUtil.get('.leaflet-TAZs-pane');
        L.DomEvent.on(clusters, 'mouseover', L.DomEvent.stopPropagation);
    }
})
map.on('draw:drawstop', function(e) {
    document.querySelector('.leaflet-popup-pane').classList.remove('hidden')
})




//GLOBAL SIZE
var stopRadius = { default: 14, select: 28 }

//DRAW MAP
var stopMarkers = []

function drawStops() {
    //get all parent stops and orphan stops
    stops = allData.stop.filter(stop => stop.parent_station == '')

    let countStops = stops.length
    for (i = 0; i < countStops; i++) {
        let stop = stops[i]

        let stopMarker = L.circle([stop.stop_lat, stop.stop_lon], { radius: stopRadius.default, className: 'stop stop' + stop.stop_id, pane: 'stops' })
            .on('mouseover', function() {
                setTimeout(function() {
                    //get info of the stop
                    let stopinfo = getStopInfo(stop);
                    //show popup
                    stopPopup(stop, stopinfo[1], stopinfo[2])
                    //highlight the stop
                    setStopsDisplay('hover', [stop.stop_id])
                }, 500)
            })
            .on('mouseout', function() {
                setTimeout(function() {
                    let stopinfo = getStopInfo(stop);
                    setStopsDisplay('default', [stop.stop_id]);
                    // map.closePopup();
                }, 500)
            })
            .on('click', function(e) {
                populateSelectionByStop(e.originalEvent.shiftKey, stop.stop_id)
            })
            .addTo(map);
        stopMarkers.push({ id: stop.stop_id, marker: stopMarker })
    }

}

function drawShapes(shapeId) {
    let shapes, type, pane;
    if (shapeId == 'all') {
        shapes = allData.shape;
        type = 'shape'
        pane = 'shapes'
    } else {
        shapes = [allData.shape.find(d => d.key == shapeId)]
        type = 'hlShape'
        pane = 'hlshapes'
    }
    let countShapes = shapes.length
    for (i = 0; i < countShapes; i++) {
        let shape = shapes[i];
        let shapepts = [];
        shape.values.forEach(shapept =>
            shapepts.push([shapept.shape_pt_lat, shapept.shape_pt_lon])
        )
        let shapeMarker = L.polyline(shapepts, { className: type + ' ' + type + shape.key, pane: pane })
            .addTo(map);
        if (type == 'hlShape') {
            shapeMarker
                .on('mouseover', function(e) {
                    setTimeout(function() {
                        //get the shape info
                        let shapeinfo = getShapeInfo(shape.key)
                        //show the popup
                        shapePopup([e.latlng.lat, e.latlng.lng], shapeinfo)
                    }, 500)
                })
                .on('mouseout', function() {
                    setTimeout(function() { map.closePopup(); }, 500)
                })
        }
    }
}

var routeMarkers = []

function drawRoutes() {
    let countRoutes = allNest.route_direction_shape.length
    for (i = 0; i < countRoutes; i++) {
        let route = allNest.route_direction_shape[i];
        //find the top trips shape of this route
        let topShapeId = route.values[0].values.sort((a, b) => b.value - a.value)[0].key
        let topShape = allData.shape.find(shape => shape.key == topShapeId)

        // console.log('topshapeid',route.key,topShape)
        let shapepts = [];
        topShape.values.forEach(shapept =>
            shapepts.push([shapept.shape_pt_lat, shapept.shape_pt_lon])
        )
        // console.log('shapedots',topShape,shapepts)
        //draw the top shape as this route
        let routeMarker = L.polyline(shapepts, { className: 'route route' + route.key + ' hlShape' + topShapeId, pane: 'routes' })
            .on('mouseover', function(e) {
                setTimeout(function() {
                    //get the route info
                    let routeData = allData.route.find(function(d) { return d.route_id == route.key })
                    let touchStops = getRelationships([route.key], 'route_stop')
                    // show the popup
                    let latlng = e.latlng ? [e.latlng.lat, e.latlng.lng] : ''
                    if (e.latlng || nonRouteList.includes(route.key)) {
                        routePopup(latlng, routeData, touchStops[0].length)
                    }

                    //highlight the stops on the route
                    setStopsDisplay('hover', touchStops[0])
                    //highlight the touching routes based on the stops on this route
                    setRoutesDisplay('hover', [route.key])
                }, 500)

            })
            .on('mouseout', function() {
                setTimeout(function() {
                    let touchStops = getRelationships([route.key], 'route_stop')
                    setRoutesDisplay('default', [route.key])
                    setStopsDisplay('default', touchStops[0])
                    map.closePopup();
                }, 500)
            })
            .on('click', function(e) {
                if (!nonRouteList.includes(route.key)) {
                    populateSelectionByRoute(e.originalEvent.shiftKey, route.key)
                }
            })
            .addTo(map);
        routeMarkers.push({ id: route.key, marker: routeMarker })
    }
}

function showSubway() {
    setRoutesDisplay('subway', subwayLines)
}

function drawTAZs(name) {
    hideOD()
    let layers, tazData, isCluster
    switch (name) {
        case 'TAZ':
            layers = tazLayer
            tazData = allData.TAZ
            isCluster = false
            break
        case 'cluster':
            layers = clusterLayer
            tazData = allData.clusters
            isCluster = true
            break
    }

    layers.addData(tazData);
    layers.eachLayer(function(layer) {
        layer.on('mouseover', e => {
            let clusterSelection = getInsideMarkers(layer, isCluster);
            selectionPopup(layer, clusterSelection, e.latlng)
            e.target.setStyle({ fillColor: '#F06EAA', fillOpacity: .2, color: "#F06EAA", opacity: .6, weight: 2 })
        }).on('mouseout', e => {
            e.target.setStyle({ fillColor: '#666', fillOpacity: .2, color: "#333", opacity: .6, weight: 1 })
        })
    });
    layers.setStyle(feature => { return { fillColor: '#666', fillOpacity: .2, color: "#333", opacity: .6, weight: 1 } })

}

function toggleTAZs(e) {
    const checkedTAZ = Array.from(document.querySelectorAll('input[name="TAZs"]:checked'))
    const CountChecked = checkedTAZ.length
    let newCheckedTAZ
    if (CountChecked == 0) {
        clusterLayer.clearLayers()
        tazLayer.clearLayers()
    } else {
        newCheckedTAZ = CountChecked == 1 ? checkedTAZ[0].id : e.id;
        switch (newCheckedTAZ) {
            case 'showTAZ':
                drawTAZs('TAZ')
                document.querySelector('#showCluster').checked = false;
                clusterLayer.clearLayers()
                break
            case 'showCluster':
                drawTAZs('cluster')
                document.querySelector('#showTAZ').checked = false;
                tazLayer.clearLayers()
                break
        }
    }
}
//isCluster is true/false, because cluster.geojson is a multipolygon, and MA.geojson is polygon.
function isMarkerInsidePolygon(marker, poly, isCluster) {
    var inside = false;
    var x = marker.getLatLng().lat,
        y = marker.getLatLng().lng;
    for (var ii = 0; ii < poly.getLatLngs().length; ii++) {
        //cluster file is 'multipolygon', so need [0] to access to coordinates
        var polyPoints = isCluster ? poly.getLatLngs()[0][ii] : poly.getLatLngs()[ii]
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat,
                yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat,
                yj = polyPoints[j].lng;
            var intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }
    return inside;
};
//geo is true/false
function getInsideMarkers(layer, isCluster) {
    let insideMarkers = []
    let countMarkers = stopMarkers.length

    for (i = 0; i < countMarkers; i++) {
        let isInside = isMarkerInsidePolygon(stopMarkers[i].marker, layer, isCluster)
        if (isInside) {
            // console.log('found!'),console.log(stopMarkers[i])
            let foundStopId = stopMarkers[i].marker.options.className.split(' ')[1].replace('stop', '')
            insideMarkers.push(foundStopId)
            // console.log(drawSelection)
        }
    }
    return insideMarkers

}