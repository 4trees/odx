
// URL globals
apikey = "ASOviiaeO0qR9EkRy7WF3A";
stopsurl = "https://api.mbtace.com/stops?route=Green-E";
vehiclesurl = "https://api.mbtace.com/vehicles?route=Green-E&include=stop";
tripsurl = "https://api.mbtace.com/trips?route=Green-E";
alerturl = "https://api.mbtace.com/alerts?route=Green-E";



var app = angular.module('hdwyApp', []);
app.controller('hdwyCtrl',function($scope, $http, $interval) {
	$scope.stops = [];
	$scope.allStops = [];
	$scope.alerts = [];

//get all the stations data
	$scope.getStops = function(){
		$http.get(stopsurl)
		.then(function(response) {
			$scope.stops = response.data.data;			
			angular.forEach($scope.stops, function(stop, k){
			$scope.allStops.push({id:stop.id,name:stop.attributes.name})
			});
			drawStation('left',$scope.stops)//draw left group of stations
			drawStation('right',$scope.stops)//draw right group of stations

		});
	};
//get all the vehicles data
	$scope.getVehicles = function(){
		$http.get(vehiclesurl)
		.then(function(response) {
			$scope.vehicles = []
			angular.forEach(response.data.included,function(stop){
				var parentStation = $scope.allStops.find(function(d){return d.id == stop.relationships.parent_station.data.id});
				if(parentStation){
					stationId = stop.id
					var vehicle = response.data.data.find(function(d){return d.relationships.stop.data.id == stop.id})
					vehicle['parent_station'] = parentStation;
					$scope.vehicles.push(vehicle)
				}
			});

			//draw the vehicles on the main diagram
			drawVehicles($scope.vehicles)
			// drawVehicles(test)

			// SEARCH 
			d3.select('.searchButton').on('click',function(d){
				var searchValue = d3.select('.searchInput')._groups[0][0].value
				//search on local
				var getResults = response.data.data.filter(function(d){return d.attributes.label.includes(searchValue)})
				if(getResults.length == 0){
					//search on server
					$http.get(allvehicleurl)
					.then(function(response) {
						var getServerResult = response.data.data.filter(function(d){return d.attributes.label.includes(searchValue)})
						if(getServerResult.length == 0){
							d3.select('#searchRT').html('<hr><p class=\'lead\'>Train ' + searchValue +  ' is not listed in Green lines.</p>')
						}else if(getServerResult.length == 1){
							d3.select('#searchRT').html('<hr><p class=\'lead\'>Train ' + searchValue + ' is on ' + getServerResult[0].relationships.route.data.id + '.</p>')
						}else{
							d3.select('#searchRT').html('<hr><p class=\'lead\'>Data error: Train ' + searchValue + ' is listed in more than one place.</p>')
						}
					})
				}else{
				//highlight the vehicle
				//scroll the page to the first vehicle
					var theTrain = d3.select('#train'+getResults[0].id)
					var moveY = getXYFromTranslate(theTrain._groups[0][0])[1]
					window.scrollTo(0,moveY - windowHeight / 2)
				//give color & bg
					var text = theTrain.select('text').classed('highlight',true)
					var textSize = text.node().getBBox();
					theTrain.insert('rect', 'text')
						.attr('class','highlightBG')
						.attr('height',textSize.height + 5)
						.attr('width',textSize.width + 5)
						.attr('transform','translate('+(textSize.x - 2.5)+','+(textSize.y - 2.5)+')')
				}
			})
			
		});
	};

//get alerts data
	$scope.getAlerts = function(){
		$http.get(alerturl)
		.then(function(response) {
			$scope.alerts = response.data.data.filter(function(alert){
				return (alert.attributes.lifecycle != 'Upcomming' && alert.attributes.lifecycle != 'Upcoming-Ongoing') && (alert.attributes.lifecycle == 'Ongoing'? alert.attributes.severity == 'Severe':alert)
			})
			//show alert icon only when alerts exist
			var alert = d3.select('#alerts')
			if($scope.alerts.length > 0 ){
				if(alert){
					alert.classed('hidden', false)					
				}
				showAlerts($scope.alerts)
				
				drawAlertIcon($scope.alerts.length)
			}else{
				if(alert){
					alert.classed('hidden',true)
				}				
			}
		})
	}

// Initial	
	$scope.getStops();
	$scope.getVehicles();
	$scope.getAlerts();
// Update
	$interval(function() {    
		$scope.getVehicles();

		$scope.getAlerts();
	}, 10000);

});

//draw routes and stations on main diagram
function drawStation(position,data){
var line, location,arrowAngle;
//draw station and route based on dirction
if(position == 'right'){
	location = rightLocation;
	arrowAngle = true;
}
else{
	location = leftLocation;
	data.reverse();
	arrowAngle = false;
}
var length = data.length;
var line = bindLine.append('g')
//green routes
line.append('rect')
	.attr('class','bind')
	.attr('x',location)
	.attr('width',bindWidth)
	.attr('y',interval)
	.attr('height',(length - 1) * interval)

//direction arrows
var arrows = line.append('g')
var count = 4 // the count of arrow between stops
for(i=0;i<(length -1)*count;i++){
	if(i%count){
		arrows.append('line')
			.attr('x1',location)
			.attr('y1',interval + interval / count * i)
			.attr('x2',location + bindWidth / 2)
			.attr('y2',interval + interval / count * i + bindWidth/2)
			.attr('class','triangle')
			.attr('transform','translate(' + (arrowAngle?bindWidth/2:0) + '0)')
		arrows.append('line')
			.attr('x2',location + bindWidth)
			.attr('y2',interval + interval / count * i)
			.attr('x1',location + bindWidth / 2)
			.attr('y1',interval + interval / count * i + bindWidth / 2)
			.attr('class','triangle')
			.attr('transform','translate(' + (arrowAngle ? -bindWidth / 2 : 0) + '0)')
	}

}

var update = line.selectAll('.stop')
	.data(data,function(d){return d.id})
var enter = update.enter()
	.append('g')
	.attr('class',function(d){return 'stop '+d.id})
	.attr('transform',function(d,i){return 'translate('+location + ',' + (i + 1) * interval + ')'})
enter.append('circle')
	.attr('r',function(d,i){return i == 0 || i == length - 1?bindWidth - 6:(bindWidth - 6) / 2})
	.attr('class',function(d,i){return i == 0 || i == length - 1?'terminalStop' : 'middleStop'})
	.attr('cx',bindWidth / 2)

//only append station names once
if(position == 'left'){
	enter.append('text')
		.text(function(d){return d.attributes.name})
		.attr('class','stationName')
		.attr('x',(rightLocation - leftLocation + bindWidth) / 2)
}
}
//draw vehicles on main diagram
function drawVehicles(data){
var update = vehicles.selectAll('.vehicle')
	.data(data,function(d){return d.id})
var enter = update.enter()
	.append('g')
	.attr('class','vehicle')
	.attr('id',function(d){return 'train' + d.id})
	.attr('data-location',function(d){return d.attributes.current_status + '-' + d.relationships.stop.data.id + '-' + d.attributes.direction_id})
	.attr('transform',function(d){
		var station = getXYFromTranslate(d3.select('.' + d.parent_station.id)._groups[0][0]);
		var offsetY,offsetX;
			offsetY = station[1] + (d.attributes.current_status == 'INCOMING_AT'? (d.attributes.direction_id? 1 : -1) * interval / 2 : 0);
			offsetX = d.attributes.direction_id? (rightLocation + 2 * bindWidth) : (leftLocation - 1 * bindWidth);
		return 'translate(' + offsetX + ',' + offsetY + ')';
	})
enter.append('svg:image')
	.attr("xlink:href","images/yellow-train.png")
	.attr('width', vehicleSize + 'em')
    .attr('height', vehicleSize + 'em')
    .attr('x',-vehicleSize/2 + 'em')
    .attr('y',-vehicleSize/2 + 'em')
enter.append('text').text(function(d){return d.attributes.label})
	.attr('class','vehicleNum')

update.merge(enter)
	.transition()
	.attr('transform',function(d){
		var station = getXYFromTranslate(d3.select('.'+d.parent_station.id)._groups[0][0]);
		var offsetY,offsetX;
			offsetY = station[1] + (d.attributes.current_status == 'INCOMING_AT'? (d.attributes.direction_id? 1 : -1) * interval / 2 : 0);
			offsetX = d.attributes.direction_id? (rightLocation + 2 * bindWidth) : (leftLocation - 1 * bindWidth);
		return 'translate(' + offsetX + ',' + offsetY + ')';
	})
	.attr('id',function(d){return 'train'+d.id})
	.select('text')
	.attr('x',function(d){return (d.attributes.direction_id == 0? -1 : 1) * 15})
	.style('text-anchor',function(d){return d.attributes.direction_id == 0?'end':'start'})

update.exit().remove();


}

//show alerts
function showAlerts(data){
	document.querySelector('#alertDetail').innerHTML = 
		data.map(function(alert){
			return 	'<div id=alert'+alert.id+'><h5 class=\"alertTitle\"><strong>' + alert.attributes.effect_name +':&nbsp;</strong>'+ alert.attributes.short_header +'</h5>'+(alert.attributes.description?('<p class=\"alertDes hidden\">'+alert.attributes.description+'</p><p class=\"viewMore\"><a>View More Detail&nbsp;<i class="fa fa-angle-right" aria-hidden="true"></i></a></p>'):(''))+'<p class=\"text-darker\">Last Updated: '+ getDate(alert.attributes.updated_at) +'</p></div>';
		}).join('') 

	//when click the detail of X alert, close other details of alerts.
	var alerts = document.querySelectorAll('.viewMore');
	Array.from(alerts).forEach(function(alert){
		alert.addEventListener('click',function(){
			var active = this.parentElement.id
			Array.from(document.querySelectorAll('.alertDes')).forEach(function(d){
				if(d.parentElement.id == active){
					d.classList.remove('hidden')
				}else{
					d.classList.add('hidden') 
				}
			})
			Array.from(alerts).forEach(function(d){
				if(d.parentElement.id == active){
					d.classList.add('hidden')
				}else{
					d.classList.remove('hidden') 
				}
			})
		})
	})

}
//draw alerts icon
function drawAlertIcon(count){
	var svgBox = document.querySelector('.alertImg')
	if(svgBox.childElementCount){
		d3.select('.alertImg').select('svg').select('text').text(count)
	}else
	{	var width = document.querySelector('.alertImg').clientWidth
		var height = document.querySelector('.alertImg').clientHeight
		var svg = d3.select('.alertImg').append('svg')
			.attr('viewBox','0 0 ' + width*3 +' ' + height*3)
			.attr('transform','translate(0,'+height/4+')')
		svg.append('path')
			.attr('d','M84.18,41.34l-3.42.46C80.61,26,73.21,14.52,59.34,7.34a37,37,0,0,0-30-2.08C9,12.23-2,35,5.3,55.14,11.76,73,32.57,88.68,58.91,77.48L60,80.57A36.58,36.58,0,0,1,46.57,84.1c-7,.39-13.92.05-20.55-2.7A42.41,42.41,0,0,1,10.07,69.55,39.54,39.54,0,0,1,1.74,54.66,44.81,44.81,0,0,1,.14,38.6a41.54,41.54,0,0,1,4.07-15A40.25,40.25,0,0,1,12,12.5C17.87,6.68,24.71,2.49,32.9.85a46.15,46.15,0,0,1,16-.29c11.91,1.8,21,8.13,27.88,17.81A40.89,40.89,0,0,1,83.87,36.7C84.08,38.23,84.08,39.8,84.18,41.34Z')
			.style('fill','#fff')
		svg.append('path')
			.attr('d', 'M69.24,34.66H48.86V68.78H34.35V34.7H14.79v-12H69.24Z')
			.style('fill','#fff')
		svg.append('path')
			.attr('d','M85.73,94a24.65,24.65,0,1,1,24.72-24.54A24.74,24.74,0,0,1,85.73,94Z')
			.style('fill','#FFD852')
		svg.append('text').text(count).attr('transform','translate(75,80)')
			.style('font-size','1.6em')
			.style('stroke',10)
	}
}

// get the coordinates of stops
function getXYFromTranslate(element){
	var x,y;
	if(element){
		var split = element.getAttribute('transform').split(',');
    	x = +split[0].split("(")[1];
    	y = +split[1].split(")")[0];
	}else{
		x = -100;
		y = -100;
	}

    return [x, y];
} 


function getTime(datestring) {
var time = [];
if(datestring){
	var msec = Date.parse(datestring);
	var d = new Date(msec);
}else{
	d = new Date()
}
var	timing = (d.getHours() >12? -12 : 0 )+ d.getHours() + ' : ' + (d.getMinutes() <10? '0': '')+d.getMinutes() + ' : ' + (d.getSeconds() <10? '0':'') + d.getSeconds(),
	ap = d.getHours() >=12? ' PM':' AM';
	time.push(timing,ap)
	return time
}
function getDate(datestring){
	var d = new Date(Date.parse(datestring));
	var date = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' + (d.getHours() >12? -12 : 0 )+ d.getHours() + ':' + (d.getMinutes() <10? '0': '')+d.getMinutes() + (d.getHours() >=12? ' PM':' AM');
	return date
}



