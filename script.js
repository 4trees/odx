//set shiftKey actions for draw toolbar
var drawPolygon = document.querySelector('.leaflet-draw-draw-polygon')
var drawRectangle = document.querySelector('.leaflet-draw-draw-rectangle')
drawPolygon.setAttribute('title','Click to draw your new selection; Shift click to draw additional selection')
drawRectangle.setAttribute('title','Click to draw your new selection; Shift click to draw additional selection')


//GLOBEL VARIABLES
var selection = [];
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
	str = str.replace(/\s+/g, '-').toLowerCase();
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
			case 'highlight':
				stopItem.classList.add('hlStop');
				stopItem.parentNode.appendChild(stopItem)
				break
			case 'select':
				stopItem.classList.add('selectStop');
				break
			case 'show':
				stopItem.classList.remove('hlStop');
				stopItem.classList.remove('hidden');
				break
			case 'hide':
				stopItem.classList.add('hidden');
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
function setRoutesDisplay(action,stopIdList){
	// console.log(stopIdList)
	let touchingRoutes = shapeStopRoute.filter(function(d){return stopIdList.includes(d.stop_id)})
	let nestTouchingRoutes = getNest(touchingRoutes,'route','stop')
	// console.log(nestTouchingRoutes)
	let countStops = stopIdList.length
	let countRoutes = nestTouchingRoutes.length
	switch (action){
		case 'highlight':
			for(i=0;i<countRoutes;i++){
				let route = nestTouchingRoutes[i]
				let routeColor = allData.route.find(function(d){return d.route_id == route.key}).route_color
				let routePath = d3.select('.route' + route.key)
				// console.log(route.key,routePath.node())
				routePath
					.style('stroke',routeColor)
					.style('stroke-width',6)
					.style('opacity',routeScale(route.values.length / countStops))
				// routePath.node().parentNode.appendChild(routePath.node())
			}
			break
		case 'select':
			for(i=0;i<countRoutes;i++){
				let route = nestTouchingRoutes[i]
				let routePath = d3.select('.route' + route.key)
				routePath
					.classed('selectRoute',true)
					.style('opacity',routeScale(route.values.length / countStops))
			}
			break
		case 'show':
			for(i=0;i<countRoutes;i++){
				let route = nestTouchingRoutes[i]
				let routePath = d3.select('.route' +route.key)
				routePath
					.style('stroke','#999')
					.style('stroke-width',3)
					.style('opacity',.8)
			}
			break
	}
}
//MAP GLOBAL VIEW OPTION
var isShowViariants = false;
function toggleViariants(){
	if(isShowViariants){
		console.log(isShowViariants)
		//hide and set them to false
		d3.selectAll('.shape').classed('hidden',true)
		isShowViariants = false;
	}else{
		//create or show them 
		if(document.querySelector('.shape')){
			d3.selectAll('.shape').classed('hidden',false)
		}else{
			drawShapes()
		}
		isShowViariants = true;
	}
}
// POPUP
//update popup for the stop 
//para is an obeject of the stop, an array of children stop, [a array of touching route ids, a array of touching routes]
function stopPopup(stop,childrenStops,touchRoutes){
	let children = stop.location_type == 1 ? '<p>' + childrenStops.map(function(stop){return stop.stop_name}).join(', ') + '</p>' : '';
	let routes = touchRoutes[1].map(function(route){return `
		<div class="routelabel" style="color:#${route.route_text_color};background:#${route.route_color}">${route.route_short_name || route.route_long_name}</div>
		`
		}).join('')
	let hint = selection.length == 0? '' : '<p class=\"hint\">Shift click to add to current selection</p>'
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
	let hint = selection.length == 0? '' : '<p class=\"hint\">Shift click to add to current selection</p>'
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
//get trip info for 

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
function getParentStopId(stop){
	stop = allData.stop.find(function(d){return d.stop_id == stop})
	let parentStopId = stop.parent_station ? stop.parent_station : stop.stop_id;
	return parentStopId
}

//get a id list
// para : 'items' is a array of the stops/routes/shapes/trips
// 'type' is 'stop' || 'shape' || 'route' || 'trip'
function getIdlist(items,type){
	let idList;
	if(type == 'stop'){
		let count = items.length;
		let newitems = [];
		for(i=0;i<count;i++){
			let stops = getChildrenStop(items[i]).map(function(d){return d.stop_id})
			newitems.push(...stops);
		}
		idList = newitems
	}else{
		idList = items.map(function(d){return d[type + '_id']})
	}
	return idList.filter(function(d,i,v){return v.indexOf(d) === i})
}

// get all related stops/routes/shapes for a stop/route/shape
// para : 'idList' is a array of the stop/route/shape ids
// 'relationship' is 'stop_shape' || 'stop_route' || 'route_shape'
function getRelationships(idList,relationship){
	let relationshipType = relationship.split('_')[1]
	let istoShape = relationshipType == 'shape'? 'key' : (relationshipType + '_id')
	let relationshipMenu = allNest[relationship]
		.filter(function(d){return idList.includes(d.key)})
		.map(function(d){return d.values})

	let countMenu = relationshipMenu.length
	let relationshipList = []	
	for(i=0;i<countMenu;i++){
		relationshipList.push(...relationshipMenu[i].map(function(d){return d.key}))
	}
	relationshipList = relationshipList.filter(function(d,i,v){return v.indexOf(d) === i})
	let relationships = allData[relationshipType].filter(function(d){return relationshipList.includes(d[istoShape])})
	return [relationshipList,relationships]
}

//UPDATE SELECTION
function populateSelection(key,data){
//if hold shiftkey to select, add the data to last element of selection, otherwise add to selection as the last element.
	if(key){
		if(selection.length == 0){
			selection.push([data])
		}else{
			selection[selection.length - 1].push(data)
		}
	}else{
		selection.push([data])
	}
	console.log(key,selection)
	let display = selection[selection.length-1].reduce(function(a, b){
     return a.concat(b);
	});
	console.log(display)
	updateSelection(display)
}
function updateSelection(data){
	//highlight the selection stops and routes
	d3.selectAll('.selectStop').classed('selectStop',false)
	d3.selectAll('.selectRoute').classed('selectRoute',false).style('opacity',.8).style('stroke','#999').style('stroke-width',3);
	setStopsDisplay('select',getIdlist(data,'stop'))
	setRoutesDisplay('select',getIdlist(data,'stop'))
	updatepreview(data)
}

