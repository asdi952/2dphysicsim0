import { geterror } from "../error";
import { Matrix4x4, Ptr, Vec2 } from "../primitives";
import type { Mesh } from "./mesh";
import type { RenderContext } from "./render";



//------------------------------------------------------------------------------
function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        throw geterror("Unable to create shader.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check for compilation errors
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw geterror("Could not compile shader:\n" + infoLog);
    }

    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) throw geterror("Unable to create program.");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw geterror("Program failed to link:\n" + infoLog);
    }

    return program;
}


function create_shaderserverbindings(gl:WebGL2RenderingContext, program:WebGLProgram):ShaderNeededBindings{
    const vattributes = new Map<string, ShaderBindingDescription>()
    let len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < len; i++) {
        const info = gl.getActiveAttrib(program, i);
        if (!info) continue;

        const location = gl.getAttribLocation(program, info.name);

        vattributes.set(info.name, new ShaderBindingDescription(
            info.name,
            location,
            info.type,
        ))
    }

    const uniforms = new Map<string, ShaderBindingDescription>()
    len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < len; i++) {
        const info = gl.getActiveUniform(program, i);
        if (!info) continue;

        const location = gl.getUniformLocation(program, info.name);
        
        uniforms.set(info.name, new ShaderBindingDescription(
            info.name,
            location as number,
            info.type,
        ))
    }

    return new ShaderNeededBindings( vattributes, uniforms)
}

class VertexAttributeDescription{
    constructor(
        public type:Function,
        public webgltype:GLenum,
        public indexspervertex:number,
        public indextype:GLenum,
        public bytesize:number,
        public stride:number
    ){}

    static create(type:Function){
        switch(type){
            case Matrix4x4:
                return new VertexAttributeDescription(
                    type,
                    WebGL2RenderingContext.FLOAT_MAT4,
                    4,
                    WebGL2RenderingContext.FLOAT,
                    4*4*4,
                    4*4,
                )
            case Vec2:
                return new VertexAttributeDescription(
                    type,
                    WebGL2RenderingContext.FLOAT_VEC2,
                    2,
                    WebGL2RenderingContext.FLOAT,
                    2*4,
                    2*4,
                )
                default:
                    throw geterror(`type ${type} not implemtnted`)
        }
    }
}




function get_webgltype(type:Function){
    switch(type){
        case Matrix4x4:return WebGL2RenderingContext.FLOAT_MAT4
        case Vec2:return WebGL2RenderingContext.FLOAT_VEC2
        default:
            throw geterror(`webgltype for ${type} not implemented`)
    }
}


export class ShaderBindingDataDescription{
    constructor(
        public name:string,
        public type:Function,
        public perinstance:number,
        public data:any
    ){}
}

export class ShaderBindingDataDescriptions{
    constructor(
        public vattributes:ShaderBindingDataDescription[],
        public uniforms:ShaderBindingDataDescription[],
    ){}
}


class ShaderBindingDescription{
    constructor(
        public name:string,
        public location:number,
        public webgltype:GLenum,
    ){}
}

class ShaderBindingDescriptions{
    constructor(
        public vattributes:Map<string, ShaderBindingDescription>,
        public uniforms:Map<string, ShaderBindingDescription>,
    ){}
}

class ShaderBinding{
    constructor(
        public name:string,
        public attrdesc:VertexAttributeDescription,
        public perinstance:number,
        public location:number,
        public databinding: ShaderBindingDataDescription,
    ){}
}

class ShaderBindingsList{
    constructor(
        public vattributes:ShaderBinding[],
        public uniforms:ShaderBinding[],
    ){}
}

class ShaderBindingInstanceDataLink{
    constructor(
        public instancer:RenderObjInstancer,
        public attrindex:number,
        public instanceindex:number,
        public datatype:Function,
    ){}

    set(data:any){
        if(!(data instanceof this.datatype)){throw geterror(`data should be type ${this.datatype} and is type ${typeof data}`)}
        this.instancer.set()
    }
}
class ShaderBindingVertexDataLink{
    constructor(
        public instancer:RenderObjInstancer,
        public attrindex:number,
        public datatype:Function,
    ){}

    set(data:any){
        if(!(data instanceof this.datatype)){throw geterror(`data should be type ${this.datatype} and is type ${typeof data}`)}
        this.instancer.set()
    }
}

class ShaderBindingLinks{
    constructor(
        vertexdatalinks: ShaderBindingVertexDataLink[],
        instanceddatalinks: ShaderBindingInstanceDataLink[],
    ){}
}

export function create_shaderbindingslist(gl:WebGL2RenderingContext, neededBindings:ShaderNeededBindings, wantedbidings:ShaderWantedBindings[]){
    const vattributes = []
    const uniforms = []

    for(const biding of wantedbidings){
        for(const [wvname, wvtype] of biding.vattributes){
            const nvdesc = neededBindings.vattributes.get(wvname)
            if(nvdesc == undefined){throw geterror(`server has no binding called ${wvname}`)}

            if(wvtype != nvdesc.webgltype){ throw geterror(`the vertex attribute ${wvname} binding does not have the same type ${wvtype} - ${nvdesc.webgltype} `)}

            vattributes.push(new ShaderBinding(
                wvname,
                VertexAttributeDescription.create(wvtype),
                wvtype.perinstance,
                nvdesc.location,
                cvdata.data,
            ))
        }

        for(const [cvname, cvdata] of client.uniforms){
            const svdesc = server.uniforms.get(cvname)
            if(svdesc == undefined){throw geterror(`server has no binding called ${cvname}`)}

            if(cvdata.webgltype != svdesc.webgltype){ throw geterror(`the vertex attribute ${cvname} binding does not have the same type ${cvdata.webgltype} - ${svdesc.webgltype} `)}

            uniforms.push(new ShaderBinding(
                cvname,
                VertexAttributeDescription.create(gl, cvdata.data.ptr),
                cvdata.perinstance,
                svdesc.location,
                cvdata.data,
            ))
        }
    }
    return new ShaderBindingsList(vattributes, uniforms)
}

class RenderObjInstanceData{
    constructor(
        public data:Float32Array,
        public binding:ShaderBinding,
        public vbo:WebGLBuffer,
    ){}
}

class RenderObjVertexData{
    constructor(
        public binding:ShaderBinding,
        public vbo:WebGLBuffer,
    ){}
}

class RenderObjFacesIndex{
    constructor(
        public vbo:WebGLBuffer,
    ){}
}

class RenderObjInstancer{
    instancesdata: RenderObjInstanceData[] = []
    vertexattrsdata:RenderObjVertexData[] = []

    vao:WebGLVertexArrayObject
    elmindex_vbo:WebGLBuffer
    constructor(
        gl:WebGL2RenderingContext,
        public mesh:Mesh,
        public bindings:ShaderBindingsList,
    ){
        this.vao = gl.createVertexArray()
        gl.bindVertexArray(this.vao) 
        
        
        for(const attr of bindings.vattributes){
            const vbo = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
            gl.bufferData(gl.ARRAY_BUFFER, null, gl.STATIC_DRAW)
            
            const iterations = attr.attrdesc.bytesize / attr.attrdesc.stride
            for(let i=0; i<iterations; i++){
                const loc = attr.location + i;
                
                gl.vertexAttribPointer(loc, attr.attrdesc.indexspervertex, attr.attrdesc.indextype, false, attr.attrdesc.stride, attr.attrdesc.bytesize)
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribDivisor(loc,attr.perinstance)
            }
            
            if(attr.perinstance == 0){
                const vertexattr = new RenderObjVertexData(attr, vbo)
                const index = this.vertexattrsdata.length
                this.vertexattrsdata.push(vertexattr)
                
                const link = new ShaderBindingVertexDataLink(this, index, attr.attrdesc.type)
            }else{
                const instance = new RenderObjInstanceData(new Float32Array([]),attr, vbo)
                const instanceindex = 0
                const attrindex = this.instancesdata.length
                this.instancesdata.push(instance)
                
                const link = new ShaderBindingInstanceDataLink(this, attrindex, instanceindex, attr.attrdesc.type)
            }
        }

        const links = new ShaderBindingLinks()
        
        this.elmindex_vbo = gl.createBuffer()
        gl.bindBuffer

        gl.bindVertexArray(null)
    }

    render(gl:WebGL2RenderingContext){
        gl.bindVertexArray(this.vao)
        gl.drawElementsInstanced( this.mesh.faceshape, this.mesh.faceindex.length, gl.UNSIGNED_SHORT, 0,this.instancescount)
    }   
}


export type ShaderSources =  {
    vertsource:string
    fragsource:string
}

export const ShaderV0:ShaderSources = {
    vertsource: `#version 300 es
        in vec2 position;
        uniform mat4 mvp;

        void main() {
            gl_Position = mvp * vec4(position,0,1) ;
        }`,

    fragsource: `#version 300 es
        precision highp float;
        out vec4 ocolor;
        void main() {
            ocolor = vec4(1, 0, 0, 1); // red
        }`, 
}

export function build_shader(gl:WebGL2RenderingContext, sources:ShaderSources):Shader{
    const vertsh = createShader(gl, gl.VERTEX_SHADER, sources.vertsource)
    const fragsh = createShader(gl, gl.FRAGMENT_SHADER, sources.fragsource)

    const program = createProgram(gl, vertsh, fragsh)
    
    const shaderbindings = create_shaderserverbindings(gl, program)

    gl.deleteShader(vertsh)
    gl.deleteShader(fragsh)


    return new Shader(sources, program, shaderbindings)
}


export class Shader{
    constructor(
        public sources:ShaderSources,
        public program:WebGLProgram,
        private serverbindings:ShaderNeededBindings,
    ){}

    create_shaderbindings(){
        return Object.assign({},this.serverbindings)
    }

}
