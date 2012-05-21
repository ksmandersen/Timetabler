/* 	
	----------------------------------------------------------------------
	The functions in this file stores the changes made in a plan and is 
	responisble for undoing, conflict handling and saving. 
	
	A stack is used to store the changes.
	A change is an array of two elements.
	
	There exists three types of changes:
	1: [oldId, newId] - A simple change
	2: ["new", id] - A new module was created with id
	3: ["multi", n] - A series of changes happened at once, where n 
	indicates the number of changes.
	
	When Undo is called and a "mulit"-element is pulled from the stack 
	the next n changes will be pulled as a result. 
	
	The conflict handling checks for room conflicts and person conflicts.
	A room conflict is the situation where a room has two reservations 
	the same time.
	A person conflict is the situation where a person needs to be in two 
	rooms at the same time.
	
	The conflict handling should also check for class conflicts.
	A Class conflict is the situation where a class is in two rooms the 
	same time.
	But this is NOT implemented.
 	----------------------------------------------------------------------
*/

// Changes
var maxChanges = 1000; 					// The maximum size of the change stack
var changes = new Array(maxChanges); 	// The change stack
var changePointer = 0;					// The stack pointer
var multiCounter = 0;					// The number of multi changes in the change stack. 
										// number of changes = changePointer - multiCount
var saving = false;						// Indicates whether the system is saving

// Conflicts
roomConflicts = [];						// The conflicts involving two modules in the same room at the same time
rcPointer = 0;							// The number of room conflicts
personConflicts = [];					// The conflicts involving a person beeing two places at the same time
pcPointer = 0;							// The number of person conflicts

/* 
	Allocates memory for the changes.
*/
function initChangeController(){
	for (i = 0; i < changes.length; i++){
		changes[i] = new Array(2);
	}
}

/*
	Adds a change to the change stack.
	If the change is not a new change or multi change it will check for conflicts.
*/
function addChange(change){
	// Ignore change if it does not change anything
	if (change[0] != change[1]){
		changes[changePointer] = change;
		changePointer++;
		// Check for change type
		if (change[0] == "multi"){
			multiCounter++;
		} else if (change[0] == "new"){
			checkForConflictsRegarding(change[1]);
		} else {
			removeConflictsRegarding(change[0]);
			checkForConflictsRegarding(change[1]);
		}
	}
	updateChangeText();	
}

/*
	Updates the change counter in the UI.
*/
function updateChangeText(){
	var num = changePointer-multiCounter;
	$("#changes-number").html(num);
	if (num == 0){
		$("#save").prop('disabled', true);
		$("#save").val('Saved');
	} else {
		$("#save").prop('disabled', false);
		$("#save").val('Save');
	}
}

/*
	Undoes a change using the function undo() if there is any change in the change stack.
*/
function undoChange(){
	// Only if stack is not empty
	if (changePointer > 0){
		undo();
		updateChangeText();
	}
}

/*
	Requires: at least one change in the change stack.
	Undoes a change and checks for conflicts.
*/
function undo(){
	
	// Pull from change stack
	changePointer--;
	var oldId = changes[changePointer][0];
	var newId = changes[changePointer][1];

	// Check for change type
	if (oldId == "multi"){
		// Get number of module changes
		n = parseInt(newId);
		for(i = 0; i < n; i++){
			// Undo unless stack is empty
			if (changePointer > 0){
				undo();
			}
		}
		multiCounter--;
	} else if (oldId == "new"){
		// Remove module
		var newCellId = findFittingCell(newId);
		$("#" + newCellId + "").empty();
		removeModule(newId);
		removeConflictsRegarding(newId);
	} else {
		// Remove the new module from the UI
		var newCellId = findFittingCell(newId);
		$("#" + newCellId + "").empty();

		// Insert the old reservation to the UI
		var oldCellId = findFittingCell(oldId);
		$("#" + oldCellId + "").append(getModuleHTML(oldId));
		$("#" + oldId + "").css( { 	position: "relative", top: "0px", left: "0px"} );

		// Update draggables and resizables
		setupDragAndDrop();

		// Update module
		updateModuleId(newId, oldId);
		
		// Check for conlicts
		removeConflictsRegarding(newId);
		checkForConflictsRegarding(oldId);
	}
}

/*
	Removes every conflict invovling the specified module.
*/
function removeConflictsRegarding(modId){
	removeRoomConflictsRegarding(modId);
	removePersonConflictsRegarding(modId);
	updateConflictsText();
}

/*
	Removes all room conflicts invovling the specified module.
*/
function removeRoomConflictsRegarding(modId){
	// Create a temporary array for room conflicts
	var roomConflictsNew = [];
	var rcPointerNew = 0;
	var pointer = 0;
	
	// Add all room conflicts not involving the specified module to the temporary array of room conflicts
	for (var i = 0; i < roomConflicts.length; i++){
		if (!(roomConflicts[i][0] == modId || roomConflicts[i][1] == modId)){
			roomConflictsNew[pointer] = roomConflicts[i];
			pointer++;
			rcPointerNew++;
		}
	}
	
	// Override the array of room conflicts 
	roomConflicts = roomConflictsNew;
	rcPointer = rcPointerNew;
}

/*
	Removes all person conflicts invovling the specified module.
*/
function removePersonConflictsRegarding(modId){
	// Create a temporary array for person conflicts
	var personConflictsNew = [];
	var pcPointerNew = 0;
	var pointer = 0;
	
	// Add all person conflicts not involving the specified module to the temporary array of person conflicts
	for (var i = 0; i < personConflicts.length; i++){
		if (!(personConflicts[i][0] == modId || personConflicts[i][1] == modId)){
			personConflictsNew[pointer] = personConflicts[ixx];
			pointer++;
			pcPointerNew++;
		}
	}
	
	// Override the array of person conflicts 
	personConflicts = personConflictsNew;
	pcPointer = pcPointerNew;
}

/*
	Finds all room conflicts and person conflicts in the plan.
	This algorithm runs in O(n^2) and should only be called when a plan is loaded.
*/
function checkForConflicts(){
	// Reset conflicts
	roomConflicts = [];
	rcPointer = 0;
	personConflicts = [];
	pcPointer = 0;
	
	// Iterate through all modules
	for (var ra = 0; ra < resTable.length; ra++){
		for (var ma = 2; ma < resTable[ra].length; ma++){
			var modA = resTable[ra][ma];
			if (modA == ""){
				break; // Break if reservation does not contain any more modules
			}
			// Search through all module starting from modA
			for (var rb = ra; rb < resTable.length; rb++){
				var modIn = 2;	// Skip first two indices
				if (rb == ra){	// Go to next module if we look at the module from the first iteration
					modIn = ma+1;
				}
				for (var mb = modIn; mb < resTable[rb].length; mb++){
					var modB = resTable[rb][mb];
					if (modB == ""){
						break;	// Break if reservation does not contain any more modules
					}
					// Find conflicts involving the two modules.
					findConflicts(modA, modB);
				}
			}
		}
	}
	updateConflictsText();
}

/*
	
*/
function checkForConflictsRegarding(modId){
	
	// Search through all modules
	for (var r = 0; r < resTable.length; r++){
		if (resTable[r][0] == ""){
			break;	// Break if there does not exist anymore reservations
		}
		for (var m = 2; m < resTable[r].length; m++){
			var modB = resTable[r][m];
			if (modB == ""){
				break;	// Break if reservation does not contain any more modules
			}
			// Find conflicts involving the two modules.
			findConflicts(modId, modB);
		}
	}
	updateConflictsText();
}

/* 
	Add conflicts involving the two specified modules.
	If the modules are the same it will ignore the check.
*/
function findConflicts(a, b){
	if (a != b){	// Only if a and b is different
		if (moduleWeek(a) == moduleWeek(b)){				// Same week?
			if (moduleDay(a) == moduleDay(b)){				// Same day?
				if (moduleRoom(a) == moduleRoom(b)){		// Same room?
					if (timeOverlaps(a,b)){					// Same time?
						roomConflicts[rcPointer] = [a, b];	
						rcPointer++;
					}
				}
				if (timeOverlaps(a,b)){						// Same time?
					if (personOverlaps(a,b)){				// Same persons?
						personConflicts[pcPointer] = [a, b];
						pcPointer++;
					}
				}
			}
		}
	}
}

/*
	Returns true of the times of two modules overlap.
*/
function timeOverlaps(a, b){
	var aFrom = parseInt(moduleFrom(a));
	var aTo = parseInt(moduleTo(a));
	var bFrom = parseInt(moduleFrom(b));
	var bTo = parseInt(moduleTo(b));
	
	if (aFrom < bTo && aTo > bFrom){
		return true;	// If a starts before b ends and a ends after b starts
	}
	if (bFrom < aTo && bTo > aFrom){
		return true;	// If b starts before a ends and b ends after a starts
	}
	if (aFrom == bFrom){
		return true;	// If the start time of a and b are the same
	}
	return false;
}

/*
	Returns true of the persons of two modules overlap.
	If there is not persons attached to the course of a module it will NOT find 
	any person overlaps.
*/
function personOverlaps(a, b){
		
	var aPersons = modulePeopleArray(a);
	var bPersons = modulePeopleArray(b); 
	
	for(var ap = 0; ap < aPersons.length; ap++){
		for(var bp = 0; bp < bPersons.length; bp++){
			if (aPersons[ap] == bPersons[bp] && aPersons[ap] != "" && bPersons[bp] != ""){
				return true;
			}
		}
	}
	
	return false;
}

/*
	Updates the conflict counter in the UI.
*/
function updateConflictsText(){
	var num = roomConflicts.length + personConflicts.length;
	$("#conflicts-number").html(num);
	if (num > 0){
		$("#conflicts-number").addClass("red");
		$("#conflicts-number").removeClass("green");
	} else {
		$("#conflicts-number").addClass("green");
		$("#conflicts-number").removeClass("red");		
	}
}

/*
	Saves the changes since last save.
	The change stack is converted to an array of dictionaries which holds the 
	information on each changed or created module. 
	
	Note that multichanges will be send as null.
	
	Among these informations are three non-self-explanatory (all boolean types):
	create: denotes whether it is a newly created reservation.
	orphan: denotes whether the module has been removed from it original reservation
			and put in its own new.
	delete: denoted whether the module has been deleted.
	
	The array of dictionaries will be incoded into JSON and send to the server via AJAX.
	The response of this AJAX call will be a list of id changes as the server may have 
	assigned new ids to the new modules and reservations.
*/
function saveChanges(){
	// Only save is the system is not saving right now and there actually is something to save.
	if (!saving && changePointer > 0){
		saving = true;
		changeFormat = new Array(changePointer);	// The array of dictionaries
		
		// Iterate all changes
		for(i = 0; i < changePointer; i++){
			// Ignore multichanges
			if (changes[i][0] != "multi"){
				var oldId = changes[i][0];
				var modId = changes[i][1];
				var orphan = false;
				var create = false;
				if (changes[i][0] == "new"){
				 	create = true;
				} else if (moduleReservation(oldId) != moduleReservation(modId)){
					orphan = true;
				}
				deleted = false;
				var dict = 
					{
						id: parseInt(moduleId(modId)),
						reservation_id: parseInt(moduleReservation(modId)),
						room_id: parseInt(moduleRoom(modId)),
						course_id: parseInt(moduleCourse(modId)),
						week: parseInt(moduleWeek(modId)),
						day: parseInt(moduleDay(modId)),
						from: getTimeString(parseInt(moduleFrom(modId))),
						to: getTimeString(parseInt(moduleTo(modId))),
						create: create,
						orphan: orphan,
						delete: deleted
					};
				changeFormat[i] = dict;
			} else {
				changeFormat[i] = null;
			}
		}
		
		var JSON = jQuery.toJSON(changeFormat);	// Incode array to JSON

		// Send via AJAX
		datastr = JSON;
		
		$.ajax({
			type: "POST",
			url: "/plans/save/3",
			data: "data=" + datastr,
			success: function(response) {	// If success
				// Reset the change stack
				changes = new Array(maxChanges);
				changePointer = 0;
				multiCounter = 0;
				updateChangeText();
				
				var idChanges = jQuery.parseJSON(response);		// Retrieve and decode JSON response
				
				for(var c = 0; c < idChanges.length; c++){
					var oldId = parseInt(idChanges[c].modules_id_before);	// The id of the module before
					var newId = parseInt(idChanges[c].modules_id_after);	// The id of the module after

					var oldResId = parseInt(idChanges[c].reservation_id_before);	// The id of the modules reservation before
					var newResId = parseInt(idChanges[c].reservation_id_after);		// The id of the modules reservation after
					
					var oldModId = getModuleWithId(oldId);

					if (oldModId != null){
						// Remove the old module from the UI
						$("#"+oldModId).remove();
						removeModule(oldModId);

						// Generate new module id
						var newModId = 	"i" + newId + 
										"_m" + newResId +
										"_r" + moduleRoom(oldModId) + 
										"_w" + moduleWeek(oldModId) + 
										"_d" + moduleDay(oldModId) +
										"_co" + moduleCourse(oldModId) +
										"_" + moduleCourseCode(oldModId) +
										"_p" + modulePeopleString(oldModId) +
										"_tf" + getTimeInt(moduleFrom(oldModId)) +
										"_tt" + getTimeInt(moduleTo(oldModId));

						// Save and draw the new module 
						insertModule(newModId);
						drawModule(newModId);
					}
				}
				saving = false;
			}
		});
	}
}