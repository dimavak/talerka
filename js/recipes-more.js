// Дададзеная база страў (R3): польская хатняя кухня і простыя здаровыя стравы з тых жа прадуктаў.
// Фармат той жа, што ў templates.js. pl — польская назва (пошук рэцэпта на NCEZ і Diety NFZ),
// src — адкуль ідэя: 'pl' — класічная польская хатняя страва ў лёгкім варыянце, 'own' — свая.
// Тэксты рэцэптаў напісаныя намі; чужыя рэцэпты не капіруюцца, на сайты даюцца толькі спасылкі.
import { POULTRY, VEG_RAW, GRAIN, FRUIT, NUTS, BREAD } from './recipe-parts.js';

const SOUP_VEG = ['carrot', 'celery', 'onion', 'leek', 'potato', 'frozen_veg'];
const SALAD_RAW = ['cucumber', 'tomato', 'radish', 'lettuce', 'rocket', 'greens', 'pepper'];

export const MORE_TEMPLATES = [
  // ── Сняданкі ──
  {
    id: 'b-twarozek', meal: ['breakfast', 'dinner'], title: 'Тварог з зялёнай цыбуляй і радыскай на хлебе', pl: 'twarożek ze szczypiorem i rzodkiewką', src: 'pl',
    slots: [
      { role: 'protein', opts: ['quark', 'cottage', 'cream_cheese'], g: 150, req: true },
      { role: 'veg', opts: ['radish', 'greens', 'cucumber', 'tomato', 'pepper'], g: 120, req: true, pick: 2 },
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'sauce', opts: ['yogurt', 'kefir'], g: 30 },
    ],
    methods: [{ equip: 'none', total: 7, active: 7, pots: 1, steps: ['Тварог разамніце відэльцам з лыжкай ёгурту, соль, перац.', 'Дадайце дробна нарэзаную радыску і зеляніну.', 'Намажце на хлеб, побач гародніна.'] }],
    portable: true,
  },
  {
    id: 'b-jaglanka', meal: ['breakfast'], title: 'Пшонная каша з садавінай', pl: 'jaglanka z owocami', src: 'pl',
    slots: [
      { role: 'base', opts: ['millet'], g: 50, req: true },
      { role: 'protein', opts: ['milk', 'skyr', 'yogurt', 'kefir'], g: 200, req: true },
      { role: 'fruit', opts: FRUIT, g: 120, req: true, pick: 2 },
      { role: 'extra', opts: ['skyr', 'cottage', 'quark'], g: 100 },
      { role: 'texture', opts: NUTS, g: 20 },
    ],
    methods: [
      { equip: 'stove', total: 20, active: 5, pots: 1, steps: ['Пшано прамыйце гарачай вадой.', 'Варыце ў малацэ 15 хвілін на малым агні, памешвайце.', 'Зверху садавіна і арэхі.'] },
      { equip: 'microwave', total: 12, active: 3, pots: 1, note: 'калі пшано зварана загадзя', steps: ['Зваранае пшано з малаком — 2 хвіліны ў мікрахвалёўцы.', 'Зверху садавіна і арэхі.'] },
    ],
    portable: true,
  },
  {
    id: 'b-oat-omelette', meal: ['breakfast'], title: 'Аўсяны амлет з садавінай', pl: 'omlet owsiany z owocami', src: 'pl',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'base', opts: ['oats'], g: 30, req: true },
      { role: 'fruit', opts: ['banana', 'blueberries', 'apple', 'berries_fresh', 'pear'], g: 120, req: true },
      { role: 'sauce', opts: ['skyr', 'yogurt', 'cottage'], g: 80 },
    ],
    methods: [{ equip: 'stove', total: 12, active: 10, pots: 1, steps: ['Узбіце яйкі з аўсянымі шматкамі і лыжкай малака.', 'Смажце пад накрыўкай на малым агні 5–6 хвілін.', 'Зверху садавіна і лыжка ёгурту.'] }],
  },
  {
    id: 'b-egg-paste', meal: ['breakfast'], title: 'Яечная паста з хлебам і гароднінай', pl: 'pasta jajeczna ze szczypiorem', src: 'pl',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr', 'cream_cheese'], g: 40, req: true },
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'veg', opts: ['greens', 'radish', 'cucumber', 'tomato', 'pepper', 'pickles'], g: 120, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 15, active: 5, pots: 1, note: 'яйкі можна зварыць з вечара', steps: ['Зварыце яйкі ўкрутую, 9 хвілін.', 'Здрабніце відэльцам з ёгуртам, гарчыцай і зелянінай.', 'Намажце на хлеб, побач гародніна.'] }],
    portable: true,
  },
  {
    id: 'b-fish-paste', meal: ['breakfast', 'dinner'], title: 'Паста з рыбы на хлеб', pl: 'pasta z makreli i twarogu', src: 'pl',
    slots: [
      { role: 'protein', opts: ['mackerel', 'tuna', 'smoked_salmon', 'smoked_trout', 'sprats'], g: 80, req: true },
      { role: 'extra', opts: ['quark', 'cottage', 'cream_cheese', 'eggs'], g: 60, req: true },
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'veg', opts: ['pickles', 'cucumber', 'greens', 'radish', 'tomato', 'onion'], g: 120, req: true, pick: 2 },
    ],
    methods: [{ equip: 'none', total: 8, active: 8, pots: 1, steps: ['Рыбу без касцей разамніце з тварагом.', 'Дадайце дробна нарэзаныя агуркі ці цыбулю, лімонны сок.', 'Намажце на хлеб.'] }],
    portable: true,
  },
  {
    id: 'b-yogurt-bowl', meal: ['breakfast'], title: 'Ёгурт з аўсянкай, садавінай і насеннем', pl: 'jogurt z płatkami, owocami i pestkami', src: 'own',
    slots: [
      { role: 'protein', opts: ['skyr', 'yogurt', 'cottage', 'kefir'], g: 250, req: true },
      { role: 'base', opts: ['oats'], g: 30, req: true },
      { role: 'fruit', opts: FRUIT, g: 120, req: true, pick: 2 },
      { role: 'texture', opts: ['seeds', 'walnut', 'pistachio'], g: 15 },
    ],
    methods: [{ equip: 'none', total: 3, active: 3, pots: 1, steps: ['Ёгурт у міску, зверху шматкі.', 'Садавіна і насенне.'] }],
    portable: true,
  },
  {
    id: 'b-bean-paste', meal: ['breakfast', 'lunch'], title: 'Паста з фасолі ці нуту на хлеб', pl: 'pasta z fasoli na kanapki', src: 'pl',
    slots: [
      { role: 'protein', opts: ['beans', 'chickpeas', 'lentils'], g: 120, req: true },
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'veg', opts: VEG_RAW, g: 120, req: true, pick: 2 },
      { role: 'extra', opts: ['eggs', 'feta', 'cottage'], g: 50 },
    ],
    methods: [{ equip: 'none', total: 8, active: 8, pots: 1, steps: ['Фасолю з бляшанкі прамыйце.', 'Разамніце відэльцам з часныком, лімонным сокам і лыжкай алею.', 'Намажце на хлеб, зверху гародніна.'] }],
    portable: true,
  },
  {
    id: 'b-soft-eggs', meal: ['breakfast'], title: 'Яйкі ўсмятку з хлебам і гароднінай', pl: 'jajka na miękko z pieczywem i warzywami', src: 'pl',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'veg', opts: VEG_RAW, g: 150, req: true, pick: 2 },
      { role: 'extra', opts: ['cottage', 'quark', 'hard_cheese'], g: 60 },
    ],
    methods: [{ equip: 'stove', total: 8, active: 3, pots: 1, steps: ['Яйкі ў кіпень на 5 хвілін.', 'Пакуль варацца, нарэжце гародніну і хлеб.'] }],
  },
  {
    id: 'b-banana-pancakes', meal: ['breakfast'], title: 'Бананавыя аладкі з аўсянкі', pl: 'placuszki bananowe owsiane', src: 'own',
    slots: [
      { role: 'fruit', opts: ['banana'], g: 100, req: true },
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'base', opts: ['oats'], g: 40, req: true },
      { role: 'sauce', opts: ['skyr', 'yogurt', 'cottage'], g: 100 },
      { role: 'extra', opts: ['blueberries', 'berries_fresh', 'apple', 'mandarin'], g: 80 },
    ],
    methods: [{ equip: 'stove', total: 15, active: 12, pots: 2, steps: ['Банан разамніце, змяшайце з яйкамі і шматкамі.', 'Смажце невялікія аладкі на сухой ці злёгку змазанай патэльні, па 2 хвіліны з боку.', 'Падайце з ёгуртам і ягадамі.'] }],
  },
  {
    id: 'b-cottage-veg', meal: ['breakfast', 'dinner'], title: 'Вясковы сырок з гароднінай і хлебам', pl: 'serek wiejski z warzywami', src: 'pl',
    slots: [
      { role: 'protein', opts: ['cottage', 'quark'], g: 200, req: true },
      { role: 'veg', opts: SALAD_RAW, g: 150, req: true, pick: 3 },
      { role: 'base', opts: BREAD, g: 60 },
      { role: 'texture', opts: ['seeds', 'walnut'], g: 15 },
    ],
    methods: [{ equip: 'none', total: 5, active: 5, pots: 1, steps: ['Нарэжце гародніну, змяшайце з сырком.', 'Соль, перац, насенне зверху. Побач хлеб.'] }],
    portable: true,
  },

  // ── Супы ──
  {
    id: 's-tomato-beans', meal: ['lunch', 'dinner'], title: 'Таматны суп з фасоляй', pl: 'zupa pomidorowa z fasolą', src: 'pl',
    slots: [
      { role: 'sauce', opts: ['tomato_passata', 'tomato'], g: 200, req: true },
      { role: 'protein', opts: ['beans', 'chickpeas', 'lentils'], g: 160, req: true },
      { role: 'veg', opts: SOUP_VEG, g: 150, req: true, pick: 2 },
      { role: 'base', opts: ['brown_rice', 'barley', 'buckwheat', 'wholemeal_pasta', 'rice'], g: 30 },
      { role: 'texture', opts: ['yogurt', 'greens'], g: 30 },
    ],
    methods: [
      { equip: 'stove', total: 30, active: 10, pots: 1, steps: ['Абсмажце цыбулю і моркву 5 хвілін.', 'Дадайце памідоры, ваду, крупы — варыце 15 хвілін.', 'Фасоля на апошнія 5 хвілін. Падайце з ёгуртам і зелянінай.'] },
      { equip: 'multicooker', total: 40, active: 7, pots: 1, steps: ['Усё, акрамя ёгурту, у мультыварку, рэжым «суп» 30 хвілін.', 'Падайце з ёгуртам і зелянінай.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 's-krupnik', meal: ['lunch', 'dinner'], title: 'Крупнік з пярлоўкай і індычкай', pl: 'krupnik z kaszą jęczmienną', src: 'pl',
    slots: [
      { role: 'base', opts: ['barley', 'buckwheat'], g: 40, req: true },
      { role: 'protein', opts: ['turkey', 'chicken_thigh', 'chicken_breast'], g: 120, req: true },
      { role: 'veg', opts: SOUP_VEG, g: 200, req: true, pick: 3 },
      { role: 'texture', opts: ['greens'], g: 10 },
    ],
    methods: [{ equip: 'stove', total: 45, active: 10, pots: 1, steps: ['Мяса заліце вадой, давядзіце да кіпення, здыміце пену.', 'Дадайце пярлоўку і нарэзаную гародніну, варыце 35 хвілін.', 'Соль, перац, зеляніна.'] }],
    portable: true, batch: true,
  },
  {
    id: 's-ogorkowa', meal: ['lunch', 'dinner'], title: 'Суп з салёных агуркоў', pl: 'zupa ogórkowa', src: 'pl',
    slots: [
      { role: 'veg', opts: ['pickles'], g: 80, req: true },
      { role: 'base', opts: ['potato'], g: 150, req: true },
      { role: 'protein', opts: ['chicken_thigh', 'turkey', 'chicken_breast', 'beans'], g: 120, req: true },
      { role: 'extra', opts: ['carrot', 'celery', 'leek', 'onion'], g: 100, req: true, pick: 2 },
      { role: 'texture', opts: ['yogurt', 'greens'], g: 30 },
    ],
    methods: [{ equip: 'stove', total: 40, active: 10, pots: 1, steps: ['Мяса і гародніну заліце вадой, варыце 20 хвілін.', 'Дадайце бульбу кубікамі, яшчэ 10 хвілін.', 'Агуркі на буйной тарцы — на апошнія 5 хвілін. Падайце з ёгуртам і кропам.'] }],
    portable: true, batch: true,
  },
  {
    id: 's-kapusniak', meal: ['lunch', 'dinner'], title: 'Капуснік з квашанай капусты', pl: 'kapuśniak z kiszonej kapusty', src: 'pl',
    slots: [
      { role: 'veg', opts: ['sauerkraut'], g: 120, req: true },
      { role: 'base', opts: ['potato'], g: 150, req: true },
      { role: 'protein', opts: ['beans', 'chicken_thigh', 'turkey', 'pork'], g: 150, req: true },
      { role: 'extra', opts: ['carrot', 'onion', 'celery', 'leek'], g: 100, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 45, active: 10, pots: 1, steps: ['Абсмажце цыбулю і моркву.', 'Дадайце капусту, мяса, ваду — варыце 25 хвілін.', 'Бульба кубікамі яшчэ на 15 хвілін (фасоля — на апошнія 5). Перац, лаўровы ліст.'] }],
    portable: true, batch: true,
  },
  {
    id: 's-pumpkin', meal: ['lunch', 'dinner'], title: 'Крэм-суп з гарбуза з нутам', pl: 'zupa krem z dyni z ciecierzycą', src: 'own',
    slots: [
      { role: 'veg', opts: ['pumpkin', 'carrot'], g: 250, req: true },
      { role: 'protein', opts: ['chickpeas', 'lentils', 'beans'], g: 160, req: true },
      { role: 'extra', opts: ['onion', 'leek', 'potato'], g: 80 },
      { role: 'texture', opts: ['seeds', 'yogurt'], g: 25 },
    ],
    methods: [{ equip: 'stove', total: 30, active: 8, pots: 1, steps: ['Гарбуз і цыбулю кубікамі заліце вадой, варыце 20 хвілін.', 'Збіце блэндэрам або разамніце таўкачыкам, дадайце нут.', 'Зверху насенне ці ёгурт.'] }],
    portable: true, batch: true,
  },
  {
    id: 's-vegetable', meal: ['lunch', 'dinner'], title: 'Гароднінавы суп з курыцай', pl: 'zupa jarzynowa z kurczakiem', src: 'pl',
    slots: [
      { role: 'protein', opts: POULTRY, g: 120, req: true },
      { role: 'veg', opts: ['frozen_veg', 'broccoli', 'cauliflower', 'carrot', 'peas', 'zucchini', 'leek'], g: 200, req: true, pick: 2 },
      { role: 'base', opts: ['potato', 'barley', 'brown_rice'], g: 120, req: true },
      { role: 'texture', opts: ['greens', 'yogurt'], g: 20 },
    ],
    methods: [
      { equip: 'stove', total: 35, active: 8, pots: 1, steps: ['Мяса заліце вадой, варыце 15 хвілін.', 'Дадайце бульбу і гародніну, яшчэ 15 хвілін.', 'Соль, перац, зеляніна.'] },
      { equip: 'multicooker', total: 45, active: 5, pots: 1, steps: ['Усё ў мультыварку, рэжым «суп» 40 хвілін.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 's-borscht', meal: ['lunch', 'dinner'], title: 'Боршч з фасоляй', pl: 'barszcz czerwony z fasolą', src: 'pl',
    slots: [
      { role: 'veg', opts: ['beet'], g: 150, req: true },
      { role: 'protein', opts: ['beans', 'lentils'], g: 160, req: true },
      { role: 'extra', opts: ['cabbage', 'carrot', 'potato', 'onion', 'tomato_passata'], g: 150, req: true, pick: 3 },
      { role: 'texture', opts: ['yogurt', 'greens'], g: 30 },
    ],
    methods: [{ equip: 'stove', total: 45, active: 12, pots: 1, steps: ['Буракі і моркву на буйной тарцы, абсмажце з цыбуляй 5 хвілін.', 'Заліце вадой, дадайце бульбу і капусту, варыце 25 хвілін.', 'Фасоля і лыжка воцату ці лімоннага соку — на апошнія 5 хвілін. Падайце з ёгуртам.'] }],
    portable: true, batch: true,
  },

  // ── Абеды і вячэры ──
  {
    id: 'm-leczo', meal: ['lunch', 'dinner'], title: 'Лечо з перцу і цукіні з індычкай ці фасоляй', pl: 'leczo z cukinii i papryki', src: 'pl',
    slots: [
      { role: 'veg', opts: ['pepper', 'zucchini', 'onion', 'tomato'], g: 280, req: true, pick: 3 },
      { role: 'protein', opts: ['turkey', 'chicken_breast', 'beans', 'chickpeas'], g: 130, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 100 },
      { role: 'base', opts: ['buckwheat', 'brown_rice', 'millet', 'wholemeal_bread'], g: 60 },
    ],
    methods: [{ equip: 'stove', total: 30, active: 12, pots: 2, steps: ['Мяса кубікамі абсмажце 5 хвілін (фасолю дадайце пазней).', 'Цыбуля, перац, цукіні — яшчэ 5 хвілін.', 'Памідоры і салодкая папрыка, тушыце 15 хвілін. Падайце з крупамі.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-lazy-golabki', meal: ['lunch', 'dinner'], title: 'Лянівыя галубцы', pl: 'gołąbki leniwe', src: 'pl',
    slots: [
      { role: 'protein', opts: ['minced_meat', 'turkey', 'lentils'], g: 120, req: true },
      { role: 'veg', opts: ['cabbage', 'sauerkraut'], g: 200, req: true },
      { role: 'base', opts: ['brown_rice', 'buckwheat', 'rice', 'millet'], g: 40, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 100, req: true },
      { role: 'extra', opts: ['onion', 'carrot'], g: 50 },
    ],
    methods: [
      { equip: 'oven', total: 50, active: 15, pots: 2, steps: ['Капусту дробна нашынкуйце і ашпарце кіпенем.', 'Змяшайце з фаршам, сырымі крупамі, цыбуляй і яйкам, сфармуйце катлеткі.', 'У форму, заліце таматным соусам, 35 хвілін пры 190°.'] },
      { equip: 'stove', total: 45, active: 15, pots: 1, steps: ['Капусту дробна нашынкуйце і ашпарце кіпенем.', 'Змяшайце з фаршам і крупамі, сфармуйце катлеткі, абсмажце.', 'Заліце таматным соусам з вадой, тушыце 30 хвілін.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 'm-zucchini-fritters', meal: ['lunch', 'dinner'], title: 'Аладкі з цукіні з ёгуртавым соусам', pl: 'placki z cukinii', src: 'pl',
    slots: [
      { role: 'veg', opts: ['zucchini'], g: 250, req: true },
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'base', opts: ['oats'], g: 30, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr'], g: 100, req: true },
      { role: 'extra', opts: ['feta', 'hard_cheese', 'smoked_salmon'], g: 40 },
      { role: 'texture', opts: ['greens', 'tomato', 'lettuce'], g: 80 },
    ],
    methods: [{ equip: 'stove', total: 25, active: 20, pots: 2, steps: ['Цукіні на буйной тарцы, пасаліце і адцісніце сок праз 5 хвілін.', 'Змяшайце з яйкамі, шматкамі і сырам.', 'Смажце аладкі па 3 хвіліны з боку. Падайце з ёгуртам з часныком.'] }],
  },
  {
    id: 'm-buckwheat-goulash', meal: ['lunch', 'dinner'], title: 'Грэчка з гуляшом з індычкі', pl: 'kasza gryczana z gulaszem z indyka', src: 'pl',
    slots: [
      { role: 'protein', opts: ['turkey', 'chicken_thigh', 'pork', 'beef'], g: 130, req: true },
      { role: 'base', opts: ['buckwheat', 'barley', 'millet'], g: 60, req: true },
      { role: 'veg', opts: ['pepper', 'onion', 'carrot', 'mushrooms'], g: 150, req: true, pick: 2 },
      { role: 'extra', opts: ['pickles', 'cucumber', 'beet', 'sauerkraut', 'cabbage'], g: 100, req: true },
    ],
    methods: [
      { equip: 'stove', total: 40, active: 12, pots: 2, steps: ['Мяса кубікамі абсмажце, дадайце цыбулю, перац, салодкую папрыку.', 'Заліце вадой, тушыце 25 хвілін.', 'Тым часам зварыце грэчку. Падайце з салёным агурком ці салатай.'] },
      { equip: 'multicooker', total: 50, active: 8, pots: 1, steps: ['Мяса і гародніна ў мультыварку, рэжым «тушэнне» 40 хвілін.', 'Падайце з грэчкай і агурком.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 'm-salmon-grain', meal: ['dinner', 'lunch'], title: 'Ласось з крупамі і салатай з морквы', pl: 'łosoś pieczony z kaszą i surówką z marchewki', src: 'pl',
    slots: [
      { role: 'protein', opts: ['salmon', 'mackerel', 'cod'], g: 130, req: true },
      { role: 'base', opts: GRAIN, g: 60, req: true },
      { role: 'veg', opts: ['carrot', 'cabbage', 'apple', 'sauerkraut', 'beet'], g: 180, req: true, pick: 2 },
    ],
    methods: [
      { equip: 'oven', total: 25, active: 10, pots: 2, steps: ['Рыбу на бляху, соль, лімон, 15 хвілін пры 200°.', 'Тым часам зварыце крупы.', 'Морква і яблык на тарцы, лімонны сок і лыжка алею.'] },
      { equip: 'microwave', total: 20, active: 10, pots: 2, steps: ['Рыбу ў закрытай пасудзіне, рэжым «рыба/мяса» 6–7 хвілін.', 'Крупы зварыце на пліце ці ў мікрахвалёўцы.', 'Салата з морквы і яблыка.'] },
    ],
  },
  {
    id: 'm-ryba-po-grecku', meal: ['dinner', 'lunch'], title: 'Рыба па-грэцку', pl: 'ryba po grecku', src: 'pl',
    slots: [
      { role: 'protein', opts: ['cod', 'mackerel', 'salmon'], g: 140, req: true },
      { role: 'veg', opts: ['carrot', 'celery', 'onion', 'leek'], g: 180, req: true, pick: 3 },
      { role: 'sauce', opts: ['tomato_passata'], g: 80, req: true },
      { role: 'base', opts: ['potato', 'wholemeal_bread', 'buckwheat'], g: 150 },
    ],
    methods: [{ equip: 'stove', total: 35, active: 15, pots: 2, steps: ['Рыбу запячыце ці абсмажце па 3 хвіліны з боку.', 'Моркву і салеру на тарцы тушыце з цыбуляй і памідорамі 15 хвілін.', 'Заліце рыбу гароднінай. Смачна і халоднай на наступны дзень.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-cod-sauerkraut', meal: ['dinner', 'lunch'], title: 'Трэска з бульбай і салатай з квашанай капусты', pl: 'dorsz z ziemniakami i surówką z kiszonej kapusty', src: 'pl',
    slots: [
      { role: 'protein', opts: ['cod', 'mackerel', 'salmon'], g: 140, req: true },
      { role: 'base', opts: ['potato'], g: 220, req: true },
      { role: 'veg', opts: ['sauerkraut', 'carrot', 'apple', 'onion', 'cabbage'], g: 180, req: true, pick: 3 },
    ],
    methods: [
      { equip: 'oven', total: 35, active: 10, pots: 1, steps: ['Бульба дзелькамі 15 хвілін пры 200°.', 'Дадайце рыбу, яшчэ 15 хвілін.', 'Квашаную капусту змяшайце з морквай, яблыкам і лыжкай алею.'] },
      { equip: 'microwave', total: 20, active: 8, pots: 2, steps: ['Бульба ў мундзіры 8 хвілін, рыба ў закрытай пасудзіне 6 хвілін.', 'Салата з квашанай капусты, морквы і яблыка.'] },
    ],
  },
  {
    id: 'm-turkey-meatballs', meal: ['lunch', 'dinner'], title: 'Тэфтэлі з індычкі ў таматным соусе', pl: 'pulpety z indyka w sosie pomidorowym', src: 'pl',
    slots: [
      { role: 'protein', opts: ['turkey', 'minced_meat', 'chicken_breast'], g: 130, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 120, req: true },
      { role: 'base', opts: ['buckwheat', 'wholemeal_pasta', 'brown_rice', 'millet', 'potato'], g: 60, req: true },
      { role: 'veg', opts: ['carrot', 'zucchini', 'spinach', 'onion', 'frozen_veg'], g: 150, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 35, active: 15, pots: 2, steps: ['Фарш з цыбуляй і лыжкай шматкоў — сфармуйце шарыкі.', 'Абсмажце, дадайце гародніну і памідоры, тушыце 20 хвілін.', 'Падайце з крупамі ці макаронам.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-lentil-bolognese', meal: ['lunch', 'dinner'], title: 'Макарон з сачавіцай па-баланьску', pl: 'makaron pełnoziarnisty z soczewicą po bolońsku', src: 'own',
    slots: [
      { role: 'base', opts: ['wholemeal_pasta', 'pasta'], g: 70, req: true },
      { role: 'protein', opts: ['lentils'], g: 100, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 150, req: true },
      { role: 'veg', opts: ['carrot', 'onion', 'celery', 'zucchini', 'mushrooms'], g: 150, req: true, pick: 2 },
      { role: 'texture', opts: ['hard_cheese'], g: 15 },
    ],
    methods: [{ equip: 'stove', total: 30, active: 12, pots: 2, steps: ['Цыбулю і моркву дробна, абсмажце 5 хвілін.', 'Дадайце сачавіцу, памідоры і шклянку вады, тушыце 20 хвілін.', 'Тым часам зварыце макарон. Зверху трохі сыру.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-spinach-pasta', meal: ['lunch', 'dinner'], title: 'Макарон са шпінатам, брынзай і нутам', pl: 'makaron ze szpinakiem, fetą i ciecierzycą', src: 'own',
    slots: [
      { role: 'base', opts: ['wholemeal_pasta', 'pasta'], g: 70, req: true },
      { role: 'veg', opts: ['spinach', 'tomato', 'zucchini', 'broccoli'], g: 180, req: true, pick: 2 },
      { role: 'protein', opts: ['chickpeas', 'beans'], g: 100, req: true },
      { role: 'texture', opts: ['feta', 'goat_cheese', 'hard_cheese'], g: 40, req: true },
    ],
    methods: [{ equip: 'stove', total: 20, active: 10, pots: 2, steps: ['Зварыце макарон.', 'На патэльні часнок, нут і шпінат — 3 хвіліны.', 'Змяшайце з макаронам, зверху брынза.'] }],
    portable: true,
  },
  {
    id: 'm-bulgur-salad', meal: ['lunch'], title: 'Салата з булгурам, нутам і гароднінай', pl: 'sałatka z kaszą bulgur i ciecierzycą', src: 'own',
    slots: [
      { role: 'base', opts: ['bulgur', 'buckwheat', 'millet', 'brown_rice'], g: 60, req: true },
      { role: 'protein', opts: ['chickpeas', 'beans', 'lentils'], g: 150, req: true },
      { role: 'veg', opts: SALAD_RAW, g: 200, req: true, pick: 3 },
      { role: 'texture', opts: ['feta', 'seeds', 'walnut'], g: 30 },
    ],
    methods: [{ equip: 'none', total: 15, active: 8, pots: 1, steps: ['Булгур заліце кіпенем на 10 хвілін (іншыя крупы — зварыце).', 'Нарэжце гародніну, дадайце нут і зеляніну.', 'Лімонны сок, алей, соль.'] }],
    portable: true,
  },
  {
    id: 'm-tuna-salad', meal: ['lunch', 'dinner'], title: 'Салата з тунцом, фасоляй і яйкам', pl: 'sałatka z tuńczykiem, fasolą i jajkiem', src: 'own',
    slots: [
      { role: 'protein', opts: ['tuna', 'mackerel', 'sprats', 'smoked_salmon'], g: 80, req: true },
      { role: 'extra', opts: ['beans', 'chickpeas'], g: 100, req: true },
      { role: 'texture', opts: ['eggs'], g: 55 },
      { role: 'veg', opts: SALAD_RAW, g: 200, req: true, pick: 3 },
      { role: 'base', opts: BREAD, g: 50 },
    ],
    methods: [{ equip: 'none', total: 10, active: 10, pots: 1, note: 'яйка — зваранае загадзя', steps: ['Нарэжце гародніну, дадайце прамытую фасолю.', 'Зверху тунец і палоўкі яйка.', 'Лімонны сок, алей, гарчыца.'] }],
    portable: true,
  },
  {
    id: 'm-olivier-light', meal: ['lunch', 'dinner'], title: 'Лёгкая гароднінавая салата на ёгурце', pl: 'sałatka jarzynowa z jogurtem', src: 'pl',
    slots: [
      { role: 'base', opts: ['potato'], g: 150, req: true },
      { role: 'veg', opts: ['carrot', 'peas', 'pickles', 'apple', 'onion', 'celery'], g: 180, req: true, pick: 3 },
      { role: 'protein', opts: ['eggs', 'chicken_breast', 'turkey'], g: 110, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr'], g: 70, req: true },
    ],
    methods: [{ equip: 'stove', total: 35, active: 15, pots: 2, note: 'бульбу і яйкі можна зварыць з вечара', steps: ['Зварыце бульбу, моркву і яйкі.', 'Усё кубікамі, дадайце агуркі і гарошак.', 'Запраўце ёгуртам з гарчыцай замест маянэзу.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-lentil-patties', meal: ['lunch', 'dinner'], title: 'Катлеты з сачавіцы ў духоўцы', pl: 'kotlety z soczewicy pieczone', src: 'own',
    slots: [
      { role: 'protein', opts: ['lentils', 'chickpeas', 'beans'], g: 130, req: true },
      { role: 'extra', opts: ['eggs'], g: 30 },
      { role: 'base', opts: ['oats'], g: 20, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr'], g: 60 },
      { role: 'veg', opts: SALAD_RAW, g: 180, req: true, pick: 2 },
    ],
    methods: [{ equip: 'oven', total: 40, active: 15, pots: 2, steps: ['Звараную сачавіцу разамніце з яйкам, шматкамі, цыбуляй і спецыямі.', 'Сфармуйце катлеты, на бляху — 25 хвілін пры 200°, перавярніце на паўдарозе.', 'Падайце з ёгуртам і салатай.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-chickpea-curry', meal: ['lunch', 'dinner'], title: 'Нут з гароднінай у таматным соусе', pl: 'gulasz z ciecierzycy z warzywami', src: 'own',
    slots: [
      { role: 'protein', opts: ['chickpeas', 'lentils', 'beans'], g: 160, req: true },
      { role: 'veg', opts: ['spinach', 'cauliflower', 'pepper', 'zucchini', 'pumpkin', 'frozen_veg', 'onion'], g: 200, req: true, pick: 2 },
      { role: 'sauce', opts: ['tomato_passata'], g: 120, req: true },
      { role: 'base', opts: ['brown_rice', 'bulgur', 'millet', 'rice'], g: 50 },
      { role: 'texture', opts: ['yogurt'], g: 50 },
    ],
    methods: [{ equip: 'stove', total: 25, active: 10, pots: 2, steps: ['Цыбуля з часныком і спецыямі (кмен, куркума) 3 хвіліны.', 'Гародніна, нут, памідоры — тушыце 15 хвілін.', 'Падайце з рысам і лыжкай ёгурту.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-turkey-millet', meal: ['lunch', 'dinner'], title: 'Індычка з пшаном і брокалі', pl: 'indyk z kaszą jaglaną i brokułem', src: 'own',
    slots: [
      { role: 'protein', opts: ['turkey', 'chicken_breast'], g: 130, req: true },
      { role: 'base', opts: ['millet', 'buckwheat', 'bulgur'], g: 60, req: true },
      { role: 'veg', opts: ['broccoli', 'cauliflower', 'frozen_veg', 'carrot'], g: 200, req: true },
      { role: 'sauce', opts: ['yogurt'], g: 50 },
    ],
    methods: [
      { equip: 'stove', total: 25, active: 12, pots: 2, steps: ['Зварыце пшано, 15 хвілін.', 'Індычку палоскамі абсмажце 6 хвілін, брокалі — на пару ці ў той жа патэльні пад накрыўкай.', 'Падайце з ёгуртам з часныком.'] },
      { equip: 'microwave', total: 20, active: 8, pots: 2, steps: ['Брокалі і індычку ў закрытай пасудзіне, рэжым «гародніна/мяса» 8 хвілін.', 'Пшано зварыце на пліце.'] },
    ],
    portable: true,
  },
  {
    id: 'm-herring-potato', meal: ['dinner'], title: 'Селядзец з бульбай і салатай', pl: 'śledź z ziemniakami w mundurkach', src: 'pl',
    slots: [
      { role: 'protein', opts: ['herring', 'mackerel', 'sprats'], g: 100, req: true },
      { role: 'base', opts: ['potato'], g: 220, req: true },
      { role: 'veg', opts: ['onion', 'apple', 'cucumber', 'beet', 'greens', 'pickles'], g: 180, req: true, pick: 3 },
      { role: 'sauce', opts: ['yogurt', 'kefir'], g: 60 },
    ],
    methods: [{ equip: 'microwave', total: 12, active: 5, pots: 1, steps: ['Бульба ў мундзіры ў мікрахвалёўцы, 8–10 хвілін.', 'Селядзец з цыбуляй і яблыкам, лыжка ёгурту.', 'Побач буракі ці агурок.'] }],
  },
  {
    id: 'm-beans-tomato', meal: ['lunch', 'dinner'], title: 'Фасоля ў таматным соусе з гароднінай', pl: 'fasolka w sosie pomidorowym z warzywami', src: 'pl',
    slots: [
      { role: 'protein', opts: ['beans', 'chickpeas'], g: 150, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 120, req: true },
      { role: 'veg', opts: ['onion', 'carrot', 'pepper', 'zucchini'], g: 150, req: true, pick: 2 },
      { role: 'base', opts: ['wholemeal_bread', 'buckwheat', 'potato'], g: 70 },
    ],
    methods: [{ equip: 'stove', total: 20, active: 8, pots: 1, steps: ['Абсмажце цыбулю, моркву і перац 5 хвілін.', 'Дадайце фасолю, памідоры, маяран, тушыце 10 хвілін.', 'Падайце з хлебам.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-peczotto', meal: ['lunch', 'dinner'], title: 'Пярлоўка-рызота са шпінатам і брынзай', pl: 'pęczotto ze szpinakiem i fetą', src: 'pl',
    slots: [
      { role: 'base', opts: ['barley'], g: 60, req: true },
      { role: 'veg', opts: ['spinach', 'mushrooms', 'leek', 'zucchini', 'pumpkin', 'onion'], g: 200, req: true, pick: 2 },
      { role: 'protein', opts: ['feta', 'goat_cheese', 'chicken_breast', 'turkey', 'beans'], g: 100, req: true },
      { role: 'texture', opts: ['seeds', 'walnut', 'hard_cheese'], g: 15 },
    ],
    methods: [{ equip: 'stove', total: 40, active: 15, pots: 1, steps: ['Цыбулю і пярлоўку абсмажце 2 хвіліны.', 'Падлівайце гарачую ваду па шклянцы, памешвайце, 30 хвілін.', 'Шпінат і брынзу — у канцы.'] }],
    portable: true,
  },
  {
    id: 'm-stuffed-peppers', meal: ['dinner', 'lunch'], title: 'Фаршыраваны перац', pl: 'papryka faszerowana kaszą i mięsem', src: 'pl',
    slots: [
      { role: 'veg', opts: ['pepper'], g: 200, req: true },
      { role: 'protein', opts: ['minced_meat', 'turkey', 'lentils', 'beans'], g: 110, req: true },
      { role: 'base', opts: ['buckwheat', 'brown_rice', 'millet', 'rice'], g: 40, req: true },
      { role: 'sauce', opts: ['tomato_passata'], g: 80 },
      { role: 'texture', opts: ['hard_cheese', 'feta'], g: 20 },
    ],
    methods: [{ equip: 'oven', total: 50, active: 15, pots: 2, steps: ['Звараныя крупы змяшайце з абсмажаным фаршам і цыбуляй.', 'Напоўніце палоўкі перцу, заліце таматным соусам.', '35 хвілін пры 190°, зверху сыр.'] }],
    portable: true, batch: true,
  },
  {
    id: 'm-bigos-light', meal: ['lunch', 'dinner'], title: 'Лёгкі бігас з грыбамі', pl: 'bigos lekki z grzybami', src: 'pl',
    slots: [
      { role: 'veg', opts: ['sauerkraut', 'cabbage'], g: 250, req: true, pick: 2 },
      { role: 'protein', opts: ['pork', 'turkey', 'chicken_thigh', 'beans'], g: 110, req: true },
      { role: 'extra', opts: ['mushrooms', 'onion', 'carrot', 'tomato_passata'], g: 100, req: true, pick: 2 },
      { role: 'texture', opts: ['prunes'], g: 20 },
      { role: 'base', opts: ['wholemeal_bread', 'potato'], g: 80 },
    ],
    methods: [
      { equip: 'stove', total: 70, active: 15, pots: 1, steps: ['Мяса кубікамі абсмажце з цыбуляй.', 'Дадайце капусту, грыбы, чарнасліў і трохі вады.', 'Тушыце 50 хвілін на малым агні. На другі дзень яшчэ смачней.'] },
      { equip: 'multicooker', total: 80, active: 10, pots: 1, steps: ['Усё ў мультыварку, рэжым «тушэнне» 70 хвілін.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 'm-potato-bake', meal: ['dinner'], title: 'Бульбяная запяканка з брокалі і яйкам', pl: 'zapiekanka ziemniaczana z brokułem', src: 'own',
    slots: [
      { role: 'base', opts: ['potato'], g: 200, req: true },
      { role: 'veg', opts: ['broccoli', 'cauliflower', 'spinach', 'frozen_veg', 'leek'], g: 200, req: true, pick: 2 },
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'texture', opts: ['hard_cheese', 'feta'], g: 30, req: true },
    ],
    methods: [{ equip: 'oven', total: 45, active: 12, pots: 2, steps: ['Бульбу скрылькамі адварыце 8 хвілін, брокалі — 3.', 'У форму, заліце яйкамі ўзбітымі з малаком, зверху сыр.', '25 хвілін пры 190°.'] }],
    batch: true,
  },
  {
    id: 'm-fried-rice', meal: ['dinner', 'lunch'], title: 'Рыс з гароднінай і яйкам', pl: 'ryż smażony z warzywami i jajkiem', src: 'own',
    slots: [
      { role: 'base', opts: ['brown_rice', 'rice', 'buckwheat', 'bulgur'], g: 60, req: true },
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'extra', opts: ['chicken_breast', 'turkey', 'beans', 'tuna'], g: 60 },
      { role: 'veg', opts: ['frozen_veg', 'peas', 'carrot', 'pepper', 'cabbage', 'leek'], g: 200, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 15, active: 12, pots: 1, note: 'з учорашняга рысу', steps: ['Гародніна на гарачай патэльні 5 хвілін.', 'Дадайце рыс, адсуньце ўбок і ўзбіце побач яйкі.', 'Змяшайце, соевы соус, зялёная цыбуля.'] }],
    portable: true,
  },
  {
    id: 'm-lentil-beet-salad', meal: ['lunch', 'dinner'], title: 'Салата з сачавіцы, буракоў і брынзы', pl: 'sałatka z soczewicą, burakiem i fetą', src: 'own',
    slots: [
      { role: 'protein', opts: ['lentils', 'chickpeas'], g: 110, req: true },
      { role: 'veg', opts: ['beet'], g: 150, req: true },
      { role: 'extra', opts: ['rocket', 'spinach', 'lettuce', 'onion', 'apple'], g: 80, req: true, pick: 2 },
      { role: 'texture', opts: ['feta', 'goat_cheese', 'walnut'], g: 40, req: true },
    ],
    methods: [{ equip: 'none', total: 10, active: 10, pots: 1, note: 'з гатовымі буракамі і сачавіцай', steps: ['Буракі кубікамі, сачавіца, рукала.', 'Зверху брынза і арэхі, бальзамічны воцат і алей.'] }],
    portable: true,
  },
  {
    id: 'm-fish-mizeria', meal: ['dinner', 'lunch'], title: 'Рыба ў аўсянай паніроўцы з агурочнай салатай', pl: 'ryba w płatkach owsianych z mizerią', src: 'pl',
    slots: [
      { role: 'protein', opts: ['cod', 'salmon', 'mackerel'], g: 140, req: true },
      { role: 'texture', opts: ['oats'], g: 20, req: true },
      { role: 'veg', opts: ['cucumber'], g: 150, req: true },
      { role: 'sauce', opts: ['yogurt', 'kefir'], g: 70, req: true },
      { role: 'base', opts: ['potato', 'buckwheat', 'millet'], g: 180 },
    ],
    methods: [
      { equip: 'oven', total: 30, active: 12, pots: 2, steps: ['Рыбу абмакніце ў яйка і аўсяныя шматкі.', 'На бляху, 15 хвілін пры 200°.', 'Агуркі скрылькамі з ёгуртам і кропам. Побач бульба.'] },
      { equip: 'stove', total: 25, active: 15, pots: 2, steps: ['Рыбу ў аўсяных шматках абсмажце па 3–4 хвіліны з боку.', 'Агуркі з ёгуртам і кропам.'] },
    ],
  },
  {
    id: 'm-chicken-dill', meal: ['lunch', 'dinner'], title: 'Курыца ў ёгуртава-кропавым соусе з крупамі', pl: 'kurczak w sosie jogurtowo-koperkowym z kaszą', src: 'own',
    slots: [
      { role: 'protein', opts: ['chicken_breast', 'turkey', 'chicken_thigh'], g: 130, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr'], g: 80, req: true },
      { role: 'base', opts: GRAIN, g: 60, req: true },
      { role: 'veg', opts: ['greens', 'cucumber', 'carrot', 'broccoli', 'frozen_veg', 'lettuce'], g: 180, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 25, active: 12, pots: 2, steps: ['Зварыце крупы.', 'Курыцу кубікамі абсмажце 7 хвілін, зніміце з агню.', 'Дадайце ёгурт з кропам і часныком. Побач гародніна.'] }],
    portable: true,
  },
  {
    id: 'm-eggs-spinach-potato', meal: ['dinner', 'lunch'], title: 'Яйкі са шпінатам і бульбай', pl: 'jajka sadzone ze szpinakiem i ziemniakami', src: 'pl',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 110, req: true },
      { role: 'veg', opts: ['spinach', 'broccoli', 'frozen_veg'], g: 180, req: true },
      { role: 'base', opts: ['potato', 'buckwheat'], g: 200, req: true },
      { role: 'extra', opts: ['cucumber', 'tomato', 'beet', 'sauerkraut'], g: 100 },
    ],
    methods: [
      { equip: 'stove', total: 25, active: 10, pots: 3, steps: ['Зварыце бульбу.', 'Шпінат з часныком на патэльні 3 хвіліны.', 'Яйкі ўсмятку ці глазунья. Побач агурок.'] },
      { equip: 'microwave', total: 15, active: 7, pots: 2, steps: ['Бульба ў мундзіры 8 хвілін.', 'Шпінат 2 хвіліны, яйкі глазунья на пліце.'] },
    ],
  },
  {
    id: 'm-chicken-sauerkraut', meal: ['dinner'], title: 'Курыныя сцёгны з бульбай і квашанай капустай', pl: 'udka pieczone z ziemniakami i kiszoną kapustą', src: 'pl',
    slots: [
      { role: 'protein', opts: ['chicken_thigh', 'chicken_marinated', 'turkey'], g: 150, req: true },
      { role: 'base', opts: ['potato'], g: 200, req: true },
      { role: 'veg', opts: ['sauerkraut', 'carrot', 'onion', 'beet', 'cabbage'], g: 180, req: true, pick: 2 },
    ],
    methods: [{ equip: 'oven', total: 50, active: 10, pots: 1, steps: ['Сцёгны і бульбу дзелькамі на бляху, алей, папрыка, часнок.', '45 хвілін пры 200°.', 'Побач квашаная капуста з морквай.'] }],
    batch: true,
  },
  {
    id: 'm-salmon-tortilla', meal: ['lunch'], title: 'Ролы з тартылі з рыбай і тварагом', pl: 'wrapy z rybą i twarożkiem', src: 'own',
    slots: [
      { role: 'base', opts: ['tortilla'], g: 60, req: true },
      { role: 'protein', opts: ['smoked_salmon', 'smoked_trout', 'tuna', 'herring'], g: 80, req: true },
      { role: 'extra', opts: ['cream_cheese', 'quark', 'hummus'], g: 50, req: true },
      { role: 'veg', opts: ['rocket', 'spinach', 'cucumber', 'lettuce', 'avocado', 'pepper'], g: 120, req: true, pick: 2 },
    ],
    methods: [{ equip: 'none', total: 7, active: 7, pots: 0, steps: ['Тартылю намажце тварагом.', 'Рыба і гародніна, шчыльна згарніце, разрэжце напалову.'] }],
    portable: true,
  },
];
