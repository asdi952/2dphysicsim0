import { createCounter } from "./primitives"

class DataResource{
    constructor(
        public data:any ,
        public id:number,
    ){}
}

export class DataResourcer{
    resources:Map<any, DataResource> = new Map()
    private counter = createCounter()

    addresource(data:any){
        let res = this.resources.get(data)
        if(res == undefined){
            res = new DataResource(data, this.counter())
        }
        return res
    }
}


