# Elementor Menu Frontend Editor v3

Plugin WordPress per modificare contenuti Elementor dal frontend, specificamente progettato per menu di ristoranti.

## Funzionalità Principali

### 🍽️ Aggiunta Nuovi Piatti
Il bottone **"Aggiungi piatto"** permette di creare nuovi piatti direttamente dal frontend:

- **Posizionamento Intelligente**: I nuovi piatti vengono inseriti all'interno della categoria corretta
- **Struttura Automatica**: Clona la struttura di un piatto esistente o crea una struttura base
- **Stile Coerente**: Mantiene lo stile e la formattazione degli altri piatti
- **Salvataggio Completo**: Tutte le modifiche vengono salvate correttamente nel database

### 🎨 Editor Frontend
- **Modifica Titoli**: Cambia i nomi dei piatti
- **Modifica Descrizioni**: Aggiorna le descrizioni dei piatti
- **Modifica Prezzi**: Cambia i prezzi con supporto per valute multiple
- **Modifica Immagini**: Sostituisci le immagini dei piatti
- **Attributi Piatto**: Imposta attributi come vegetariano, gluten-free, piccante, chef special
- **Allergeni**: Gestisci gli allergeni presenti nei piatti

### 🔧 Gestione Sezioni
- **Duplicazione**: Duplica piatti e categorie esistenti
- **Spostamento**: Riorganizza l'ordine dei piatti e categorie
- **Eliminazione**: Rimuovi piatti e categorie non più necessarie

### 💰 Gestione Valute
- **Impostazioni Globali**: Configura valuta e formato per tutti i prezzi
- **Supporto Multi-Valuta**: Euro, Dollaro, Sterlina, Yen, Rublo, Franco
- **Posizionamento**: Valuta prima o dopo il prezzo

## Come Usare il Bottone "Aggiungi Piatto"

### Prerequisiti
1. La sezione deve essere marcata come **categoria** (classe CSS `category` o ID con `category`)
2. L'utente deve avere i permessi di editing
3. La modalità edit deve essere attiva

### Processo di Aggiunta
1. **Clicca** sul bottone "Aggiungi piatto" nella categoria desiderata
2. **Visualizza** il nuovo piatto con contenuto placeholder
3. **Modifica** i contenuti cliccando sui widget editabili
4. **Salva** tutte le modifiche cliccando "Salva ed esci"

### Struttura Creata
Il sistema crea automaticamente:
- **Titolo**: "Scrivi il titolo qui..."
- **Descrizione**: "Scrivi il testo qui..."
- **Prezzo**: "0€" (configurabile)
- **Immagine**: Placeholder (sostituibile)

## Configurazione

### Identificazione Categorie
Per far apparire il bottone "Aggiungi piatto", le sezioni devono essere marcate come categorie:

```html
<!-- Metodo 1: CSS Class -->
<div class="elementor-section category">
  <!-- Contenuto categoria -->
</div>

<!-- Metodo 2: CSS ID -->
<div id="category-primi">
  <!-- Contenuto categoria -->
</div>

<!-- Metodo 3: Data Attribute -->
<div data-category="true">
  <!-- Contenuto categoria -->
</div>
```

### Permessi Utente
Il plugin crea automaticamente il ruolo "Restaurant Editor" con permessi di editing.

## Risoluzione Problemi

### Il bottone non appare
- Verifica che la sezione sia marcata come categoria
- Controlla i permessi dell'utente
- Assicurati che la modalità edit sia attiva

### Il piatto non viene salvato
- Verifica che tutti i moduli JavaScript siano caricati
- Controlla la console del browser per errori
- Assicurati di cliccare "Salva ed esci"

### Stile non corretto
- Il sistema clona la struttura esistente
- Se non ci sono piatti esistenti, usa una struttura base
- Verifica che i CSS del tema non interferiscano

## Changelog

### v1.4 - Aggiunta Nuovi Piatti
- ✅ Bottone "Aggiungi piatto" funzionante
- ✅ Posizionamento corretto all'interno delle categorie
- ✅ Clonazione intelligente della struttura esistente
- ✅ Salvataggio completo nel database
- ✅ Stile coerente con i piatti esistenti
- ✅ Supporto per editing immediato dei nuovi piatti

### v1.3 - Gestione Valute
- ✅ Impostazioni valuta globali
- ✅ Supporto multi-valuta
- ✅ Formattazione automatica prezzi

### v1.2 - Attributi e Allergeni
- ✅ Gestione attributi piatto
- ✅ Sistema allergeni completo
- ✅ Icone dinamiche

### v1.1 - Editor Base
- ✅ Modifica titoli, descrizioni, prezzi, immagini
- ✅ Duplicazione e spostamento sezioni
- ✅ Interfaccia utente intuitiva

## Supporto

Per problemi o richieste di funzionalità, contatta lo sviluppatore.

---

**Sviluppato da Fofain** - Versione 1.4
