/*
* William Miller 2012
* Terrain Texture Blending Shader
* Fragment Shader	
*/

	precision mediump float;
			
	varying vec4 vColor;
	varying vec4 vSecondaryColor;
	varying vec2 vSplat0;
	varying vec2 vTexture;
	    
	uniform sampler2D splatMap0;	
		   	
	uniform sampler2D texture0, texture1, texture2;
			
	void main(void) 
	{
 		 
		vec4 RedCol = texture2D(texture0,vec2(vTexture.s, vTexture.t));
		vec4 GreenCol = texture2D(texture1,vec2(vTexture.s, vTexture.t));
		vec4 BlueCol = texture2D(texture2,vec2(vTexture.s, vTexture.t));
					
		vec4 SplatCol = texture2D(splatMap0,vec2(vSplat0.s, vSplat0.t));
					  				
	   	vec4 fragmentColor = (vec4(SplatCol.r*RedCol+SplatCol.g*GreenCol+SplatCol.b*BlueCol)) * vec4(1,1,1,SplatCol.a);
		gl_FragColor = vColor + fragmentColor * vSecondaryColor;
	}