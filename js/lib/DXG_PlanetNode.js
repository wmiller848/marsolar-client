/*
 * William Miller 2012
 * Planet Node Class
 */
   	
var maxSplits = 11; // Heightmap built for 11 splits max detail 2^11 - 2048x2048
var updateLimit = 0;
var maxActionsPerFrame = 1000;

// planetID
var frontFace=0,backFace=1,leftFace=2,rightFace=3,
topFace=4,bottomFace=5;

var QuadPlanetNode = function(split ,ancestorNode, childNum, planet) 
{		
	this.spawn = childNum;
	this.split = split;
	this.distance = planet.radius * 100;	
	this.BSradius = 1;	
	this.sphereBBox = vec3.create(planet.center);	
	this.vertData = [];
	this.sphereData = [];
	this.normal = [];
	this.uv = [];
	
	this.parent = null;
	this.ancestor = ancestorNode;
	this.children = new Array(4);
	this.hasChildren = false;
	
	this.inView = false;				
};

QuadPlanetNode.prototype.updateFrame = function(gl, scene, planet, timing) 
{
	if(updateLimit <= maxActionsPerFrame) 
	{
		var location = this.updateLocation(planet);
		this.inView = mat6x4.sphereInFrustum(frustum, location, this.BSradius);
		if(this.inView <= 0) 
		{
				this.distance = this.distance*planet.radius*10;
				this.inView = false;
		}
		else 
		{
			this.distance = this.inView;
			this.inView = true;	
		}
		var slip = this.split * planet.splitFactor;
		var pass = 2;					
		var pScale = planet.radius/this.split;		
		var priorty = 1.0/this.distance * pScale * maxSplits/this.split * this.BSradius;			
		if(this.hasChildren == false) 
		{	
			if(priorty > slip  || this.split < pass) 
			{
				if(this.split < maxSplits && this.inView == true || this.split <= pass) 
				{	
					this._split(gl, planet);
					//this._cleanData();
					updateLimit+=4;
					//this._checkForCracks();
					return true;
				}				
				else 
				{
					return false;	
				}				
			}
			else 
			{
				return false;
			}					
		}
		else 
		{				
			if(this.inView == true && priorty >= slip || this.split <= pass)
			{
					var result = [];
					for(var i = 0; i < 4; i++) 
					{
						result.push(this.children[i].updateFrame(gl, scene, planet, timing));
					}																
					if (result[0] == true || result[1] == true || result[2] == true || result[3] == true) 
					{
						return true;
					}
					else 
					{
						return false;
					}
			}
			else if(this.split > pass) 
			{
				if (this.inView == false || priorty < slip) 
				{
					//this._unsplit(gl, planet);
					this._removeChildren();
					updateLimit++;
					return true;
				}
				else 
				{
					return false;
				}
			}
			else 
			{
				return false;
			}	
		}
	}
};

/* 		P = Parent vert, c = 'new' Child vert
	 	* Every split adds 5 verts
	 	* P1	- c1 -	P2
	 	* |  n1  |  n2	 |
	 	* c2	- c3 - 	 c4
	 	* |  n3  |	 n4	 |
	 	* P3	- c5 -	P4
	 	* 
		* 		[	x, 				y, 				z, 			]
		* 	-	-	-	-
		*  Vert P1:	vertData[0],	vertData[1], 	vertData[2],
		*  Vert P2: vertData[3], 	vertData[4], 	vertData[5], 
		*  Vert P3: vertData[6], 	vertData[7], 	vertData[8],
		*  Vert P4: vertData[9], 	vertData[10], 	vertData[11],
*/
QuadPlanetNode.prototype._split = function (gl, planet) {
	var _avg = function() {
					var sum = 0;
					var count = arguments.length;
					
					for(var i = 0; i < count; i++) {
						sum += arguments[i];
					}
					
					return sum/count;
	};

	// Calculate 4 new node verts
	for(var i = 0; i < 4; i++) {
    	this.children[i] = new QuadPlanetNode(this.split+1,this.ancestor, i, planet);
    }
	
	var center = [_avg(this.vertData[0],this.vertData[3],this.vertData[6],this.vertData[9]), _avg(this.vertData[1],this.vertData[4],this.vertData[7],this.vertData[10]), _avg(this.vertData[2],this.vertData[5],this.vertData[8],this.vertData[11])];
	
	var nodeOne = [
	this.vertData[0], this.vertData[1], this.vertData[2],
	_avg(this.vertData[0], this.vertData[3]), _avg(this.vertData[1],this.vertData[4]), _avg(this.vertData[2],this.vertData[5]),
	_avg(this.vertData[0],this.vertData[6]), _avg(this.vertData[1],this.vertData[7]), _avg(this.vertData[2],this.vertData[8]),
	center[0],center[1],center[2],
	];

	var nodeTwo = [
	_avg(this.vertData[0], this.vertData[3]), _avg(this.vertData[1],this.vertData[4]), _avg(this.vertData[2],this.vertData[5]),
	this.vertData[3], this.vertData[4], this.vertData[5],
	center[0],center[1],center[2],
	_avg(this.vertData[3],this.vertData[9]), _avg(this.vertData[4],this.vertData[10]), _avg(this.vertData[5],this.vertData[11]),
	];
	
	var nodeThree = [
	_avg(this.vertData[0],this.vertData[6]), _avg(this.vertData[1],this.vertData[7]), _avg(this.vertData[2],this.vertData[8]),
	center[0],center[1],center[2],
	this.vertData[6], this.vertData[7], this.vertData[8],
	_avg(this.vertData[6],this.vertData[9]), _avg(this.vertData[7],this.vertData[10]), _avg(this.vertData[8],this.vertData[11]),
	];
	
	var nodeFour = [
	center[0],center[1],center[2],
	_avg(this.vertData[3],this.vertData[9]), _avg(this.vertData[4],this.vertData[10]), _avg(this.vertData[5],this.vertData[11]),
	_avg(this.vertData[6],this.vertData[9]), _avg(this.vertData[7],this.vertData[10]), _avg(this.vertData[8],this.vertData[11]),
	this.vertData[9], this.vertData[10], this.vertData[11],
	];
	
	/*
	 * Texture/Splat [0*] = s, [1*] = t
	 */
	var middle = [_avg(this.uv[0],this.uv[2],this.uv[4],this.uv[6]), _avg(this.uv[1],this.uv[3],this.uv[5],this.uv[7])];
	var uvOne = [
		this.uv[0], this.uv[1],
		_avg(this.uv[0],this.uv[2]), _avg(this.uv[1],this.uv[3]),
		_avg(this.uv[0],this.uv[4]), _avg(this.uv[1],this.uv[5]),
		middle[0], middle[1],			
	];
	
	var uvTwo = [
		_avg(this.uv[0],this.uv[2]), _avg(this.uv[1],this.uv[3]),
		this.uv[2],this.uv[3],
		middle[0], middle[1],
		_avg(this.uv[2],this.uv[6]), _avg(this.uv[3],this.uv[7]),	
	];
	
	var uvThree = [
		_avg(this.uv[0],this.uv[4]), _avg(this.uv[1],this.uv[5]),
		middle[0], middle[1],
		this.uv[4],this.uv[5],		
		_avg(this.uv[4],this.uv[6]),_avg(this.uv[5],this.uv[7]),
	];
	var uvFour = [
		middle[0], middle[1],
		_avg(this.uv[2],this.uv[6]), _avg(this.uv[3],this.uv[7]),
		_avg(this.uv[4],this.uv[6]),_avg(this.uv[5],this.uv[7]),
		this.uv[6],this.uv[7],
	];

	var parent = this;
	this.children[0]._buildNode(gl, nodeOne, uvOne, parent, planet);
	this.children[1]._buildNode(gl, nodeTwo, uvTwo, parent, planet);	
	this.children[2]._buildNode(gl, nodeThree, uvThree, parent, planet);
	this.children[3]._buildNode(gl, nodeFour, uvFour, parent, planet);
	
	this.hasChildren = true;
};
QuadPlanetNode.prototype.getSphereBBox = function(planet) 
{
	if(!this.sphereBBox) {
		this.sphereBBox.updateSphereBBox(planet);
	}
	return this.sphereBBox;
}
QuadPlanetNode.prototype.updateLocation = function(planet) 
{
	var mv = mat4.create();
	mat4.identity(mv);
	mat4.translate(mv, planet.center);
	mat4.rotateY(mv, planet.rotation);
	mat4.rotateZ(mv, planet.obliquity);
	mat4.translate(mv, this.sphereBBox);
	//mat4.fromRotationTranslation(planet.rotation, this.sphereBBox, mv);
	
	var location = vec4.create();
	mat4.multiplyVec4(mv, location);
	location = vec3.fromVec4(location);
	return location;
};
QuadPlanetNode.prototype.generateSphereBBox = function(planet) {
	this.sphereBBox = [
		this.sphereData[0] + this.sphereData[3] + this.sphereData[6] + this.sphereData[9],
		this.sphereData[1] + this.sphereData[4] + this.sphereData[7] + this.sphereData[10],
		this.sphereData[2] + this.sphereData[5] + this.sphereData[8] + this.sphereData[11],
	];
	this.sphereBBox[0] /= 4;
	this.sphereBBox[1] /= 4;
	this.sphereBBox[2] /= 4; 
			
	//vec3.add(this.sphereBBox, planet.center, this.sphereBBox);
	
	var sphereRadi = [
		Math.abs((this.sphereData[0] + this.sphereData[3])/2  - this.sphereData[0]),
		Math.abs((this.sphereData[2] + this.sphereData[5])/2  - this.sphereData[2])
	];
	
	switch(this.ancestor) {
		case frontFace:
		case backFace:
		case topFace:
		case bottomFace:
			this.BSradius = sphereRadi[0]*3.0;
			break;
		case leftFace:
		case rightFace:
			this.BSradius = sphereRadi[1]*3.0;
			break;	
		default:
			this.BSradius = 1;
			break;
	}	
};

/*
 * Not being called atm
 */
QuadPlanetNode.prototype._checkForCracks = function() {
	
	if(this.hasChildren == true) {
		for(var i = 0; i < 4; i++) {
			if(this.children[i].hasChildren == true){
				switch(this.children[i].spawn) {
					case 0:
					
						break;
					case 1:
					
						break;
					case 2:
					
						break;
					case 3:
					
						//}
						break;
				}
			}
		}
		for(var i = 0; i < 4; i++) {
			this.children[i]._checkForCracks();
		}
	}
	else {
		
	}
};

QuadPlanetNode.prototype._buildNode = function(gl, data, uv, parent, planet) {	
	if(data != null)
	{
		for(var i = 0; i < data.length; i++) {
		this.vertData[i] = data[i];
	}	
	}
	
	if(uv != null)
	{
		for(var i = 0; i < uv.length; i++) {
			this.uv[i] = uv[i]; 
		}	
	}
	
	this.parent = parent;
	this._calculateSphere(planet);
	this._buildTerrain(planet);
	this.generateSphereBBox(planet);
};

QuadPlanetNode.prototype._calculateSphere = function (planet) {
	
	var x,y,z;
	var m = Math;
	// Vert One
	x = this.vertData[0];
	y = this.vertData[1];
	z = this.vertData[2];		
	this.sphereData[0] = x * m.sqrt(1.0 - y * y / 2.0 - z * z / 2.0 + y * y * z * z / 3.0);
	this.sphereData[1] = y * m.sqrt(1.0 - z * z / 2.0 - x * x / 2.0 + z * z * x * x / 3.0);
	this.sphereData[2] = z * m.sqrt(1.0 - x * x / 2.0 - y * y / 2.0 + x * x * y * y / 3.0);
	
	// Vert Two
	x = this.vertData[3];
	y = this.vertData[4];
	z = this.vertData[5];	
	this.sphereData[3] = x * m.sqrt(1.0 - y * y / 2.0 - z * z / 2.0 + y * y * z * z / 3.0);
	this.sphereData[4] = y * m.sqrt(1.0 - z * z / 2.0 - x * x / 2.0 + z * z * x * x / 3.0);
	this.sphereData[5] = z * m.sqrt(1.0 - x * x / 2.0 - y * y / 2.0 + x * x * y * y / 3.0);
	
	// Vert Three
	x = this.vertData[6];
	y = this.vertData[7];
	z = this.vertData[8];	
	this.sphereData[6] = x * m.sqrt(1.0 - y * y / 2.0 - z * z / 2.0 + y * y * z * z / 3.0);
	this.sphereData[7] = y * m.sqrt(1.0 - z * z / 2.0 - x * x / 2.0 + z * z * x * x / 3.0);
	this.sphereData[8] = z * m.sqrt(1.0 - x * x / 2.0 - y * y / 2.0 + x * x * y * y / 3.0);
	
	// Vert Four
	x = this.vertData[9];
	y = this.vertData[10];
	z = this.vertData[11];	
	this.sphereData[9] = x * m.sqrt(1.0 - y * y / 2.0 - z * z / 2.0 + y * y * z * z / 3.0);
	this.sphereData[10] = y * m.sqrt(1.0 - z * z / 2.0 - x * x / 2.0 + z * z * x * x / 3.0);
	this.sphereData[11] = z * m.sqrt(1.0 - x * x / 2.0 - y * y / 2.0 + x * x * y * y / 3.0);
	
	for(var i = 0; i < this.sphereData.length; i++) {
		this.sphereData[i] *= planet.radius;
	}
	
};


/* 		P = Parent vert, c = 'new' Child vert
	 	* Every split adds 5 verts
	 	* P1	- c1 -	P2
	 	* |  n1  |  n2	 |
	 	* c2	- c3 - 	 c4
	 	* |  n3  |	 n4	 |
	 	* P3	- c5 -	P4
	 	* 
		* 		[	x, 				y, 				z, 			]
		* 	-	-	-	-
		*  Vert P1:	vertData[0],	vertData[1], 	vertData[2],
		*  Vert P2: vertData[3], 	vertData[4], 	vertData[5], 
		*  Vert P3: vertData[6], 	vertData[7], 	vertData[8],
		*  Vert P4: vertData[9], 	vertData[10], 	vertData[11],
*/

QuadPlanetNode.prototype._buildTerrain = function (planet) {
	
	if(this.hasChildren == true) {
		return;	
	}
	else {
		var mapDataA=0,mapDataB=0,mapDataC=0,mapDataD=0;
		var mapHeightMap = planet.heightMap[this.ancestor];
		var mapSeed = (planet.seed-1)/2;
		switch(this.ancestor) {
			case frontFace: 
							
					mapDataA = mapHeightMap[Math.round(this.vertData[0]*mapSeed + mapSeed)][Math.round(this.vertData[1]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[3]*mapSeed + mapSeed)][Math.round(this.vertData[4]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[6]*mapSeed + mapSeed)][Math.round(this.vertData[7]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[9]*mapSeed + mapSeed)][Math.round(this.vertData[10]*mapSeed + mapSeed)];
						
				break;
				
			case backFace:
			
					mapDataA = mapHeightMap[Math.round(this.vertData[0]*mapSeed + mapSeed)][Math.round(this.vertData[1]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[3]*mapSeed + mapSeed)][Math.round(this.vertData[4]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[6]*mapSeed + mapSeed)][Math.round(this.vertData[7]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[9]*mapSeed + mapSeed)][Math.round(this.vertData[10]*mapSeed + mapSeed)];	
					
				break;
				
			case leftFace:
					
					mapDataA = mapHeightMap[Math.round(this.vertData[2]*mapSeed + mapSeed)][Math.round(this.vertData[1]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[5]*mapSeed + mapSeed)][Math.round(this.vertData[4]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[8]*mapSeed + mapSeed)][Math.round(this.vertData[7]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[11]*mapSeed + mapSeed)][Math.round(this.vertData[10]*mapSeed + mapSeed)];
						
				break;
				
			case rightFace:
					
					mapDataA = mapHeightMap[Math.round(this.vertData[2]*mapSeed + mapSeed)][Math.round(this.vertData[1]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[5]*mapSeed + mapSeed)][Math.round(this.vertData[4]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[8]*mapSeed + mapSeed)][Math.round(this.vertData[7]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[11]*mapSeed + mapSeed)][Math.round(this.vertData[10]*mapSeed + mapSeed)];
					
				break;
			
			case topFace:
			
					mapDataA = mapHeightMap[Math.round(this.vertData[0]*mapSeed + mapSeed)][Math.round(this.vertData[2]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[3]*mapSeed + mapSeed)][Math.round(this.vertData[5]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[6]*mapSeed + mapSeed)][Math.round(this.vertData[8]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[9]*mapSeed + mapSeed)][Math.round(this.vertData[11]*mapSeed + mapSeed)];
					
				break;
				
			case bottomFace:
		
					mapDataA = mapHeightMap[Math.round(this.vertData[0]*mapSeed + mapSeed)][Math.round(this.vertData[2]*mapSeed + mapSeed)];
					mapDataB = mapHeightMap[Math.round(this.vertData[3]*mapSeed + mapSeed)][Math.round(this.vertData[5]*mapSeed + mapSeed)];
					mapDataC = mapHeightMap[Math.round(this.vertData[6]*mapSeed + mapSeed)][Math.round(this.vertData[8]*mapSeed + mapSeed)];
					mapDataD = mapHeightMap[Math.round(this.vertData[9]*mapSeed + mapSeed)][Math.round(this.vertData[11]*mapSeed + mapSeed)];
					
				break;
		}
		
		if(mapDataA != 0) {
			this.sphereData[0] *= mapDataA;
			this.sphereData[1] *= mapDataA;
			this.sphereData[2] *= mapDataA;	
		}					
		if(mapDataB != 0) {
			this.sphereData[3] *= mapDataB;
			this.sphereData[4] *= mapDataB;
			this.sphereData[5] *= mapDataB;
		}
		if(mapDataC != 0) {
			this.sphereData[6] *= mapDataC;
			this.sphereData[7] *= mapDataC;
			this.sphereData[8] *= mapDataC;
		}
		if(mapDataD != 0) {
			this.sphereData[9] *= mapDataD;
			this.sphereData[10] *= mapDataD;
			this.sphereData[11] *= mapDataD;
		}
	}
};
	
QuadPlanetNode.prototype._prepareMapData = function (glData) 
{
	if(this.hasChildren == true) 
	{
		for(var i = 0; i < 4; i ++) {
			this.children[i]._prepareMapData(glData);
		}
	}
	else {	
		if(this.ancestor == topFace || this.ancestor == bottomFace)
		{
			var reverseSphereData = new Array(this.sphereData.length);
			reverseSphereData[0] = this.sphereData[3];
			reverseSphereData[1] = this.sphereData[4];
			reverseSphereData[2] = this.sphereData[5];
			
			reverseSphereData[3] = this.sphereData[0];
			reverseSphereData[4] = this.sphereData[1];
			reverseSphereData[5] = this.sphereData[2];
			
			reverseSphereData[6] = this.sphereData[9];
			reverseSphereData[7] = this.sphereData[10];
			reverseSphereData[8] = this.sphereData[11];
			
			reverseSphereData[9] = this.sphereData[6];
			reverseSphereData[10] = this.sphereData[7];
			reverseSphereData[11] = this.sphereData[8];
			
			for(var i = 0; i < this.sphereData.length; i++) 
			{
				
				glData.position.push(reverseSphereData[i]);
			}
			var reverseUV = new Array(this.uv.length)
			reverseUV[0] = this.uv[2];
			reverseUV[1] = this.uv[3];
			
			reverseUV[2] = this.uv[0];
			reverseUV[3] = this.uv[1];
			
			reverseUV[4] = this.uv[6];
			reverseUV[5] = this.uv[7];
			
			reverseUV[6] = this.uv[4];
			reverseUV[7] = this.uv[5]; 	
			
			for(var i = 0; i < this.uv.length; i++) 
			{
				glData.uv.push(reverseUV[i]);
			}
		}
		else
		{
			for(var i = 0; i < this.sphereData.length; i++) 
			{
				glData.position.push(this.sphereData[i]);
			}
			for(var i = 0; i < this.uv.length; i++) 
			{
				glData.uv.push(this.uv[i]);
			}
		}		
		glData.nodeCount++;		
	}			
};

QuadPlanetNode.prototype._cleanData = function() 
{
	this.vertData = null;
	this.vertData = [];
	this.sphereData = null;
	this.sphereData = [];
	this.normal = null;
	this.normal = [];
	this.uv = null;
	this.uv = [];
};

QuadPlanetNode.prototype._unsplit = function(gl, planet) 
{ 
	var verts =
	[
	this.children[0].vertData[0], this.children[0].vertData[1], this.children[0].vertData[2],
	this.children[1].vertData[3], this.children[1].vertData[4], this.children[1].vertData[5],
	this.children[2].vertData[6], this.children[2].vertData[7], this.children[2].vertData[8],
	this.children[3].vertData[9], this.children[3].vertData[10], this.children[3].vertData[11],
	];
	var uv = 
	[
		this.children[0].uv[0], this.children[0].uv[1],
		this.children[1].uv[2], this.children[1].uv[3],
		this.children[2].uv[4], this.children[2].uv[5],
		this.children[3].uv[6], this.children[3].uv[7],
	];
	this._buildNode(gl, verts, uv, this.parent, planet);
};
	
QuadPlanetNode.prototype._removeChildren = function() 
{ 
	if(this.hasChildren == true) 
	{
		for(var i = 0; i < 4; i++) 
		{
			this.children[i]._cleanData();
			this.children[i]._removeChildren();
		}
		
		this.children = null;
		this.children = new Array(4);
		this.hasChildren = false;
	}
};