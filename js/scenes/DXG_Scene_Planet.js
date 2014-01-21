/*
 * William Miller 2012
 * 
 */
	
var PlanetScene = function(gl, canvas)
{
	var self = this;
	this.ready = false;
	// Store gl reference
	this.gl = gl;
	this.textureManager = new GLTextureManger();
	this.textureManager.init(this.gl);
	// Create a camera
	this.camera = new DXG_QuaternionCamera();
	this.camera.init(canvas);
	this.camera.setPosition([100.0, 0.0, 500.0]);
	this.camera.setAngles([0,0,0]); // Converts to quaternion
	
	//this.camera = new DXG_OrbitalCamera(100);
	//this.camera.init(canvas);
	//this.camera.setCenter[0.0,0.0,500.0]
	// Scene projection matrixes
	this.projectionMatrix = mat4.create();
	this.canvasWidth = canvas.width, this.canvasHeight = canvas.height;
	// Renderer
	this.renderer = new DXGWebGL_Render();
	this.renderer.resize(this.gl, self, canvas);
	frustum = mat6x4.frustum(this.projectionMatrix, this.camera.getViewMatrix(), frustum);
	
	this.gl.clearColor(1.0,1.0,1.0,1.0); // white
  	this.gl.enable(this.gl.DEPTH_TEST); //Enable debth testing
	
	// Number of assets
	var numShaders = 6;
	var numModels = 1;
	var numTextures = 0;
	this.maxAssets = (numShaders*2) + numModels + numTextures;
	DXG_LOG("Assets to load: " + this.maxAssets);
	this.assetCount = 0;
	
	// Planet scene shaders
	this.shaders =
  	{
  		// Shader prototypes
  		shaderPrototypes:
  		{
  			flatTextureProto:
			{
				name: "js/lib/shaders/DXG_FlatTexture",
				attribs: ["aVertexPosition", "aTextureCoord"],
				uniforms: ["uViewMatrix", "uMVMatrix", "uPMatrix", "uSampler"],
				fs: null,
				vs: null
			},
			multiColorProto:
			{
				name: "js/lib/shaders/DXG_FlatMultiColor",
				attribs: ["aVertexPosition", "aColor"],
				uniforms: ["uViewMatrix", "uMVMatrix", "uPMatrix"],
				fs: null,
				vs: null
			},
			terrain_AtmosphereProto:
			{
				name: "js/lib/shaders/planet/DXG_Terrain_Atmosphere",
				attribs: ["position", "texture", "splat0"],
				uniforms: ["viewMat", "modelMat", "projectionMat"],
				fs: null,
				vs: null
			},
			terrain_SpaceProto:
			{
				name: "js/lib/shaders/planet/DXG_Terrain_Space",
				attribs: ["position", "texture", "splat0"],
				uniforms: ["viewMat", "modelMat", "projectionMat"],
				fs: null,
				vs: null
			},
			atmosphere_AtmosphereProto:
			{
				name: "js/lib/shaders/planet/DXG_Atmosphere_Atmosphere",
				attribs: ["position"],
				uniforms: ["viewMat", "modelMat", "projectionMat"],
				fs: null,
				vs: null
			},
			atmosphere_SpaceProto:
			{
				name: "js/lib/shaders/planet/DXG_Atmosphere_Space",
				attribs: ["position"],
				uniforms: ["viewMat", "modelMat", "projectionMat"],
				fs: null,
				vs: null
			}
  		},
		// Shader types
  		defaultShaders:
  		{
  			// Shader objects
  			texture: null,
  			color: null,
  			deferred: null
  		},
  		planetShaders:
  		{
  			// Shader objects
  			terrain_Atmosphere: null,
  			terrain_Space: null,
  			atmosphere_Atmosphere: null,
  			atmosphere_Space: null
  		},
  		numShaders: numShaders
  	};
	
	// Load up our shaders
	var shaderPrototypes = this.shaders.shaderPrototypes;
	// Default Shaders
	initShader(self.gl, self, shaderPrototypes.flatTextureProto.name);
	initShader(self.gl, self, shaderPrototypes.multiColorProto.name);
	// Planet Shaders
	initShader(self.gl, self, shaderPrototypes.terrain_AtmosphereProto.name);
	initShader(self.gl, self, shaderPrototypes.terrain_SpaceProto.name);
	initShader(self.gl, self, shaderPrototypes.atmosphere_AtmosphereProto.name);
	initShader(self.gl, self, shaderPrototypes.atmosphere_SpaceProto.name);
	
	this.lighting =
	{
		planet:
		{
			redWaveLength: 0.650,	
			greenWaveLength: 0.580,
			blueWaveLength: 0.475,
			mieConstant: 0.0015,
			rayleighConstant: 0.0025,
			mieG: -0.980,
			sunBrightness: 30.0,	
		},
		space:
		{
			
		}
	};
	
	var planetTarbaProto =
	{
		center: [0.0, 100.0, -10000.0],
		radius: 5000,
		seed: 2049,
		uniqueID: 0,
		splitFactor: 36.0,
		rotation: 0.0,
		obliquity: 0.0,
		textureManager: self.textureManager,	
		heightMapPath: [
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif"
		]
	};
	
	var planetJimboProto =
	{
		center: [3000.0, 0.0, 0.0],
		radius: 100,
		seed: 2049,
		uniqueID: 1,
		splitFactor: 0.8,
		rotation: 0.0,
		obliquity: 0.0,
		textureManager: self.textureManager,	
		heightMapPath: [
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif",
			"assets/maps/defaultMap1.gif"
		]
	};
	
	this.planets = 
	[
		new QuadPlanet(self.gl, planetJimboProto),
		new QuadPlanet(self.gl, planetTarbaProto),
	];
	// Scene Objects
	this.sceneObjects = new Array();
	initDXGModelObject(this.gl, self, "environment", "skybox", "assets/textures/space.jpg", this.assetLoaded);
	initDXGModelObject(this.gl, self, "primitive", "sphere", "assets/textures/sun1024.png", this.assetLoaded);
};

/*
 * Update/Render methods
 */
// Update
PlanetScene.prototype.update = function(timing)
{
	var self = this;
	var planets = self.planets;
	frustum = mat6x4.frustum(this.projectionMatrix, this.camera.getViewMatrix(), frustum);
	this.renderer.update(self, timing);
	for(var i = 0; i < planets.length; i++)
	{
		var planet = planets[i];
		if(planet.ready == true)
		{
			planet.updateFrame(this.gl, self, timing);	
			this.camera.update(planets, timing);
		}
	}
	
	updateLimit = 0;
};
// Render
PlanetScene.prototype.render = function(timing)
{
	var self = this;
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	this.renderer.drawScene(this.gl, self);
	var planets = this.planets;
	for(var i = 0; i < planets.length; i++)
	{
		var planet = planets[i];
		if(planet.ready == true)
		{
			planet.renderFrame(this.gl, self, timing);
		}
	}
};
/* 
 * Asset control methods
 * 
 */
PlanetScene.prototype.loadComplete = function()
{
	DXG_LOG("Scene load complete", this);
	this.ready = true;
};

PlanetScene.prototype.assetLoaded = function(asset, properties)
{
	var self = this;
	if(self == window) { self = self.client.scene; }
	var type = "";
	if(!properties) 
	{ 
		type = asset.properties.assetType;
	}
	else
	{
		type = properties.assetType;
	}
	// Look at what type of asset it is
	if(type == "shader")
	{
		// Load shader component
		self.shaderPrototype(asset, properties);
	}
	else if(type == "model")
	{
		// Load model
		self.modelPrototype(asset);
	}
	else if(type == "texture")
	{
		// Run texture callback
		properties.callback(asset);
	}
	
	self.assetCount++;
	if(self.assetCount == self.maxAssets)
	{
		self.loadComplete();
	}
};

PlanetScene.prototype.modelPrototype = function(asset)
{
	if(asset.name == "skybox")
	{
		addObjectInstance(asset);
		setObjectInstancePosition(asset.instances[0],vec3.create([0.0, 0.0, 0.0]));  	
  		setObjectInstanceScale(asset.instances[0],100000);
  		setObjectInstanceSpeed(asset.instances[0],0.0);
  		asset.loaded = true;
	}
	else
	{
		addObjectInstance(asset);
		setObjectInstancePosition(asset.instances[0],vec3.create([0.0, 0.0, 0.0]));  	
  		setObjectInstanceScale(asset.instances[0],500);
  		setObjectInstanceSpeed(asset.instances[0],0.0);
  		asset.loaded = true;
	}
	this.sceneObjects.push(asset);
};
PlanetScene.prototype.shaderPrototype = function(asset, properties)
{
	/*
	 * Default Shaders
	 */
	var shaderName = properties.name;
	// Flat texture shader
	if(shaderName == this.shaders.shaderPrototypes.flatTextureProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.flatTextureProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.defaultShaders.texture = compileShader(this.gl, shaderProto);
	}
	// Flat color shader
	else if(shaderName == this.shaders.shaderPrototypes.multiColorProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.multiColorProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.defaultShaders.color = compileShader(this.gl, shaderProto);
	}
	/*
	 * Planet Shaders
	 */
	// Illuminated Terrain Shader Atmosphere
	else if(shaderName == this.shaders.shaderPrototypes.terrain_AtmosphereProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.terrain_AtmosphereProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.planetShaders.terrain_Atmosphere = compileShader(this.gl, shaderProto);
	}
	// Illuminated Terrain Shader Space
	else if(shaderName == this.shaders.shaderPrototypes.terrain_SpaceProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.terrain_SpaceProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.planetShaders.terrain_Space = compileShader(this.gl, shaderProto);
	}
	// Illuminated Atmosphere Shader Atmosphere
	else if(shaderName == this.shaders.shaderPrototypes.atmosphere_AtmosphereProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.atmosphere_AtmosphereProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.planetShaders.atmosphere_Atmosphere = compileShader(this.gl, shaderProto);
	}
	// Illuminated Atmosphere Shader Space
	else if(shaderName == this.shaders.shaderPrototypes.atmosphere_SpaceProto.name)
	{
		var shaderProto = this.shaders.shaderPrototypes.atmosphere_SpaceProto;
		if(properties.type == "fs")
		{
			shaderProto.fs = asset;
		}
		else if(properties.type == "vs")
		{
			shaderProto.vs = asset;
		}
		
		if(!shaderProto.fs) { return;}
		if(!shaderProto.vs) { return;}
		
		this.shaders.planetShaders.atmosphere_Space = compileShader(this.gl, shaderProto);
	}
};
