import { Elysia, t } from "elysia";
import { Logestic } from "logestic";
import { createClient } from "redis";
import { serverTiming } from "@elysiajs/server-timing";

interface RecordMetrics {
  access_count: number;
  access_timestamps: Array<number>;
}

interface RecordStructure {
  url: string;
  single: boolean;
  created: number;
  expires: number;
  metrics: RecordMetrics;
}

const recordMetrics: RecordMetrics = {
  access_count: 0,
  access_timestamps: [],
};

const recordStructure: RecordStructure = {
  url: "",
  single: false,
  created: Date.now(),
  expires: Date.now(),
  metrics: recordMetrics,
};

const responseStructure = {
  message: "welcome to `url-shortener`",
};

const notFoundResponse = {
  message: "this link does not exist or has expired.",
};

// generate a random string to act as the short_code
// also acts as the record key in redis
const generateRandomKey = (n: number = 7): string => {
  // generate a random string
  let result = "";

  for (let i = 0; i < n; i++) {
    const randomNumber = Math.floor(97 + Math.random() * 25);

    // convert the random number to a character (ASCII value)
    const randomChar = String.fromCharCode(randomNumber);

    // append the random character to the result string
    result += randomChar;
  }

  return result;
};

new Elysia()
  .use(serverTiming())
  .use(Logestic.preset("fancy"))
  .get("/", () => responseStructure)
  .get(
    "/:code",
    async ({ set, params }) => {
      const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });

      // connect to redis
      await client.connect();

      // check if the key is valid
      const checkKeyExists = await client.exists(params.code);
      if (checkKeyExists === 0) {
        set.status = 404;
        return notFoundResponse;
      }

      // get the record
      const record = await client.get(params.code);

      if (!record) {
        set.status = 404;
        return notFoundResponse;
      }

      // parse record to JSON
      const parsedRecord: RecordStructure = JSON.parse(record);

      // delete record if single use
      if (parsedRecord.single) {
        await client.del(params.code);
      }

      // check if the link has expired
      if (parsedRecord.expires !== -1 && parsedRecord.expires < Date.now()) {
        // remove expired record
        await client.del(params.code);

        set.status = 404;
        return notFoundResponse;
      }

      // update metrics
      if (!parsedRecord.single) {
        parsedRecord.metrics.access_count += 1;
        parsedRecord.metrics.access_timestamps = [
          ...parsedRecord.metrics.access_timestamps,
          Date.now(),
        ];
        // update record
        await client.set(params.code, JSON.stringify(parsedRecord));
      }

      // disconnect client
      await client.disconnect();

      // send a redirect response
      return new Response(`redirecting to ${parsedRecord.url}`, {
        status: 302,
        headers: {
          Location: parsedRecord.url,
        },
      });
    },
    {
      type: "json",
      params: t.Object({
        code: t.String(),
      }),
    },
  )
  .get(
    "/stat/:code",
    async ({ set, params }) => {
      const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });

      // connect to redis
      await client.connect();

      // check if the key is valid
      const checkKeyExists = await client.exists(params.code);
      if (checkKeyExists === 0) {
        set.status = 404;
        return notFoundResponse;
      }

      // get the record
      const record = await client.get(params.code);

      if (!record) {
        set.status = 404;
        return notFoundResponse;
      }

      // parse record to JSON
      const parsedRecord: RecordStructure = JSON.parse(record);

      // check if the link has expired
      if (parsedRecord.expires !== -1 && parsedRecord.expires < Date.now()) {
        // remove expired record
        await client.del(params.code);

        set.status = 404;
        return notFoundResponse;
      }

      // disconnect client
      await client.disconnect();

      // send record details
      return parsedRecord;
    },
    {
      type: "json",
      params: t.Object({
        code: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });

      await client.connect();

      const record = recordStructure;
      record.url = body.url;
      record.single = body.single ? body.single : false;
      record.created = Date.now();
      record.expires = body.expires ? body.expires : -1;

      let uniqKey = generateRandomKey();
      while (true) {
        const check = await client.exists(uniqKey);
        if (check === 0) {
          break;
        }
        uniqKey = generateRandomKey();
      }

      await client.set(uniqKey, JSON.stringify(record));
      await client.disconnect();

      return {
        short_code: uniqKey,
        short_link: `https://${process.env.APP_URL}/${uniqKey}`,
      };
    },
    {
      type: "json",
      body: t.Object({
        url: t.String(),
        single: t.Optional(t.Boolean()),
        expires: t.Optional(t.Integer()),
      }),
    },
  )
  .listen(process.env.PORT || 3000, ({ hostname, port }) => {
    console.log(`🦊 this awesome app is running at ${hostname}:${port}`);
  });
