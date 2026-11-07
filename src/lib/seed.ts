import type {
  AppSettings,
  ChronicKey,
  ChronicPlan,
  Constitution,
  Ingredient,
  MealRecord,
  Recipe,
  Role,
  HealthProfile,
  User,
} from '@/types'
import { ROLE_DEFAULTS } from '@/utils/permissions'

const DAY = 86400_000
const now = Date.now()
const iso = (msAgo: number) => new Date(now - msAgo).toISOString()

/* ---------------------------- 确定性随机源 ---------------------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261108)
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗']
const GIVEN = ['淑芬', '建国', '秀兰', '志强', '丽华', '金凤', '德明', '桂英', '海燕', '文博', '欣怡', '子涵', '雨桐', '浩然', '思远', '梓萱', '嘉怡', '俊杰', '静蕾', '栋梁']
const AVATAR_COLORS = ['#2f8f5b', '#0ea5a4', '#c98a2b', '#b8553a', '#6f7f3a', '#4a7fb5', '#a05f8f', '#7a6a52']
const fullName = () => pick(SURNAMES) + pick(GIVEN)

export const CONSTITUTIONS: Constitution[] = ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质']
export const CHRONIC_KEYS: ChronicKey[] = ['糖尿病', '高血压', '高血脂', '慢性胃炎', '痛风']

/* ------------------------------- 角色 ------------------------------- */
export function seedRoles(): Role[] {
  return (Object.keys(ROLE_DEFAULTS) as (keyof typeof ROLE_DEFAULTS)[]).map((key, i) => ({
    id: `role_${key}`,
    key,
    name: ROLE_DEFAULTS[key].name,
    description: ROLE_DEFAULTS[key].description,
    permissions: [...ROLE_DEFAULTS[key].permissions],
    builtin: true,
    createdAt: iso(400 * DAY - i * DAY),
  }))
}

/* ------------------------------- 用户 ------------------------------- */
export function seedUsers(): User[] {
  const fixed: Array<Pick<User, 'username' | 'name' | 'roleKey' | 'email'>> = [
    { username: 'admin', name: '林知远', roleKey: 'admin', email: 'admin@shiliao.dev' },
    { username: 'doctor', name: '苏晓棠', roleKey: 'doctor', email: 'doctor@shiliao.dev' },
    { username: 'user', name: '陈默', roleKey: 'user', email: 'user@shiliao.dev' },
  ]
  const list: User[] = fixed.map((f, i) => ({
    id: `u_${1000 + i}`,
    name: f.name,
    username: f.username,
    email: f.email,
    phone: `138${int(10000000, 99999999)}`,
    gender: i === 1 ? '女' : '男',
    age: 30 + i * 8,
    constitution: '平和质',
    chronicTags: i === 2 ? ['高血压'] : [],
    roleKey: f.roleKey,
    status: 'active',
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    createdAt: iso((380 - i * 20) * DAY),
    lastLoginAt: iso(int(1, 48) * 3600_000),
  }))
  for (let i = 0; i < 41; i++) {
    const status = rand() < 0.84 ? 'active' : rand() < 0.6 ? 'disabled' : 'pending'
    list.push({
      id: `u_${1000 + list.length}`,
      name: fullName(),
      username: `user${String(100 + i).padStart(3, '0')}`,
      email: `user${100 + i}@example.com`,
      phone: `1${pick(['3', '5', '7', '8', '9'])}${int(100000000, 999999999)}`.slice(0, 11),
      gender: rand() < 0.55 ? '女' : '男',
      age: int(24, 76),
      constitution: pick(CONSTITUTIONS),
      chronicTags: rand() < 0.62 ? [pick(CHRONIC_KEYS)] : [],
      roleKey: pick(['user', 'user', 'user', 'doctor', 'admin']),
      status,
      avatarColor: pick(AVATAR_COLORS),
      createdAt: iso(int(1, 350) * DAY),
      lastLoginAt: status === 'pending' ? null : iso(int(1, 30 * 24) * 3600_000),
    })
  }
  return list
}

/* ------------------------------- 食材 ------------------------------- */
type IngRow = [string, Ingredient['category'] | '调味', Ingredient['nature'] | '微温' | '微寒', string[], string, string, number]

/* 四气按「微」归约：微温→温，微寒→寒；调味类并入谷物分类下的药食同源 */
const NATURE_ALIAS: Record<string, Ingredient['nature']> = { 微温: '温', 微寒: '寒', 大寒: '寒', 大热: '热' }
const CATEGORY_ALIAS: Record<string, Ingredient['category']> = { 调味: '药食同源' }

const INGREDIENTS: IngRow[] = [
  ['山药', '药食同源', '平', ['甘'], '脾、肺、肾', '补脾养胃、生津益肺、补肾涩精', 56],
  ['枸杞', '药食同源', '平', ['甘'], '肝、肾', '滋补肝肾、益精明目', 258],
  ['红枣', '药食同源', '温', ['甘'], '脾、胃', '补中益气、养血安神', 276],
  ['茯苓', '药食同源', '平', ['甘', '淡'], '心、肺、脾、肾', '利水渗湿、健脾宁心', 16],
  ['莲子', '药食同源', '平', ['甘', '涩'], '脾、肾、心', '补脾止泻、益肾涩精、养心安神', 344],
  ['百合', '药食同源', '寒', ['甘'], '心、肺', '养阴润肺、清心安神', 166],
  ['黄芪', '药食同源', '微温', ['甘'], '脾、肺', '补气升阳、固表止汗', 0],
  ['陈皮', '药食同源', '温', ['辛', '苦'], '脾、肺', '理气健脾、燥湿化痰', 0],
  ['黑芝麻', '药食同源', '平', ['甘'], '肝、肾、大肠', '补肝肾、益精血、润肠燥', 559],
  ['黄精', '药食同源', '平', ['甘'], '脾、肺、肾', '补气养阴、健脾、润肺、益肾', 0],
  ['山楂', '药食同源', '微温', ['酸', '甘'], '脾、胃、肝', '消食健胃、行气散瘀', 95],
  ['芡实', '药食同源', '平', ['甘', '涩'], '脾、肾', '益肾固精、补脾止泻', 351],
  ['糙米', '谷物', '平', ['甘'], '脾、胃', '健脾养胃、补中益气', 348],
  ['燕麦', '谷物', '平', ['甘'], '脾、胃', '益脾养心、降脂通便', 367],
  ['小米', '谷物', '凉', ['甘', '咸'], '脾、胃、肾', '健脾和胃、补虚安神', 361],
  ['荞麦', '谷物', '凉', ['甘'], '脾、胃、大肠', '开胃宽肠、下气消积', 337],
  ['黑米', '谷物', '温', ['甘'], '脾、胃', '滋阴补肾、健脾暖肝', 341],
  ['薏米', '谷物', '凉', ['甘', '淡'], '脾、胃、肺', '利水渗湿、健脾除痹', 361],
  ['黄豆', '豆类', '平', ['甘'], '脾、大肠', '健脾宽中、润燥消水', 390],
  ['黑豆', '豆类', '平', ['甘'], '脾、肾', '补肾益阴、健脾利湿', 401],
  ['绿豆', '豆类', '寒', ['甘'], '心、胃', '清热解毒、消暑利水', 316],
  ['红豆', '豆类', '平', ['甘', '酸'], '心、小肠', '利水消肿、解毒排脓', 309],
  ['冬瓜', '蔬菜', '凉', ['甘', '淡'], '肺、大肠', '利水消痰、清热解毒', 12],
  ['苦瓜', '蔬菜', '寒', ['苦'], '心、脾、胃', '清暑涤热、明目解毒', 22],
  ['芹菜', '蔬菜', '凉', ['甘', '辛'], '肝、胃', '平肝清热、祛风利湿', 16],
  ['白萝卜', '蔬菜', '凉', ['辛', '甘'], '肺、脾', '下气消食、除痰润肺', 18],
  ['菠菜', '蔬菜', '凉', ['甘'], '胃、大肠', '养血止血、润燥滑肠', 28],
  ['南瓜', '蔬菜', '温', ['甘'], '脾、胃', '补中益气、消炎止痛', 26],
  ['胡萝卜', '蔬菜', '平', ['甘'], '肺、脾', '健脾消食、润肠通便', 41],
  ['木耳', '菌藻', '平', ['甘'], '肺、胃、大肠', '益气强身、滋肾养胃、活血', 205],
  ['香菇', '菌藻', '平', ['甘'], '脾、胃', '扶正补虚、健脾开胃', 34],
  ['海带', '菌藻', '寒', ['咸'], '肝、胃、肾', '软坚散结、消痰利水', 13],
  ['银耳', '菌藻', '平', ['甘', '淡'], '肺、胃、肾', '滋阴润肺、养胃生津', 200],
  ['苹果', '水果', '凉', ['甘'], '脾、肺', '生津润肺、除烦解暑', 52],
  ['雪梨', '水果', '凉', ['甘', '微酸'], '肺、胃', '生津润燥、清热化痰', 51],
  ['乌梅', '水果', '平', ['酸', '涩'], '肝、脾、肺、大肠', '敛肺涩肠、生津安蛔', 219],
  ['乌鸡', '肉类', '平', ['甘'], '肝、肾、肺', '补虚劳羸弱、滋阴清热', 111],
  ['瘦肉', '肉类', '平', ['甘', '咸'], '脾、胃、肾', '补肾养血、滋阴润燥', 143],
  ['羊肉', '肉类', '温', ['甘'], '脾、肾', '温补脾胃、助元阳', 203],
  ['鲤鱼', '水产', '平', ['甘'], '脾、肾', '健脾和胃、利水下气', 109],
  ['鲫鱼', '水产', '平', ['甘'], '脾、胃、大肠', '健脾利湿、和中开胃', 108],
  ['生姜', '调味', '微温', ['辛'], '肺、脾、胃', '解表散寒、温中止呕', 41],
  ['大蒜', '调味', '温', ['辛'], '脾、胃、肺', '温中健胃、消食理气', 128],
  ['菊花', '药食同源', '微寒', ['甘', '苦'], '肺、肝', '散风清热、平肝明目', 0],
  ['玉米须', '药食同源', '平', ['甘'], '肾、肝、胆', '利水消肿、平肝利胆', 0],
]

export function seedIngredients(): Ingredient[] {
  return INGREDIENTS.map(([name, rawCategory, rawNature, flavor, meridian, efficacy, calorie], i) => {
    const category = CATEGORY_ALIAS[rawCategory as string] ?? rawCategory
    const nature = NATURE_ALIAS[rawNature as string] ?? rawNature
    const stock = rand() < 0.1 ? int(0, 8) : int(20, 500)
    return {
      id: `ing_${3000 + i}`,
      name,
      category,
      nature,
      flavor,
      meridian,
      efficacy,
      calorie,
      unit: pick(['克', '克', '千克', '份']),
      stock,
      status: stock === 0 ? 'off' : stock < 10 ? 'low' : 'available',
      updatedAt: iso(int(1, 30) * DAY),
    }
  })
}

/* ------------------------------ 药膳食谱 ----------------------------- */
type RecipeRow = [string, Recipe['category'], Constitution[], ChronicKey[], string, number, number, string[]]

const RECIPES: RecipeRow[] = [
  ['山药薏米芡实粥', '粥品', ['气虚质', '痰湿质'], ['糖尿病', '慢性胃炎'], '健脾祛湿、益气固精', 210, 40, ['山药 50g', '薏米 30g', '芡实 20g', '小米 40g']],
  ['枸杞菊花决明茶', '茶饮', ['阴虚质', '湿热质'], ['高血压', '高血脂'], '平肝明目、清肝降火', 35, 10, ['枸杞 10g', '菊花 5g', '决明子 5g']],
  ['黄芪乌鸡汤', '汤羹', ['气虚质', '阳虚质'], ['慢性胃炎'], '补气固表、温中健脾', 320, 90, ['乌鸡 半只', '黄芪 15g', '红枣 5 枚', '生姜 3 片']],
  ['苦瓜炒木耳', '菜肴', ['痰湿质', '湿热质'], ['糖尿病', '高血脂'], '清热解毒、辅助降糖', 120, 15, ['苦瓜 200g', '木耳 30g', '大蒜 2 瓣']],
  ['冬瓜鲤鱼汤', '汤羹', ['痰湿质', '阳虚质'], ['高血压', '痛风'], '利水消肿、通乳下气', 180, 50, ['鲤鱼 1 条', '冬瓜 300g', '生姜 3 片', '葱白 1 根']],
  ['荷叶山楂荞麦面', '主食', ['痰湿质', '气郁质'], ['高血压', '高血脂'], '消食化积、降脂轻身', 280, 25, ['荞麦面 100g', '荷叶 5g', '山楂 15g']],
  ['百合莲子银耳羹', '汤羹', ['阴虚质', '气郁质'], ['高血压'], '养阴润燥、清心安神', 160, 45, ['银耳 1 朵', '百合 20g', '莲子 20g', '冰糖 适量']],
  ['芹菜炒香菇', '菜肴', ['湿热质', '痰湿质'], ['高血压', '高血脂'], '平肝清热、降压降脂', 130, 12, ['芹菜 200g', '香菇 100g']],
  ['小米南瓜粥', '粥品', ['平和质', '气虚质'], ['慢性胃炎', '糖尿病'], '和胃健脾、补中益气', 190, 30, ['小米 50g', '南瓜 100g']],
  ['黑豆核桃豆浆', '茶饮', ['阴虚质', '血瘀质'], ['高血脂'], '补肾益脑、润肠乌发', 180, 20, ['黑豆 40g', '核桃 15g', '清水 600ml']],
  ['冬瓜排骨汤', '汤羹', ['平和质', '湿热质'], ['痛风'], '清热利水、补中益气', 260, 60, ['排骨 300g', '冬瓜 250g', '姜片 3 片']],
  ['荞麦绿豆糕', '糕点', ['湿热质'], ['糖尿病', '高血脂'], '清热祛湿、健脾开胃', 170, 35, ['荞麦粉 80g', '绿豆 60g', '蜂蜜 适量']],
  ['白萝卜炖羊肉', '菜肴', ['阳虚质', '血瘀质'], ['慢性胃炎'], '温中健脾、散寒理气', 360, 80, ['羊肉 300g', '白萝卜 200g', '陈皮 5g']],
  ['玉米须赤豆饮', '茶饮', ['痰湿质', '湿热质'], ['糖尿病', '痛风'], '利水消肿、辅助排尿酸', 60, 15, ['玉米须 15g', '赤小豆 20g']],
  ['红枣桂圆枸杞粥', '粥品', ['气虚质', '血瘀质'], ['慢性胃炎'], '补血安神、养颜润肤', 240, 40, ['红枣 6 枚', '桂圆 10g', '枸杞 8g', '糙米 50g']],
  ['凉拌苦菊木耳', '菜肴', ['湿热质', '阴虚质'], ['糖尿病', '高血压'], '清肝泻火、降脂清热', 90, 10, ['苦菊 150g', '木耳 30g', '蒜末 适量']],
  ['山楂陈皮茶', '茶饮', ['气郁质', '血瘀质'], ['高血压', '高血脂'], '行气消滞、活血降脂', 45, 12, ['山楂 10g', '陈皮 5g', '甘草 2g']],
  ['山药枸杞蒸鸡', '菜肴', ['气虚质', '阴虚质'], ['糖尿病'], '补脾益气、滋阴养肾', 300, 55, ['鸡腿 2 只', '山药 150g', '枸杞 10g']],
  ['黑米红豆粥', '粥品', ['血瘀质', '阳虚质'], ['高血压'], '活血养心、补血暖身', 230, 45, ['黑米 50g', '红豆 30g', '红糖 适量']],
  ['清蒸鲫鱼豆腐', '菜肴', ['平和质', '气虚质'], ['慢性胃炎', '痛风'], '健脾利湿、和中补虚', 220, 25, ['鲫鱼 1 条', '嫩豆腐 200g', '姜丝 适量']],
  ['薏米冬瓜茶', '茶饮', ['痰湿质'], ['糖尿病', '高血压'], '祛湿消肿、清热利水', 50, 20, ['薏米 30g', '冬瓜皮 20g']],
  ['乌梅冰糖饮', '茶饮', ['阴虚质'], ['痛风'], '生津止渴、敛肺涩肠', 70, 10, ['乌梅 6 颗', '冰糖 适量']],
  ['黄芪红枣小米粥', '粥品', ['气虚质', '阳虚质'], ['慢性胃炎'], '补气健脾、养胃安神', 200, 35, ['黄芪 10g', '红枣 4 枚', '小米 50g']],
  ['银耳雪梨汤', '汤羹', ['阴虚质', '湿热质'], ['高血压'], '润肺清燥、生津止咳', 120, 40, ['银耳 半朵', '雪梨 1 个', '枸杞 5g']],
]

export function seedRecipes(): Recipe[] {
  return RECIPES.map(([name, category, suitedConstitution, suitedChronic, effect, calories, cookTime, items], i) => {
    const views = int(300, 9800)
    return {
      id: `rec_${4000 + i}`,
      name,
      category,
      suitedConstitution,
      suitedChronic,
      effect,
      calories,
      cookTime,
      ingredients: items.map((raw) => {
        const [n, ...rest] = raw.split(' ')
        return { name: n, amount: rest.join(' ') }
      }),
      status: rand() < 0.82 ? 'published' : rand() < 0.55 ? 'draft' : 'offline',
      cover: `linear-gradient(135deg, hsl(${(i * 47 + 120) % 360} 38% 62%), hsl(${(i * 47 + 170) % 360} 42% 48%))`,
      views,
      favorites: Math.round(views * (0.1 + rand() * 0.25)),
      updatedAt: iso(int(1, 40) * DAY),
    }
  })
}

/* ------------------------------ 用餐记录 ----------------------------- */
export function seedMeals(users: User[], recipes: Recipe[]): MealRecord[] {
  const MEALS: MealRecord['mealType'][] = ['早餐', '午餐', '晚餐', '加餐']
  return Array.from({ length: 96 }, (_, i) => {
    const u = pick(users)
    const r = pick(recipes)
    const createdMsAgo = int(0, 40 * 24) * 3600_000 + int(0, 3599) * 1000
    return {
      id: `meal_${6000 + i}`,
      customer: u.name,
      recipeName: r.name,
      mealType: pick(MEALS),
      portion: int(1, 3),
      calories: r.calories * int(1, 2),
      score: int(3, 5),
      note: rand() < 0.22 ? pick(['口感清淡可口', '吃起来很舒服', '稍偏咸', '适合我这种体质']) : '',
      createdAt: new Date(now - createdMsAgo).toISOString(),
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/* ------------------------------ 健康档案 ----------------------------- */
export function seedProfiles(users: User[]): HealthProfile[] {
  return users.slice(0, 30).map((u) => {
    const h = u.gender === '女' ? int(152, 172) : int(163, 183)
    const w = int(48, 92)
    return {
      userId: u.id,
      customer: u.name,
      height: h,
      weight: w,
      bloodSugar: Number((4.6 + rand() * 4.2).toFixed(1)),
      uricAcid: int(240, 520),
      systolic: int(105, 158),
      diastolic: int(65, 98),
      updatedAt: iso(int(1, 20) * DAY),
    }
  })
}

/* ------------------------------ 慢病方案 ----------------------------- */
export function seedChronicPlans(): ChronicPlan[] {
  return [
    {
      key: '糖尿病',
      name: '糖尿病食疗方案',
      icon: '🩸',
      color: '#b8553a',
      summary: '控制总能量、选择低升糖指数食物，主张「少食多餐、粗细搭配」。',
      principles: ['控制总热量，三餐定时定量', '主食粗细搭配，优先低升糖指数', '增加膳食纤维，减少精制糖', '餐后适量活动，监测血糖'],
      recommended: ['荞麦', '燕麦', '苦瓜', '冬瓜', '山药', '黑豆'],
      avoid: ['精制白糖', '糯米制品', '含糖饮料', '油炸食品'],
      users: 1284,
      updatedAt: iso(6 * DAY),
    },
    {
      key: '高血压',
      name: '高血压食疗方案',
      icon: '❤️',
      color: '#a05f8f',
      summary: '低盐低脂、平肝潜阳，推荐富含钾与膳食纤维的食材。',
      principles: ['每日食盐摄入控制在 5g 以内', '多摄入新鲜蔬果补充钾元素', '限制动物脂肪与内脏', '戒烟限酒，保持情绪平稳'],
      recommended: ['芹菜', '木耳', '海带', '山楂', '菊花', '玉米须'],
      avoid: ['腌制咸菜', '肥肉动物油', '浓茶浓咖啡', '高度白酒'],
      users: 1673,
      updatedAt: iso(3 * DAY),
    },
    {
      key: '高血脂',
      name: '高血脂食疗方案',
      icon: '🫀',
      color: '#c98a2b',
      summary: '控制油脂摄入总量，增加不饱和脂肪酸与植物甾醇来源。',
      principles: ['控制每日烹调油用量', '多吃杂豆、燕麦等可溶性膳食纤维', '每周吃鱼 2 次以上', '避免暴饮暴食与夜宵'],
      recommended: ['燕麦', '黑豆', '山楂', '香菇', '深海鱼', '荞麦'],
      avoid: ['动物内脏', '蛋黄过量', '油炸食品', '奶油糕点'],
      users: 1421,
      updatedAt: iso(8 * DAY),
    },
    {
      key: '慢性胃炎',
      name: '慢性胃炎食疗方案',
      icon: '🍵',
      color: '#6f7f3a',
      summary: '以「温、软、淡、鲜」为原则，忌生冷辛辣，细嚼慢咽。',
      principles: ['定时定量，少食多餐', '食物宜温软易消化', '避免生冷、过烫与辛辣刺激', '情绪舒畅，忌空腹饮浓茶'],
      recommended: ['小米', '山药', '南瓜', '猴头菇', '鲫鱼', '红枣'],
      avoid: ['辣椒', '冰镇饮品', '酸辣生蒜', '浓茶咖啡'],
      users: 986,
      updatedAt: iso(11 * DAY),
    },
    {
      key: '痛风',
      name: '痛风食疗方案',
      icon: '🦶',
      color: '#4a7fb5',
      summary: '低嘌呤饮食，足量饮水促进尿酸排泄，限制动物内脏与海鲜。',
      principles: ['每日饮水 2000ml 以上', '选择低嘌呤食材', '限制动物内脏、浓肉汤与部分海产', '严格戒酒，尤其啤酒'],
      recommended: ['冬瓜', '薏米', '玉米须', '芹菜', '白菜', '番茄'],
      avoid: ['动物内脏', '浓肉汤', '啤酒', '沙丁鱼等高嘌呤海鲜'],
      users: 742,
      updatedAt: iso(15 * DAY),
    },
  ]
}

/* ------------------------------- 设置 ------------------------------- */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  compact: false,
  pageSize: 10,
  autoRefresh: false,
  defaultLanding: '/dashboard',
}

/* ------------------------------ 趋势数据 ----------------------------- */
export function buildTrend(): { date: string; meals: number; users: number }[] {
  const base = [42, 51, 48, 64, 59, 73, 81, 68, 78, 86, 92, 84, 100, 108]
  return base.map((v, i) => {
    const d = new Date(now - (base.length - 1 - i) * DAY)
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      meals: Math.round(v * 9 + rand() * 60),
      users: Math.round(v * 2.4 + rand() * 20),
    }
  })
}
