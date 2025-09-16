import { geterror } from "../error";
import { Vec2, type Ptr } from "../primitives";
import { ShaderBindingsDataDescriptions} from "./shader";


export interface Mesh {
    bindings:ShaderBindingsDataDescriptions
    faceindex: Uint16Array,
    faceshape: GLenum,
}

export class MeshV0{
    constructor(
        public vpos:Float32Array,
        public elmindex:Uint16Array,
    ){}
}
export class MeshV1 implements Mesh{
    facecount:number
    bindings = new ShaderBindingsDataDescriptions([
        {name: "position", type: Vec2, perinstance: 0},
    ],[])

    constructor(
        public faceindex: Uint16Array,
        public faceshape: GLenum,
        
        public vpos: Float32Array,
        // public vcolor?: Ptr<Float32Array>,
        // public vuv?: Ptr<Float32Array>  ,
    ) {
        // Compute face count based on primitive type
        switch (faceshape) {
            case WebGL2RenderingContext.TRIANGLES:
                if (faceindex.length % 3 !== 0) {throw geterror("faceindex length must be multiple of 3 for TRIANGLES")}
                this.facecount = faceindex.length / 3;
                break;

            case WebGL2RenderingContext.LINES:
                if (faceindex.length % 2 !== 0) {throw geterror("faceindex length must be multiple of 2 for LINES");}
                this.facecount = faceindex.length / 2;
                break;

            case WebGL2RenderingContext.LINE_STRIP:
                this.facecount = Math.max(faceindex.length - 1, 0);
                break;

            case WebGL2RenderingContext.TRIANGLE_STRIP:
            case WebGL2RenderingContext.TRIANGLE_FAN:
                this.facecount = Math.max(faceindex.length - 2, 0);
                break;

            default:
                throw geterror(`Unsupported facetype: ${faceshape}`);
        }

    }
}

// class Mesh{

// }

// class ShaderMeshBidings{

// }

// class ShaderMesh{
//     constructor(
//         public mesh:Mesh,
//         public shader:Shader,
//         public bindings: Tuple<[string, string]>[]
//     ){
//         this.validate_bindings()
//     }

//     validate_bindings(){

//     }
// }
// const mesh = new Mesh()
// const shader = new Shader()
// const obj0 = new ShaderMesh()

export function generate_elmindex(vertex: Float32Array){
    if(vertex.length%2 != 0){throw geterror("vertex nust me pair of 2")}

    const indexelms = new Uint16Array(vertex.length + 2)

    for(let i=0; i<vertex.length-2; i+=3){
        let k = i/3
        indexelms[i] = 0
        indexelms[i+1] = k+1
        indexelms[i+2] = k+2
    }

    const data = {
        position: new Float32Array([]),
        color: new Float32Array([])
    }
    const a = Object.entries(data)

    return indexelms
}
