//global url
var	stopsUrl = '/data/stops.txt',
	shapesUrl = '/data/shapes.txt',
	tripsUrl = '/data/trips.txt',
	routesUrl = '/data/routes.txt',
	shapestoprouteUrl = '/data/route_shape_stop.csv';
// Define the `spApp` module
var app = angular.module('spApp', []);

// Define the `spAppController` controller on the `spApp` module
app.controller('spAppController', function spAppController($scope,$http,$q) {
	var map = L.map('mapid',{drawControl: true});
	map.setView(new L.LatLng(42.351486,-71.066829), 15);
	L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
	  // possible tile values 
	  // light_all,
	  // dark_all,
	  // light_nolabels,
	  // light_only_labels,
	  // dark_nolabels,
	  // dark_only_labels
	//set the zoomcontrol's position
	map.zoomControl.setPosition('bottomright')

	//create a popup
    var popup = L.popup({className:'popup',closeButton:false})

    //create panes for shapes and stops relatively
    var stopPanes = map.createPane('stops');
    	stopPanes.style.zIndex = 450;
    	stopPanes.style.pointerEvents = 'none';
    // set a selected list
    $scope.selectedList = []


	$scope.drawStops = function(data){
		data.forEach(function(stop){
			//get the routes belong to this stop
			// console.log(stop)
			let routeslist = $scope.shapestoproute
				.filter(function(d){return d.stop_id == stop.stop_id})
				.map(function(d){return d.route_id})
				.filter(function(d,i,v){return v.indexOf(d) === i})
			// get the routes data
			let routes = $scope.routes.filter(function(d){return routeslist.includes(d.route_id)})
			// console.log(routes)
			//get the shapes belong to this stop
			let shapeslist = $scope.shapestoproute
				.filter(function(d){return d.stop_id == stop.stop_id})
				.map(function(d){return d.shape_id})
				.filter(function(d,i,v){return v.indexOf(d) === i})
	        // console.log(shapeslist)
			// here need to do something with parent station
			L.circle([stop.stop_lat,stop.stop_lon], {radius:8,className:'stop stop' + stop.stop_id, pane:'stops'})
				.on('mouseover',function(){
		            //set location and content for stop popup
		            popup.setLatLng([stop.stop_lat,stop.stop_lon])
		              .setContent('<h5>' + stop.stop_name + '</h5>' + routes.map(function(route){return '<span class="routelabel" style="color:#' + route.route_text_color + ';background:#' + route.route_color + '">' + (route.route_short_name || route.route_long_name) + '</span>'}).join(''))
		              .openOn(map);
		            //highlight the stop
		             // this._path.classList.add('selected');
		            this.bringToFront()
		            //highlight the shapes belong to this stop on the map, and colored by route 
		            shapeslist.forEach(function(shape){
		            	const findShape = document.querySelector('.shape' + shape)
		            	findShape.style.stroke = routes.find(function(route){return route.route_id = $scope.shapestoproute.find(function(d){return d.shape_id == shape}).route_id}).route_color
		            	findShape.parentNode.appendChild(findShape)
		            })
		            
		         })
		        .on('mouseout',function(){
		            // map.closePopup()
		            shapeslist.forEach(function(shape){
		            	document.querySelector('.shape' + shape).style.stroke = '#999'
		            })
		            // this._path.classList.remove('selected');
		        })
		        .on('click',function(){

		        	$scope.populateSelectedStopList(stop.stop_id)
		        })
				.addTo(map);

		})
	}
	$scope.drawShapes = function(data){
		//nest by shape id
		const shapesById = d3.nest()
			.key(function(d){return d.shape_id})
			.sortValues(function(a,b) { return +b.shape_pt_sequence - +a.shape_pt_sequence; })
			.entries(data)
		// console.log(shapesById)
		shapesById.forEach(function(shape){
			let hasMatchRoute = $scope.shapestoproute.find(function(d){return d.shape_id == shape.key});
			let route = hasMatchRoute ? $scope.routes.find(function(route){return route.route_id == hasMatchRoute.route_id}) : '';
			let shapepts = [];
			shape.values.forEach(function(shapept){
				shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
			})
			L.polyline(shapepts, {className: 'shape shape'+ shape.key + ' route' + route.route_id})
			.on('mouseover',function(e){
				//highlight the shape by route color

				if(route){
					document.querySelectorAll('.route' + route.route_id).forEach(function(shape){
						shape.style.stroke =  route.route_color;
						// shape.style.opacity = .5;
						shape.parentNode.appendChild(shape)

					})
					this.getElement().style.strokeWidth = 8;
					// this.getElement().style.stroke = route.route_color;
				}else{
					this.getElement().style.stroke = '#333';
					this.bringToFront()
				}
				
	          	//set location and content for stop popup
	          	let routeName = route ? (route.route_short_name || route.route_long_name) : 'No match route';
	          	let stops = $scope.shapestoproute.filter(function(d){return d.shape_id == shape.key}).sort(function(a,b){return a.stop_sequence - b.stop_sequence}).map(function(d){return d.stop_id})
	        	popup.setLatLng([e.latlng.lat,e.latlng.lng])
		            .setContent($scope.showShapeDetail(routeName,shape.key,stops))
		            .openOn(map);
	        })
	        .on('mouseout',function(){
	        	document.querySelectorAll('.shape').forEach(function(shape){
	        		shape.style.stroke = '#999';
	        		shape.style.strokeWidth = 2;
	        	})
	        	// this.getElement().style.stroke = '#999';
	         	// map.closePopup();
	        })
			.addTo(map);
			
		})
	}

	//toggle the stop to selectedlist
	$scope.populateSelectedStopList = function(stopId){
		console.log(stopId)
		if(!$scope.selectedList.includes(stopId)){	
			let stop = document.querySelector('.stop' + stopId)        		
			stop.classList.add('selected');
			stop.parentNode.appendChild(stop)
			$scope.selectedList.push(stopId)
			$scope.$apply();
		}else{
			stop.classList.remove('selected');
			$scope.selectedList.splice($scope.selectedList.indexOf(stopId), 1)    
			$scope.$apply();    		
		}	
	}
	//display content in pop-up of shpae
	$scope.showShapeDetail = function(route,shape,stops){
		let title = '<h5>' + route  + '</h5>';
		let des = '<p>Shape ' + shape + '</p>';
		let selection = '<h5>' + stops.length + ' stop(s)</h5><hr><div class=\"checkbox\">' + stops.map(function(stop){
			let isChecked = $scope.selectedList.includes(stop);
			return '<label><input type=\"checkbox\" name=\"acrossStop\"' + (isChecked ? 'checked' : '') + ')>' + stop + '</label>'
		}).join('') + '</div>';
		//need checked status functionality
		return title + des + selection
	}
	//request data file
	$q.all([$http.get(stopsUrl),$http.get(shapesUrl),$http.get(tripsUrl),$http.get(routesUrl),$http.get(shapestoprouteUrl)]).then(function(allData){ 
		// console.log(allData)
		$scope.stops = parseData(allData[0].data)
		$scope.shapes = parseData(allData[1].data)
		$scope.trips = parseData(allData[2].data)
		$scope.routes = parseData(allData[3].data)
		$scope.shapestoproute = parseData(allData[4].data)
		// console.log($scope.shapestoproute)
		// can't manupulate stoptimes file, it's toooooo large, omg
		// aggregateData(allData)
		console.log($scope.routes.length,$scope.shapes.length,$scope.stops.length)
		
		$scope.drawShapes($scope.shapes)
		$scope.drawStops($scope.stops)
	});

});

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

function aggregateData(allData){

	const stops = parseData(allData[0].data)
	const shapes = parseData(allData[1].data)
	const trips = parseData(allData[2].data)
	const routes = parseData(allData[3].data)
	const shapestoproute = parseData(allData[4].data)
	let aggregatedData = [];
	//aggregate by stops
	stops.forEach(function(stop){
		let theroutes = shapestoproute.filter(function(d){return d.route_id == stop})
		aggregatedData.push({
			stop_id:stop.stop_id,
			attributes:{
				stop_name:stop.stop_name,
				stop_lat:stop.stop_lat,
				stop_lon:stop.stop_lon
			},
			parent_station:stop.parent_station,
		})
	})
	//populate routes to each stops
	aggregatedData.forEach(function(row){
		row.routes = []
		let thisStop = shapestoproute.filter(function(d){return d.stop_id == row.stop_id})
		let thisStopByroute = d3.nest()
			.key(function(d){return d.route_id})
			.rollup(function(d){
				return d.map(function(e){
					if(!e.shape_id)return
					let thisShape = shapes.find(function(shape){return shape.shape_id == e.shape_id})
					let theTrips = trips.filter(function(trip){return trip.shape_id == e.shape_id})
					return {
						shape_id:e.shape_id,
						attributes:{
							shape_pt_lat:thisShape.shape_pt_lat,
							shape_pt_lon:thisShape.shape_pt_lon,
							shape_pt_sequence:thisShape.shape_pt_sequence
						},
						trip:theTrips
					}
				})
			})
			.entries(thisStop)
			console.log(thisStopByroute)
		thisStopByroute.forEach(function(route){
			let routedata = routes.filter(function(d){return d.route_id == route.key})
			row.routes.push({
				route_id:route.key,
				attributes:{
					agency_id:routedata.agency_id,
					route_short_name:routedata.route_short_name,
					route_long_name:routedata.route_long_name,
					route_color:routedata.route_color,
					route_text_color:routedata.route_text_color
				},
				shapes:route.values
			})
		})
		// console.log(row.routes)
	})


	console.log(aggregatedData)
	return aggregatedData
}