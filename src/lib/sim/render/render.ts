import { writable, type Writable } from "svelte/store";
import { AssertError, geterror } from "../error";
import { createCounter, DoubleKeyMap, FixedList, makeTuple, Matrix4x4, MWritable, Transform2D, Vec2, type Tuple } from "../primitives"
import { build_shader, type Shader, type ShaderSources } from "./shader";
import type { Mesh, MeshV0 } from "./mesh";
import type { RenderEngine } from "./engine";


export interface BuilderComp<Type, Args extends any[] = any[]>{
    build:(...args:Args)=>Type
}



//-----------------------------------------------------------------------------------
export interface RenderObj{
    getbinds():ShaderBinds,
    load:(ctx:RenderContext, shader:Shader)=>void,
    render:(gl:WebGL2RenderingContext)=>void
}

type ShaderBinds = {
    vattr_names:string[],
    uniforms_names:string[],
}

export class RenderObjV0 implements RenderObj{
    state?:{
        vao:WebGLVertexArrayObject
        nfaces:number
        
        vbos:{
            pos:WebGLBuffer,
            elmindex:WebGLBuffer,
        }
    }
    uniforms={
        mvp: {
            value: Matrix4x4.Identity(),
            loc: 0,
        }
    }
    constructor(
        public mesh:MeshV0
    ){}

    vattr_names = ["position"]
    uniforms_names = ["mvp"]

    getbinds():ShaderBinds{
        return {vattr_names: this.vattr_names, uniforms_names: this.uniforms_names}
    }

    load(ctx:RenderContext, shader:Shader){
        if(this.state != undefined){throw geterror("already loaded")}
        const gl = ctx.canvas.gl
        
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        
    
        const vbo_pos = ctx.get_bind_set_vbo(gl.ARRAY_BUFFER, this.mesh.vpos, )

        const [posloc] = shader.get_assert_attrs(this.vattr_names)
        gl.vertexAttribPointer(posloc.location, 2, gl.FLOAT, false, 0 , 0)
        gl.enableVertexAttribArray(posloc.location)

     
        const vbo_elmindex = ctx.get_bind_set_vbo(gl.ELEMENT_ARRAY_BUFFER, this.mesh.elmindex ) //-------------------------INCOMPLETE

        gl.bindVertexArray(null)

        const [mvp] = shader.get_assert_uniforms(this.uniforms_names)
        this.uniforms.mvp.loc = mvp.location

        this.state = {
            vbos: {pos:vbo_pos, elmindex: vbo_elmindex},
            nfaces:this.mesh.elmindex.length /3,
            vao
        }

    }


    render(gl:WebGL2RenderingContext){
        if(this.state == undefined){throw geterror("already loaded")}

        gl.uniformMatrix4fv(this.uniforms.mvp.loc, true, this.uniforms.mvp.value.mat);

        gl.bindVertexArray(this.state.vao)
        gl.drawElements(gl.TRIANGLES, this.state.nfaces, gl.UNSIGNED_SHORT, 0)
        // gl.drawElementsInstanced(gl.TRIANGLES, )
    }
    

}

class RenderObjBindings{
    
}

class RenderObj0{
    constructor(
        public mesh:Mesh,
        public shadersources:ShaderSources,
    ){}
}

//--------------------------------------------------------------------------------------------


class RenderObj1{
    constructor(
        public mesh:Mesh,
        public shadersrc:ShaderSources,
        public userbindings:[string, ()=>any][],
    ){}
}


export class Camera{
    constructor(
        transform: Transform2D
    ){}
}

export class RenderWorld{
    objs:RenderObj[] = []
    state?:{
        instance: RenderInstance
    }
    constructor(
        public camera:Camera,
    ){}
    static create_default(){
        return new RenderWorld( new Camera(Transform2D.Identity()),)
    }
    init(instance: RenderInstance){
        if(this.state != undefined){throw geterror("word already loaded")}
        this.state = {instance}
    }

    add_renderobjs(objs:RenderObj1[]){
        if(this.state == undefined){

        }else{
            const state = this.state
            const rctx = state.instance.state.rctx
            for(const bobj of objs){
                this.objs.push(bobj)
                rctx.(bobj, bshader)
            }
        }

    }



}


//------------------------------------------------------------------------------


export class Canvas{
    gl:WebGL2RenderingContext
    constructor(
        public elm: HTMLCanvasElement,
        public width:MWritable<number> , 
        public height:MWritable<number>,
    ){
        const gl = elm.getContext("webgl2")
        
        if(!gl) throw geterror("webgl2 fail to load")
        this.gl = gl
    }
}

export class Viewport{
    constructor(
        public position:Vec2,
        public size:Vec2,
    ){}
}

export class RenderInstance{
    state!:{
        rengine:RenderEngine
        rctx:RenderContext
    }
    constructor(
        public canvas: Canvas,
        public viewport:Viewport,
        public world:RenderWorld,
    ){
        // if(canvas.state == undefined){throw geterror("canvas does not have a canvas state initialized")}
        world.init(this)
    }

    init(rengine:RenderEngine, rctx:RenderContext){
        this.state = {rengine, rctx}
    }
}

//------------------------------------------------------------------------------


class PrefabeInstance{
    constructor(
        public 
    ){}
}

class PrefabeInstancer{
    instances:PrefabeInstance[] = []
    constructor(
        public vao: WebGLVertexArrayObject
    ){}
}

class ShaderPrefab{
    instancer:PrefabeInstancer[] = []
    constructor(
        public shader:Shader,
    ){}
}


export class RenderContext{
    shaders:Map<ShaderSources, ShaderPrefab> = new Map()
    vbos:DoubleKeyMap<GLenum, any, WebGLBuffer> = new DoubleKeyMap()
    constructor(
        public sparentindex:number,
        public canvas: Canvas
    ){}

    private get_shaderprefabe(srcshader: ShaderSources):ShaderPrefab{
        let shaderprefab = this.shaders.get(srcshader)
        if(shaderprefab == undefined){
            const shader = build_shader(this.canvas.gl, srcshader)
            shaderprefab = new ShaderPrefab(shader)

            this.shaders.set(srcshader, shaderprefab)
        }

        return shaderprefab
    }
    
    get_bind_set_vbo(buffertarget:GLenum, data:any):WebGLBuffer{
        let vbo = this.vbos.get(buffertarget, data)
        if(vbo == undefined){
            const gl = this.canvas.gl
            vbo = gl.createBuffer()
            gl.bindBuffer(buffertarget, vbo)
            gl.bufferData(buffertarget, data, gl.STATIC_DRAW)

            this.vbos.set(buffertarget, data, vbo)
        }
        return vbo
    }

    add_prefabe(prefabe:Prefabe){ 
        let shaderprefab = this.get_shaderprefabe(prefabe.shadersrc)
        shaderprefab.instancer.push(prefabe)
    }

    debug_txt_shader(){
        let txt = ""
        for(const obj of this.shaders){
            txt += `\t${obj.toString()}\n`
        }
        return txt
    }
}

