const findDeepValue = require("./utils/findDeepValue");
const logger = require("./utils/logger");

/** Замкнули объект с данными, для удобного получения нужных полей из этого объекта на любом уровне вложенности; */
const getDataFromRequest = (reqBody) => {
  return (fieldName) => {
    return findDeepValue(reqBody, fieldName);
  };
};

/** Маппинг id проектов и названий */
const mapProjects = {
    2: "farfor-erp",
    3: "farfor-site",
    7: "calls-backend",
    9: "dispatch",
    11: "newsletters-backend",
    12: "notify",
    17: "verification-code",
};

/** Sentry кидает объект ошибки, fieldName это нужные поля из этого объекта; */
const configFields = [
  { fieldName: "project", labelName: "Проект" },
  { fieldName: "environment", labelName: "Окружение" },
  { fieldName: "title", labelName: "Название" },
  { fieldName: "message", labelName: "Описание" },
  { fieldName: "web_url", labelName: "Ссылка" },
//  { fieldName: "action", labelName: "Действие" },
//  { fieldName: "status", labelName: "Статус" },
];

/** Формируем сообщение для Mattermost */
module.exports = getTextForMattermost = ({ headers, body }) => {
  try {
    logger.info("Из Sentry пришло событие", { headers, body });

    /**  Docs Sentry: https://docs.sentry.io/product/integrations/integration-platform/webhooks/?original_referrer=https%3A%2F%2Fwww.google.com%2F#sentry-hook-resource */
    const resource = headers["Sentry-Hook-Resource"]; // installation | event_alert | issue | metric_alert | error | comment

    const getFieldFromData = getDataFromRequest(body);

    let message = "";
    let projectName = "";

    configFields.forEach((item) => {
      let value = getFieldFromData(item.fieldName);

      // Если поле project, то заменяем ID на название проекта
      if (item.fieldName === "project" && value && mapProjects[value]) {
        value = mapProjects[value]; // подставляем название проекта вместо ID
        projectName = value;
      }

      if (value) {
        message += `###### ${item.labelName}: ${value}\n`;
      }
    });

    if (resource) {
      message += `###### Название ресурса: ${resource}`;
    }

    return {
        message: message,
        channel: projectName
    };
  } catch (error) {
    logger.error("Ошибка в методе getTextForMattermost", error);
    return {
      message: `#### Ошибка в адапторе:\nЧто-то сломалось в методе getTextForMattermost, проверьте логи на сервере адаптера ${error?.message}`,
      channel: "unknown"
    };
  }
};