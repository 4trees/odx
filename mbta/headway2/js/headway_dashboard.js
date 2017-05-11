// URL globals
apikey = "ASOviiaeO0qR9EkRy7WF3A";
stopsurl = "https://api.mbtace.com/stops?route=Green-D";
routesurl = "https://api.mbtace.com/routes";
vehiclesurl = "https://api.mbtace.com/vehicles?route=Green-D";
predictionsurl = "https://api.mbtace.com/predictions?route=Green-D";
tripsurl = "https://api.mbtace.com/trips?route=Green-D";

// BIG QUESTIONS:
// How to convert lat/long to a position along the route? (% of way between stops???)

// TODO:
// Find out "minutes out" for each train
// Order trains by stop sequence
// Place the trains somehow on the diagram
// Auto refresh

// GENERALIZATION:
// Programmatically find out what the 'x' and 'y' bound are for a particular route
// Select new route
// Color the background by the route

// DESIGN TIDBITS:
// Spacing in the line thingy

var app = angular.module('hdwyApp', []);

// Filter to reverse a list
app.filter('reverse', function() {
  return function(items) {
	if(items){
		return items.slice().reverse();
	}
  };
});

// Filter to remove text after a hyphen (-)
app.filter('beforeHyphen', function() {
  return function(str) {
	return str.slice(0, str.indexOf("-"));
  };
});

// Filter to turn a JSON datestring to a time
app.filter('datestringtotime', function() {
	return function(datestring) {
		if(datestring){
			var msec = Date.parse(datestring);
			var d = new Date(msec);
			return d.getHours() + ':' + d.getMinutes();
		}
	}
});

app.controller('hdwyCtrl', function($scope, $http, $timeout) {
	
	$scope.stops = [];
	$scope.vehicles = [];
	$scope.predictions = [];
	$scope.trips = [];
	$scope.stopidmap = {};
    
	$scope.getStops = function(){
		$http.get(stopsurl+"&direction_id=0")
		.then(function(response) {
			$scope.stops.xbound = response.data.data;
			
			angular.forEach($scope.stops.xbound, function(stop, k){
				if($scope.stopidmap[stop.id] == undefined){
					$scope.stopidmap[stop.id] = {};
				}
				$scope.stopidmap[stop.id].stop = stop;
			});
		});
		
		$http.get(stopsurl+"&direction_id=1")
		.then(function(response) {
			$scope.stops.ybound = response.data.data;
			
			angular.forEach($scope.stops.ybound, function(stop, k){
				if($scope.stopidmap[stop.id] == undefined){
					$scope.stopidmap[stop.id] = {};
				}
				$scope.stopidmap[stop.id].stop = stop;
			});
		});
	}
	
	$scope.getVehicles = function(){
		$http.get(vehiclesurl)
		.then(function(response) {
			$scope.vehicles = response.data.data;
	
			angular.forEach($scope.vehicles, function(vehicle, k){
				if($scope.stopidmap[vehicle.relationships.stop.data.id] == undefined){
					$scope.stopidmap[vehicle.relationships.stop.data.id] = {};
				}
				
				if(vehicle.attributes.current_status == 'STOPPED_AT'){
					if($scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_stopped == undefined){
						$scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_stopped = [];
					}
					$scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_stopped.push(vehicle);
				}
				if(vehicle.attributes.current_status == 'INCOMING_AT'){
					if($scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_incoming == undefined){
						$scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_incoming = [];
					}
					$scope.stopidmap[vehicle.relationships.stop.data.id].vehicles_incoming.push(vehicle);
				}
			});
			
		});
	}

	
	// Initial
	$scope.getStops();
	$scope.getVehicles();
});

// Templates //

app.directive('linediagram', function() {
  return {
    templateUrl: "templates/linediagram.html"
  };
});

app.directive('trainx', function() {
  return {
    templateUrl: "templates/trainx.html"
  };
});

app.directive('trainy', function() {
  return {
    templateUrl: "templates/trainy.html"
  };
});

