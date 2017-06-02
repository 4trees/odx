//global url
var	stopsUrl = '/data/stops.txt',
	shapesUrl = '/data/shapes.txt',
	tripsUrl = '/data/trips.txt',
	routesUrl = '/data/routes.txt',
	rssUrl = '/data/route_shape_stop.csv';
// Define the `spApp` module
var app = angular.module('spApp', []);

// Define the `spAppController` controller on the `spApp` module
app.controller('spAppController', function spAppController($scope,$http,$q) {
	var map = L.map('mapid');
	map.setView(new L.LatLng(42.351486,-71.066829), 15);
	L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
	  // possible tile values 
	  // light_all,
	  // dark_all,
	  // light_nolabels,
	  // light_only_labels,
	  // dark_nolabels,
	  // dark_only_labels
	map.zoomControl.setPosition('topright')

	//create a popup
    var popup = L.popup({className:'popup',closeButton:false})
    // set a selected list
    $scope.selectedList = []


	$scope.drawStops = function(data){
		data.forEach(function(stop){
			//get the routes belong to this stop
			// console.log(stop)
			let routeslist = $scope.rss.filter(function(d){return d.stop_id == stop.stop_id}).map(function(d){return d.route_id}).filter(function(d,i,v){return v.indexOf(d) === i})
			// console.log(routeslist)
			let routes = $scope.routes.filter(function(d){return routeslist.includes(d.route_id)})
			// console.log(routes)
			//get the shapes belong to these routes
			let shapeslist = $scope.rss.filter(function(d){return d.stop_id == stop.stop_id}).map(function(d){return d.shape_id}).filter(function(d,i,v){return v.indexOf(d) === i})
	        // console.log(shapeslist)
			// here need to do something with parent station
			L.circle([stop.stop_lat,stop.stop_lon], {radius:6,className:'stop'})
			.on('mouseover',function(){

	            //set location and content for station/stop popup
	            popup.setLatLng([stop.stop_lat,stop.stop_lon])
	              .setContent('<h3>' + stop.stop_name + '</h3>' + routes.map(function(route){return '<span class="routelabel" style="color:#' + route.route_text_color + ';background:#' + route.route_color + '">' + (route.route_short_name || route.route_long_name) + '</span>'}).join(''))
	              .openOn(map);
	            //highlight the shapes belong to these routes on the map
	            shapeslist.forEach(function(shape){
	            	document.querySelector('.id' + shape).style.stroke = routes.find(function(route){return route.route_id = $scope.rss.find(function(d){return d.shape_id == shape}).route_id}).route_color
	            })
	            
	         })
	        .on('mouseout',function(){
	            // map.closePopup()
	            shapeslist.forEach(function(shape){
	            	document.querySelector('.id' + shape).style.stroke = '#999'
	            })
	        })
	        .on('click',function(){

	        	if(!$scope.selectedList.includes(stop.stop_id)){
	        		$scope.selectedList.push(stop.stop_id)
	        		$scope.$apply();
	        	}else{
	        		$scope.selectedList.splice($scope.selectedList.indexOf(stop.stop_id), 1)    
	        		$scope.$apply();    		
	        	}
	        	console.log($scope.selectedList)
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
		console.log(shapesById)
		shapesById.forEach(function(shape){
			if(!$scope.rss.find(function(d){return d.shape_id == shape.key})){
				console.log(shape.key)
			}
			// var route = $scope.routes.find(function(route){return route.route_id == $scope.rss.find(function(d){return d.shape_id == shape.key}).route_id});
			var shapepts = []
			shape.values.forEach(function(shapept){
				shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
			})
			L.polyline(shapepts, {className: 'path id'+ shape.key})
			.on('mouseover',function(e){
	        	this._path.classList.add('selected');
	          	//set location and content for station/stop popup
	        	popup.setLatLng([e.latlng.lat,e.latlng.lng])
		            .setContent('<h3>' + (route.route_short_name || route.route_long_name) + '</h3><p>Shape ' + shape.key + '</p>')
		            .openOn(map);
	        })
	        .on('mouseout',function(){
	        	this._path.classList.remove('selected');
	         	// map.closePopup();
	        })
			.addTo(map);
			
		})
	}

	$q.all([$http.get(stopsUrl),$http.get(shapesUrl),$http.get(tripsUrl),$http.get(routesUrl),$http.get(rssUrl)]).then(function(allData){ 
		console.log(allData)
		$scope.stops = parseData(allData[0].data)
		$scope.shapes = parseData(allData[1].data)
		// $scope.trips = parseData(allData[2].data)
		$scope.routes = parseData(allData[3].data)
		$scope.rss = parseData(allData[4].data)
		console.log($scope.rss)
		// can't manupulate stoptimes file, it's toooooo large, omg
		// aggregateData(allData)
		
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
	const srr = parseData(allData[4].data)
	let aggregatedData = [],
	 	stoplist = [], routelist = [], triplist = [];
	// stops.forEach(function(stop){
	// 	if(!stoplist.includes(stop.stop_id)){
	// 		stoplist.push(stop.stop_id)
	// 		aggregatedData.push({stop:stop})
	// 	}
	// })
	// var aggregatedsrr = d3.nest()
	// 	.key(function(d){return d.stop_id})
	// 	.key(function(d){return d.route_id})
	// 	.key(function(d){return d.shape_id})
	// 	.entries(srr)
	// 	.map(function(d) {
	// 	    return {
	// 	      name: d.key,
	// 	      count: d.values.count,
	// 	      total: d.values.total,
	// 	      avg:   d.values.avg
	// 	    }
	// 	});

	console.log()
	console.log(JSON.stringify(aggregatedsrr))
}