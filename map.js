// MAP
var map = L.map('mapid');
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

//create a drawable layers
var drawnItems = new L.FeatureGroup().addTo(map);

var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        edit:false
    },
    draw: {
    	marker: false,
    	polyline:false,
    	circle:false,
    }, 
    position:'topright'
});
map.addControl(drawControl)


//create a popup
var popup = L.popup({className:'popup',closeButton:false})

//create panes for stops
var stopPanes = map.createPane('stops');
	stopPanes.style.zIndex = 450;
	stopPanes.style.pointerEvents = 'none';
//create panes for shapes
var stopPanes = map.createPane('routes');
	stopPanes.style.zIndex = 445;
	stopPanes.style.pointerEvents = 'none';
//create panes for shapes
var stopPanes = map.createPane('shapes');
	stopPanes.style.zIndex = 440;
	stopPanes.style.pointerEvents = 'none';

//TOOLTIP EDIT

map.on(L.Draw.Event.CREATED, function (e) {
	let drawSelection = []
   	let layer = e.layer;   
	let countMarkers = stopMarkers.length
	// console.log(e)

	for(i=0;i<countMarkers;i++){
		let isInside = isMarkerInsidePolygon(stopMarkers[i],layer)
		if(isInside){
			// console.log('found!'),console.log(stopMarkers[i])
			let foundStopId = stopMarkers[i].options.className.split(' ')[1].replace('stop','')
			let foundStopData = allData.stop.find(function(d){return d.stop_id == foundStopId})
			drawSelection.push(...getChildrenStop(foundStopData))
			// console.log(drawSelection)
		}
	}

	populateSelection(false,drawSelection)
});

//DRAW MAP
var stopMarkers = []
function drawStops(){
	//get all parent stops and orphan stops
	stops = allData.stop.filter(function(stop){return stop.parent_station == ''})

	let countStops = stops.length
	for(i=0; i<countStops; i++){
		let stop = stops[i]

		let stopMarker = L.circle([stop.stop_lat,stop.stop_lon], {radius:12,className:'stop stop' + slugStr(stop.stop_id), pane:'stops'})
			.on('mouseover',function(){
				//get info of the stop
				let stopinfo = getStopInfo(stop);
				//show popup
				stopPopup(stop,stopinfo[1],stopinfo[2])
				//highlight the stop
				setStopsDisplay('highlight',[stop.stop_id])
				//highlight the shapes
				// setShapesDisplay('highlight', stopinfo[3][0])
				//display the route touching this stop
				setRoutesDisplay('highlight',getIdlist(getChildrenStop(stop),'stop'))

			})
			.on('mouseout',function(){
				let stopinfo = getStopInfo(stop);
				setStopsDisplay('show',[stop.stop_id]);
				// setShapesDisplay('show',stopinfo[3][0]);
				setRoutesDisplay('show',getIdlist(getChildrenStop(stop),'stop'))
				map.closePopup();
			})
			.on('click',function(e){
				// setStopsDisplay('select',[stop.stop_id])
				populateSelection(e.originalEvent.shiftKey,getChildrenStop(stop))
			})
			.addTo(map);
		stopMarkers.push(stopMarker)
	}

}

var shapeMarkers = []
function drawShapes(){

	let countShapes = allData.shape.length
	for(i=0; i<countShapes; i++){
		let shape = allData.shape[i];
		let shapepts = [];
		shape.values.forEach(function(shapept){
			shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
		})
		let shapeMarker = L.polyline(shapepts, {className: 'shape shape'+ shape.key,pane:'shapes'})
			// .on('mouseover',function(e){
			// 	//get the shape info
			// 	let shapeinfo = getShapeInfo(shape.key)
			// 	//show the popup
			// 	shapePopup([e.latlng.lat,e.latlng.lng],shape.key,shapeinfo[2],shapeinfo[1][0].length)
			// 	//highlight the shape and relevant shapes
			// 	setShapesDisplay('semihighlight', shapeinfo[0])
			// 	setShapesDisplay('highlight', [shape.key])
			// 	//highlight the stops on the shape
			// 	setStopsDisplay('highlight',shapeinfo[1][0])
			// })
			// .on('mouseout',function(){
			// 	let shapeinfo = getShapeInfo(shape.key)
			// 	setShapesDisplay('show', shapeinfo[0])
			// 	setStopsDisplay('show',shapeinfo[1][0])
			// 	map.closePopup();
			// })
			// .on('click',function(e){
			// 	// updateSelection(e.shiftKey,)
			// })
			.addTo(map);
		shapeMarkers.push(shapeMarker)
	}
}
var routeMarkers = []
function drawRoutes(){
	let countRoutes = allNest.route_shape.length
	for(i=0; i<countRoutes; i++){
		let route = allNest.route_shape[i];
		//find the top trips shape of this route
		let topShapeId = route.values.sort(function(a,b){return b.value - a.value})[0].key
		let topShape = allData.shape.find(function(shape){return shape.key == topShapeId})

		// console.log('topshapeid',route.key,topShape)
		let shapepts = [];
		topShape.values.forEach(function(shapept){
			shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
		})
		// console.log('shapedots',topShape,shapepts)
		//draw the top shape as this route
		let routeMarker = L.polyline(shapepts, {className: 'route route'+ route.key,pane:'routes'})
			.on('mouseover',function(e){
		// 		//get the route info
				let routeData = allData.route.find(function(d){return d.route_id == route.key})
				let touchStops = getRelationships([route.key],'route_stop')
				// show the popup
				routePopup([e.latlng.lat,e.latlng.lng],routeData,touchStops[0].length)
				//highlight the stops on the route
				setStopsDisplay('highlight',touchStops[0])
				//highlight the touching routes based on the stops on this route
				setRoutesDisplay('highlight',touchStops[0])

			})
			.on('mouseout',function(){
				let touchStops = getRelationships([route.key],'route_stop')
				setRoutesDisplay('show',touchStops[0])
				setStopsDisplay('show',touchStops[0])
				map.closePopup();
			})
			.on('click',function(e){
				let touchStops = getRelationships([route.key],'route_stop')
				// setRoutesDisplay('select',touchStops[0])
				populateSelection(e.originalEvent.shiftKey,touchStops[1])
			})
			.addTo(map);
		routeMarkers.push(routeMarker)
	}
}

function isMarkerInsidePolygon(marker, poly) {
    var inside = false;
    var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
    for (var ii=0;ii<poly.getLatLngs().length;ii++){
        var polyPoints = poly.getLatLngs()[ii];
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }

    return inside;
};
