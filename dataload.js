//global url
var stopsUrl = './data/stops.txt',
    shapesUrl = './data/shapes.txt',
    tripsUrl = './data/trips.txt',
    routesUrl = './data/routes.txt',
    shapestoprouteUrl = './data/route_shape_stop.csv',
    shapename = './data/shape-id_route-variant_lookup_fall16.csv',
    nonODXrouteUrl = './data/gtfs_route_ids_not_in_odx.csv',
routeSummaryUrl = './data/route_summary_data.csv';

d3.queue()
    .defer(d3.csv, shapename, parseshapeName)
    .defer(d3.csv, stopsUrl, parseStop)
    .defer(d3.csv, shapesUrl, parseShape)
    .defer(d3.csv, tripsUrl, parseTrip)
    .defer(d3.csv, routesUrl, parseRoute)
    .defer(d3.csv, shapestoprouteUrl, parse)
    .defer(d3.csv, nonODXrouteUrl, parseNonODXroute)
    .defer(d3.csv, routeSummaryUrl, parseRouteSummary)
    .await(dataloaded);

var allShapesData, allShapes, shapeStopRoute, variantsName, stopAndRoute, subwayLines, nonRouteList,routeSummary;
var allData = {},
    allNest = {};

function dataloaded(err, variants, stops, shapes, trips, routes, shapestoproute, nonODXroutes,summary) {
    //nest shape data by shape id
    allShapes = d3.nest()
        .key(function(d) { return d.shape_id })
        .sortValues(function(a, b) { return a.shape_pt_sequence - b.shape_pt_sequence; })
        .entries(shapes)

    //data filter-out
    //route_id in non-odx route list | trip has no shape_id | shape has no trip | 
    let nonODXrouteList = nonODXroutes.map(function(d) { return d.route_id })
    nonRouteList = getIdlist(nonODXroutes, 'route')
    shapeStopRoute = shapestoproute.filter(function(d) { return d.shape_id != '' })
    let shapeList = getIdlist(shapestoproute, 'shape')

    //filt data by filter as above
    allData.stop = stops
    allData.shape = allShapes.filter(function(d) { return shapeList.includes(d.key) })
    allData.trip = trips.filter(function(d) { return shapeList.includes(d.shape_id) && d.shape_id != '' })
    allData.route = routes
    variantsName = variants
    routeSummary = summary
console.log(routeSummary)

    //get a nest list
    allNest.stop_shape = getNest(shapeStopRoute, 'stop', 'shape')
    allNest.stop_route = getNest(shapeStopRoute, 'stop', 'route')
    allNest.route_stop = getNest(shapeStopRoute, 'route', 'stop')
    allNest.route_shape = getNest(allData.trip, 'route', 'shape')
    allNest.route_direction_shape = getNest(allData.trip, 'route', 'direction', 'shape')
    //overview subway line list
    subwayLines = getIdlist(allData.route.filter(function(d) { return [0, 1].includes(+d.route_type) }), 'route')

    //search
    stopAndRoute = allData.stop.filter(function(stop) { return stop.parent_station == '' }).map(function(stop) { return { type: 'stop', id: stop.stop_id, name: stop.stop_name } })
        .concat(allData.route.map(function(route) { return { type: 'route', id: route.route_id, name: route.route_short_name || route.route_long_name } }))


    drawStops()
    drawRoutes()
    showSubway()

}

//create a nested data
function getNest(data, topId, secId, thirId) {
    let nest
    if (thirId) {
        nest = d3.nest()
            .key(function(d) { return d[topId + '_id'] })
            .key(function(d) { return d[secId + '_id'] }).sortKeys(d3.descending)
            .key(function(d) { return d[thirId + '_id'] }).sortKeys(d3.ascending)
            .rollup(function(d) { return d.length })
            .entries(data)
    } else {
        nest = d3.nest()
            .key(function(d) { return d[topId + '_id'] })
            .key(function(d) { return d[secId + '_id'] }).sortKeys(d3.ascending)
            .rollup(function(d) { return d.length })
            .entries(data)
    }
    return nest
}


function parse(d) {
    return {
        stop_id: d.stop_id,
        shape_id: d.shape_id,
        route_id: d.route_id
    }

}

function parseStop(d) {
    return {
        stop_id: d.stop_id,
        stop_name: d.stop_name,
        stop_lat: d.stop_lat,
        stop_lon: d.stop_lon,
        location_type: +d.location_type,
        parent_station: d.parent_station,
    }

}

function parseTrip(d) {
    return {
        route_id: d.route_id,
        service_id: d.service_id,
        trip_headsign: d.trip_headsign,
        direction_id: +d.direction_id,
        shape_id: d.shape_id,
    }

}

function parseRoute(d) {
    return {
        route_id: d.route_id,
        agency_id: d.agency_id,
        route_short_name: d.route_short_name,
        route_long_name: d.route_long_name,
        route_type: +d.route_type,
        route_color: d.route_color,
        route_text_color: d.route_text_color,

    }

}

function parseShape(d) {
    return {
        shape_id: d.shape_id,
        shape_pt_lat: +d.shape_pt_lat,
        shape_pt_lon: +d.shape_pt_lon,
        shape_pt_sequence: +d.shape_pt_sequence,
    }

}

function parseshapeName(d) {
    return {
        shape_id: d.shape_id2,
        shape_name: d.route_id2 + d.variant,
    }
}

function parseNonODXroute(d) {
    return {
        route_id: d.gtfs_route_id,
    }
}

function parseRouteSummary(d) {
  if(d.data_node == 'No ODX or Service Delivery Policy Data Available')return
    return {
        route_id: d.gtfs_route_id,
        data_node: d.data_node,
        route_category: d.route_category,
        cost_effectiveness_rank: d.cost_effectiveness_rank,
        crowding_metric:d.crowding_metric != '' ? parseFloat(d.crowding_metric) : '',
        reliability_metric:d.reliability_metric != '' ? parseFloat(d.reliability_metric) : '',
        span_of_service_metric: d.span_of_service_metric,
        frequency_metric: d.frequency_metric,
        perc_low_income_riders: d.perc_low_income_riders != '' ? parseFloat(d.perc_low_income_riders) : '',
        perc_minority_riders: d.perc_minority_riders != '' ? parseFloat(d.perc_minority_riders) : '',
        perc_vulnerable_fare_riders: d.perc_vulnerable_fare_riders != '' ? parseFloat(d.perc_vulnerable_fare_riders) : '',
        perc_1_ride_journeys: d.perc_1_ride_journeys != '' ? parseFloat(d.perc_1_ride_journeys) : '',
        perc_2_ride_journeys: d.perc_2_ride_journeys != '' ? parseFloat(d.perc_2_ride_journeys) : '',
        perc_3_ride_journeys: d.perc_3_ride_journeys != '' ? parseFloat(d.perc_3_ride_journeys) : '',
        perc_4more_ride_journeys: d.perc_4more_ride_journeys != '' ? parseFloat(d.perc_4more_ride_journeys) : '',
        average_daily_boardings: d.average_daily_boardings,
    }
}