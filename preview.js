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

	let routeList = getRelationships(getIdlist(data,'stop'),'stop_route')[1]
		.map(function(route){return `
		<p class="routelabel" style="color:#${route.route_text_color};background:#${route.route_color}">
			${route.route_short_name || route.route_long_name}
		</p>
		`
		}).join('')
	document.querySelector('#selection').innerHTML = `${data.length} stop(s)`;
	document.querySelector('.stopname').innerHTML = `<h5>${data.length} stop(s) <small>on</small></h5><div class="routeList">${routeList}</div>`

	drawStackedChart('odx',odxKey, odxdata,colorForODX)
	drawStackedChart('stage',stageKey, stagedata,colorForstage)

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

