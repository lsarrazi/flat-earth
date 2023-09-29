#extension GL_OES_standard_derivatives:enable

precision mediump float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uPosition;
uniform float uUnzoom;
uniform vec4 uColor;
uniform float uLineThinness;

uniform vec4 objects[16];

const int objectsCount=OBJECTS_COUNT;

vec2 computeSpaceCurvature(vec2 uv)
{
    for(int i=0;i<objectsCount;i++)
    {
        vec4 object=objects[i];
        float distX=uv.x-object.x;
        float distY=uv.y-object.y;
        float r=length(uv-object.xy);
        float mass=object.z;
        float radius=object.w;
        float k=.1;
        float dr=k*mass/(r*r+radius);
        
        uv.x+=distX*dr;
        uv.y+=distY*dr;
    }
    return uv;
}

vec4 drawObjectsDebug(vec2 uv){
    vec4 outputColor=vec4(0);
    for(int i=0;i<objectsCount;i++)
    {
        vec4 object=objects[i];
        
        float dist=length(uv-object.xy);
        
        float circleThickness=2.*length(fwidth(uv));
        
        float intensity=smoothstep(circleThickness,circleThickness/2.,dist-1.+circleThickness/2.)*smoothstep(0.,circleThickness/2.,dist-1.+circleThickness/2.);
        outputColor+=vec4(intensity,0,0,intensity);
        
    }
    return outputColor;
}

#define PI 3.1415926538

mat4 projectionMatrix(float angleOfView,float near,float far)
{
    // set the basic projection matrix
    float scale=1./tan(angleOfView*.5*PI/180.);
    mat4 M=mat4(0);
    M[0][0]=scale;//scale the x coordinates of the projected point
    M[1][1]=scale;//scale the y coordinates of the projected point
    M[2][2]=-far/(far-near);//used to remap z to [0,1]
    M[3][2]=-far*near/(far-near);//used to remap z [0,1]
    M[2][3]=-1.;//set w = -z
    
    return M;
}

vec4 grid(vec2 coords,float density,float linesThinness,vec2 position,float unzoom,vec4 color)
{
    coords+=position;
    coords*=unzoom;
    
    coords=computeSpaceCurvature(coords);
    
    vec2 uv=coords*density;
    vec2 grid=abs(fract(uv-.5)-.5)/fwidth(uv);
    float line=min(grid.x,grid.y)*linesThinness;
    float colorIntensity=1.-min(line,1.);
    vec4 outputPixel=vec4(colorIntensity*color.rgb,colorIntensity);
    
    #ifdef DRAW_OBJECTS_DEBUG
    outputPixel+=drawObjectsDebug(coords);
    #endif
    
    return outputPixel;
}

void main()
{
    // Screen coordinates to math coordinates ( [-1 ; 1] range )
    vec2 coords=(2.*gl_FragCoord.xy-uResolution.xy)/uResolution.y;
    
    // Grid parameters
    float gridDensity=1.;
    float gridLinesThinness=uLineThinness;
    float gridUnzoom=uUnzoom;
    vec2 gridPosition=uPosition;
    vec4 gridColor=uColor;
    
    // Output to screen
    
    vec4 secondGrid=grid(coords,gridDensity*4.,gridLinesThinness*2.,gridPosition,gridUnzoom,gridColor);
    
    vec4 primaryGrid=grid(coords,gridDensity,gridLinesThinness,gridPosition,gridUnzoom,gridColor);
    
    gl_FragColor=mix(secondGrid,primaryGrid,.5);
    
}
