//global url
var stopsUrl = './data/stops.txt',
    shapesUrl = './data/shapes.txt',
    tripsUrl = './data/trips.txt',
    routesUrl = './data/routes.txt',
    shapestoprouteUrl = './data/route_shape_stop.csv',
    shapename = './data/shape-id_route-variant_lookup_fall16.csv',
    nonODXrouteUrl = './data/gtfs_route_ids_not_in_odx.csv',
    routeSummaryUrl = './data/route_summary_data.csv',
    clusterUrl = './data/clusters.geojson',
    TAZrUrl = './data/CTPS_TAZ_2012_POLYM_Project_.geojson',
    metricUrl = './data/sdp_route_metric_standards.csv';


d3.queue()
    .defer(d3.csv, shapename, parseshapeName)
    .defer(d3.csv, stopsUrl, parseStop)
    .defer(d3.csv, shapesUrl, parseShape)
    .defer(d3.csv, tripsUrl, parseTrip)
    .defer(d3.csv, routesUrl, parseRoute)
    .defer(d3.csv, shapestoprouteUrl, parse)
    .defer(d3.csv, nonODXrouteUrl, parseNonODXroute)
    .defer(d3.csv, routeSummaryUrl, parseRouteSummary)
    .defer(d3.json, clusterUrl)
    .defer(d3.json, TAZrUrl)
    .defer(d3.csv, metricUrl,parseMetric)
    .await(dataloaded);

var allShapesData, allShapes, shapeStopRoute, variantsName, stopAndRoute, subwayLines, nonRouteList, routeSummary,metrics;
var allData = {},
    allNest = {};

function dataloaded(err, variants, stops, shapes, trips, routes, shapestoproute, nonODXroutes, summary, clusters, TAZ, metric) {
    allData.clusters = clusters;
    allData.TAZ = TAZ;
    metrics = metric;
    //nest shape data by shape id
    allShapes = d3.nest()
        .key(d => d.shape_id)
        .sortValues((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
        .entries(shapes)

    //data filter-out
    //route_id in non-odx route list | trip has no shape_id | shape has no trip | 
    let nonODXrouteList = nonODXroutes.map(d => d.route_id)
    nonRouteList = getIdlist(nonODXroutes, 'route')
    shapeStopRoute = shapestoproute.filter(d => d.shape_id != '')
    let shapeList = getIdlist(shapestoproute, 'shape')

    //filt data by filter as above
    allData.stop = stops
    allData.shape = allShapes.filter(d => shapeList.includes(d.key))
    allData.trip = trips.filter(d => shapeList.includes(d.shape_id) && d.shape_id != '')
    allData.route = routes
    variantsName = variants
    routeSummary = summary

    //get a nest list
    allNest.stop_shape = getNest(shapeStopRoute, 'stop', 'shape')
    allNest.stop_route = getNest(shapeStopRoute, 'stop', 'route')
    allNest.route_stop = getNest(shapeStopRoute, 'route', 'stop')
    allNest.route_shape = getNest(allData.trip, 'route', 'shape')
    allNest.route_direction_shape = getNest(allData.trip, 'route', 'direction', 'shape')
    //overview subway line list
    subwayLines = getIdlist(allData.route.filter(d => [0, 1].includes(+d.route_type)), 'route')

    //search
    stopAndRoute = allData.stop.filter(stop => stop.parent_station == '').map(stop => { return { 'type': 'stop', 'id': stop.stop_id, 'name': stop.stop_name } })
        .concat(allData.route.map(route => { return { type: 'route', id: route.route_id, name: route.route_short_name || route.route_long_name } }))


    drawStops()
    drawRoutes()
    showSubway()


}

//create a nested data
function getNest(data, topId, secId, thirId) {
    let nest
    if (thirId) {
        nest = d3.nest()
            .key(d => d[topId + '_id'])
            .key(d => d[secId + '_id']).sortKeys(d3.descending)
            .key(d => d[thirId + '_id']).sortKeys(d3.ascending)
            .rollup(d => d.length)
            .entries(data)
    } else {
        nest = d3.nest()
            .key(d => d[topId + '_id'])
            .key(d => d[secId + '_id']).sortKeys(d3.ascending)
            .rollup(d => d.length)
            .entries(data)
    }
    return nest
}

function unifyPercentage(data) {
    let newData
    if (data.includes('%')) {
        newData = parseFloat(data)
    } else {
        newData = +data * 100
    }
    return newData.toFixed(2)
}
//replace space to _, replace / to #
function slugStr(str) {
    str = str.replace(/\s/g, '_').replace(/\//g, 'ODX');
    return str
}

function unslugStr(str) {
    str = str.replace(/_/g, ' ').replace(/ODX/g, '/');
    return str
}

function parse(d) {
    return {
        stop_id: slugStr(d.stop_id),
        shape_id: d.shape_id,
        route_id: slugStr(d.route_id)
    }

}

function parseStop(d) {
    return {
        stop_id: slugStr(d.stop_id),
        stop_name: d.stop_name,
        stop_lat: d.stop_lat,
        stop_lon: d.stop_lon,
        location_type: +d.location_type,
        parent_station: d.parent_station,
    }

}

function parseTrip(d) {
    return {
        route_id: slugStr(d.route_id),
        service_id: d.service_id,
        trip_headsign: d.trip_headsign,
        direction_id: +d.direction_id,
        shape_id: d.shape_id,
    }

}

function parseRoute(d) {
    return {
        route_id: slugStr(d.route_id),
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
        shape_id: slugStr(d.shape_id2),
        shape_name: slugStr(d.route_id2) + d.variant,
    }
}

function parseNonODXroute(d) {
    return {
        route_id: slugStr(d.gtfs_route_id),
    }
}

function parseRouteSummary(d) {
    if (d.data_node == 'No ODX or Service Delivery Policy Data Available') return
    return {
        route_id: slugStr(d.gtfs_route_id),
        data_node: d.data_node,
        route_category: d.route_category,
        cost_effectiveness_rank: d.cost_effectiveness_rank,
        crowding_metric: d.crowding_metric != '' ? unifyPercentage(d.crowding_metric) : '',
        reliability_metric: d.reliability_metric != '' ? unifyPercentage(d.reliability_metric) : '',
        span_of_service_metric: d.span_of_service_metric,
        frequency_metric: d.frequency_metric,
        perc_low_income_riders: d.perc_low_income_riders != '' ? unifyPercentage(d.perc_low_income_riders) : '',
        perc_minority_riders: d.perc_minority_riders != '' ? unifyPercentage(d.perc_minority_riders) : '',
        perc_vulnerable_fare_riders: d.perc_vulnerable_fare_riders != '' ? unifyPercentage(d.perc_vulnerable_fare_riders) : '',
        perc_1_ride_journeys: d.perc_1_ride_journeys != '' ? unifyPercentage(d.perc_1_ride_journeys) : '',
        perc_2_ride_journeys: d.perc_2_ride_journeys != '' ? unifyPercentage(d.perc_2_ride_journeys) : '',
        perc_3_ride_journeys: d.perc_3_ride_journeys != '' ? unifyPercentage(d.perc_3_ride_journeys) : '',
        perc_4more_ride_journeys: d.perc_4more_ride_journeys != '' ? unifyPercentage(d.perc_4more_ride_journeys) : '',
        average_daily_boardings: Math.ceil(+d.average_daily_boardings),
    }
}

function parseMetric(d){
  return {
    metric: d.Metric,
    route_type: d['Route Type'],
    rate: unifyPercentage(d['Pass Rate'])
  }
}