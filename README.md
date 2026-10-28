# Todo Plus

Prosta, instalowalna lista zadań korzystająca ze wspólnego konta i rodziny Kitchen Plus.

## MVP

- dwie stałe listy: prywatna i rodzinna;
- zadania z opcjonalną notatką i terminem;
- ukończenie i usuwanie zadań;
- przypomnienia oraz zmiany rodzinne przez Web Push;
- wspólne logowanie z Kitchen Plus.

## Uruchomienie

1. Uruchom PostgreSQL i Redis dla `kitchen-plus-api`.
2. W API wykonaj migracje i skonfiguruj parę VAPID (`npx web-push generate-vapid-keys`).
3. Skopiuj `.env.example` do `.env.local` i ustaw adres API.
4. Uruchom `npm install`, `npm run generate:api`, a następnie `npm run dev`.

Push wymaga HTTPS poza `localhost`. Worker `kitchen-plus-api` musi działać, aby wysyłać przypomnienia.
