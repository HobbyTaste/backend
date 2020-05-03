# Hobby-Time backend ![](https://github.com/HobbyTaste/backend/workflows/tests/badge.svg)
Текущюю версию сайта в проде можно посмотреть здесь: https://htaste.herokuapp.com/

## Содержание
1. [Настройка окружения и установка необходмых пакетов для разработки (Linux, MacOS)](#settings-env)
2. [Разработка](#dev-rules)
3. [Запуск docker-контейнера](#docker)
4. [Запуск docker-compose для прода](#docker-compose)
5. [Архитектура backend](#backend)
6. [Локальный запуск на виртуалке](#vagrant)

<a name="settings-env"></a>

## Подготовка окружения для локальной разработки
Все ниже команды приведены для Unix-систем. Если у вас Windows вы должны искать альтернативные способы по запуску проекта локально самостоятельно. (Есть какая-то [статья](https://losst.ru/ustanovka-bash-v-windows-10) про установку _bash_ на Windows, может она пригодится...)


Итак, готовим рабочее окружение. 
1. Нужно поставить `nvm` (nvm - Node Version Manager, удобная утилита для установки различных версий NodeJS и их использования при запуске нодовых программ)
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
```
2. После этого устанавливаем _node_ 10 версии и ставим его использование по умолчанию при запуске нодовых программ
```
nvm install 10
nvm use default 10
```
Вместе c _node_ установится и `npm`. Чтобы проверить, что установка прошла успешно можно набрать:
```
node --version
npm --version
```
  
3. При установке различных зависимостей и их добавлению в проект я советую пользоваться утилитой `yarn` ([документация](https://yarnpkg.com/)). А [здесь](https://classic.yarnpkg.com/en/docs/install#debian-stable) можно почитать инструкцию по его установке.

4. Для работой с секретами в проекте используется _git secret_. Это позволяет хранить всякие пароли и токены необходимые для работы проекта в зашифрованном виде в репозитории. При этом выдается доступ определенному кругу лиц на расшифровку этих секретов. Подробнее нужно почитать [тут](https://git-secret.io/) как работать с `git secret` + как его установить. Чтобы получить доступ на расшифровку секретов (то есть на использование команды `git secret reveal`) нужно прислать владельцу репозитория ваш публичный сгенерированный gpg ключ (подробнее читать [здесь](https://help.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key)), чтобы он внес вас в доверенный список лиц. Сам список можно получить командой `git secret whoknows`. Без расшифровки секретов проект локально не запустится!
2. [Frontend](#frontend)


<a name="dev-rules"></a>

## Локальная разработка
Локальный запуск backend-сервера:
1. Сначала установить все зависимости проекта командой:
```shell script
yarn 
```
2. Вскрываем секреты (Достаточно это сделать один раз, так как после вскрытия секреты локально сохраняются):
```
git secret reveal
```
3. Далее последовательная сборка и запуск сервера с конфигурациями для локальной разработки осуществляется командой:
```shell script
yarn start:watch
```
В консоли пишется порт, по которому поднимается сервер.

<a name="docker"></a>
## Запуск докер-контейнера на production
1. Считаем, что имеем на production-сервере заданную переменную окружения `FRONT_PATH`. Заархивируем для использования в докере фронтенд-часть:
``` shell script
tar -cvf front.tar.gz -C ${FRONT_PATH} .
```
2. Теперь создаем docker-контейнер
```shell script
docker build . -t <name_of_docker_image>
```
3. Запустим контейнер с пробросом порта, на котором слушает сервер (на текущий момент, 8100)
``` shell script
docker run --rm -p 8100:8100 <name_of_docker_image>
```

<a name="deploy"></a>
## Запуск на сервере
Для подключения к серверу с деплоем проекта:
1. Получить данные IP, логин и пароль с помощью git secret:
``` shell script
git secret reveal
```
2. Подключиться по ssh к нему:
``` shell script
ssh <LOGIN>@<IP>
```
  Когда запросит пароль, ввести его.

Для удобства запуск можно производить в отдельной сессии tmux. Тогда между заходами на сервер можно не терять вывод и историю терминала (`tmux detach` и `tmux attach`).

Для захода туда нужно получить актуальные логин, пароль и хост. Также необходимо проследить наличие актуальных секретов на сервере.

Для этой цели в этом репозитории находится конфигурационный файл `docker-compose.yml`. Он запускает в изолированном окружении сервера backend, frontend и nginx-балансер. Это позволяет запускать без дополнительной конфигурации сервис на любой машине.

Для запуска необходимо:
1. Собрать образ контейнера для backend. Из папки с backend-репозиторием:
``` shell script
docker build . -t back
```
2. Собрать образ контейнера для frontend. Из папки с frontend-репозиторием:
``` shell script
docker build . -t front
```
3. Запустить docker-compose из папки с backend-репозиторием:
``` shell script
docker-compose up --build
```

<a name="backend"></a>

## Архитектура backend
Backend часть приложения написана под NodeJS с использованием TS. Весь код нахожится в папке `server`. Запуск сервера конфигурируется папкой `config`. В нем располагются файлы конфигурации приложения, которые применяются для запуска приложения в зависимости от окружения запуска. (Подробнее ознкамится нужно [здесь](https://www.npmjs.com/package/config))

Рассмотрим из чего состоит `server`:
1. `app.ts` - входная точка сервера. Здесь создается простенькое `express` приложение, происходит запуск самого сервера на определенном порту `app.listen(...)`
2. `loaders` - загрузчики приложения - подключение к БД через `mongoose` и настройка `express`, в том числе подключения роутингов на обработку конкретных запросов
3. `models` - описанные основные сущности проекта и их хранение в БД `MongoDB` через библиотеку `mongoose`.
- User - непосредственно обычный пользователь приложения
- Provider - партнер, предоставляющий хобби
- Hobby - непосредственно сущность хобби
- Comment - отзывы пользователей о хобби и ответы от партнеров
4. `routes` - тут уже располагаются обработчики http-запросов.
- `user.ts` - обработчики запросов связанных с сущностью `user`
- `provider.ts` - обработчики запросов связанных с сущностью `provider`, то есть с поставщиком хобби (= партнером)
5. `schemas` - описание структуры документов в базе данных
6. `services` - бизнес-логика приложения
7. `types` - вся информация о типах и интерфейсах, используемых в проекте
8. `utils` - утилитки, которые используются в разных частях сервера (например загрузка меда-файлов через aws в облака).


<a name="vagrant"></a>

## Локальный запуск на виртуалке
Для локального запуска будем использовать виртуальную машину с заведомо подходящими настройками.

Предварительно требуется:
1. `VirtualBox`. Установка для разных ОС и дистрибутивов приведена [тут](https://www.virtualbox.org/wiki/Downloads).
2. `vagrant`
3. Вскрытые секреты. Если не настроены, запускаем из корневой директории проекта:
```shell script
git secret reveal
```
4. Установленный образ ОС для `vagrant`:
```shell script
vagrant box add ubuntu/xenial64
```

Теперь можем запустить сервер непосредственно на ВМ. Далее все комады запускаются из корневой директории проекта:
1. Для запуска виртуальной машины делаем:
```shell script
FRONT_PATH=/path/to/front vagrant up
```
Тут при первом запуске машины запустятся `provisioner`-ы. При последующих запусках они запускаться не будут.
2. Далее, для перезапуска сервера останавливаем старый запуск с помощью `Ctrl+C` и перезапускаем. Для этого достаточно только одного `provisioner`-а:
```shell script
vagrant provision --provision-with run
```
3. Для выключения виртуальной машины делаем:
``` shell script
vagrant halt
```
