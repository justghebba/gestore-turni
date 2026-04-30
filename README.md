# Gestore turni settimanali — Cloudflare Pages + D1

Web app per creare e gestire turni di lavoro settimanali.
Frontend su Cloudflare Pages, dati persistiti su Cloudflare D1 (SQLite serverless).

---

## Struttura del progetto

```
cf-turni/
├── wrangler.toml                    ← configurazione Wrangler + binding D1
├── schema.sql                       ← schema tabelle D1
├── public/
│   └── index.html                   ← frontend completo
└── functions/
    └── api/
        ├── schedules.js             ← GET /api/schedules, POST /api/schedules
        ├── schedules/
        │   └── [id].js              ← GET /api/schedules/:id, DELETE /api/schedules/:id
        └── shifts/
            └── [id].js              ← PUT /api/shifts/:id
```

---

## Deploy passo per passo

### 1. Prerequisiti

- Account [Cloudflare](https://dash.cloudflare.com) (gratuito)
- Node.js 18+ installato
- Wrangler CLI: `npm install -g wrangler`

### 2. Login a Cloudflare

```bash
wrangler login
```

### 3. Crea il database D1

```bash
wrangler d1 create gestore-turni-db
```

Copia il `database_id` che appare nell'output e incollalo in `wrangler.toml`
al posto di `YOUR_DATABASE_ID_HERE`.

### 4. Applica lo schema

```bash
# Database di produzione
wrangler d1 execute gestore-turni-db --file=./schema.sql

# Oppure in locale per i test
wrangler d1 execute gestore-turni-db --local --file=./schema.sql
```

### 5. Carica il progetto su GitHub

```bash
git init
git add .
git commit -m "Prima versione gestore turni"
git remote add origin https://github.com/<tuo-username>/gestore-turni.git
git push -u origin main
```

### 6. Crea il progetto su Cloudflare Pages

1. Vai su **Cloudflare Dashboard → Workers & Pages → Create**
2. Seleziona **Pages → Connect to Git**
3. Collega il repository GitHub `gestore-turni`
4. Imposta:
   - **Build output directory**: `public`
   - Lascia vuoto il build command (nessun framework)
5. Clicca **Save and Deploy**

### 7. Collega il binding D1

1. Vai su **Workers & Pages → gestore-turni → Settings → Bindings**
2. Aggiungi un binding **D1 Database**:
   - Variable name: `DB`
   - D1 Database: `gestore-turni-db`
3. Salva e rideploya (o premi **Retry deployment**)

### 8. Collega il tuo dominio Cloudflare

1. Vai su **Workers & Pages → gestore-turni → Custom domains**
2. Clicca **Set up a custom domain**
3. Inserisci il tuo dominio (es. `turni.miodominio.it`)
4. Se il dominio è già gestito da Cloudflare, il record DNS viene creato automaticamente

---

## Test in locale

```bash
# Installa dipendenze Pages locali
npm install -g @cloudflare/wrangler

# Avvia in locale con D1 locale
wrangler pages dev public --d1=DB=gestore-turni-db
```

---

## API endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/schedules` | Lista di tutti i turni salvati |
| `POST` | `/api/schedules` | Crea una nuova settimana con dipendenti e celle |
| `GET` | `/api/schedules/:id` | Dettaglio completo turno (dipendenti + celle) |
| `DELETE` | `/api/schedules/:id` | Elimina turno (cascade su dipendenti e celle) |
| `PUT` | `/api/shifts/:id` | Aggiorna tipo di turno su una singola cella |

