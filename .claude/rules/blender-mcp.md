# Convenzioni arte/Blender

- Motore render per turnaround/anteprime: Eevee, mai Cycles
- Poly budget: props ambiente <2.000 tris, personaggi hero <20.000 tris
- Export asset finali in GLB
- Props generici: usa i tool di download diretto (download_polypizza_model, download_polyhaven_asset, download_sketchfab_model) prima di generare da zero via script bpy
- Personaggi con volto/identità specifica: prova prima generate_hyper3d_model_via_images o generate_hunyuan3d_model; se il risultato non regge (volto illeggibile, topologia rotta), fallback sulla pipeline concept art (ChatGPT) → Meshy → riduzione/rig via execute_blender_code
- Annota in CREDITS.md fonte e licenza di ogni asset scaricato o generato