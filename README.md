# url-shortener

## Getting Started

This is my `weekend hobby project` which is a `headless` URL shortener service.

### Tech stack

- [BunJS](https://bun.sh/)
- [ElysiaJS](https://elysiajs.com/)
- [Redis](https://redis.io/)
- [Varnish Cache](https://varnish-cache.org/)
- [Docker](https://www.docker.com/)
- [Cloudflare](https://www.cloudflare.com/en-in/) (not mandatory)

## What it does?

Generate a `short link` for a given URL. You can self-host it using `docker` or `podman`. This project uses `Redis` as database. `Varnish` is used for DDOS protection and not for caching. The provided `vcl` has been configured to use cloudflare injected header `Cf-Connecting-Ip` to build the DDOS protection using `vsthrottle` module. If you are not using `cloudflare` you will need to modify the provided `vcl`.

## Routes

| HTTP Method | Path          | Description                                                        |
| ----------- | ------------- | ------------------------------------------------------------------ |
| GET         | `/`           | default endpoint                                                   |
| POST        | `/`           | create a `short link`                                              |
| GET         | `/:code`      | send `short code` and get redirected to the actual URL (if exists) |
| GET         | `/stat/:code` | view statistic for a `short code`                                  |

### `POST` `/` payload details

Payload must be in JSON

| Field   | Type    | Required | Description                                                                                                                                                          |
| ------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url     | string  | yes      | url to for which you want to generate `short link`                                                                                                                   |
| single  | boolean | no       | generate a single use `short link`, can only be accessed once before it expires                                                                                      |
| expires | integer | no       | provide a timestamp when the generated `short link` will expire (as `milliseconds elapsed since the Unix epoch`), accepts `ONLY` integer value, example `Date.now()` |

## Development

To start the development server run:

```bash
docker compose watch
```

Open <http://localhost:1002/> with your browser to see the result.

## Deploy in production

To run the app in prod server run:

```bash
docker compose up --build -d
```

The `app` will be accessible on PORT `1002`. You can change the port mapping in the `compose.yaml`.

## Suggestions and feedback

Got ideas 💡 about a `feature` or an `enhancement`? Feel free to [open a PR](https://github.com/ramit-mitra/url-shortener/compare).

Found a 🐞? Feel free to [open a PR](https://github.com/ramit-mitra/url-shortener/compare) and contribute.

## Maintenance and LTS

I built this project as a `hobby project`. The code is not ideal and rather rushed. My intension was to try out `BunJS` and build something as my way to dip my feet in the water. I feel the project is pretty `stable-ish`. I will probably not invest too much time into this project or at implementing bugfixes, and/or performance improvements.
