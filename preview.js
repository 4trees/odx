
// testing data
const odx = [
  {type:'o',count:31300, list:[{stop_id:'70002',count:13400},{stop_id:'70007',count:10300},{stop_id:'8824',count:6500},{stop_id:'88335',count:1100}]},
  {type:'xo',count:7800,list:[{stop_id:'3683',count:4300},{stop_id:'70007',count:2200},{stop_id:'23835',count:1300}]},
  {type:'xd',count:22120,list:[{stop_id:'36842',count:11800},{stop_id:'2369',count:10320}]},
  {type:'d',count:11230,list:[{stop_id:'8820',count:5620},{stop_id:'87619',count:3610},{stop_id:'70124',count:2100},{stop_id:'36961',count:100}]}
]
const transfer = [{from:'9',to:'1',count:32000},{from:'43',to:'44',count:7000},{from:'95',to:'1',count:6300},{from:'39',to:'110',count:4500},{from:'55',to:'66',count:3000},{from:'Green-E',to:'Red',count:2300}]

// global setting for preview
var w = d3.select('#previewContainer').node().clientWidth - 30;

var fullWidthScale = d3.scaleLinear()
  .range([0,w])
var fullWidthLabelScale = d3.scaleLinear()
  .range([0,w - 55])
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
  .range(['As origin','As destination','As transfer from','As transfer to'])
var odxPairs = d3.scaleOrdinal()
  .domain(['o','d','xo','xd'])
  .range(['d','o','xd','xo'])

// show or hide the preview panel
// var previewPanel = document.querySelector('#preview')
// function toggleCollapse(){
// 	let offset = previewPanel.getBoundingClientRect().left;
// 	if(offset == 0){
// 		previewPanel.style.left = '-295px';
// 	}else{
// 		previewPanel.style.left = 0;
// 	}
// }
//toggle subcheckbox by checkbox
function toggleCheckAll(e,itemName){
  let parentName, parentID
  switch (itemName){
    case 'timePeriod':
      parentName = 'datePeriod'
      parentID = '#weekdays'
      break
    case 'routefilter':
      parentName = 'allroutes'
      parentID = '#allroutes'
      break
  }

  let childOptions = document.querySelectorAll(`input[name="${itemName}"]`)
  if(e.name == parentName){
    //check all subchecks following their parent
    childOptions.forEach(function(time){return time.checked = e.checked ? true : false;})
  }else{
    const ifAllUnchecked = Array.from(childOptions).map(function(option){return !option.checked}).reduce(function(result,option){
      return result && option
    }) 
    const ifAllChecked = Array.from(childOptions).map(function(option){return option.checked}).reduce(function(result,option){
      return result && option
    })
    //if all subchecks are unchecked, uncheck the parent checkbox
    if(ifAllUnchecked){
      document.querySelector(parentID).checked = false
    }else{
      //any subchecks checked in time period filter, check the parent
      if(itemName == 'timePeriod'){document.querySelector(parentID).checked = true;} 
    }
    if(!ifAllChecked){
      if(itemName == 'routefilter'){document.querySelector(parentID).checked = false} 
    }
    //if all subchecks are checked, check the parent
    else{
      document.querySelector(parentID).checked = true
    }
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
    const odxData = odx.slice()
    updateOdx(odxData)
    const transferData = transfer.slice()
    updateTransfer(transferData)
  }

}
//update service content
function updateService(data){
  //show routes and variants
  let routeList,modeText,ifCheckRoute;
  let childrenStops = getChildrenStop(data.stops).map(function(d){return d.stop_id})
  if(data.routes.length == 0 ){
    modeText = 'touching'
    ifCheckRoute = ''
    routeList = getRelationships(childrenStops,'stop_route')[1]  
    document.querySelector('#displayOption').querySelector('#showVariants').classList.add('hidden')
  }else{
    modeText = 'on'
    ifCheckRoute = 'checked'
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
            let shapeTripCount = numberWithCommas(allData.trip.filter(function(trip){return trip.shape_id == shapeId}).length)
            let shapeInfo = getShapeInfo(shapeId)
            let isChecked = routeMarkers.map(function(d){return d.marker.options.className.split(' ')[2].replace('hlShape','')}).includes(shapeId) ? 'checked' : ''
            return `<li class="checkbox">
                        <input type="checkbox" name="variants" onchange="showVariants(this)" value=${shapeId} id="checkshape${shapeId}" ${isChecked}><label for="checkshape${shapeId}"><p>${shapeInfo[0]}</p><p class="description">${shapeInfo[1]}<br>Trips: ${shapeTripCount}</p></label>
                    </li>`
          }).join('')
    }).join('')

  }
  //count the stops and populate content

  document.querySelector('#selectionInfo').innerHTML = `<i class="fa fa-circle" aria-hidden="true"></i> ${data.stops.length} stop(s) <small>${modeText}</small> ` + routeList.map(function(route){return route.route_short_name || route.route_long_name}).join(', ');
  document.querySelector('#routeDetail').innerHTML = 
    '<select>' + routeList.map(function(route){return `<option>${route.route_short_name || route.route_long_name}</option>`}).join(', ') + '</select>' + 
    '<svg></svg>'
  //set route filter and update the filters
  document.querySelector('#routeFilter').innerHTML = '<ul class="list-inline">' + routeList.map(function(route){return `<li class="checkbox"><input type="checkbox" name="routefilter" value="routefilter${route.route_id}" id="routefilter${route.route_id}" onchange="toggleCheckAll(this,'routefilter')" ${ifCheckRoute}><label for="routefilter${route.route_id}">${route.route_short_name || route.route_long_name}</label></li>`}).join('') + '<ul>'
  updateDataFromFilters()
}
//update odx
function clearODXMarker(){
    //remove preview checkpoint
  if(document.querySelectorAll('.odxStop')){
    d3.selectAll('.odxStop').remove()
  }
}
function updateOdx(data){
  //update the barchart
  fullWidthLabelScale.domain([0,d3.max(data,function(d){return d.count})])
  let updateodx = d3.select('#odx').select('svg')
    .attr('width',w)
    .attr('height',185)
    .selectAll('.odx').data(data)
  let enterodx = updateodx.enter().append('g').attr('class','odx')
    .attr('transform',function(d,i){return `translate(0,${20 + i * 45})`})
  enterodx.append('rect')
    .attr('y', 10)
    .attr('height',10)
    .style('fill',function(d){return colorForODX(d.type)})
  enterodx.append('text')
    .attr('class','odxLable')
    .text(function(d){return odxLable(d.type)})
  enterodx.append('text')
    .attr('y',20)
    .attr('class','odxCount')
  let odCheckpoint = enterodx.append('g')
    .attr('class',function(d){return d.type == 'o' || d.type == 'd' ? '' : 'hidden'})
    .attr('transform',function(){const distance = this.parentNode.querySelector('.odxLable').getBBox();return `translate(${distance.width + 10},0)`})
    .attr('cursor','pointer')
    .on('click',function(d){
      if(d.type == 'xo' || d.type == 'xd'){return}
      //remove previews markers
      d3.selectAll('.odxStop').remove()
      d3.selectAll('.hlStop').classed('hlStop',false)
      //get new markers data
      const stopList = d.list.map(function(e){return e.stop_id})
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
          //highlight the stop
          setStopsDisplay('hover',[stop.stop_id])

        })
        .on('mouseout',function(){
          setStopsDisplay('default',[stop.stop_id])
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
    .attr('y',-12)
    .attr('width',function(){const distance = this.parentNode.querySelector('.checkpoint').getBBox();return distance.width + 7})
    .attr('height',16)
    // .style('fill',function(d){return colorForODX(odxPairs(d.type))})
    .style('fill','#787878')
    .style('fill-opacity',.4)
  //add download button
  enterodx.append('text')
    .attr('class',function(d){return d.type == 'o' || d.type == 'd' ? 'iconfont' : 'iconfont hidden'})
    .attr('x',w - 13)
    .text('\uf019')
    .on('click',function(d){
      d.type == 'o' ?download('origin','') : download('destination','')
    })
  let mergeodx = updateodx.merge(enterodx)
  mergeodx.select('rect')
    .attr('width', function(d){return fullWidthLabelScale(d.count)})
  mergeodx.select('.odxCount')
    .attr('x',function(d){return 4 + fullWidthLabelScale(d.count)})
    .text(function(d){return numberWithCommas(d.count)})

}
//update the transfer table
function updateTransfer(data){
  clearODXMarker()
  let updateData = data.map(function(d){
    const fromRoute = allData.route.find(function(route){return route.route_id == d.from})
    const toRoute = allData.route.find(function(route){return route.route_id == d.to})
    const fromName = fromRoute.route_short_name || fromRoute.route_long_name
    const toName = toRoute.route_short_name || toRoute.route_long_name
    return {from:fromName,to:toName,count:d.count}
  })
  //create the table
  document.querySelector('#transfer').querySelector('.transferTable').querySelector('tbody').innerHTML =  updateData.map(function(d){
    return `
      <tr>
        <td>${d.from}</td>
        <td>${d.to}</td>
        <td class="text-right">${numberWithCommas(d.count)}</td>
      </tr>
      `}).join('')
  //prepare the download
  const downloadData = updateData.map(function(d){return Object.values(d)})
  document.querySelector('#downloadTransfer').addEventListener('click',function(){download('transfer',downloadData)})

}
//update filters
function updateDataFromFilters(){
  const modeTypefilter = getCheckedAttr('modeType','innerHTML')
  const routefilter = getCheckedAttr('routefilter','innerHTML')
  const datePeriodfilter = getCheckedAttr('datePeriod','innerHTML')
  const timePeriodfilter = getCheckedAttr('timePeriod','innerHTML')
  const fareUserTypefilter = getCheckedAttr('fareUserType','innerHTML')
  const fareMethodfilter = getCheckedAttr('fareMethod','innerHTML')
  //construct the timeframe format to 'weekday-time,saturday,sunday'
  const timeFramefilter = timePeriodfilter == '' ? '': timePeriodfilter.map(function(time){return `${datePeriodfilter[0]} ${time}`}).concat(datePeriodfilter.slice(1))
  //update filter variables
  saveFilters()
  updateFilters()
  //update filter description on the preview panel
  const filterForDes = {'modeType':modeTypefilter,'route':routefilter,'timeframe':timeFramefilter, 'fareUserType':fareUserTypefilter, 'fareMethod':fareMethodfilter}
  const filterDes = Object.values(filterForDes).filter(function(filter){return filter != ''}).map(function(filter){return filter.join(', ')}).join(' | ')
  document.querySelector('#filters').innerHTML = filterDes
  $('#filterBox').modal('hide')
}
function saveFilters(){
  const modeTypefilter = getCheckedAttr('modeType','value')
  const routefilter = getCheckedAttr('routefilter','value')
  const datePeriodfilter = getCheckedAttr('datePeriod','value')
  const timePeriodfilter = getCheckedAttr('timePeriod','value')
  const fareUserTypefilter = getCheckedAttr('fareUserType','value')
  const fareMethodfilter = getCheckedAttr('fareMethod','value')
  filters = {'modeType':modeTypefilter,'routefilter':routefilter,'datePeriod':datePeriodfilter, 'timePeriod':timePeriodfilter,'fareUserType':fareUserTypefilter, 'fareMethod':fareMethodfilter}
}
function updateFilters(){
  Object.keys(filters).forEach(function(filter){
    document.querySelectorAll(`input[name="${filter}"]`).forEach(function(d){return d.checked = false});
  })
  Object.values(filters).forEach(function(filter){
    filter.forEach(function(d){
      document.querySelector(`input[value="${d}"]`).checked = true;
    })
  })
}
//get the checked value from checkbox
function getCheckedAttr(inputName,attrName){
  const checked = document.querySelectorAll(`input[name="${inputName}"]:checked`)
  const checkedValue = checked ? Array.from(checked).map(function(d){d = attrName == 'innerHTML' ? d.nextSibling : d;return d[attrName]}) : ''
  return checkedValue
}


//update selection box
function updateSelectionBox(){
  let countRoutes = display.routes.length
  let routes = '' ,stops
  if(countRoutes != 0 ){
    let routesdata = allData.route.filter(function(d){return display.routes.includes(d.route_id)})
    routes = `<p class="selectionTitle">${countRoutes} route(s)</p><ul class="list-inline">` + routesdata.map(function(d){return `<li class="checkbox"><input type="checkbox" name="route" value="${d.route_id}" id="checkroute${d.route_id}" checked><label for="checkroute${d.route_id}">${d.route_short_name || d.route_long_name}</label></li>`}).join(' ') + '</ul>'
  }
  
  let stopsdata = allData.stop.filter(function(d){return display.stops.includes(d.stop_id)})
  stops = `<p class="selectionTitle">${display.stops.length} stop(s)<p><ul class="list-inline">` + stopsdata.map(function(d){return `<li class="checkbox"><input type="checkbox" name="stop" value="${d.stop_id}" id="checkstop${d.stop_id}" checked><label for="checkstop${d.stop_id}">${d.stop_name}</label></li>`}).join(' ') + '</ul>'
  document.querySelector('#mySelection').querySelector('.modal-body').innerHTML = routes + '<br>' + stops
}
//clear selection
function clearSelectionBox(){
  clearODXMarker()
  selection = [], display = {stops:[],routes:[]};
  // updatepreview(display)
  updateSelection(display)
  $('#mySelection').modal('hide')
  map.setView(new L.LatLng(42.351486,-71.066829), 15);
}

//synic selection box update to selection
function synicSelection(){
  let selectedRoutes = getCheckedAttr('route','value')
  let selectedStops = getCheckedAttr('stop','value')
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