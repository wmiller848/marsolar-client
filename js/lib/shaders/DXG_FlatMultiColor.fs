/*
* William Miller 2012
* Flat Texture Shader
* Fragment Shader	
*/

	precision mediump float;

	varying vec4 vColor;

	void main(void) 
	{
		gl_FragColor=vColor;
	}