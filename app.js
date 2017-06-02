//global url
var	stopsUrl = '/data/stops.txt',
	shapesUrl = '/data/shapes.txt',
	tripsUrl = '/data/trips.txt',
	routesUrl = '/data/routes.txt',
	stoptimesUrl = '/data/stop_times.txt';
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



	$scope.drawStops = function(data){
		data.forEach(function(stop){
			// L.circleMarker([stop.stop_lat,stop.stop_lon], {radius:10}).addTo(map);
			L.circle([stop.stop_lat,stop.stop_lon], {radius:6,className:'stop'})
			.on('mouseover',function(){
	            //set location and content for station/stop popup
	            popup.setLatLng([stop.stop_lat,stop.stop_lon])
	              .setContent(stop.stop_name)
	              .openOn(map);
	          })
	          .on('mouseout',function(){
	            map.closePopup()
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
			var shapepts = []
			shape.values.forEach(function(shapept){
				shapepts.push([shapept.shape_pt_lat,shapept.shape_pt_lon])
			})
			L.polyline(shapepts, {className: 'path'})
			.on('mouseover',function(e){
	        	this._path.classList.add('selected');
	          //set location and content for station/stop popup
	        	popup.setLatLng([e.latlng.lat,e.latlng.lng])
		            .setContent(shape.key)
		            .openOn(map);
	        })
	        .on('mouseout',function(){
	        	this._path.classList.remove('selected');
	         	map.closePopup();
	        })
			.addTo(map);
		})
	}

	$q.all([$http.get(stopsUrl),$http.get(shapesUrl),$http.get(tripsUrl),$http.get(routesUrl),$http.get(stoptimesUrl)]).then(function(allData){ 
		// console.log(allData[0].data)
		$scope.stops = parseData(allData[0].data)
		$scope.shapes = parseData(allData[1].data)
		$scope.trips = parseData(allData[2].data)
		$scope.routes = parseData(allData[3].data)
		$scope.stoptimes = parseData(allData[4].data)
		
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

