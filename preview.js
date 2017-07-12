
// testing data
var odx = [
  {type:'o',count:31300, list:[{stop_id:'70002',count:13400},{stop_id:'70007',count:10300},{stop_id:'8824',count:6500},{stop_id:'88335',count:1100}]},
  {type:'d',count:11230,list:[{stop_id:'8820',count:5620},{stop_id:'87619',count:3610},{stop_id:'70124',count:2100},{stop_id:'36961',count:100}]},
  {type:'xo',count:7800,list:[{stop_id:'3683',count:4300},{stop_id:'70007',count:2200},{stop_id:'23835',count:1300}]},
  {type:'xd',count:22120,list:[{stop_id:'36842',count:11800},{stop_id:'2369',count:10320}]}
]
var transfer = [{from:'9',to:'1',count:32000},{from:'43',to:'44',count:7000},{from:'95',to:'1',count:6300},{from:'39',to:'110',count:4500},{from:'55',to:'66',count:3000},{from:'Green-E',to:'Red',count:2300}]

// global setting for preview
var w = d3.select('#previewContainer').node().clientWidth;

var fullWidthScale = d3.scaleLinear()
  .range([0,w])
var fullWidthLabelScale = d3.scaleLinear()
  .range([0,w - 70])
var RadiusForODX = d3.scaleLinear()
  .range([28,60])

var colorForODX = d3.scaleOrdinal()
  .domain(['o','d','xo','xd'])
  // .range(['#96ceb4','pink','ffcc5c'])
  .range(['#559e83','#ae6a41','#c3cb71','#ffcc5c'])
// var colorForstage = d3.scaleOrdinal()
//   .domain(stageKey)
  // .range(['#99d5cf','#66c0b7','#32ab9f','#009688'])
var odxLable = d3.scaleOrdinal()
  .domain(['o','d','xo','xd'])
  .range(['As origin','As destination','As transfer origin','As transfer destination'])
var odxPairs = d3.scaleOrdinal()
  .domain(['o','d','xo','xd'])
  .range(['d','o','xd','xo'])

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
  if(data == '' || data.stops.length == 0){
    document.querySelector('#preview').classList.add('hidden');
    document.querySelector('#emptyHint').classList.remove('hidden');
  }else{
    document.querySelector('#emptyHint').classList.add('hidden');
    document.querySelector('#preview').classList.remove('hidden');
    if(selection.length <= 1){
      document.querySelector('#undo').classList.add('hidden');
    }else{
      document.querySelector('#undo').classList.remove('hidden');
    }     
    //update content
    updateService(data)
    //get the odx data and update
    updateOdx(odx)
    updateTransfer(transfer)
  }

}
//update service content
function updateService(data){
  //show routes and variants
  let routeList,modeText;
  let childrenStops = getChildrenStop(data.stops).map(function(d){return d.stop_id})
  if(data.routes.length == 0 ){
    modeText = 'touching'
    routeList = getRelationships(childrenStops,'stop_route')[1]  
    document.querySelector('#displayOption').querySelector('#showVariants').classList.add('hidden')
  }else{
    modeText = 'on'
    document.querySelector('#displayOption').querySelector('#showVariants').classList.remove('hidden')
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
            let isChecked = routeMarkers.map(function(d){return d.marker.options.className.split(' ')[2].replace('hlShape','')}).includes(shapeId) ? 'checked' : ''
            return `<li class="checkbox">
                        <input type="checkbox" name="variants" onchange="showVariants(this)" value=${shapeId} id="checkshape${shapeId}" ${isChecked}><label for="checkshape${shapeId}">${shapeInfo[0]}  <small>${shapeInfo[1]}</small></label>
                    </li>`
          }).join('')
    }).join('')

  }
  //count the stops and populate content

  document.querySelector('#selectionInfo').innerHTML = `${data.stops.length} stop(s) <small>${modeText}</small> ` + routeList.map(function(route){return route.route_short_name || route.route_long_name}).join(', ');
  document.querySelector('#routeDetail').innerHTML = 
    '<select>' + routeList.map(function(route){return `<option>${route.route_short_name || route.route_long_name}</option>`}).join(', ') + '</select>' + 
    '<svg></svg>'
}
//update odx
function updateOdx(data){
  //update the barchart
  fullWidthLabelScale.domain([0,d3.max(data,function(d){return d.count})])
  let updateodx = d3.select('#odx').select('svg')
    .attr('width',w - 30)
    .attr('height',160)
    .selectAll('.odx').data(data)
  let enterodx = updateodx.enter().append('g').attr('class','odx')
    .attr('transform',function(d,i){return `translate(0,${20 + i * 40})`})
  enterodx.append('rect')
    .attr('y', 7)
    .attr('height',10)
    .style('fill',function(d){return colorForODX(d.type)})
  enterodx.append('text')
    .attr('class','odxLable')
    .text(function(d){return odxLable(d.type)})
  enterodx.append('text')
    .attr('y',15)
    .attr('class','odxCount')
  let odCheckpoint = enterodx.append('g')
    .attr('transform',function(){const distance = this.parentNode.querySelector('.odxLable').getBBox();return `translate(${distance.width + 10},0)`})
    .attr('cursor','pointer')
    .on('click',function(d){
      //remove previews markers
      d3.selectAll('.odxStop').remove()
      d3.selectAll('.hlStop').classed('hlStop',false)
      //get new markers data
      const stopList = d.list.map(function(e){return e.stop_id})
      //highlight the stop
      setStopsDisplay('hover',stopList)
      const stops = allData.stop.filter(function(e){return stopList.includes(e.stop_id)})
      RadiusForODX.domain([0,d3.max(d.list,function(e){return e.count})])
      const stopCount = stops.length
      const fillColor = colorForODX(odxPairs(d.type))
      let markers = []
      for(i=0;i<stopCount;i++){
        let stop = stops[i]

        //draw markers
        let radius = RadiusForODX(d.list.find(function(e){return e.stop_id == stop.stop_id}).count)
        let odxMarker = L.circle([stop.stop_lat,stop.stop_lon], {radius:stopRadius.default,weight:radius,className:'odxStop odx' + slugStr(stop.stop_id),color:fillColor})
        .on('mouseover',function(){
        })
        .on('mouseout',function(){
        })
        markers.push(odxMarker)
      }
      //show the stops on the map and center the view of them
      const group = new L.featureGroup(markers).addTo(map);;
      map.fitBounds(group.getBounds());
    })
  odCheckpoint.append('text')
    .attr('class','checkpoint')
    .attr('x',3)
    .text(function(d,i){return i % 2 ? 'from...' : 'to...'})
  odCheckpoint.insert('rect','.checkpoint')
    .attr('y',-8)
    .attr('width',function(){const distance = this.parentNode.querySelector('.checkpoint').getBBox();return distance.width + 5})
    .attr('height',10)
    // .style('fill',function(d){return colorForODX(odxPairs(d.type))})
    .style('fill','#787878')
    .style('fill-opacity',.4)
  let mergeodx = updateodx.merge(enterodx)
  mergeodx.select('rect')
    .attr('width', function(d){return fullWidthLabelScale(d.count)})
  mergeodx.select('.odxCount')
    .attr('x',function(d){return 4 + fullWidthLabelScale(d.count)})
    .text(function(d){return numberWithCommas(d.count)})

}
//update the transfer table
function updateTransfer(data){

  //create the table
  document.querySelector('#transfer').querySelector('.transferTable').querySelector('tbody').innerHTML =  data.map(function(d){
    let fromRoute = allData.route.find(function(route){return route.route_id == d.from})
    let toRoute = allData.route.find(function(route){return route.route_id == d.to})
    return `
      <tr>
        <td>${fromRoute.route_short_name || fromRoute.route_long_name}</td>
        <td>${toRoute.route_short_name || toRoute.route_long_name}</td>
        <td class="text-right">${numberWithCommas(d.count)}</td>
      </tr>
      `}).join('')
  //create the chart

}

//update selection box
function updateSelectionBox(){
  let countRoutes = display.routes.length
  let routes = '' ,stops
  if(countRoutes != 0 ){
    let routesdata = allData.route.filter(function(d){return display.routes.includes(d.route_id)})
    routes = `<p class="selectionTitle">${countRoutes} route(s)</p>` + routesdata.map(function(d){return `<span class="checkbox"><input type="checkbox" name="route" value="${d.route_id}" id="checkroute${d.route_id}" checked><label for="checkroute${d.route_id}">${d.route_short_name || d.route_long_name}</label></span>`}).join(' ')
  }
  
  let stopsdata = allData.stop.filter(function(d){return display.stops.includes(d.stop_id)})
  stops = `<p class="selectionTitle">${display.stops.length} stop(s)<p>` + stopsdata.map(function(d){return `<span class="checkbox"><input type="checkbox" name="stop" value="${d.stop_id}" id="checkstop${d.stop_id}" checked><label for="checkstop${d.stop_id}">${d.stop_name}</label></span>`}).join(' ')
  document.querySelector('#mySelection').querySelector('.modal-body').innerHTML = routes + '<br>' + stops
}
//clear selection
function clearSelectionBox(){
  selection = [], display = {stops:[],routes:[]};
  updatepreview(display)
  $('#mySelection').modal('hide')
}

//synic selection box update to selection
function synicSelection(){
  let selectedRoutes = Array.from(document.querySelectorAll('input[name=route]:checked')).map(function(d){return d.value})
  let selectedStops = Array.from(document.querySelectorAll('input[name=stop]:checked')).map(function(d){return d.value})
  populateSelection(false,{stops:selectedStops,routes:selectedRoutes})
  $('#mySelection').modal('hide')
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
  showSubway()
}