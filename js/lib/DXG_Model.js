/*
 * William Miller 2012
 */

function warnSetCallBack(typeClass)
{
	alert("Callback for " + typeClass + " not set!")
}

function initDXGModelObject(gl, scene, typeClass, type, texture, callback) 
{
	if(typeClass == "environment") 
	{
		if(type == "skybox") 
		{
			if(!callback) {callback = warnSetCallBack;}
			initCubeBuffer(gl, scene, texture, callback, true);
		}
	}
	else if(typeClass == "primitive") 
	{
		if(!callback) {callback = warnSetCallBack;}
		if(type == "cube") 
		{
			initCubeBuffer(gl, scene, texture, callback, false);
		}
		else if(type == "sphere") {
			initSphereBuffer(gl, scene, texture, callback);
		}
	}
	else if(typeClass == "model"){
		if(!callback) {callback = warnSetCallBack;}
		initJSONModel(gl, scene,  type, texture, callback);
	}
	else
	{
		DXG_LOG("No class type of " + typeClass + "is set");
	}		
};

function initCubeBuffer(gl, scene, texture, callback, isSkybox) 
{
	
	var bufferObject = {};
   	var vertices = [];
	var textureCoords = [];
	var vertexIndices = [];
	
	bufferObject.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexPositionBuffer);
    vertices = 
    [
	    //x,y,z
	   	// Front face
	   -1.0, -1.0,  1.0,
	    1.0, -1.0,  1.0,
	    1.0,  1.0,  1.0,
	   -1.0,  1.0,  1.0,
		// Back face
	   -1.0, -1.0, -1.0,
	   -1.0,  1.0, -1.0,
	    1.0,  1.0, -1.0,
	    1.0, -1.0, -1.0,
		// Top face
	   -1.0,  1.0, -1.0,
	   -1.0,  1.0,  1.0,
	    1.0,  1.0,  1.0,
		1.0,  1.0, -1.0,
		// Bottom face
	   -1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
	    1.0, -1.0,  1.0,
	   -1.0, -1.0,  1.0,
		// Right face
	    1.0, -1.0, -1.0,
	    1.0,  1.0, -1.0,
	    1.0,  1.0,  1.0,
	    1.0, -1.0,  1.0,
		// Left face
	   -1.0, -1.0, -1.0,
	   -1.0, -1.0,  1.0,
	   -1.0,  1.0,  1.0,
	   -1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    bufferObject.vertexPositionBuffer.itemSize = 3;
    bufferObject.vertexPositionBuffer.numItems = 24;

    textureCoords = 
    [
    	// Front face
       	0.0,1.0,
       	1.0,1.0,
       	1.0,0.0,
       	0.0,0.0,
		// Back face
       	0.0,1.0,
       	0.0,0.0,
       	1.0,0.0,
       	1.0,1.0,
		// Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
		// Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
		// Right face
       	0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
		// Left face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
  	];
  	
  	if(texture != null) 
  	{
		bufferObject.vertexTextureBuffer = gl.createBuffer();
    	gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexTextureBuffer);
    	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoords),gl.STATIC_DRAW);
    	bufferObject.vertexTextureBuffer.itemSize = 2;
    	bufferObject.vertexTextureBuffer.numItems = textureCoords.length/2;	
    	bufferObject.shaderType = DXG_ShaderTexture;
	}
	else {
		bufferObject.vertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject.vertexColorBuffer);
		var colors = [];
		var k = vertices.length/3;
		for(var i=0;i<k;i++) 
		{
			for(var j=0;j<4;j++) 
			{
				colors.push(1.0);
			}
		}
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
		bufferObject.vertexColorBuffer.itemSize = 4;
		bufferObject.vertexColorBuffer.numItems = colors.length;	
		bufferObject.shaderType = DXG_ShaderColor;
	}

    bufferObject.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufferObject.vertexIndexBuffer);
    vertexIndices = 
    [
    	0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
   	];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(vertexIndices),gl.STATIC_DRAW);
    bufferObject.vertexIndexBuffer.itemSize = 1;
    bufferObject.vertexIndexBuffer.numItems = 36;
    
    bufferObject.name = "cube";
    bufferObject.instances = [];
   	bufferObject.instanceCount = 0;
 	
   	if(isSkybox) 
   	{
   		bufferObject.isSkybox = true;
   		bufferObject.name = "skybox";	
   	}
   	
  	var modelProperties =
		    {
		    	assetType: "model",
		    	type: bufferObject.name
		    }; 
		    
   	bufferObject.properties = modelProperties;
   	
   	DXG_LOG("Primitive: " + "'" + bufferObject.name + "' " + "Buffer Object created");
   	if(texture != null)
    	scene.textureManager.preloadTexture(gl,texture,callback,bufferObject);  
    else	
    	callback(gl, scene, bufferObject);
};

function initSphereBuffer(gl, scene, texture, callback) 
{		
	var bufferObject = {};
   	var vertices = [];
	var textureCoords = [];
	var vertexIndices = [];
	
	var radius = 1.0;
	var latitudeBands = 45;
    var longitudeBands = 45;
    var m = Math;
   	for (var latNumber=0;latNumber<=latitudeBands;latNumber++) {
        var theta = latNumber*m.PI/latitudeBands;
        var sinTheta = m.sin(theta);
        var cosTheta = m.cos(theta);

        for (var longNumber=0;longNumber<=longitudeBands;longNumber++) {
           	var phi = longNumber*2*m.PI/longitudeBands;
            var sinPhi = m.sin(phi);
            var cosPhi = m.cos(phi);

            var x = cosPhi*sinTheta;
            var y = cosTheta;
            var z =sinPhi*sinTheta;
            var u = 1-(longNumber/longitudeBands);
            var v = 1-(latNumber/latitudeBands);
            var first = (latNumber*(longitudeBands+1))+longNumber;
            var second = first+longitudeBands+1;
			
			
			vertices.push(radius*x);
            vertices.push(radius*y);
            vertices.push(radius*z);
                
            textureCoords.push(v);
            textureCoords.push(u);
            if(latNumber<latitudeBands&&longNumber<longitudeBands) {
            	vertexIndices.push(first);
            	vertexIndices.push(second);
            	vertexIndices.push(first+1);

            	vertexIndices.push(second);
            	vertexIndices.push(second+1);
            	vertexIndices.push(first+1);	        
            }    
      	}
  	}
  	
	textureCoords = textureCoords.reverse();
	
    bufferObject.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    bufferObject.vertexPositionBuffer.itemSize = 3;
    bufferObject.vertexPositionBuffer.numItems = vertices.length/3;
    
    if(texture != null) 
    {
		bufferObject.vertexTextureBuffer = gl.createBuffer();
    	gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexTextureBuffer);
    	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoords),gl.STATIC_DRAW);
    	bufferObject.vertexTextureBuffer.itemSize = 2;
    	bufferObject.vertexTextureBuffer.numItems = textureCoords.length/2;	
    	bufferObject.shaderType = DXG_ShaderTexture;
	}
	else 
	{
		bufferObject.vertexColorBuffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexColorBuffer);
		var colors = [];
		var k=vertices.length/3;
		for(var i=0;i<k;i++) 
		{
			for(var j=0;j<4;j++) 
			{
				colors.push(1.0);
			}
		}
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
		bufferObject.vertexColorBuffer.itemSize = 4;
		bufferObject.vertexColorBuffer.numItems = colors.length;	
		bufferObject.shaderType = DXG_ShaderColor;
	}
 
    bufferObject.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufferObject.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(vertexIndices),gl.STATIC_DRAW);
    bufferObject.vertexIndexBuffer.itemSize = 1;
    bufferObject.vertexIndexBuffer.numItems = vertexIndices.length;
    
    bufferObject.name = "sphere";
    bufferObject.instances = [];
   	bufferObject.instanceCount = 0;
   	
   	var modelProperties =
		    {
		    	assetType: "model",
		    	type: bufferObject.name
		    }; 
		    
   	bufferObject.properties = modelProperties;
   	   	
   	DXG_LOG("Primitive: " + "'" + bufferObject.name + "' " + "Buffer Object created");
	if(texture != null)
    	scene.textureManager.preloadTexture(gl,texture,callback,bufferObject);  
    else	
    	callback(gl, scene, bufferObject);
};

function initJSONModelBuffer(gl, scene, path, texture, callback) 
{	
	var request = new XMLHttpRequest();
    request.open("GET",path);
    request.onreadystatechange = function() 
    {
    	if(request.readyState == 4) 
    	{
        	loadJSONModel(gl, scene, JSON.parse(request.responseText), texture, callback);	
        }
   	}
  	request.send();	
};

function loadJSONModel(gl, scene, model, texture, callback) 
{
	var bufferObject = {};

    bufferObject.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexPositionBuffer);
   	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(model.vertices),gl.STATIC_DRAW);
    bufferObject.vertexPositionBuffer.itemSize = 3;
    bufferObject.vertexPositionBuffer.numItems = model.vertices.length/3;
	
	if(model.textureCoords && texture != null) 
	{
		bufferObject.vertexTextureBuffer = gl.createBuffer();
    	gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexTextureBuffer);
    	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(model.textureCoords),gl.STATIC_DRAW);
    	bufferObject.vertexTextureBuffer.itemSize = 2;
    	bufferObject.vertexTextureBuffer.numItems = model.textureCoords.length/2;
    	bufferObject.shaderType = DXG_ShaderTexture;	
	}
	else 
	{
		bufferObject.vertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexColorBuffer);
		var colors = [];
		var k = model.vertices.length/3;
		for(var i=0;i<k;i++) 
		{
			for(var j=0;j<4;j++) 
			{
				colors.push(1.0);
			}
		}
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
		bufferObject.vertexColorBuffer.itemSize = 4;
		bufferObject.vertexColorBuffer.numItems = colors.length;	
		bufferObject.shaderType = DXG_ShaderColor;
	}
      
    bufferObject.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferObject.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(model.normals),gl.STATIC_DRAW);
    bufferObject.vertexNormalBuffer.itemSize = 3;
    bufferObject.vertexNormalBuffer.numItems = model.normals.length/3;
    
    bufferObject.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufferObject.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(model.models[0].indices),gl.STATIC_DRAW);
    bufferObject.vertexIndexBuffer.itemSize = 1;
    bufferObject.vertexIndexBuffer.numItems = model.models[0].indices.length;
    
    bufferObject.name = model.name;
    bufferObject.instances = [];
   	bufferObject.instanceCount = 0;  
   	
   	DXG_LOG("Model: " + "'" + bufferObject.name + "' " + "Buffer Object created");
   	if(texture != null)
    	scene.textureManager.preloadTexture(gl, texture, callback, bufferObject);  
    else	
    	callback(bufferObject);
};


function getObjectBuffer (name) 
{
	var sceneObjects = RedditMain.scene.sceneObjects
	var n = sceneObjects.length;
	var k = n;
	do
	{
		var i = k-n;
		var object = sceneObjects[i];
		if(object.name == name) {return object;}
	}
	while(--n);
	
	return null;
};

/*
 * Text Methods
 */

var AlphabetGL = 
[
	'!','#','$','&',
	'(',')','+','.',
	'0','1','2','3',
	'4','5','6','7',
	'8','9','<','>',
	'?','@','A','B',
	'C','D','E','F',
	'G','H','I','J',
	'K','L','M','N',
	'O','P','Q','R',
	'S','T','U','V',
	'W','X','Y','Z',
];

// Line Splitter Function
// copyright Stephen Chapman, 19th April 2006
// you may copy this code but please keep the copyright notice as well
function splitLine(st,n) 
{
	var b = ''; var s = st;
	while (s.length > n) 
	{
		var c = s.substring(0,n);
		var d = c.lastIndexOf(' ');
		var e =c.lastIndexOf('\n');
		if (e != -1) d = e; 
		if (d == -1) d = n; 
		b += c.substring(0,d) + '\n';
		s = s.substring(d+1);
	}
	return b+s;
}
                  

// Load up at least one instance of every character
function initAlphabet (callback) 
{
	if(!callback) {callback = CharacterCallback;}
	var path = "root/models/FontHappyMonkey/FontHappyMonkey_0";
	
	DXG_LOG("Initiating TextGL Alphabet");
	DXG_LOG("Initiating TextGL Alphabet Count: " + AlphabetGL.length);
	
	for(var i in AlphabetGL) 
	{
		var aChar = AlphabetGL[i];
		var completePath = path + aChar.charCodeAt() + ".json";
		initBufferObject(gl,"model",completePath,null,callback);
	}
};

function addWord (txt, objectName, index) 
{
	var sceneObjects = RedditMain.scene.sceneObjects;
	var n = sceneObjects.length;
	var k = n;
	do 
	{
		var i = k-n
		var object = sceneObjects[i];
		if(objectName == object.name)
		{
			
			var objectInstance = object.instances[index];
			var txtSize = 2.0;
			var space = 0.5;
			var charPerLine = 20;
			var lineOffset = 2.0;
			
			var numTxt = txt.length; 
			var numLines = 1;
			
			var txtToRender = splitLine(txt, charPerLine);
			for(var j in txtToRender) {if(txtToRender[j] == '\n' || txtToRender[j] == '\r') { numLines++; }}	
			

			var vPos = vec3.create(objectInstance.position);
			vPos[0] -= (2*space*charPerLine)/2;
			
			vPos[1] += 2.5 * numLines;
			// Adjust for object to attach to
			vPos[0] *= objectInstance.scale/txtSize;
			vPos[1] *= objectInstance.scale/txtSize;
			vPos[2] *= objectInstance.scale/txtSize;
				
			var vRot = vec3.create(objectInstance.rotation);
			var fSpeed = objectInstance.speed;
				
			var nn = txtToRender.length;
			var kk = nn;
			do
			{
				var ii = kk-nn;	
				var aChar = txtToRender[ii];
				if(aChar == '\n' || aChar == '\r') 
				{ 
					var h = vPos[1];
					vPos = vec3.create(objectInstance.position);
					
					vPos[0] -= (2*space*charPerLine)/2;
					vPos[1] += 2.5 * numLines;
					vPos[1] -= h + lineOffset;
					
					vPos[0] *= objectInstance.scale/txtSize;
					vPos[1] *= objectInstance.scale/txtSize;
					vPos[2] *= objectInstance.scale/txtSize;
				}
				
				aChar = aChar.toUpperCase();
				var isChar = false;
				var tt = AlphabetGL.length;
				var yy = tt;
				do
				{
					var iii = yy-tt;
					if(aChar == AlphabetGL[iii])
					{
						isChar = true;
					}
				}
				while(tt--)
				
				if(aChar != ' ' && isChar == true)
				{
					createLetterInstance(aChar,vPos,vRot,fSpeed,txtSize);	
					vPos[0] = vPos[0] + space;
				}
				else 
				{
					vPos[0] = vPos[0] + space*1.5;
				}		
			}
			while(--nn);	
		}
	}
	while(--n);
};

function createLetterInstance (aChar, vPos, vRot, fSpeed, fSize, count) 
{	
	var object = getObject(aChar);
	var u = object.instanceCount;
	if(count)
	{
		addObjectInstance(object,count);
		for(var i=0;i<count;i++) 
		{
			setObjectInstanceRotation(object.instances[i+u],vRot);
			setObjectInstancePosition(object.instances[i+u],vPos);
			setObjectInstanceScale(object.instances[i+u],fSize);			
  			setObjectInstanceSpeed(object.instances[i+u],fSpeed);	
  		}	
	}
	else 
	{
		addObjectInstance(object);
		setObjectInstanceRotation(object.instances[0+u],vRot);
		setObjectInstancePosition(object.instances[0+u],vPos);
		setObjectInstanceScale(object.instances[0+u],fSize);
  		setObjectInstanceSpeed(object.instances[0+u],fSpeed);
	}	
};

/*
 * Instance methods
//////////////////////
 * Object Instance
 */
var instance = function()
{
	this.mvMatrix = mat4.create();
	this.rotation = vec3.create();
	this.position = vec3.create();
	this.scale = 1.0;
	this.speed = 1.0;
	this.BBox = this.scale*1.5;
	
	this.hidden = false;	
	this.hasTexture = false;
	this.texture = 0;
}; 

function addObjectInstance(object, count) 
{
	var u = object.instanceCount;
	var instances = object.instances;
	if(count) {
		var n = count;
		var k = n;
		do
		{
			var i = k-n;
			instances[u+i] = new instance();
		}
		while(--n);
	}
	else {
		instances[u] = new instance();	
		count = 1;
	}
	object.instanceCount = u+count;
};

function removeObjectInstances(objectName)
{
	var sceneObjects = RedditMain.scene.sceneObjects;
	var n = sceneObjects.length;
	var k = n;
	do 
	{
		var i = k-n
		var object = sceneObjects[i];
		if(objectName == object.name)
		{
			if(object.instanceCount > 0)
			{
				var instances = object.instances;
				var nn = object.instanceCount;
				var kk = nn;
				do
				{
					var ii = kk-nn;
					instances[i] = null;
				}
				while(--nn);
				object.instances = null;
				object.instances = [];
				object.instanceCount = 0;	
			}
		}
	}
	while(--n);
};

function setObjectInstanceRotation(objectInstance, rot) 
{
	objectInstance.rotation = vec3.create(rot);
};

function setObjectInstancePosition(objectInstance, pos) 
{
	objectInstance.position = vec3.create(pos);
};

function setObjectInstanceScale(objectInstance, value) 
{
	objectInstance.scale = value;
	objectInstance.BBox = value*1.5;
};

function setObjectInstanceSpeed(objectInstance, speed) 
{
	objectInstance.speed = speed;
};

function setObjectInstanceTexture(gl, objectInstance, src) 
{
	gl.textureManager.preloadTexture(gl,src,null,objectInstance);
};