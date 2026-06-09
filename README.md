# Risk Score

Statyczna aplikacja webowa MVP typu hazard log dla projektu **SPARK-X**. Rozwiązanie działa jako zestaw plików **HTML/CSS/JavaScript** bez Reacta i bez backendu aplikacyjnego, więc można je hostować np. na **GitHub Pages** albo uruchomić przez otwarcie `index.html`.

## Uruchomienie

1. Otwórz `/home/runner/work/RiskScore/RiskScore/Miciak/RiskScore/index.html` w przeglądarce.
2. Albo hostuj katalog jako statyczną stronę.
3. Dane zapisują się automatycznie w `localStorage`.

## Zakres MVP

Aplikacja zawiera:
- listę hazardów z filtrowaniem po pillar, statusie, actionee, SRAC, initial risk, residual risk i tekście,
- formularz hazardu z workflow 5-etapowym i sekcjami A–F,
- automatyczne liczenie `initial_risk` i `residual_risk` z konfigurowalnej macierzy `F x S`,
- uproszczony model ról w UI: Workshop Participant, Safety Engineer, Actionee, Safety Manager,
- walidacje biznesowe dla statusów, mitigation, evidence, SIL i zamknięcia rekordu,
- lokalny audit log zmian z użytkownikiem/rolą i timestampem,
- dashboard z podstawowymi metrykami,
- eksport hazardów do CSV,
- eksport/import pełnych danych do JSON,
- import hazardów z plików XLS/XLSX po stronie klienta.

## Zapis lokalny

Stan aplikacji jest przechowywany w `localStorage` pod kluczem `riskscore_hazard_log_v1`. Zapisywane są hazardy, audit log, konfiguracja projektu i podstawowy stan UI.

## Import / eksport danych

### JSON
- eksport JSON zapisuje pełny stan aplikacji,
- import JSON nadpisuje lokalny stan stanem z pliku.

### CSV
- eksport CSV generuje plik z hazardami oraz metadanymi `created_by`, `created_at`, `updated_by`, `updated_at`.

### XLS / XLSX
Obsługiwane kolumny arkusza:
- `hazard_id`
- `pillar`
- `root_cause`
- `propagation`
- `external_effect`
- `initial_frequency`
- `severity`
- `mitigation`
- `required_sil`
- `residual_frequency`
- `srac_flag`
- `actionee`
- `closure_status`
- `verification_evidence`
- `comments`

Zasady importu:
- brakujący `hazard_id` jest generowany automatycznie,
- po imporcie ryzyka są przeliczane z aktywnej macierzy,
- rekordy błędne są pomijane, a użytkownik widzi raport błędów,
- import XLS/XLSX używa biblioteki SheetJS ładowanej z CDN.

## Role i uprawnienia w UI

Aplikacja nie ma bezpiecznego logowania. Rola jest wybierana ręcznie i służy do uproszczonego ograniczania akcji w UI.

- **Workshop Participant** – przygotowuje robocze wpisy.
- **Safety Engineer** – edytuje ocenę ryzyka, mitigation i statusy robocze.
- **Actionee** – aktualizuje działania, evidence i status implementacji.
- **Safety Manager** – ma pełną edycję, może zapisać `CLOSED` i zmieniać konfigurację projektu.

## Ograniczenia bez backendu

- brak centralnej bazy danych i synchronizacji wielu użytkowników,
- brak bezpiecznego uwierzytelniania i serwerowego wymuszania uprawnień,
- audit log i role są lokalne dla przeglądarki,
- import XLS/XLSX wymaga biblioteki z CDN, więc pełny tryb offline nie obejmuje tej funkcji.

## Struktura plików

- `index.html` – layout aplikacji,
- `styles.css` – stylowanie i kolorowanie ryzyk,
- `js/constants.js` – słowniki i stałe,
- `js/storage.js` – zapis/odczyt `localStorage`,
- `js/riskMatrix.js` – obliczanie ryzyka,
- `js/validation.js` – reguły walidacji,
- `js/audit.js` – wpisy audit log,
- `js/importExport.js` – eksport/import JSON/CSV/XLSX,
- `js/ui.js` – renderowanie UI,
- `js/app.js` – inicjalizacja aplikacji i obsługa zdarzeń.
