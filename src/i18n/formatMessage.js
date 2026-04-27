export function formatMessage(dict, locale, key, params = {}) {
  let message = dict[locale]?.[key] ?? dict.zh?.[key] ?? key;

  Object.entries(params).forEach(([paramKey, value]) => {
    message = message.replaceAll(`{${paramKey}}`, value);
  });

  return message;
}
