import { geterror } from "../error";
import { Matrix4x4, Ptr, Vec2 } from "../primitives";
import type { ArrayDataType, Mesh, MeshPrimitiveData } from "./mesh";
import type { RenderContext } from "./render";
import { get_webgltype, getGLTypeInfo, type GLTypeInfo } from "./webgl";



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


function create_shaderBindingDescriptions(gl:WebGL2RenderingContext, program:WebGLProgram):ShaderBindingDescriptions{
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
            info.size,
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
            info.size,
        ))
    }

    return new ShaderBindingDescriptions( vattributes, uniforms)
}

//---------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------
class ShaderBindingVertexAttr{
    link?:RenderObjVertexAttribute
    constructor(
        public datastride:number,
        public dataoffset:number,
    ){}
}

class ShaderBindingInstanceAttr{
    link?:RenderObjInstanceAttribute
    constructor(
        public perinstance:number,
    ){
        if(this.perinstance == 0){throw geterror("perinstance cant be 0, for that use ShaderBindingTypeIntanceAttr")}
    }
}

class ShaderBindingUniform{
    link?:RenderObjUniform
    constructor(
    ){}
}

type ShaderBindingType = ShaderBindingVertexAttr | ShaderBindingInstanceAttr | ShaderBindingUniform

class ShaderBindingDescriptionReq<T extends ShaderBindingType>{
    constructor(
        public name:string,
        public datatype:Function,
        public arraylength:number,
        public bindingtype:T,
    ){}
}

class ShaderBindingDescriptionReqs{
    constructor(
        public vertexattrs:ShaderBindingDescriptionReq<ShaderBindingVertexAttr>[],
        public instanceattrs:ShaderBindingDescriptionReq<ShaderBindingInstanceAttr>[],
        public uniforms:ShaderBindingDescriptionReq<ShaderBindingUniform>[],
    ){}
}

const reqs = new ShaderBindingDescriptionReqs([
    {name:"position", datatype:Vec2, arraylength:1, bindingtype: {dataoffset:0, datastride:0}},
    {name:"color", datatype:Vec3, arraylength:1, bindingtype: {dataoffset:0, datastride:0}},
],[
    {name:"sdgdsfs", datatype:Matrix4x4, arraylength:1, bindingtype: {perinstance:1}},
    {name:"cococ", datatype:Matrix4x4, arraylength:1, bindingtype: {perinstance:1}},
    {name:"sos", datatype:Matrix4x4, arraylength:2, bindingtype: {perinstance:1}},
],[
    {name:"sdgsdgg", datatype:Matrix4x4, arraylength:1, bindingtype: {}},
])

function test(){
    setdata([transform.mat, 123])
}

//---------------------------------------------------------------------------------------------------------
class ShaderBindingDescription{
    readonly gltypeinfo:GLTypeInfo
    constructor(
        public name:string,
        public location:number,
        webgltype:GLenum,
        public arraylength:number,
    ){
        this.gltypeinfo = getGLTypeInfo(webgltype)
    }
}

class ShaderBindingDescriptions{
    constructor(
        public vattributes:Map<string, ShaderBindingDescription>,
        public uniforms:Map<string, ShaderBindingDescription>,
    ){}
}

class ShaderBinding<T extends ShaderBindingType>{
    constructor(
        public type:T,
        public desc:ShaderBindingDescription,
        
        public req?: ShaderBindingDescriptionReq<T>,
    ){}
}

class ShaderBindings{
    constructor(
        public vertexattrs:ShaderBinding<ShaderBindingVertexAttr>[],
        public instanceattrs:ShaderBinding<ShaderBindingInstanceAttr>[],
        public uniforms:ShaderBinding<ShaderBindingUniform>[], 
    ){}
}



export function create_shaderbindingslist(gl:WebGL2RenderingContext, binddescs:ShaderBindingDescriptions, bindreqs:ShaderBindingDescriptionReqs):ShaderBindings{
    const vertexattrs = []
    for(const vattr of bindreqs.vertexattrs){
        const desc = binddescs.vattributes.get(vattr.name)
        if(desc == undefined){throw geterror(`shader Bindings has no binding called ${vattr.name}`)}
        const vattrinfo = get_webgltype(vattr.datatype)
        if(vattrinfo.type != desc.gltypeinfo.type){throw geterror(`the vertex attribute ${vattr.name} binding does not have the same type ${vattrinfo.type} - ${desc.gltypeinfo.type} `)}

        vertexattrs.push(new ShaderBinding<ShaderBindingVertexAttr>(vattr.bindingtype, desc, vattr))
    }

    const instanceattrs = []
    for(const iattr of bindreqs.instanceattrs){
        const desc = binddescs.vattributes.get(iattr.name)
        if(desc == undefined){throw geterror(`shader Bindings has no binding called ${iattr.name}`)}
        const iattrinfo = get_webgltype(iattr.datatype)
        if(iattrinfo.type != desc.gltypeinfo.type){throw geterror(`the vertex attribute ${iattr.name} binding does not have the same type ${iattrinfo.type} - ${desc.gltypeinfo.type} `)}

        instanceattrs.push(new ShaderBinding<ShaderBindingInstanceAttr>(iattr.bindingtype, desc, iattr))
    }

    const uniforms = []
    for(const uni of bindreqs.uniforms){
        const desc = binddescs.uniforms.get(uni.name)
        if(desc == undefined){throw geterror(`shader Bindings has no binding called ${uni.name}`)}
        const uniinfo = get_webgltype(uni.datatype)
        if(uniinfo.type != desc.gltypeinfo.type){throw geterror(`the vertex attribute ${uni.name} binding does not have the same type ${uniinfo.type} - ${desc.gltypeinfo.type} `)}

        uniforms.push(new ShaderBinding<ShaderBindingUniform>(uni.bindingtype, desc, uni))
    }

    return new ShaderBindings(vertexattrs, instanceattrs, uniforms)
}


//----------------------------------------------------------------------------------------------------
class ArrayLocation<T>{
    constructor(
        public location:T,
        public index:number,
    ){}
}

class RenderObjVertexAttribute{
    constructor(
        public instancer:ArrayLocation<RenderObjInstancer>,
        public binding:ShaderBinding<ShaderBindingVertexAttr>,
        public vbo:WebGLBuffer,
    ){}

    setdata(data:ArrayDataType){
        if(!(data instanceof this.binding.desc.gltypeinfo.arrayType)){throw geterror(`not the correct type, ${typeof data} -> ${this.binding.desc.gltypeinfo.arrayType}`)}

        const gl = this.instancer.location.ctx.canvas.gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    }
}

class RenderObjInstanceAttribute{
    data:Float32Array = new Float32Array([])
    instancecount:number = 0
    constructor(
        public instancer:ArrayLocation<RenderObjInstancer>,
        public binding:ShaderBinding<ShaderBindingInstanceAttr>,
        public vbo:WebGLBuffer,
    ){}


    instantiate(data:[ string, ArrayDataType]){
        this.binding.desc.gltypeinfo.type
    }
}

class RenderObjUniform{
    constructor(
        public instancer:ArrayLocation<RenderObjInstancer>,
        public binding:ShaderBinding<ShaderBindingUniform>,
    ){}
}

class RenderObjPrimitive{
    pcount:number = 0
    constructor(
        public pshape:GLenum,
    ){}

    setdata(pdata:ArrayDataType){
        switch (this.pshape){
            case WebGL2RenderingContext.TRIANGLES:
                if (pdata.length % 3 !== 0) {throw geterror("pdata length must be multiple of 3 for TRIANGLES")}
                this.pcount = pdata.length / 3;
                break;

            case WebGL2RenderingContext.LINES:
                if (pdata.length % 2 !== 0) {throw geterror("pdata length must be multiple of 2 for LINES");}
                this.pcount = pdata.length / 2;
                break;

            case WebGL2RenderingContext.LINE_STRIP:
                this.pcount = Math.max(pdata.length - 1, 0);
                break;

            case WebGL2RenderingContext.TRIANGLE_STRIP:
            case WebGL2RenderingContext.TRIANGLE_FAN:
                this.pcount = Math.max(pdata.length - 2, 0);
                break;

            default:
                throw geterror(`Unsupported facetype: ${this.pshape}`);
        }
    }
}

class RenderObjInstancer{
    vertexattrs:RenderObjVertexAttribute[] = []
    instancesattrs:RenderObjInstanceAttribute[] = []
    uniforms:RenderObjUniform[] = []
    primitive:RenderObjPrimitive

    vao:WebGLVertexArrayObject
    constructor(
        public ctx:RenderContext,
        public bindings:ShaderBindings,
    ){  
        const gl = this.ctx.canvas.gl
        this.vao = gl.createVertexArray()
        gl.bindVertexArray(this.vao) 

        for(const vbind of bindings.vertexattrs){
            const vbo = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
            
            const attrindex = this.vertexattrs.length
            const vertexattr = new RenderObjVertexAttribute(new ArrayLocation(this, attrindex), vbind, vbo)
            this.vertexattrs.push(vertexattr)

            if(vbind.req == undefined){throw geterror(`binding ${vbind} has databind is not defined`)}
            if(vbind.req.bindingtype.link != undefined){throw geterror(`binding ${vbind} has databind link already defined`)}
            vbind.req.bindingtype.link = vertexattr

            for(let arr=0; arr<vbind.desc.arraylength; arr++){
                const arroffset = arr * vbind.desc.gltypeinfo.bsize // offset per array 
                for(let i=0; i<vbind.desc.gltypeinfo.decomposition.iteration;i++){
                    const loc = vbind.desc.location + vbind.desc.gltypeinfo.decomposition.iteration*arr + i 
                    gl.vertexAttribPointer(
                        loc, vbind.desc.gltypeinfo.decomposition.baseGlTypeLength,
                        vbind.desc.gltypeinfo.baseGLType, false,
                        vbind.type.datastride, vbind.type.dataoffset + arroffset + i * vbind.desc.gltypeinfo.decomposition.bsize
                    )
                    gl.enableVertexAttribArray(loc);
                    gl.vertexAttribDivisor(loc, 0)
                }
            }
        }

        for(const ibind of bindings.instanceattrs){
            const vbo = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
            
            const instanceindex = this.instancesattrs.length
            const instanceattr = new RenderObjInstanceAttribute(new ArrayLocation(this, instanceindex), ibind, vbo)
            this.instancesattrs.push(instanceattr)

            if(ibind.req == undefined){throw geterror(`binding ${ibind} has databind is not defined`)}
            if(ibind.req.bindingtype.link != undefined){throw geterror(`binding ${ibind} has databind link already defined`)}
            ibind.req.bindingtype.link = instanceattr

            for(let arr=0; arr<ibind.desc.arraylength; arr++){
                const arroffset = arr * ibind.desc.gltypeinfo.bsize // offset per array 
                for(let i=0; i<ibind.desc.gltypeinfo.decomposition.iteration;i++){
                    const loc = ibind.desc.location + ibind.desc.gltypeinfo.decomposition.iteration*arr + i 
                    gl.vertexAttribPointer(
                        loc, ibind.desc.gltypeinfo.decomposition.baseGlTypeLength,
                        ibind.desc.gltypeinfo.baseGLType, false,
                        0, arroffset + i * ibind.desc.gltypeinfo.decomposition.bsize
                    )
                    gl.enableVertexAttribArray(loc);
                    gl.vertexAttribDivisor(loc, 0)
                }
            }

        }

        for(const ubind of bindings.uniforms){
            const uniformindex = this.uniforms.length
            const uniform = new RenderObjUniform(new ArrayLocation(this, uniformindex), ubind)
            this.uniforms.push(uniform)

            if(ubind.req == undefined){throw geterror(`binding ${ubind} has databind is not defined`)}
            if(ubind.req.bindingtype.link != undefined){throw geterror(`binding ${ubind} has databind link already defined`)}
            ubind.req.bindingtype.link = uniform
        }

        this.primitive = new RenderObjPrimitive()


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
    
    const shaderbindings = create_shaderBindingDescriptions(gl, program)

    gl.deleteShader(vertsh)
    gl.deleteShader(fragsh)

    return new Shader(sources, program, shaderbindings)
}


export class Shader{
    constructor(
        public sources:ShaderSources,
        public program:WebGLProgram,
        private bindings:ShaderBindingDescriptions,
    ){}

    create_shaderbindings(){
        return Object.assign({},this.bindings)
    }

}
