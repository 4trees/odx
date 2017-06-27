// testing data
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


// show or hide the preview panel
var previewPanel = document.querySelector('#preview')
function toggleCollapse(){
	let offset = previewPanel.getBoundingClientRect().left;
	if(offset == 0){
		previewPanel.style.left = '-295px';
	}else{
		previewPanel.style.left = 0;
	}
}

// update the content
function updatepreview(data){
	previewPanel.style.left = 0;

  updateService(data)

	drawStackedChart('odx',odxKey, odxdata,colorForODX)
	drawStackedChart('stage',stageKey, stagedata,colorForstage)

}
//update service content
function updateService(data){
  //count the stops and populate content
  document.querySelector('#routesummary').innerHTML = ''
  document.querySelector('#selection').innerHTML = `${data.stops.length} stop(s)`;
  document.querySelector('.stopname').innerHTML = `<h5>${data.stops.length} stop(s) <small>on</small></h5><div class="routeList"></div>`

  //add listeners to routes lable
  // let routeList = getRelationships(getIdlist(data,'stop'),'stop_route')[1]
  // let updateRoute = d3.select('.stopname').select('.routeList').selectAll('.routelabel').data(routeList,function(d){return d.route_id})
  // let enterRoute = updateRoute.enter().append('p')
  //   .attr('class','routelabel')
  //   .html(function(d){return d.route_short_name || d.route_long_name})
  //   .style('color',function(d){return '#' + d.route_text_color})
  //   .style('background',function(d){return '#' + d.route_color})
  //   .on('click',function(d){
  //     let touchStops = getRelationships([d.route_id],'route_stop')
  //     console.log(touchStops[0],getIdlist(data,'stop'))
  //     let selectionOnroute = getMatch(touchStops[0], getIdlist(data,'stop'))
  //     document.querySelector('#routesummary').innerHTML = `<h5>${d.route_short_name || d.route_long_name}</h5><p><small>${selectionOnroute.length}/${touchStops[0].length} stops selected</small></p>`
  //   })
  // updateRoute.exit().remove()
}


//draw stacked chart
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

