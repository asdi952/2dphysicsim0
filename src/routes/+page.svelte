<script lang="ts">
    import { onMount } from "svelte";
    import {Sim } from "../lib/sim/main";
    import { makeTuple, MWritable, mwritable } from "$lib/sim/primitives";
    import { geterror } from "$lib/sim/error";

    let canvas:HTMLCanvasElement
    let width = mwritable(700)
    let height = mwritable(800)

    const sim = new Sim()
    // main()
    const s_canvasloaded = sim.init()
    sim.run()

    onMount(()=>{
        sim.s_canvasloaded.activate(makeTuple( canvas, width, height))

        return ()=>{sim.deinit()}
    })

</script>

<div class="flex items-center justify-center h-screen w-screen bg-gray-900">
    <canvas bind:this={canvas} width={$width} height={$height} 
        class="shadow-lg rounded-lg border-2 border-blue-900"
    ></canvas>
</div>
