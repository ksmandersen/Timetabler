<?php 

/**
* PlansController
* =================
*
* This controller is responsible for the Plan entity.
*
*/

class PlansController extends Controller
{
	public function index()
	{
		$plans = $this->db->select("Plans");
		echo $this->t->render("Plans/index.html", array("plans" => $plans));
	}
	
	/* View a single plan */
	public function view($id = null)
	{
		// Load all the necessary HTML
		if (!$this->request['isAjax'])
		{
			$this->scripts[] = "jquery.fixedtableheader.min.js";
			$this->scripts[] = "planController.js";
			$this->scripts[] = "moduleController.js";
			$this->scripts[] = "changeController.js";
			$this->scripts[] = "courseController.js";
			$this->scripts[] = "dialogController.js";
			$this->scripts[] = "dragAndDrop.js";
			echo $this->t->render("Plans/view.html");
		}
		else
		{
			// Request is ajax so return all Reservations for the plan
			
			$id = intval($id);
			$plan = $this->db->selectSingle("Plans", "id = '$id'");
				
				
				$sql = "SELECT Reservations.*, Courses.code AS course_code, Courses.name AS course_name FROM Reservations JOIN Courses ON Courses.id = Reservations.course_id WHERE Reservations.plan_id = 3";
				//$sql = "SELECT * FROM Reservations WHERE plan_id = 3";
				$plan['reservations'] = $this->db->run($sql);
				
				// Find all modules for each reservation
				foreach ($plan['reservations'] as $key => $res)
				{
					$plan['reservations'][$key]['modules'] = $this->db->select("Modules", "reservation_id = '".$res['id']."'");
					$p_sql = "SELECT Participants.id AS participant_id, People.* FROM Participants JOIN People ON People.id = Participants.person_id WHERE Participants.course_id = '".$res['course_id']."'";
					$plan['reservations'][$key]['people'] = $this->db->run($p_sql);
				}
					
				echo json_encode($plan);	
		}
	}
	
	/* Save the plan. This action is only called by AJAX from the plan view */
	public function save($id = 0)
	{
		$id = intval($id);

		// Get the POST ajax data and replace escape characters
		$data = json_decode(str_replace('\"', '"', $this->request['data']['data']));
		
		try
		{
			
			if(!$data || empty($data))
				throw new Exception("No data");
				
			if(!$id || $id == 0)
				throw new Exception("No id for plan");
				
			// All changed modules
			$changes = array();
			
			// All new modules
			$inserted = array();
			
			// Loop through the stack of changes to modules
			foreach($data as $b)
			{
				if($b == null) // Skip
					continue;
					
				// Reservation id might be negative if the reservation is new.
				$rid = abs($b->reservation_id);
				
				// Add reservation to changed array
				if(!array_key_exists($rid, $changes))
				{
					$changes[$rid] = array();
				}
				
				// Module id might be negative if a new reservation
				$mid = abs($b->id);
				
				// Add changed module to changed reservation
				if(!array_key_exists($mid, $changes[$rid]))
				{
					$changes[$rid][$mid] = $b;
				}
				else
				{
					// if the module has already been added this is another
					// change to the module that came after the original so
					// update the change to contain the new changes.
					
					$o = $changes[$rid][$mid];
					$o->from = $b->from;
					$o->to = $b->to;
					$o->week = $b->week;
					$o->day = $b->day;
					$o->room_id = $b->room_id;
					
					// The module was deleted after being created so remove it from the changed modules
					if($b->create && ($b->delete || $o->delete))
						$o = null;
					
					// The module was orphaned from its reservation
					else if(!$b->create && $o->orphan)
					{
						$o->orphan = true;
						$o->reservation_id = $b->reservation_id;
					}
					// The module was deleted som mark it for lated deletion
					else if($o->delete)
					{
						$o->delete = true;
						$o->orphan = false;
						$o->create = false;
					}
						
					
					$changes[$rid][$mid] = $o;
				}
			}
			
			
			//print_r($changes);
			$this->db->beginTransaction();
			
			// Move through each change and update the databse
			foreach($changes as $rkey => $res)
			{
				if($res == null || empty($res))
					continue;
					
				$first = reset($res);
				if($first == null || empty($first))
					continue;
					
				// This is a new module so we should create a new
				// reservation for that module.
				if($first->create || $first->orphan)
				{
					$sql = "INSERT INTO Reservations (reservation_type_id, plan_id, course_id) VALUES (:type, :pid, :cid);";
					$statement = $this->db->prepare($sql);
					$statement->bindValue(":type", 1);
					$statement->bindValue(":pid", $id);
					$statement->bindValue(":cid", $first->course_id);
					
					if (!$statement->execute())
						throw new Exception("Failed to insert a new reservation");
						
					$resid = $this->db->lastInsertId();
					if(!$resid or $resid == 0)
						throw new Exception("Returned 0 for inserted reservation");
				} else
				{
					$resid = $first->reservation_id;
					
					if(!$resid || $resid < 1)
						throw new Exception("Got negative or 0 reservation id. something is wrong");
				}
				
				foreach($changes[$rkey] as $mkey => $m)
				{
					// This is a new module. Insert it!
					if($m->create)
					{
						$sql = "INSERT INTO Modules (room_id, reservation_id, begin_time, end_time, week, weekday) VALUES (:roomid, :resid, :btime, :etime, :week, :day);";
						$statement = $this->db->prepare($sql);
						$statement->bindValue(":roomid", $m->room_id);
						$statement->bindValue(":resid", $resid);
						$statement->bindValue(":btime", $m->from);
						$statement->bindValue(":etime", $m->to);
						$statement->bindValue(":week", $m->week);
						$statement->bindValue(":day", $m->day);
						
						if (!$statement->execute())
							throw new Exception("Failed to insert new module");
							
						$mid = $this->db->lastInsertId();
						if(!$mid || $mid == 0)
							throw new Exception("Returned 0 for inserted module");
							
						// Keep track of the ids of inserted modules and reservations
						// so it can be send back to client.
						$inserted[] = array(
							"reservation_id_after" => $resid,
							"reservation_id_before" => $m->reservation_id,
							"modules_id_before" => $m->id,
							"modules_id_after" => $mid
						);
						$changes[$rkey][$mkey]->id = $mid;
						$changes[$rkey][$mkey]->reservation_id = $resid;
					} else
					{
						$mid = $mkey;
						if(!$mid || $mid < 1)
						{
							//print_r($m);
							throw new Exception("Got negative module id. something is wrong");
						}
							
					}
					
					// Module is marked for deletion. Delete it!
					if($m->delete)
					{
						$sql = "DELETE FROM Modules WHERE id = :id;";
						$statement = $this->db->prepare($sql);
						$statement->bindValue(":id", $mid);
						
						if (!$statement->execute())
							throw new Exception("Failed to delete module");	
					} else
					{
						// Module should be updated
						
						$sql = "UPDATE Modules SET reservation_id = :resid, room_id = :rid, begin_time = :from, end_time = :to, week = :week, weekday = :day WHERE id = :mid ;";
						$statement = $this->db->prepare($sql);
						$statement->bindValue(":resid", $resid);
						$statement->bindValue(":from", $m->from);
						$statement->bindValue(":to", $m->to);
						$statement->bindValue(":week", $m->week);
						$statement->bindValue(":day", $m->day);
						$statement->bindValue(":mid", $mid);
						$statement->bindValue(":rid", $m->room_id);
						
						if (!$statement->execute())
							throw new Exception("Failed to insert new module");
					}
						
					
					
				}
			}
			
			if(!$this->db->commit())
				throw new Exception("failed to commit");
				
			echo json_encode($inserted);
		}
		catch (Exception $e)
		{
			if($this->db->inTransaction())
				$this->db->rollBack();
			die($e);
		}
		
	}
}

?>