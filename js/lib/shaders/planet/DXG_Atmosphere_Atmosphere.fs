/*
* William Miller 2012
* Space Atmosphere Shader
* Fragment Shader	
*/

	precision mediump float;
			
	uniform float g;
	uniform float g2;

	varying vec4 vColor;
	varying vec4 vSecondaryColor;
			
	varying vec3 v3Direction;
	varying vec3 vLightPos;			
			
	void main(void) 
	{
		float fCos = dot(vLightPos, v3Direction) / length(v3Direction);
		float fMiePhase = 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos*fCos) / pow(1.0 + g2 - 2.0*g*fCos, 1.5);
		gl_FragColor = vColor + fMiePhase * vSecondaryColor;
		//gl_FragColor.a = gl_FragColor.r;
		gl_FragColor.a = 1.0;
	}