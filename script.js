//set hint text for draw toolbar
var drawPolygon = document.querySelector('.leaflet-draw-draw-polygon')
var drawRectangle = document.querySelector('.leaflet-draw-draw-rectangle')
drawPolygon.setAttribute('title', 'Draw a polygon to select stops')
drawRectangle.setAttribute('title', 'Draw a rectangle to select stops')


//GLOBEL VARIABLES
// selection is an array of history display: [{selectedStops:[],filter:{}},...]
// selectedStops is an array of stop_id; filter is an object: {'routefilter':[],'datePeriod':[], 'timePeriod':[],'fareUserType':[], 'fareMethod':[]}
var selectionHisory = [];
var display = { 'selectedStops': [], 'filter': { 'routefilter': [], 'datePeriod': [], 'timePeriod': [], 'fareUserType': [], 'fareMethod': [] } }

var ClusterColor = d3.scaleLinear().domain([0, 100]).range(['#f6da91', '#f69590'])

//hint
var noDataForRoute = 'No ODX data for this route'
var noDataForStop = 'No ODX data for this stop'
var noDataForArea = 'No ODX data for this area'
var noDataForPanel = '<h5>No ODX data</h5>'
var noSelection = '<h5>Select<br><br>a stop or a route<br><br>to start</h5>'

//MAP GLOBAL VIEW OPTION
const showAllVariants = document.querySelector('input[name=showallVariants]')

function toggleVariants() {
    if (showAllVariants.checked) {
        //create or show them 
        if (document.querySelector('.shape')) {
            d3.selectAll('.shape').classed('hidden', false)
        } else {
            drawShapes('all')
        }
    } else {
        //hide and set them to false
        d3.selectAll('.shape').classed('hidden', true)
    }
}
const showallStops = document.querySelector('input[name=showallStops]')

function toggleStops() {
    if (showallStops.checked) {
        d3.selectAll('.stop').classed('hidden', false)
    } else {
        d3.selectAll('.stop').classed('hidden', true)
        d3.selectAll('.selectStop').classed('hidden', false)
    }
}

const showFilteredRoutes = document.querySelector('input[name=filteredRoutes]')
const showallRoutes = document.querySelector('input[name=showallRoutes]')

function togglefilteredRoutes() {
    if (showFilteredRoutes.checked) {
        d3.selectAll('.selectRoute').classed('hidden', false)
        setRoutesDisplay('select', display.filter.routefilter)
    } else {
        toggleRoutes()
        d3.selectAll('.selectRoute').classed('selectRoute', false).style('stroke', '#666');
    }
    showSubway()
}

function toggleRoutes() {
    if (showallRoutes.checked) {
        d3.selectAll('.route').classed('hidden', false)
    } else {
        d3.selectAll('.route').classed('hidden', true)
        d3.selectAll('.selectRoute').classed('hidden', false)
    }
}


function toggleBox(e) {
    // console.log(document.querySelector(e))
    e.parentElement.classList.toggle('open');
}
//GLOBEL FUNCTION
//trunc the long word: for station name on the top right
String.prototype.trunc = String.prototype.trunc ||
    function(n) {
        return (this.length > n) ? this.substr(0, n - 1) + '...' : this;
    };

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


function getMatch(a, b) {
    var matches = [];

    for (var i = 0; i < a.length; i++) {
        for (var e = 0; e < b.length; e++) {
            if (a[i] === b[e]) matches.push(a[i]);
        }
    }
    return matches;
}
//toggle subcheckbox by checkbox
function toggleCheckAll(e, type, who) {
    let childOptions
    if (who == 'parent') {
        childOptions = document.querySelectorAll(`input[data-name="${e.dataset.child}"]`)
        //check all subchecks following their parent
        childOptions.forEach(el => el.checked = e.checked ? true : false)
    } else {
        let parent = document.querySelector(`input[data-child="${e.dataset.name}"]`)
        childOptions = document.querySelectorAll(`input[data-name="${e.dataset.name}"]`)
        const ifAllUnchecked = Array.from(childOptions).map(option => !option.checked).reduce((result, option) => result && option)
        const ifAllChecked = Array.from(childOptions).map(option => option.checked).reduce((result, option) => result && option)
        //if all subchecks are unchecked, uncheck the parent checkbox
        if (ifAllUnchecked) {
            parent.checked = false
        } else if (ifAllChecked) {
            parent.checked = true
        } else {
            // if it's a subcheck, always check the parent
            if (type == 'sub') {
                parent.checked = true;
            } else {
                parent.checked = false
            }
        }
    }
}
//draw stacked chart
// var stack = d3.stack()
//     .order(d3.stackOrderNone)
//     .offset(d3.stackOffsetNone);
var stackcolor = d3.scaleOrdinal().range(['#b1cbbb', '#f9ccac', '#eea29a', '#c94c4c'])

// function drawStackedChart(plot, data) {
//     plot.attr('width', w).attr('height', '20px')
//     const key = Object.keys(data)
//     stack.keys(key)

//     fullWidthScale.domain([0, 100])
//     stackcolor.domain(key)
//     var updateElement = plot.selectAll('.element')
//         .data(stack([data]))
//     updateElement.exit().remove()
//     var enterElement = updateElement.enter()
//         .append('g').attr('class', 'element')
//     enterElement.append('rect')
//         .attr('y', 0)
//         .attr('x', (d, i) => fullWidthScale(d[0][0]))
//         .attr('width', (d, i) => fullWidthScale(d[0][1] - d[0][0]))
//         .attr('height', '10px')
//         .style('fill', d => stackcolor(d.key))
//         .style('cursor', 'pointer')
//         .on('mouseover', function(d) {
//             plot.selectAll('rect').style('opacity', .5)
//             d3.select(this).style('opacity', 1)
//             plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = `${data[d.key]}% <span style="color:${stackcolor(d.key)}">${d.key}</span> journeys`
//         })
//         .on('mouseout', function() {
//             plot.selectAll('rect').style('opacity', 1)
//             plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = ''
//         })
//     // enterElement.append('text')
//     //     .attr('y', '15px')
//     //     .attr('x', function(d, i) { return fullWidthScale((d[0][0] + d[0][1]) / 2) })
//     //     .text(function(d) { return d.key })
// }
// var treemap = d3.treemap().tile(d3.treemapResquarify).paddingInner(1);
// var treemap = d3.treemap().paddingInner(1)

// function drawTreeMap(plot, data) {
//     plot.attr('width', w).attr('height', '50px')
//     const key = Object.keys(data)
//     const dataToArray = key.map(d => { return { key: d, value: data[d] } })
//     stackcolor.domain(key)
//     treemap.size([w, 40])
//     const root = d3.hierarchy({ name: 'total', children: dataToArray })
//         .sum(d => d.value)
//     treemap(root)
//     console.log(root, root.descendants());
//     var enter = plot.selectAll('.item').data(root.descendants().filter((d, i) => i != 0 )).enter().append('g').attr('class', 'item')
//         .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");
//     enter.append("rect")
//         .attr("width", d => d.x1 - d.x0)
//         .attr("height", d => d.y1 - d.y0)
//         .attr("fill", d => stackcolor(d.data.key));

// }

var scaleR = d3.scaleLinear()

function drawBubbleChart(plot, data) {
    plot.attr('width', w).attr('height', '60px')
    const key = Object.keys(data)
    scaleR.range([0, w / 12]).domain([0, 100])
    const r = w / 12
    const dataToArray = key.map(d => { return { key: d, value: data[d] } })
    var enter = plot.selectAll('.bubbleGroup').data(dataToArray).enter().append('g').attr('class', 'bubbleGroup')
        .on('mouseover', function(d) {
            plot.selectAll('.inner').style('opacity', .5)
            d3.select(this).select('.inner').style('opacity', 1)
            plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = `${data[d.key]}% <span style="color:${stackcolor(d.key)}">${d.key}</span> journeys`
        })
        .on('mouseout', function() {
            plot.selectAll('.inner').style('opacity', 1)
            plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = ''
        })
    enter.append('circle').attr('class', 'outer').attr('r', r).attr('cx', (d, i) => w / 4 * i + w / 10).attr('cy', r)
        .style('fill', '#333').style('stroke', '#787878').style('stroke-width', 1).style('stroke-dasharray', '2,3')
    enter.append('circle').attr('class', 'inner').attr('cx', (d, i) => w / 4 * i + w / 10).attr('cy', r)
        .attr("fill", d => stackcolor(d.key))
        .transition().duration(1000)
        .attr('r', d => (scaleR(d.value) < 1 && scaleR(d.value) > 0) ? 1 : scaleR(d.value))
    enter.append('text').attr('class', 'inner').attr('x', (d, i) => w / 4 * i + w / 10).attr('y', r * 2 + 10).style('font-size', '10px').style('fill', '#fff')
        .text(d => `${d.value}%`).style('text-anchor', 'middle');
}

var pointlinecolor = d3.scaleOrdinal().range(['#588c7e', '#f2e394', '#f2ae72', '#d96459'])

function drawPointLineChart(plot, data) {
    plot.attr('width', w).attr('height', '70px')
    plot.append('line').attr('x1', 15).attr('x2', w - 55 + 15).attr('y1', 10).attr('y2', 10).attr('stroke', '#fff').attr('stroke-width', '.5px')
    plot.append('text').text('0').attr('class', 'legend').attr('transform', 'translate(0,13)')
    plot.append('text').text('100%').attr('class', 'legend').attr('transform', `translate(${w},13)`).style('text-anchor', 'end')

    const key = Object.keys(data)
    const dataToArray = key.map(d => { return { key: d, value: data[d] } }).filter(d => d.value !== '')
    pointlinecolor.domain(key)
    fullWidthLabelScale.domain([0, 100])

    var enter = plot.selectAll('.group').data(dataToArray).enter().append('g').attr('class', 'group')
        .attr('transform', d => `translate(${fullWidthLabelScale(d.value) + 15},10)`).style('cursor', 'pointer')
        .on('mouseover', function(d) {
            plot.selectAll('g').style('opacity', .5)
            d3.select(this).style('opacity', 1)
            plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = `${d.value}% <span style="color:${pointlinecolor(d.key)}">${d.key}</span> riders`

        })
        .on('mouseleave', function() {
            plot.selectAll('g').style('opacity', 1)
            plot.node().parentElement.querySelector('.indicator').querySelector('span').innerHTML = ''
        })
    enter.append('line').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('stroke', d => pointlinecolor(d.key))
        .attr('y2', function(d, i) { return (i + 1) * 12 + 6 })
    enter.append('line').attr('x1', 0).attr('x2', 2).attr('stroke', d => pointlinecolor(d.key))
        .attr('y1', (d, i) => (i + 1) * 12 + 6).attr('y2', (d, i) => (i + 1) * 12 + 6)
    enter.append('text').text(d => `${d.value}%`).attr('fill', d => pointlinecolor(d.key))
        .attr('transform', (d, i) => `translate(3,${(i + 1) * 12 + 6})`).style('font-size', '10px')
    enter.append('circle').attr('r', 6).attr('stroke', d => pointlinecolor(d.key)).attr('fill', '#333').attr('stroke-width', '1')
    enter.append('text').text(d => d.key.slice(0, 1).toUpperCase()).style('text-anchor', 'middle')
        .attr('transform', 'translate(0,3)').attr('fill', d => pointlinecolor(d.key))
}

function drawBarLegend(colorScale, min, max) {
    const legend = d3.select('#legend').attr('height', 80)
    const legendW = legend.node().getBoundingClientRect().width
    //reset the defs
    legend.node().innerHTML = `
        <defs>
        <linearGradient id="Gradient">
        <stop stop-color="${colorScale(min)}" offset="0%"/>
        <stop stop-color="${colorScale(max)}" offset="100%"/>
        </linearGradient>
        </defs>
    `
    //remove the previous legend diagram
    legend.selectAll('g').remove()
    const legendGroup = legend.append('g').attr('transform','translate(0, 20)')
    legendGroup.append('rect')
        .attr('width', legendW)
        .attr('height', 15)
        .attr('y', 10)
        .attr('fill', 'url(#Gradient)')
    legendGroup.append('text').text('Uses').attr('class', 'odxCount').attr('x', legendW / 2).style('text-anchor', 'middle')
    legendGroup.append('text').text(numberWithCommas(min)).attr('class', 'odxCount').attr('y', 40)
    legendGroup.append('text').text(numberWithCommas(max)).attr('x', legendW).attr('class', 'odxCount').style('text-anchor', 'end').attr('y', 40)

}

function drawCircleLegend(color,min, max,minR,maxR) {
    const fixedMin = minR * .4
    const fixedMax = maxR * .4
    const legend = d3.select('#legend').attr('height', 100)
    const legendW = legend.node().getBoundingClientRect().width
    //remove the previous legend diagram
    legend.selectAll('g').remove()
    const legendGroup = legend.append('g').attr('transform',`translate(0, ${fixedMax})`)
    legendGroup.append('text').text('Uses').attr('class', 'odxCount').attr('x', legendW / 2).style('text-anchor', 'middle')
    legendGroup.append('circle').attr('r',fixedMin).style('fill',color).attr('cx',fixedMin + 10).attr('cy',fixedMax + 10)
    legendGroup.append('circle').attr('r',(fixedMin + fixedMax) / 2).style('fill',color).attr('cx',legendW / 2 - 5).attr('cy',fixedMax + 10)
    legendGroup.append('circle').attr('r',fixedMax).style('fill',color).attr('cx',legendW - fixedMax - 10).attr('cy',fixedMax + 10)
    legendGroup.append('text').text(numberWithCommas(min)).attr('class', 'odxCount').attr('y', fixedMax * 2.9).attr('x', 10)
    legendGroup.append('text').text(numberWithCommas(max)).attr('class', 'odxCount').attr('y', fixedMax * 2.9).attr('x', legendW - fixedMax - 10).style('text-anchor', 'middle')
}

function showNoSummaryData(plot) {
    plot.attr('width', w).attr('height', '20px')
        .append('text').attr('class', 'noSummaryData').attr('x', w / 2).attr('y', 10).style('text-anchor', 'middle')
        .text('No ODX or Service Delivery Policy Data Available')

}
// SET DISPLAY
//set the stop display (second para is a array of stop ids)
function setStopsDisplay(action, stopIdList) {

    let countstops = stopIdList.length;
    for (i = 0; i < countstops; i++) {
        let stopItem = document.querySelector('.stop' + getParentStopId(stopIdList[i]));
        switch (action) {
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
function setShapesDisplay(action, shapeIdList) {
    let countshapes = shapeIdList.length;

    switch (action) {
        case 'highlight':
            for (i = 0; i < countshapes; i++) {
                let shapeId = shapeIdList[i]
                let shapeItem = document.querySelector('.hlShape' + shapeId);
                shapeItem.classList.remove('hidden');
                shapeItem.parentNode.appendChild(shapeItem)
                let shapeColor = allData.route.find(d => d.route_id == shapeStopRoute.find(d => d.shape_id == shapeId).route_id).route_color
                shapeItem.style.stroke = '#' + shapeColor;
            }
            break
        case 'default':
            for (i = 0; i < countshapes; i++) {
                let shapeItem = document.querySelector('.hlShape' + shapeIdList[i]);
                shapeItem.classList.add('hidden')
            }
            break
    }
}
//set route display
function setRoutesDisplay(action, routeIdList) {
    let countRoutes = routeIdList.length
    switch (action) {
        case 'hover':
            for (i = 0; i < countRoutes; i++) {
                let route = routeIdList[i];
                let routeColor = allData.route.find(d => d.route_id == route).route_color;
                let routePath = document.querySelector('.route' + route);
                routePath.classList.add('hlRoute');
                routePath.style.stroke = '#' + routeColor;
                routePath.parentNode.appendChild(routePath)
            }
            break
        case 'select':
            for (i = 0; i < countRoutes; i++) {
                let route = routeIdList[i];
                let routeColor = allData.route.find(d => d.route_id == route).route_color;
                let routePath = document.querySelector('.route' + route);
                routePath.classList.add('selectRoute');
                routePath.style.stroke = '#' + routeColor;
                routePath.parentNode.appendChild(routePath)
            }
            break
        case 'touch':
            for (i = 0; i < countRoutes; i++) {
                let route = routeIdList[i];
                let routeColor = allData.route.find(d => d.route_id == route).route_color;
                let routePath = document.querySelector('.route' + route);
                routePath.classList.add('touchRoute');
                routePath.style.stroke = '#' + routeColor;
                routePath.parentNode.appendChild(routePath)
            }
            break
        case 'subway':
            for (i = 0; i < countRoutes; i++) {
                let route = routeIdList[i];
                let routeColor = allData.route.find(d => d.route_id == route).route_color;
                let routePath = document.querySelector('.route' + route);
                routePath.classList.add('subwayRoute');
                routePath.style.stroke = '#' + routeColor;

            }
            break
        case 'default':
            for (i = 0; i < countRoutes; i++) {

                let route = routeIdList[i];
                let routePath = document.querySelector('.route' + route);
                routePath.classList.remove('hlRoute');
                // if this route in the selection
                if ((!routePath.classList.contains('subwayRoute') && !routePath.classList.contains('selectRoute') && !routePath.classList.contains('touchRoute'))) {
                    routePath.style.stroke = '#666'
                }
            }
            break
    }
}

// POPUP
//get the hint text for popup
//para are id of stop/route, type is 'stop'||'route'
function getHint(id, type) {
    let hint = '';
    if (display.selectedStops.length > 0)
        switch (type) {
            case 'stop':

                hint = display.selectedStops.includes(id) ? 'Shift click to <strong>remove</strong> this stop' : 'Shift click to <strong>add</strong> this stop'
                break
            case 'route':

                hint = display.filter.routefilter.includes(id) ? 'Shift click to <strong>remove</strong> this route' : 'Shift click to <strong>add</strong> this route'
                break
        }
    return hint;
}

//update popup for the stop 
//para are an object of the stop, an array of children stop, [a array of touching route ids, a array of touching routes]
function stopPopup(stop, childrenStops, touchRoutes) {
    let children = stop.location_type == 1 ? '<p>' + childrenStops.map(stop => stop.stop_name).join(', ') + '</p>' : '';
    let hint = touchRoutes[0].every(d => nonRouteList.includes(d)) ? noDataForStop : getHint(stop.stop_id, 'stop')
    popup.setLatLng([stop.stop_lat, stop.stop_lon])
        .setContent(`
            <h5>${stop.stop_name}</h5> 
            ${children}
            <hr><div id="routeListInPoP" class=\"routeList\"></div>
            <p class="hint">${hint}</p>
        `)
        .openOn(map);
    let updateRoute = d3.select('#routeListInPoP').selectAll('.routelabel').data(touchRoutes[1])
    let enterRoute = updateRoute.enter().append('div').attr('class', 'routelabel')
    updateRoute.merge(enterRoute)
        .html(d => d.route_short_name || d.route_long_name)
        .style('color', d => nonRouteList.includes(d.route_id) ? '#333' : `#${d.route_text_color}`)
        .style('background', d => nonRouteList.includes(d.route_id) ? '' : `#${d.route_color}`)
        .style('opacity', d => display.filter.routefilter.includes(d.route_id) ? .6 : 1)
        .on('click', function(d) {
            if (!nonRouteList.includes(d.route_id)) {
                populateSelectionByRoute(d3.event.shiftKey, d.route_id)
                d3.select(this).style('opacity', display.filter.routefilter.includes(d.route_id) ? .6 : 1)
            }
        })
        .on('mouseover', function(d) {
            if (nonRouteList.includes(d.route_id)) {
                hint = noDataForRoute
            } else {
                hint = getHint(d.route_id, 'route')
            }
            d3.select(this.parentNode.parentNode).select('.hint').html(hint);
        })
        .on('mouseout', function(d) {
            hint = getHint(stop.stop_id, 'stop')
            d3.select(this.parentNode.parentNode).select('.hint').html(hint);
        })

    updateRoute.exit().remove()
}
//update popup for the shape
function shapePopup(location, shapeInfo) {
    popup.setLatLng(location)
        .setContent(`
            <h5>${shapeInfo[0]}</h5>
            <hr>
            <p>${shapeInfo[1]}</p>
        `)
        .openOn(map);
}
//update popup for the route
function routePopup(location, route, stopLength) {
    let routeName = route.route_short_name || route.route_long_name;
    let hint = nonRouteList.includes(route.route_id) ? noDataForRoute : getHint(route.route_id, 'route')
    if (location) {
        popup.setLatLng(location)
            .setContent(`
                <h5>${routeName}</h5>
                <hr>
                <p>${stopLength} stop(s)</p>
                <p class="hint">${hint}</p>
            `)
            .openOn(map);
    } else {
        popup.setLatLng(map.getCenter())
            .setContent(`
                <h5>${noDataForRoute}</h5>
            `)
            .openOn(map);
    }

}
//update popup for the draw selection or cluster selection
//drawSelection is an array of stop ids
//mouse is mouse latlng (optional)
function selectionPopup(layer, drawSelection, mouse) {
    let location = mouse ? [mouse.lat, mouse.lng] : layer.getBounds().getCenter()
    let isHiddenNew, isHiddenLimit, isHiddenAdd, hint;
    let overlapStops = drawSelection.filter(stop => display.selectedStops.includes(stop))
    let overlapStopsCount = overlapStops.length
    let touchRoutes = getRelationships(getIdlist(getChildrenStop(drawSelection), 'stop'), 'stop_route')[0]
    //if any of these stops in drawSelection is in current selection, show remove option in pop-up
    isHiddenLimit = overlapStopsCount > 0 ? '' : 'hidden'
    //if current selection is not empty, show add option in pop-up
    isHiddenAdd = display.selectedStops.length > 0 ? '' : 'hidden'
    //if all the stops are touching no-odx data routes, hide set as new option and give a hint
    let ifnodataArea = touchRoutes.every(d => nonRouteList.includes(d))
    isHiddenNew = ifnodataArea ? 'hidden' : ''
    hint = ifnodataArea ? noDataForArea : ''

    popup.setLatLng(location)
        .setContent(`
            <div>
                <h5><strong>${drawSelection.length}</strong> stop(s) in this area</h5>
                <hr>
                <p class="hint">${hint}</p>
            </div>
            <div class="${isHiddenNew}">                
                <a id="replaceDraw" class="btn btn-default btn-xs">Set all as new selection</a>
                <a id="addDraw" class="btn btn-default btn-xs ${isHiddenAdd}" >Add all to selection</a>
            </div>
            <div class="${isHiddenLimit}">
                <h5><strong>${overlapStopsCount}</strong> stop(s) in current selection</h5>
                <hr>        
                <a id="limitDraw" class="btn btn-default btn-xs">Limit selection to them</a>
            </div>
        `)
        .openOn(map);

    document.querySelector('#replaceDraw').addEventListener('click', function(d) {
        populateSelectionByDraw(drawSelection, 'replace');
        if (!mouse) { layer.remove() };
        map.closePopup();
    })
    document.querySelector('#addDraw').addEventListener('click', function(d) {
        populateSelectionByDraw(drawSelection, 'add');
        if (!mouse) { layer.remove() };
        map.closePopup();
    })
    document.querySelector('#limitDraw').addEventListener('click', function(d) {
        populateSelectionByDraw(overlapStops, 'replace');
        if (!mouse) { layer.remove() };
        map.closePopup();
    })

}

//GET DATA
//get stops, shapes, routes for a stop
//para is a object of a stop
function getStopInfo(stop) {
    let childrenStops = getChildrenStop([stop.stop_id])
    let stopsList = getIdlist(childrenStops, 'stop');
    let touchRoutes = getRelationships(stopsList, 'stop_route');
    let touchShapes = getRelationships(stopsList, 'stop_shape');
    return [stopsList, childrenStops, touchRoutes, touchShapes]
}
//get stops,routes for a shape
//para is a shape id
function getShapeInfo(shapeId) {
    let variantInfo = variantsName.find(d => d.shape_id == shapeId);
    let variantName = variantInfo ? variantInfo.shape_name : shapeId;
    let variantTrip = allData.trip.find(d => d.shape_id == shapeId);
    let variantDes = variantTrip ? ((variantTrip.direction_id == 0 ? 'Outbound to ' : 'Inbound to ') + variantTrip.trip_headsign) : '';
    return [variantName, variantDes]
}
//translate children stops to only parent stops and orphan stops
function replaceChildrenStop(stopIdList) {
    let stops = stopIdList.map(d => getParentStopId(d))
    return stops.filter((d, i, v) => v.indexOf(d) === i)
}

//get children stops for stops (para is a list of stop id)
function getChildrenStop(stopIdList) {
    let childStops = []
    let stopCount = stopIdList.length
    for (i = 0; i < stopCount; i++) {
        let stop = allData.stop.find(d => d.stop_id == stopIdList[i])
        if (stop.location_type == 0) {
            childStops.push(stop)
        } else {
            childStops.push(...allData.stop.filter(d => d.parent_station == stop.stop_id))
        }
    }
    return childStops
}
//get parent stops for stops (para is a stop id)
function getParentStopId(stopId) {
    let stop = allData.stop.find(d => d.stop_id == stopId)
    let parentStopId = stop.parent_station ? stop.parent_station : stop.stop_id;
    return parentStopId
}

//get a id list
// para : 'items' is a array of the stops/routes/shapes/trips
// 'type' is 'stop' || 'shape' || 'route' || 'trip'
function getIdlist(items, type) {
    let idList = items.map(d => d[type + '_id'])
        .filter((d, i, v) => v.indexOf(d) === i)
    return idList
}
// get all related stops/routes/shapes for a stop/route/shape
// para : 'idList' is a array of the stop/route/shape ids
// 'relationship' is 'stop_shape' || 'stop_route' || 'route_shape' || 'route_stop'
function getRelationships(idList, relationship) {
    let relationshipType = relationship.split('_')[1]
    let istoShape = relationshipType == 'shape' ? 'key' : (relationshipType + '_id')
    let relationshipMenu = allNest[relationship]
        .filter(d => idList.includes(d.key))
        .map(d => d.values)
    let countMenu = relationshipMenu.length
    let relationshipList = []
    for (i = 0; i < countMenu; i++) {
        relationshipList.push(...relationshipMenu[i].map(d => d.key))
    }
    if (relationshipType == 'stop') {
        relationshipList = replaceChildrenStop(relationshipList)
    }
    relationshipList = relationshipList.filter((d, i, v) => v.indexOf(d) === i)
    let relationships = allData[relationshipType].filter(d => relationshipList.includes(d[istoShape]))
    return [relationshipList, relationships]
}

//UPDATE SELECTION
function populateSelectionByStop(key, stopId) {
    let touchingRouteIdList = getRelationships(getIdlist(getChildrenStop([stopId]), 'stop'), 'stop_route')[0]
    let displayTouchRoutes = touchingRouteIdList.filter(d => !nonRouteList.includes(d))
    let ifdataStop = touchingRouteIdList.some(d => !nonRouteList.includes(d))
    if (key) {
        if (display.selectedStops.includes(stopId)) {
            display.selectedStops.splice(display.selectedStops.indexOf(stopId), 1)
            //if there's any route in filter, remove all the touching routes of this stop from the filter 
            if (display.filter.routefilter.length > 0) {
                display.filter.routefilter = display.filter.routefilter.filter(route => !touchingRouteIdList.includes(route))
            }
        } else {
            if (ifdataStop) {
                display.selectedStops = add(display.selectedStops, [stopId])
                //if there's any route in filter, add the touching route of this stop to current fitler
                if (display.filter.routefilter.length > 0) {
                    display.filter.routefilter = add(display.filter.routefilter, displayTouchRoutes)
                }
            }
        }
    } else {
        if (ifdataStop) {
            display.selectedStops = [stopId]
            display.filter.routefilter = []
        }
    }
    updateSelection(display)
}

function populateSelectionByRoute(key, routeId) {
    let touchingStopIdList = getRelationships([routeId], 'route_stop')[0]

    if (key) {
        //if this route is not checked in filter or any touching stop is not in current selection, check it and add all touching stops to current selection
        if (!display.filter.routefilter.includes(routeId) || touchingStopIdList.some(id => !display.selectedStops.includes(id))) {
            display.selectedStops = add(display.selectedStops, touchingStopIdList)
            display.filter.routefilter = add(display.filter.routefilter, [routeId])
            updateSelection()
            return
        }
        //if all touching stops are in the current selection, remvoe the stops that only on this route from current selection and uncheck this route in filter
        if (touchingStopIdList.every(id => display.selectedStops.includes(id))) {
            display.filter.routefilter.splice(display.filter.routefilter.indexOf(routeId), 1)
            let stopsOnFilteredRoutes = replaceChildrenStop(getIdlist(shapeStopRoute.filter(d => display.filter.routefilter.includes(d.route_id)), 'stop'))
            display.selectedStops = display.selectedStops.filter(stop => !touchingStopIdList.includes(stop) || (touchingStopIdList.includes(stop) && stopsOnFilteredRoutes.includes(stop)))
            updateSelection()
            return
        }
    } else {
        display.selectedStops = touchingStopIdList
        display.filter.routefilter = [routeId]
        updateSelection()
    }

}

function populateSelectionByDraw(data, action) {
    switch (action) {
        case 'add':
            display.selectedStops = add(display.selectedStops, data)
            updateSelection()
            break
        case 'replace':
            display.selectedStops = data
            display.filter.routefilter = []
            updateSelection()
            break
    }
}

function updateSelection() {
    //populate selection history
    let saveStops = Array.from(display.selectedStops)
    let saveFilter = Object.assign({}, display.filter)
    selectionHisory.push({ 'selectedStops': saveStops, 'filter': saveFilter })
    //update preview panel
    updatepreview()
    //update stop and route status on map
    updateMap()
}

function updateMap() {

    //reset the filtered variants box
    updateFilteredVariants()
    //highlight the selection stops and filtered routes
    d3.selectAll('.selectStop').classed('selectStop', false)
    d3.selectAll('.selectRoute').classed('selectRoute', false).style('stroke', '#666');
    showSubway()
    if (display.selectedStops.length == 0) return
    setStopsDisplay('select', display.selectedStops)
    if (showFilteredRoutes.checked) { setRoutesDisplay('select', display.filter.routefilter) }
    //hidden highlight variants, reshow routes and subway
    d3.selectAll('.hlShape').classed('hidden', true)
    d3.selectAll('.route').classed('hidden', false)
    //synic the display setting
    toggleVariants()
    toggleStops()
    toggleRoutes()
    togglefilteredRoutes()
}


function undoSelection() {
    //back to last selection
    selectionHisory.pop()
    display = selectionHisory[selectionHisory.length - 1]
    //update preview panel
    updatepreview()
    //update stop and route status on map
    updateMap()

}

function add(oldItem, newItem) {
    let current = oldItem.concat(newItem).filter((d, i, v) => v.indexOf(d) === i)
    return current
}