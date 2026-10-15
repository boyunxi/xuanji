export interface GameItemOption {
  name: string;
  category: string;
  description?: string;
  rarity?: "普通" | "稀有" | "史诗" | "传说";
}

export const predefinedGameItems: GameItemOption[] = [
  // 通用货币
  { name: "元宝", category: "通用货币", description: "最高价值通货，用于商城直购与抽奖", rarity: "传说" },
  { name: "灵石", category: "通用货币", description: "修炼基础资源，用于洞府与功法升级", rarity: "稀有" },
  { name: "仙玉", category: "通用货币", description: "跨服战役特殊代币，兑换限定外观", rarity: "史诗" },
  { name: "银两", category: "通用货币", description: "日常主线流通货币，NPC交易使用", rarity: "普通" },
  { name: "宗门贡献", category: "通用货币", description: "宗门活动产出，兑换宗门藏经阁秘籍", rarity: "普通" },

  // 丹药资源
  { name: "九转金丹", category: "修炼丹药", description: "渡劫破境神丹，提升突破成功率100%", rarity: "传说" },
  { name: "凝气丹", category: "修炼丹药", description: "炼气化神基础灵药，快速提升角色经验", rarity: "普通" },
  { name: "洗髓丹", category: "修炼丹药", description: "洗练经脉资质，重置所有自由潜能点", rarity: "稀有" },
  { name: "大还丹", category: "修炼丹药", description: "瞬时恢复全部生命气血与法力真气", rarity: "稀有" },
  { name: "渡劫保命符", category: "修炼丹药", description: "天劫雷罚失败时免受修为倒退惩罚", rarity: "史诗" },

  // 锻造材料
  { name: "强化神石", category: "锻造材料", description: "神兵精炼必备石材，提高强化成功概率", rarity: "史诗" },
  { name: "天外陨铁", category: "锻造材料", description: "重铸装备附加极品词条的核心材料", rarity: "史诗" },
  { name: "寒铁精魄", category: "锻造材料", description: "千年极寒玄铁提炼，兵刃升阶材料", rarity: "稀有" },
  { name: "凤羽流金", category: "锻造材料", description: "神鸟凤凰遗留赤羽，防具附魔顶级材料", rarity: "传说" },
  { name: "乾坤石", category: "锻造材料", description: "用于拓展角色背包与宗门乾坤仓库空间", rarity: "普通" },

  // 极品神兵
  { name: "太虚飞剑", category: "极品装备", description: "纯阳无极神兵，御剑飞行时提升移速80%", rarity: "传说" },
  { name: "斩龙古剑", category: "极品装备", description: "附带高额真伤与暴击伤害的太古名剑", rarity: "史诗" },
  { name: "诛仙阵图", category: "极品装备", description: "绝世杀伐阵法法宝，对全屏敌对目标造成重创", rarity: "传说" },
  { name: "混元金斗", category: "极品装备", description: "上古封神仙器，战斗时禁锢敌方主动战法", rarity: "史诗" },
  { name: "伏魔宝镜", category: "极品装备", description: "破除一切隐身与虚妄状态的灵宝", rarity: "稀有" },

  // 外观坐骑
  { name: "限定坐骑·墨麒麟", category: "外观坐骑", description: "开服全区首发极品神兽坐骑，自带祥瑞云雾", rarity: "传说" },
  { name: "踏雪白鹿", category: "外观坐骑", description: "仙风道骨灵兽外观，提升移动速度60%", rarity: "史诗" },
  { name: "九霄云雀", category: "外观坐骑", description: "华丽飞行坐骑，免疫沼泽与水面减速地形", rarity: "史诗" },
  { name: "苍龙出海·神尊战袍", category: "外观坐骑", description: "至尊限定时装，出场伴随金龙环绕特效", rarity: "传说" },

  // 礼包宝匣
  { name: "开服至尊全套大礼包", category: "礼包宝匣", description: "包含元宝x10000+九转金丹x10+开荒神装一套", rarity: "传说" },
  { name: "宗门秘藏极品宝匣", category: "礼包宝匣", description: "开启后随机获得金色图纸或神兽蛋", rarity: "史诗" },
  { name: "运营维护故障全服补偿包", category: "礼包宝匣", description: "全服补偿：元宝x2000+体力丹x10+银两x10万", rarity: "稀有" },
];
