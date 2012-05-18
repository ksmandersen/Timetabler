<?php

/**
* PeopleController
* =================
*
* This controller is responsible for the Person entity.
*
*/

class PeopleController extends Controller
{
	public function index()
	{
		$people = $this->db->select("People");
		
		// Request is served to the fcbkcomplete plugin and the proper formated
		// JSON response must be:
		// [{key: 1, value: "Firstname Lastname"},...]
		if($this->request['isAjax'])
		{
			$res = array();
				foreach($people as $person)
				{
					$res[] = array("key" => $person['id'], "value" => utf8_encode($person['firstname'] . " " . $person['lastname']));
				}
				
				echo json_encode($res);	
		} else
		{
			$this->scripts[] = "paginate.js";
			$this->scripts[] = "ajaxify.js";
			echo $this->t->render("People/index.html", array("people" => $people));	
		}
	}
	
	/* Get all participants for a given course. Returned in JSON for the plan view */
	public function course($id = 0)
	{
		$id = intval($id);
		$sql = "SELECT 
			People.id,
			People.firstname,
			People.lastname
		FROM 
			Participants
		LEFT JOIN People ON
			People.id = Participants.person_id
		WHERE
			Participants.course_id = '$id'";
	
		$people = $this->db->run($sql);
		$res = array();
		
		foreach($people as $person)
		{
			$res[] = array("id" => $person['id'], "name" => utf8_encode($person['firstname'] . " " . $person['lastname']));
		}
		
		echo json_encode($res);
			
	}
}

?>