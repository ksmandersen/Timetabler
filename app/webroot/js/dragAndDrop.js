/* 	
	----------------------------------------------------------------------
	The functions in this file sets up the drag and drop functionalities.
 	----------------------------------------------------------------------
*/


var droppableElement;		// The droppable cell of a draggable. 
							// Is used if the draggable is dropped in an illegal area.
var dragging = false;		// Is used to check whether the user is dragging or not.

/*
	----------------------------------------------------------------------
	This functions in this file sets up the drag and drop functionalities 
	and mouse events on every relevant DOM object.
	----------------------------------------------------------------------
*/
function setupDragAndDrop(){
	
	setupMouseEvents();
	
	setupDroppables();
	
	setupDraggables();
	
	setupResizables();
}

/*
	Sets up the mouse events. 
	This is especially used to add the droppable class to cells which the cursor 
	hovers over while dragging.
*/
function setupMouseEvents(){

	$(".reservation").mouseenter(function() {
		if (dragging){
			underneathDroppables($(this).attr('id'));
			setupDroppables();
		}
	});

	$("div.slotDiv").mouseenter(function() {
		if (dragging){
			$(this).addClass("droppable");
			setupDroppables();
		}
	}).mouseleave(function() {
		if (dragging){
			$(this).removeClass("ui-droppable droppable");
		}
	}).click(function() {
		$(this).addClass("droppable");
		setupDroppables();
		droppableClick = $(this).attr('id');
		showCreateDialog();
	});
}

/*
	Setsup the DOM objects with the class droppable.
*/
function setupDroppables(){
	$(".droppable").droppable(
		{
			//hoverClass: 'slotDiv_hover',
			tolerance: "pointer",
			drop: function(event, ui) {
				
				if (!$(this).html()){
					
					// Extract data from id
					var oldId = $(ui.draggable).attr('id');
					var from = moduleFrom(oldId);
					var to = moduleTo(oldId);
					var hours = to - from;
					var fromCell = findFittingCell(oldId);
					var modId = moduleReservation(oldId);

					// Change on several modules?
					if (parseInt(getModulesLength(modId)) > 1){

						// Add the dragged reservation while dialog is shown
						$(ui.draggable).css( { position: "relative", top: "0px", left: "0px"} );

						// Insert draggable while dialog i shown
						$(this).append($(ui.draggable));

						// Set elements in focus for the dialog
						changedModule = $(ui.draggable).attr('id');
						droppableFrom = fromCell;
						droppableTo = $(this).attr('id');
						resized = false;

						// Show dialog
						showChangeDialog();

					} else {

						// Add draggable to droppable
						$(ui.draggable).remove();

						// Update id
						var newFrom = $(this).attr('id').split("_t")[1];
						var newTo = (parseInt(newFrom) + parseInt(hours));
						var newId = getAdjustedId(oldId, $(this).attr('id'));
						$(ui.draggable).attr('id', newId);
						updateModuleId(oldId, newId);

						// Draw module
						drawModule(newId);

						addChange([oldId, newId]);
					}
				}
			}
		}
	);
}

/*
	Sets up the DOM objects with the class draggable.
*/
function setupDraggables(){
	var z = 1;
	$(".reservation").draggable({ opacity: 0.5, distance: 2, cursor: 'move', cursorAt: {top: -2} },
		{
			start: function(event, ui) {  
				dragging = true;
				droppableElement = $(this).parent().attr('id');
				
				$(this).css("z-index", z++);
				
				// Set to real size
				var id = $(this).attr('id');
				var from = moduleFrom(id);
				var to = moduleTo(id);
				var hours = to - from;
				setHeight(id, hours);
				
				// Reset border
				removeCutClasses($(this).attr('id'));
			},

			stop: function(event, ui) {  
				dragging = false;
				$(this).css( { 	position: "relative", top: "0px", left: "0px"} );
			}
		}
	);
	
	// Should disable selection of reservations, but seems not to work
	$(function(){
		$.extend($.fn.disableTextSelect = function() {});
		$(".reservation").disableTextSelect();
	});
}

/*
	Sets up the DOM objects with the resizable class.
*/
function setupResizables(){
	$(".reservation").resizable({ autoHide: true, grid: [modHeight + borderHeight, modHeight + borderHeight], handles: 's', maxHeight: 400},
		{
			start: function(event, ui) {
				$(this).removeClass(cutBottomClass);
			},
			
			stop: function(event, ui) {  
				
				// Fix position
				$(this).css( { 	position: "relative", top: "0px", left: "0px"} );
				
				// Get id and modId
				var oldId = $(this).attr('id');
				var modId = moduleReservation(oldId);
				
				// Module change
				if (parseInt(getModulesLength(modId)) > 1){
					
					// From cell
					var cell = findFittingCell(oldId);
					
					// Update id
					var newHeight = $(this).css("height");
					var hoursInView = (parseInt(newHeight) + borderHeight) / (modHeight + borderHeight);
					var from = parseInt(moduleFrom(oldId));
					var hoursBeforeView = Math.max((times[0] - from), 0);
					var newTo = Math.min((from + hoursInView + hoursBeforeView), 24);
					var newId = getAdjustedModuleTo(oldId, newTo);

					// Set elements in focus
					changedModule = oldId;
					changedModuleNewTo = newTo;
					resized = true;
					droppableFrom = cell;
					droppableTo = cell;
					
					// Show dialog
					showChangeDialog();
					
				} else {
					// Generate new id
					var newHeight = $(this).css("height");
					var hoursInView = (parseInt(newHeight) + borderHeight) / (modHeight + borderHeight);
					var from = moduleFrom(oldId);
					var hoursBeforeView = Math.max((times[0] - from), 0);
					var newTo = Math.min((parseInt(from) + hoursInView + hoursBeforeView), 24);
					var newId = getAdjustedModuleTo(oldId, newTo);
					
					updateModuleId(oldId, newId);
					
					$(this).remove();
					
					// Draw
					drawModule(newId);
					
					addChange([oldId, newId]);
				}
			}
		}
	);
}