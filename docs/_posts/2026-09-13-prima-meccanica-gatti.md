---
layout: post
title: "La prima meccanica: chiamare e accarezzare i gatti"
---

Nella seconda parte della giornata è arrivato il primo pezzo di gioco vero: una bambina che chiama i gatti e li accarezza. Per ora solo forme segnaposto, perché l'obiettivo è capire se la meccanica funziona.

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
