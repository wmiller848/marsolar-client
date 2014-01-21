/*
* William Miller 2012
* Flat Texture Shader
* Fragment Shader	
*/

	precision mediump float;

	varying vec2 vTextureCoord;

	uniform sampler2D uSampler;

	void main(void)
	{
		gl_FragColor=texture2D(uSampler,vec2(vTextureCoord.s,vTextureCoord.t));
	}