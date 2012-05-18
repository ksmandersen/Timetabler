/* 	
	----------------------------------------------------------------------
	The functions in this file controls the dialogs. 
	They shows and hides them and calls the appropriate functions when 
	the user presses a button.
 	----------------------------------------------------------------------
*/

var changedModule;			// Holds the module id attribute that was changed
var resized = false;		// Is used to tell if the change was a resize
var changedModuleNewTo;		// The new end time of the change module
var droppableClick;			// The droppable cell that eventually was clicked
var droppableFrom;			// The droppable cell that the changed module came from 
var droppableTo;			// The droppable cell that the changed module came to
var currentDialog = "";		// The current dialog. "" = none, "create", "change"

/*
	Shows the create dialog.
*/
function showCreateDialog(){
	currentDialog = "create";
	$("#darkLayer").css( { visibility: "visible"});
	$("#dialogCreate").css( { visibility: "visible"});
	$("#selectType").first().focus();
}

/*
	Shows the change dialog.
*/
function showChangeDialog(){	
	currentDialog = "change";
	$("#darkLayer").css( { visibility: "visible"} );
	$("#dialogChange").css( { visibility: "visible"} );
}

/*
	The action for the cancel button in the create dialog.
*/
function cancelCreate(){
	currentDialog = "";
	$("#darkLayer").css( { visibility: "hidden"});
	$("#dialogCreate").css( { visibility: "hidden"});
}

/*
	The action for the save button in the create dialog.
	Note that this method does not check the inputs in the dialog.
*/
function saveCreate(){
	
	// Read input
	var typeId = parseInt($("#selectType").children(":selected").attr("id"));
	var courseId = parseInt($("#selectCourse").children(":selected").attr("id"));
	var courseName = $("#selectCourse").val();
	var recSelected = $('#selectRecurring').attr('checked');
	var recNumber;
	var recType;
	if (recSelected == "checked"){
		recNumber = parseInt($("input:text").val());
		recType = $("#selectRecurringType").children(":selected").attr("id");;
	}
	
	// Insert modules and reservation
	if (recSelected == "checked"){
		addMulipleModules(	typeId, 
							courseId, 
							courseName, 
							droppableClick, 
							recType, 
							recNumber);
	} else {
		addModule(	typeId, 
					courseId, 
					courseName, 
					droppableClick, 
					cellTime(droppableClick), 
					(parseInt(cellTime(droppableClick)) + 1));
	}
	
	// Hide the dialog
	$("#darkLayer").css( { visibility: "hidden"});
	$("#dialogCreate").css( { visibility: "hidden"});
	currentDialog = "";
	
	setupDragAndDrop();
}

/*
	The action for all cancel buttons. It can itself figure out which dialog is open.
*/
function cancel(){
	// Call correct cancel depending on current dialog
	if (currentDialog == "create"){
		cancelCreate();
	} else if (currentDialog == "change"){
		cancelChange();
	}
}

/*
	The actions of the cancel button in the change dialog.
*/
function cancelChange(){
	currentDialog = "";
	$("#darkLayer").css( { visibility: "hidden"});
	$("#dialogChange").css( { visibility: "hidden"});
	
	$("#"+changedModule).remove();
	drawModule(changedModule);
}

/*
	The action for the button called 'only this change'
*/
function onlyThisChange(){
	// Hide dialog
	currentDialog = "";
	$("#darkLayer").css( { visibility: "hidden"});
	$("#dialogChange").css( { visibility: "hidden"});
	
	// Get time info
	var from = parseInt(moduleFrom(changedModule));
	var to = parseInt(moduleTo(changedModule));
	var hours = to - from;
	
	// Update id with new reservation id
	var oldId = changedModule;
	var newFrom = cellTime(droppableTo);
	var newTo;
	var newId;
	if (resized){
		newTo = changedModuleNewTo;
		newId = moduleNewToTime(oldId, newTo);
	} else {
		newTo = (parseInt(newFrom) + parseInt(hours));
		newId = getAdjustedId(oldId, droppableTo);
	}
	var newReservationId = getNewReservationId();
	newId = changeReservationId(newId, newReservationId);
	
	// Change id
	$("#"+oldId).remove();
	updateModuleId(oldId, newId);
	
	// Draw
	drawModule(newId);
	
	// Save changes	
	addChange([oldId, newId]);
	
	setupDragAndDrop();
}

/*
	The action for the button 'change all'.
*/
function allChange(){
	// Hide dialog
	currentDialog = "";
	$("#darkLayer").css( { visibility: "hidden"});
	$("#dialogChange").css( { visibility: "hidden"});
	
	// Get module
	var resId = moduleReservation(changedModule);
	
	// Get affected reservations
	var affModules = getModules(resId);
	var numOfAffModules = affModules[1];
	
	// Analyse change 
	var dayChange = parseInt(cellDay(droppableTo)) - parseInt(moduleDay(changedModule));
	var weekChange = parseInt(cellWeek(droppableTo)) - parseInt(moduleWeek(changedModule));
	var daysChange = weekChange * 7 + dayChange;
	var oldDuration = parseInt(moduleTo(changedModule)) - parseInt(moduleFrom(changedModule));
	var newFrom = parseInt(cellTime(droppableTo));
	var newTo = newFrom + oldDuration;
	if (resized){
		newTo = changedModuleNewTo;
	}
	var newRoom = cellRoom(droppableTo);
	
	// Add changes
	for(i = 0; i < numOfAffModules; i++){
		
		// Analyse change to reservation
		var oldId = affModules[i+2];

		// Find new day
		var newWeek = parseInt(moduleWeek(oldId)) + weekChange;
		var newDay = parseInt(moduleDay(oldId)) + dayChange;
		if (newDay < 1){
			newDay += 7;
			newWeek--; 
		} else if (newDay > 7){
			newDay -= 7;
			newWeek++;
		}
		
		// Generate new id
		var newId =	"i" + moduleId(oldId) + 
					"_m" + moduleReservation(oldId) +
					"_r" + newRoom + 
					"_w" + newWeek + 
					"_d" + newDay +
					"_co" + moduleCourse(oldId) +
					"_" + moduleCourseCode(oldId) +
					"_p" + modulePeopleString(oldId) +
					"_tf" + newFrom +
					"_tt" + newTo;

		// Change id and add change
		$("#"+oldId).remove();	
		updateModuleId(oldId, newId);
		
		// Draw module
		drawModuleNoSetup(newId);
		
		// Save changes
		addChange([oldId, newId]);
	}
	
	// Add multi-change on top of change stack
	addChange(["multi", numOfAffModules]);
	
	setupDragAndDrop();
	
}

/*
	Show/hide the filter menu.
*/
function toggleFilter() {
	$("#filterbox").toggle();
}

/*
	Shows/hides the filter menu with a fading effect.
*/
function showHideFilter(){
	$("#filterMenu").fadeToggle();
}