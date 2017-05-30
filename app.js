//global url
stationurl = 'https://api.mbtace.com/stops?route=Green-E'
// Define the `spApp` module
var app = angular.module('spApp', []);

// Define the `spAppController` controller on the `spApp` module
app.controller('spAppController', function spAppController($scope,$http) {
  
  var map = L.map('mapid')
  map.setView(new L.LatLng(42.351486,-71.066829), 13);
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
  // possible tile values 
  // light_all,
  // dark_all,
  // light_nolabels,
  // light_only_labels,
  // dark_nolabels,
  // dark_only_labels
  // $scope.stations = [];
  $scope.getStations = function(){
      $http.get(stationurl)
        .then(function(response) {
          console.log(response.data.data)
          $scope.stations = response.data.data
          var latlngs = []
          angular.forEach($scope.stations,function(station,i){
            console.log(i)
            L.marker([station.attributes.latitude,station.attributes.longitude], {icon:stop})
              .bindPopup(station.attributes.name)
              .addTo(map);
            latlngs.push([station.attributes.latitude,station.attributes.longitude])
          })
          var polyline = L.polyline(latlngs, {color: 'orange'}).addTo(map);
        });
  };
  $scope.getStations();

});

