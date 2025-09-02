import { AssertError, geterror } from "./error";
import { FixedList, Matrix4x4, Vec2 } from "./primitives"


export interface BuilderComp<Type, Args extends any[] = any[]>{
    build:(...args:Args)=>Type
}


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

function get_allvertexattribloc(gl:WebGL2RenderingContext, program:WebGLProgram, values:{key:string, name:string}[]):Map<string, GLint>{
    const attribs = new Map<string, GLint>()

    for(const value of values){
        const loc = gl.getAttribLocation(program, value.name)
        if(loc == -1){throw geterror(`attrib loc ${value.name} is not in shader`)}

        attribs.set(value.key, loc)
    }
    return attribs
}
function get_alluniformloc(gl:WebGL2RenderingContext, program:WebGLProgram, names:string[]):Map<string, WebGLUniformLocation>{
    const uniforms = new Map<string, WebGLUniformLocation>()
    gl.useProgram(program)

    for(const name of names){
        const loc = gl.getUniformLocation(program, name)
        if(!loc){throw geterror(`uniform loc ${name} is not in shader`)}

        uniforms.set(name, loc)
    }
    return uniforms
}

export interface IShaderBuilder{
    build: (gl:WebGL2RenderingContext)=>Shader
}
export class ShaderV0 implements IShaderBuilder{
    vertshader_src = `#version 300 es
        in vec2 vposition;
        uniform mat4 mvp;

        void main() {
            gl_Position = mvp * vec4(vposition,0,1) ;
        }`;

    fragshader_src = `#version 300 es
        precision highp float;
        out vec4 ocolor;
        void main() {
            ocolor = vec4(1, 0, 0, 1); // red
        }`;

    vattrnames = [{key:"position", name: "vposition"}]
    uniformnames = ["mvp"]

    build(gl:WebGL2RenderingContext){
        const vertsh = createShader(gl, gl.VERTEX_SHADER, this.vertshader_src)
        const fragsh = createShader(gl, gl.FRAGMENT_SHADER, this.fragshader_src)

        const program = createProgram(gl, vertsh, fragsh)
        
        const vertsattrloc = get_allvertexattribloc(gl, program, this.vattrnames)
        const uniformsloc = get_alluniformloc(gl, program, this.uniformnames)

        gl.deleteShader(vertsh)
        gl.deleteShader(fragsh)

        return new Shader(this.constructor.name, program, vertsattrloc, uniformsloc)
    }
}

export class Shader{
    constructor(
        public shadertype:string,
        public program:WebGLProgram,

        private vertsattrloc:Map<string, GLint>,
        private uniformsloc:Map<string, WebGLUniformLocation>,
    ){}

    get_assert_uniform(name:string){
        const u = this.uniformsloc.get(name)
        if(u == undefined){throw geterror(`the uniform ${name} does exist in shader ${this.constructor.name}`)}
        return u
    }

    get_assert_attr(name:string){
        const u = this.vertsattrloc.get(name)
        if(u == undefined){throw geterror(`the attr ${name} does exist in shader ${this.constructor.name}`)}
        return u
    }
    
}

export class MeshV0{
    constructor(
        public vert_pos: Float32Array,
        public elmindex: Uint16Array,
    ){}
}

export function generate_elmindex(vertex: Float32Array){
    if(vertex.length%2 != 0){throw geterror("vertex nust me pair of 2")}

    const indexelms = new Uint16Array(vertex.length + 2)

    for(let i=0; i<vertex.length-2; i+=3){
        let k = i/3
        indexelms[i] = 0
        indexelms[i+1] = k+1
        indexelms[i+2] = k+2
    }
    return indexelms
}

//-----------------------------------------------------------------------------------
export interface RenderElm{
    load:(gl:WebGL2RenderingContext )=>void,
    generate_vao:(gl:WebGL2RenderingContext, shader: Shader)=>void
    render:(gl:WebGL2RenderingContext)=>void
}

// export class RenderElm{
//     constructor(
//         public vao: WebGLVertexArrayObject,
//         public vbos:Map<string, WebGLBuffer>,
//         public nfaces: number,
//     ){}

// }

export class RenderElmV0 implements RenderElm{
    vbos!:{
        pos:WebGLBuffer,
        elmindex:WebGLBuffer,
    }
    vao!:WebGLVertexArrayObject
    nfaces!:number

    uniforms={
        mvp: {
            value: Matrix4x4.Identity(),
            loc: 0,
        }
    }
    constructor(
        public mesh:MeshV0
    ){}


    load(gl:WebGL2RenderingContext){
        if(this.vbos != undefined){throw geterror("already loaded")}

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        
        const vbo_pos = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_pos)
        gl.bufferData(gl.ARRAY_BUFFER, this.mesh.vert_pos, gl.STATIC_DRAW)
        

        const vbo_elmindex = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_elmindex)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.elmindex, gl.STATIC_DRAW)

        gl.bindVertexArray(null)

        this.vbos = {pos:vbo_pos, elmindex: vbo_elmindex}

        this.nfaces = this.mesh.elmindex.length /3
    }

    generate_vao(gl:WebGL2RenderingContext, shader: Shader){
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbos.pos)
        const posloc = shader.get_assert_attr("position")
        gl.vertexAttribPointer(posloc, 2, gl.FLOAT, false, 0 , 0)
        gl.enableVertexAttribArray(posloc)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbos.elmindex)

        this.uniforms.mvp.loc = shader.get_assert_uniform("mvp") as number

        gl.bindVertexArray(null)

        this.vao = vao
    }

    render(gl:WebGL2RenderingContext){
        gl.uniformMatrix4fv(this.uniforms.mvp.loc, true, this.uniforms.mvp.value.mat);

        gl.bindVertexArray(this.vao)
        gl.drawElements(gl.TRIANGLES, this.nfaces, gl.UNSIGNED_SHORT, 0)
    }
    

}

//--------------------------------------------------------------------------------------------
export class Camera{
    constructor(
        public position:Vec2, 
        public viewsize:Vec2,
    ){}
}

export class RenderWorld{
    elms:RenderElm[] = []
    instance!: RenderInstance
    camera!:Camera
    constructor(){}

    add_elms(elms:RenderElm[], bshader:IShaderBuilder){
        if(this.instance == undefined){throw geterror("world doesnt have a instance")}

        for(const belm of elms){
            if(!is_shaderelm_compatible(belm, bshader)){ return undefined}
            this.elms.push(belm)
            this.instance.contex.add_renderelm(belm, bshader)
        }
    }

}
function is_shaderelm_compatible(elm:RenderElm, shader:IShaderBuilder){
    return true
}

//------------------------------------------------------------------------------
export class CanvasState{
    constructor(
        public gl:WebGL2RenderingContext,
        public canvas:Canvas,
    ){}
}

export class Canvas{
    elm?: HTMLCanvasElement
    state?:CanvasState
    constructor(
        public width:number, 
        public height:number,
    ){}

    setState(state:CanvasState){
        this.state = state
    }
}

export class Viewport{
    constructor(
        public cstate: CanvasState,
        public position:Vec2,
        public size:Vec2,
    ){}
}

export class RenderInstance{
    world!:RenderWorld
    constructor(
        public contex: RenderContext,
        public viewport:Viewport,
    ){}

    setworld(world: RenderWorld){
        if(world.instance != undefined){throw geterror("instance already has aworld")}
        this.world = world
        world.instance = this
        
    }


}

//------------------------------------------------------------------------------
export class ShaderRenderElms{
    renderelms:RenderElm[] = []
    constructor(
        public shader:Shader,
    ){}

    add_renderelm(gl:WebGL2RenderingContext, elm:RenderElm){
        elm.load(gl)
        elm.generate_vao(gl, this.shader)
        this.renderelms.push(elm)
    }
}

export class RenderContext{
    shaders:Map<string, ShaderRenderElms> = new Map()
    constructor(
        public sparentindex:number,
        public cstate: CanvasState
    ){}

    get_or_create_shaderelm(shaderb: IShaderBuilder):ShaderRenderElms{
        let shaderelm = this.shaders.get(shaderb.constructor.name)
        if(shaderelm != undefined){return shaderelm}

        const shader = shaderb.build(this.cstate.gl)
        shaderelm = new ShaderRenderElms(shader)
        this.shaders.set(shaderb.constructor.name, shaderelm)

        return shaderelm
    }

    add_renderelm(elm:RenderElm, shaderb:IShaderBuilder){
        let shaderelm = this.get_or_create_shaderelm(shaderb)
        shaderelm.add_renderelm(this.cstate.gl, elm)
    }
    debug_txt_shader(){
        let txt = ""
        for(const elm of this.shaders){
            txt += `\t${elm.toString()}\n`
        }
        return txt
    }
}

export class RenderEngine{
    instances:RenderInstance[] = []
    contexts = new FixedList<RenderContext>

    private createContext(cstate:CanvasState){
        const index = this.contexts.emplace()
        const ctx = new RenderContext(index,cstate)
        this.contexts.set(index, ctx)
        return ctx
    }

    createInstance( viewport:Viewport){
        let ctx = this.contexts.find((ctx:RenderContext)=>ctx.cstate == viewport.cstate)
        if(ctx == undefined){
            ctx = this.createContext(viewport.cstate)
        }

        const instance = new RenderInstance(ctx, viewport)
        this.instances.push(instance)

        return instance
    }

    debug_print_shader(){
        let txt = "debug_print_shader:\n"
        for(const ctx of this.contexts){
            txt += ctx.debug_txt_shader()
        }
        txt+= "\n"
        return txt
    }

    render(){
        for(const ctx of this.contexts){
            const gl = ctx.cstate.gl
            for(const [_, selm] of ctx.shaders){
                gl.useProgram(selm.shader.program)
                for(const elm of selm.renderelms){
                    elm.render(gl)
                }
            }
        }
    }

}
