# Entwicklungsablauf

1. Neue Version entsteht auf einem Arbeitsbranch (`dev/<thema>`), danach Push auf `test`.
2. Der Workflow `preview.yml` veröffentlicht den Stand unter `https://dephosa.github.io/hoermann-mut/test/`.
3. Die Vorschau nutzt getrennte Firestore-Sammlungen (`test_scores`, `test_events`).
4. Nach Freigabe wird nach `main` übernommen und `version.json` hochgezählt. Erst dann ist es live.

Hinweis: Live und Vorschau teilen denselben Browser-Speicher (localStorage). Neue Versionen müssen
bestehende Speicherformate weiterlesen können.
