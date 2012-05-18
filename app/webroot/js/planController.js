/*
	----------------------------------------------------------------------
	This functions in this file controls the drawing of the plan.
	----------------------------------------------------------------------
*/

// Graphical settings
var modHeight = 22; 											// The height of a reservation
var borderHeight = 5; 											// The height of borders between reservations
var cutTopClass = "cutTop";										// The class for modules that starts before the view
var cutBottomClass = "cutBottom";								// The class for modules that ends after the view

// Static settings
var daysInAWeek = 
	['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];					// The days in a week
var timesInADay = 
	[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];		// The usable times in a day

var planFromWeek = 31;											// Hard coded start of plan
var planToWeek = 51;											// Hard coded end of plan
var rooms;														// Holds the rooms in the plan

// View configurations
var weekFrom = 1;												// The week the view starts from
var weekTo = 4;													// The week the view ends in
var days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];						// The days shown in the view
var times = [8,9,10,11,12,13,14,15,16];							// The times shown in the view
var roomType = "";												// The filtered room types
var specificRoom = "";											// The filtered specicic room

/*
	When the document is ready the reservations and modules are loaded and the plan is drawn.
*/
$(document).ready(function() {	

	// Setup tables
	initReservationTable();
	
	// Draw the plan
	drawPlan();
	
	// Resize the window
	resizeRight();
	
	$(window).resize(function() {
		resizeRight();
	});
	
	initChangeController();
	
	assignKeys();
	
	setupDialogBoxes();
	
	updateChangeText();
});

/*
	The create dialog needs information about courses and is loaded.
*/
function setupDialogBoxes(){
	// Insert courses
	$.get('/courses/', function(data){
		$("#selectCourse").empty();
		var courses = jQuery.parseJSON(data);
		var html = "";
		for(var c = 0; c < courses.length; c++){
			html += "<option id='" + courses[c].id + "'>" + courses[c].code + "</option>";
		}
		
		$("#selectCourse").append(html);
		
	});
}

/*
	Sets the values in the filter menu.
*/
function setFilterConfig(){
	// Setup filter menu
	for (var d = 0; d < daysInAWeek.length; d++){
		if (dayInView(daysInAWeek[d])){
			$('#' + daysInAWeek[d] + '').attr('checked', true);
		}
	}
	
	$('#weekFrom').val("" + (weekFrom + planFromWeek) + "");
	$('#weekTo').val("" + (weekTo + planFromWeek) + "");
	
	$('#timeFrom').val("" + times[0] + "");
	$('#timeTo').val("" + times[times.length-1] + "");
	
	// Insert specific rooms
	var html = "";
	for(var r = 0; r < rooms.length; r++) {
		html += "<option id='" + rooms[r].id + "'>" + rooms[r].code + "</option>";
	}
	
	$("#roomSpecific").append(html);
	
}

/*
	The action of the change of filtering. 
	It redraws the plan with the new filter settings. 
*/
function changeFiltering(){	
	// Set days in view
	days = new Array(7);
	for (var d = 0; d < daysInAWeek.length; d++){
		if ($('#' + daysInAWeek[d] + '').attr('checked') == 'checked'){
			days[d] = daysInAWeek[d];
		} else {
			days[d] = '';
		}
	}
	days = trimArray(days);
	
	// Set weeks in view
	weekFrom = $('#weekFrom').val() - planFromWeek;
	weekTo = $('#weekTo').val() - planFromWeek;
	
	// Set times in view
	times = createTimesArray(parseInt($('#timeFrom').val()), parseInt($('#timeTo').val()));
	
	// Set rooms in view
	roomType = $('#roomType').val();
	specificRoom = $('#roomSpecific').val();
	
	redrawPlan();	

	setupDragAndDrop();
}

/*
	Creates an array of the times from a given time and to a given time.
*/
function createTimesArray(from, to){
	arr = new Array(to-from+1);
	for(var i = 0; i < arr.length; i++){
		arr[i] = (from+i);
	}
	return arr;
}

/*
	Returns an array of the days that are viewed in the plan.
*/
function trimArray(days){
	// Get new length
	var l = 0;
	for (var i = 0; i < days.length; i++){
		if (days[i] != ''){
			l++;
		}
	}
	
	var newArr = new Array(l);
	
	var index = 0;
	for (var x = 0; x < days.length; x++){
		if (days[x] != ''){
			newArr[index] = days[x];
			index++;
		}
	}
	
	return newArr;
}

/*
	Returns true if the day is in the view.
*/
function dayInView(day){
	for(var i = 0; i < days.length; i++){
		if (days[i] == day){
			return true;
		}
	}
	return false;
}

/*
	Returns the index of a day in the days array.
	Returns false if it does not exist.
*/
function getDayIndex(day){
	for(var i = 0; i < daysInAWeek.length; i++){
		if (daysInAWeek[i] == day){
			return i;
		}
	}
	
	return false;
}

/*
	Rezises the right side of the plan to fit the window width.
*/
function resizeRight(){
	$('#outerRight').width($(window).width() - $('#left').width());
}

/*
	Draws the plan and loads the reservations and then draws the reservations.
*/
function drawPlan(){
	
	// Load data
	$.get('/rooms/', function(data){
		
		$("#left").empty();
		$("#right").empty();
		
		rooms = jQuery.parseJSON(data);
		
		setFilterConfig();
		
		$("#left").append(roomsColumn());
		
		$("#right").append(header() + cells());
		
		// Load reservations
		loadReservations();
		
		// Make header fixed
		$("#planRight").fixedtableheader({headerrowsize: 2 });
		
		setupDragAndDrop();
	});	
}

/*
	Redraws the plan with the new filtering settings.
*/
function redrawPlan(){
	$("#left").empty();
	$("#right").empty();
	
	$("#left").append(roomsColumn());
	
	$("#right").append(header() + cells());
	
	// Recreate fixed table header
	$("#fixedtableheader0").remove();
	$("#planRight").fixedtableheader({headerrowsize: 2 });
	
	// Load reservations
	drawReservations();
	
	// Setup drag and drop
	setupDragAndDrop();
}

/*
	Returns the HTML code of the left header containg rooms and times.
*/
function roomsColumn(){
	
	var html = '<table class="plan" id="planLeft"><tr><th colspan="2" class="cornerTop"></th></tr><tr><th colspan="2" class="cornerBottom"></th></tr>';

	// For each room
	for(var r = 0; r < rooms.length; r++) {
		if ((roomType == "" || rooms[r].room_type_id == roomType) && (specificRoom == "" || rooms[r].code == specificRoom)){
			var first = true;
			// For each time
			for(t = 0; t < times.length; t++) { 

				html += '<tr>';
				// If first row - draw room cell
				if (first) {
			 		html += '<th class="room" rowspan="' + times.length + '">' + rooms[r].code + '</th>';
					first = false;
				}

				// Draw time cell
				if (t == times.length-1){
					html += '<th class="timeLast">' + getTimeString(times[t]) + '</th>';
				} else {
					html += '<th class="time">' + getTimeString(times[t]) + '</th>';
				}

				html += '</th>';
			}
		}
	}
	html += '</table>';
	return html;
}

/*
	Returns the HTML code of the top header containing weeks and days.
*/
function header(){
	
	// Start row and add top-left corner
	var html = '<table class="plan" id="planRight"><thead>';
	
	// Write week columns
	for(var w = weekFrom; w <= weekTo; w++) {
		html += '<th class="week" colspan="' + days.length + '">Week ' + (w + planFromWeek) + '</th>'; 
	}
	
	// End row, begin new
	html += '</tr><tr>';
	
	// Write day columns
	for(var w = weekFrom; w <= weekTo; w++) {
		for(var d = 0; d < days.length; d++) {
			if (d == days.length-1){
				html += '<th class="lastDay">' + days[d] + '</th>';
			} else {
				html += '<th class="day">' + days[d] + '</th>';
			}
		}
	}
	
	// End row
	html += '</tr></thead>'
	
	return html;
}

/*
	Returns the cells in the plan. 
	All cells get a unique id that corresponds to the location in the plan.
*/
function cells(){
	var html = '';
	
	// For each room
	for(var r = 0; r < rooms.length; r++) {
		// Filter out?
		if ((roomType == "" || rooms[r].room_type_id == roomType) && (specificRoom == "" || rooms[r].code == specificRoom)){
			for(t = 0; t < times.length; t++) { 
				html += '<tr>';
				for(var w = weekFrom; w <= weekTo; w++) { 
					for(d = 0; d < days.length; d++) { 
						// Add cell with correct class and id
						html += cell(getDayIndex(days[d]), t, r, w);
					}
				}
				html += '</tr>';
			}
		}
	}
	html += '</table>';
	return html;
}


/*
	Returns the HTML code of a cell.
	The DOM object is given a class and id that corresponds to its location in the plan.
*/
function cell(d, t, r, w){
	var className = '';
	if(d == days.length && t == times.length-1){
		className = 'slotLastDayAndTime';
	} else if(t == times.length-1){
		className = 'slotLastTime';
	} else if(d == days.length){
		className = 'slotLastDay';
	} else {
		className = 'slot';
	}
	// Construct cell html giving an id to the inner div in the format: "c_rid_wnum_daynum_time"
	var id = 'c_r' + rooms[r].id + '_w' + w + '_d' + (d+1) + '_t' + times[t];
	
	html = '<td class="' + className + '"><div class="slotDiv" id="' + id + '"></div></td>';
	
	return html;
}

/*
	Returns the HTML code of a module.
*/
function getModuleHTML(modId){

	var from = Math.max(moduleFrom(modId), times[0]);
	var classes = "reservation";
	var courseName = moduleCourseCode(modId);
	
	if (moduleFrom(modId) < times[0]){
		classes += " " + cutTopClass;
	}
	
	var space = times[times.length-1] - from + 1;
	var hours = Math.min(moduleTo(modId) - from, space);
	
	if (moduleTo(modId) - from > space){
		classes += " " + cutBottomClass;
	}
	
	var height = (hours*modHeight + (hours-1)*borderHeight);
	
	return 	"<div class='" + classes + "' id='" + modId + "' " +
			"style='height: " + height + "px; " + 
			"'> " +
			courseName +  
			"</div>";
}

/*
	Draws a specified module.
*/
function drawModule(modId){
	
	// Insert into cell
	var html = getModuleHTML(modId);
	var cellId = findFittingCell(modId);
	$("#"+cellId+"").append(html);
	
	// Insert droppable to cells under module
	underneathDroppables(modId);
	
	// Setup draggable and droppable
	setupDragAndDrop();
}

/*
	Draws a specified module without setting up drag and drop.
	This function is way faster and should be called if several modules a drawn at the same time.
*/
function drawModuleNoSetup(modId){
	
	// Insert into cell
	var html = getModuleHTML(modId);
	var cellId = findFittingCell(modId);
	$("#"+cellId+"").append(html);
	
	// Insert droppable to cells under module
	underneathDroppables(modId);
}

/*
	Sets the cells underneath a module to droppable.
*/
function underneathDroppables(modId){
	
	var from = parseInt(moduleFrom(modId));
	var to = parseInt(moduleTo(modId));
	
	var fromView = Math.max(from, times[0]);
	var toView = Math.min(to, times[times.length-1]);
	
	// find root cell
	var cell = findFittingCell(modId);
	
	for (var i = 0; i <= toView-fromView; i++){
		
		// change timeslot
		var nextTime = (parseInt(cellTime(cell)) + i);
		cell = cell.split("_t")[0] + "_t" + nextTime;
		
		$("#"+cell).addClass("droppable");
	}
}

/*
	Sets up the hot keys.
*/
function assignKeys(){
	$(window).keypress(function(event) { 
		console.log(event.which + " " + currentDialog);
		if (event.which == 122){ // Z - undo
			event.preventDefault();
			undoChange();
			return false;
		}
		if (event.which == 115){ // S - save
			if (currentDialog == ""){
				event.preventDefault();
				saveChanges();
			}
			return false;
		}
		return true;
	});
	
	$("#saveForm").submit(function(event) {
		event.preventDefault();
	  	saveCreate();
	});
}

/*
	Returns the id attribute of a module if it is moved to another cell.
*/
function getAdjustedId(oldId, cellId){
	var hours = (parseInt(moduleTo(oldId)) - parseInt(moduleFrom(oldId)));
	return 		"i" + moduleId(oldId) + 
				"_m" + moduleReservation(oldId) + 
				"_r" + moduleRoom(cellId) + 
				"_w" + cellWeek(cellId) + 
				"_d" + cellDay(cellId) +
				"_co" + moduleCourse(oldId) +
				"_" + moduleCourseCode(oldId) +
				"_p" + modulePeopleString(oldId) +
				"_tf" + cellTime(cellId) +
				"_tt" + (parseInt(cellTime(cellId)) + parseInt(hours));
}

/*
	Removes the cut classes of a specified module.
*/
function removeCutClasses(modId){
	$("#"+modId+"").removeClass(cutTopClass);
	$("#"+modId+"").removeClass(cutBottomClass);
}

/*
	Adds cut classes of a specified module.
*/
function addCutClassAfterDrop(modId, duration, space){
	if (duration > space){
		$("#"+modId+"").addClass(cutBottomClass);
	} else {
		$("#"+modId+"").removeClass(cutBottomClass);
	}
	$("#"+modId+"").removeClass(cutTopClass);
}

/*
	Sets the hieght of a module to a given amount of hours.
*/
function setHeight(modId, hours){
	var height = (hours*modHeight + (hours-1)*borderHeight);
	$("#"+modId+"").css("height", height);
}

/*
	Returns a readable string from a specified time value.
*/
function getTimeString(time){
	if(time < 10){
		return '0' + time + ':00';
	}
	return time + ':00';
}

/*
	Returns the time value from a specified time string.
*/
function getTimeInt(timeString){
	var h = timeString.split(":")[0];
	if (h[0] == "0"){
		return h[1];
	}
	return h;
}

/*
	Returns the cell id that fits to the id attribute of a module.
*/
function findFittingCell(modId){
	var from = Math.max(moduleFrom(modId), times[0]);
	return "c_r" + moduleRoom(modId) + "_w" + moduleWeek(modId) + "_d" + moduleDay(modId) + "_t" + from;
}


/*
	----------------------------------------------------------------------
	The following functions returns a value of a specified cell id.
	----------------------------------------------------------------------
*/

function cellRoom(cellId){
	return cellId.split("_r")[1].split("_")[0];
}

function cellWeek(cellId){
	return cellId.split("_w")[1].split("_")[0];
}

function cellDay(cellId){
	return cellId.split("_d")[1].split("_")[0];
}

function cellTime(cellId){
	return cellId.split("_t")[1];
}