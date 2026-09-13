---
layout: post
title: "La prima meccanica: chiamare e accarezzare i gatti"
title_en: "The first mechanic: calling and petting cats"
---

<div lang="it" markdown="1">

Nella seconda parte della giornata è arrivato il primo pezzo di gioco vero: una bambina che chiama i gatti e li accarezza. Per ora solo forme segnaposto, perché l'obiettivo è capire se la meccanica funziona.

![Il prototipo nel browser: la bambina blu, un gatto verde già accarezzato, uno rosso in fuga e due grigi fermi]({{ "/assets/img/2026-09-13-prima-meccanica.png" | relative_url }})

## Come funziona

Il campo di prova è un'area piatta con quattro gatti fermi, fatti di sfere. La bambina è una capsula che si muove con WASD o con le frecce.

- **Accovacciarsi.** Tenendo premuto Ctrl o Shift la bambina si abbassa e rallenta.
- **Pspsps.** Da accovacciata, premendo E il gatto fermo più vicino, se è entro 8 unità, le viene incontro.
- **Niente corse.** Se la bambina corre verso un gatto, lui scappa per un paio di secondi. In fuga è più veloce di lei, quindi inseguirlo non serve.
- **Carezze.** Quando la bambina arriva a meno di un'unità da un gatto che non sta scappando, lo accarezza, e il contatore in alto sale.

I gatti cambiano colore in base a cosa stanno facendo: grigio se sono fermi, giallo se stanno arrivando, rosso se scappano, verde se sono stati accarezzati.

## Il livello arriva da Blender

Il campo di prova è stato costruito in Blender tramite Blender MCP ed esportato in GLB. Il gioco carica quel file e ne ricava la grandezza dell'area e le posizioni di bambina e gatti: per cambiare il livello basta spostare gli oggetti in Blender e riesportare.

## Cosa abbiamo corretto provando

- Il gatto in fuga era più lento della bambina: si faceva raggiungere e, al contatto, accarezzare. Ora è più veloce, e se alla fine della fuga gli si corre ancora addosso, riparte.
- Contro i bordi dell'area il gatto restava bloccato. Ora ci corre lungo.
- Per accovacciarsi, oltre a Ctrl, adesso funziona anche Shift.

La logica ha i suoi test automatici: raggio del richiamo, gatto che arriva e si fa accarezzare, fuga e ritorno alla calma, inseguimento, contatore.

</div>

<div lang="en" markdown="1">

Later in the day the first real piece of the game arrived: a girl who calls cats and pets them. Placeholder shapes only for now, because the goal is to find out whether the mechanic works.

![The prototype in the browser: the blue girl, a green cat already petted, a red one fleeing and two gray ones sitting still]({{ "/assets/img/2026-09-13-prima-meccanica.png" | relative_url }})

## How it works

The test field is a flat area with four idle cats made of spheres. The girl is a capsule that moves with WASD or the arrow keys.

- **Crouching.** Holding Ctrl or Shift, the girl crouches and slows down.
- **Pspsps.** While crouching, pressing E makes the nearest idle cat within 8 units come to her.
- **No running.** If the girl runs toward a cat, it flees for a couple of seconds. While fleeing it's faster than her, so chasing it is pointless.
- **Petting.** When the girl gets within one unit of a cat that isn't fleeing, she pets it and the counter at the top goes up.

Cats change color depending on what they're doing: gray when idle, yellow when coming over, red when fleeing, green once petted.

## The level comes from Blender

The test field was built in Blender through Blender MCP and exported as GLB. The game loads that file and reads the size of the area and the starting positions of the girl and the cats from it: to change the level, move the objects in Blender and export again.

## What we fixed while playing

- The fleeing cat was slower than the girl: she could catch it and, on contact, pet it. Now it's faster, and if she's still running at it when it stops, it runs off again.
- The cat used to get stuck against the edges of the area. Now it runs along them.
- Besides Ctrl, Shift now works for crouching too.

The logic has automated tests: call radius, a cat coming over and getting petted, fleeing and calming down, chasing, and the counter.

</div>
