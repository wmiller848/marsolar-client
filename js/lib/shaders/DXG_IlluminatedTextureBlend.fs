/*
* William Miller 2012
* Illuminated Texture Blending Shader
* Fragment Shader	
*/
	precision mediump float;

	varying vec2 vSplat0;
	varying vec2 vTexture;
	varying vec3 vLightWeighting;
		    
	uniform sampler2D splatMap0;	
	uniform sampler2D texture0, texture1, texture2; 
			
	void main(void) 
	{
 		vec4 RedChannel = texture2D(texture0,vec2(vTexture.s, vTexture.t));
		vec4 GreenChannel = texture2D(texture1,vec2(vTexture.s, vTexture.t));
		vec4 BlueChannel = texture2D(texture2,vec2(vTexture.s, vTexture.t));
				
		vec4 SplatCol = texture2D(splatMap0,vec2(vSplat0.s, vSplat0.t));
				  				
   		vec4 fragmentColor = (vec4(SplatCol.r*RedChannel+SplatCol.g*GreenChannel+SplatCol.b*BlueChannel)) * vec4(1,1,1,SplatCol.a);
		gl_FragColor = vec4(fragmentColor.rgb, fragmentColor.a);
	}
		