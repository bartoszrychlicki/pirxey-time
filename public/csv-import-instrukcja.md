# Instrukcja wypelniania szablonu CSV - Pirxey Time

Ponizej znajduje sie pelna specyfikacja formatu CSV do importu wpisow czasu pracy w aplikacji Pirxey Time. Instrukcja jest przeznaczona zarowno dla ludzi, jak i dla modeli jezykowych (LLM), ktore moga pomoc w przygotowaniu pliku.

---

## Format pliku

- **Typ**: CSV (Comma-Separated Values)
- **Kodowanie**: UTF-8 (z opcjonalnym BOM)
- **Separator kolumn**: przecinek `,`
- **Separator dziesietny**: nie dotyczy (brak pol numerycznych)
- **Koniec linii**: `\n` lub `\r\n`
- **Cytowanie pol**: pola zawierajace przecinki, cudzyslowy lub znaki nowej linii musza byc objete podwojnymi cudzyslowami `"`. Cudzyslowy wewnatrz pola escapuj podwojnym cudzyslowem `""`.

---

## Kolumny (naglowek)

Pierwsza linia pliku **musi** zawierac dokladnie te naglowki (kolejnosc dowolna):

| Kolumna        | Wymagana | Opis                                      |
|----------------|----------|--------------------------------------------|
| `Opis`         | Tak      | Opis wpisu czasu pracy (min. 1 znak)      |
| `Projekt`      | Tak      | Nazwa projektu (musi istniec w systemie)   |
| `Data`         | Tak      | Data wpisu                                 |
| `Start`        | Tak      | Godzina rozpoczecia                        |
| `Koniec`       | Tak      | Godzina zakonczenia                        |
| `Tagi`         | Nie      | Tagi przypisane do wpisu                   |
| `Rozliczeniowy`| Nie      | Czy wpis jest rozliczeniowy (billable)     |

---

## Specyfikacja pol

### Opis

- **Format**: dowolny tekst
- **Wymagane**: tak, minimum 1 znak
- **Przyklad**: `Sprint planning`, `Code review PR #42`, `Spotkanie z klientem`

### Projekt

- **Format**: dokladna nazwa projektu istniejacego w systemie
- **Dopasowanie**: **bez rozrozniania wielkosci liter** (case-insensitive)
- **Wymagane**: tak
- **Wazne**: jesli nazwa projektu nie pasuje do zadnego z istniejacych projektow, caly import zostanie odrzucony
- **Przyklad**: `Pirxey Dashboard`, `Internal Tools`, `Aurora Mobile App`

### Data

- **Format**: `YYYY-MM-DD` (rok-miesiac-dzien)
- **Wymagane**: tak
- **Przyklady**: `2026-02-07`, `2026-01-15`, `2025-12-31`
- **Niepoprawne**: `07.02.2026`, `2026/02/07`, `7 lutego 2026`

### Start

- **Format**: `HH:mm` (godzina:minuty, zegar 24-godzinny)
- **Wymagane**: tak
- **Przyklady**: `09:00`, `14:30`, `00:15`
- **Niepoprawne**: `9:00`, `2:30 PM`, `14.30`

### Koniec

- **Format**: `HH:mm` (godzina:minuty, zegar 24-godzinny)
- **Wymagane**: tak
- **Musi byc pozniejsza niz Start** (lub rowna w przypadku przejscia przez polnoc)
- **Przyklady**: `10:30`, `18:00`, `23:45`

### Tagi

- **Format**: nazwy tagow oddzielone srednikiem i spacja `; `
- **Dopasowanie**: **bez rozrozniania wielkosci liter** (case-insensitive)
- **Wymagane**: nie (mozna zostawic puste)
- **Wazne**: jesli nazwa tagu nie pasuje do zadnego z istniejacych tagow, caly import zostanie odrzucony
- **Przyklady**:
  - Jeden tag: `coding`
  - Wiele tagow: `coding; planning`
  - Puste: *(zostawic puste pole)*

### Rozliczeniowy

- **Format**: `Tak` lub `Nie`
- **Wymagane**: nie (domyslnie `Nie`)
- **Akceptowane wartosci dla "tak"**: `Tak`, `yes`, `1`
- **Wszystko inne** (w tym puste pole) jest traktowane jako `Nie`

---

## Przykladowe dane

```csv
Opis,Projekt,Data,Start,Koniec,Tagi,Rozliczeniowy
"Sprint planning","Pirxey Dashboard","2026-02-07","09:00","10:30","spotkanie; planning","Tak"
"Code review PR #42","Pirxey Dashboard","2026-02-07","11:00","12:00","coding","Tak"
"Aktualizacja dokumentacji","Internal Tools","2026-02-07","13:00","14:30","","Nie"
"Daily standup","Pirxey Dashboard","2026-02-07","09:00","09:15","spotkanie","Tak"
```

---

## Zasady walidacji

1. **Walidacja atomowa** - albo **wszystkie** wpisy sa poprawne i zostana zaimportowane, albo **zaden** wpis nie zostanie dodany. Nie ma czesciowego importu.
2. **Nazwy projektow** musza dokladnie odpowiadac istniejacym projektom w systemie (porownanie bez rozrozniania wielkosci liter).
3. **Nazwy tagow** musza dokladnie odpowiadac istniejacym tagom w systemie (porownanie bez rozrozniania wielkosci liter).
4. **Opis** nie moze byc pusty.
5. **Data** musi byc w formacie `YYYY-MM-DD`.
6. **Start** i **Koniec** musza byc w formacie `HH:mm`.
7. **Czas trwania** (obliczany automatycznie z Start i Koniec) musi byc wiekszy niz 0 minut.

---

## Czeste bledy

| Blad | Przyczyna | Rozwiazanie |
|------|-----------|-------------|
| `Nieznany projekt: "..."` | Nazwa projektu nie istnieje w systemie | Sprawdz dokladna nazwe projektu w aplikacji (zakladka Projekty) |
| `Nieznany tag: "..."` | Nazwa tagu nie istnieje w systemie | Sprawdz dokladna nazwe tagu w aplikacji (zakladka Tagi) |
| `Nieprawidlowy format daty` | Data nie jest w formacie YYYY-MM-DD | Uzyj formatu np. `2026-02-07` |
| `Nieprawidlowy format godziny` | Godzina nie jest w formacie HH:mm | Uzyj formatu np. `09:00` (z zerem wiodacym) |
| `Opis jest wymagany` | Pole Opis jest puste | Dodaj opis do kazdego wpisu |
| `Czas trwania musi byc wiekszy niz 0` | Start = Koniec lub blad obliczenia | Upewnij sie ze Koniec > Start |
| `Brak wymaganej kolumny` | Brakuje kolumny w naglowku | Dodaj brakujaca kolumne do naglowka |

---

## Instrukcja dla AI / LLM

Jesli uzywasz modelu jezykowego (np. ChatGPT, Claude) do przygotowania pliku CSV:

1. **Wyslij mu te instrukcje** oraz opis wpisow, ktore chcesz zaimportowac.
2. **Podaj nazwy projektow i tagow** ktore istnieja w Twoim systemie, zeby AI mogl uzyc poprawnych nazw.
3. **Poprosy AI** zeby wygenerowalo gotowy plik CSV zgodny z powyzszym formatem.
4. **Sprawdz wynik** - upewnij sie, ze nazwy projektow i tagow sa poprawne.

### Przykladowy prompt dla AI:

```
Przygotuj mi plik CSV do importu wpisow czasu pracy w Pirxey Time.
Format: [wklej te instrukcje lub link do nich]

Moje projekty: Pirxey Dashboard, Internal Tools, Aurora Mobile App
Moje tagi: spotkanie, coding, planning

Wpisy do dodania:
- Poniedzialek 3 lutego: 9:00-10:30 sprint planning (Pirxey Dashboard, spotkanie + planning, rozliczeniowy)
- Poniedzialek 3 lutego: 11:00-13:00 implementacja API (Pirxey Dashboard, coding, rozliczeniowy)
- Poniedzialek 3 lutego: 14:00-15:00 aktualizacja dokumentacji (Internal Tools, nierozliczeniowy)
```

### Oczekiwany wynik AI:

```csv
Opis,Projekt,Data,Start,Koniec,Tagi,Rozliczeniowy
"Sprint planning","Pirxey Dashboard","2026-02-03","09:00","10:30","spotkanie; planning","Tak"
"Implementacja API","Pirxey Dashboard","2026-02-03","11:00","13:00","coding","Tak"
"Aktualizacja dokumentacji","Internal Tools","2026-02-03","14:00","15:00","","Nie"
```
