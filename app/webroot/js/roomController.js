var maxRooms = 1000;
var roomTable = new Array(maxRooms);

function initRoomTable(){
	for (i = 0; i < maxRooms; i++){
		classRooms[i] = new Array(3);
		classRooms[i][0] = 0;
		classRooms[i][1] = "";
		classRooms[i][2] = "";
	}
}

function getRoomName(id){
	return "Aud1";
	/*
	for (i = 0; i < maxRooms; i++){
		if (roomTable[i][0] == id){
			return roomTable[i][1];
		}
	}*/
}

function addRoom(id, name, type){
	if (!roomExists(id)){
		for (i = 0; i < maxRooms; i++){
			if (roomTable[i][0] == 0){
				roomTable[i][0] = id;
				roomTable[i][1] = name;
				roomTable[i][2] = type;
				break;
			}
		}
	}
}

function roomExists(id){
	for (i = 0; i < maxRooms; i++){
		if (roomTable[i][0] == id){
			return true;
		} else if (roomTable[i][0] == 0) {
			return false;
		}
	}
	return false;
}

function removeRoom(id){
	for (i = 0; i < maxRooms-1; i++){
		var roomFound = false;
		if (!roomFound && classTable[i][0] == id){
			roomFound = true;
		}
		if (roomFound && roomTable[i][0] == 0){
			break;
		}
		if (roomFound){
			rooomTable[i][0] = classTable[i+1][0];
			roomTable[i][1] = classTable[i+1][1];
			roomTable[i][2] = classTable[i+1][2];
		}
	}
}