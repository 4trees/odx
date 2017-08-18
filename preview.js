// testing data
const odx = [
    { type: 'o', count: 31300 },
    { type: 'x', count: 7800 },
    { type: 'd', count: 11230 }
]
const od = { "destination_inference_rate": 50, "data": [{ "id": "70002", "journey_count": 31300 }, { "id": "70007", "journey_count": 30300 }, { "id": "8824", "journey_count": 3100 }] }
const transfer = [{ from: '9', to: '1', count: 32000 }, { from: '43', to: '44', count: 7000 }, { from: '95', to: '1', count: 6300 }, { from: '39', to: '110', count: 4500 }, { from: '55', to: '66', count: 3000 }, { from: 'Green-E', to: 'Red', count: 2300 }]
const routesummary = { route_id: '9', data_note: 'No Service Delivery Policy Metrics Available', route_category: 'Key bus', cost_effectiveness_rank: 32, crowding_metric: .83, reliability_metric: .72, span_of_service_metric: 'Y', frequency_metric: 'N', perc_low_income_riders: 0, perc_minority_riders: 1, perc_vulnerable_fare_riders: .1, perc_1_ride_journeys: .68, perc_2_ride_journeys: .2, perc_3_ride_journeys: .1, perc_4more_ride_journeys: .02, average_daily_boardings: 32324 }

// global setting for preview
var w = d3.select('#previewContainer').node().clientWidth - 30;
var isShowODType

var fullWidthScale = d3.scaleLinear()
    .range([0, w])
var fullWidthLabelScale = d3.scaleLinear()
    .range([0, w - 55])
var RadiusForODX = d3.scaleLinear()
    .range([28, 60])

var colorForODX = d3.scaleOrdinal()
    .domain(['o', 'd', 'x'])
    .range(['#618685', '#6590b0', '#ffef96'])

var odxLable = d3.scaleOrdinal()
    .domain(['o', 'd', 'x'])
    .range(['As origin', 'As destination', 'As transfer point'])
var odxPairs = d3.scaleOrdinal()
    .domain(['o', 'd', 'x'])
    .range(['d', 'o', 'x'])

// show or hide the preview panel
// var previewPanel = document.querySelector('#preview')
// function toggleCollapse(){
//  let offset = previewPanel.getBoundingClientRect().left;
//  if(offset == 0){
//    previewPanel.style.left = '-295px';
//  }else{
//    previewPanel.style.left = 0;
//  }
// }

// update the content
function updatepreview() {
    // remove the od analysis mode whenever change the selection
    hideOD()
    if (display == '' || display.selectedStops.length == 0) {
        document.querySelector('#preview').classList.add('hidden');
        document.querySelector('#emptyHint').innerHTML = noSelection;
        document.querySelector('#emptyHint').classList.remove('hidden')
    } else {
        document.querySelector('#emptyHint').classList.add('hidden');
        document.querySelector('#preview').classList.remove('hidden');
        if (selectionHisory.length < 2) {
            document.querySelector('#undo').classList.add('hidden');
        } else {
            document.querySelector('#undo').classList.remove('hidden');
        }
        //update selection box, service info(variants, route summary, touching routes)
        updateSelectionBox()
        updateService()
        let touchRoutes = getRelationships(getIdlist(getChildrenStop(display.selectedStops), 'stop'), 'stop_route')[0]
        if (touchRoutes.some(d => !nonRouteList.includes(d))) {
            d3.selectAll('section').classed('hidden', false)
            document.querySelector('#emptyHint').classList.add('hidden');
            //request the data
            const odxData = odx.slice()
            const transferData = transfer.slice()
            //update the data
            updateFilters()
            updateOdx(odxData)
            updateTransfer(transferData)
        } else {
            d3.selectAll('section').classed('hidden', true)
            document.querySelector('#emptyHint').innerHTML = noDataForPanel;
            document.querySelector('#emptyHint').classList.remove('hidden')
        }
    }

}
//update selection box, service info(variants, route summary, touching routes)
function updateService() {
    //update touching routes and variants
    let childrenStops = getChildrenStop(display.selectedStops).map(d => d.stop_id)
    let routeList = getRelationships(childrenStops, 'stop_route')[1].filter(d => !nonRouteList.includes(d.route_id))
    //show filtered routes based on checked status
    togglefilteredRoutes()
    //populate variants box
    updateFilteredVariants()
    //populate the selection box
    document.querySelector('#selectionInfo').innerHTML = `<i class="fa fa-circle" aria-hidden="true"></i> ${display.selectedStops.length} stop(s)`;
    //update route summary
    updateRouteSummary(routeList)
    //set route filter and update the filters
    updateRouteFilter(routeList)

}
//update filtered variants
function updateFilteredVariants() {
    if (display.filter.routefilter.length > 0) {
        //populate the variants
        let variantsList = allNest.route_shape.filter(d => display.filter.routefilter.includes(d.key))
        document.querySelector('#variantsList').innerHTML = variantsList.map(route =>
            route.values.map(variant => {
                let shapeId = variant.key
                let shapeTripCount = numberWithCommas(allData.trip.filter(trip => trip.shape_id == shapeId).length)
                let shapeInfo = getShapeInfo(shapeId)
                let isChecked = routeMarkers.map(d => d.marker.options.className.split(' ')[2].replace('hlShape', '')).includes(shapeId) ? 'checked' : ''
                return `<li class="checkbox">
        <input type="checkbox" name="variants" onchange="showVariants(this)" value=${shapeId} id="checkshape${shapeId}" ${isChecked}><label for="checkshape${shapeId}"><p>${shapeInfo[0]}</p><p><small>${shapeInfo[1]}<br>Trips: ${shapeTripCount}</small></p></label>
        </li>`
            }).join('')
        ).join('')

    } else {
        document.querySelector('#variantsList').innerHTML = 'Select a route first'
    }
}
//update route summary
function updateRouteSummary(routeList) {
    //populate the route list
    document.querySelector('#routeDetail').innerHTML =
        '<p><span><select id="selectedRoute" onchange="updateRouteDetail()">' + routeList.map(route => `<option value=${route.route_id}>${route.route_short_name || route.route_long_name}</option>`).join('') + '</select></span><span class="routeCategory">${dataFornowRoute.route_category}</span></p><div id="displayRouteDetail"></div>';
    updateRouteDetail()
}
//update route detail in route summary
function updateRouteDetail() {
    const routeDetail = document.querySelector('#routeDetail')
    const nowValue = document.querySelector('#selectedRoute').value;
    //get the nowValue route data
    const dataFornowRoute = routeSummary.find(d => d.route_id == nowValue);
    //populate data
    if (dataFornowRoute) {

        routeDetail.querySelector('.routeCategory').innerHTML = dataFornowRoute.route_category;
        let crowding, ifCrowdingPass = ''
        if (dataFornowRoute.crowding_metric) {
            crowding = dataFornowRoute.crowding_metric + '%'
            ifCrowdingPass = metrics.find(d => d.metric == 'Crowding').rate <= dataFornowRoute.crowding_metric ? 'pass' : 'fail'
        } else {
            crowding = '-'
        }
        let reliability, ifReliabilityPass = ''
        if (dataFornowRoute.reliability_metric) {
            reliability = dataFornowRoute.reliability_metric + '%'
            ifReliabilityPass = metrics.find(d => d.metric == 'Reliability' && d.route_type == dataFornowRoute.route_category).rate <= dataFornowRoute.reliability_metric ? 'pass' : 'fail'
        } else {
            reliability = '-'
        }

        routeDetail.querySelector('#displayRouteDetail').innerHTML = `
        <div style="width:${w / 2}px">
            <p class="indicator help" title="Rank of 1 provides the most benefit per net operating dollar, rank of 166 the least.">Cost effectiveness<br>rank</p><p class="h6">${dataFornowRoute.cost_effectiveness_rank?dataFornowRoute.cost_effectiveness_rank:'-'}<p>
        </div>
        <div style="width:${w / 2}px">
            <p class="indicator">Average daily<br>boardings</p><p class="h6">${dataFornowRoute.average_daily_boardings?numberWithCommas(dataFornowRoute.average_daily_boardings):'-'}<p>
        </div>
        <div style="width:${w / 4}px">
            <p class="indicator help" title="Percent of passenger time on uncrowded buses.">Crowding</p><p class="h6 ${ifCrowdingPass}">${crowding}<p>
        </div>
        <div style="width:${w / 4}px">
            <p class="indicator help" title="Percent of timepoint crossings that meet reliability standards.">Reliability</p><p class="h6 ${ifReliabilityPass}">${reliability}<p>
        </div>
        <div style="width:${w / 4}px">
            <p class="indicator help" title="Routes fail if trips do not cover the expected span of service.">Span</p><p class="h6 ${dataFornowRoute.span_of_service_metric == 'Pass' ? 'pass' : 'fail'}">${dataFornowRoute.span_of_service_metric?dataFornowRoute.span_of_service_metric:'-'}<p>
        </div>
        <div style="width:${w / 4}px">
            <p class="indicator help" title="Routes fail if any time period does not meet the expected frequency or headway.">Frequency</p><p class="h6 ${dataFornowRoute.frequency_metric == 'Pass' ? 'pass' : 'fail'}">${dataFornowRoute.frequency_metric?dataFornowRoute.frequency_metric:'-'}<p>
        </div>
        <div style="width:${w}px">
            <p class="indicator">Journey stage<span></span></p><svg id="routeJourney"></svg>
        </div>
        <div style="width:${w}px">
            <p class="indicator help" title="Vulnerable fares: includes TAP, Blind, Senior, Youth, and Student">Rider type<span></span></p><svg id="routeRiders"></svg>
        </div>
    `
        if (dataFornowRoute.perc_1_ride_journeys) {
            const routeJourneyData = { '1 ride': dataFornowRoute.perc_1_ride_journeys, '2 ride': dataFornowRoute.perc_2_ride_journeys, '3 ride': dataFornowRoute.perc_3_ride_journeys, '4 more': dataFornowRoute.perc_4more_ride_journeys }
            // drawStackedChart(d3.select('#routeJourney'), routeJourneyData)
            // drawTreeMap(d3.select('#routeJourney'), routeJourneyData)
            drawBubbleChart(d3.select('#routeJourney'), routeJourneyData)
        } else {
            showNoSummaryData(d3.select('#routeJourney'))
        }
        if (dataFornowRoute.perc_low_income_riders != '' || dataFornowRoute.perc_minority_riders != '' || dataFornowRoute.perc_vulnerable_fare_riders != '') {
            const routeRiderData = { 'low income': dataFornowRoute.perc_low_income_riders, 'minority': dataFornowRoute.perc_minority_riders, 'vulnerable fare': dataFornowRoute.perc_vulnerable_fare_riders }
            drawPointLineChart(d3.select('#routeRiders'), routeRiderData)
        } else {
            showNoSummaryData(d3.select('#routeRiders'))
        }
    } else {
        routeDetail.querySelector('.routeCategory').innerHTML = ''
        routeDetail.querySelector('#displayRouteDetail').innerHTML = '<p class="noSummaryData">No ODX or Service Delivery Policy Data Available</p>'
    }
}
//update route filter in filter box
function updateRouteFilter(routeList) {
    let subwayRouteList = routeList.filter(route => subwayLines.includes(route.route_id));
    let busRouteList = routeList.filter(route => route.route_type == 3);
    let ifhasSubway = subwayRouteList.length > 0;
    let ifhasBus = busRouteList.length > 0;
    let subwayOptions = '',
        busOptions = '';
    if (ifhasSubway) {
        subwayOptions = `<li class="checkbox"><input type="checkbox" name="modeType" value="subway" id="subway" data-child="subwayroute" onchange="toggleCheckAll(this,'sub','parent')"><label for="subway">Subway</label>
    <ul class="subCheckboxs list-inline">` +
            subwayRouteList.map(route => { let ifCheckRoute = display.filter.routefilter.includes(route.route_id) ? 'checked' : ''; return `<li class="checkbox"><input type="checkbox" data-name="subwayroute" name="routefilter" value="${route.route_id}" id="routefilter${route.route_id}" onchange="toggleCheckAll(this,'sub','child')" ${ifCheckRoute}><label for="routefilter${route.route_id}">${route.route_short_name || route.route_long_name}</label></li>` }).join('') +
            '</ul></li>'
    }
    if (ifhasBus) {
        busOptions = `<li class="checkbox"><input type="checkbox" name="modeType" value="bus" id="bus" data-child="busroute" onchange="toggleCheckAll(this,'sub','parent')"><label for="bus">Bus</label>
    <ul class="subCheckboxs list-inline">` +
            busRouteList.map(route => {
                let ifCheckRoute = display.filter.routefilter.includes(route.route_id) ? 'checked' : '';
                return `<li class="checkbox"><input type="checkbox"  data-name="busroute" name="routefilter" value="${route.route_id}" id="routefilter${route.route_id}" onchange="toggleCheckAll(this,'sub','child')" ${ifCheckRoute}><label for="routefilter${route.route_id}">${route.route_short_name || route.route_long_name}</label></li>`
            }).join('') +
            '</ul></li>'
    }
    document.querySelector('#routeFilter').innerHTML = `<ul>${subwayOptions}${busOptions}</ul>`
    //synic the parent checkboxes
    if (ifhasSubway) { document.querySelector('input[data-name="subwayroute"]').onchange() }
    if (ifhasBus) { document.querySelector('input[data-name="busroute"]').onchange() }

    //update the filter description
    // updateFiltersDes()
}
//update odx
function clearODXMarker() {
    //remove preview checkpoint
    if (document.querySelectorAll('.odxStop')) {
        d3.selectAll('.odxStop').remove()
    }
}

function updateOdx(data) {
    //update the barchart
    fullWidthLabelScale.domain([0, d3.max(data, d => d.count)])
    let updateodx = d3.select('#odx').select('svg')
        .attr('width', w)
        .attr('height', 145)
        .selectAll('.odx').data(data)
    let enterodx = updateodx.enter().append('g').attr('class', 'odx')
        .attr('transform', (d, i) => `translate(0,${20 + i * 45})`)
    enterodx.append('rect')
        .attr('y', 10)
        .attr('height', 10)
        .style('fill', d => colorForODX(d.type))
    enterodx.append('text')
        .attr('class', 'odxLable')
        .text(d => odxLable(d.type))
    enterodx.append('text')
        .attr('y', 20)
        .attr('class', 'odxCount')
    let odCheckpoint = enterodx.append('g')
        .attr('class', d => d.type == 'o' || d.type == 'd' ? '' : 'hidden')
        .attr('transform', function() { const distance = this.parentNode.querySelector('.odxLable').getBBox(); return `translate(${distance.width + 10},0)` })
        .attr('cursor', 'pointer')
        .on('click', function(d) {
            if (d.type == 'x') { return }
            //show cluster by defuat
            showOD()
            isShowODType = d.type

        })
    odCheckpoint.append('text')
        .attr('class', 'checkpoint')
        .attr('x', 3)
        .text(d => d.type == 'o' ? 'where people go' : 'where people come from')
    odCheckpoint.insert('rect', '.checkpoint')
        .attr('y', -12)
        .attr('width', function() { const distance = this.parentNode.querySelector('.checkpoint').getBBox(); return distance.width + 7 })
        .attr('height', 16)
        // .style('fill',function(d){return colorForODX(odxPairs(d.type))})
        .style('fill', '#787878')
        .style('fill-opacity', .4)

    let mergeodx = updateodx.merge(enterodx)
    mergeodx.select('rect')
        .attr('width', d => fullWidthLabelScale(d.count))
    mergeodx.select('.odxCount')
        .attr('x', d => 4 + fullWidthLabelScale(d.count))
        .text(d => numberWithCommas(d.count))

}
//update the transfer table
function updateTransfer(data) {
    clearODXMarker()
    let updateData = data.map(d => {
        const fromRoute = allData.route.find(route => route.route_id == d.from)
        const toRoute = allData.route.find(route => route.route_id == d.to)
        const fromName = fromRoute.route_short_name || fromRoute.route_long_name
        const toName = toRoute.route_short_name || toRoute.route_long_name
        return { from: fromName, to: toName, count: d.count }
    })
    //create the table
    document.querySelector('#transfer').querySelector('.transferTable').querySelector('tbody').innerHTML = updateData.map(d =>
        `
    <tr>
    <td>${d.from}</td>
    <td>${d.to}</td>
    <td class="text-right">${numberWithCommas(d.count)}</td>
    </tr>
    `
    ).join('')

}
//update filters
function updateFiltersDes() {
    // const modeTypefilter = getCheckedAttr('modeType','innerHTML')
    const routefilter = getCheckedAttr('filterBox', 'routefilter', 'innerHTML')
    const datePeriodfilter = getCheckedAttr('filterBox', 'datePeriod', 'innerHTML')
    const timePeriodfilter = getCheckedAttr('filterBox', 'timePeriod', 'innerHTML')
    const fareUserTypefilter = getCheckedAttr('filterBox', 'fareUserType', 'innerHTML')
    const fareMethodfilter = getCheckedAttr('filterBox', 'fareMethod', 'innerHTML')
    //construct the timeframe format to 'weekday-time,saturday,sunday'
    const timeFramefilter = timePeriodfilter == '' ? '' : timePeriodfilter.map(time => `${datePeriodfilter[0]} ${time}`).concat(datePeriodfilter.slice(1))
    //update filter description on the preview panel
    const filterForDes = { 'route': routefilter, 'timeframe': timeFramefilter, 'fareUserType': fareUserTypefilter, 'fareMethod': fareMethodfilter }
    const filterDes = Object.values(filterForDes).filter(filter => filter != '').map(filter => filter.join(', ')).join(' | ')
    document.querySelector('#filters').innerHTML = filterDes
    $('#filterBox').modal('hide')
}

function saveFilters() {
    // const modeTypefilter = getCheckedAttr('modeType','value')
    const routefilter = getCheckedAttr('filterBox', 'routefilter', 'value')
    const datePeriodfilter = getCheckedAttr('filterBox', 'datePeriod', 'value')
    const timePeriodfilter = getCheckedAttr('filterBox', 'timePeriod', 'value')
    const fareUserTypefilter = getCheckedAttr('filterBox', 'fareUserType', 'value')
    const fareMethodfilter = getCheckedAttr('filterBox', 'fareMethod', 'value')
    display.filter = { 'routefilter': routefilter, 'datePeriod': datePeriodfilter, 'timePeriod': timePeriodfilter, 'fareUserType': fareUserTypefilter, 'fareMethod': fareMethodfilter }

}

function updateFilters() {
    Object.keys(display.filter).forEach(filter =>
        document.querySelector('#filterBox').querySelectorAll(`input[name="${filter}"]`).forEach(d => d.checked = false)
    )
    Object.values(display.filter).forEach(filter => {
        if (filter.length > 0) {
            filter.forEach(d => document.querySelector('#filterBox').querySelector(`input[value="${d}"]`).checked = true)
        }
    })

    updateFiltersDes()
}
//get the checked value from filter checkbox
function getCheckedAttr(container, inputName, attrName) {
    const checked = document.querySelector(`#${container}`).querySelectorAll(`input[name="${inputName}"]:checked`)
    const checkedValue = checked ? Array.from(checked).map(d => {
        let t = attrName == 'innerHTML' ? d.nextElementSibling : d;
        return t[attrName]
    }) : '';
    return checkedValue
}


//update selection box
function updateSelectionBox() {
    let stopsdata = allData.stop.filter(d => display.selectedStops.includes(d.stop_id)).sort((a, b) => a.stop_name.localeCompare(b.stop_name));
    let stops = `<p class="selectionTitle">${display.selectedStops.length} stop(s)<p><ul class="list-inline">` + stopsdata.map(d => `<li class="checkbox"><input type="checkbox" name="stop" value="${d.stop_id}" id="checkstop${d.stop_id}" checked><label for="checkstop${d.stop_id}">${d.stop_name}</label></li>`).join(' ') + '</ul>'
    document.querySelector('#mySelection').querySelector('.modal-body').innerHTML = stops
}
//clear selection
function clearSelectionBox() {
    clearODXMarker()
    selectionHisory = [], display = { 'selectedStops': [], 'filter': { 'routefilter': [], 'datePeriod': [], 'timePeriod': [], 'fareUserType': [], 'fareMethod': [] } };
    updateSelection()
    $('#mySelection').modal('hide')
    map.setView(new L.LatLng(42.351486, -71.066829), 15);
}

//synic selection box update to selection
function synicSelection() {
    let selectedStops = getCheckedAttr('mySelection', 'stop', 'value')
    let touchingRouteIdList = getRelationships(getIdlist(getChildrenStop(selectedStops), 'stop'), 'stop_route')[0]

    display.selectedStops = selectedStops
    //if there's any route in filter, remove all the touching routes of this stop from the filter 
    if (display.filter.routefilter.length > 0) {
        display.filter.routefilter = display.filter.routefilter.filter(route => touchingRouteIdList.includes(route))
    }
    updateSelection(display)
    $('#mySelection').modal('hide')
}

//show variants when check on the preview panel
function showVariants(e) {
    const showVariants = e
    let variants = showVariants.value;
    if (showVariants.checked) {
        //create or show them 
        if (!document.querySelector('.hlShape' + variants)) {
            drawShapes(variants)
        }
        setShapesDisplay('highlight', [variants])
    } else {
        //hide and set them to default
        setShapesDisplay('default', [variants])
    }
}

function showOD() {
    //remove previous view
    hideOD()
    //clear the TAZs mode on the map
    clusterLayer.clearLayers()
    tazLayer.clearLayers()

    const checkedOne = document.querySelector('input[name="odAnalysis"]:checked').id;
    //show legend box
    document.querySelector('.leaflet-legend-box').classList.remove('hidden')
    switch (checkedOne) {
        case 'showByStop':
            showByStop()
            break
        case 'showByCluster':
            showByCluster()
            break
        case 'showByTAZ':
            showByTAZ()
            break
    }
}

function hideOD() {
    document.querySelector('.leaflet-legend-box').classList.add('hidden')
    //remove previews markers
    d3.selectAll('.odxStop').remove()
    d3.selectAll('.hlStop').classed('hlStop', false)
    //remove legend map visualization
    odTazLayer.clearLayers()
    odClusterLayer.clearLayers()
}

function showByStop() {

    //get new markers data
    const odData = od
    const stopList = odData.data.map(d => slugStr(d.id))
    const stops = allData.stop.filter(d => stopList.includes(d.stop_id))

    RadiusForODX.domain([0, d3.max(odData.data, d => d.journey_count)])
    const stopCount = stops.length
    const fillColor = colorForODX(odxPairs(isShowODType))
    let markers = []
    for (i = 0; i < stopCount; i++) {
        let stop = stops[i]

        //draw markers
        let radius = RadiusForODX(odData.data.find(d => d.id == stop.stop_id).journey_count)
        let odxMarker = L.circle([stop.stop_lat, stop.stop_lon], { radius: stopRadius.default, weight: radius, className: 'odxStop odx' + stop.stop_id, color: fillColor })
            .on('mouseover', function() {
                //highlight the stop
                setStopsDisplay('hover', [stop.stop_id])

            })
            .on('mouseout', function() {
                setStopsDisplay('default', [stop.stop_id])
            })
        markers.push(odxMarker)
    }
    //show the stops on the map and center the view of them
    const group = new L.featureGroup(markers).addTo(map);
    map.fitBounds(group.getBounds());

}

function showByCluster() {
    //request data
    const odData = od
    if (odClusterLayer.getLayers().length == 0) {
        // clusterLayer.setStyle(feature => {return {fillColor:ClusterColor(feature.properties.fid),fillOpacity:.8,color:"#333",opacity:.6,weight:1}})
        odClusterLayer.addData(allData.clusters);
    }
    odClusterLayer.setStyle(feature => { return { fillColor: ClusterColor(Math.random() * 100), fillOpacity: .5, color: "#333", opacity: .6, weight: 1 } })
}

function showByTAZ() {
    //request data
    const odData = od
    if (odTazLayer.getLayers().length == 0) {
        // clusterLayer.setStyle(feature => {return {fillColor:ClusterColor(feature.properties.fid),fillOpacity:.8,color:"#333",opacity:.6,weight:1}})
        odTazLayer.addData(allData.TAZ);
    }
    odTazLayer.setStyle(feature => { return { fillColor: ClusterColor(Math.random() * 100), fillOpacity: .5, color: "#333", opacity: .6, weight: 1 } })
}