# Handoff di fine sessione

- A ogni fine sessione (per esempio quando dico "chiudiamo qui"), prima di fermarti scrivi un documento di handoff in `.claude/handoff/AAAA-MM-GG-titolo-breve.md`, con la data di inizio della sessione
- È un devlog con gli steroidi, solo per lo sviluppo: non va nel devlog pubblico, ma va committato insieme al lavoro di chiusura della sessione, così lo leggono anche le sessioni in cloud
- Il documento deve contenere:
  - Sommario della sessione
  - Checkpoint raggiunti, con i riferimenti a commit e PR
  - Architettura del progetto: struttura dei file, moduli e come comunicano, pipeline degli asset
  - Decisioni chiave e il loro perché
  - Problemi aperti e prossimi passi
- Scrivi per chi riprende il lavoro senza aver visto la sessione: percorsi dei file, comandi, parametri, gotcha incontrati
- Quando riprendi il lavoro, prima allinea la copia locale con GitHub (le sessioni in cloud lavorano su branch `claude/...`), poi parti dall'handoff più recente
