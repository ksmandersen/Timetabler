<?php

/**
* RoomsController
* =================
*
* This controller is responsible for the Room entity.
*
*/

class RoomsController extends Controller
{
	public function index()
	{
		$rooms = $this->db->select("Rooms", "", "code ASC");
		
		if($this->request['isAjax'])
		{
			echo json_encode($rooms);
		} else
		{
			$this->scripts[] = "paginate.js";
			$this->scripts[] = "ajaxify.js";
			echo $this->t->render("Rooms/index.html", array("rooms" => $rooms));	
		}
	}
	
	public function add()
	{
		if ($this->request['isPost'])
		{
			try
			{
				$this->db->beginTransaction();
				$update = $this->db->insert("Rooms", array(
					'code' => $this->request['data']['room_code'],
					'room_type_id' => $this->request['data']['room_type'],
				));
				
				if (!$update)
					throw new Exception("Could not add new room");
				
				if(!$this->db->commit())
					throw new Exception("Could not commit to add new room");
				
				header("Location:/rooms/");
			} catch(Exception $e)
			{
				$this->db->rollBack();
				die($e);
			}
		}
		
		$this->scripts[] = "jquery.fcbkcomplete.min.js";
		$this->scripts[] = "ajaxify.js";
		echo $this->t->render("Rooms/add.html");
	}
	
	public function edit($id = 0)
	{
		$id = intval($id);
		if ($this->request['isPost'])
		{
			try
			{
				$this->db->beginTransaction();
				
				
				$sql = "UPDATE Rooms SET code = :code, room_type_id = :room_type WHERE id = :id";
				$statement = $this->db->prepare($sql);
				$statement->bindValue(':code', $this->request['data']['room_code']);
				$statement->bindValue(':room_type', $this->request['data']['room_type']);
				$statement->bindValue(':id', $id);
				$res = $statement->execute();
				$statement = null;
				
				if(!$res)
				throw new Exception();
				
				$this->db->commit();
				
				header("Location:/rooms/");
				exit();
			} catch(Exception $e)
			{
				$this->db->rollBack();
				die($e);
			}
		}
		
		$room = $this->db->selectSingle("Rooms", "id = '".$id."'");
		
		$this->scripts[] = "jquery.fcbkcomplete.min.js";
		$this->scripts[] = "ajaxify.js";
		echo $this->t->render("Rooms/edit.html", array("room" => $room));
	}

	public function delete($id = 0)
	{
		if ($this->request['isGet'])
			throw new MethodNotAllowedException();
			
		$id = intval($id);
		$sql = "DELETE FROM Rooms WHERE id = :id";
		$statement = $this->db->prepare($sql);
		$statement->bindValue(":id", $id);
		$statement->execute();
		
		if(!$this->request['isAjax'])
			header("Location:/rooms/");
		else
			echo "success";
	}
}

?>