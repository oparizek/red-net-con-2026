# RedNetCon 2026 – Live Event Dashboard

## Přehled
Statická single-page aplikace (HTML/CSS/JS) – live dashboard pro účastníky konference **RedNetCon – Festival techniky** (15. února 2026, Sokolovna Náměšť nad Oslavou).

## Struktura projektu
```
index.html          – Hlavní stránka
css/style.css       – Styly (mobile-first, responzivní)
js/app.js           – Logika (rendering, filtrování, odpočet, modaly)
data/schedule.json  – Program konference (data)
```

## Jak spustit
Otevřít `index.html` v prohlížeči. Kvůli `fetch()` je potřeba servovat přes HTTP:
```bash
python3 -m http.server 8000
# nebo
npx serve .
```

## Jazyk UI
Celý web je v **češtině** – veškerý UI text, popisky, filtry, labely.

## Klíčové funkce
- **Právě probíhá** – zvýrazněná karta aktuální session s odpočtem
- **Program** – timeline seřazená chronologicky s oddělovači dnů
- **Filtrování** – podle typu (přednáška/workshop) a dne (sobota/neděle)
- **Detail modal** – kliknutím na kartu se zobrazí popis a info o speakerovi
- **Info panel** – místo konání, mapa, základní info
- **Responzivní** – mobile-first design

## Data
`data/schedule.json` obsahuje:
- `conference` – metadata o akci
- `sessions` – pole session objektů (typ `talk` nebo `workshop`)

## Konvence
- Plain vanilla JS (žádné frameworky)
- CSS custom properties pro theming
- Celý JS zabalený v IIFE
