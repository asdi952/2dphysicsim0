import { AssertError, exit, geterror, printErrorStack } from "./error";
import { createCounter, getmodelmat, makeTuple, MWritable, Signal, Transform2D, Vec2, type Tuple } from "./primitives";
import { RenderEngine } from "./render/engine";
import { generate_elmindex, MeshV0 } from "./render/mesh";
import { Canvas, RenderInstance, RenderObjV0, RenderWorld, Viewport } from "./render/render";
import { ShaderV0 } from "./render/shader";
import { DataResourcer } from "./resourcer";





async function app(sim: Sim){
    const [celm, cwidth, cheight] = await sim.s_canvasloaded.wait()
    
    const mesh_vertex = new Float32Array([
        -0.5, -0.5,
        0.3,0.2,
        2,3,
        -1, 0,
    ])

    const mesh = new MeshV0(mesh_vertex, generate_elmindex(mesh_vertex))
    const shader = new ShaderV0()
    console.log()
    const relm = new RenderObjV0(mesh)
    
    const rengine = new RenderEngine()
    
    const rviewport = new Viewport(Vec2.Zero(), Vec2.Defined(cwidth.get(), cheight.get()))
    const world = RenderWorld.create_default()
    const canvas = new Canvas(celm, cwidth, cheight)
    

    const rinstance = new RenderInstance(canvas, rviewport, world)
    rengine.add_instance(rinstance)

    world.add_renderobjs([relm],shader)




    console.log(rengine.debug_print_shader())
    const t = Transform2D.Identity()

    const ss = rengine.contexts.get(0)!.shaders.values().next().value!.shader
    console.log(shader)

    setInterval(()=>{
        t.position.x += 1 * 0.01
        relm.uniforms.mvp.value = getmodelmat(t)
        rengine.render()
    },10)


}

export class Sim{
    s_canvasloaded = new Signal<Tuple<[HTMLCanvasElement, MWritable<number>, MWritable<number>]>>()

    constructor(){}

    init(){
        return makeTuple(this.s_canvasloaded)
    }

    deinit(){}

    async run(){
        try{
            await app(this)
        }catch(error:any){
            switch(error.constructor){
                case AssertError:
                    const asserterror = error as AssertError
                    await printErrorStack(asserterror)
                    break
            }
        }
    }
}



