/*
* William Miller 2012
* Deffered Shader
* Fragment Shader	
*/

	uniform sampler2D screenTexture;
   	uniform sampler2D positionTexture;
    varying vec2 texCoord;
    void main(void) 
    {
		gl_FragColor = texture2D(screenTexture, texCoord);
    }