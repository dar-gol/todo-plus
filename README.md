# Todo Plus

Prosta, instalowalna lista zadań korzystająca ze wspólnego konta i rodziny Kitchen Plus.

## MVP

- dwie stałe listy: prywatna i rodzinna;
- zadania z opcjonalną notatką i terminem;
- ukończenie i usuwanie zadań;
- przypomnienia oraz zmiany rodzinne przez Web Push;
- wspólne logowanie z Kitchen Plus.

## Tryb offline

Po pierwszym zalogowaniu Todo Plus zapisuje na urządzeniu ostatnie dane obu list,
gospodarstwa, zakupów i kalendarza. Dodawanie, edycja, ukończenie, usuwanie i
układanie zadań oraz zmiany listy zakupów działają od razu bez internetu.
Operacje trafiają do trwałej kolejki IndexedDB i są automatycznie wysyłane po
odzyskaniu dostępu do API, także gdy połączenie wraca dopiero po włączeniu VPN.

Powłoka PWA i jej pliki statyczne są obsługiwane przez Service Workera, dlatego
ponowne otwarcie wcześniej uruchomionej aplikacji nie wymaga sieci. Pierwsze
logowanie, rejestracja i włączenie powiadomień push nadal wymagają połączenia.
Wylogowanie usuwa lokalne dane danego użytkownika z urządzenia.

## Skróty na telefonie

- **Android:** zainstaluj Todo Plus w Chrome. Przytrzymanie ikony Todo Plus otwiera
  menu ze skrótem **Dodaj zadanie**. Jeśli w starszej instalacji opcji brakuje,
  otwórz aplikację online, aby pobrała zmiany, lub zainstaluj ją ponownie po
  zsynchronizowaniu zmian offline.
- **iPhone:** w Todo Plus otwórz **Ustawienia → Skróty na telefonie** i skopiuj
  adres skrótu zakończony `/#dodaj`. Utwórz skrót w aplikacji Apple Skróty z
  akcją **Otwórz URL** i wklej ten adres. Możesz przypiąć go przez widżet
  **Skróty** na ekranie głównym. Na iOS 18 lub nowszym możesz też w ustawieniach
  ekranu blokady zamienić jeden z dolnych przycisków na kontrolkę **Skrót** i
  wybrać **Dodaj zadanie**. Otwarcie formularza może wymagać odblokowania
  telefonu. Gdy iOS otworzy Todo Plus w osobnej przeglądarce, przeglądarka może
  poprosić o zalogowanie.

## Uruchomienie

1. Uruchom PostgreSQL i Redis dla `kitchen-plus-api`.
2. W API wykonaj migracje i skonfiguruj parę VAPID (`npx web-push generate-vapid-keys`).
3. Skopiuj `.env.example` do `.env.local` i ustaw adres API.
4. Uruchom `npm install`, `npm run generate:api`, a następnie `npm run dev`.

Push wymaga HTTPS poza `localhost`. Worker `kitchen-plus-api` musi działać, aby wysyłać przypomnienia.
