import { normalizeTrayId } from '../modula/trayNaming';

const VOICE_TEXT = {
  zh: {
    today: '今天',
    currentCriteria: '当前条件',
    tasks: '任务',
    inboundTasks: '入库任务',
    outboundTasks: '出库任务',
    trayInventoryLabel: '托盘 {tray} 的库存',
    itemLocationLabel: '物料号 {itemNo} 的库位信息',
    toLabel: 'TO {value}',
    workOrderLabel: '工单 {value}',
    deliveryLabel: '交货单 {value}',
    noTrayInventory: '托盘 {tray} 没有查询到库存。',
    trayInventoryFound: '托盘 {tray} 当前共有 {count} 条库存记录。{preview}',
    includesPreview: '包括 {preview}{suffix}。',
    noItemLocation: '没有找到物料号 {itemNo} 的库位信息。',
    itemLocationFound: '已找到物料号 {itemNo}，所在托盘 {tray}，Bin {bin}，坐标 {x}, {y}。',
    noTaskResults: '{prefix}没有查询到结果。',
    taskResultsFound: '{prefix}共有 {toCount} 个 TO，{itemCount} 个物料项。{preview}',
    toPreview: '{toNo}（{count}项）',
    unsupported: '当前浏览器不支持语音识别，请使用 Chrome 或 Edge。',
    listening: '正在听，请直接说出指令。',
    permissionDenied: '语音权限被拒绝，请先允许浏览器访问麦克风。',
    noSpeech: '没有检测到说话内容，请再试一次。',
    recognitionFailed: '语音识别失败：{error}',
    noValidSpeech: '没有识别到有效语音，请重试。',
    idlePrompt: '点击话筒后说出指令，例如：帮我查一下今天有哪些出库任务。',
    visionModeOn: '已开启图像识别模式。',
    visionModeOff: '已关闭图像识别模式。',
    voicePromptOn: '已开启语音提示。',
    voicePromptOff: '已关闭语音提示。',
    selectionCleared: '已取消当前选中的物料。',
    allSelected: '已为您全选 {count} 个可操作物料。',
    noSelectableItems: '当前没有可全选的物料。',
    submitOutbound: '正在为您发起出库任务。',
    submitInbound: '正在为您发起入库任务。',
    searching: '正在查询{target}。',
    unknownCommand: '暂时无法理解这条语音指令，请换一种说法。',
  },
  en: {
    today: 'today',
    currentCriteria: 'the current filters',
    tasks: 'tasks',
    inboundTasks: 'inbound tasks',
    outboundTasks: 'outbound tasks',
    trayInventoryLabel: 'the inventory of tray {tray}',
    itemLocationLabel: 'the location of item {itemNo}',
    toLabel: 'TO {value}',
    workOrderLabel: 'work order {value}',
    deliveryLabel: 'delivery {value}',
    noTrayInventory: 'No inventory was found for tray {tray}.',
    trayInventoryFound: 'Tray {tray} currently has {count} inventory records. {preview}',
    includesPreview: 'This includes {preview}{suffix}.',
    noItemLocation: 'No location information was found for item {itemNo}.',
    itemLocationFound: 'Item {itemNo} was found in tray {tray}, bin {bin}, coordinates {x}, {y}.',
    noTaskResults: 'No results were found for {prefix}.',
    taskResultsFound: 'Found {toCount} TOs and {itemCount} item lines for {prefix}. {preview}',
    toPreview: '{toNo} ({count} items)',
    unsupported: 'This browser does not support speech recognition. Please use Chrome or Edge.',
    listening: 'Listening. Please speak your command.',
    permissionDenied: 'Microphone permission was denied. Please allow microphone access first.',
    noSpeech: 'No speech was detected. Please try again.',
    recognitionFailed: 'Speech recognition failed: {error}',
    noValidSpeech: 'No valid speech was recognized. Please try again.',
    idlePrompt: 'Click the microphone and say a command, for example: show today\'s outbound tasks.',
    visionModeOn: 'Vision mode has been turned on.',
    visionModeOff: 'Vision mode has been turned off.',
    voicePromptOn: 'Voice prompts have been turned on.',
    voicePromptOff: 'Voice prompts have been turned off.',
    selectionCleared: 'The current selection has been cleared.',
    allSelected: '{count} selectable items have been selected.',
    noSelectableItems: 'There are no selectable items right now.',
    submitOutbound: 'Starting the outbound task now.',
    submitInbound: 'Starting the inbound task now.',
    searching: 'Searching for {target}.',
    unknownCommand: 'I could not understand that voice command. Please try another phrasing.',
  },
  de: {
    today: 'heute',
    currentCriteria: 'die aktuellen Filter',
    tasks: 'Aufgaben',
    inboundTasks: 'Einlagerungsaufgaben',
    outboundTasks: 'Auslagerungsaufgaben',
    trayInventoryLabel: 'den Bestand von Tablar {tray}',
    itemLocationLabel: 'den Lagerplatz von Material {itemNo}',
    toLabel: 'TA {value}',
    workOrderLabel: 'Arbeitsauftrag {value}',
    deliveryLabel: 'Lieferung {value}',
    noTrayInventory: 'Für Tablar {tray} wurde kein Bestand gefunden.',
    trayInventoryFound: 'Tablar {tray} enthält aktuell {count} Bestandszeilen. {preview}',
    includesPreview: 'Dazu gehören {preview}{suffix}.',
    noItemLocation: 'Für Material {itemNo} wurde kein Lagerplatz gefunden.',
    itemLocationFound: 'Material {itemNo} wurde in Tablar {tray}, Bin {bin}, Koordinaten {x}, {y} gefunden.',
    noTaskResults: 'Für {prefix} wurden keine Ergebnisse gefunden.',
    taskResultsFound: 'Für {prefix} wurden {toCount} TAs und {itemCount} Materialpositionen gefunden. {preview}',
    toPreview: '{toNo} ({count} Positionen)',
    unsupported: 'Dieser Browser unterstützt keine Spracherkennung. Bitte verwenden Sie Chrome oder Edge.',
    listening: 'Ich höre zu. Bitte sprechen Sie Ihren Befehl.',
    permissionDenied: 'Der Mikrofonzugriff wurde verweigert. Bitte erlauben Sie zuerst den Zugriff auf das Mikrofon.',
    noSpeech: 'Es wurde keine Sprache erkannt. Bitte versuchen Sie es erneut.',
    recognitionFailed: 'Spracherkennung fehlgeschlagen: {error}',
    noValidSpeech: 'Es wurde keine gültige Sprache erkannt. Bitte versuchen Sie es erneut.',
    idlePrompt: 'Klicken Sie auf das Mikrofon und sagen Sie zum Beispiel: Zeige mir die heutigen Auslagerungsaufgaben.',
    visionModeOn: 'Der Bildverarbeitungsmodus wurde aktiviert.',
    visionModeOff: 'Der Bildverarbeitungsmodus wurde deaktiviert.',
    voicePromptOn: 'Die Sprachhinweise wurden aktiviert.',
    voicePromptOff: 'Die Sprachhinweise wurden deaktiviert.',
    selectionCleared: 'Die aktuelle Auswahl wurde aufgehoben.',
    allSelected: '{count} auswählbare Materialien wurden markiert.',
    noSelectableItems: 'Derzeit gibt es keine auswählbaren Materialien.',
    submitOutbound: 'Die Auslagerungsaufgabe wird gestartet.',
    submitInbound: 'Die Einlagerungsaufgabe wird gestartet.',
    searching: 'Suche nach {target}.',
    unknownCommand: 'Dieser Sprachbefehl wurde nicht verstanden. Bitte formulieren Sie ihn anders.',
  },
};

function normalizeLocale(locale = 'zh') {
  return locale?.startsWith('en') ? 'en' : locale?.startsWith('de') ? 'de' : 'zh';
}

function formatText(template, params = {}) {
  let message = template;
  Object.entries(params).forEach(([key, value]) => {
    message = message.replaceAll(`{${key}}`, String(value));
  });
  return message;
}

function text(locale, key, params = {}) {
  const lang = normalizeLocale(locale);
  return formatText(VOICE_TEXT[lang]?.[key] ?? VOICE_TEXT.zh[key] ?? key, params);
}

function normalizeLatinText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase();
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, '');
}

function joinParts(parts, locale) {
  const lang = normalizeLocale(locale);
  if (lang === 'en') return parts.join(' ');
  if (lang === 'de') return parts.join(' ');
  return parts.join('');
}

function buildPreviewSentence(items, locale) {
  if (!items.length) return '';
  const lang = normalizeLocale(locale);
  const suffix = items.length > 3
    ? (lang === 'de' ? ' usw' : lang === 'en' ? ' and more' : ' 等')
    : '';
  return text(locale, 'includesPreview', {
    preview: items.join(lang === 'zh' ? '，' : ', '),
    suffix,
  });
}

function includesAnyPattern(rawText, patterns) {
  return patterns.some((pattern) => pattern.test(rawText));
}

function detectJobType(rawText) {
  if (/(出库|outbound|pick(?:ing)?|retrieve|issue outbound|auslager|entnahme)/i.test(rawText)) return 'outbound';
  if (/(入库|inbound|putaway|store|storage|issue inbound|einlager|einbuchen)/i.test(rawText)) return 'inbound';
  return '';
}

function isInventoryQueryText(rawText) {
  return /(库存|库位|有哪些物料|哪些物料|inventory|stock|materials|what.*in.*tray|bestand|materialien|welche.*materialien|inhalt)/i.test(rawText);
}

export function formatLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeVoiceCode(value) {
  if (!value) {
    return '';
  }

  return String(value).trim().replace(/[。．，,；;！？!?]/g, '').replace(/\s+/g, '');
}

export function getVoiceAssistantText(key, locale = 'zh', params = {}) {
  return text(locale, key, params);
}

export function describeSearchFilters(filters = {}, locale = 'zh') {
  if (filters.trayInventory) {
    return text(locale, 'trayInventoryLabel', {
      tray: normalizeTrayId(filters.trayInventory) || filters.trayInventory,
    });
  }

  if (filters.itemNo) {
    return text(locale, 'itemLocationLabel', { itemNo: filters.itemNo });
  }

  const parts = [];
  const dateValue = filters.date?.[0];
  if (dateValue) {
    parts.push(dateValue === formatLocalDate(0) ? text(locale, 'today') : dateValue);
  }

  if (filters.jobType === 'outbound') parts.push(text(locale, 'outboundTasks'));
  else if (filters.jobType === 'inbound') parts.push(text(locale, 'inboundTasks'));
  else parts.push(text(locale, 'tasks'));

  if (filters.toNo) parts.push(text(locale, 'toLabel', { value: filters.toNo }));
  if (filters.workOrderNo) parts.push(text(locale, 'workOrderLabel', { value: filters.workOrderNo }));
  if (filters.deliveryNo) parts.push(text(locale, 'deliveryLabel', { value: filters.deliveryNo }));
  return joinParts(parts, locale);
}

export function buildVoiceSearchSummary(data = [], filters = {}, locale = 'zh') {
  if (filters.trayInventory) {
    const trayId = normalizeTrayId(filters.trayInventory) || filters.trayInventory;
    if (!data.length) {
      return text(locale, 'noTrayInventory', { tray: trayId });
    }

    const previewItems = data.slice(0, 3).map((item) => `${item.itemNo}(${item.bin})`);
    return text(locale, 'trayInventoryFound', {
      tray: trayId,
      count: data.length,
      preview: buildPreviewSentence(previewItems, locale),
    }).trim();
  }

  if (filters.itemNo) {
    if (!data.length) {
      return text(locale, 'noItemLocation', { itemNo: filters.itemNo });
    }

    const record = data[0];
    return text(locale, 'itemLocationFound', {
      itemNo: record.itemNo,
      tray: record.tray || '-',
      bin: record.bin || '-',
      x: record.x ?? '-',
      y: record.y ?? '-',
    });
  }

  const dateValue = filters.date?.[0];
  const dateLabel = dateValue ? (dateValue === formatLocalDate(0) ? text(locale, 'today') : dateValue) : '';
  const jobLabel = filters.jobType === 'outbound'
    ? text(locale, 'outboundTasks')
    : filters.jobType === 'inbound'
      ? text(locale, 'inboundTasks')
      : text(locale, 'tasks');
  const prefix = joinParts([dateLabel, jobLabel].filter(Boolean), locale) || text(locale, 'currentCriteria');
  if (!data.length) {
    return text(locale, 'noTaskResults', { prefix });
  }

  const groupedByTo = new Map();
  data.forEach((row) => {
    const key = row.toNo || '-';
    if (!groupedByTo.has(key)) groupedByTo.set(key, { toNo: key, count: 0 });
    groupedByTo.get(key).count += 1;
  });

  const toList = Array.from(groupedByTo.values());
  const previewItems = toList.slice(0, 3).map((item) => text(locale, 'toPreview', item));
  return text(locale, 'taskResultsFound', {
    prefix,
    toCount: toList.length,
    itemCount: data.length,
    preview: buildPreviewSentence(previewItems, locale),
  }).trim();
}

export function extractVoiceDate(rawText, locale = 'zh') {
  const compact = compactText(rawText);
  const latin = normalizeLatinText(rawText);
  const lang = normalizeLocale(locale);

  if (/今天|今日|当天/.test(compact) || /\btoday\b|\btodays\b/.test(latin) || /\bheute\b/.test(latin)) {
    return formatLocalDate(0);
  }

  if (/昨天|昨日/.test(compact) || /\byesterday\b/.test(latin) || /\bgestern\b/.test(latin)) {
    return formatLocalDate(-1);
  }

  if (/明天/.test(compact) || /\btomorrow\b/.test(latin) || /\bmorgen\b/.test(latin)) {
    return formatLocalDate(1);
  }

  const isoDateMatch = rawText.match(/(20\d{2})[./年/-](\d{1,2})[./月/-](\d{1,2})/);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${String(isoDateMatch[2]).padStart(2, '0')}-${String(isoDateMatch[3]).padStart(2, '0')}`;
  }

  const germanDateMatch = rawText.match(/(\d{1,2})\.(\d{1,2})\.(20\d{2})/);
  if (germanDateMatch) {
    return `${germanDateMatch[3]}-${String(germanDateMatch[2]).padStart(2, '0')}-${String(germanDateMatch[1]).padStart(2, '0')}`;
  }

  const monthDayMatch = lang === 'zh'
    ? rawText.match(/(\d{1,2})月(\d{1,2})日?/)
    : rawText.match(/(?:\b|^)(\d{1,2})[./-](\d{1,2})(?:\b|$)/);

  if (monthDayMatch) {
    const year = new Date().getFullYear();
    if (lang === 'zh') {
      return `${year}-${String(monthDayMatch[1]).padStart(2, '0')}-${String(monthDayMatch[2]).padStart(2, '0')}`;
    }
    return `${year}-${String(monthDayMatch[1]).padStart(2, '0')}-${String(monthDayMatch[2]).padStart(2, '0')}`;
  }

  return '';
}

export function isGenericTaskQueryIntent(rawText) {
  return /(任务|查询|查一下|查一查|筛选|show|list|find|search|display|tasks?|orders?|aufgaben|anzeigen|suche|finden|liste)/i.test(rawText);
}

export function parseVoiceCommand(rawText, locale = 'zh') {
  const spokenText = String(rawText || '').trim();
  const compact = compactText(spokenText);
  const latin = normalizeLatinText(spokenText);

  if (!spokenText) return { type: 'unknown' };

  if (includesAnyPattern(spokenText, [
    /(开启|打开).*(图像识别|视觉模式|视觉工作台)/,
    /\b(turn on|enable|open|start)\b.*\b(vision|camera|image recognition|vision mode|vision workstation)\b/i,
    /\b(vision|camera|image recognition|vision mode)\b.*\b(turn on|enable|open|start)\b/i,
    /\b(aktiviere|einschalten|starten|offnen)\b.*\b(bilderkennung|visionsmodus|kamera|visueller arbeitsplatz)\b/i,
  ])) return { type: 'toggleVision', enabled: true };

  if (includesAnyPattern(spokenText, [
    /(关闭|退出).*(图像识别|视觉模式|视觉工作台)/,
    /\b(turn off|disable|close|exit|stop)\b.*\b(vision|camera|image recognition|vision mode|vision workstation)\b/i,
    /\b(vision|camera|image recognition|vision mode)\b.*\b(turn off|disable|close|exit|stop)\b/i,
    /\b(deaktiviere|ausschalten|schliessen|schließen|beenden|stoppen)\b.*\b(bilderkennung|visionsmodus|kamera|visueller arbeitsplatz)\b/i,
  ])) return { type: 'toggleVision', enabled: false };

  if (includesAnyPattern(spokenText, [
    /(开启|打开).*(语音提示|语音播报)/,
    /\b(turn on|enable|start)\b.*\b(voice prompt|voice prompts|speech prompt|speech output|voice playback)\b/i,
    /\b(voice prompt|voice prompts|speech prompt|speech output)\b.*\b(turn on|enable|start)\b/i,
    /\b(aktiviere|einschalten)\b.*\b(sprachhinweise|sprachansage|sprachausgabe)\b/i,
  ])) return { type: 'toggleVoicePrompt', enabled: true };

  if (includesAnyPattern(spokenText, [
    /(关闭|停止).*(语音提示|语音播报)/,
    /\b(turn off|disable|stop)\b.*\b(voice prompt|voice prompts|speech prompt|speech output|voice playback)\b/i,
    /\b(voice prompt|voice prompts|speech prompt|speech output)\b.*\b(turn off|disable|stop)\b/i,
    /\b(deaktiviere|ausschalten|stoppen)\b.*\b(sprachhinweise|sprachansage|sprachausgabe)\b/i,
  ])) return { type: 'toggleVoicePrompt', enabled: false };

  if (includesAnyPattern(spokenText, [
    /(取消全选|清空选择|取消选择)/,
    /\b(clear selection|clear selected|deselect all|clear all)\b/i,
    /\b(auswahl aufheben|auswahl loschen|auswahl löschen|alle abwahlen|alle abwählen)\b/i,
  ])) return { type: 'clearSelection' };

  if (includesAnyPattern(spokenText, [
    /全选/,
    /\bselect all\b/i,
    /\balle auswahlen|alle auswählen\b/i,
  ])) return { type: 'selectAll' };

  if (includesAnyPattern(spokenText, [
    /(下发|执行|开始|发起).*(出库)/,
    /\b(start|run|execute|launch|submit|issue)\b.*\b(outbound|pick|picking|retrieve)\b/i,
    /\b(aktiviere|starte|ausfuhren|ausführen|senden)\b.*\b(auslagerung|entnahme)\b/i,
  ])) return { type: 'submitJob', jobType: 'outbound' };

  if (includesAnyPattern(spokenText, [
    /(下发|执行|开始|发起).*(入库)/,
    /\b(start|run|execute|launch|submit|issue)\b.*\b(inbound|putaway|store|storage)\b/i,
    /\b(aktiviere|starte|ausfuhren|ausführen|senden)\b.*\b(einlagerung|einbuchen)\b/i,
  ])) return { type: 'submitJob', jobType: 'inbound' };

  const itemNoMatch = spokenText.match(/(?:物料号|item(?:\s*(?:no|number))?|material(?:\s*(?:no|number))?|materialnummer)(?:\s*(?:是|为|:|：|is|=|ist))?\s*([A-Za-z0-9-]+)/i);
  const toNoMatch = spokenText.match(/(?:\bTO\b(?:\s*(?:号|no|number|nr\.?|nummer))?)(?:\s*(?:是|为|:|：|is|=|ist|-))?\s*([A-Za-z0-9-]+)/i);
  const workOrderMatch = spokenText.match(/(?:工单号|工单|work\s*order(?:\s*(?:no|number))?|arbeitsauftrag(?:\s*(?:nr\.?|nummer))?)(?:\s*(?:是|为|:|：|is|=|ist))?\s*([A-Za-z0-9-]+)/i);
  const deliveryMatch = spokenText.match(/(?:交货单号|交货单|delivery(?:\s*(?:no|number))?|liefer(?:ung|nummer))(?:\s*(?:是|为|:|：|is|=|ist))?\s*([A-Za-z0-9-]+)/i);
  const trayInventoryMatch = spokenText.match(/(?:托盘|层|tray|tablar|ebene)(?:\s*(?:号|no|number|ist|是|为|:|：))?\s*([A-Za-z0-9-]+)/i);

  const looksLikeSearch = /(查|查询|筛选|搜索|看看|显示|列出|找|任务|物料号|工单|交货单|有哪些|show|list|find|search|display|inventory|stock|tray|item|work order|delivery|tasks?|orders?|zeige|suche|finden|bestand|material|arbeitsauftrag|lieferung|aufgaben)/i.test(spokenText)
    || Boolean(itemNoMatch || toNoMatch || workOrderMatch || deliveryMatch || trayInventoryMatch);

  if (!looksLikeSearch) return { type: 'unknown' };

  const filters = {};
  const jobType = detectJobType(spokenText);
  if (jobType) {
    filters.jobType = jobType;
  }

  const dateValue = extractVoiceDate(spokenText, locale);
  if (dateValue) {
    filters.date = [dateValue];
  }

  if (itemNoMatch) {
    filters.itemNo = normalizeVoiceCode(itemNoMatch[1]);
    return { type: 'search', filters };
  }

  if (toNoMatch) filters.toNo = normalizeVoiceCode(toNoMatch[1]).toUpperCase();
  if (workOrderMatch) filters.workOrderNo = normalizeVoiceCode(workOrderMatch[1]).toUpperCase();
  if (deliveryMatch) filters.deliveryNo = normalizeVoiceCode(deliveryMatch[1]).toUpperCase();

  if (trayInventoryMatch && isInventoryQueryText(spokenText)) {
    filters.trayInventory = normalizeVoiceCode(trayInventoryMatch[1]).toUpperCase();
    return { type: 'search', filters };
  }

  if (/\btray\b/i.test(spokenText) && isInventoryQueryText(spokenText)) {
    const fallbackTrayMatch = compact.match(/tray([A-Za-z0-9-]+)/i);
    if (fallbackTrayMatch) {
      filters.trayInventory = normalizeVoiceCode(fallbackTrayMatch[1]).toUpperCase();
      return { type: 'search', filters };
    }
  }

  if (/\btablar\b/i.test(latin) && isInventoryQueryText(spokenText)) {
    const fallbackTrayMatch = latin.match(/tablar\s*([a-z0-9-]+)/i);
    if (fallbackTrayMatch) {
      filters.trayInventory = normalizeVoiceCode(fallbackTrayMatch[1]).toUpperCase();
      return { type: 'search', filters };
    }
  }

  return { type: 'search', filters };
}
