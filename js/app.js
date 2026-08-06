(() => {
  const STORAGE_KEY = "yiriyizhi.entries.v1";
  const SETTINGS_KEY = "yiriyizhi.settings.v1";
  const BACKUP_KEY = "yiriyizhi.entries.backup.v1";

  const BASE_CATEGORIES = [
    "体育", "健身", "运动科学",
    "做饭", "菜谱", "烘焙", "饮品", "营养学",
    "军事", "武器装备", "战争史",
    "国际时事", "外交",
    "历史", "中国史", "世界史", "考古",
    "地理", "国家与城市", "气候气象",
    "科技", "人工智能", "互联网", "航天", "数码",
    "自然科学", "物理", "化学", "天文",
    "医学健康", "心理", "睡眠", "急救常识",
    "金融理财", "经济", "商业", "创业",
    "法律", "社会议题",
    "语言", "生僻字", "英语表达", "方言",
    "文学", "诗词", "写作",
    "艺术", "设计", "建筑", "摄影",
    "音乐", "电影", "戏剧",
    "哲学", "宗教文化", "民俗传统",
    "植物园艺", "动物自然", "环保",
    "旅行", "交通出行", "汽车",
    "时尚穿搭", "家居生活", "生活常识",
    "教育学习", "职场技能", "沟通表达",
    "生活技能", "办公技能", "动手技能", "社交技能", "学习技能",
    "理财技能", "时间管理", "自制力训练",
    "编程开发", "产品思维", "专业名词",
    "冷知识", "其他",
  ];

  const INSPIRE_HINTS = {
    体育: "一个规则、战术或运动冷知识",
    健身: "一个训练动作、恢复或发力要点",
    运动科学: "一个关于身体表现的科学概念",
    做饭: "一个厨理技巧或食材小知识",
    菜谱: "一道你没做过的菜，记下关键步骤",
    烘焙: "一个面团/温度/配方里的窍门",
    饮品: "一种咖啡、茶或调酒相关的知识",
    营养学: "一个营养素或饮食误区澄清",
    军事: "一个编制、战役或装备相关概念",
    武器装备: "一种装备的用途或设计逻辑",
    战争史: "一场战役的关键转折",
    国际时事: "一条新闻背后的背景知识",
    外交: "一个外交术语或历史案例",
    历史: "一个人物、制度或时代切片",
    中国史: "一个朝代、事件或典故",
    世界史: "一个影响世界的小事件",
    考古: "一个遗址、文物或发现故事",
    地理: "一个地名背后的地理含义",
    "国家与城市": "一座城市的独特之处",
    气候气象: "一个天气现象是怎么回事",
    科技: "一个新技术名词的白话解释",
    人工智能: "一个 AI 概念用大白话说清",
    互联网: "一个互联网产品或协议小知识",
    航天: "一个航天器、轨道或任务知识点",
    数码: "一个你常用设备里的隐藏知识",
    自然科学: "一个自然现象的原理",
    物理: "一个物理概念的生活类比",
    化学: "一个日常里的化学反应",
    天文: "一颗星、一个星座或宇宙概念",
    医学健康: "一个身体信号或健康常识",
    心理: "一个心理学效应或情绪机制",
    睡眠: "一个改善睡眠的科学点",
    急救常识: "一个关键时刻用得上的知识",
    金融理财: "一个理财名词或坑点",
    经济: "一个经济指标或现象",
    商业: "一个商业模式或案例启发",
    创业: "一个创业里常见的真实教训",
    法律: "一个生活相关的法律概念",
    社会议题: "一个社会现象的多种视角",
    语言: "一个有趣的语言现象",
    生僻字: "一个你会写会用的生僻字",
    英语表达: "一个地道表达或易混词",
    方言: "一个方言词的来历或意思",
    文学: "一部作品、一个意象或作家轶事",
    诗词: "一句诗的出处与意境",
    写作: "一个写作技巧或修辞",
    艺术: "一个流派、作品或创作观念",
    设计: "一个设计原则或视觉案例",
    建筑: "一座建筑或一种结构思路",
    摄影: "一个构图、光线或参数知识",
    音乐: "一个乐理、乐器或作品背景",
    电影: "一个镜头语言或电影史知识",
    戏剧: "一个剧种、角色或舞台概念",
    哲学: "一个哲学问题或思想家观点",
    宗教文化: "一个文化符号或仪式含义",
    民俗传统: "一个节日、习俗或民间智慧",
    植物园艺: "一种植物的习性或养护点",
    动物自然: "一种动物的有趣习性",
    环保: "一个环境问题与可行行动",
    旅行: "一个目的地的文化或地理知识点",
    交通出行: "一个出行规则或交通冷知识",
    汽车: "一个汽车结构或驾驶相关知识",
    时尚穿搭: "一个面料、版型或风格概念",
    家居生活: "一个收纳、清洁或居家技巧",
    生活常识: "一个日常却容易忽略的知识",
    教育学习: "一个更高效的学习方法",
    职场技能: "一个职场沟通或协作要点",
    沟通表达: "一个说话/倾听的实用技巧",
    生活技能: "一个让日子过得更顺的实用本领",
    办公技能: "一个表格、文档或办公软件小技巧",
    动手技能: "一个能亲手做出来的手艺或步骤",
    社交技能: "一个让关系更舒服的相处方法",
    学习技能: "一个记笔记、复习或理解知识的方法",
    理财技能: "一个管钱、记账或避坑的实用技巧",
    时间管理: "一个安排时间、减少拖延的办法",
    自制力训练: "一个帮助你少分心、更能坚持的小方法",
    编程开发: "一个编程概念或工具用法",
    产品思维: "一个产品设计里的常见原则",
    专业名词: "一个你行业里的专业词",
    冷知识: "一个听完会想分享的冷知识",
    其他: "任何你今天第一次真正搞懂的事",
  };


  const INSPIRE_ICONS = {
    营养学: "apple",
    做饭: "pot",
    菜谱: "pot",
    烘焙: "cookie",
    饮品: "cup",
    体育: "run",
    健身: "dumbbell",
    运动科学: "dumbbell",
    军事: "shield",
    武器装备: "shield",
    战争史: "shield",
    国际时事: "globe",
    外交: "globe",
    历史: "scroll",
    中国史: "scroll",
    世界史: "scroll",
    考古: "scroll",
    地理: "map",
    "国家与城市": "map",
    气候气象: "cloud",
    科技: "circuit",
    人工智能: "chip",
    互联网: "chip",
    航天: "rocket",
    数码: "chip",
    自然科学: "leaf",
    物理: "atom",
    化学: "flask",
    天文: "star",
    医学健康: "heart",
    心理: "heart",
    睡眠: "moon",
    急救常识: "cross",
    金融理财: "coin",
    经济: "coin",
    商业: "coin",
    创业: "coin",
    理财技能: "coin",
    法律: "scale",
    社会议题: "scale",
    语言: "chat",
    生僻字: "chat",
    英语表达: "chat",
    方言: "chat",
    文学: "book",
    诗词: "paper",
    写作: "pen",
    艺术: "palette",
    设计: "pencil",
    建筑: "building",
    摄影: "camera",
    音乐: "music",
    电影: "film",
    戏剧: "film",
    哲学: "think",
    宗教文化: "lantern",
    民俗传统: "lantern",
    植物园艺: "leaf",
    动物自然: "animal",
    环保: "recycle",
    旅行: "bag",
    交通出行: "car",
    汽车: "car",
    时尚穿搭: "shirt",
    家居生活: "home",
    生活常识: "home",
    生活技能: "home",
    教育学习: "bulb",
    学习技能: "bulb",
    职场技能: "brief",
    办公技能: "computer",
    沟通表达: "chat",
    社交技能: "chat",
    动手技能: "wrench",
    时间管理: "clock",
    自制力训练: "target",
    编程开发: "code",
    产品思维: "package",
    专业名词: "tag",
    冷知识: "spark",
    其他: "spark",
  };

  const ICON_PATHS = {
    apple: `<circle cx="24" cy="26" r="11"/><path d="M24 15c2-4 6-5 6-5"/><path d="M24 15c-1-3-4-4-4-4"/>`,
    pot: `<path d="M12 22h24v10a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V22z"/><path d="M10 22h28"/><path d="M18 16h12"/>`,
    cookie: `<circle cx="24" cy="24" r="12"/><circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="26" cy="18" r="1.5" fill="currentColor" stroke="none"/><circle cx="22" cy="28" r="1.5" fill="currentColor" stroke="none"/><circle cx="30" cy="26" r="1.5" fill="currentColor" stroke="none"/>`,
    cup: `<path d="M14 14h16v12a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V14z"/><path d="M30 18h4a4 4 0 0 1 0 8h-4"/><path d="M16 38h12"/>`,
    run: `<circle cx="30" cy="12" r="3.5"/><path d="M28 18l-4 6 5 3 3 9"/><path d="M24 24l-6 2-4 8"/><path d="M24 24l-8-5"/><path d="M28 18l6 4 4-2"/>`,
    dumbbell: `<path d="M14 24h20"/><path d="M10 18v12"/><path d="M16 18v12"/><path d="M32 18v12"/><path d="M38 18v12"/>`,
    shield: `<path d="M24 8l14 6v10c0 9-6 14-14 16-8-2-14-7-14-16V14l14-6z"/>`,
    globe: `<circle cx="24" cy="24" r="12"/><path d="M12 24h24"/><path d="M24 12c4 4 6 8 6 12s-2 8-6 12"/><path d="M24 12c-4 4-6 8-6 12s2 8 6 12"/>`,
    scroll: `<path d="M16 12h16a4 4 0 0 1 4 4v20H16a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/><path d="M16 12v24"/><path d="M20 20h10"/><path d="M20 26h8"/>`,
    map: `<path d="M10 14l10-4 8 4 10-4v28l-10 4-8-4-10 4V14z"/><path d="M20 10v28"/><path d="M28 14v28"/>`,
    cloud: `<path d="M16 30h18a6 6 0 0 0 1-12 8 8 0 0 0-15-3A6 6 0 0 0 16 30z"/>`,
    chip: `<rect x="14" y="14" width="20" height="20" rx="3"/><path d="M20 8v6M28 8v6M20 34v6M28 34v6M8 20h6M8 28h6M34 20h6M34 28h6"/>`,
    circuit: `<rect x="10" y="10" width="28" height="28" rx="3"/><circle cx="18" cy="18" r="2.5"/><circle cx="30" cy="18" r="2.5"/><circle cx="18" cy="30" r="2.5"/><circle cx="30" cy="30" r="2.5"/><path d="M18 20.5v7M30 20.5v7M20.5 18h7M20.5 30h7"/><path d="M10 24h5M33 24h5M24 10v5M24 33v5"/>`,
    rocket: `<path d="M24 8c6 6 8 14 8 20l-8 4-8-4c0-6 2-14 8-20z"/><path d="M16 28l-4 8 8-4"/><path d="M32 28l4 8-8-4"/><circle cx="24" cy="20" r="2.5"/>`,
    atom: `<circle cx="24" cy="24" r="3" fill="currentColor" stroke="none"/><ellipse cx="24" cy="24" rx="16" ry="7"/><ellipse cx="24" cy="24" rx="16" ry="7" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="16" ry="7" transform="rotate(-60 24 24)"/>`,
    flask: `<path d="M20 8h8v12l8 14H12l8-14V8z"/><path d="M18 8h12"/>`,
    leaf: `<path d="M24 40C12 28 12 14 24 8c12 6 12 20 0 32z"/><path d="M24 12v24"/>`,
    recycle: `<path d="M24 6l6 10h-4v6h-4v-6h-4z"/><path d="M24 6l6 10h-4v6h-4v-6h-4z" transform="rotate(120 24 24)"/><path d="M24 6l6 10h-4v6h-4v-6h-4z" transform="rotate(240 24 24)"/>`,
    animal: `<ellipse cx="24" cy="28" rx="12" ry="11"/><path d="M13 20l-2-9 9 5"/><path d="M35 20l2-9-9 5"/><circle cx="19" cy="27" r="1.8" fill="currentColor" stroke="none"/><circle cx="29" cy="27" r="1.8" fill="currentColor" stroke="none"/><path d="M22 32c1 1.5 3 1.5 4 0"/>`,
    star: `<path d="M24 8l3.5 10.5H38l-8.5 6.5 3.5 11L24 30l-9 6 3.5-11L10 18.5h10.5L24 8z"/>`,
    heart: `<path d="M24 38s-14-8-14-18a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 10-14 18-14 18z"/>`,
    brain: `<path d="M18 16a6 6 0 0 1 12 0 5 5 0 0 1 4 8c0 6-4 10-10 14-6-4-10-8-10-14a5 5 0 0 1 4-8z"/><path d="M24 16v22"/>`,
    moon: `<path d="M30 12a12 12 0 1 0 6 20 12 12 0 0 1-6-20z"/>`,
    cross: `<circle cx="24" cy="24" r="14"/><path d="M24 16v16"/><path d="M16 24h16"/>`,
    coin: `<circle cx="24" cy="24" r="12"/><path d="M24 16v16"/><path d="M20 20h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h7"/>`,
    scale: `<path d="M24 10v28"/><path d="M14 38h20"/><path d="M12 18h24"/><path d="M12 18l-4 10h8l-4-10z"/><path d="M36 18l-4 10h8l-4-10z"/>`,
    chat: `<path d="M12 14h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H20l-8 6V18a4 4 0 0 1 4-4z"/>`,
    book: `<path d="M10 12h12v24H14a4 4 0 0 1-4-4V12z"/><path d="M26 12h12v20a4 4 0 0 1-4 4H26V12z"/><path d="M22 12v24"/><path d="M26 12v24"/>`,
    paper: `<path d="M14 8h14l8 8v24H14V8z"/><path d="M28 8v8h8"/><path d="M20 24h12"/><path d="M20 30h12"/><path d="M20 36h8"/>`,
    pen: `<path d="M28 10l10 10L18 40H8V30L28 10z"/><path d="M24 14l10 10"/>`,
    pencil: `<path d="M32 8l8 8-22 22H10V30L32 8z"/><path d="M28 12l8 8"/><path d="M10 30l8 8"/>`,
    palette: `<path d="M24 8c-9 0-16 7-16 15 0 6 4 11 10 13 1 0 2-1 2-2 0-2 1-3 3-3h3c6 0 11-5 11-12C37 13 31 8 24 8z"/><circle cx="16" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="24" cy="14" r="2" fill="currentColor" stroke="none"/><circle cx="32" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="18" cy="26" r="2" fill="currentColor" stroke="none"/>`,
    building: `<path d="M12 40V16l12-8 12 8v24"/><path d="M20 40V28h8v12"/><path d="M18 22h2M28 22h2M18 28h2M28 28h2"/>`,
    camera: `<rect x="10" y="16" width="28" height="20" rx="4"/><circle cx="24" cy="26" r="6"/><path d="M18 16l2-4h8l2 4"/>`,
    music: `<path d="M18 36a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M34 32a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M22 32V12l16-4v20"/>`,
    film: `<rect x="10" y="12" width="28" height="24" rx="3"/><path d="M16 12v24M32 12v24M10 20h6M10 28h6M32 20h6M32 28h6"/>`,
    think: `<circle cx="24" cy="20" r="10"/><path d="M20 30l-2 8h12l-2-8"/><path d="M20 18h.01M24 18h.01M28 18h.01"/>`,
    lantern: `<path d="M18 16h12v16a6 6 0 0 1-12 0V16z"/><path d="M20 12h8"/><path d="M24 8v4"/><path d="M18 22h12"/>`,
    paw: `<circle cx="16" cy="16" r="4"/><circle cx="32" cy="16" r="4"/><circle cx="12" cy="26" r="3.5"/><circle cx="36" cy="26" r="3.5"/><path d="M18 34c0-4 3-7 6-7s6 3 6 7-6 6-6 6-6-2-6-6z"/>`,
    bag: `<path d="M12 18h24l-2 20H14L12 18z"/><path d="M18 18V14a6 6 0 0 1 12 0v4"/>`,
    package: `<path d="M12 16h24v22H12V16z"/><path d="M12 16l12-6 12 6"/><path d="M24 10v28"/><path d="M18 22h5M18 27h8"/>`,
    computer: `<rect x="8" y="12" width="32" height="20" rx="2"/><path d="M14 38h20"/><path d="M24 32v6"/><path d="M18 20h12"/>`,
    car: `<path d="M10 28l4-10h20l4 10"/><path d="M8 28h32v6H8z"/><circle cx="16" cy="34" r="3"/><circle cx="32" cy="34" r="3"/>`,
    shirt: `<path d="M16 14l8 4 8-4 6 6-4 4-4-2v16H18V22l-4 2-4-4 6-6z"/>`,
    home: `<path d="M8 22L24 8l16 14"/><path d="M12 20v18h24V20"/><path d="M20 38V26h8v12"/>`,
    bulb: `<path d="M24 8a10 10 0 0 1 6 18c-1 1-2 3-2 5h-8c0-2-1-4-2-5a10 10 0 0 1 6-18z"/><path d="M20 35h8M21 39h6"/>`,
    brief: `<rect x="10" y="16" width="28" height="20" rx="3"/><path d="M18 16v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M10 24h28"/>`,
    wrench: `<path d="M32 10a8 8 0 0 0-10 10L10 32l6 6 12-12a8 8 0 0 0 10-10l-6 6-4-4 6-6z"/>`,
    clock: `<circle cx="24" cy="24" r="14"/><path d="M24 14v11l7 4"/>`,
    target: `<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none"/>`,
    code: `<path d="M16 16l-8 8 8 8"/><path d="M32 16l8 8-8 8"/><path d="M28 12l-8 24"/>`,
    tag: `<path d="M10 24V12h12l14 14-12 12L10 24z"/><circle cx="16" cy="18" r="2" fill="currentColor" stroke="none"/>`,
    spark: `<path d="M24 8v8M24 32v8M8 24h8M32 24h8M13 13l5.5 5.5M29.5 29.5L35 35M35 13l-5.5 5.5M18.5 29.5L13 35"/>`,
  };

  function inspireIconSvg(category) {
    const key = INSPIRE_ICONS[category] || "spark";
    const paths = ICON_PATHS[key] || ICON_PATHS.spark;
    return `<svg class="orb-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const THUMB_PALETTE = [
    ["#fff1dd", "#c9843d"],
    ["#f8e8e1", "#c48978"],
    ["#d7e6f2", "#6a8eab"],
    ["#ffe9c2", "#e8a05c"],
    ["#f0e8df", "#8a7b6c"],
    ["#e8f0e4", "#7a9a6e"],
  ];

  const CAL_START_YEAR = 2026;
  const CAL_START_MONTH = 7;
  const CAL_END_YEAR = 2100;

  const state = {
    entries: loadEntries(),
    settings: loadSettings(),
    view: "home",
    filter: "全部",
    search: "",
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    selectedDay: todayKey(),
    summaryRange: "week",
    detailId: null,
    quizMode: false,
    noteRevealed: true,
    inspireCategory: null,
    inspireQueue: [],
    selectedCategory: "其他",
    categoryQuery: "",
    themeQuery: "",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((e) => ({ starred: false, ...e }));
        }
      }
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (backupRaw) {
        const backup = JSON.parse(backupRaw);
        if (Array.isArray(backup) && backup.length) {
          const restored = backup.map((e) => ({ starred: false, ...e }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
          return restored;
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings();
      return { ...defaultSettings(), ...JSON.parse(raw) };
    } catch {
      return defaultSettings();
    }
  }

  function defaultSettings() {
    return {
      customCategories: [],
      weeklyTheme: null,
    };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
    if (state.entries.length > 0) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(state.entries));
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function allCategories() {
    const custom = state.settings.customCategories || [];
    const merged = [...custom, ...BASE_CATEGORIES];
    return [...new Set(merged)];
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function todayKey(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatCN(key) {
    const d = parseKey(key);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function startOfWeek(d = new Date()) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay();
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function weekId(d = new Date()) {
    const s = startOfWeek(d);
    return `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`;
  }

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function thumbStyle(category) {
    const [bg, color] = THUMB_PALETTE[hashStr(category || "其他") % THUMB_PALETTE.length];
    return `background:${bg};color:${color}`;
  }

  function currentTheme() {
    const t = state.settings.weeklyTheme;
    if (!t || t.weekId !== weekId()) return null;
    return t.category;
  }

  function shuffleInspirePool() {
    const pool = allCategories().filter((c) => c !== "其他");
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function pickInspire(exclude) {
    // 洗牌轮换：一轮里每个分类大致出现一次，避免有的老刷到、有的刷不到
    if (!state.inspireQueue.length) {
      state.inspireQueue = shuffleInspirePool();
    }
    let next = state.inspireQueue.shift();
    if (next === exclude && state.inspireQueue.length) {
      next = state.inspireQueue.shift();
      state.inspireQueue.push(exclude);
    } else if (next === exclude) {
      state.inspireQueue = shuffleInspirePool().filter((c) => c !== exclude);
      next = state.inspireQueue.shift() || exclude;
    }
    return next;
  }

  function setInspire(category) {
    state.inspireCategory = category;
    const hint = INSPIRE_HINTS[category] || "学一个你以前不知道的小知识";
    $("#heroTitle").textContent = category;
    $("#heroSub").textContent = hint;
    $("#heroOrb").innerHTML = inspireIconSvg(category);
  }






  function entriesByDay() {
    const map = new Map();
    for (const e of state.entries) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date).push(e);
    }
    return map;
  }

  function sortedEntries() {
    return [...state.entries].sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      if (a.date === b.date) return b.createdAt - a.createdAt;
      return a.date < b.date ? 1 : -1;
    });
  }

  function uniqueDays(entries = state.entries) {
    return [...new Set(entries.map((e) => e.date))].sort();
  }

  function currentStreak(entries = state.entries) {
    const days = new Set(entries.map((e) => e.date));
    let cursor = new Date();
    let key = todayKey(cursor);
    if (!days.has(key)) {
      cursor.setDate(cursor.getDate() - 1);
      key = todayKey(cursor);
      if (!days.has(key)) return 0;
    }
    let streak = 0;
    while (days.has(todayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function longestStreak(entries = state.entries) {
    const days = uniqueDays(entries);
    if (!days.length) return 0;
    let best = 1;
    let run = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = parseKey(days[i - 1]);
      const cur = parseKey(days[i]);
      const diff = (cur - prev) / 86400000;
      if (diff === 1) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }
    return best;
  }

  function weekEntries() {
    const start = startOfWeek();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const a = todayKey(start);
    const b = todayKey(end);
    return state.entries.filter((e) => e.date >= a && e.date <= b);
  }

  function monthEntries(y = state.calYear, m = state.calMonth) {
    const prefix = `${y}-${pad(m + 1)}`;
    return state.entries.filter((e) => e.date.startsWith(prefix));
  }

  function yearEntries(y = new Date().getFullYear()) {
    return state.entries.filter((e) => e.date.startsWith(String(y)));
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  function setView(name) {
    state.view = name;
    $("#app").dataset.view = name;
    $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === name));
    $$(".tab[data-goto]").forEach((t) => t.classList.toggle("active", t.dataset.goto === name));
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCategoryGrid(target, query, selected, dataAttr) {
    const q = (query || "").trim();
    const list = allCategories().filter((c) => !q || c.includes(q));
    target.innerHTML = list.length
      ? list
          .map(
            (c) =>
              `<button class="cat-chip ${selected === c ? "active" : ""}" type="button" data-${dataAttr}="${c}">${c}</button>`
          )
          .join("")
      : `<p class="empty" style="padding:8px 0;margin:0">没有匹配分类</p>`;
  }

  function openEditor(presetCategory) {
    $("#editorTitle").textContent = "今日打卡";
    $("#entryForm").reset();
    state.categoryQuery = "";
    $("#categorySearch").value = "";
    $("#customCategoryInput").value = "";
    const theme = currentTheme();
    const preset =
      presetCategory && allCategories().includes(presetCategory)
        ? presetCategory
        : theme || "其他";
    state.selectedCategory = preset;
    $("#fieldCategory").value = state.selectedCategory;
    renderCategoryGrid($("#categoryGrid"), "", state.selectedCategory, "cat");
    $("#editorSheet").hidden = false;
    setTimeout(() => $("#fieldTitle").focus(), 50);
  }

  function closeEditor() {
    $("#editorSheet").hidden = true;
  }

  function openDetail(id, { quiz = false } = {}) {
    const entry = state.entries.find((e) => e.id === id);
    if (!entry) return;
    state.detailId = id;
    state.quizMode = quiz;
    state.noteRevealed = !quiz;
    $("#detailCategory").textContent = entry.category;
    $("#detailDate").textContent = formatCN(entry.date);
    $("#detailTitle").textContent = entry.title;
    $("#detailNote").textContent = entry.note;
    const src = $("#detailSource");
    if (entry.source) {
      src.hidden = false;
      src.textContent = `来源：${entry.source}`;
    } else {
      src.hidden = true;
    }
    syncStarBtn(entry);
    syncQuizUI();
    $("#detailSheet").hidden = false;
  }

  function syncStarBtn(entry) {
    const btn = $("#starEntryBtn");
    btn.textContent = entry.starred ? "已收藏" : "收藏";
    btn.classList.toggle("star-on", !!entry.starred);
  }

  function syncQuizUI() {
    const wrap = $("#quizWrap");
    const note = $("#detailNote");
    if (state.quizMode && !state.noteRevealed) {
      wrap.classList.remove("revealed");
      note.classList.add("hidden-note");
      $("#revealNoteBtn").hidden = false;
    } else {
      wrap.classList.add("revealed");
      note.classList.remove("hidden-note");
      $("#revealNoteBtn").hidden = true;
    }
  }

  function closeDetail() {
    $("#detailSheet").hidden = true;
    state.detailId = null;
    state.quizMode = false;
  }

  function openThemeSheet() {
    state.themeQuery = "";
    $("#themeSearch").value = "";
    renderCategoryGrid($("#themeGrid"), "", currentTheme(), "theme");
    $("#themeSheet").hidden = false;
  }

  function closeThemeSheet() {
    $("#themeSheet").hidden = true;
  }

  function thumbChar(title) {
    const t = (title || "知").trim();
    return t[0] || "知";
  }

  function cardHTML(entry) {
    const star = entry.starred ? `<span class="star-mark">★</span>` : "";
    return `
      <button class="knowledge-card" type="button" data-open="${entry.id}">
        ${star}
        <span class="thumb" style="${thumbStyle(entry.category)}">${thumbChar(entry.title)}</span>
        <span class="k-body">
          <strong>${escapeHTML(entry.title)}</strong>
          <p>${escapeHTML(entry.note)}</p>
        </span>
        <span class="tag">${escapeHTML(entry.category)}</span>
      </button>
    `;
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderHome() {
    const streak = currentStreak();
    const week = weekEntries();
    const weekDays = new Set(week.map((e) => e.date)).size;
    const pct = Math.round((weekDays / 7) * 100);

    $("#statStreak").textContent = String(streak);
    $("#statWeek").textContent = String(week.length);
    $("#statTotal").textContent = String(state.entries.length);
    $("#weekBar").style.width = `${pct}%`;
    $("#weekRingFg").setAttribute("stroke-dasharray", `${pct}, 100`);
    $("#weekPct").textContent = `${pct}%`;

    const theme = currentTheme();
    $("#themeLabel").textContent = theme
      ? `本周主攻「${theme}」`
      : "还没设定，点右边选一个领域专注练";

    if (!state.inspireCategory || !allCategories().includes(state.inspireCategory)) {
      setInspire(pickInspire());
    } else {
      setInspire(state.inspireCategory);
    }

    const recent = sortedEntries().slice(0, 5);
    $("#recentList").innerHTML = recent.length
      ? recent.map(cardHTML).join("")
      : `<p class="empty">还没有知识卡片。点底部「＋」写下今天学到的第一件事。</p>`;
  }

  function usedCategories() {
    const set = new Set(state.entries.map((e) => e.category));
    return allCategories().filter((c) => set.has(c));
  }

  function renderFilters() {
    const main = ["全部", "收藏"];
    $("#filterRow").innerHTML = main
      .map((c) => `<button class="chip ${state.filter === c ? "active" : ""}" type="button" data-filter="${c}">${c}</button>`)
      .join("");

    const cats = usedCategories();
    const catRow = $("#categoryFilterRow");
    if (!cats.length) {
      catRow.innerHTML = `<span class="filter-hint">打卡后会在这里出现知识分类</span>`;
      return;
    }
    catRow.innerHTML = cats
      .map((c) => `<button class="chip ${state.filter === c ? "active" : ""}" type="button" data-filter="${c}">${c}</button>`)
      .join("");
  }

  function renderRecords() {
    renderFilters();
    let list = sortedEntries();
    if (state.filter === "收藏") list = list.filter((e) => e.starred);
    else if (state.filter !== "全部") list = list.filter((e) => e.category === state.filter);
    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.note || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q)
      );
    }
    $("#recordsList").innerHTML = list.map(cardHTML).join("");
    $("#recordsEmpty").hidden = list.length > 0;
    if (!list.length) {
      $("#recordsEmpty").hidden = false;
      $("#recordsEmpty").textContent = q || state.filter !== "全部"
        ? "没有符合条件的记录。"
        : "还没有记录。点中间「+」写下今天学到的第一件事。";
    }
  }

  function monthIndex(y, m) {
    return y * 12 + m;
  }

  function clampCal(y, m) {
    const min = monthIndex(CAL_START_YEAR, CAL_START_MONTH);
    const max = monthIndex(CAL_END_YEAR, 11);
    let cur = monthIndex(y, m);
    if (cur < min) cur = min;
    if (cur > max) cur = max;
    return { year: Math.floor(cur / 12), month: cur % 12 };
  }

  function syncCalPickers() {
    const yearSelect = $("#calYearSelect");
    const monthSelect = $("#calMonthSelect");
    if (!yearSelect.options.length) {
      for (let y = CAL_START_YEAR; y <= CAL_END_YEAR; y++) {
        const opt = document.createElement("option");
        opt.value = String(y);
        opt.textContent = String(y);
        yearSelect.appendChild(opt);
      }
    }

    const clamped = clampCal(state.calYear, state.calMonth);
    state.calYear = clamped.year;
    state.calMonth = clamped.month;
    yearSelect.value = String(state.calYear);

    [...monthSelect.options].forEach((opt) => {
      const m = Number(opt.value);
      const allowed =
        monthIndex(state.calYear, m) >= monthIndex(CAL_START_YEAR, CAL_START_MONTH) &&
        monthIndex(state.calYear, m) <= monthIndex(CAL_END_YEAR, 11);
      opt.disabled = !allowed;
      opt.hidden = !allowed;
    });
    monthSelect.value = String(state.calMonth);
    $("#prevMonth").disabled =
      monthIndex(state.calYear, state.calMonth) <= monthIndex(CAL_START_YEAR, CAL_START_MONTH);
    $("#nextMonth").disabled =
      monthIndex(state.calYear, state.calMonth) >= monthIndex(CAL_END_YEAR, 11);
  }

  function renderCalendar() {
    syncCalPickers();
    const y = state.calYear;
    const m = state.calMonth;
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const byDay = entriesByDay();
    const today = todayKey();
    const cells = [];

    for (let i = 0; i < startPad; i++) {
      cells.push(`<button class="cal-cell empty" type="button" tabindex="-1"></button>`);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${pad(m + 1)}-${pad(d)}`;
      const count = (byDay.get(key) || []).length;
      const isFuture = key > today;
      const isToday = key === today;
      let cls = "blank";
      let extras = "";
      if (count > 0) {
        if (count >= 3) cls = "l4";
        else if (count === 2) cls = "l3";
        else cls = "l2";
        extras += `<span class="count">${count}</span>`;
        if (count >= 3) extras += `<span class="crown">★</span>`;
      } else if (isFuture) {
        cls = "future";
      }
      const selected = key === state.selectedDay ? "selected" : "";
      const todayMark = isToday ? "today-mark" : "";
      cells.push(
        `<button class="cal-cell ${cls} ${selected} ${todayMark}" type="button" data-day="${key}" aria-label="${y}年${m + 1}月${d}日">${d}${extras}</button>`
      );
    }

    $("#calGrid").innerHTML = cells.join("");
    const dayItems = (byDay.get(state.selectedDay) || []).sort((a, b) => b.createdAt - a.createdAt);
    $("#dayDetailTitle").textContent = `${formatCN(state.selectedDay)} · ${dayItems.length} 条`;
    $("#dayDetailList").innerHTML = dayItems.length
      ? dayItems.map(cardHTML).join("")
      : `<p class="empty">这天还没有记录。</p>`;
  }

  function rangeEntries() {
    if (state.summaryRange === "week") return weekEntries();
    if (state.summaryRange === "month") {
      const now = new Date();
      return monthEntries(now.getFullYear(), now.getMonth());
    }
    return yearEntries(new Date().getFullYear());
  }

  function renderSummary() {
    $$(".sum-tab").forEach((t) => t.classList.toggle("active", t.dataset.range === state.summaryRange));
    const list = rangeEntries().sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
    );
    const days = new Set(list.map((e) => e.date)).size;
    const labels = {
      week: ["本周学到", "本周知识"],
      month: ["本月学到", "本月知识"],
      year: ["今年学到", "今年知识"],
    };
    $("#sumCountLabel").textContent = labels[state.summaryRange][0];
    $("#sumListTitle").textContent = labels[state.summaryRange][1];
    $("#sumCount").textContent = String(list.length);
    $("#sumDays").textContent = String(days);
    $("#sumBest").textContent = String(longestStreak(state.entries));

    const cats = {};
    for (const e of list) cats[e.category] = (cats[e.category] || 0) + 1;
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const streak = currentStreak();
    const diversity = Object.keys(cats).length;
    const theme = currentTheme();

    let insight = "从今天开始：每天一件小事，积少成多。";
    if (list.length === 0) {
      insight = "这段时间还是空白。点底部「＋」写下今天学到的第一件事。";
    } else if (state.summaryRange === "week") {
      insight = `本周记下了 ${list.length} 个小知识，覆盖 ${days} 天、${diversity} 个领域。连续 ${streak} 天。${
        theme ? `本周主题是「${theme}」。` : ""
      }${topCat ? `最常记的是「${topCat[0]}」。` : ""}`;
    } else if (state.summaryRange === "month") {
      insight = `这个月收集了 ${list.length} 张卡片，打卡 ${days} 天，横跨 ${diversity} 个分类。`;
    } else {
      insight = `今年一共学了 ${list.length} 个小知识，涉及 ${diversity} 个领域，最长连续 ${longestStreak()} 天。`;
    }
    $("#insightText").textContent = insight;
    $("#summaryList").innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">暂无内容。</p>`;
  }

  function render() {
    if (state.view === "home") renderHome();
    if (state.view === "records") renderRecords();
    if (state.view === "calendar") renderCalendar();
    if (state.view === "summary") renderSummary();
  }

  function randomReview() {
    if (!state.entries.length) {
      toast("还没有可复习的知识");
      return;
    }
    const entry = state.entries[Math.floor(Math.random() * state.entries.length)];
    openDetail(entry.id, { quiz: true });
    toast("先回想，再点开笔记");
  }

  function onSubmit(e) {
    e.preventDefault();
    const title = $("#fieldTitle").value.trim();
    const note = $("#fieldNote").value.trim();
    const category = $("#fieldCategory").value || state.selectedCategory || "其他";
    const source = $("#fieldSource").value.trim();
    if (!title || !note) {
      toast("标题和笔记都要填哦");
      return;
    }
    state.entries.push({
      id: uid(),
      title,
      note,
      category,
      source,
      starred: false,
      date: todayKey(),
      createdAt: Date.now(),
    });
    save();
    closeEditor();
    setView("home");
    const theme = currentTheme();
    if (theme && category === theme) toast(`打卡成功 · 贴合本周主题「${theme}」`);
    else toast("打卡成功，又多懂一点了");
  }

  function toggleStar() {
    const entry = state.entries.find((e) => e.id === state.detailId);
    if (!entry) return;
    entry.starred = !entry.starred;
    save();
    syncStarBtn(entry);
    toast(entry.starred ? "已收藏" : "已取消收藏");
    render();
  }

  function exportData() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: state.entries,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `正经摸鱼-备份-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(state.entries.length ? `已导出 ${state.entries.length} 条` : "已导出（当前还没有打卡）");
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));
        const entries = Array.isArray(data) ? data : data.entries;
        if (!Array.isArray(entries)) {
          toast("备份文件格式不对");
          return;
        }
        const incoming = entries
          .filter((e) => e && e.title && e.note)
          .map((e) => ({
            id: e.id || uid(),
            title: String(e.title),
            note: String(e.note),
            category: String(e.category || "其他"),
            source: String(e.source || ""),
            starred: !!e.starred,
            date: e.date || todayKey(),
            createdAt: e.createdAt || Date.now(),
          }));
        if (!incoming.length) {
          toast("备份里没有可用记录");
          return;
        }
        const byId = new Map(state.entries.map((e) => [e.id, e]));
        for (const e of incoming) byId.set(e.id, e);
        state.entries = [...byId.values()];
        if (data && data.settings && typeof data.settings === "object") {
          state.settings = { ...defaultSettings(), ...data.settings };
          saveSettings();
        }
        save();
        render();
        toast(`已导入，当前共 ${state.entries.length} 条`);
      } catch {
        toast("导入失败，请检查文件");
      }
    };
    reader.readAsText(file);
  }

  function deleteCurrent() {
    if (!state.detailId) return;
    if (!confirm("确定删除这条知识卡片？")) return;
    state.entries = state.entries.filter((e) => e.id !== state.detailId);
    save();
    closeDetail();
    render();
    toast("已删除");
  }

  function addCustomCategory() {
    const name = $("#customCategoryInput").value.trim();
    if (!name) {
      toast("先输入分类名");
      return;
    }
    if (name.length > 12) {
      toast("分类名最多 12 字");
      return;
    }
    if (allCategories().includes(name)) {
      state.selectedCategory = name;
      $("#fieldCategory").value = name;
      renderCategoryGrid($("#categoryGrid"), state.categoryQuery, name, "cat");
      toast("分类已存在，已帮你选中");
      return;
    }
    state.settings.customCategories.unshift(name);
    saveSettings();
    state.selectedCategory = name;
    $("#fieldCategory").value = name;
    $("#customCategoryInput").value = "";
    renderCategoryGrid($("#categoryGrid"), state.categoryQuery, name, "cat");
    toast(`已添加分类「${name}」`);
  }

  function shiftMonth(delta) {
    const next = clampCal(state.calYear, state.calMonth + delta);
    state.calYear = next.year;
    state.calMonth = next.month;
    renderCalendar();
  }

  function bind() {
    document.body.addEventListener("click", (e) => {
      const goto = e.target.closest("[data-goto]");
      if (goto) {
        setView(goto.dataset.goto);
        return;
      }
      const add = e.target.closest("[data-action='add']");
      if (add) {
        openEditor();
        return;
      }
      const review = e.target.closest("[data-action='review']");
      if (review) {
        randomReview();
        return;
      }
      const cat = e.target.closest("[data-cat]");
      if (cat) {
        state.selectedCategory = cat.dataset.cat;
        $("#fieldCategory").value = state.selectedCategory;
        renderCategoryGrid($("#categoryGrid"), state.categoryQuery, state.selectedCategory, "cat");
        return;
      }
      const themeChip = e.target.closest("[data-theme]");
      if (themeChip) {
        state.settings.weeklyTheme = { weekId: weekId(), category: themeChip.dataset.theme };
        saveSettings();
            renderCategoryGrid($("#themeGrid"), state.themeQuery, themeChip.dataset.theme, "theme");
        renderHome();
        toast(`本周主题：${themeChip.dataset.theme}`);
        return;
      }
      const open = e.target.closest("[data-open]");
      if (open) {
        openDetail(open.dataset.open, { quiz: false });
        return;
      }
      const filter = e.target.closest("[data-filter]");
      if (filter) {
        state.filter = filter.dataset.filter;
        renderRecords();
        return;
      }
      const day = e.target.closest("[data-day]");
      if (day) {
        state.selectedDay = day.dataset.day;
        renderCalendar();
        return;
      }
      const sumTab = e.target.closest(".sum-tab");
      if (sumTab) {
        state.summaryRange = sumTab.dataset.range;
        renderSummary();
        return;
      }
      const closer = e.target.closest("[data-close]");
      if (closer) {
        if (closer.dataset.close === "editor") closeEditor();
        if (closer.dataset.close === "detail") closeDetail();
        if (closer.dataset.close === "theme") closeThemeSheet();
      }
    });

    $("#shuffleInspireBtn").addEventListener("click", () => {
      setInspire(pickInspire(state.inspireCategory));
    });
    $("#categorySearch").addEventListener("input", (e) => {
      state.categoryQuery = e.target.value;
      renderCategoryGrid($("#categoryGrid"), state.categoryQuery, state.selectedCategory, "cat");
    });
    $("#addCategoryBtn").addEventListener("click", addCustomCategory);
    $("#customCategoryInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomCategory();
      }
    });
    $("#searchInput").addEventListener("input", (e) => {
      state.search = e.target.value;
      renderRecords();
    });
    $("#themePickBtn").addEventListener("click", openThemeSheet);
    $("#themeSearch").addEventListener("input", (e) => {
      state.themeQuery = e.target.value;
      renderCategoryGrid($("#themeGrid"), state.themeQuery, currentTheme(), "theme");
    });
    $("#clearThemeBtn").addEventListener("click", () => {
      state.settings.weeklyTheme = null;
      saveSettings();
      renderCategoryGrid($("#themeGrid"), state.themeQuery, null, "theme");
      renderHome();
      toast("已清除本周主题");
    });
    $("#revealNoteBtn").addEventListener("click", () => {
      state.noteRevealed = true;
      syncQuizUI();
    });
    $("#starEntryBtn").addEventListener("click", toggleStar);
    $("#prevMonth").addEventListener("click", () => shiftMonth(-1));
    $("#nextMonth").addEventListener("click", () => shiftMonth(1));
    $("#calYearSelect").addEventListener("change", (e) => {
      const next = clampCal(Number(e.target.value), state.calMonth);
      state.calYear = next.year;
      state.calMonth = next.month;
      renderCalendar();
    });
    $("#calMonthSelect").addEventListener("change", (e) => {
      const next = clampCal(state.calYear, Number(e.target.value));
      state.calYear = next.year;
      state.calMonth = next.month;
      renderCalendar();
    });
    $("#entryForm").addEventListener("submit", onSubmit);
    $("#deleteEntryBtn").addEventListener("click", deleteCurrent);
    $("#exportBtn").addEventListener("click", exportData);
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      importData(file);
      e.target.value = "";
    });
  }

  bind();
  render();
})();
