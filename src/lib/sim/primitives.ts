import { writable, type Updater, type Writable } from "svelte/store";
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

export class Signal<Type>{
    private activated:boolean = false
    private subscribers: (()=>void)[] = []
    private promise:Promise<Type>
    private promiseResolve?:(data:Type)=>void

    constructor(){
        this.promise = new Promise<Type>((r)=>{this.promiseResolve = r})
    }

    activate(data:Type){
        if(this.activated == true){exit(`signal already activated`); return}
        this.activated = true

        this.subscribers.forEach(s=>s())

        if(this.promiseResolve == undefined){exit("promise resolve undefined");return}
        this.promiseResolve(data)
    }

    wait():Promise<Type>{return this.promise}

    subscribe(callback:()=>void){
        this.subscribers.push(callback)
    }

    reset(){
        this.promiseResolve = undefined
        this.promise = new Promise<Type>((r)=>{this.promiseResolve = r})
        this.subscribers = []
        this.activated = false
    }
}


export class FixedList<Type>{
    private arr:(Type|undefined)[] = []
    private free:number[] = []

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



class WeakPointer<Type>{
    constructor(
        public mpt:MasterPointer<Type>|null,
    ){}
    
    get(){
        if(this.mpt == null){return undefined}
        return this.mpt.ptr
    }
}
class MasterPointer<Type>{
    weakpt:WeakPointer<Type>[] = []
    constructor(
        public ptr: Type,
    ){}

    get():Type{
        return this.ptr
    }

    get_weakptr(){
        return new WeakPointer(this)
    }

    delete(){
        this.weakpt.forEach(w=>{w.mpt = null})
    }
}

export function createCounter(){
    let count = 0
    return ()=>{
        const aux = count
        count += 1
        return aux
    }
}

export class DoubleKeyMap<K0, K1, V> {
    private map = new Map<string, V>();

    private makeKey(k0: K0, k1: K1): string {
        return `${String(k0)}::${String(k1)}`;
    }

    get(k0: K0, k1: K1): V | undefined {
        return this.map.get(this.makeKey(k0, k1));
    }

    set(k0: K0, k1: K1, value: V): this {
        this.map.set(this.makeKey(k0, k1), value);
        return this;
    }

    has(k0: K0, k1: K1): boolean {
        return this.map.has(this.makeKey(k0, k1));
    }

    delete(k0: K0, k1: K1): boolean {
        return this.map.delete(this.makeKey(k0, k1));
    }
}

class SmartPointerRef<Type>{
    constructor(
        private ref: SmartPointer<Type>
    ){}

    get():Type{
        return this.ref.ptr!
    }
    set(value:Type){
        this.ref.ptr = value
    }
    delete(){
        this.ref.delete_ref()
    }

    clone(){
        return this.ref.create_ref()
    }
}

class SmartPointer<Type>{
    static manager: FixedList<SmartPointer<any>> = new FixedList()
    manager_ticket:number

    refcount:number = 0

    private constructor(
        public ptr?:Type
    ){
        this.manager_ticket = SmartPointer.manager.push(this)
    }

    static create<Type>(data:Type){
        const self = new SmartPointer(data)
        return self.create_ref()
    }

    create_ref(){
        this.refcount += 1
        return new SmartPointerRef(this)
    }

    delete_ref(){
        this.refcount--
        this.ptr = undefined
        if(this.refcount == 0){SmartPointer.manager.remove(this.manager_ticket)}
    }
}

export class MWritable<T> implements Writable<T> {
    private store: Writable<T>;
    public data: T;

    constructor(initial: T) {
        this.data = initial;
        this.store = writable(initial);
    }

    // store methods
    subscribe(run: (value: T) => void, invalidate?: (value?: T) => void) {
        return this.store.subscribe(run, invalidate);
    }

    set(value: T) {
        this.data = value;
        this.store.set(value);
    }

    update(updater: Updater<T>) {
        const value = updater(this.data);
        this.data = value;
        this.store.set(value);
    }

    // extra method
    get(): T {
        return this.data;
    }
}

export function mwritable<T>(value:T){
    return new MWritable(value)
}

export type Tuple<T extends unknown[]> = T;

export function makeTuple<T extends unknown[]>(...args: T): T {
  return args;
}

export class Ptr<T>{
    constructor(
        public ptr:T
    ){}
}