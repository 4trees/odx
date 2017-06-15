//global url
var	stopsUrl = '/data/stops.txt',
	shapesUrl = '/data/shapes.txt',
	tripsUrl = '/data/trips.txt',
	routesUrl = '/data/routes.txt',
	shapestoprouteUrl = '/data/route_shape_stop.csv';

d3.queue()
	.defer(d3.text,stopsUrl)
	.defer(d3.text,shapesUrl)
	.defer(d3.text,tripsUrl)
	.defer(d3.text,routesUrl)
	.defer(d3.text,shapestoprouteUrl)
	.await(dataloaded);

var allStops, allShapes, allTrips, allRoutes, shapeStopRoute, stopAndRoute;
function dataloaded(err, stops, shapes, trips, routes, shapestoproute){
	allStops = parseData(stops)
	allShapes = parseData(shapes)
	allTrips = parseData(trips)
	allRoutes = parseData(routes)
	shapeStopRoute = parseData(shapestoproute)
	// console.log(allShapes)
	drawStops()
	drawShapes()

//search
stopAndRoute = allStops.map(function(stop){return {type:'stop',id:stop.stop_id,name:stop.stop_name}}).concat(allRoutes.map(function(route){return {type:'route',id:route.route_id,name:route.route_short_name || route.route_long_name}}))
}

function parseData(data){
	const newData = [];
	const rows = data.split(/\r\n|\n/);
	const title = rows[0].split(',').map(function(d){return d.split('"').join('')});
	rows.forEach(function(row,i){
		let newRow = {};
		let rowsplit = row.split(',').map(function(d){return d.split('"').join('')});
		if(i > 0){
			title.forEach(function(col,n){

				newRow[col] = rowsplit[n]
				
			})
			newData.push(newRow)
		}		
	})
	return newData
}
// function parse(d){
// 	return {
// 			route_id: d.route_id,
// 			shape_id: shape_id,
// 			stop_id: stop_id,

// }
// }