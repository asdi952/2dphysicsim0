<script>
    import { onMount } from "svelte";
    import { canvas, main, s_canvasloaded } from "../lib/sim/main";

    main()

    onMount(()=>{
        s_canvasloaded.activate()
        return ()=>{s_canvasloaded.reset()}
    })

    import.meta.hot?.dispose(()=>{
        s_canvasloaded.reset()
    })
</script>

<div class="flex items-center justify-center h-screen w-screen bg-gray-900">
    <canvas bind:this={canvas.elm} width={canvas.width} height={canvas.height} 
        class="shadow-lg rounded-lg border-2 border-blue-900"
    ></canvas>
</div>
