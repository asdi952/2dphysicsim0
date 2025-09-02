import { AssertError, exit, geterror, printErrorStack } from "./error";
import { getmodelmat, Signal, Transform2D, Vec2 } from "./primitives";
import { Camera, Canvas, CanvasState, generate_elmindex, MeshV0, RenderElmV0, RenderEngine, RenderInstance, RenderWorld, Shader, ShaderV0, Viewport } from "./render";


export const canvas = new Canvas(800,700)
export const s_canvasloaded = new Signal()


function init(){
    if(!canvas.elm) throw geterror("!canvaselm.canvas")
    const gl = canvas.elm.getContext("webgl2")
    
    if(!gl) throw geterror("webgl2 fail to load")
    canvas.setState(new CanvasState(gl, canvas)) 
}

async function app(){
    await s_canvasloaded.wait()
    init()

    const mesh_vertex = new Float32Array([
        -0.5, -0.5,
        0.3,0.2,
        2,3,
        -1, 0,
    ])

    const cstate = canvas.state!
    const gl = cstate.gl

    const mesh = new MeshV0(mesh_vertex, generate_elmindex(mesh_vertex))
    const shader = new ShaderV0()
    const relm = new RenderElmV0(mesh)

    const rviewport = new Viewport(cstate, Vec2.Zero(), Vec2.Defined(canvas.width, canvas.height))
    const rengine = new RenderEngine()

    const world = new RenderWorld()
    const instance = rengine.createInstance(rviewport)
    instance.setworld(world)    

    world.add_elms([relm],shader)




    console.log(rengine.debug_print_shader())
    const t = Transform2D.Identity()

    const ss = rengine.contexts.get(0)!.shaders.values().next().value!.shader
    console.log(shader)

    let numAttribs = gl.getProgramParameter(ss.program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < numAttribs; i++) {
        const info = gl.getActiveUniform(ss.program, i);
        if (info) {
            console.log("Attrib:", info.name, "type:", info.type, "size:", info.size);
            const loc = gl.getUniformLocation(ss.program, info.name);
            console.log("  location:", loc);
        }
    }

    numAttribs = gl.getProgramParameter(ss.program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < numAttribs; i++) {
        const info = gl.getActiveAttrib(ss.program, i);
        if (!info) continue;

        const location = gl.getAttribLocation(ss.program, info.name);

        console.log("Vertex Input:", {
            name: info.name,       // e.g. "vposition"
            type: info.type,       // e.g. gl.FLOAT_VEC2
            size: info.size,       // array size (usually 1)
            location               // index to bind buffer with gl.vertexAttribPointer
        });
    }

    setInterval(()=>{
        t.position.x += 1 * 0.01
        relm.uniforms.mvp.value = getmodelmat(t)
        rengine.render()
    },10)

    // const camera = new Camera(Vec2.Zero(), Vec2.Defined(10,10))
    // const renderworld = new RenderWorld(camera)
    // const rinstance = new RenderInstance(renderworld, rviewport)
    

    
}

export async function main(){
    try{
        await app()
    }catch(error:any){
        switch(error.constructor){
            case AssertError:
                const asserterror = error as AssertError
                await printErrorStack(asserterror)
                break
        }
    }
}
