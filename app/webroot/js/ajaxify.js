$(document).ready(function (){
	if($('#course_participants').attr('name') != undefined) {
		$('#course_participants').fcbkcomplete({
			json_url: "/people/",
			cache: true,
			firstselected: true,
		});	
		
		var course_id = $('#course_id').val();
		
		$.get('/people/course/' + course_id, function(data) {
			var people = jQuery.parseJSON(data);
			jQuery.each(people, function(index, value) {
				$('#course_participants').trigger('addItem', [{"value": value.id,"title": value.name}]);
			});
		});
	}
	
	/*$.get('/people', function(data){
		alert(data);
	});
	
	/* 
	 * AJAX POST delete functionality
	 * ==============================
	 * This function automagically sends a POST AJAX request
	 * to the appropriate CakePHP controller based on a hidden
	 * input field (#entity) which contains the name of the 
	 * route for the displayed entiy.
	 *
	 */
	$("#entity-list .delete").click(function() {
		if(confirm('Are you sure?'))
		{
			var entity = $("#entity-list input#entity").val();
			var plural = $("#entity-list input#plural").val();
			var tbody = $(this).closest('tbody');
			var rowCount = $(tbody).children().length;
			var row = $(this).closest('tr');
			var id = $(row).attr('id');
			$.post('/' + plural + '/delete/' + id, function(data){
				if(data == 'success') {
					$(row).fadeOut(400, function() {
						$(this).remove();
						
						$('#message-wrapper')
							.append('<div id="goodMessage" class="message" style="display:none;">The ' + entity + ' was succesfully deleted!</div>')
							.fadeIn();
						
						if(rowCount == 1)
						{
							$(tbody)
								.append('<tr><td colspan="2" style="text-align:center;diplay:none;"><em>There are currently no courses.</em></td></tr>')
								.fadeIn();
						}
					});
				}
			});	
		}
	});
});