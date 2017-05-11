$(function(){
	
	if($("#statusContainer")){
		createStatusBox("#statusContainer");
	}
	else{
		createStatusBox("body");
	}
	
	$("#statusClose").click(function(){
		$("#status").hide();
	});
	
});

function createStatusBox(thingtoappendto){
	var statusbox = $("<div id='status'></div>");
	var statusImage = $("<div id='statusImage'>").appendTo(statusbox);
	var errorbox = $("<div id='statusImage-error' class='statusImage'><i class='fa fa-times-circle'></i>").appendTo(statusImage);
	var infobox = $("<div id='statusImage-info' class='statusImage'><i class='fa fa-info-circle'></i>").appendTo(statusImage);
	var loadingbox = $("<div id='statusImage-loading' class='statusImage'><i class='fa fa-circle-o-notch fa-spin'></i>").appendTo(statusImage);
	var successbox = $("<div id='statusImage-success' class='statusImage'><i class='fa fa-check-circle-o'></i>").appendTo(statusImage);
	var warningbox = $("<div id='statusImage-warning' class='statusImage'><i class='fa fa-exclamation-triangle'></i>").appendTo(statusbox);
	var messagebox = $("<div id='statusMessage'></div>").appendTo(statusbox);
	var closebutton = $("<div id='statusClose'><i class='fa fa-times'></i></div>").appendTo(statusbox);
	if(thingtoappendto == 'body') statusbox.addClass("bottomleft");
	$(thingtoappendto).append(statusbox);
}

function setStatus(status, text){
	
	if($("#status") == undefined){
		createStatusBox("body");
	}
	
	/* Hide other status */
	$("#status").removeClass("error").removeClass("info").removeClass("loading").removeClass("success").removeClass("warning");
	$("#statusImage-error,#statusImage-info,#statusImage-loading,#statusImage-success,#statusImage-warning").hide();
	
	/* Show this status */
	$("#statusMessage").html(text);
	$("#statusImage-"+status).show();
	$("#status").addClass(status).show();
}

function clearStatus(){
	$("#status").removeClass("success").removeClass("loading").removeClass("error").hide();
}