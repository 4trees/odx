//global url
var	stopsUrl = '/data/stops.txt',
	shapesUrl = '/data/shapes.txt',
	tripsUrl = '/data/trips.txt',
	routesUrl = '/data/routes.txt',
	shapestoprouteUrl = '/data/route_shape_stop.csv',
  shapename = '/data/shape-id_route-variant_lookup_fall16.csv';

d3.queue()
  .defer(d3.csv,shapename,parseshapeName)
	.defer(d3.csv,stopsUrl,parseStop)
	.defer(d3.csv,shapesUrl,parseShape)
	.defer(d3.csv,tripsUrl,parseTrip)
	.defer(d3.csv,routesUrl,parseRoute)
	.defer(d3.csv,shapestoprouteUrl,parse)
	.await(dataloaded);

var allShapesData, allShapes, shapeStopRoute,variantsName, stopAndRoute,subwayLines;
var allData = {}, allNest = {};

function dataloaded(err, variants, stops, shapes, trips, routes, shapestoproute){
//nest shape data by shape id
allShapes = d3.nest()
	.key(function(d){return d.shape_id})
	.sortValues(function(a,b) { return a.shape_pt_sequence - b.shape_pt_sequence; })
	.entries(shapes)

//data filter-out
//route_type != 0,1,3 | trip has no shape_id | shape has no trip
let nonRouteList = getIdlist(routes.filter(function(d){return ![0,1,3].includes(+d.route_type)}),'route')
shapeStopRoute = shapestoproute.filter(function(d){return d.shape_id !='' && !nonRouteList.includes(d.route_id)})
let shapeList = getIdlist(shapestoproute,'shape')

//filt data by filter as above
allData.stop = stops
allData.shape = allShapes.filter(function(d){return shapeList.includes(d.key)})
allData.trip = trips.filter(function(d){return !nonRouteList.includes(d.route_id) && shapeList.includes(d.shape_id) && d.shape_id !=''})
allData.route = routes.filter(function(d){return !nonRouteList.includes(d.route_id)})
variantsName = variants

//get a nest list
allNest.stop_shape = getNest(shapeStopRoute,'stop','shape')
allNest.stop_route = getNest(shapeStopRoute,'stop','route')
allNest.route_stop = getNest(shapeStopRoute,'route','stop')
allNest.route_shape = getNest(allData.trip.filter(function(d){return d.direction_id == 0}),'route','shape')

//overview subway line list
subwayLines = getIdlist(routes.filter(function(d){return [0,1].includes(+d.route_type)}),'route')

//search
stopAndRoute = allData.stop.map(function(stop){return {type:'stop',id:stop.stop_id,name:stop.stop_name}})
	.concat(allData.route.map(function(route){return {type:'route',id:route.route_id,name:route.route_short_name || route.route_long_name}}))


drawStops()
drawRoutes()
showSubway()

}

//create a nested data
function getNest(data,topId,secId){
	let nest = d3.nest()
		.key(function(d){return d[topId + '_id']})
		.key(function(d){return d[secId + '_id']})
		.rollup(function(d){return d.length})
		.entries(data)
		
	return nest
}


function parse(d){
   return {
    stop_id: d.stop_id,
    shape_id : d.shape_id,
    route_id : d.route_id
    }

}

function parseStop(d){
   return {
    stop_id: d.stop_id,
    stop_name : d.stop_name,
    stop_lat : d.stop_lat,
    stop_lon:d.stop_lon,
    location_type:+d.location_type,
    parent_station: d.parent_station,
    }

}
function parseTrip(d){
   return {
    route_id : d.route_id,
    service_id: d.service_id,
    trip_headsign: d.trip_headsign,
    direction_id: +d.direction_id,
    shape_id : d.shape_id,
    }

}
function parseRoute(d){
   return {
   	route_id : d.route_id,
   	agency_id: d.agency_id,
   	route_short_name : d.route_short_name,
   	route_long_name: d.route_long_name,
    route_type: +d.route_type,
    route_color : d.route_color,
    route_text_color: d.route_text_color,
    
    }

}
function parseShape(d){
   return {
    shape_id : d.shape_id,
    shape_pt_lat : +d.shape_pt_lat,
    shape_pt_lon: +d.shape_pt_lon,
    shape_pt_sequence:+d.shape_pt_sequence,
    }

}

function parseshapeName(d){
  return{
    shape_id: d.shape_id2,
    shape_name : d.route_id2 + d.variant,
  }
}