//set shiftKey actions for draw toolbar
var drawPolygon = document.querySelector('.leaflet-draw-draw-polygon')
var drawRectangle = document.querySelector('.leaflet-draw-draw-rectangle')
drawPolygon.setAttribute('title','Click to draw your new selection; Shift click to draw additional selection')
drawRectangle.setAttribute('title','Click to draw your new selection; Shift click to draw additional selection')


//GLOBEL VARIABLES
var selection = [], display = {};
var routeScale =  d3.scaleLinear()
    .range([0,1])
    .domain([0,1])


//GLOBEL FUNCTION
//trunc the long word: for station name on the top right
String.prototype.trunc = String.prototype.trunc ||
    function(n){
        return (this.length > n) ? this.substr(0, n-1) + '...' : this;
    };

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function slugStr(str){
	str = str.replace(/\s+/g, '-');
	return str
}

function getMatch(a, b) {
    var matches = [];

    for ( var i = 0; i < a.length; i++ ) {
        for ( var e = 0; e < b.length; e++ ) {
            if ( a[i] === b[e] ) matches.push( a[i] );
        }
    }
    return matches;
}

// SET DISPLAY
//set the stop display (second para is a array of stop ids)
function setStopsDisplay(action,stopIdList){

	let countstops = stopIdList.length;
	for(i=0;i<countstops;i++){
		let stopItem = document.querySelector('.stop' + slugStr(getParentStopId(stopIdList[i])));
		switch (action){
			case 'hover':
				stopItem.classList.add('hlStop');
				stopItem.parentNode.appendChild(stopItem)
				break
			case 'select':
				stopItem.classList.add('selectStop');
				break
			case 'default':
				stopItem.classList.remove('hlStop');
				break
		}
	}
}
//set the shape display(second para is a array of shape ids)
function setShapesDisplay(action,shapeIdList){
	let hasMatchShape = shapeStopRoute.find(function(d){return d.shape_id == shapeIdList[0]});
	let itsRoute = hasMatchShape ? allData.route.find(function(route){return route.route_id == hasMatchShape.route_id}) : '';
	let itsRouteColor = itsRoute ? '#' + itsRoute.route_color : '';
	let countshapes = shapeIdList.length;

	switch (action){
		case 'highlight':
			for(i=0;i<countshapes;i++){
				let shapeItem = document.querySelector('.shape' + shapeIdList[i]);
				shapeItem.classList.remove('hidden');
				shapeItem.style.stroke = itsRouteColor;
				shapeItem.style.strokeWidth = 8;
				shapeItem.parentNode.appendChild(shapeItem)

			}
			break
		case 'semihighlight':
			for(i=0;i<countshapes;i++){
				let shapeItem = document.querySelector('.shape' + shapeIdList[i]);
				shapeItem.classList.remove('hidden');
				shapeItem.style.stroke = itsRouteColor;
				shapeItem.style.strokeWidth = 2;
				shapeItem.parentNode.appendChild(shapeItem)
			}
			break
		case 'show':
			for(i=0;i<countshapes;i++){
				let shapeItem = document.querySelector('.shape' + shapeIdList[i]);
				shapeItem.classList.remove('hidden');
				shapeItem.style.stroke = '#b2b2b2';
				shapeItem.style.strokeWidth = 2;
				shapeItem.style.opacity = .8;
			}
			break
		case 'hide':
			for(i=0;i<countshapes;i++){
				let shapeItem = document.querySelector('.shape' + shapeIdList[i]);
				shapeItem.classList.add('hidden');
			}
			break
	}
}
//set route display
function setRoutesDisplay(action,routeIdList){
	// console.log(stopIdList)
	// let touchingRoutes = shapeStopRoute.filter(function(d){return stopIdList.includes(d.stop_id)})
	// let nestTouchingRoutes = getNest(touchingRoutes,'route','stop')
	// console.log(nestTouchingRoutes)
	let countRoutes = routeIdList.length
	// let countRoutes = nestTouchingRoutes.length
	switch (action){
		case 'hover':
			for(i=0;i<countRoutes;i++){
				let route = routeIdList[i];
				let routeColor = allData.route.find(function(d){return d.route_id == route}).route_color;
				let routePath = document.querySelector('.route' + route);
				routePath.classList.add('hlRoute');
				routePath.style.stroke = '#' + routeColor;
				// console.log(route.key,routePath.node())
				// routePath
				// 	.style('stroke',routeColor)
				// 	.style('stroke-width',6)
				// 	.style('opacity',routeScale(route.values.length / countStops))
				routePath.parentNode.appendChild(routePath)
			}
			break
		case 'select':
			for(i=0;i<countRoutes;i++){
				let route = routeIdList[i];
				let routeColor = allData.route.find(function(d){return d.route_id == route}).route_color;
				let routePath = document.querySelector('.route' + route);
				routePath.classList.add('selectRoute');
				routePath.style.stroke = '#' + routeColor;
				routePath.parentNode.appendChild(routePath)
			}
			break
		case 'default':
			for(i=0;i<countRoutes;i++){
				let route = routeIdList[i];
				let routePath = document.querySelector('.route' + route);
				routePath.classList.remove('hlRoute');
				// if this route in the selection
				if(!display.hasOwnProperty('routes') || !display.routes.includes(route)){
					routePath.style.stroke = '#666'
				}			
			}
			break
	}
}
//MAP GLOBAL VIEW OPTION
var isShowVariants = false;
function toggleVariants(){
	if(isShowVariants){
		console.log(isShowVariants)
		//hide and set them to false
		d3.selectAll('.shape').classed('hidden',true)
		isShowVariants = false;
	}else{
		//create or show them 
		if(document.querySelector('.shape')){
			d3.selectAll('.shape').classed('hidden',false)
		}else{
			drawShapes()
		}
		isShowVariants = true;
	}
}
// POPUP
//get the hint text for popup
//para are id of stop/route, type is 'stop'||'route'
function getHint(id,type){
	let hint;
	if(selection.length == 0){
		hint = '';
	}else{
		hint = display[type + 's'].includes(id) ? '<p class=\"hint\">Shift click to remove from current selection</p>' : '<p class=\"hint\">Shift click to add to current selection</p>'
	}
	return hint;
}

//update popup for the stop 
//para are an object of the stop, an array of children stop, [a array of touching route ids, a array of touching routes]
function stopPopup(stop,childrenStops,touchRoutes){
	let children = stop.location_type == 1 ? '<p>' + childrenStops.map(function(stop){return stop.stop_name}).join(', ') + '</p>' : '';
	let routes = touchRoutes[1].map(function(route){return `
		<div class="routelabel" style="color:#${route.route_text_color};background:#${route.route_color}">${route.route_short_name || route.route_long_name}</div>
		`
		}).join('')
	let hint =  getHint(stop.stop_id,'stop')
	popup.setLatLng([stop.stop_lat,stop.stop_lon])
		.setContent(`
			<h5>${stop.stop_name}</h5> 
			${children}
			<hr><div class=\"routeList\">${routes}</div>
			${hint}
		`)
        .openOn(map);
	
}
//update popup for the shape
function shapePopup(location,shapeId,route,stopLength){
	let routeName = route ? (route.route_short_name || route.route_long_name) : 'No match route';
	popup.setLatLng(location)
        .setContent(`
    		<h5>${routeName}</h5>
    		<p>Shape ${shapeId}</p>
    		<hr>
    		<p>${stopLength} stop(s)</p>
        `)
        .openOn(map);
}
//update popup for the route
function routePopup(location,route,stopLength){
	let routeName = route.route_short_name || route.route_long_name;
	let hint = getHint(route.route_id,'route')
	popup.setLatLng(location)
        .setContent(`
    		<h5>${routeName}</h5>
    		<hr>
    		<p>${stopLength} stop(s)</p>
    		${hint}
        `)
        .openOn(map);
}

//GET DATA
//get stops, shapes, routes for a stop
//para is a object of a stop
function getStopInfo(stop){
	let childrenStops = getChildrenStop(stop)
	let stopsList = getIdlist(childrenStops,'stop');
	let touchRoutes = getRelationships(stopsList,'stop_route');
	let touchShapes = getRelationships(stopsList,'stop_shape');
	return [stopsList,childrenStops,touchRoutes,touchShapes]
}
//get stops,routes for a shape
//para is a shape id
function getShapeInfo(shapeId){
	let hasMatchShape = shapeStopRoute.find(function(d){return d.shape_id == shapeId});
	let touchRoute,touchStops,shapesList
	if(hasMatchShape){
		shapesList = getIdlist(shapeStopRoute.filter(function(d){return d.route_id == hasMatchShape.route_id}),'shape');
		touchRoute = allData.route.find(function(route){return route.route_id == hasMatchShape.route_id});	
		touchStops = getRelationships([hasMatchShape.route_id],'route_stop');
	}else{
		shapesList = [shapeId]
		touchRoute = '';
		touchStops = [[],[]];
	}
	return [shapesList,touchStops,touchRoute]
}
//translate children stops to only parent stops and orphan stops
function replaceChildrenStop(stopIdList){
	let stops = stopIdList.map(function(d){return getParentStopId(d)})
	return stops.filter(function(d,i,v){return v.indexOf(d) === i})
}

//get children stops for stops (para is an object of the stop)
function getChildrenStop(stop){
	let childStops = []
	if(stop.location_type == 0){
		childStops.push(stop)
	}else{
		childStops = allData.stop.filter(function(d){return d.parent_station == stop.stop_id})
	}
	return childStops
}
//get parent stops for stops (para is a stop id)
function getParentStopId(stopId){
	stop = allData.stop.find(function(d){return d.stop_id == stopId})
	let parentStopId = stop.parent_station ? stop.parent_station : stop.stop_id;
	return parentStopId
}

//get a id list
// para : 'items' is a array of the stops/routes/shapes/trips
// 'type' is 'stop' || 'shape' || 'route' || 'trip'
function getIdlist(items,type){
	let idList = items.map(function(d){return d[type + '_id']})
		.filter(function(d,i,v){return v.indexOf(d) === i})
	return idList
}
// get all related stops/routes/shapes for a stop/route/shape
// para : 'idList' is a array of the stop/route/shape ids
// 'relationship' is 'stop_shape' || 'stop_route' || 'route_shape' || 'route_stop'
function getRelationships(idList,relationship){
	let relationshipType = relationship.split('_')[1]
	let istoShape = relationshipType == 'shape'? 'key' : (relationshipType + '_id')
	let relationshipMenu = allNest[relationship]
		.filter(function(d){return idList.includes(d.key)})
		.map(function(d){return d.values})
	let countMenu = relationshipMenu.length
	let relationshipList = []	
	for(i=0;i<countMenu;i++){
		relationshipList.push(...relationshipMenu[i].map(function(d){return  d.key}))
	}
	if(relationshipType == 'stop'){
		relationshipList = replaceChildrenStop(relationshipList)
	}
	relationshipList = relationshipList.filter(function(d,i,v){return v.indexOf(d) === i})
	let relationships = allData[relationshipType].filter(function(d){return relationshipList.includes(d[istoShape])})
	return [relationshipList,relationships]
}

//UPDATE SELECTION
function populateSelection(key,data){
	if(data.stops.length == 0)return
//data is an object: {stops:[stop.stop_id],routes:[route.route_id]}
//selection is an array of display
//when hold shiftkey to select, do remove if any stops in stop selection, otherwise do add. if any stops not on the route selection, change to stop selection mode.
//when not hold shiftkey or no selection yet, add to selection as the last element.

	if(!key || selection.length == 0){
		//get the new selection
		display = data
	}else{
		//get the last item in selection
		display = selection[selection.length - 1]
		//get the route, only could be one route since no way to select multiple routes at once
		let newRoute = data.routes[0];
		let newRoutes = display.routes.concat(data.routes)
		console.log(data.routes.length)
		//if it's a stop selection and any stop in selection, do remove all selected stops from selection
		if(data.routes.length == 0 && data.stops.some(function(d){return display.stops.includes(d)})){
			console.log('find same stop')
			display.stops = display.stops.filter(function(d){return !data.stops.includes(d)})
		}
		//if it's a route selection and any route in selection, do remove all selected routes from selection
		else if(data.routes.length != 0 && (display.routes.indexOf(newRoute) > -1)){	
			console.log('find same route')		
			display.routes.splice(display.routes.indexOf(newRoute),1)
			// only remove stops on this route.
			let onRoutesStopList = replaceChildrenStop(getIdlist(shapeStopRoute.filter(function(d){return display.routes.includes(d.route_id)}),'stop'))
			display.stops = display.stops.filter(function(d){return onRoutesStopList.includes(d)})
		}else{
			display.stops = display.stops.concat(data.stops).filter(function(d,i,v){return v.indexOf(d) === i})
			//remove route selection if any stop not on the routes
			if(newRoutes.length != 0){
				let onRoutesStopList = replaceChildrenStop(getIdlist(shapeStopRoute.filter(function(d){return newRoutes.includes(d.route_id)}),'stop'))
				display.routes = display.stops.some(function(d){return !onRoutesStopList.includes(d)}) ? [] : newRoutes
			}else{
				display.routes = newRoutes
			}
		}	
	}
	console.log(display)
	selection.push(display)

	console.log(key,selection)
	
	updateSelection(display)
}
function updateSelection(data){
	//highlight the selection stops and routes
	d3.selectAll('.selectStop').classed('selectStop',false)
	d3.selectAll('.selectRoute').classed('selectRoute',false).style('stroke','#666');
	setStopsDisplay('select',data.stops)
	setRoutesDisplay('select',data.routes)
	updatepreview(data)
}

