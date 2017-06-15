// map
	var map = L.map('mapid',{drawControl: true});
	map.setView(new L.LatLng(42.351486,-71.066829), 15);
	L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
	  // possible tile values 
	  // light_all,
	  // dark_all,
	  // light_nolabels,
	  // light_only_labels,
	  // dark_nolabels,
	  // dark_only_labels
	//set the zoomcontrol's position
	map.zoomControl.setPosition('bottomright')

	//create a popup
    var popup = L.popup({className:'popup',closeButton:false})

    //create panes for shapes and stops relatively
    var stopPanes = map.createPane('stops');
    	stopPanes.style.zIndex = 450;
    	stopPanes.style.pointerEvents = 'none';