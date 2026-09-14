---
layout: post
title: "Gatti imprevedibili e controlli più affidabili"
title_en: "Unpredictable cats and sturdier controls"
date: 2026-09-14 15:18:16 +0200
---

<div lang="it" markdown="1">

Nel pomeriggio il prototipo è cambiato in due punti: i gatti scappano in modo meno prevedibile, e i controlli funzionano come ci si aspetta anche su Mac.

## La fuga non è più una linea retta

Finora un gatto spaventato scappava sempre dritto, nella direzione opposta alla bambina: bastava vederlo una volta per sapere dove sarebbe andato. Adesso, quando si spaventa, sceglie una direzione a caso. L'unico vincolo è uno spicchio di 30° centrato sulla bambina: il gatto non le corre mai dritto incontro, ma può scappare di lato o perfino passarle accanto.

Il resto non cambia: in fuga è più veloce di lei, e finché scappa non si fa accarezzare.

## Accovacciarsi solo con Shift

Accovacciandosi con Ctrl, due frecce su quattro smettevano di funzionare. Per capire perché abbiamo registrato i tasti che arrivavano davvero alla pagina: con Ctrl premuto, ← e → non arrivavano proprio. Su macOS Ctrl+← e Ctrl+→ servono a cambiare scrivania, e il sistema li intercetta prima del browser. Nessun codice può recuperarli, quindi adesso ci si accovaccia solo con Shift, che funziona sia con WASD sia con le frecce. Su Windows, poi, Ctrl+W chiude la scheda: un motivo in più per lasciar perdere Ctrl.

## Un debug completo

Abbiamo fatto giocare al computer 300 partite simulate da due minuti, con input casuali e strategie diverse (inseguire, avvicinarsi di soppiatto, chiamare), controllando a ogni frame tutte le regole della meccanica. Nessuna violazione. I due problemi veri stavano fuori dalla logica:

- **Tasti bloccati su Mac.** Mentre Cmd è premuto, il browser non segnala quando si lasciano gli altri tasti, così la bambina poteva continuare a camminare da sola. Ora, quando si rilascia Cmd, i tasti vengono liberati.
- **Codice vecchio nel browser.** Il server di sviluppo non vietava la cache, e dopo una modifica il browser poteva continuare a usare i file precedenti. Ora il server chiede al browser di riscaricarli ogni volta.

I test automatici adesso sono 18.

</div>

<div lang="en" markdown="1">

This afternoon the prototype changed in two ways: cats flee less predictably, and the controls behave as expected on a Mac too.

## Fleeing is no longer a straight line

Until now a scared cat always ran straight away from the girl: see it once and you knew where it would go. Now, when it gets scared, it picks a random direction. The only constraint is a 30° wedge centred on the girl: the cat never runs straight at her, but it can bolt sideways or even dash past her.

Everything else stays the same: while fleeing it's faster than her, and it can't be petted until it stops.

## Crouching with Shift only

Crouching with Ctrl made two of the four arrow keys stop working. To find out why, we recorded the keys that actually reached the page: with Ctrl held, ← and → never arrived at all. On macOS, Ctrl+← and Ctrl+→ switch desktops, and the system grabs them before the browser does. No code can get them back, so crouching now uses Shift only, which works with both WASD and the arrow keys. On Windows, Ctrl+W closes the tab, one more reason to leave Ctrl alone.

## A full debugging pass

We had the computer play 300 simulated two-minute games, with random input and different strategies (chasing, sneaking up, calling), checking every rule of the mechanic on every frame. No violations. The two real problems were outside the game logic:

- **Stuck keys on a Mac.** While Cmd is held, the browser doesn't report when other keys are released, so the girl could keep walking on her own. Now releasing Cmd frees the keys.
- **Old code in the browser.** The development server didn't prevent caching, so after an edit the browser could keep using the previous files. Now the server asks the browser to download them again every time.

There are now 18 automated tests.

</div>
