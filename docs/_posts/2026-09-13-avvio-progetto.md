---
layout: post
title: "Avvio del progetto"
---

Primo giorno di Pet Them All. Niente gameplay per ora: oggi abbiamo preparato le basi su cui lavorare.

## Le regole del progetto

Abbiamo scritto due file di convenzioni per Claude, che ci aiuta a sviluppare il gioco.

Per il **gameplay**, ogni feature va testata prima di passare alla successiva. In questa fase si lavora solo sulle meccaniche, con geometria segnaposto: cubi e sfere, nessun asset definitivo.

Per l'**arte in Blender**:

- anteprime renderizzate con Eevee;
- al massimo 2.000 triangoli per gli oggetti di scena e 20.000 per i personaggi principali;
- asset finali esportati in GLB;
- fonte e licenza di ogni asset annotate in `CREDITS.md`.

## Un devlog che non si dimentica

Abbiamo aggiunto un controllo automatico: quando Claude finisce di lavorare, verifica se ci sono commit di oggi senza un post nel devlog. Se il post manca, chiede di scriverlo. Questo è il primo.
