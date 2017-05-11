// URL globals
apikey = "ASOviiaeO0qR9EkRy7WF3A";
routesurl = "http://realtime.mbta.com/developer/api/v2.1/routes?format=json";
stopsurl = "http://realtime.mbta.com/developer/api/v2.1/stopsbyroute?format=json";
headwaysurl = "http://23.21.118.89/developer/api/v3/headways?format=json";
alertsurl = "http://realtime.mbta.com/developer/api/v2.1/alertsbyroute?format=json";
predictionsurl = "http://realtime.mbta.com/developer/api/v2/predictionsbystop?format=json"
metricsurl = "http://realtime.mbta.com/developer/api/v2/dailymetrics?format=json";

Highcharts.setOptions({ // This is for all plots, change Date axis to local timezone
	global : {
		useUTC : false
	}
});

$(function(){
	
	/* Auto Refresh Variables */
	/* Update intervalSeconds to the desired number of seconds between refreshes when auto refresh is on. */
	/* Update maxIterations to the desired number minutes' worth of autorefreshes before it times out. */
	/* Leave the rest alone. */
	var autoRefreshObject = { intervalSeconds: 60, timeoutMinutes: 30, currentIterations: 0, intervalReturn: false, timerIntervalReturn: false };

	// Perform initial step - Load the routes (this will trigger loading the stops and headways for the first option)
	routesListLoad();
	
	// Change events
	$("#routes").change(function(){
		selectARoute($(this).val());
	});
	
	$("#stops-0").change(function(){
		loadAStop(0);
	});
	
	$("#stops-1").change(function(){
		loadAStop(1);
	});
	
	$("select.resizeSelect").resizeSelect(); 
	$("select.resizeSelect").change(function(){
		$(this).resizeSelect(); 
	});
		
	// Click events
	$("#toggleAutoRefreshButton").click(function(){
		autoRefreshObject = setAutoRefresh(autoRefreshObject);
	});
	
	$("#settingsSave").click(function(){
		autoRefreshObject.intervalSeconds = $("#autoRefreshIntervalSeconds").val();
		autoRefreshObject.timeoutMinutes = $("#autoRefreshTimeoutMinutes").val();
	});
	
});

/* Load both stops on the page, from whatever stops are selected in the dropdowns */
function loadStops(){
	triggerHeadwayLoadSequence(0, $("#routes").val(), $("#stops-0").val(), $("#stops-0 option:selected").text());
	triggerHeadwayLoadSequence(1, $("#routes").val(), $("#stops-1").val(), $("#stops-1 option:selected").text());
}

/* Load a single stop. Direction is 0 or 1 */
function loadAStop(direction){
	triggerHeadwayLoadSequence(direction, $("#routes").val(), $("#stops-"+direction).val(), $("#stops-"+direction+" option:selected").text());
}

function routesListLoad(){
	setStatus("loading","Loading routes...");
	routesurl += "&api_key="+apikey;
	
	$.ajax({
	  url: routesurl,
	}).success(function(res) {
		populateListOfRoutes(res, stopsurl, headwaysurl);
	}).error(function(res) {
		setStatus("error", "Error loading list of routes");
		console.log(res);
	});
}

function selectARoute(route){
	updateRouteMetrics(route);
	stopsListLoad(route);
}

function stopsListLoad(route){
	setStatus("loading","Loading stops for route "+route+"...");
	url = stopsurl;
	url += "&api_key="+apikey;
	url += "&route="+route;
	$("#routes").val(route);
	$("#routes").resizeSelect();
	updateRouteColor(route);
	
	$.ajax({
	  url: url,
	}).success(function(res) {
		populateListOfStops(route, res);
	}).error(function(res) {
	  setStatus("error", "Error loading list of stops.");
	  console.log(res);
	});	
}

function updateRouteMetrics(route){
	
	var todaystring = formatDateAsYYYYMMDD(new Date());
	
	url = metricsurl;
	url += "&api_key="+apikey;
	url += "&route="+route;
	url += "&from_service_date="+todaystring;
	url += "&to_service_date="+todaystring;
	
	$.ajax({
	  url: url,
	}).success(function(res) {
		console.log(res); 
	}).error(function(res) {
	  setStatus("error", "Error loading route metrics.");
	  console.log(res);
	});		
}

function triggerHeadwayLoadSequence(dir, routeid, stopid, stopname){
	predictionsLoad(dir, routeid, stopid, stopname);
}

function predictionsLoad(dir, routeid, stopid, stopname){
	url = predictionsurl;
	url += "&api_key="+apikey;
	url += "&stop="+stopid;
	url += "&route="+routeid;
	url += "&direction="+dir;
	
	$.ajax({
	  url: url,
	}).success(function(res) {
		alertsLoad(dir, routeid, stopid, stopname, res);
	}).error(function(res) {
	  setStatus("error", "Error getting predictions for stop "+stopname+" ("+stopid+")");
	  console.log(res);
	});	
}

function alertsLoad(dir, routeid, stopid, stopname, predictions){
	
	alertsurl += "&api_key="+apikey;
	alertsurl += "&route="+routeid;
	
	$.ajax({
		url: alertsurl,
	}).success(function(res) {
		headwaysLoad(dir, stopid, stopname, predictions, res);
	}).error(function(res) {
		setStatus("error", "Error getting alerts for stop "+stopname+" ("+stopid+")");
		console.log(res);
	});	
}

function headwaysLoad(dir, stopid, stopname, predictions, alerts){
	setStatus("loading","Loading headways for stop "+stopname+"...");
	
	var from_datetime = get5AMTimestamp();
	var to_datetime = getCurrentTimestamp();
	
	headwaysurl += "&api_key="+apikey;
	headwaysurl += "&from_datetime="+from_datetime+"&to_datetime="+to_datetime;
	
	var dirheadwaysurl = headwaysurl + "&stop="+stopid;

	$.ajax({
		url: dirheadwaysurl,
	}).success(function(res) {
		processHeadwayData(dir, stopname, predictions, alerts, res);
	}).error(function(res) {
		setStatus("error", "Error getting headways for stop "+stopname+" ("+stopid+")");
		console.log(res);
	});
}

function populateListOfRoutes(obj){
		
	if($("#routes").length <= 1){
		
		var routenum = 0;
		
		$(obj.mode).each(function(mk, mv){
			if(mv.mode_name == "Subway"){
				for(r = 0; r < mv.route.length; r++){
					
					var routeid = mv.route[r].route_id;
					
					if(routeid != "Mattapan"){ /* Hard-coding removal of Mattapan Trolley from the Subway list for now */
											
						addOptionToSelect("#routes", routeid, mv.route[r].route_name);
						routenum++;
					
						// Choose the first option
						if(routenum == 1){
							selectARoute(routeid);
						}
					}
				}			
			}
		});
			
	}
}

function populateListOfStops(route, obj){
	
	console.log(obj);

	// Clear previous lists of stops
	$("#stops-0").empty();
	$("#stops-1").empty();
	
	var firstidx = 0;
	var lastidx = obj.direction[0].stop.length - 1;
		
	// Print names of directions
	$("#direction-0-name").text(obj.direction[0].direction_name+" Stop");
	$("#stops-0").attr("title", obj.direction[0].direction_name+" Stop");
	$("#direction-1-name").text(obj.direction[1].direction_name+" Stop");
	$("#stops-1").attr("title", obj.direction[1].direction_name+" Stop");
		
	// Create new lists of directions & stops
	for(var i=0; i < obj.direction[0].stop.length; i++){
		
		if(i != firstidx && i != lastidx){ // Eliminate terminal stops
				
			var dir0stop = obj.direction[0].stop[i].stop_id;
			var dir0stopname = obj.direction[0].stop[i].stop_name;
			var dir1stop = obj.direction[1].stop[i].stop_id;
			var dir1stopname = obj.direction[1].stop[i].stop_name;
			
			// Selected stop -- select the first item by default; hard code exceptions for now
			if(dir1stopname == 'Andrew - Inbound'){
				selectedstop1 = dir1stop;
			}
			else if(i == firstidx + 1){
				selectedstop0 = dir0stop;
				selectedstop1 = dir1stop;
			}
				
			addOptionToSelect("#stops-0", dir0stop, dir0stopname);
			addOptionToSelect("#stops-1", dir1stop, dir1stopname);
			
			// Select the first option & reload the headways
			if(dir0stop == selectedstop0){
				$("#stops-0").val(dir0stop);
				$("#stops-0").resizeSelect();
				loadStops(0);
			}
			if(dir1stop == selectedstop1){
				$("#stops-1").val(dir1stop);
				$("#stops-1").resizeSelect();
				loadStops(1);
			}
		}
	}
	
	clearStatus();
}

function processHeadwayData(chartidx, stopname, predictionres, alertres, headwayres){
	
	var title = stopname;
	var xaxis = new Array();
	var values = new Array();
	var benchmarks = new Array();
	var ontime = new Array();
	var late1 = new Array();
	var late2 = new Array();
	var late3 = new Array();
	var alertbands = new Array();	
	var numHeadways = 0;
	var numOntime = 0;
	var numLate1 = 0;
	var numLate2 = 0;
	var numLate3 = 0;
		
	if(headwayres.headways.length <= 0){
		setStatus("error", "No headways found for stop "+stopname+".");
		return false;
	}
	else{
		setStatus("loading", "Processing headway data for stop "+stopname+"...");
	}
		
	// Go through the headways and build the xaxis and series y axis arrays.
	$(headwayres.headways).each(function(key, value){
		
		// Add values to xaxis (times of day), headways line (values), and benchmarks line
		values.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.headway_time_sec)
			]);
		benchmarks.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.benchmark_headway_time_sec)
			]);
		
		// Based on level of lateness, build on time and late series, and sum up for running percentages
		var difference = value.headway_time_sec - value.benchmark_headway_time_sec;
		numHeadways++;
		
		if(difference <= 60){
			ontime.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.headway_time_sec)
			]);
			numOntime++;
		}
		else if(difference > 60 && difference <= 180){
			late1.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.headway_time_sec)
			]);
			numLate1++;
		}
		else if(difference > 180 && difference <= 360){
			late2.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.headway_time_sec)
			]);
			numLate2++;
		}
		else if(difference > 360){
			late3.push([
				parseInt(value.current_dep_dt) * 1000, 
				parseInt(value.headway_time_sec)
			]);
			numLate3++;
		}
	
	});
	
	// Add the predictions.
	var predictions = new Array();
	var lastpredicteddep = values[values.length-1][0];
	if(predictionres != undefined && predictionres.mode != undefined && predictionres.mode[0] != undefined && predictionres.mode[0].route != undefined && predictionres.mode[0].route[0] != undefined && predictionres.mode[0].route[0].direction != undefined && predictionres.mode[0].route[0].direction[0] != undefined && predictionres.mode[0].route[0].direction[0].trip != undefined){
		$(predictionres.mode[0].route[0].direction[0].trip).each(function(idx, trip){
			var nextdep = parseInt(trip.pre_dt) * 1000;
			predictions.push([
				nextdep,
				(nextdep - lastpredicteddep) / 1000
			]);
			lastpredicteddep = nextdep;
		});
	}
	
	// Add the alerts.
	if(alertres && alertres.alerts && alertres.alerts.length > 0){
		var timestamp5AM = get5AMTimestamp();
		var timestampNow = getCurrentTimestamp();
		
		$(alertres.alerts).each(function(alertidx, alert){
			$(alert.effect_periods).each(function(pidx, period){
					
				if(period.effect_end >= timestamp5AM && period.effect_start <= timestampNow){
					var band = new Object();
					band.from = parseInt(period.effect_start) * 1000;
					band.to = parseInt(period.effect_end) * 1000; 
					band.label = new Object();
					band.label.text = alert.severity + "<br>" + alert.effect_name; 
					alertbands.push(band); 
					if(alert.severity == 'Severe'){
						band.color = '#FCC';
					}
					else{
						band.color = '#FFC';
					}
				}
			});
			
		});
	}	

	clearStatus();
	updatePercentages(chartidx, numHeadways, numOntime, numLate1, numLate2, numLate3);
	buildChart(chartidx, title, xaxis, values, benchmarks, ontime, late1, late2, late3, alertbands, predictions);
}

function updatePercentages(chartidx, numHeadways, numOntime, numLate1, numLate2, numLate3){
	if(numHeadways > 0){
		var percentOntime = parseFloat(numOntime/numHeadways);
		var percentLate1 = parseFloat(numLate1/numHeadways);
		var percentLate2 = parseFloat(numLate2/numHeadways);
		var percentLate3 = parseFloat(numLate3/numHeadways);
		
		/*
		$("#percentOntime-"+chartidx).text(formatDecimalAsPercent(percentOntime).toString()+"%");
		$("#percentLate1-"+chartidx).text(formatDecimalAsPercent(percentLate1).toString()+"%");
		$("#percentLate2-"+chartidx).text(formatDecimalAsPercent(percentLate2).toString()+"%");
		$("#percentLate3-"+chartidx).text(formatDecimalAsPercent(percentLate3).toString()+"%");
		
		$("#percentages-"+chartidx).show();
		
	}
	else{
		$("#percentOntime-"+chartidx).text("");
		$("#percentLate1-"+chartidx).text("");
		$("#percentLate2-"+chartidx).text("");
		$("#percentLate3-"+chartidx).text("");
		
		$("#percentages-"+chartidx).hide();
		*/
	}
	
	$("#percentChart-"+chartidx).highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Percent On Time',
			style: {
				display: 'none'
			}
        },
        xAxis: {
			labels: {
				enabled: false
			},
			stackLabels: {
                enabled: true
            },
        },
        yAxis: {
            min: 0,
			max: 1,
            title: {
                enabled: false
            },
			labels: {
				enabled: false
			},
			stackLabels: {
                enabled: true
            },
			gridLineWidth: 0,
			minorGridLineWidth: 0
        },	
		tooltip: {
			formatter: function() {
				return '<b>' + this.series.name + '</b>'
					+ '<br>' 
					+ formatDecimalAsPercent(this.y) + '%';
			}
		},			
        legend: {
            enabled: false
        },
        plotOptions: {
            series: {
                stacking: 'normal',
				dataLabels: {
					enabled: true,
					align: 'right',
					style: {
						color: '#FFF'
                    },
					formatter: function() {
						return '<b>' + this.series.name + '</b>'
							+ '<br>' 
							+ '<span style="font-size:1.3em">' + formatDecimalAsPercent(this.y) + '%' + '</span>'
					}
				}
			}
        },
        series: [
		{
			name: 'More',
			color: '#900',
			data: [percentLate3]
		},
		{
			name: '3-6 Minutes Late',
			color: '#C60',
			data: [percentLate2]
		},
		{
			name: '1-3 Minutes Late',
			color: '#990',
			data: [percentLate1]
		},
		{
			name: 'Under 1 Minute Late',
			color: '#090',
            data: [percentOntime]
        }		
		]
    });
	
	$("#percentChart-"+chartidx).show();
}

function buildChart(chartidx, chtitle, chxaxis, chvalues, chbenchmarks, chontime, chlate1, chlate2, chlate3, chalertbands, predictions){
	
	setStatus("loading", "Building headways chart for "+chtitle+"...");

	var chartdivid = "#chart-"+chartidx;
		
	if(chvalues.length > 0){
		
		$(chartdivid).show();

		$(chartdivid).highcharts({
			title:{
				text: chtitle,
				style: {
					display: 'none'
				}
			},
			xAxis: {
				title: {
					text: 'Departure Time (Today)'
				},
				type: 'datetime',
				min: get5AMTimestamp() * 1000,
				max: get1AMTimestamp() * 1000,
				labels: {
					formatter: function() {
						return formatTimestampAsHHMM(this.value);
					}
				},
				plotBands: chalertbands
			},
			yAxis: {
				title: {
					text: 'Headway Minutes'
				},
				floor: 0,
				tickInterval: 60,
				labels: {
					formatter: function() {
						return  formatSecondsAsMM(this.value);
					}
				}
			},
			tooltip: {
				formatter: function() {
					return '<b>' + formatTimestampAsHHMM(this.x) + ' Departure </b>'
						+ '<br>'
						+ formatSecondsAsMMSS(this.y) + ' Minute Headway';
				}
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle',
				borderWidth: 0
			},
			series: [
				{
					name: 'Actual Headway',
					data: chvalues,
					type: 'line',
					color: '#DDD',
					marker: {
						enabled: false
					}
				},
				{
					name: 'Scheduled Headway',
					data: chbenchmarks,
					type: 'line',
					color: '#009',
					marker: { 
						enabled: false 
					}
				},
				{
					name: 'Under 1 Minute Late',
					data: chontime,
					type: 'scatter',
					color: '#0C0',
					marker: {
						symbol: 'diamond'
					}			
				},		
				{
					name: '1-3 Minutes Late',
					data: chlate1,
					type: 'scatter',
					color: '#CC0',
					marker: {
						symbol: 'diamond'
					}			
				},
				{
					name: '3-6 Minutes Late',
					data: chlate2,
					type: 'scatter',
					color: '#F90',
					marker: {
						symbol: 'diamond'
					}			
				},
				{
					name: 'Over 6 Minutes Late',
					data: chlate3,
					type: 'scatter',
					color: '#C00',
					marker: {
						symbol: 'diamond'
					}			
				},
				{
					name: 'Predictions',
					data: predictions,
					type: 'scatter',
					color: '#CCC',
					marker: {
						symbol: 'diamond'
					}			
				}
			]
		});
		
	}
	else{
		$(chartdivid).hide();
	}
	
	clearStatus();
}

function updateRouteColor(routeid){
	// Remove any existing route classes
	$("#routeHeader").removeClass("Blue").removeClass("Green").removeClass("Orange").removeClass("Red");
	$("#routeHeader select").removeClass("Blue").removeClass("Green").removeClass("Orange").removeClass("Red");
	$("#divider").removeClass("Blue").removeClass("Green").removeClass("Orange").removeClass("Red");
	$("#headerBar").removeClass("Blue").removeClass("Green").removeClass("Orange").removeClass("Red");
	
	// Add current route class
	var routeidparts = routeid.split("-");
	var routetag = routeidparts[0];
	$("#routeHeader").addClass(routetag);
	$("#routeHeader select").addClass(routetag);
	$("#divider").addClass(routetag);
	$("#headerBar").addClass(routetag);
}

/* Set auto refresh: returns the updated auto refresh object */
function setAutoRefresh(autoRefreshObject, headwaysurl){
			
	if(!autoRefreshObject.intervalReturn){ // Turn on autorefresh
		return turnOnAutoRefresh(autoRefreshObject, headwaysurl);
	}
	else{ // Turn off autorefresh
		return turnOffAutoRefresh(autoRefreshObject);
	}
}

function turnOnAutoRefresh(autoRefreshObject, headwaysurl){
	
	$("#toggleAutoRefreshButton").attr("title","Auto-refresh is on").removeClass("off").addClass("on");
	autoRefreshObject.maxIterations = parseInt((autoRefreshObject.timeoutMinutes * 60) / autoRefreshObject.intervalSeconds);
	
	console.log("Auto refresh is set to refresh every "+autoRefreshObject.intervalSeconds+" seconds and timeout after "+autoRefreshObject.timeoutMinutes+" minutes, equalling "+autoRefreshObject.maxIterations+" iterations.");
	
	autoRefreshObject = setAutoRefreshTimer(autoRefreshObject);
	loadStops(); // do initial refresh

	autoRefreshObject.intervalReturn = setInterval(function(){ 
	
		if(autoRefreshObject.currentIterations >= autoRefreshObject.maxIterations){
			setStatus("info","Auto-refresh has timed out. You may restart it at any time.");
			return turnOffAutoRefresh(autoRefreshObject);
		}
		else{
			autoRefreshObject.currentIterations = autoRefreshObject.currentIterations + 1;
			loadStops();
		}
		
	}, autoRefreshObject.intervalSeconds * 1000);

	return autoRefreshObject;
}

function turnOffAutoRefresh(autoRefreshObject){
	
	clearInterval(autoRefreshObject.timerIntervalReturn);
	clearInterval(autoRefreshObject.intervalReturn);
	
	autoRefreshObject.intervalReturn = false;
	autoRefreshObject.timerIntervalReturn = false;
	autoRefreshObject.currentIterations = 0;
	
	$("#toggleAutoRefreshButton").attr("title","Auto-refresh is off").removeClass("on").addClass("off");
	$("#autoRefreshTimer").hide();
	
	return autoRefreshObject;
}

function setAutoRefreshTimer(autoRefreshObject){

	currentSeconds = updateAutoRefreshTimer(autoRefreshObject.intervalSeconds, autoRefreshObject.intervalSeconds);

	if(!autoRefreshObject.timerIntervalReturn){ // Turn on autorefresh
		autoRefreshObject.timerIntervalReturn = setInterval(function(){
			currentSeconds = updateAutoRefreshTimer(autoRefreshObject.intervalSeconds, currentSeconds);
		}, 1000);
		
		$("#autoRefreshTimer").show();
		return autoRefreshObject;
	}
	else{ // Turn off autorefresh
		$("#autoRefreshTimer").hide();
		clearInterval(autoRefreshObject.timerIntervalReturn);
		return false;
	}
}

function updateAutoRefreshTimer(maxSeconds, currentSeconds){
	$("#autoRefreshTimerSeconds").text(formatSecondsAsMMSS(currentSeconds));
	if(currentSeconds <= 0) currentSeconds = maxSeconds;
	else currentSeconds--;
	return currentSeconds;
}

function addOptionToSelect(selectid, itemid, itemname){
	
	var option = $("<option></option>")
         .attr("value",itemid)
         .text(itemname);
	
	option.appendTo($(selectid));
}

function get5AMTimestamp(){
	var from_datetime = new Date(); // starts at today's date
	if(from_datetime.getHours() > 1 && from_datetime.getHours() < 5){ // If it's currently between 1 and 5 AM, show yesterday's data
		from_datetime.setDate(from_datetime.getDate() - 1);
	}
	from_datetime.setHours(5,0,0,0); // set initial timestamp of 5 AM
	from_datetime = Math.floor(from_datetime.getTime()/ 1000);	
	return from_datetime;
}

function get1AMTimestamp(){
	var from_datetime = new Date(); // starts at today's date
	if(from_datetime.getHours() > 5){ // If it's after 5AM, 1AM is tomorrow
		from_datetime.setDate(from_datetime.getDate() + 1);
	}
	from_datetime.setHours(1,0,0,0); // set initial timestamp of 1 AM
	from_datetime = Math.floor(from_datetime.getTime()/ 1000);	
	return from_datetime;
}

function getCurrentTimestamp(){
	var to_datetime = new Date(); // current timestamp
	to_datetime = Math.floor(to_datetime.getTime() / 1000);
	return to_datetime;
}

function formatTimestampAsHHMM(timestamp){
	var xdate = new Date(timestamp);
	var xhour = xdate.getHours();
	var ampm = "AM";
	if(xhour >= 12) ampm = "PM";
	xhour = xhour % 12;
	if(xhour == 0) xhour = 12;
	var xminute = xdate.getMinutes();
	if(xminute < 10) xminute = "0" + xminute.toString();
	var xdate_formatted = xhour + ":" + xminute + " " + ampm;
	return xdate_formatted;	
}

function formatSecondsAsMM(secs){
	var mm = Math.floor(secs/60);
	return mm;
}

function formatSecondsAsMMSS(secs){
	var mm = Math.floor(secs/60);
	var ss = secs % 60;
	if(ss < 10) ss = "0" + ss.toString();
	return mm + ":" + ss;
}

function formatDecimalAsPercent(num){
	num = parseFloat(num) * 10000;
	num = Math.round(num);
	num = num / 100;
	return num;
}

function formatDateAsYYYYMMDD(today){
	var year = today.getFullYear();
	var month = today.getMonth() + 1;
	if(month < 10) month = "0" + month;
	var day = today.getDate();
	if(day < 10) day = "0" + day;
	var string = year + "-" + month + "-" + day;
	return string;
}

/* Resize select: resizes select box to the width of the currently selected option; for use as a centered header. */
(function($, window){
  var arrowWidth = 30;

  $.fn.resizeSelect = function(settings) {
  
    return this.each(function() { 

        var $this = $(this);
		
        // create test element
        var text = $this.find("option:selected").text();
		var fontsize = $this.css("font-size"); /* Affects width */
		var fontweight = $this.css("font-weight"); /* Affects width */
        var $test = $("<span>").html(text).css("font-size", fontsize).css("font-weight", fontweight);

        // add to body, get width, and get out
        $test.appendTo('body');
        var width = $test.width();
        $test.remove();

        // set select width
		var newwidth = (width + arrowWidth);
        $this.width(newwidth);

    });
  };                   

})(jQuery, window);