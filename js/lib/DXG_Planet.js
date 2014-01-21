/*
 * 	William C Miller 2012
 * 	QuadNode Planet - 
 * 		Will generate a 3d Cube-to-Sphere projected heightmaped planet
 * 		Version 2.0
 * 		CHANGE LOG:
 * 			Removed 'require.js'
 * 			Many small optimizations
 * 			Synced 'DXG_PlanetNode Class'
 */
// Lookup values
var frontFace=0,backFace=1,leftFace=2,rightFace=3,
topFace=4,bottomFace=5;
var topEdge=0,rightEdge=1,bottomEdge=2,leftEdge=3;
/*
 * Quad Planet Class
 */
// Planet Initializer function
var QuadPlanet = function (gl, planetProto) 
{
    this.ready = false;
    this.gl = gl;
    this.planetID = planetProto.uniqueID;
    this.scale = planetProto.radius * 6.4; // 6400 about earth radius in km
    this.seed = planetProto.seed;
    this.splitFactor = planetProto.splitFactor;
    /*
     * OpenGL Buffer objects
     */
    this.vertBuffer;
    this.splatBuffer;
	this.indexBuffer;
	this.normalBuffer;
	this.atmosphere = null;
	
	/*
	 * User information
	 */	
	this.userPosition = vec3.create();
		
	/*
	 * Node Data
	 */
	this.positions = new Array();
	this.textureCoords = new Array();
	this.splatCoords = new Array();
	this.nodeCount = 0;
	this.indicies = new Array();
	this.center = vec3.create(planetProto.center);
	//this.rotation = new quat4.create();
	this.rotation = planetProto.rotation;
	this.rotation = degToRad(this.rotation);
	this.obliquity = planetProto.obliquity;//90.0;//23.0;
	this.obliquity = degToRad(this.obliquity);
	this.mvMatrix = new mat4.create();
    /*
     * Heightmap for planet
     */
    this.assetCount = 0;
    this.heightMap = new Array(6);
    for(var f = 0; f < 6; f++) 
    {
		this.heightMap[f] = new Array(this.seed);
		for(var x = 0; x < this.seed; x++) 
		{
			this.heightMap[f][x] = new Array(this.seed);
			for(var y = 0; y < this.seed; y++) 
			{
				this.heightMap[f][x][y] = 0;
			}		
		}
	}
		
	this.radius = planetProto.radius;
	
	this.atmosphereRadius = this.radius * 1.0325;
	this.textureManager = planetProto.textureManager;
	this.textures = new Array(5);
	//this.textures[0] = this.textureManager.preloadTexture(gl, "root/texture/arrow.png");
	this.textureManager.preloadTexture(this.gl, "assets/textures/dirt.jpg", this.loadTexture, null, this, 0);
	this.textureManager.preloadTexture(this.gl, "assets/textures/grass.jpg", this.loadTexture, null, this, 1);
	this.textureManager.preloadTexture(this.gl, "assets/textures/rock.jpg", this.loadTexture, null, this, 2);
	this.textureManager.preloadTexture(this.gl, "assets/textures/snow.jpg", this.loadTexture, null, this, 3);
	this.textureManager.preloadTexture(this.gl, "assets/maps/splatMap1.png", this.loadTexture, null, this, 4);
	for(var i = 0; i < 6; i++) 
	{
		loadHeightMap(this.gl, this, this.heightMap, this.seed, i, planetProto.heightMapPath[i], this.loadPlanet);
	}
	this.rootNodes = new Array(6);
    
   	DXG_LOG(" - - Planet " + this.planetID +" - - ");
    DXG_LOG("Planet Seed(HeightMap): " + (this.seed-1));   
    DXG_LOG("Planet Radius: " + this.radius * this.scale + " meters");
    DXG_LOG("Planet Center: " + this.center[0] + ' ' + this.center[1] + ' ' + this.center[2]); 
};

QuadPlanet.prototype.loadTexture = function (promise, planet, texID)
{
	var self = planet;
	self.textures[texID] = promise;
};
QuadPlanet.prototype.loadPlanet = function (gl, planet)
{
	var self = planet;
	self.assetCount++;
	if(self.assetCount == 6)
	{
		DXG_LOG("Planet Loaded");
		self._buildQuadPlanet(gl);
    	self._buildAtmosphere(gl);
    	self.ready = true;
	}
};

QuadPlanet.prototype.updateFrame = function (gl, scene, timing) 
{					
	
	//this.center[0] += 0.005;
	var dt = timing.frameTime;
	this.rotation += (degToRad(0.5)*dt)/1000.0;
		
	var result = [];
	var self = this;
	/*
	 * Move and Rotate planet
	 */
	var mv = mat4.create();
	mat4.identity(mv);
	mat4.translate(mv, this.center);
	mat4.rotateY(mv, this.rotation);
	mat4.rotateZ(mv, this.obliquity);
	this.mvMatrix = mv;
	
	for(var i = 0; i < 6; i++) 
	{		
		result.push(this.rootNodes[i].updateFrame(gl, scene, self, timing));
	}
	
	this.userPosition = vec3.create(scene.camera.getPosition());
	
	var flag = false;
	for(var i = 0; i < result.length; i++) 
	{
		if(result[i] == true) 
		{
			flag = true;
		}
	}
	if(flag == true) 
	{
		this._rebuildMapData();
		this._bindData(gl);
	}
	
};
 
QuadPlanet.prototype.renderFrame = function (gl, scene, timing) 
{     	
	var view = scene.camera.getViewMatrix();
	var proj = scene.projectionMatrix;
	var shader, skyShader;
	
	var dx = vec3.create();
	vec3.subtract(this.userPosition, this.center, dx);
	var height = vec3.length(dx);
	if(height < this.atmosphereRadius) 
	{
		shader = scene.shaders.planetShaders.terrain_Atmosphere;	
		skyShader = scene.shaders.planetShaders.atmosphere_Atmosphere;
	}
	else 
	{
		shader = scene.shaders.planetShaders.terrain_Space;	
		skyShader = scene.shaders.planetShaders.atmosphere_Space;	
	}
	
	/*
	 * Draw sky and then quadPlanet so atmosphere is behing the planet
	 * 
	 */
	if(skyShader && this.atmosphere != null) 
	{
		
		//gl.disable(gl.DEPTH_TEST);
        //gl.enable(gl.BLEND);
		//gl.enable(gl.CULL_FACE);
		//gl.cullFace(gl.BACK); // BACK FRONT_AND_BACK
		
		var attribs = scene.shaders.shaderPrototypes.atmosphere_AtmosphereProto.attribs;
		for(var i in attribs) 
		{
			var attrib = attribs[i];
			gl.enableVertexAttribArray(shader.attribute[attrib]);
		}
  		 
	    // Update atmospheric lighting
	     
		gl.useProgram(skyShader);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
     
					
		this.updateLight(gl, scene, skyShader, height);
		
       	gl.bindBuffer(gl.ARRAY_BUFFER, this.atmosphere.vertexPositionBuffer);
		gl.vertexAttribPointer(skyShader.attribute.position, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.atmosphere.vertexIndexBuffer);    
        gl.uniformMatrix4fv(skyShader.uniform.viewMat, false, view);
        gl.uniformMatrix4fv(skyShader.uniform.modelMat, false, this.mvMatrix);
        gl.uniformMatrix4fv(skyShader.uniform.projectionMat, false, proj);
        
        gl.drawElements(gl.TRIANGLES, this.atmosphere.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        
        gl.cullFace(gl.BACK);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
	}
	
    if(shader)
    {
    	var attribs = scene.shaders.shaderPrototypes.terrain_AtmosphereProto.attribs;
		for(var i in attribs) 
		{
			var attrib = attribs[i];
			gl.enableVertexAttribArray(shader.attribute[attrib]);
		}
        
        gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		
	    // Update atmospheric lighting
        gl.useProgram(shader);
	    this.updateLight(gl, scene, shader, height);  	  	     	
	    
		// Activate & bind textures for texture blending
		var tex0Loc = gl.getUniformLocation(shader, "texture0" );
		gl.uniform1i(tex0Loc, 0);
		gl.activeTexture(gl.TEXTURE0);    
		gl.bindTexture(gl.TEXTURE_2D, this.textureManager.getTexture(gl,this.textures[0]));

		var tex1Loc = gl.getUniformLocation(shader, "texture1" );
		gl.uniform1i(tex1Loc, 1); 
		gl.activeTexture(gl.TEXTURE1);    
		gl.bindTexture(gl.TEXTURE_2D, this.textureManager.getTexture(gl,this.textures[1]))
		
		var tex2Loc = gl.getUniformLocation(shader, "texture2" ); 
		gl.uniform1i(tex2Loc, 2);
		gl.activeTexture(gl.TEXTURE2);    
		gl.bindTexture(gl.TEXTURE_2D, this.textureManager.getTexture(gl,this.textures[2]))
		
		var spalt0Loc = gl.getUniformLocation(shader, "splatMap0" );
		gl.uniform1i(spalt0Loc, 3);
	    gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.textureManager.getTexture(gl,this.textures[4]))
		
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer); 
	  	gl.vertexAttribPointer(shader.attribute.position, 3, gl.FLOAT, false, 0, 0);  
	   	
	   	gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
	    gl.vertexAttribPointer(shader.attribute.texture, 2, gl.FLOAT, false, 0, 0);      
             
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.splatBuffer);
	    gl.vertexAttribPointer(shader.attribute.splat0, 2, gl.FLOAT, false, 0, 0);         
	    
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);	    
	    gl.uniformMatrix4fv(shader.uniform.viewMat, false, view);
	    gl.uniformMatrix4fv(shader.uniform.modelMat, false, this.mvMatrix);
	    gl.uniformMatrix4fv(shader.uniform.projectionMat, false, proj); 

       	gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
       	gl.cullFace(gl.BACK);
       	gl.disable(gl.CULL_FACE);
  	}	
};  

QuadPlanet.prototype.updateLight = function(gl, scene, shader, height) 
{
       	/*
       	 * Transform camera Position, 
       	 */   
       	var realCamPosition = vec3.create(this.userPosition);    	
   		var planetPosition = vec3.create(this.center);
		var relativeCameraPosition = vec3.create();
		vec3.subtract(realCamPosition, planetPosition, relativeCameraPosition);
		
		var pv = mat4.create();
       	mat4.identity(pv);
       	var inverseRotation = -this.rotation;
       	mat4.rotateY(pv, inverseRotation);
       	// TODO: Not Working
       	var inverseObliquity = this.obliquity;
		mat4.rotateZ(pv, inverseObliquity);
		
		var sunPosition = vec3.create([0.0, 0.0, 0.0]); // 0,0,0
		var sunLightDirection = vec3.create();
		//vec3.subtract(sunPosition, planetPosition, sunLightDirection);
		vec3.direction(sunPosition, planetPosition, sunLightDirection);
		
		mat4.multiplyVec3(pv, relativeCameraPosition);
		mat4.multiplyVec3(pv, sunLightDirection);	
		vec3.normalize(sunLightDirection);
		
        var uniformLoc = gl.getUniformLocation(shader, "v3CameraPos" ); 
		gl.uniform3f(uniformLoc, relativeCameraPosition[0], relativeCameraPosition[1], relativeCameraPosition[2]); // The camera's current position
		
		uniformLoc = gl.getUniformLocation(shader, "v3LightPos" ); 
		gl.uniform3f(uniformLoc, sunLightDirection[0], sunLightDirection[1], sunLightDirection[2]); // The direction vector to the light source
		
		var red = 1.0/Math.pow(scene.lighting.planet.redWaveLength,4);
		var green = 1.0/Math.pow(scene.lighting.planet.greenWaveLength,4);
		var blue = 1.0/Math.pow(scene.lighting.planet.blueWaveLength,4);
		
		uniformLoc = gl.getUniformLocation(shader, "v3InvWavelength" ); 
		gl.uniform3f(uniformLoc, red, green, blue); // 1 / pow(wavelength, 4) for the red, green, and blue channels
		
		var radius = this.radius;
		var elev = height;
			
		uniformLoc = gl.getUniformLocation(shader, "fCameraHeight" ); 
		gl.uniform1f(uniformLoc, elev); // The camera's current height/elevation
		
		uniformLoc = gl.getUniformLocation(shader, "fCameraHeight2" ); 
		gl.uniform1f(uniformLoc, elev*elev); // fCameraHeight^2
		
		uniformLoc = gl.getUniformLocation(shader, "fOuterRadius" ); 
		gl.uniform1f(uniformLoc, this.atmosphereRadius); // The outer (atmosphere) radius
		
		uniformLoc = gl.getUniformLocation(shader, "fOuterRadius2" ); 
		gl.uniform1f(uniformLoc, this.atmosphereRadius*this.atmosphereRadius); // fOuterRadius^2
		
		uniformLoc = gl.getUniformLocation(shader, "fInnerRadius" ); 
		gl.uniform1f(uniformLoc, radius); // The inner (planetary) radius
		
		uniformLoc = gl.getUniformLocation(shader, "fInnerRadius2" ); 
		gl.uniform1f(uniformLoc, radius*radius); // fInnerRadius^2
		
		uniformLoc = gl.getUniformLocation(shader, "fKrESun" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.rayleighConstant * scene.lighting.planet.sunBrightness); // Kr * ESun
		
		uniformLoc = gl.getUniformLocation(shader, "fKmESun" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.mieConstant * scene.lighting.planet.sunBrightness); // Km * ESun
		
		uniformLoc = gl.getUniformLocation(shader, "fKr4PI" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.rayleighConstant * 4 * Math.PI); // Kr * 4 * PI
		
		uniformLoc = gl.getUniformLocation(shader, "fKm4PI" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.mieConstant * 4 * Math.PI); // Km * 4 * PI
		
		var atmoScale = 1/(this.atmosphereRadius - radius);
		uniformLoc = gl.getUniformLocation(shader, "fScale" ); 
		gl.uniform1f(uniformLoc, atmoScale); // 1 / (fOuterRadius - fInnerRadius)
		
		uniformLoc = gl.getUniformLocation(shader, "fScaleDepth" ); 
		gl.uniform1f(uniformLoc, 0.25); // The scale depth (i.e. the altitude at which the atmosphere's average density is found)
		
		uniformLoc = gl.getUniformLocation(shader, "fScaleOverScaleDepth" ); 
		gl.uniform1f(uniformLoc, atmoScale/0.25); // fScale / fScaleDepth
		
		uniformLoc = gl.getUniformLocation(shader, "g" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.mieG); 
			
		uniformLoc = gl.getUniformLocation(shader, "g2" ); 
		gl.uniform1f(uniformLoc, scene.lighting.planet.mieG * scene.lighting.planet.mieG);	
};

QuadPlanet.prototype._rebuildMapData = function() 
{
	
	this.positions = null;
	this.textureCoords = null;
	this.splatCoords = null;
	this.nodeCount = null;
	this.indicies = null;

	this.positions = new Array();
	this.textureCoords = new Array();
	this.splatCoords = new Array();
	this.nodeCount = 0;
	this.indicies = new Array();
	
	var glData =
		{
			position: new Array(),
			uv: new Array(),
			nodeCount: 0
		};
	for(var i = 0; i < 6; i++) 
	{
		this.rootNodes[i]._prepareMapData(glData);		
	}
	this.positions = glData.position;
	this.splatCoords = glData.uv;
	this.nodeCount = glData.nodeCount;
	
	var texture = [
      	0.0, 1.0,
      	1.0, 1.0,
      	0.0, 0.0,
     	1.0, 0.0,
	];
	
	var u = 0;
	var texCoords = [];
	for(var i = 0; i < this.positions.length; i++) 
	{
		texCoords.push(texture[u]); 
		texCoords.push(texture[u+1]);
		u += 2;	
		if(u > 6) {u = 0;};
	}
	this.textureCoords = texCoords;

	var a = 0, flip = false;
	for(var i = 0; i < this.nodeCount * 6; i+=3) 
	{		
		if(flip == false) 
		{
			this.indicies[i] = a;
			this.indicies[i+1] = a+1;
			this.indicies[i+2] = a+2;
			flip = true;
		}
		else 
		{
			this.indicies[i] = a;
			this.indicies[i+1] = a-1;
			this.indicies[i+2] = a+1;
			flip = false;
		}
		
		a+=2;
	}
};

QuadPlanet.prototype._bindData = function (gl) 
{
			 	
	 	this.planetBuffer = null;
	 	this.vertBuffer = null;
	 	this.textureBuffer = null;
    	this.splatBuffer = null;
		this.indexBuffer = null;
		this.normalBuffer = null;
		
	 	this.planetBuffer = gl.createBuffer();
	 	this.vertBuffer = gl.createBuffer();
	 	this.textureBuffer = gl.createBuffer();
    	this.splatBuffer = gl.createBuffer();
		this.indexBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.DYNAMIC_DRAW);
	    	
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.splatBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.splatCoords), gl.DYNAMIC_DRAW);
	    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), gl.DYNAMIC_DRAW);
        this.indexBuffer.numItems = this.indicies.length;	
        
};

QuadPlanet.prototype._buildQuadPlanet = function(gl, planet) 
{	
	/*
	 * Base cube to create planet
	 */
	var self = this;
	var basePlanetVerts = 
	[
    //x    y    z(+ = forward)
    // Front
    -1.0,  1.0,  1.0,
    1.0,   1.0,  1.0,
    -1.0, -1.0,  1.0,
    1.0,  -1.0,  1.0,
    // Back          
    1.0,   1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  -1.0, -1.0,
    -1.0, -1.0, -1.0,

    // Left          
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,

    // Right         
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0,  1.0,
    1.0, -1.0, -1.0,

    // Top           
    -1.0, 1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0, 1.0, -1.0,
    1.0,  1.0, -1.0,

    // Bottom        
    1.0,  -1.0,  1.0,
    -1.0, -1.0,  1.0,
    1.0,  -1.0, -1.0,
    -1.0, -1.0, -1.0,
    ];
    
    var baseSplat = 
    [
   		0.0, 1.0,
      	1.0, 1.0,
      	0.0, 0.0,
     	1.0, 0.0,
	];
    
    for (var i = 0; i < 6; i++) 
    {
		this.rootNodes[i] = new QuadPlanetNode(0, i, -1, self);
	}
    
    var parent = null;
    var parsedVerts;
	// Front
	parsedVerts = basePlanetVerts.slice(0,12);
	this.rootNodes[frontFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	// Back
	parsedVerts = basePlanetVerts.slice(12,24);
	this.rootNodes[backFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	// Left
	parsedVerts = basePlanetVerts.slice(24,36);
	this.rootNodes[leftFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	// Right
	parsedVerts = basePlanetVerts.slice(36,48);
	this.rootNodes[rightFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	// Top
	parsedVerts = basePlanetVerts.slice(48,60);
	this.rootNodes[topFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	// Bottom
	parsedVerts = basePlanetVerts.slice(60,72);
	this.rootNodes[bottomFace]._buildNode(gl, parsedVerts, baseSplat, parent, self);
	
	this._rebuildMapData();
	this._bindData(gl);
};

QuadPlanet.prototype.setOrbit = function (distance, time) 
{
};

QuadPlanet.prototype.getPlanetData = function () 
{
	var self = this;
	return self;
};  

QuadPlanet.prototype._buildAtmosphere = function (gl)
{
	var self = this;
	self.atmosphere = {};
	var vertices = [];
	var vertexIndices = [];
	
	var radius = self.atmosphereRadius;
	var latitudeBands = 120;
    var longitudeBands = 120;
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
  	
  	self.atmosphere.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,self.atmosphere.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    self.atmosphere.vertexPositionBuffer.itemSize = 3;
    self.atmosphere.vertexPositionBuffer.numItems = vertices.length/3;
    
    self.atmosphere.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,self.atmosphere.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(vertexIndices),gl.STATIC_DRAW);
    self.atmosphere.vertexIndexBuffer.itemSize = 1;
    self.atmosphere.vertexIndexBuffer.numItems = vertexIndices.length;
};