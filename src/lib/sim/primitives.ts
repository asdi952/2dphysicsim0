import { exit, geterror } from "./error";



export class Vec2{
    x:number
    y:number

    constructor(x:number, y:number){ this.x = x; this.y = y}

    static Defined(x:number, y:number){return new Vec2(x,y)}
    static Zero(){return new Vec2(0,0)}
    static One(){return new Vec2(1,1)}
}

export class Transform2D{
    position:Vec2
    rot:number
    scale:Vec2

    constructor(position:Vec2, rot:number,scale:Vec2){
        this.position = position
        this.rot = rot
        this.scale = scale
    }

    static Identity(){
        return new Transform2D(Vec2.Zero(), 0, Vec2.One())
    }
}

export class Signal{
    private activated:boolean = false
    private subscribers: (()=>void)[] = []
    private promise:Promise<void>
    private promiseResolve?:()=>void

    constructor(){
        this.promise = new Promise<void>((r)=>{this.promiseResolve = r})
    }

    activate(){
        if(this.activated == true){exit(`signal already activated`); return}
        this.activated = true

        this.subscribers.forEach(s=>s())

        if(this.promiseResolve == undefined){exit("promise resolve undefined");return}
        this.promiseResolve()
    }

    wait(){return this.promise}

    subscribe(callback:()=>void){
        this.subscribers.push(callback)
    }

    reset(){
        this.promiseResolve = undefined
        this.promise = new Promise<void>((r)=>{this.promiseResolve = r})
        this.subscribers = []
        this.activated = false
    }
}


export class FixedList<Type>{
    arr:(Type|undefined)[] = []
    free:number[] = []

    //return index
    push(value:Type):number{
        let index = this.free.pop()
        if(index != undefined){
            this.arr[index] = value
        }else{
            index = this.arr.length
            this.arr.push(value)
        }
        return index
    }
    emplace():number{
        let index = this.free.pop()

        if(index == undefined){
            index = this.arr.length
            this.arr.push(undefined)
        }
        return index
    }
    get(index:number){
        return this.arr[index]
    }   
    set(index:number, value:Type){
        this.arr[index] = value
    }

    remove(index:number){
        if(this.arr[index] == undefined){throw geterror("their been a double free")}
        this.arr[index] = undefined
        this.free.push(index)
    }

    *[Symbol.iterator](): IterableIterator<Type> {
        for (const item of this.arr) {
            if (item !== undefined) {
                yield item
            }
        }
    }
    find(lambda:(value:Type, index:number)=>boolean){
       for (let i=0; i<this.arr.length; i++) {
            const item = this.arr[i]
            if (item !== undefined) {
                if(lambda(item,i)) {return item}
            }
        }
        return undefined
    }
}

export class Matrix4x4{
    constructor(
        public mat:Float32Array,
    ){}

    static Identity(){
        return new Matrix4x4(new Float32Array([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1,
        ]))
    }
}


export function getmodelmat( transform:Transform2D):Matrix4x4{
    const [px,py] = [transform.position.x,transform.position.y]
    const [sx,sy] = [transform.scale.x,transform.scale.y]
    const rot = transform.rot

    return new Matrix4x4(new Float32Array([
        sx*Math.cos(rot), -sy*Math.sin(rot), 0, px,
        sx*Math.sin(rot), sy*Math.cos(rot), 0, py,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]))
}

export function getviewmat( transform:Transform2D):Matrix4x4{
    const [px,py] = [transform.position.x,transform.position.y]
    const [sx,sy] = [transform.scale.x,transform.scale.y]
    const rot = transform.rot

    return new Matrix4x4(new Float32Array([
        sx*Math.cos(rot), -sx*Math.sin(rot), 0, px*sx*Math.cos(rot) - py*sx*Math.sin(rot),
        sy*Math.sin(rot), sy*Math.cos(rot), 0, px*sy*Math.sin(rot) + py*sy*Math.cos(rot),
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]))
}

export function getprojmat( width:number, height:number):Matrix4x4{
    const w = width
    const h = height

    return new Matrix4x4(new Float32Array([
        1/w, 0, 0, 0,
        0, 1/h, 0, 0, 
        0, 0, 1, 0, 
        0, 0, 0, 1,    
    ]))
}