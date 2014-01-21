/*
* William Miller 2012
* Illuminated Texture Blending Shader
* Vertex Shader	
*/

	attribute vec3 position;
   	attribute vec2 texture;
	attribute vec3 normal;
	attribute vec2 splat0;
		
	uniform mat4 viewMat;
	uniform mat4 projectionMat;
	uniform mat3 normalMat;
		
	uniform vec3 uAmbientColor;",
		
	uniform vec3 uPointLightingLocation;
	uniform vec3 uPointLightingColor;
		
	uniform bool uUseLighting;
		
	varying vec2 vTexture;
	varying vec2 vSplat0;
	varying vec3 vLightWeighting;
		
	void main(void) 
	{
		vec4 mvPosition = viewMat * vec4(position, 1.0);
		gl_Position = projectionMat * mvPosition;
		vTexture = texture;
		vSplat0 = splat0;
		
		if (!uUseLighting) 
		{
			vLightWeighting = vec3(1.0, 1.0, 1.0);
		} 
		else 
		{
			vec3 lightDirection = normalize(uPointLightingLocation - mvPosition.xyz);
		
			vec3 transformedNormal = normalMat * normal;",
			float directionalLightWeighting = max(dot(transformedNormal, lightDirection), 0.0);",
			vLightWeighting = uAmbientColor + uPointLightingColor * directionalLightWeighting;",
		}
	} 
	
	
	