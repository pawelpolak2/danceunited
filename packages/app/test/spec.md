## 6. Weryfikacja i testowanie systemu (Aktualizacja: Luty 2026)

Celem procesu testowania jest automatyczne potwierdzenie stabilności kluczowych funkcji systemu (Smoke Testing) oraz weryfikacja poprawności integracji z bazą danych i interfejsem użytkownika. Przyjęto strategię hybrydową: testy E2E (Playwright) dla ścieżek krytycznych oraz testy jednostkowe (Vitest) dla logiki biznesowej.

### 6.1. Środowisko testowe i narzędzia

Testy przeprowadzono w środowisku lokalnym, symulującym warunki produkcyjne przy użyciu kontenerów Docker oraz narzędzi do automatyzacji przeglądarki.

- **Sprzęt:** Procesor Apple M1 / Intel i7, 16GB RAM (lokalna maszyna deweloperska).
- **System operacyjny:** macOS (Host), Linux (Docker).
- **Przeglądarki (E2E):** 
    - Chromium (Google Chrome v120+).
    - Firefox (wersja ESR).
    - WebKit (Safari Engine).
- **Baza danych:** PostgreSQL 16 (kontener Docker), zarządzana przez Prisma ORM.
- **Narzędzia wspomagające:**
    - **Playwright:** Automatyzacja testów E2E, nagrywanie wideo z przebiegu testów (`Trace Viewer`).
    - **Vitest:** Wykonywanie testów jednostkowych (`.test.ts`).
    - **db-helper.ts:** Skrypt pomocniczy (fixture) do bezpośredniej manipulacji stanem bazy danych (seedowanie danych, weryfikacja rekordów, podnoszenie uprawnień) z poziomu testów E2E, omijający ograniczenia importów w środowisku uruchomieniowym Playwright.

### 6.2. Zakres i scenariusze testów automatycznych (E2E)

Poniżej przedstawiono zaimplementowane i zweryfikowane przypadki testowe znajdujące się w katalogu `e2e/`.

#### Moduł 1: Uwierzytelnianie (Auth) - `e2e/auth.spec.ts`

| ID Przypadku | Nazwa Testu | Warunki Wstępne | Kroki Testowe (Automatyczne) | Oczekiwany Rezultat |
|---|---|---|---|---|
| **TC-AUTH-01** | Rejestracja nowego użytkownika | Brak | 1. Wejdź na `/register`.<br>2. Poczekaj na pełne załadowanie aplikacji (`networkidle`).<br>3. Wypełnij formularz (Imię, Nazwisko, Email, Hasło).<br>4. Zaznacz checkboxy zgód (TOS, Privacy) z wymuszeniem kliknięcia (`force: true`).<br>5. Kliknij "Create account". | Przekierowanie na stronę główną (`/`). Brak błędów walidacji w UI. |
| **TC-AUTH-02** | Logowanie istniejącego użytkownika | Użytkownik zarejestrowany w kroku poprzednim. | 1. Wyczyść ciasteczka sesyjne.<br>2. Wejdź na `/login`.<br>3. Wypełnij formularz logowania.<br>4. Kliknij "Sign in". | Przekierowanie z adresu `/login` (sukces logowania). |

#### Moduł 2: Zarządzanie Danymi (Data Management) - `e2e/data-management.spec.ts`

Testy w tym module uruchamiane są w trybie **szeregowym (`serial`)**, co pozwala na zachowanie stanu między krokami (np. utworzony użytkownik jest później edytowany).

| ID Przypadku | Nazwa Testu | Warunki Wstępne | Kroki Testowe (Automatyczne) | Oczekiwany Rezultat |
|---|---|---|---|---|
| **TC-DM-01** | Pełny cykl życia Managera i Tancerza | Czysta baza danych (lub unikalne emaile). | **Faza 1: Rejestracja i Awans**<br>1. Zarejestruj nowego użytkownika (jak w TC-AUTH-01).<br>2. Uruchom skrypt `db-helper.ts make-manager`, aby zmienić rolę użytkownika na `MANAGER` bezpośrednio w DB.<br>3. Przaloguj się, aby odświeżyć sesję.<br><br>**Faza 2: Tworzenie Tancerza (CRUD)**<br>4. Wejdź na `/admin/users`.<br>5. Kliknij "Add User", wypełnij formularz (rola `DANCER`).<br>6. Kliknij "Create User".<br><br>**Faza 3: Edycja Tancerza**<br>7. Znajdź w tabeli wiersz z nowym emailem.<br>8. Kliknij "Edit User", zmień Imię na "Edited".<br>9. Zapisz zmiany. | **Faza 1:** Użytkownik uzyskuje dostęp do `/admin/dashboard`.<br><br>**Faza 2:** Nowy tancerz widoczny w tabeli użytkowników.<br><br>**Faza 3:** Tabela wyświetla zaktualizowane imię "Edited". |
| **TC-DM-02** | Tworzenie szablonu zajęć (Class Template) | Zalogowany `MANAGER` (z TC-DM-01). | 1. Wejdź na `/admin/configuration/templates`.<br>2. Poczekaj na załadowanie danych (`networkidle`).<br>3. Kliknij "Create Template" (otwarcie modala).<br>4. Wypełnij nazwę szablonu.<br>5. Wybierz *Styl tańca* (pobrany dynamicznie z DB przez `db-helper`).<br>6. Wybierz *Trenera* (obecny user, pobrany przez `db-helper`).<br>7. Kliknij "Create". | Modal zamyka się. Nowy szablon jest widoczny w tabeli szablonów. |

### 6.3. Testy Niefunkcjonalne i Weryfikacja Techniczna

W ramach prac nad stabilnością testów (Task: *Verifying E2E Test Stability*) zweryfikowano i poprawiono następujące aspekty:

#### 6.3.1. Stabilność i Odporność na Race Conditions (Hydration)
Wprowadzono mechanizm oczekiwania na stan `networkidle` (brak aktywnych żądań sieciowych) po nawigacji na kluczowe strony (`/register`, `/login`, `/admin/...`). Rozwiązało to problem "znikających" stanów checkboxów oraz interakcji z formularzami przed pełnym załadowaniem JavaScriptu (Rehydration Reacta).

#### 6.3.2. Dostępność (Accessibility) - Komponent Modal
Zidentyfikowano i naprawiono błąd w komponencie `Modal.tsx`, który uniemożliwiał testom znalezienie okna dialogowego po jego otwarciu.
- **Zmiana:** Dodano atrybut `aria-labelledby` powiązany z tytułem modala za pomocą hooka `useId()`.
- **Rezultat:** Selektor `page.getByRole('dialog', { name: 'Create Template' })` działa poprawnie we wszystkich przeglądarkach, co jest kluczowe dla testów automatycznych i zgodności ze standardami WCAG.

#### 6.3.3. Kompatybilność Przeglądarkowa (Cross-Browser)
Testy E2E zostały uruchomione i zweryfikowane na trzech silnikach przeglądarek:
- **Chromium:** Poprawne działanie wszystkich testów.
- **Firefox:** Wyeliminowano błędy związane z renderowaniem modali (dzięki fixowi `aria-labelledby`).
- **WebKit (Safari):** Wymuszono interakcje (`force: true`) na elementach typu Checkbox i Custom Select, które w WebKit są czasami przesłaniane przez natywne kontrolki systemowe lub style.

### 6.4. Podsumowanie

Aktualny zestaw testów automatycznych pokrywa krytyczne ścieżki (Rejestracja, Logowanie, Zarządzanie Użytkownikami, Zarządzanie Grafikiem) i jest uruchamiany w potoku CI/CD (`pnpm test:e2e`). Dzięki zastosowaniu dedykowanego helpera bazodanowego (`db-helper`), testy są niezależne od stanu początkowego bazy i mogą dynamicznie przygotowywać wymagane dane (np. style tańca, uprawnienia managerskie).
