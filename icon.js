var stopsIcon = L.Icon.extend({
    options: {
        // shadowUrl: 'leaf-shadow.png',
        iconSize:     [18, 18],
        // shadowSize:   [50, 64],
        iconAnchor:   [9, 9],
        // shadowAnchor: [4, 62],
        // popupAnchor:  [18, -18]
    }
});

var stopImg = new stopsIcon({iconUrl: 'images/bus.png'})
var stationImg = new stopsIcon({iconUrl: 'images/station.png'})
var stopImgSelected = new stopsIcon({iconUrl: 'images/bus-selected.png'})
var stationImgSelected = new stopsIcon({iconUrl: 'images/station-selected.png'})

