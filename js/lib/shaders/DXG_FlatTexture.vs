/*
* William Miller 2012
* Flat Texture Shader
* Vertex Shader	
*/
	attribute vec3 aVertexPosition;
	attribute vec2 aTextureCoord;

	uniform mat4 uViewMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;

	varying vec2 vTextureCoord;

	void main(void)
	{
		mat4 modelViewMat=uViewMatrix*uMVMatrix;

		vec4 vPosition=modelViewMat*vec4(aVertexPosition,1.0);
		gl_Position=uPMatrix*vPosition;
		vTextureCoord=aTextureCoord;
	}