const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const logger = require("./utils/logger");
const getTextForMattermost = require("./getTextForMattermost");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4045;
const URL_WEBHOOK = process.env.URL_WEBHOOK;

app.use(bodyParser.json());

app.post("/webhook", ({ headers, body }) => {
  try {
    const { message, channel } = getTextForMattermost({ headers, body });

    axios.post(URL_WEBHOOK, {
        username: "Sentry",
        text: message,
        channel: `sentry-${channel}`
    });
  } catch (err) {
    logger.error("Ошибка при отправке в Mattermost", error);
  }
});

app
  .listen(PORT, () => {
    logger.info(`Сервер успешно запущен на порту ${PORT}`);
  })
  .on("error", (error) => logger.error("Ошибка при запуске сервера", error));
