/* 	
	----------------------------------------------------------------------
	The functions in this file loads and stores the modules and 
	reservations and is responible for the retrievel of these data.
	
	The reservations and modules are stored in the array called 
	resTable which is an array of reservation arrays.
	
	Each reservation array stores its id at index 0, its number of modules
	at index 1 and the modules from index 2. 
	
	New modules and reservations are given negative ids.
 	----------------------------------------------------------------------
*/

var maxReservations = 1000;		// The maximum number of reservations
var maxModules = 100;			// The maximum number of modules in a reservations
var resTable = [];				// The table that stores the reservations and modules
var newReservationId = 0;		// The value given to the next new reservations
var newModuleId = 0;			// The value given to the next new module

/*
	Initializes the resTable.
*/
function initReservationTable(){
	for (i = 0; i < maxReservations; i++){
		resTable[i] = [];
		resTable[i][0] = 0;
		resTable[i][1] = 0;
	}
}

/*
	Loads the reservations and modules of a plan and stores it in resTable.
	The function calls the server via AJAX and receives a JSON object. 
*/
function loadReservations(){
	$.get('/plans/view/3/', function(data){
		
		// Decode the JSON object
		var plan = jQuery.parseJSON(data);
		
		// The array of reservations
		reservations = plan.reservations;

		for(var r = 0; r < reservations.length; r++){
			
			// Array of module in the reservations
			var modules = reservations[r].modules;

			for(var m = 0; m < modules.length; m++){
				// Insert reservation
				var resId = modules[m].reservation_id;
				if (m == 0){
					insertReservation(resId);
				}
			
				// Generate id
				var modId = "i" + modules[m].id + 
							"_m" + modules[m].reservation_id +
							"_r" + modules[m].room_id + 
							"_w" + modules[m].week + 
							"_d" + modules[m].weekday +
							"_co" + reservations[r].course_id +
							"_" + reservations[r].course_code +
							"_p" + peopleFromArray(reservations[r].people) + 
							"_tf" + getTimeInt(modules[m].begin_time) +
							"_tt" + getTimeInt(modules[m].end_time);
			
				// Add to resTable
				insertModule(modId);

				// Draw module
				drawModuleNoSetup(modId);
			}
		}
		
		// Setup Drag and drop
		setupDragAndDrop();
		
		checkForConflicts();
	});
}

/*
	Returns the string of people used in the modules id attribute.
*/
function peopleFromArray(arr){
	s = "";
	for(var i = 0; i < arr.length; i++){
		s += arr[i].id;
		if (i != arr.length - 1){
			s += "-";
		}
	}
	return s;
}

/*
	Draw all modules in a reservation.
*/
function drawReservations(){
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] != 0){
			// Search for reservation
			for (m = 2; m < maxModules-1; m++){
				if (resTable[r][m] != ""){
					drawModuleNoSetup(resTable[r][m]);
				} else {
					break;
				}
			}
		} else {
			break;
		}
	}
	setupDragAndDrop();
}

/*
	Inserts a new reservation with the specified id.
*/
function insertReservation(resId){
	if (!reservationExists(resId)){
		// Search for space
		for (i = 0; i < maxReservations; i++){
			if (resTable[i][0] == 0){
				resTable[i][0] = resId;
				for (r = 2; r < maxModules; r++){
					resTable[i][r] = "";
				}
				break;
			}
		}
	}
}

/*
	Returns true if the reservation with the specified id exists.
*/
function reservationExists(resId){
	for (i = 0; i < maxReservations; i++){
		if (resTable[i][0] == resId){
			return true;
		}
	}
	return false;
}

/*
	Inserts a new module into the resTable with the specified id.
*/
function insertModule(modId){

	// Get modules from ids
	var resId = parseInt(moduleReservation(modId));
	
	// Search for module
	var resFound = false;
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == resId){
			resFound = true;
			var size = resTable[r][1];
			resTable[r][size+2] = modId;
			resTable[r][1]++;
			break;
		}
	}
	
	// If reservation was not found create it and try again
	if (!resFound){
		insertReservation(resId);
		
		insertModule(modId);
	}
}

/*
	Updates the id of a module.
*/
function updateModuleId(oldModId, newModId){
	// Get reservations from ids
	var oldResId = parseInt(moduleReservation(oldModId));
	var newResId = parseInt(moduleReservation(newModId));
	
	// Is reservation the same?
	if (oldResId == newResId){
		
		// Search for reservation
		for (r = 0; r < maxReservations; r++){
			if (resTable[r][0] == newResId){

				// Search for module
				for (m = 2; m < maxModules; m++){
					if (resTable[r][m] == oldModId){
						resTable[r][m] = newModId;
						break;
					}
				}
				break;
			}
		}
		
	} else {
		// Remove old module
		removeModule(oldModId);
		
		// Insert new module
		insertModule(newModId);
	}
}

/*
	Removes a specified module from the resTable.
*/
function removeModule(modId){

	// Get reservation from id
	var resId = parseInt(moduleReservation(modId));
	
	// Search for reservation
	var modRemoved = false;
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == resId){
			// Search for reservation
			for (m = 2; m < maxModules-1; m++){
				if (resTable[r][m] == modId){
					modRemoved = true;
					resTable[r][1]--;
				} 
				if (modRemoved){
					resTable[r][m] = resTable[r][m+1];
				}
				if (resTable[r][m] == ""){
					break;
				}
			}
			break;
		}
	}
}

/*
	Adds a module to the plan. 
	This function needs to call the server via AJAX as it does not know the 
	persons of the course.
*/
function addModule(typeId, courseId, courseName, cellId, from, to){
	
	// Load people from course
	$.get('/people/course/' + courseId + '/', function(data){

		var people = jQuery.parseJSON(data);
		
		// Generate id
		var modId = "i" + getNewModuleId() + 
					"_m" + getNewReservationId() +
					"_r" + cellRoom(cellId) + 
					"_w" + cellWeek(cellId) + 
					"_d" + cellDay(cellId) +
					"_co" + courseId +
					"_" + courseName +
					"_p" + peopleFromArray(people) +
					"_tf" + from +
					"_tt" + to;

		// Save module in reservationTable
		insertModule(modId);

		// Draw
		drawModule(modId);

		// Save Change
		addChange(["new", modId]);
	});
}

/*
	Adds multiple modules to a plan with the same course.
*/
function addMulipleModules(typeId, courseId, courseName, cellId, recType, recNumber){
	
	// Load people from course
	$.get('/people/course/' + courseId + '/', function(data){
		
		var people = jQuery.parseJSON(data);
		var firstWeek = parseInt(cellWeek(cellId));
		var firstDay = parseInt(cellDay(cellId));
		var from = parseInt(cellTime(cellId));
		var to = parseInt(from + 1);
		var roomId = parseInt(cellRoom(cellId));
		var resId = getNewReservationId();

		for(x = 0; x < recNumber; x++){
			// Get individual day and week
			var week = firstWeek;
			var day = firstDay;
			if (recType == "w"){
				week = firstWeek + x;
			} else {
				day = firstDay + x;
				extraWeeks = parseInt((day-1)/7);
				week += extraWeeks;
				day = (day-1)%7 + 1;
			}

			// Generate reservation id
			var modId = "i" + getNewModuleId() + 
						"_m" + resId +
						"_r" + roomId + 
						"_w" + week + 
						"_d" + day +
						"_co" + courseId +
						"_" + courseName +
						"_p" + peopleFromArray(people) +
						"_tf" + from +
						"_tt" + to;

			insertModule(modId);

			// Draw module
			drawModuleNoSetup(modId);

			// Save Change
			addChange(["new", modId]);
		}

		// Add multi-change on top of change stack
		addChange(["multi", recNumber]);
		
		setupDragAndDrop();
	});
}

/*
	Checks if a module is an orphan.
	An orphan is the only module in a reservation.
*/
function isOrphan(modId){

	var resId = moduleReservation(modId);
	
	// Search for reservation
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == resId){
			// Search for module
			for (m = 2; m < maxModules-1; m++){
				if (resTable[r][m] == modId){
					if (resTable[r][1] < 2){
						return true;
					} else {
						return false;
					}
				} 
			}
		}
	}
}

/*
	returns an array of modules of the specified reservation.
*/
function getModules(resId){
	// Search for module
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == resId){
			return resTable[r];
		}
	}
}

/*
	Returns the module id attribute with the specified id.
*/
function getModuleWithId(id){
	
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == ""){
			return null;
		}
		// Search for module
		for (m = 2; m < maxModules-1; m++){
			if (resTable[r][m] == ""){
				break;
			} else if (moduleId(resTable[r][m]) == id){
				return resTable[r][m]; 
			}
		}
		
	}
	return null;
}

/*
	Returns the number of modules in a reservation.
*/
function getModulesLength(resId){
	// Search for module
	for (r = 0; r < maxReservations; r++){
		if (resTable[r][0] == resId){
			return resTable[r][1];
		}
	}
}

/*
	Returns a unique negative reservation id.
*/
function getNewReservationId(){
	newReservationId--;
	return newReservationId;
}

/*
	Returns a unique negative module id.
*/
function getNewModuleId(){
	newModuleId--;
	return newModuleId;
}

/*
	Changes the reservation id of a module id attribute and returns the new module id attribute.
*/
function changeReservationId(modId, resId){
	var before = modId.split("_m")[0];
	var after = "_r" + modId.split("_r")[1];
	return before + "_m" + resId + after;
}

/*
	Changes the to time of a module id attribute and returns the new module id attribute.
*/
function moduleNewToTime(oldId, toTime){
	return oldId.split("_tt")[0] + "_tt" + toTime;
}

/*
	Changes the id of a module id attribute and returns the new module id attribute.
*/
function getAdjustedModId(oldId, newModId){
	return "i" + newModId + "_" + id.split("_")[1];
}

/*
	Changes the to time of a module id attribute and returns the new module id attribute.
*/
function getAdjustedModuleTo(oldId, to){
	return oldId.split("_tt")[0] + "_tt" + to;
}

/*
	----------------------------------------------------------------------
	The following functions returns a value of a specified id
	attribute of a module.
	----------------------------------------------------------------------
*/

function moduleId(modId){
	return modId.split("i")[1].split("_")[0];
}

function moduleReservation(modId){
	return modId.split("_m")[1].split("_")[0];
}

function moduleRoom(modId){
	return modId.split("_r")[1].split("_")[0];
}

function moduleCourse(modId){
	return modId.split("_co")[1].split("_")[0];
}

function moduleCourseCode(modId){
	return modId.split("_co")[1].split("_")[1].split("_")[0];
}

function modulePeopleArray(modId){
	var str = modId.split("_p")[1].split("_")[0];
	str = str.split("-");
	return str;
}

function modulePeopleString(modId){
	var str = modId.split("_p")[1].split("_")[0];
	return str;
}

function moduleWeek(modId){
	return modId.split("_w")[1].split("_")[0];
}

function moduleDay(modId){
	return modId.split("_d")[1].split("_")[0];
}

function moduleFrom(modId){
	return modId.split("_tf")[1].split("_")[0];
}

function moduleTo(modId){
	return modId.split("_tt")[1].split("_")[0];
}