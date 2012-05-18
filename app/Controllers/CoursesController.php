<?php

/**
 * CoursesController
 * =================
 *
 * This controller is responsible for the Course entity.
 *
 */

class CoursesController extends Controller
{
	/* List all courses with their participants in the index view or return as JSON. */
	public function index()
	{
		$courses = $this->db->select("Courses", "", "code, name ASC");
		foreach ($courses as $key => $course)
		{
			$courses[$key]['participants'] = $this->db->select("Participants", "course_id = '".$course['id']."'");
			foreach($courses[$key]['participants'] as $k => $participant)
			{
				$r = $this->db->select("People", "id = '".$participant['person_id']."'");
				$courses[$key]['participants'][$k]['person'] = $r[0];
			}
		}
		
		if($this->request['isAjax'])
		{
			echo json_encode($courses);
		} else
		{
			$this->scripts[] = "paginate.js";
			$this->scripts[] = "ajaxify.js";
			echo $this->t->render("Courses/index.html", array("courses" => $courses));	
		}
	}
	
	/* Display the add course view or insert new course from POST data */
	public function add()
	{
		if ($this->request['isPost'])
		{
			try
			{
				$this->db->beginTransaction();
				$update = $this->db->insert("Courses", array(
					'name' => $this->request['data']['course_name'],
					'code' => filter_var($_POST['course_code']),
				));
				
				if (!$update)
					throw new Exception();
				
				$this->db->commit();
				
				header("Location:/courses/");
			} catch(Exception $e)
			{
				$this->db->rollBack();
				die($e);
			}
		}
		
		$this->scripts[] = "jquery.fcbkcomplete.min.js";
		$this->scripts[] = "ajaxify.js";
		echo $this->t->render("Courses/add.html");
	}
	
	/* Display the edit course view with data or update the course from POST data */
	public function edit($id = 0)
	{
		$id = intval($id);
		if ($this->request['isPost'])
		{
			try
			{
				$this->db->beginTransaction();
				
				// Update the course in the database based on the POST data
				$sql = "UPDATE Courses SET name = :name, code = :code WHERE id = :id";
				$statement = $this->db->prepare($sql);
				$statement->bindValue(':name', $this->request['data']['course_name']);
				$statement->bindValue(':code', $this->request['data']['course_code']);
				$statement->bindValue(':id', $id);
				$res = $statement->execute();
				$statement = null;

				if(!$res)
					throw new Exception();
					
				// Get all participants on course
				$participants = $this->db->select("Participants", "course_id = '$id'");
				
				// All the participants in propper format
				$dbp = array();
				foreach($participants  as $participant)
				{
					$dbp[$participant['person_id']] = $participant['person_id'];
				}
				
				// All participants in request data
				$vdp = array();
				if(isset($this->request['data']['course_participants']))
				{
					foreach($this->request['data']['course_participants'] as $person)
					{
						$vdp[$person] = $person;
					}
				}
				
				// Find all participants that should be added
				$add = array_diff($vdp, $dbp);
				
				// Find all participants that should be added
				$remove = array_diff($dbp, $vdp);
				
				
				// Insert new particpants
				$sql = "INSERT INTO `Participants` (course_id, person_id, participant_role_id) VALUES (:cid, :pid, :rid)";
				$statement = $this->db->prepare($sql);
				foreach($add as $person)
				{	
						$statement->bindValue(":cid", $id);
						$statement->bindValue(":pid", $person);
						$statement->bindValue(":rid", 1);
						if (!$statement->execute())
							throw new Exception();
				}
				$statement = null;
				
				// Delete removed participants
				$sql = "DELETE FROM Participants WHERE person_id = :pid AND course_id = :cid";
				$statement = $this->db->prepare($sql);
				foreach($remove as $person)
				{
					$statement->bindValue(":cid", $id);
					$statement->bindValue(":pid", $person);
					if (!$statement->execute())
						throw new Exception();
				}
				
				$this->db->commit();
				
				header("Location:/courses/");
				exit();
			} catch(Exception $e)
			{
				$this->db->rollBack();
				die($e);
			}
		}

		$course = $this->db->selectSingle("Courses", "id = '".$id."'");
		
		$this->scripts[] = "jquery.fcbkcomplete.min.js";
		$this->scripts[] = "ajaxify.js";
		echo $this->t->render("Courses/edit.html", array("course" => $course));
	}
	
	/* Delete the course */
	public function delete($id = 0)
	{
		if ($this->request['isGet'])
			throw new MethodNotAllowedException();
			
		$id = intval($id);
		$sql = "DELETE FROM Courses WHERE id = :id";
		$statement = $this->db->prepare($sql);
		$statement->bindValue(":id", $id);
		$statement->execute();
		
		if(!$this->request['isAjax'])
			header("Location:/courses/");
		else
			echo "success";
	}
}

?>