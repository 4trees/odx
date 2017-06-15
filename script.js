//draw stops
function drawStops() {
allStops.forEach(function(stop){
	//get the routes belong to this stop
	// console.log(stop)
	let routeslist = shapeStopRoute
		.filter(function(d){return d.stop_id == stop.stop_id})
		.map(function(d){return d.route_id})
		.filter(function(d,i,v){return v.indexOf(d) === i})
	// get the routes data
	let routes = allRoutes.filter(function(d){return routeslist.includes(d.route_id)})
	// console.log(routes)
	//get the shapes belong to this stop
	let shapeslist = shapeStopRoute
		.filter(function(d){return d.stop_id == stop.stop_id})
		.map(function(d){return d.shape_id})
		.filter(function(d,i,v){return v.indexOf(d) === i})
    // console.log(shapeslist)
	// here need to do something with parent station
	L.circle([stop.stop_lat,stop.stop_lon], {radius:8,className:'stop stop' + stop.stop_id, pane:'stops'})
		.on('mouseover',function(){
            //set location and content for stop popup
            popup.setLatLng([stop.stop_lat,stop.stop_lon])
              .setContent('<h5>' + stop.stop_name + '</h5>' + routes.map(function(route){return '<span class="routelabel" style="color:#' + route.route_text_color + ';background:#' + route.route_color + '">' + (route.route_short_name || route.route_long_name) + '</span>'}).join(''))
              .openOn(map);
            //highlight the stop
             // this._path.classList.add('selected');
            this.bringToFront()
            //highlight the shapes belong to this stop on the map, and colored by route 
            shapeslist.forEach(function(shape){
            	const findShape = document.querySelector('.shape' + shape)
            	findShape.style.stroke = routes.find(function(route){return route.route_id = shapeStopRoute.find(function(d){return d.shape_id == shape}).route_id}).route_color
            	findShape.parentNode.appendChild(findShape)
            })
            
         })
        .on('mouseout',function(){
            // map.closePopup()
            shapeslist.forEach(function(shape){
            	document.querySelector('.shape' + shape).style.stroke = '#999'
            })
            // this._path.classList.remove('selected');
        })
        .on('click',function(){
        	preview(stop,routes)
        	
        })
		.addTo(map);

})
}

// draw routes
function drawShapes(){
//get the route and shape menu
const tripsByshape = d3.nest()
  .key(function(d){return d.route_id})
  .key(function(d){return d.shape_id})
  .rollup(function(d){return d.length})
  .entries(allTrips)
  
//get the top shape of each route
let routes = [] 
tripsByshape.forEach(function(route){
  if(route.key == "553"){console.log(route)}
  let sortedshape = route.values.sort(function(a,b){return b.value - a.value})
  routes.push(sortedshape[0].key)
})


//nest by shape id
const shapesById = d3.nest()
	.key(function(d){return d.shape_id})
	.sortValues(function(a,b) { return (+a.shape_pt_sequence) - (+b.shape_pt_sequence); })
	.entries(allShapes)

shapesById.forEach(function(shape){
	let hasMatchRoute = shapeStopRoute.find(function(d){return d.shape_id == shape.key});
	let route = hasMatchRoute ? allRoutes.find(function(route){return route.route_id == hasMatchRoute.route_id}) : '';
	let shapepts = [];
	shape.values.forEach(function(shapept){
		shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
	})
  // let isMainShape = routes.find(function(shape){return shape.mainShape.key == shape.shape_id}) ? ' mainshape':''
  let isMainShape = routes.includes(shape.key) ? ' mainshape':''
	L.polyline(shapepts, {className: 'hidden shape shape'+ shape.key + ' route' + route.route_id + isMainShape})
	.on('mouseover',function(e){
		//highlight the shape by route color

		if(route){
			document.querySelectorAll('.route' + route.route_id).forEach(function(shape){
				shape.style.stroke =  route.route_color;
				// shape.style.opacity = .5;
				shape.parentNode.appendChild(shape)

			})
			this.getElement().style.strokeWidth = 8;
			// this.getElement().style.stroke = route.route_color;
		}else{
			this.getElement().style.stroke = '#333';
			this.bringToFront()
		}
		
      	//set location and content for stop popup
      	let routeName = route ? (route.route_short_name || route.route_long_name) : 'No match route';
      	let stops = shapeStopRoute.filter(function(d){return d.shape_id == shape.key}).sort(function(a,b){return a.stop_sequence - b.stop_sequence}).map(function(d){return d.stop_id})
    	popup.setLatLng([e.latlng.lat,e.latlng.lng])
            .setContent('<h5>' + routeName  + '</h5>' + '<p>Shape ' + shape.key + '</p>')
            .openOn(map);
    })
    .on('mouseout',function(){
    	document.querySelectorAll('.shape').forEach(function(shape){
    		shape.style.stroke = '#999';
    		shape.style.strokeWidth = 2;
    	})
    	// this.getElement().style.stroke = '#999';
     	// map.closePopup();
    })
	.addTo(map);
})	
toggleViariants()
}
function toggleViariants(){
  if(document.querySelector('input[name=showViarants]').checked){
    d3.selectAll('.shape').classed('hidden',false)
  }else{
    d3.selectAll('.shape').classed('hidden',true)
    d3.selectAll('.mainshape').classed('hidden',false)
  }
  
}

var odxdata = [{o:12,d:23,x:12}]
    stagedata = [{1:32,2:3,3:12}]
    odxKey = Object.keys(odxdata[0])
    stageKey = Object.keys(stagedata[0])
// global setting for preview
var w = d3.select('.panel-body').select('section').node().clientWidth;

var fullWidthScale = d3.scaleLinear()
    .range([0,w])
var fullWidthLabelScale = d3.scaleLinear()
    .range([0,w-30])
  
var stack = d3.stack()
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

var colorForODX = d3.scaleOrdinal()
  .domain(odxKey)
  // .range(['#96ceb4','pink','ffcc5c'])
  .range(['#559e83','#ae6a41','#c3cb71'])
var colorForstage = d3.scaleOrdinal()
  .domain(stageKey)
  .range(['#99d5cf','#66c0b7','#32ab9f','#009688'])



function preview(stop,routes){
previewPanel.style.left = 0;
showStopPreview(stop,routes)
drawStackedChart('odx',odxKey, odxdata,colorForODX)
drawStackedChart('stage',stageKey, stagedata,colorForstage)

}

function showStopPreview(stop,routes){

console.log(stop,routes)

const stopName = stop.stop_name || 'Unknown stop'
d3.select('#stopsummary').select('.stopname').html(stopName)


routes.forEach(function(route){
  //now only show all the trips of the route, should cal by stop as well (need odx data)
	let getTripsCount = allTrips.filter(function(trip){return trip.route_id == route.route_id}).length
  	route.trips_count = getTripsCount;
})

  showRouteTostop(routes)

}

function showRouteTostop(route){
var routesToStopContainer = d3.select('#routesToStop')
    routesToStopContainer.select('p').html(route.length + ' route(s)')

fullWidthLabelScale
  .domain([0, d3.sum(route, function(d){return d.trips_count})])
var updateroutesToStop = routesToStopContainer.select('ul').selectAll('.routeitem')
  .data(route.sort(function(a,b){return b.trips_count - a.trips_count}),function(d){return d.route_id})
updateroutesToStop.exit().remove()
var enterroutesToStop = updateroutesToStop.enter()
  .append('li').attr('class','routeitem')
enterroutesToStop.append('p')
  .append('span')
  .attr('class','routelabel')
  .style('color',function(d){return '#' + d.route_text_color})
  .style('background',function(d){return '#' + d.route_color})
  .html(function(d){return d.route_short_name || d.route_long_name})
var svgInRouteToStop = enterroutesToStop.append('svg')
  .attr('height','12px')
  .attr('width',w)
svgInRouteToStop.append('rect')
  .attr('x',0)
  .attr('y',0)
  .attr('width',function(d){return fullWidthLabelScale(d.trips_count)}) 
  .attr('height','8px')
  .style('fill','#ccc')
svgInRouteToStop.append('text')
  .attr('x',function(d){return fullWidthLabelScale(d.trips_count) + 5})
  .attr('y',6)
  .text(function(d){return numberWithCommas(d.trips_count)})
  .style('fill','grey')
  .style('font-size','7px')

}

function drawStackedChart(type, key, data, color){
  var plot = d3.select('#' + type).select('svg')
    .attr('width',w)
    .attr('height','40px')

  stack.keys(key)

  fullWidthScale
    .domain([0, d3.sum(Object.values(data[0]))])

  var updateElement = plot.selectAll('.element')
    .data(stack(data))
  updateElement.exit().remove()
  var enterElement = updateElement.enter()
    .append('g').attr('class','element')
  enterElement.append('rect')
    .attr('y', 0)
    .attr('x', function(d,i){return fullWidthScale(d[0][0])})
    .attr('width', function(d,i) {return fullWidthScale(d[0][1] - d[0][0])})
    .attr('height', '25px')
    .style('fill',function(d){return color(d.key)})
  enterElement.append('text')
    .attr('y', '35px')
    .attr('x', function(d,i){return fullWidthScale((d[0][0] + d[0][1]) / 2)})
    .text(function(d){return d.key})
}

//trunc the long word: for station name on the top right
String.prototype.trunc = String.prototype.trunc ||
    function(n){
        return (this.length > n) ? this.substr(0, n-1) + '...' : this;
    };

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// search
const searchInput = document.querySelector('#searchBar').querySelector('input');
const suggestions = document.querySelector('#searchBar').querySelector('.suggestions');
searchInput.addEventListener('change', displayMatches);
searchInput.addEventListener('keyup', displayMatches);

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
    return `
      <li>
        <span class="name">${itemName}</span>
        <span class="type">${item.type}</span>
      </li>
    `;
  }).join('');
  suggestions.innerHTML = html;
}

function findMatches(wordToMatch, stopAndRoute) {
  return stopAndRoute.filter(item => {
    // here we need to figure out if the city or state matches what was searched
    const regex = new RegExp(wordToMatch, 'gi');
    return item.name.match(regex)
  });
}