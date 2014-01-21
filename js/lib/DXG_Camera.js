/*
 * William Miller 2012
 */

/*
 * Orbital Camera
 */
var DXG_OrbitalCamera = function(max) 
{
	this.moving = false;
    this.orbitX = 0;
    this.orbitY = 0;
    this.distance = 10;
    this.zoomSpeed = 100;
    if(!max) { max = 100; }
    this.maxDistance = max;
    this.center = vec3.create();
    
    this.rotMatrix = mat4.create(); 
    mat4.identity(this.rotMatrix);
     
    this.viewMatrix = mat4.create();
    this.pMatrix = mat4.create();
    
    this.keys = new Array(128);
    this.shift = false;
    this.dirty = true;
};

DXG_OrbitalCamera.prototype.init = function(canvas) 
{
	var self = this,
    lastX,lastY;  
	// Set up the appropriate event hooks
	// Set up the appropriate event hooks
   	document.addEventListener("keydown", function (event) {
    	self.keys[event.keyCode] = true;
      	if(event.keyCode == 32) { // Prevent the page from scrolling
       		event.preventDefault();
      		return false;
       	}
       	if(event.shiftKey)
       	{
       		self.shift = true;
       	}
  	}, true);

 	document.addEventListener("keyup", function (event) {
    	self.keys[event.keyCode] = false;
    	if(self.shift) {self.shift = false;}
   	}, false);
   	
    canvas.addEventListener('mousedown',function(event) 
    {
    	event.preventDefault();
   		if(event.which === 1) 
   		{
         	self.moving = true;
        }
        lastX = event.pageX;
        lastY = event.pageY;
    }, false);

    canvas.addEventListener('mousemove',function(event) 
    {
    	event.preventDefault();
   		if(self.moving)
   		{
       		var xDelta = event.pageX-lastX,
            yDelta = event.pageY-lastY;
			
         	lastX = event.pageX;
          	lastY = event.pageY;
          	
          	if(self.shift)
          	{
          		var movement = Math.PI*2;           
	        	self.orbitY += xDelta*0.015;
	            while(self.orbitY < 0) 
	            {
	            	self.orbitY += movement;
	            }
	            while(self.orbitY >= movement) 
	            {
	              	self.orbitY -= movement;
	            }
	            
	            self.orbitX += yDelta*0.015;
	            while(self.orbitX < 0) 
	            {
	             	self.orbitX += movement;
	            }
	            while (self.orbitX >= movement) 
	            {
	             	self.orbitX -= movement;
	            }	
	            
	            // Update the directional matrix
				var rot = self.rotMatrix;
	            mat4.identity(rot);
	            mat4.rotateY(rot, -self.orbitY);
          	}
          	else 
          	{
          		var angle = Math.atan2(yDelta, xDelta);
				var movX = Math.cos(-angle);
				var movZ = Math.sin(angle);
				var mov = vec3.create([movX,0.0,movZ]);
				var rot = self.rotMatrix;
				mat4.multiplyVec3(rot, mov);
				vec3.add(self.center, mov);
          	}
            self.dirty = true;
      	}
  	},false);

  	canvas.addEventListener('mouseup',function() 
  	{
     	self.moving = false;
     	self.dirty = true;
  	},false);
  	
  	canvas.addEventListener('mousewheel',function(event) 
  	{
  		event.preventDefault();
  		var speed = -event.wheelDelta;
  		self.distance += speed/self.zoomSpeed;
     	self.dirty = true;
  	},false);
  	
  	canvas.addEventListener('DOMMouseScroll',function(event) 
  	{	
  		event.preventDefault();
  		var speed = event.detail*30;
  		self.distance += speed/self.zoomSpeed;
     	self.dirty = true;
  	},false);
};

DXG_OrbitalCamera.prototype.getPosition = function() 
{
	var pos = vec4.create();
	mat4.multiplyVec4(this.getViewMatrix(),pos);
	pos = vec3.fromVec4(pos);
			    		
	return pos;
};

DXG_OrbitalCamera.prototype.getCenter = function() 
{
	return this.center;
};

DXG_OrbitalCamera.prototype.setCenter = function(value) 
{
 	this.center = vec3.create(value);
   	this.dirty = true;
};

DXG_OrbitalCamera.prototype.getDistance = function() 
{
    return this.distance;
};

DXG_OrbitalCamera.prototype.setDistance = function(value) 
{
   	this.distance = value;
    this.dirty = true;
};

DXG_OrbitalCamera.prototype.getViewMatrix = function() 
{
	if(this.dirty) 
	{
     	var view = this.viewMatrix;
     	mat4.identity(view);
     	mat4.translate(view,[0, 0, -this.distance]);
     	mat4.rotateX(view,this.orbitX);
     	mat4.rotateY(view,this.orbitY);
     	mat4.translate(view, this.center);
        this.dirty = false;
  	}

   	return mat4.create(this.viewMatrix);
};

DXG_OrbitalCamera.prototype.update = function() 
{
	if(this.distance < 0) 
	{
		this.distance = 0;
	}
	if(this.distance > this.maxDistance) 
	{
		this.distance = this.maxDistance;
	}
};

/*
 * Quaternion Camera
 */

var DXG_QuaternionCamera = function()
{
	var self = this;
	this.moving = false;
	this.rotation = quat4.create();
	this.upVector = vec3.create([0,1,0]);
	this.tangentVector = vec3.create([1,0,0]);
	
	this.boundingSphere = 1.15;
    this.centerGravityRay = vec3.create();
    this.gPull = false;
	
	this.position = vec3.create();
	this.speed = 2.0;
	this.boost = 100;
    this.viewMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.keys = new Array(128);
    this.shift = false;
    this.dirty = true;
};

DXG_QuaternionCamera.prototype.init = function(canvas) 
{
	var self = this,
	lastX, lastY;
	// Set up the appropriate event hooks
	// Set up the appropriate event hooks
   	document.addEventListener("keydown", function (event) {
    	self.keys[event.keyCode] = true;
      	if(event.keyCode == 32) { // Prevent the page from scrolling
       		event.preventDefault();
      		return false;
       	}
       	if(event.shiftKey)
       	{
       		self.shift = true;
       	}     
  	}, true);

 	document.addEventListener("keyup", function (event) {
    	self.keys[event.keyCode] = false;
    	if(self.shift) {self.shift = false;}
   	}, false);
   	
    canvas.addEventListener('mousedown',function(event) 
    {
   		if(event.which === 1) 
   		{
         	self.moving = true;
        }
        lastX = event.pageX;
        lastY = event.pageY;
    }, false);

    canvas.addEventListener('mousemove',function(event) 
    {
   		if(self.moving)
   		{
       		var xDelta = event.pageX-lastX,
            yDelta = event.pageY-lastY;
			
         	lastX = event.pageX;
          	lastY = event.pageY;
          	
          	var inc = Math.PI/360.0;
    	
	    	var nrot = quat4.createAxisQuat(self.tangentVector, yDelta*inc);
			quat4.multiply(nrot, self.rotation, self.rotation);
			
			self.rotation = quat4.normalize(self.rotation);
			 	
			nrot = quat4.createAxisQuat(self.upVector, xDelta*inc);
			quat4.multiply(self.rotation, nrot, self.rotation);           
	                
	        self.rotation = quat4.normalize(self.rotation);
	                
            self.dirty = true;
      	}
  	},false);

  	canvas.addEventListener('mouseup',function() 
  	{
     	self.moving = false;
     	self.dirty = true;
  	},false);
  	
  	canvas.addEventListener('mousewheel',function(event) 
  	{
  		event.preventDefault();
  	},false);
  	
  	canvas.addEventListener('DOMMouseScroll',function(event) 
  	{	
  		event.preventDefault();
  	},false);
};

DXG_QuaternionCamera.prototype.setSpeed = function (newSpeed) 
{
	this.speed = newSpeed;
};

DXG_QuaternionCamera.prototype.getAngles = function () 
{
	this.rotation = quat4.normalize(this.rotation);
    return this.rotation;
};

DXG_QuaternionCamera.prototype.setAngles = function (value) 
{
    this.rotation = quat4.createEulerQuat(value[0],value[1],value[2]);
    this.rotation = quat4.normalize(this.rotation);
    this.dirty = true;
};

DXG_QuaternionCamera.prototype.getPosition = function ()
 {
    return this.position;
};

DXG_QuaternionCamera.prototype.setPosition = function (value) 
{
    this.position = value;
    this.dirty = true;
};

DXG_QuaternionCamera.prototype.getViewMatrix = function () 
{
    if (this.dirty) 
    {
    	this.rotation = quat4.normalize(this.rotation);
        this.viewMatrix = quat4.toMat4(this.rotation);
        mat4.translate(this.viewMatrix, [-this.position[0], -this.position[1], -this.position[2]]);
        this.dirty = false;
    }

    return mat4.create(this.viewMatrix);
};
 
DXG_QuaternionCamera.prototype.sphereCollisionTest = function(currentPlanet, boundingSphere) 
{
	
	var relPos = vec3.create();
	vec3.subtract(this.position, this.currentPlanet.center, relPos);
  	var dist = relPos[0] * relPos[0] + relPos[1] * relPos[1] + relPos[2] * relPos[2];
  	var minDist = this.boundingSphere + this.currentPlanet.radius;
  	if(dist <= minDist * minDist) 
  	{
  		return true;	
  	}
  	else {
  		return false;
  	}	  
};

/*
* 
*/
DXG_QuaternionCamera.prototype.updatePlanetInfo = function(planets) 
{
	var nearPlanet, index;
	var center = new Array();
	var radius = new Array();
	for(var i = 0; i < planets.length; i++) 
	{
		center[i] = planets[i].center;
	}
	for(var i = 0; i < planets.length; i++) 
	{
		radius[i] = planets[i].radius;
	}
	var pos = new Array();   
	
	/*
	 * Find the current ray from planet center to current position
	 */	
	var dx = 
	[
    	center[0][0] - this.position[0],
    	center[0][1] - this.position[1],
    	center[0][2] - this.position[2]
	];
	var distance = Math.sqrt(dx[0]*dx[0] + dx[1]*dx[1] + dx[2]*dx[2]); 	
	nearPlanet = center[0];
	nearPlanet.distance = distance;
	nearPlanet.radius = radius[0];
	index = 0;
		
	for(var i = 1; i < planets.length; i++) 
	{
		dx = [
    		center[i][0] - this.position[0],
    		center[i][1] - this.position[1],
    		center[i][2] - this.position[2]
		];
		distance = Math.sqrt(dx[0]*dx[0] + dx[1]*dx[1] + dx[2]*dx[2]);
		
		if(distance < nearPlanet.distance) 
		{
			nearPlanet = center[i];
			nearPlanet.distance = distance;
			nearPlanet.radius = radius[i];
			index = i;
		}
		
	}
	vec3.subtract(this.position, nearPlanet , pos);
	vec3.normalize(pos, this.centerGravityRay);
	this.centerGravityRay.orgin = nearPlanet;
	this.centerGravityRay.distance = nearPlanet.distance;
	this.centerGravityRay.radius = nearPlanet.radius;    	
	this.currentPlanet = planets[index];
	
	if(nearPlanet.distance > nearPlanet.radius*1.5)
	 {
		this.gPull = true;
	}
	else {
		this.gPull = false;
	} 	    	
};

DXG_QuaternionCamera.prototype.updateFrame = function(upDir, dir, rot)
{
	if(upDir.distance > upDir.radius*3) 
	{
		this.upVector = vec3.create([0,1,0]);
	}
	else 
	{
		this.upVector = upDir;
	}
	
	var lastPosition = vec3.create(this.position);
	if(rot !== 0)
	 {
		var nquat = quat4.create([0,0,1,rot]);
		nquat = quat4.normalize(nquat);
		quat4.multiply(nquat, this.rotation, this.rotation);
		this.rotation = quat4.normalize(this.rotation);
		this.dirty = true;
	}
	// Move the camera in the direction we are facing
    if (dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0) 
    {
    	var nquat = quat4.create(this.rotation);
    	nquat = quat4.normalize(nquat);
    	nquat = quat4.inverse(nquat);
    	nquat = quat4.normalize(nquat);
    	mat4.multiplyVec3(quat4.toMat4(nquat), dir);
        vec3.add(this.position,dir); 
        this.rotation = quat4.normalize(this.rotation);
        this.dirty = true;
    }     
    
    var didHit = this.sphereCollisionTest();
	if(didHit == true) {
		this.position = vec3.create(lastPosition);
		var gForce = vec3.create(this.upVector);
		gForce[0] *= 0.005;
		gForce[1] *= 0.005;
		gForce[2] *= 0.005;
		vec3.add(this.position,gForce); 
		this.dirty = true;
	}
}
    
DXG_QuaternionCamera.prototype.update = function(planets, timing) 
{
	
	var dir = vec3.create();
    var rot = 0;
    var speed = (this.speed / 1000) * timing.frameTime;
    speed = speed/planets.length;
	// Check for speed boost
	if (this.keys[16]) // shift key
	{
		speed = (speed * this.boost);
	}
	// Rotate/lean
	if (this.keys['Q'.charCodeAt(0)]) 
	{
		rot += (Math.PI/360)/2;
	}
	else if (this.keys['E'.charCodeAt(0)]) 
	{
		rot -= (Math.PI/360)/2;
	}
	
	var currentSpeed = speed;
    // This is our first person movement code. It's not really pretty, but it works
    if (this.keys['W'.charCodeAt(0)]) {
        dir[2] -= currentSpeed;
    }
    if (this.keys['S'.charCodeAt(0)]) {
        dir[2] += currentSpeed;
    }
    if (this.keys['A'.charCodeAt(0)]) {
        dir[0] -= currentSpeed;
    }
    if (this.keys['D'.charCodeAt(0)]) {
        dir[0] += currentSpeed;
    }
    if (this.keys[32]) { // Space, moves up
        dir[1] += currentSpeed;
    }
    if (this.keys[17]) { // Ctrl, moves down
        dir[1] -= currentSpeed;
    }
    
	if(planets != null) {this.updatePlanetInfo(planets);}
	
	if(this.gPull == true) 
	{
		//vec3.add(dir,[0.1,0,0.1]);
	}
                    	
	this.updateFrame(this.centerGravityRay, dir, rot); 
};
    