---
layout: post
title: "Il taccuino: ogni gatto si racconta un pezzo alla volta"
title_en: "The notebook: each cat reveals itself one bit at a time"
date: 2026-09-14 10:40:08 +0200
---

<div lang="it" markdown="1">

Finora i gatti erano quattro palline intercambiabili: cambiavano colore in base a quello che stavano facendo, ma non c'era niente che distinguesse il primo dal terzo. Adesso ognuno ha un taccuino, e si riempie giocando.

## Come si scoprono i tratti

Ogni gatto ha un id, un nome segnaposto (`Gatto 1`, `Gatto 2`…) e la lista dei tratti scoperti finora. I tratti non si sbloccano con un pulsante: arrivano da quello che il gatto fa mentre gli stai intorno.

- **La prima volta che scappa** finisce nel taccuino che *è timido, scappa se ti avvicini in fretta*.
- **La prima volta che si fa accarezzare** ne salta fuori uno pescato a caso da un pool di quattro: adora le coccole sulla schiena, fa le fusa fortissimo, ha un miao acutissimo, si struscia sempre sulle gambe.

Ogni trigger scatta una volta sola per gatto. Se lo spaventi di nuovo, o se lo accarezzi di nuovo, il taccuino non si allunga: ogni gatto tiene un flag per trigger, quindi a reggere è il flag e non il fatto che lo stato capiti una volta sola.

Nessuno stato nuovo: i due trigger sono gli stessi `in_fuga` e `accarezzato` che il gioco aveva già. Il taccuino si attacca ai cambi di stato esistenti invece di raddoppiare la macchina a stati.

## Il pannello

In alto a sinistra, sotto il contatore, c'è l'elenco dei gatti incontrati con i loro tratti. Compaiono solo i gatti su cui si è scoperto qualcosa: finché non ne avvicini nessuno il pannello dice che non hai ancora incontrato niente, e non anticipa quanti gatti ci sono. Si aggiorna nel momento esatto in cui un tratto si sblocca.

Testo semplice, nessuno stile: come il resto del prototipo, serve a leggere la meccanica, non a far bella figura.

## I test

Il pescaggio casuale è iniettabile, così i test scelgono il tratto invece di subirlo. Coprono la prima fuga, la prima carezza (inizio, metà e fine del pool), il fatto che senza random iniettato il tratto arrivi comunque dal pool, e le due non-duplicazioni: seconda fuga e seconda carezza dello stesso gatto non aggiungono niente.

</div>

<div lang="en" markdown="1">

Until now the cats were four interchangeable blobs: they changed color depending on what they were doing, but nothing told the first one apart from the third. Now each of them has a notebook, and it fills up as you play.

## How traits are discovered

Every cat has an id, a placeholder name (`Gatto 1`, `Gatto 2`…) and the list of traits discovered so far. Traits aren't unlocked with a button: they come out of what the cat does while you're around it.

- **The first time it runs away**, the notebook records that *it's shy, it bolts if you come at it fast*.
- **The first time it lets itself be petted**, one trait is drawn at random from a pool of four: loves back scratches, purrs incredibly loudly, has a very high-pitched meow, always rubs against your legs.

Each trigger fires once per cat. Scare it again, or pet it again, and the notebook doesn't grow: every cat keeps a flag per trigger, so what holds is the flag, not the state happening only once.

No new states: the two triggers are the same `in_fuga` and `accarezzato` the game already had. The notebook hooks into the existing state changes instead of duplicating the state machine.

## The panel

Top left, under the counter, sits the list of cats met so far with their traits. Only cats you've learned something about show up: until you get near one the panel says you haven't met anything yet, and it doesn't give away how many cats there are. It refreshes the moment a trait unlocks.

Plain text, no styling: like the rest of the prototype, it's there to read the mechanic, not to look good.

## The tests

The random draw is injectable, so the tests pick the trait instead of putting up with it. They cover the first flee, the first petting (start, middle and end of the pool), the fact that without an injected random the trait still comes from the pool, and the two non-duplications: a second flee and a second petting of the same cat add nothing.

</div>
