//set hint text for draw toolbar
var drawPolygon = document.querySelector('.leaflet-draw-draw-polygon')
var drawRectangle = document.querySelector('.leaflet-draw-draw-rectangle')
drawPolygon.setAttribute('title','Draw a polygon to select stops')
drawRectangle.setAttribute('title','Draw a rectangle to select stops')


//GLOBEL VARIABLES
// selection is an array of history display: [{selectedStops:[],filter:{}},...]
// selectedStops is an array of stop_id; filter is an object: {'modeType':[],'routefilter':[],'datePeriod':[], 'timePeriod':[],'fareUserType':[], 'fareMethod':[]}
var selectionHisory = [];
var display = {'selectedStops':[],'filter':{'modeType':[],'routefilter':[],'datePeriod':[], 'timePeriod':[],'fareUserType':[], 'fareMethod':[]}}



//MAP GLOBAL VIEW OPTION
const showAllVariants = document.querySelector('input[name=showallVariants]')
function toggleVariants(){
	if(showAllVariants.checked){
		//create or show them 
		if(document.querySelector('.shape')){
			d3.selectAll('.shape').classed('hidden',false)
		}else{
			drawShapes('all')
		}
	}else{
		//hide and set them to false
		d3.selectAll('.shape').classed('hidden',true)
	}
}

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
	// console.log(action)
	// let hasMatchShape = shapeStopRoute.find(function(d){return d.shape_id == shapeIdList[0]});
	// let itsRoute = hasMatchShape ? allData.route.find(function(route){return route.route_id == hasMatchShape.route_id}) : '';
	// let itsRouteColor = itsRoute ? '#' + itsRoute.route_color : '';
	let countshapes = shapeIdList.length;

	switch (action){
		case 'highlight':
			for(i=0;i<countshapes;i++){
				let shapeId = shapeIdList[i]
				let shapeItem = document.querySelector('.hlShape' + shapeId);
				shapeItem.classList.remove('hidden');
				shapeItem.parentNode.appendChild(shapeItem)
				let shapeColor = allData.route.find(function(d){return d.route_id == shapeStopRoute.find(function(d){return d.shape_id == shapeId}).route_id}).route_color
				shapeItem.style.stroke = '#' + shapeColor;
				// shapeItem.addEventListener("mouseover", function(e){
				// 	let location = map.layerPointToLatLng(L.point(e.screenX,e.screenY))
				// 	let shapeInfo = getShapeInfo(shapeIdList[i]);
				// 	shapePopup([location.lat,location.lng],shapeInfo)

				// });
				// shapeItem.addEventListener('mouseout',function(){map.closePopup();})
			}
			break
		case 'default':
			for(i=0;i<countshapes;i++){
				let shapeItem = document.querySelector('.hlShape' + shapeIdList[i]);
				shapeItem.classList.add('hidden')
				// shapeItem.style.stroke = '#b2b2b2';
				// shapeItem.classList.remove('hlShape');
				// if(!showAllVariants.checked){
				// 	shapeItem.classList.add('hidden');
				// }else{
				// 	shapeItem.classList.remove('hidden');
				// }
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
		case 'touch':
			for(i=0;i<countRoutes;i++){
				let route = routeIdList[i];
				let routeColor = allData.route.find(function(d){return d.route_id == route}).route_color;
				let routePath = document.querySelector('.route' + route);
				routePath.classList.add('touchRoute');
				routePath.style.stroke = '#' + routeColor;
				routePath.parentNode.appendChild(routePath)
			}
			break
		case 'subway':
			for(i=0;i<countRoutes;i++){
				let route = routeIdList[i];
				let routeColor = allData.route.find(function(d){return d.route_id == route}).route_color;
				let routePath = document.querySelector('.route' + route);
				routePath.classList.add('subwayRoute');
				routePath.style.stroke = '#' + routeColor;
				
			}
			break
		case 'default':
			for(i=0;i<countRoutes;i++){
				
				let route = routeIdList[i];
				let routePath = document.querySelector('.route' + route);
				routePath.classList.remove('hlRoute');
				// if this route in the selection
				if((!routePath.classList.contains('subwayRoute') && !routePath.classList.contains('selectRoute') && !routePath.classList.contains('touchRoute'))){
					routePath.style.stroke = '#666'
				}			
			}
			break
	}
}

// POPUP
//get the hint text for popup
//para are id of stop/route, type is 'stop'||'route'
function getHint(id,type){
	let hint = '';
	// switch(type){
	// 	case 'stop':
	// 		hint = display.selectedStops.includes(id) ? 'Shift click to remove this stop' : ''
	// 		break
	// 	case 'route':
	// 		break
	// }
	// hint = `Shift click to ${action} this ${type}`
	return hint;
}

//update popup for the stop 
//para are an object of the stop, an array of children stop, [a array of touching route ids, a array of touching routes]
function stopPopup(stop,childrenStops,touchRoutes){
	let children = stop.location_type == 1 ? '<p>' + childrenStops.map(function(stop){return stop.stop_name}).join(', ') + '</p>' : '';
	// let routes = touchRoutes[1].map(function(route){return `
	// 	<div class="routelabel" style="color:#${route.route_text_color};background:#${route.route_color}">${route.route_short_name || route.route_long_name}</div>
	// 	`
	// 	}).join('')
	let hint =  getHint([stop.stop_id],'stop')
	popup.setLatLng([stop.stop_lat,stop.stop_lon])
		.setContent(`
			<h5>${stop.stop_name}</h5> 
			${children}
			<hr><div id="routeListInPoP" class=\"routeList\"></div>
			<p class="hint">${hint}</p>
		`)
        .openOn(map);
	let updateRoute = d3.select('#routeListInPoP').selectAll('.routelabel').data(touchRoutes[1])
    let enterRoute = updateRoute.enter().append('div').attr('class','routelabel')
    updateRoute.merge(enterRoute)
    	.html(function(d){return d.route_short_name || d.route_long_name})
    	.style('color',function(d){return `#${d.route_text_color}`})
    	.style('background',function(d){return `#${d.route_color}`})
    	.on('click',function(d){
    		populateSelectionByRoute(d3.event.shiftKey,d.route_id)
    	})
	updateRoute.exit().remove()
}
//update popup for the shape
function shapePopup(location,shapeInfo){
	popup.setLatLng(location)
        .setContent(`
    		<h5>${shapeInfo[0]}</h5>
    		<hr>
    		<p>${shapeInfo[1]}</p>
        `)
        .openOn(map);
}
//update popup for the route
function routePopup(location,route,stopLength){
	let routeName = route.route_short_name || route.route_long_name;
	let hint = getHint([route.route_id],'route')
	popup.setLatLng(location)
        .setContent(`
    		<h5>${routeName}</h5>
    		<hr>
    		<p>${stopLength} stop(s)</p>
    		<p class="hint">${hint}</p>
        `)
        .openOn(map);
}
//update popup for the draw selection
function selectionPopup(layer,drawSelection){
	let location = layer.getBounds().getCenter()
	let isHidden;
	let overlapStops = drawSelection.filter(function(stop){return display.selectedStops.includes(stop)})
	let overlapStopsCount = overlapStops.length
	// if any of these stops in drawSelection is in current selection, show add/remove options in pop-up
	if(overlapStopsCount > 0){
		isHidden = ''
	}else{
		isHidden = 'hidden'
	}
	
	popup.setLatLng(location)
        .setContent(`
        	<div>
	        	<h5><strong>${drawSelection.length}</strong> stop(s) in this area</h5>
	        	<hr>
	        	<a id="replaceDraw" class="btn btn-default btn-xs">Set all as new selection</a>
	        </div>
    		<div class="${isHidden}">
	    		<h5><strong>${overlapStopsCount}</strong> stop(s) in current selection</h5>
	    		<hr>
	    		<a id="addDraw" class="btn btn-default btn-xs ${isHidden}" >Add them to selection</a>
	    		<a id="limitDraw" class="btn btn-default btn-xs ${isHidden}">Limit selection to them</a>
    		</div>
        `)
        .openOn(map);
    
	document.querySelector('#addDraw').addEventListener('click',function(d){populateSelectionByDraw(drawSelection,'add');layer.remove();map.closePopup();})
	document.querySelector('#replaceDraw').addEventListener('click',function(d){populateSelectionByDraw(drawSelection,'replace');layer.remove();map.closePopup();})
	document.querySelector('#limitDraw').addEventListener('click',function(d){populateSelectionByDraw(overlapStops,'replace');layer.remove();map.closePopup();})
    
}


//GET DATA
//get stops, shapes, routes for a stop
//para is a object of a stop
function getStopInfo(stop){
	let childrenStops = getChildrenStop([stop.stop_id])
	let stopsList = getIdlist(childrenStops,'stop');
	let touchRoutes = getRelationships(stopsList,'stop_route');
	let touchShapes = getRelationships(stopsList,'stop_shape');
	return [stopsList,childrenStops,touchRoutes,touchShapes]
}
//get stops,routes for a shape
//para is a shape id
function getShapeInfo(shapeId){
    let variantInfo = variantsName.find(function(d){return d.shape_id == shapeId});
    let variantName = variantInfo ? variantInfo.shape_name : shapeId;
    let variantTrip = allData.trip.find(function(d){return d.shape_id == shapeId});
    let variantDes = variantTrip ? ((variantTrip.direction_id == 0 ? 'Outbound to ' : 'Inbound to ') + variantTrip.trip_headsign) : '';
	return [variantName,variantDes]
}
//translate children stops to only parent stops and orphan stops
function replaceChildrenStop(stopIdList){
	let stops = stopIdList.map(function(d){return getParentStopId(d)})
	return stops.filter(function(d,i,v){return v.indexOf(d) === i})
}

//get children stops for stops (para is a list of stop id)
function getChildrenStop(stopIdList){
	let childStops = []
	let stopCount = stopIdList.length
	for(i=0;i<stopCount;i++){
		let stop = allData.stop.find(function(d){return d.stop_id == stopIdList[i]})
		if(stop.location_type == 0){
			childStops.push(stop)
		}else{
			childStops.push(...allData.stop.filter(function(d){return d.parent_station == stop.stop_id}))
		}
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
function populateSelectionByStop(key,stopId){
	let touchingRouteIdList = getRelationships([stopId],'stop_route')[0]
	if(key){
		if(display.selectedStops.includes(stopId)){
			display.selectedStops.splice(display.selectedStops.indexOf(stopId),1)
			//if there's any route in filter, remove all the touching routes of this stop from the filter 
			if(display.filter.routefilter.length > 0){
				display.filter.routefilter = display.filter.routefilter.filter(function(route){return !touchingRouteIdList.includes(route)})
			}
		}else{
			display.selectedStops = add(display.selectedStops,[stopId])
			//if there's any route in filter, add the touching route of this stop to current fitler
			if(display.filter.routefilter.length > 0){
				display.filter.routefilter = add(display.filter.routefilter,touchingRouteIdList)
			}
		}
	}else{
		display.selectedStops = [stopId]
		display.filter.routefilter = []
	}	
	updateSelection(display)
}
function populateSelectionByRoute(key,routeId){
	let touchingStopIdList = getRelationships([routeId],'route_stop')[0]

	if(key){	
		//if this route is not checked in filter or any touching stop is not in current selection, check it and add all touching stops to current selection
		if(!display.filter.routefilter.includes(routeId) || touchingStopIdList.some(function(id){return !display.selectedStops.includes(id)})){
			display.selectedStops = add(display.selectedStops,touchingStopIdList)
			display.filter.routefilter = add(display.filter.routefilter,[routeId])
			updateSelection()
			return
		}
		//if all touching stops are in the current selection, remvoe the stops that only on this route from current selection and uncheck this route in filter
		if(touchingStopIdList.every(function(id){return display.selectedStops.includes(id)})){
			display.filter.routefilter.splice(display.filter.routefilter.indexOf(routeId),1)
			let stopsOnFilteredRoutes = replaceChildrenStop(getIdlist(shapeStopRoute.filter(function(d){return display.filter.routefilter.includes(d.route_id)}),'stop'))
			display.selectedStops = display.selectedStops.filter(function(stop){return !touchingStopIdList.includes(stop) || (touchingStopIdList.includes(stop) && stopsOnFilteredRoutes.includes(stop))})
			updateSelection()
			return
		}
	}else{
		display.selectedStops = touchingStopIdList
		display.filter.routefilter = [routeId]
		updateSelection()
	}
	
}
function populateSelectionByDraw(data,action){
	console.log(data)
	switch (action){
		case 'add':
			display.selectedStops = add(display.selectedStops,data)
			updateSelection()
			break
		case 'replace':
			display.selectedStops = data
			display.filter.routefilter = []
			updateSelection()
			break
	}
}

function updateSelection(){

	//populate selection history
	selectionHisory.push(display)
	//update preview panel
	updatepreview()
	//update stop and route status on map
	updateMap()
}
function updateMap(){
	//highlight the selection stops and filtered routes
	d3.selectAll('.selectStop').classed('selectStop',false)
	d3.selectAll('.selectRoute').classed('selectRoute',false).style('stroke','#666');
	if(display.selectedStops.length == 0)return
	setStopsDisplay('select',display.selectedStops)
	setRoutesDisplay('select',display.filter.routefilter)
	//hidden highlight variants, reshow routes and subway
	d3.selectAll('.hlShape').classed('hidden',true)
	d3.selectAll('.route').classed('hidden',false)
	showSubway()
}


function undoSelection(){
		console.log(selectionHisory,display)
	//back to last selection
	selectionHisory.pop()
		console.log(selectionHisory,display)
	display = selectionHisory[selectionHisory.length - 1]
	updateSelection()

}

function add(oldItem,newItem){
	let current = oldItem.concat(newItem).filter(function(d,i,v){return v.indexOf(d) === i})
	return current
}
