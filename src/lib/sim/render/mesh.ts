import { geterror } from "../error";
import { Vec2, type Ptr } from "../primitives";
import { getGLTypeInfo } from "./webgl";




export interface Mesh {
    faceindex: Uint16Array,
    pshape: GLenum,
}

export class MeshV0{
    constructor(
        public vpos:Float32Array,
        public elmindex:Uint16Array,
    ){}
}

export type ArrayDataType = Float16Array | Float32Array | Uint16Array | Uint32Array | Int16Array | Int32Array
export type ArrayDataTypeCtor = ArrayDataType["constructor"]

export class MeshVertexDataFormat{
    constructor(
        public unittype:GLenum,
        public unitspervert:number,
        public offset:number,
        public stride:number,
    ){}
}

export class MeshVertexData{
    constructor(
        public data:ArrayDataType,
        public format:MeshVertexDataFormat,
    ){
        // veridy if vertex data inst cut at the end of array
        const vertdatasize = getGLTypeInfo(this.format.unittype).bsize * this.format.unitspervert
        if((this.data.length - this.format.offset)%this.format.stride < vertdatasize){throw geterror(`vert data of ${this} is cut at the end of the data array`)}
    }

    getvertexcount(){
        return Math.floor((this.data.length - this.format.offset)/this.format.stride)
    }
}


export class MeshPrimitiveData{
    pcount:number
    constructor(
        public pdata:ArrayDataType,
        public pshape: GLenum,
    ){
        switch (pshape) {
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
                throw geterror(`Unsupported facetype: ${pshape}`);
        }
    }
}

export class MeshV1{
    constructor(
        public primitive:MeshPrimitiveData,
        public vpos: MeshVertexData,
    ) {
        if(!this.check_data_coesion()){throw geterror("failed to get data coesions")}
    }

    check_data_coesion(){
        const vpos_vertcount = this.vpos.getvertexcount()
        return true
    }
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

    const data = {
        position: new Float32Array([]),
        color: new Float32Array([])
    }
    const a = Object.entries(data)

    return indexelms
}
