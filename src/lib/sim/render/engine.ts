import { geterror } from "../error"
import { FixedList } from "../primitives"
import { RenderContext, type Canvas, type RenderInstance } from "./render"



export class RenderEngine{
    instances:RenderInstance[] = []
    contexts = new FixedList<RenderContext>
    

    private createContext(canvas:Canvas){
        const index = this.contexts.emplace()
        const ctx = new RenderContext(index, canvas)
        this.contexts.set(index, ctx)
        return ctx
    }

    // createInstance( canvas:Canvas, viewport:Viewport, world:RenderWorld){
    //     const instance = new RenderInstance(viewport, world, canvas)
    //     instance.rengine = this

    //     this.instances.push(instance)

    //     let ctx = this.contexts.find((ctx:RenderContext)=>ctx.cstate == instance.cstate)
    //     if(ctx == undefined){
    //         ctx = this.createContext(instance.cstate)
    //     }
    //     instance.rctx = ctx
    //     return instance
    // }

    add_instance(instance:RenderInstance){
        if(instance.state != undefined){throw geterror("instance already loaded")}

        let ctx = this.contexts.find((ctx:RenderContext)=>ctx.canvas == instance.canvas)
        if(ctx == undefined){
            ctx = this.createContext(instance.canvas)
        }
        instance.init(this, ctx)

        this.instances.push(instance)
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
            const gl = ctx.canvas.gl
            for(const [_, sobj] of ctx.shaders){
                gl.useProgram(sobj.shader.program)
                for(const obj of sobj.renderobjs){
                    obj.render(gl)
                }
            }
        }
    }

}