# Quingo Frontend

Веб-клиент платформы квизов **Quingo** — single-page/SSR-приложение на SvelteKit. Отвечает за весь пользовательский интерфейс платформы: аутентификацию, каталог квизов, редактор и профили. Все запросы к бэкенду идут через API-gateway по контракту OpenAPI.

> Realtime-игры (лобби, экраны игрока и ведущего) пока не реализованы — это запланированная фича.

## Технологический стек

- **SvelteKit** `2.57` + **Svelte 5** `5.55` (режим runes форсирован для всего проекта, кроме `node_modules`)
- **TypeScript** `6.0`
- **TailwindCSS** `4.2` (`@tailwindcss/vite`, плагины `forms` и `typography`)
- **Vite** `8.0` как сборщик и dev-сервер
- **adapter-node** `5.5` — SSR-сборка под Node (прод-сервер слушает порт `3000`)
- Утилиты UI: `tailwind-variants`, `tailwind-merge`, `clsx`, иконки `lucide-svelte`
- `zod` — валидация данных/форм, `qrcode` — генерация QR (например, для настройки MFA)
- Линт/формат: `prettier` (+ плагины `svelte` и `tailwindcss`), типы — `svelte-check`

## Структура проекта

```
src/
├─ routes/                  # страницы и layout-группы
│  ├─ (app)/                # публичная зона: главная, каталог, профили пользователей
│  ├─ (protected)/          # зона за авторизацией: профиль, настройки, мои квизы, редактор
│  ├─ auth/                 # вход, MFA/OTP, восстановление доступа
│  ├─ callback/             # OAuth-callback (Google / GitHub)
│  ├─ verify-email/         # подтверждение email
│  └─ reset-password/       # сброс пароля
└─ lib/
   ├─ api/                  # HTTP-клиенты к сервисам (auth, quiz, catalog, profile)
   ├─ components/           # UI-компоненты (ui, layout, quiz, catalog, security)
   ├─ runes/                # состояние на Svelte 5 runes (user, security, toast)
   ├─ types/                # доменные типы (auth, quiz)
   ├─ utils/                # вспомогательные функции
   └─ assets/               # статика
```

Слой `api` построен вокруг `api/client.ts`: единый `authorizedFetch` с cookie-стратегией (`Auth-Strategy: cookie`) и автоматическим единым рефрешем сессии при `401` — параллельные запросы ждут один общий рефреш, а не разлогинивают пользователя раньше времени.

## Реализованный функционал

- **Аутентификация**: вход, MFA/OTP, восстановление доступа (`auth/`), OAuth через Google и GitHub с обработкой `callback/`
- **Верификация email** (`verify-email/`) и **сброс пароля** (`reset-password/`)
- **Профиль и настройки** (`(protected)/profile`, `(protected)/settings`), включая настройку MFA (`settings/security/setup-mfa`)
- **Каталог квизов** — публичный список (`(app)/catalog`)
- **Мои квизы и редактор** — список своих квизов и редактирование (`(protected)/quizzes`, `quizzes/[id]/edit`)
- **Публичные профили пользователей** (`(app)/profile/[id]`)

## Локальный запуск

Требуется запущенный **API-gateway** (по умолчанию `http://localhost:8080`) — без него запросы к бэкенду не пройдут.

```sh
npm install        # установка зависимостей
npm run dev        # dev-сервер Vite на http://localhost:5173
```

Прочие скрипты:

```sh
npm run build      # прод-сборка (adapter-node)
npm run preview    # предпросмотр прод-сборки
npm run check      # svelte-check (типы)
npm run lint       # prettier --check
npm run format     # prettier --write
```

## Конфигурация

Адрес API задаётся переменной окружения `PUBLIC_API_URL` (читается через `$env/dynamic/public`) и должен указывать на базовый путь gateway `.../api`:

| Окружение | `PUBLIC_API_URL`                  |
| --------- | --------------------------------- |
| local     | `http://localhost:8080/api` (см. `.env`) |
| prod      | `https://quingo.arhr.tech/api`    |

Контракт API хранится рядом в виде OpenAPI-спецификаций: `openapi-main.yaml` (квизы/каталог) и `openapi-auth.yaml` (аутентификация и профиль).

## Деплой

Деплой пока выполняется вручную. В репозитории есть всё необходимое:

- `Dockerfile` — multi-stage сборка (`node:20-alpine`), запуск прод-сервера `node ./build` на порту `3000`
- `k8s/` — манифесты для Kubernetes (`deployment.yml`, `service.yml`, `frontend-secret.yml`); образ `artem5252/quingo-frontend`, переменная `PUBLIC_API_URL` берётся из секрета `frontend-secret`

CI/CD — в планах.
