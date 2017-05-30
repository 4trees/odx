var stopsIcon = L.Icon.extend({
    options: {
        // shadowUrl: 'leaf-shadow.png',
        iconSize:     [20, 20],
        // shadowSize:   [50, 64],
        iconAnchor:   [10, 10],
        // shadowAnchor: [4, 62],
        popupAnchor:  [0, -10]
    }
});

var stop = new stopsIcon({iconUrl: 'images/bus.png'})



