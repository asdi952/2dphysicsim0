
import StackTrace, { type StackFrame } from "stacktrace-js" 

export class AssertError extends Error{
    errortype = "AssertError"
    promise:Promise<StackFrame[]>

    constructor(message:string){
        super(message)

        this.promise = (async ()=>{
            const frames = await StackTrace.fromError(this)
            return frames.slice(2)
        })()
    }
}

export function exit(msg:string){
    throw new AssertError(msg)
}

export function geterror(msg:string){
    return new AssertError(msg)
}


export async function printErrorStack(error: AssertError) {
    function format_filename(name?: string): string {
        if (!name) return "";
        const url = new URL(name);
        return url.pathname;
    }

    function stacklines(frames: StackFrame[]) {
        let head = "";
        let headStyles: string[] = [];

        let tail = "";
        let tailStyles: string[] = [];

        let seenModules = false;

        for (const f of frames) {
            const filename = format_filename(f.fileName);

            const line = `\t ${f.lineNumber} | %c${f.functionName}%c | ${filename}\n`;
            const styles = ["color: red; font-weight: bold;", "color: inherit;"];

            if (!seenModules && filename.startsWith("/src/")) {
                head += line;
                headStyles.push(...styles);
            } else {
                seenModules = true;
                tail += line;
                tailStyles.push(...styles);
            }
        }

        return { head, headStyles, tail, tailStyles };
    }

    const frames = await error.promise;
    const { head, headStyles, tail, tailStyles } = stacklines(frames);

    // print the error and head frames
    console.error(`[ASSERT ERROR]: ${error.message}\n${head}`, ...headStyles);

    //rest of the stack taht comes from modules
    if (tail) {
        console.groupCollapsed("… external / module frames …");
        console.log(tail, ...tailStyles);
        console.groupEnd();
    }
}