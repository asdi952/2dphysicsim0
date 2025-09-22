import { geterror } from "../error";
import { Matrix4x4, Vec2 } from "../primitives";

export class WebglTypeTransferDecomposition {
    constructor(
        public iteration: number,        // how many attribute slots needed
        public baseGlTypeLength: number, // number of base values per slot (e.g. 4 for vec4)
        public bsize: number             // byte size of each slot (e.g. 16 for vec4)
    ) {}
}

export class GLTypeInfo {
    constructor(
        public type: GLenum,                  // WebGL enum constant
        public name: string,                  // human-readable name
        public bsize: number,                 // total size in bytes
        public baseGLType: GLenum,            // type for vertexAttribPointer/IPointer
        public arrayType: any | null,         // TypedArray constructor (null for samplers)
        public decomposition: WebglTypeTransferDecomposition // decomposition info
    ) {}
}

const GL_TYPE_INFO: Record<GLenum, GLTypeInfo> = Object.freeze({
    [WebGL2RenderingContext.FLOAT]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT, "FLOAT", 4,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(1, 1, 4)),
    [WebGL2RenderingContext.FLOAT_VEC2]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_VEC2, "FLOAT_VEC2", 8,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(1, 2, 8)),
    [WebGL2RenderingContext.FLOAT_VEC3]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_VEC3, "FLOAT_VEC3", 12,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(1, 3, 12)),
    [WebGL2RenderingContext.FLOAT_VEC4]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_VEC4, "FLOAT_VEC4", 16,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(1, 4, 16)),

    [WebGL2RenderingContext.INT]:
        new GLTypeInfo(WebGL2RenderingContext.INT, "INT", 4,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 1, 4)),
    [WebGL2RenderingContext.INT_VEC2]:
        new GLTypeInfo(WebGL2RenderingContext.INT_VEC2, "INT_VEC2", 8,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 2, 8)),
    [WebGL2RenderingContext.INT_VEC3]:
        new GLTypeInfo(WebGL2RenderingContext.INT_VEC3, "INT_VEC3", 12,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 3, 12)),
    [WebGL2RenderingContext.INT_VEC4]:
        new GLTypeInfo(WebGL2RenderingContext.INT_VEC4, "INT_VEC4", 16,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 4, 16)),

    [WebGL2RenderingContext.UNSIGNED_INT]:
        new GLTypeInfo(WebGL2RenderingContext.UNSIGNED_INT, "UNSIGNED_INT", 4,
            WebGL2RenderingContext.UNSIGNED_INT, Uint32Array,
            new WebglTypeTransferDecomposition(1, 1, 4)),
    [WebGL2RenderingContext.UNSIGNED_INT_VEC2]:
        new GLTypeInfo(WebGL2RenderingContext.UNSIGNED_INT_VEC2, "UNSIGNED_INT_VEC2", 8,
            WebGL2RenderingContext.UNSIGNED_INT, Uint32Array,
            new WebglTypeTransferDecomposition(1, 2, 8)),
    [WebGL2RenderingContext.UNSIGNED_INT_VEC3]:
        new GLTypeInfo(WebGL2RenderingContext.UNSIGNED_INT_VEC3, "UNSIGNED_INT_VEC3", 12,
            WebGL2RenderingContext.UNSIGNED_INT, Uint32Array,
            new WebglTypeTransferDecomposition(1, 3, 12)),
    [WebGL2RenderingContext.UNSIGNED_INT_VEC4]:
        new GLTypeInfo(WebGL2RenderingContext.UNSIGNED_INT_VEC4, "UNSIGNED_INT_VEC4", 16,
            WebGL2RenderingContext.UNSIGNED_INT, Uint32Array,
            new WebglTypeTransferDecomposition(1, 4, 16)),

    [WebGL2RenderingContext.BOOL]:
        new GLTypeInfo(WebGL2RenderingContext.BOOL, "BOOL", 4,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 1, 4)),
    [WebGL2RenderingContext.BOOL_VEC2]:
        new GLTypeInfo(WebGL2RenderingContext.BOOL_VEC2, "BOOL_VEC2", 8,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 2, 8)),
    [WebGL2RenderingContext.BOOL_VEC3]:
        new GLTypeInfo(WebGL2RenderingContext.BOOL_VEC3, "BOOL_VEC3", 12,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 3, 12)),
    [WebGL2RenderingContext.BOOL_VEC4]:
        new GLTypeInfo(WebGL2RenderingContext.BOOL_VEC4, "BOOL_VEC4", 16,
            WebGL2RenderingContext.INT, Int32Array,
            new WebglTypeTransferDecomposition(1, 4, 16)),

    [WebGL2RenderingContext.FLOAT_MAT2]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_MAT2, "FLOAT_MAT2", 16,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(2, 2, 8)), // 2x vec2 (8 bytes each)
    [WebGL2RenderingContext.FLOAT_MAT3]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_MAT3, "FLOAT_MAT3", 36,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(3, 3, 12)), // 3x vec3 (12 bytes each)
    [WebGL2RenderingContext.FLOAT_MAT4]:
        new GLTypeInfo(WebGL2RenderingContext.FLOAT_MAT4, "FLOAT_MAT4", 64,
            WebGL2RenderingContext.FLOAT, Float32Array,
            new WebglTypeTransferDecomposition(4, 4, 16)), // 4x vec4 (16 bytes each)

    // Samplers (not decomposed into vertex attribs)
    [WebGL2RenderingContext.SAMPLER_2D]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_2D, "SAMPLER_2D", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_CUBE]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_CUBE, "SAMPLER_CUBE", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_3D]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_3D, "SAMPLER_3D", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_2D_ARRAY]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_2D_ARRAY, "SAMPLER_2D_ARRAY", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_2D_SHADOW]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_2D_SHADOW, "SAMPLER_2D_SHADOW", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_CUBE_SHADOW]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_CUBE_SHADOW, "SAMPLER_CUBE_SHADOW", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
    [WebGL2RenderingContext.SAMPLER_2D_ARRAY_SHADOW]:
        new GLTypeInfo(WebGL2RenderingContext.SAMPLER_2D_ARRAY_SHADOW, "SAMPLER_2D_ARRAY_SHADOW", 0, 0, null,
            new WebglTypeTransferDecomposition(0, 0, 0)),
});





export function getGLTypeInfo(type: GLenum): GLTypeInfo {
    const info = GL_TYPE_INFO[type]
    if(!info){throw geterror(`didnt found type ${type}`)}
    return info
}

export function get_webgltype(type:Function):GLTypeInfo{
    switch(type){
        case Matrix4x4:return getGLTypeInfo(WebGL2RenderingContext.FLOAT_MAT4)
        case Vec2:return getGLTypeInfo(WebGL2RenderingContext.FLOAT_VEC2)
        default:
            throw geterror(`webgltype for ${type} not implemented`)
    }
}
