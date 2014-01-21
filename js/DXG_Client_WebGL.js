/*
 * William Miller 2012
 */
// Global ref
var client;
$(document).ready( function() {
	client = new ClientGL();
	client.init();
	client.load("solarSim");
});

/*
 * @class ClientGL
 */
var ClientGL = function()
{
	
};

ClientGL.prototype.init = function()
{
	var self = this;
	var canvas = document.getElementById("webglCanvas");
    var frame = document.getElementById("client-frame");
    var fpsCounter = document.getElementById("fps");
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    this.canvasGL = canvas;
    this.gl = initGL(this.canvasGL);
   	if(!this.gl)
    {
    	alert("Webgl failed to start!");
    }	
   	
   	this.scene = null;
   	
    startRenderLoop(canvas,function(timing) 
   	{
    	//fpsCounter.innerHTML = timing.framesPerSecond;
        self.runClient(timing);
    });
};

ClientGL.prototype.load = function(sceneName)
{
	if(sceneName == "solarSim")
	{
		this.scene = new PlanetScene(this.gl, this.canvasGL); 	
	}	
	else
	{
		this.scene = null;
	}
};


ClientGL.prototype.runClient = function(timing)
{
	if(this.scene != null)
	{
		if(this.scene.ready == true)
		{
			this.scene.update(timing);
			this.scene.render(timing);	
		}	
	}
	else
	{
		//DXG_LOG("Scene not loaded!");
	}
};