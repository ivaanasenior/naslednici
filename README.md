
# Nasljedstvo Kalkulator - Next.js Aplikacija (Repozitorijum: naslednici)

Ovo je Next.js aplikacija - kalkulator za izračunavanje nasljednog dijela u Republici Srpskoj. Ovaj README sadrži detaljna uputstva za postavljanje projekta lokalno na vašem računaru i opciono za postavljanje na GitHub Pages.

**Naziv GitHub repozitorijuma za ovaj projekat treba da bude: `naslednici`**

## I. Kreiranje i pokretanje projekta LOKALNO na vašem računaru

Ovo su najvažniji koraci da aplikacija proradi na vašem računaru.

**Preduslovi:**
*   **Node.js i npm:** Morate imati instaliran Node.js (koji uključuje npm). Preporučuje se LTS verzija (18.17 ili novija). Možete ga preuzeti sa [nodejs.org](https://nodejs.org/).
*   **Editor koda:** Preporučuje se [Visual Studio Code](https://code.visualstudio.com/) (VS Code).

**Koraci:**

1.  **Kreirajte folder za projekat na svom računaru:**
    *   Na primjer, na Desktopu ili u Documents, napravite novi folder i nazovite ga tačno `naslednici`. Ovo je vaš osnovni (root) folder projekta.

2.  **Prekopirajte SVE fajlove i foldere u `naslednici` folder:**
    *   Otvorite `naslednici` folder u VS Code.
    *   **Pažljivo rekreirajte strukturu foldera i fajlova** tačno onako kako je prikazano u Firebase Studiju (ili u listi fajlova koju ste dobili).
    *   Za svaki fajl, kopirajte njegov kompletan sadržaj iz Firebase Studija i nalijepite ga u odgovarajući, novokreirani fajl na vašem računaru. Sačuvajte svaki fajl.
    *   **Posebno obratite pažnju na tačne putanje i nazive fajlova i foldera.** Ključni fajlovi za konfiguraciju su:
        *   `next.config.ts` (provjerite da li je `repoName` unutar njega postavljen na `'naslednici'`)
        *   `package.json`
        *   `tailwind.config.ts`
        *   `postcss.config.js`
        *   `src/app/globals.css`
        *   `src/app/layout.tsx`
        *   `public/manifest.json`

3.  **Kreirajte `public/icons` folder i PWA ikone:**
    *   Unutar `public` foldera (koji ste kreirali u koraku 2), napravite novi folder `icons`.
    *   Dodajte u njega dvije ikone:
        *   `icon-192x192.png` (PNG slika dimenzija 192x192 piksela)
        *   `icon-512x512.png` (PNG slika dimenzija 512x512 piksela)
    *   Ove ikone su potrebne za `manifest.json` i PWA funkcionalnost. Možete koristiti bilo koje odgovarajuće PNG slike ili ih generisati online. **Ako ove ikone ne postoje, PWA funkcionalnost neće raditi ispravno.**

4.  **Kreirajte `.nojekyll` fajl:**
    *   Unutar `public` foldera, kreirajte **prazan** fajl pod nazivom `.nojekyll` (sa tačkom na početku). Ovo je važno za kasnije postavljanje na GitHub Pages. Next.js će ga automatski kopirati u `out` folder tokom build-a.

5.  **Potpuno čista instalacija zavisnosti (VEOMA VAŽAN KORAK):**
    *   Otvorite terminal unutar VS Code-a (`Terminal` -> `New Terminal`). Uvjerite se da je terminal pozicioniran u vašem `naslednici` folderu.
    *   Ako ste prethodno pokušavali da instalirate ili pokrenete projekat, **prvo obrišite sledeće (ako postoje)** da biste osigurali potpuno čist početak:
        *   Obrišite folder `node_modules` (ako postoji u `naslednici` folderu).
        *   Obrišite fajl `package-lock.json` (ako postoji u `naslednici` folderu).
        *   Obrišite folder `.next` (ako postoji u `naslednici` folderu).
    *   Nakon brisanja, u terminalu pokrenite:
        ```bash
        npm install
        ```
    *   Sačekajte da se komanda izvrši. Ovo će preuzeti sve potrebne biblioteke. Ne bi trebalo da bude crvenih grešaka na kraju. (Poruke o "vulnerabilities" ili "funding" su uglavnom u redu za sada).

6.  **Pokrenite razvojni server:**
    *   Nakon što `npm install` uspješno završi, u istom terminalu pokrenite:
        ```bash
        npm run dev
        ```
    *   Sačekajte da se aplikacija kompajlira. Trebalo bi da vidite poruku da je server spreman na `http://localhost:9002`.

7.  **Testirajte aplikaciju lokalno:**
    *   Otvorite veb pregledač (Chrome, Firefox, Edge) i idite na adresu `http://localhost:9002`.
    *   **Provjerite da li aplikacija izgleda ispravno (da li ima plave boje, stilizovana dugmad, itd.) i da li je funkcionalna.**

**Ako LOKALNO i dalje NEMA STILOVA (aplikacija je samo tekst):**
*   **Provjerite konzolu pregledača:** Otvorite Developer Tools (obično F12), idite na "Console" tab. Da li postoje neke greške?
*   **Provjerite Network tab:** U Developer Tools, idite na "Network" tab. Osvježite stranicu (F5). Da li se CSS fajlovi (npr. iz `_next/static/css/...`) uopšte učitavaju? Da li imaju status 200 (OK) ili 404 (Not Found)?
*   **Provjerite terminal:** Da li u terminalu gdje se izvršava `npm run dev` postoje neke greške ili upozorenja vezana za Tailwind CSS, PostCSS, ili CSS module?
*   **`postcss.config.js`:** Provjerite da li `postcss.config.js` fajl postoji u root-u vašeg `naslednici` foldera i da li ima sledeći sadržaj:
    ```javascript
    module.exports = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };
    ```
*   **Osnovna Tailwind direktiva u `globals.css`:** Provjerite da li `src/app/globals.css` počinje sa:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
*   Ako sve ovo ne pomogne, problem je vjerovatno fundamentalniji i može biti vezan za vaše lokalno okruženje ili nekompatibilnost verzija. U tom slučaju, kreiranje potpuno novog, minimalnog Next.js + Tailwind projekta (`npx create-next-app@latest my-test --tailwind --typescript --eslint`) i provjera da li on radi može pomoći u dijagnostici.

## II. Postavljanje projekta na GitHub i GitHub Pages (opciono, nakon što radi lokalno)

Ovi koraci su za objavljivanje vaše aplikacije online koristeći GitHub Pages.

**Priprema (radite na svom lokalnom računaru, u `naslednici` folderu):**

1.  **Inicijalizujte Git i kreirajte prvi commit (ako već niste):**
    *   U terminalu, u `naslednici` folderu:
        ```bash
        git init -b main
        git add .
        git commit -m "Inicijalni commit kalkulatora za repozitorijum 'naslednici'"
        ```

2.  **Kreirajte repozitorijum na GitHub-u:**
    *   Idite na [GitHub.com](https://github.com/) i kreirajte **novi prazan repozitorijum** pod nazivom `naslednici`. Nemojte ga inicijalizovati sa README ili drugim fajlovima sa GitHub-a.

3.  **Povežite lokalni repozitorijum sa GitHub repozitorijumom:**
    *   Na stranici vašeg novog GitHub repozitorijuma, naći ćete URL. Izgledaće otprilike ovako: `https://github.com/<VASE-KORISNICKO-IME>/naslednici.git`.
    *   U terminalu (u vašem lokalnom `naslednici` folderu), pokrenite:
        ```bash
        git remote add origin https://github.com/<VASE-KORISNICKO-IME>/naslednici.git
        git push -u origin main
        ```
        (Zamijenite `<VASE-KORISNICKO-IME>` sa vašim GitHub korisničkim imenom.)

**Koraci za svaki deploy/update na GitHub Pages (radite na svom lokalnom računaru):**

4.  **Provjerite `repoName` u `next.config.ts`:**
    *   Otvorite fajl `next.config.ts` na vašem lokalnom računaru.
    *   Uvjerite se da je linija `const repoName = 'naslednici';` **tačno** postavljena.

5.  **Očistite prethodni build (preporučeno, posebno ako ima problema):**
    *   Ako postoji, obrišite lokalni `out` direktorijum i lokalni `.next` direktorijum.
    *   U terminalu: `rm -rf .next out` (ili ručno).

6.  **Pokrenite build produkcijske verzije LOKALNO:**
    *   Svaki put kada želite da ažurirate sajt na GitHub Pages, prvo morate napraviti novi build **LOKALNO**:
        ```bash
        npm run build
        ```
    *   Ova komanda će kreirati (ili ažurirati) `out` folder. `basePath` i `assetPrefix` će automatski biti primijenjeni.

7.  **LOKALNA PROVJERA `out/index.html` (VEOMA VAŽNO PRIJE DEPLOY-A):**
    *   Nakon što `npm run build` završi, na vašem lokalnom računaru otvorite fajl `naslednici/out/index.html` u tekst editoru.
    *   Unutar `<head>` sekcije:
        *   Potražite tagove `<link rel="stylesheet" href="...">`. Vrijednost `href` **mora** počinjati sa `/naslednici/...`.
        *   Potražite tag `<link rel="manifest" href="...">`. Njegov `href` **mora** biti `/naslednici/manifest.json`.
        *   Potražite `<script src="...">` tagove. Njihovi `src` atributi takođe **moraju** počinjati sa `/naslednici/_next/...`.
    *   **Ako ove putanje ne počinju sa `/naslednici/`, onda `basePath` i `assetPrefix` nisu ispravno primijenjeni.** Vratite se na korak 4 i 5.

8.  **Deployujte na GitHub Pages koristeći npm skriptu:**
    *   Vaš `package.json` sadrži `deploy` skriptu: `"deploy": "gh-pages -d out"`.
    *   U terminalu, u osnovnom folderu projekta:
        ```bash
        npm run deploy
        ```
    *   Ovo će sadržaj lokalnog `out` direktorijuma gurnuti na `gh-pages` granu.

9.  **Podesite GitHub Pages u podešavanjima repozitorijuma (samo prvi put ili ako mijenjate izvor):**
    *   Idite na vaš `naslednici` repozitorijum na sajtu GitHub.
    *   Kliknite na "Settings" tab -> "Pages".
    *   Pod "Build and deployment", za "Source", odaberite **"Deploy from a branch"**.
    *   Pod "Branch", odaberite granu **`gh-pages`** i folder **`/ (root)`**.
    *   Kliknite "Save".

10. **Sačekajte i posjetite sajt (očistite keš pregledača!):**
    *   Može proći nekoliko minuta dok GitHub Pages ne obradi izmjene.
    *   URL bi trebalo da bude: `https://<VASE-KORISNICKO-IME>.github.io/naslednici/`
    *   **VAŽNO:** Uradite "hard refresh" (Ctrl+Shift+R ili Cmd+Shift+R) ili očistite keš.

Ako i nakon ovih koraka problemi sa stilovima na GitHub Pages potraju, provjerite konzolu pregledača (Console i Network tabove) na deployovanom sajtu za 404 greške ili druge probleme sa učitavanjem resursa.
