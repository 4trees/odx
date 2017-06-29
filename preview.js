// testing data
var odxdata = [{o:12,d:23,x:12}]
    // stagedata = [{1:32,2:3,3:12}]
    odxKey = Object.keys(odxdata[0])
    // stageKey = Object.keys(stagedata[0])

// global setting for preview
var w = d3.select('.panel-body').select('section').node().clientWidth;

var fullWidthScale = d3.scaleLinear()
    .range([0,w])
var fullWidthLabelScale = d3.scaleLinear()
    .range([0,w-30])
  
// var stack = d3.stack()
//     .order(d3.stackOrderNone)
//     .offset(d3.stackOffsetNone);

var colorForODX = d3.scaleOrdinal()
  .domain(odxKey)
  // .range(['#96ceb4','pink','ffcc5c'])
  .range(['#559e83','#ae6a41','#c3cb71'])
// var colorForstage = d3.scaleOrdinal()
//   .domain(stageKey)
//   .range(['#99d5cf','#66c0b7','#32ab9f','#009688'])


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
  if(data.stops.length == 0){
    previewPanel.style.left = '-500px';
  }else{
    previewPanel.style.left = 0;

    updateService(data)
  }

	// drawStackedChart('odx',odxKey, odxdata,colorForODX)
	// drawStackedChart('stage',stageKey, stagedata,colorForstage)

}
//update service content
function updateService(data){

  //show routes and variants
  let routeList,modeText;
  let childrenStops = getChildrenStop(data.stops).map(function(d){return d.stop_id})
  if(data.routes.length == 0 ){
    modeText = 'touching'
    routeList = getRelationships(childrenStops,'stop_route')[1]  
    document.querySelector('#routesummary').classList.add('hidden')
  }else{
    modeText = 'on'
    document.querySelector('#routesummary').classList.remove('hidden')
    //reset the touching route checkbox
    let touchroutes = document.querySelector('input[name=showTouchRoutes]')
    touchroutes.checked = false;
    showTouchRoutes(touchroutes)
    //populate the variants
    routeList = allData.route.filter(function(d){return data.routes.includes(d.route_id)}) 
    let routeIdList = routeList.map(function(d){return d.route_id});
    let variantsList = allNest.route_shape.filter(function(d){return routeIdList.includes(d.key)})
    document.querySelector('#variantsList').innerHTML = variantsList.map(function(route){
        return route.values.map(function(variant){
            let shapeId =  variant.key
            let shapeInfo = getShapeInfo(shapeId)
            let isChecked = routeMarkers.map(function(d){return d.options.className.split(' ')[2].replace('hlShape','')}).includes(shapeId) ? 'checked' : ''
            return `<p class="checkbox">
                        <label><input type="checkbox" name="" onchange="showVariants(this)" value=${shapeId} ${isChecked}>${shapeInfo[0]}  <small>${shapeInfo[1]}</small></label>
                    </p>`
          }).join('')
    }).join('')

  }
  //count the stops and populate content
  document.querySelector('#selection').innerHTML = `${data.stops.length} stop(s)`;
  document.querySelector('#stopInfo').innerHTML = `<h5>${data.stops.length} stop(s) <small>${modeText}</small></h5>`;
  document.querySelector('#routeonStop').innerHTML = '<p class="routeList">'+ routeList.map(function(route){return `
      <span class="routelabel" style="color:#${route.route_text_color};background:#${route.route_color}">${route.route_short_name || route.route_long_name}</span>
      `
  }).join('') + '</p>'

}

//draw stacked chart
// function drawStackedChart(type, key, data, color){
//   var plot = d3.select('#' + type).select('svg')
//     .attr('width',w)
//     .attr('height','40px')

//   stack.keys(key)

//   fullWidthScale
//     .domain([0, d3.sum(Object.values(data[0]))])

//   var updateElement = plot.selectAll('.element')
//     .data(stack(data))
//   updateElement.exit().remove()
//   var enterElement = updateElement.enter()
//     .append('g').attr('class','element')
//   enterElement.append('rect')
//     .attr('y', 0)
//     .attr('x', function(d,i){return fullWidthScale(d[0][0])})
//     .attr('width', function(d,i) {return fullWidthScale(d[0][1] - d[0][0])})
//     .attr('height', '25px')
//     .style('fill',function(d){return color(d.key)})
//   enterElement.append('text')
//     .attr('y', '35px')
//     .attr('x', function(d,i){return fullWidthScale((d[0][0] + d[0][1]) / 2)})
//     .text(function(d){return d.key})
// }
//show variants when check on the preview panel
function showVariants(e){
  const showVariants = e
  let variants = showVariants.value;
  if(showVariants.checked){
    //create or show them 
    if(!document.querySelector('.hlShape' + variants)){
      drawShapes(variants)
    }
    setShapesDisplay('highlight',[variants])
  }else{
    //hide and set them to default
    setShapesDisplay('default',[variants])
  }
}

function showTouchRoutes(e){

  if(e.checked){
    let touchRoutes = getRelationships(getIdlist(getChildrenStop(display.stops),'stop'),'stop_route')[0].filter(function(d){return !display.routes.includes(d)})
    console.log(touchRoutes)
    setRoutesDisplay('touch',touchRoutes)
  }else{
    d3.selectAll('.touchRoute').classed('touchRoute',false).style('stroke','#666');
  }
}