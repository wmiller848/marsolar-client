/*
* William Miller 2012
* Deffered Shader
* Vertex Shader	
*/

	attribute vec3 position;
    attribute vec2 texture;
    
    uniform mat4 viewMat;
    uniform mat4 projectionMat;
        
    varying vec2 texCoord;
    
    void main(void) 
    {
    	vec4 vPosition = viewMat * vec4(position, 1.0);
     	texCoord = texture;
     	gl_Position = projectionMat * vPosition;
   	}