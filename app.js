//global url
stationurl = 'https://api.mbtace.com/stops?route='
// Define the `spApp` module
var app = angular.module('spApp', []);

// Define the `spAppController` controller on the `spApp` module
app.controller('spAppController', function spAppController($scope,$http) {
  
  var map = L.map('mapid')
  map.setView(new L.LatLng(42.351486,-71.066829), 13);
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
  map.zoomControl.setPosition('topright')
  // possible tile values 
  // light_all,
  // dark_all,
  // light_nolabels,
  // light_only_labels,
  // dark_nolabels,
  // dark_only_labels
  // $scope.stations = [];
$scope.getStops = function(route,stoptype){  
  $http.get(stationurl + route)
    .then(function(response) {
      console.log(response.data.data)
      //get the data
      $scope.stations = response.data.data
      //set the latlng collection for route, set the flag for selected status
      var latlngs = [], isClicked = false;
      //create a popup
      var popup = L.popup({className:'popup',closeButton:false})
      //draw station/stop and route
      angular.forEach($scope.stations,function(station){

        //create a marker for station/stop
        L.marker([station.attributes.latitude,station.attributes.longitude], {icon:stoptype == 'station'?stationImg:stopImg})
          .on('mouseover',function(){
            //set location and content for station/stop popup
            popup.setLatLng([station.attributes.latitude,station.attributes.longitude])
              .setContent(station.attributes.name)
              .openOn(map);
          })
          .on('mouseout',function(){
            map.closePopup()
          })
          .on('click',function(){
            console.log(this.options.icon)
            // this.options.icon.options.iconUrl = 'images/bus-selected.png'
            // this._icon.src = 'images/bus-selected.png'
          })
          .addTo(map);
        //populate the latlngs
        latlngs.push([station.attributes.latitude,station.attributes.longitude])
      })
      //draw route
      var polyline = L.polyline(latlngs, {className: 'path'}).addTo(map)
        .on('mouseover',function(e){
          this._path.classList.add('selected');
          console.log(e)
          //set location and content for station/stop popup
          popup.setLatLng([e.latlng.lat,e.latlng.lng])
            .setContent(route)
            .openOn(map);
        })
        .on('mouseout',function(){
          map.closePopup()
          if(!isClicked){this._path.classList.remove('selected')}})
        .on('click',function(){
          isClicked = isClicked ? false : true;
          if(isClicked){this._path.classList.add('selected')}
          else{this._path.classList.remove('selected')}
        });
    });
}
$scope.getStops('Green-E','station')
$scope.getStops('Green-D','stop')
});

