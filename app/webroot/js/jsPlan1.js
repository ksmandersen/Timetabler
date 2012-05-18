$(document).ready(function() {
	// Draw the plane
	drawPlan('planHolder');
	
	$(".plan").fixedtableheader({headerrowsize: 2 });
	
});

function drawPlan(id){
	// Get view configurations
	var weekFrom = 3;
	var weekTo = 9;
	var days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
	var times = [8,9,10,11,12,13,14,15,16];
	
	// Begin table
	var html = '<table class="plan">';
	
	// Add table header
	html += tableHeader(weekFrom, weekTo, days, times);
	
	// Add table body
	html += tableBody(weekFrom, weekTo, days, times);
	
	// Write html to element
	$("#" + id + "").append(html);
}

function tableHeader(weekFrom, weekTo, days, times){
	// Start row and add top-left corner
	var html = '<tr><th class="corner" colspan="2">';
	
	// Write week columns
	for(var w = weekFrom; w <= weekTo; w++) {
		html += '<th class="week" colspan="' + days.length + '">Week ' + w + '</th>'; 
	}
	
	// End row, begin new
	html += '</tr><tr><th colspan="2"></th>';
	
	// Write day columns
	for(var w = weekFrom; w <= weekTo; w++) {
		for(var d = 0; d < days.length; d++) {
			html += '<th class="day">' + days[d] + '</th>';
		}
	}
	
	// End row
	html += '</tr>'
	
	return html;
}

function tableBody(weekFrom, weekTo, days, times){
	// Get rooms
	var rooms = ['3A12', '3A14', '3A16', '4A12', '4A14', '4A16'];
	
	var html = '';
	
	// For each room
	for(var r = 0; r < rooms.length; r++) {
		
		var first = true;
		// For each time
		for(t = 0; t < times.length; t++) { 

			html += '<tr>';
			// If first row - draw room cell
			if (first) {
		 		html += '<th class="room" rowspan="' + times.length + '">' + rooms[r] + '</th>';
				first = false;
			}
			
			// Draw time cell
			html += '<th class="time">' + getTimeString(times[t]) + '</th>';
			
			// Draw cells
			for(var w = weekFrom; w <= weekTo; w++) { 
				for(d = 1; d <= days.length; d++) { 
					// Get correct cell class
					html += cell(d, t, days, times);
				}
			}
			html += '</tr>';
		}
	}
	return html;
}

function cell(d, t, days, times){
	var html = '';
	if(d == days.length && t == times.length-1){
		html += '<td class="slotLastDayAndTime"><div class="slot">';
	} else if(t == times.length-1){
		html += '<td class="slotLastTime"><div class="slot">';
	} else if(d == days.length){
		html += '<td class="slotLastDay"><div class="slot">';
	} else {
		html += '<td class="slot"><div class="slot">';
	}
	html += '</div></td>';
	
	return html;
}

function getTimeString(time){
	if(time < 10){
		return '0' + time + ':00';
	}
	return time + ':00';
}