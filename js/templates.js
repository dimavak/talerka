// Шаблоны страў. Шаблон — не жорсткі рэцэпт, а схема са слотамі:
// у кожны слот падстаўляецца тое, што ёсць у запасах. opts пералічаны ў парадку перавагі.
// g — грамы на порцыю, req — без гэтага слота страва не атрымаецца, pick — колькі розных складнікаў узяць.
// methods — спосабы на рознай тэхніцы: total і active у хвілінах, pots — колькі посуду мыць.
// portable — добра трываць да абеду ў кантэйнеры; batch — варта гатаваць на два разы.

const FISH_FRESH = ['salmon', 'mackerel', 'cod'];
const FISH_READY = ['smoked_salmon', 'smoked_trout', 'tuna', 'sprats', 'herring', 'mackerel'];
const POULTRY = ['chicken_breast', 'turkey', 'chicken_thigh', 'chicken_marinated'];
const VEG_COOK = ['broccoli', 'frozen_veg', 'zucchini', 'pepper', 'carrot', 'cauliflower', 'spinach', 'cabbage', 'onion', 'mushrooms', 'beet'];
const VEG_RAW = ['cucumber', 'tomato', 'pepper', 'rocket', 'lettuce', 'radish', 'spinach', 'celery', 'greens', 'avocado'];
const GRAIN = ['buckwheat', 'barley', 'brown_rice', 'bulgur', 'wholemeal_pasta', 'pasta', 'rice'];
const FRUIT = ['blueberries', 'banana', 'apple', 'pear', 'mandarin', 'nectarine', 'mango', 'grapes', 'berries_fresh', 'prunes', 'apricots_dried'];
const NUTS = ['walnut', 'pistachio', 'seeds', 'peanuts', 'peanut_butter'];
const BREAD = ['wholemeal_bread', 'tortilla'];

export const TEMPLATES = [
  // ── Сняданкі ──
  {
    id: 'b-cottage-fruit', meal: ['breakfast'], title: 'Сырок з садавінай і арэхамі',
    slots: [
      { role: 'protein', opts: ['cottage', 'skyr', 'quark', 'yogurt', 'cream_cheese'], g: 200, req: true },
      { role: 'fruit', opts: FRUIT, g: 120, req: true, pick: 2 },
      { role: 'texture', opts: NUTS, g: 20 },
    ],
    methods: [{ equip: 'none', total: 3, active: 3, pots: 1, steps: ['Выкладзіце ў міску бялковую аснову.', 'Зверху садавіна і жменька арэхаў.'] }],
    portable: true,
  },
  {
    id: 'b-oats', meal: ['breakfast'], title: 'Аўсянка з садавінай',
    slots: [
      { role: 'base', opts: ['oats'], g: 50, req: true },
      { role: 'protein', opts: ['milk', 'kefir', 'skyr', 'yogurt'], g: 200, req: true },
      { role: 'fruit', opts: FRUIT, g: 100, req: true },
      { role: 'texture', opts: NUTS, g: 15 },
    ],
    methods: [
      { equip: 'microwave', total: 5, active: 2, pots: 1, steps: ['Шматкі заліце малаком у глыбокай міске.', '2–3 хвіліны ў мікрахвалёўцы, памяшаць на паўдарозе.', 'Дадайце садавіну і арэхі.'] },
      { equip: 'stove', total: 10, active: 5, pots: 1, steps: ['Шматкі з малаком давядзіце да кіпення і варыце 5 хвілін.', 'Дадайце садавіну і арэхі.'] },
      { equip: 'none', total: 3, active: 3, pots: 1, note: 'з вечара', steps: ['Увечары заліце шматкі кефірам або ёгуртам і пастаўце ў халадзільнік.', 'Раніцай дадайце садавіну і арэхі.'] },
    ],
    portable: true,
  },
  {
    id: 'b-eggs-veg', meal: ['breakfast', 'dinner'], title: 'Яечня з гароднінай',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 120, req: true },
      { role: 'veg', opts: ['zucchini', 'pepper', 'tomato', 'spinach', 'mushrooms', 'frozen_veg', 'onion'], g: 150, req: true, pick: 2 },
      { role: 'base', opts: BREAD, g: 50 },
      { role: 'texture', opts: ['greens', 'feta', 'hard_cheese'], g: 15 },
    ],
    methods: [{ equip: 'stove', total: 12, active: 10, pots: 1, steps: ['Абсмажце нарэзаную гародніну 4–5 хвілін.', 'Разбіце яйкі зверху, накрыйце накрыўкай на 3 хвіліны.', 'Пасыпце зелянінай ці сырам.'] }],
  },
  {
    id: 'b-tortilla-egg', meal: ['breakfast'], title: 'Тартыля з яйкам і гароднінай',
    slots: [
      { role: 'base', opts: ['tortilla'], g: 60, req: true },
      { role: 'protein', opts: ['eggs'], g: 100, req: true },
      { role: 'veg', opts: ['pepper', 'tomato', 'spinach', 'rocket', 'lettuce', 'avocado'], g: 80, req: true, pick: 2 },
      { role: 'texture', opts: ['hard_cheese', 'feta', 'goat_cheese'], g: 20 },
    ],
    methods: [{ equip: 'stove', total: 10, active: 8, pots: 1, steps: ['Узбіце яйкі і выліце на патэльню.', 'Пакуль не схапіліся, пакладзіце зверху тартылю, праз хвіліну перавярніце.', 'Гародніну і сыр выкладзіце на палову, складзіце.'] }],
    portable: true,
  },
  {
    id: 'b-sandwich', meal: ['breakfast', 'lunch'], title: 'Бутэрброды з хумусам і гароднінай',
    slots: [
      { role: 'base', opts: BREAD, g: 70, req: true },
      { role: 'protein', opts: ['hummus', 'quark', 'cream_cheese', 'cottage'], g: 70, req: true },
      { role: 'veg', opts: VEG_RAW, g: 120, req: true, pick: 2 },
      { role: 'extra', opts: ['smoked_salmon', 'smoked_trout', 'eggs', 'sprats'], g: 50 },
    ],
    methods: [{ equip: 'none', total: 5, active: 5, pots: 0, steps: ['Намажце хлеб ці тартылю.', 'Зверху гародніна і, калі ёсць, рыба.'] }],
    portable: true,
  },
  {
    id: 'b-smoothie', meal: ['breakfast'], title: 'Кефірны смузі з аўсянкай',
    slots: [
      { role: 'protein', opts: ['kefir', 'skyr', 'yogurt', 'milk'], g: 250, req: true },
      { role: 'fruit', opts: ['banana', 'blueberries', 'mango', 'berries_fresh', 'pear'], g: 120, req: true, pick: 2 },
      { role: 'base', opts: ['oats'], g: 25 },
      { role: 'texture', opts: ['peanut_butter', 'seeds', 'walnut'], g: 15 },
    ],
    methods: [{ equip: 'blender', total: 4, active: 4, pots: 1, steps: ['Усё ў блэндэр на хвіліну.'] }],
    portable: true,
  },
  {
    id: 'b-syrniki', meal: ['breakfast'], title: 'Сырнікі з аўсянай мукой',
    slots: [
      { role: 'protein', opts: ['quark'], g: 180, req: true },
      { role: 'extra', opts: ['eggs'], g: 50, req: true },
      { role: 'base', opts: ['oats'], g: 30, req: true },
      { role: 'fruit', opts: FRUIT, g: 100 },
    ],
    methods: [
      { equip: 'stove', total: 20, active: 15, pots: 2, steps: ['Тварог, яйка і здробненыя шматкі змяшайце.', 'Сфармуйце сырнікі і падсмажце на малым агні па 3–4 хвіліны з кожнага боку.', 'Падайце з садавінай.'] },
      { equip: 'oven', total: 25, active: 8, pots: 1, steps: ['Тварог, яйка і здробненыя шматкі змяшайце.', 'Выкладзіце сырнікі на бляху з паперай, 20 хвілін пры 190°.'] },
    ],
    batch: true,
  },
  {
    id: 'b-avocado-toast', meal: ['breakfast'], title: 'Тост з авакада і яйкам',
    slots: [
      { role: 'base', opts: ['wholemeal_bread', 'tortilla'], g: 70, req: true },
      { role: 'veg', opts: ['avocado'], g: 70, req: true },
      { role: 'protein', opts: ['eggs', 'smoked_salmon', 'cottage'], g: 100, req: true },
      { role: 'veg', opts: ['tomato', 'rocket', 'radish', 'greens'], g: 60 },
    ],
    methods: [{ equip: 'stove', total: 10, active: 6, pots: 1, steps: ['Зварыце яйкі 7 хвілін ці зрабіце яечню.', 'Раздушыце авакада відэльцам на хлебе.', 'Зверху яйка і гародніна.'] }],
  },

  // ── Абеды ──
  {
    id: 'l-grain-poultry', meal: ['lunch', 'dinner'], title: 'Крупа з птушкай і гароднінай',
    slots: [
      { role: 'base', opts: GRAIN, g: 60, req: true },
      { role: 'protein', opts: POULTRY, g: 140, req: true },
      { role: 'veg', opts: VEG_COOK, g: 200, req: true, pick: 2 },
      { role: 'sauce', opts: ['yogurt', 'mustard', 'tomato_passata'], g: 40 },
    ],
    methods: [
      { equip: 'stove', total: 30, active: 12, pots: 2, steps: ['Пастаўце крупу варыцца.', 'Мяса нарэжце кавалкамі і абсмажце 6–7 хвілін.', 'Дадайце гародніну, тушыце пад накрыўкай 8 хвілін.', 'Падайце з крупой і соусам.'] },
      { equip: 'microwave', total: 25, active: 8, pots: 2, steps: ['Пастаўце крупу варыцца на пліце.', 'Мяса з гароднінай у посудзе з накрыўкай — рэжым «мяса», каля 12 хвілін.', 'Падайце з крупой і соусам.'] },
      { equip: 'oven', total: 40, active: 10, pots: 2, steps: ['Мяса і гародніну на бляху, алей, спецыі — 30 хвілін пры 200°.', 'Тым часам зварыце крупу.'] },
    ],
    portable: true, batch: true,
  },
  {
    id: 'l-legume-bowl', meal: ['lunch', 'dinner'], title: 'Салата-міска з бабовымі',
    slots: [
      { role: 'protein', opts: ['chickpeas', 'beans', 'lentils', 'peas'], g: 150, req: true },
      { role: 'veg', opts: VEG_RAW, g: 200, req: true, pick: 3 },
      { role: 'base', opts: ['bulgur', 'buckwheat', 'brown_rice', 'barley'], g: 50 },
      { role: 'texture', opts: ['feta', 'goat_cheese', 'seeds', 'walnut'], g: 30 },
    ],
    methods: [{ equip: 'none', total: 10, active: 10, pots: 1, steps: ['Бабовыя прамыйце пад вадой.', 'Нарэжце гародніну, змяшайце з бабовымі і крупой, калі ёсць.', 'Алей, цытрына ці воцат, соль. Зверху сыр ці насенне.'] }],
    portable: true,
  },
  {
    id: 'l-lentil-soup', meal: ['lunch', 'dinner'], title: 'Суп з сачавіцы',
    slots: [
      { role: 'protein', opts: ['lentils'], g: 80, req: true },
      { role: 'veg', opts: ['carrot', 'onion', 'tomato', 'celery', 'frozen_veg', 'spinach', 'tomato_passata'], g: 200, req: true, pick: 3 },
      { role: 'base', opts: ['potato', 'wholemeal_bread'], g: 100 },
      { role: 'sauce', opts: ['yogurt', 'lemon', 'greens'], g: 30 },
    ],
    methods: [{ equip: 'stove', total: 30, active: 10, pots: 1, steps: ['Абсмажце цыбулю і моркву 5 хвілін.', 'Дадайце сачавіцу, гародніну і 1 л вады, варыце 20 хвілін.', 'Падайце з лыжкай ёгурта ці цытрынай.'] }],
    portable: true, batch: true,
  },
  {
    id: 'l-tortilla-wrap', meal: ['lunch', 'dinner'], title: 'Тартыля з хумусам і бялком',
    slots: [
      { role: 'base', opts: ['tortilla'], g: 60, req: true },
      { role: 'sauce', opts: ['hummus'], g: 50, req: true },
      { role: 'protein', opts: ['chickpeas', 'smoked_salmon', 'salmon', 'tuna', 'chicken_breast', 'turkey', 'eggs', 'smoked_trout'], g: 100, req: true },
      { role: 'veg', opts: VEG_RAW, g: 120, req: true, pick: 2 },
    ],
    methods: [{ equip: 'none', total: 8, active: 8, pots: 0, steps: ['Намажце тартылю хумусам.', 'Выкладзіце бялок і гародніну, шчыльна скруціце.', 'Калі хочацца цёплага — хвіліна на сухой патэльні.'] }],
    portable: true,
  },
  {
    id: 'l-pasta-fish', meal: ['lunch', 'dinner'], title: 'Макарон з рыбай і памідорамі',
    slots: [
      { role: 'base', opts: ['wholemeal_pasta', 'pasta'], g: 70, req: true },
      { role: 'protein', opts: ['tuna', 'sprats', 'chickpeas', 'smoked_salmon'], g: 100, req: true },
      { role: 'veg', opts: ['tomato', 'tomato_passata', 'spinach', 'zucchini', 'pepper', 'frozen_veg'], g: 200, req: true, pick: 2 },
      { role: 'texture', opts: ['hard_cheese', 'greens'], g: 15 },
    ],
    methods: [{ equip: 'stove', total: 20, active: 10, pots: 2, steps: ['Пастаўце макарон варыцца.', 'На патэльні 5 хвілін тушыце гародніну, дадайце рыбу.', 'Змяшайце з макаронам.'] }],
    portable: true,
  },
  {
    id: 'l-potato-cottage', meal: ['lunch', 'dinner'], title: 'Маладая бульба з сыркам і гароднінай',
    slots: [
      { role: 'base', opts: ['potato'], g: 250, req: true },
      { role: 'protein', opts: ['cottage', 'quark', 'herring', 'eggs', 'smoked_trout'], g: 150, req: true },
      { role: 'veg', opts: ['cucumber', 'radish', 'greens', 'beet', 'tomato'], g: 150, req: true, pick: 2 },
    ],
    methods: [
      { equip: 'microwave', total: 12, active: 4, pots: 1, steps: ['Бульбу ў мундзіры праколіце відэльцам, рэжым «гародніна», 8–10 хвілін.', 'Падайце з сыркам, нарэзанай гароднінай і зелянінай.'] },
      { equip: 'stove', total: 25, active: 5, pots: 1, steps: ['Зварыце бульбу 20 хвілін.', 'Падайце з сыркам і гароднінай.'] },
    ],
  },
  {
    id: 'l-tray-poultry', meal: ['lunch', 'dinner'], title: 'Птушка з печанай гароднінай',
    slots: [
      { role: 'protein', opts: ['chicken_thigh', 'chicken_marinated', 'chicken_breast', 'turkey'], g: 160, req: true },
      { role: 'veg', opts: ['zucchini', 'pepper', 'carrot', 'broccoli', 'beet', 'onion', 'cauliflower', 'frozen_veg'], g: 250, req: true, pick: 3 },
      { role: 'base', opts: ['potato', 'buckwheat', 'bulgur'], g: 150 },
    ],
    methods: [{ equip: 'oven', total: 40, active: 10, pots: 1, steps: ['Гародніну буйна нарэжце, птушку і гародніну на адну бляху.', 'Алей, соль, спецыі — 35 хвілін пры 200°.'] }],
    portable: true, batch: true,
  },
  {
    id: 'l-beans-mexican', meal: ['lunch', 'dinner'], title: 'Фасоля па-мексіканску',
    slots: [
      { role: 'protein', opts: ['beans', 'lentils', 'chickpeas'], g: 150, req: true },
      { role: 'veg', opts: ['pepper', 'tomato', 'tomato_passata', 'onion', 'frozen_veg', 'zucchini'], g: 200, req: true, pick: 2 },
      { role: 'base', opts: ['brown_rice', 'tortilla', 'buckwheat', 'rice'], g: 60, req: true },
      { role: 'extra', opts: ['minced_meat'], g: 60 },
    ],
    methods: [{ equip: 'stove', total: 25, active: 10, pots: 2, steps: ['Пастаўце крупу варыцца.', 'Абсмажце цыбулю і перац, дадайце фасолю і памідоры, тушыце 10 хвілін.', 'Спецыі: паприка, кмен, часнок.'] }],
    portable: true, batch: true,
  },
  {
    id: 'l-beet-goat', meal: ['lunch'], title: 'Буракі з казіным сырам і зелянінай',
    slots: [
      { role: 'veg', opts: ['beet'], g: 150, req: true },
      { role: 'protein', opts: ['goat_cheese', 'feta', 'quark', 'chickpeas'], g: 80, req: true },
      { role: 'veg', opts: ['rocket', 'spinach', 'lettuce', 'greens'], g: 60, req: true },
      { role: 'texture', opts: ['walnut', 'seeds', 'pistachio'], g: 20 },
      { role: 'base', opts: ['wholemeal_bread', 'buckwheat', 'bulgur'], g: 60 },
    ],
    methods: [{ equip: 'none', total: 7, active: 7, pots: 1, steps: ['Гатовыя буракі нарэжце.', 'Выкладзіце на зеляніну, зверху сыр і арэхі, алей з воцатам.'] }],
    portable: true,
  },
  {
    id: 'l-canned-fish', meal: ['lunch', 'dinner'], title: 'Рыбныя кансервы з бульбай і салатай',
    slots: [
      { role: 'protein', opts: ['sprats', 'mackerel', 'herring', 'tuna'], g: 110, req: true },
      { role: 'base', opts: ['potato', 'wholemeal_bread'], g: 200, req: true },
      { role: 'veg', opts: VEG_RAW, g: 150, req: true, pick: 2 },
    ],
    methods: [{ equip: 'microwave', total: 12, active: 4, pots: 1, steps: ['Бульба ў мундзіры — 8–10 хвілін, рэжым «гародніна».', 'Нарэжце салату, падайце з рыбай.'] }],
  },
  {
    id: 'l-barley-mushroom', meal: ['lunch', 'dinner'], title: 'Пярлоўка з грыбамі і індычкай',
    slots: [
      { role: 'base', opts: ['barley', 'buckwheat', 'brown_rice'], g: 60, req: true },
      { role: 'protein', opts: ['turkey', 'chicken_breast', 'chicken_thigh'], g: 130, req: true },
      { role: 'veg', opts: ['mushrooms', 'onion', 'carrot', 'frozen_veg', 'spinach'], g: 200, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 40, active: 12, pots: 2, steps: ['Пастаўце пярлоўку варыцца (30 хвілін).', 'Абсмажце мяса, дадайце грыбы і гародніну, тушыце 10 хвілін.', 'Змяшайце з крупой.'] }],
    portable: true, batch: true,
  },
  {
    id: 'l-oven-omelette', meal: ['lunch', 'breakfast'], title: 'Амлет у духоўцы на два дні',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 150, req: true },
      { role: 'veg', opts: ['spinach', 'pepper', 'broccoli', 'frozen_veg', 'zucchini', 'tomato', 'peas'], g: 200, req: true, pick: 2 },
      { role: 'texture', opts: ['hard_cheese', 'feta', 'goat_cheese'], g: 30 },
      { role: 'base', opts: BREAD, g: 50 },
    ],
    methods: [
      { equip: 'oven', total: 30, active: 8, pots: 1, steps: ['Узбіце яйкі з крыху малака, дадайце гародніну.', 'Форма, 25 хвілін пры 180°. Падзяліце на порцыі.'] },
      { equip: 'microwave', total: 8, active: 4, pots: 1, steps: ['Яйкі з гароднінай у кружку ці міску, 2–3 хвіліны, памяшаць на паўдарозе.'] },
    ],
    portable: true, batch: true,
  },

  {
    id: 'l-buckwheat-quark', meal: ['lunch', 'dinner'], title: 'Грэчка з тварагом, яйкам і зелянінай',
    slots: [
      { role: 'base', opts: ['buckwheat', 'barley', 'bulgur'], g: 60, req: true },
      { role: 'protein', opts: ['quark', 'cottage', 'eggs'], g: 150, req: true },
      { role: 'veg', opts: ['greens', 'cucumber', 'tomato', 'radish', 'spinach'], g: 180, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 20, active: 5, pots: 1, steps: ['Зварыце грэчку (15 хвілін).', 'Змяшайце цёплую грэчку з тварагом і зелянінай, побач свежая гародніна.'] }],
    portable: true, batch: true,
  },

  // ── Вячэры ──
  {
    id: 'd-fish-tray', meal: ['dinner', 'lunch'], title: 'Рыба з гароднінай',
    slots: [
      { role: 'protein', opts: FISH_FRESH, g: 150, req: true },
      { role: 'veg', opts: ['pepper', 'zucchini', 'broccoli', 'tomato', 'frozen_veg', 'cauliflower', 'carrot'], g: 220, req: true, pick: 2 },
      { role: 'base', opts: ['buckwheat', 'potato', 'brown_rice', 'bulgur'], g: 60 },
      { role: 'sauce', opts: ['lemon', 'yogurt', 'greens'], g: 20 },
    ],
    methods: [
      { equip: 'oven', total: 25, active: 8, pots: 1, steps: ['Гародніну і рыбу на бляху, алей, соль, цытрына.', '18–20 хвілін пры 200°.', 'Тым часам зварыце крупу, калі трэба.'] },
      { equip: 'microwave', total: 12, active: 5, pots: 1, steps: ['Рыбу на гародніну ў посудзе з накрыўкай.', 'Рэжым «гародніна» ці 6–8 хвілін на 600 Вт.'] },
    ],
    portable: true,
  },
  {
    id: 'd-chickpea-yogurt', meal: ['dinner', 'lunch'], title: 'Цяцерыца з ёгуртавым соусам',
    slots: [
      { role: 'protein', opts: ['chickpeas', 'beans', 'lentils'], g: 160, req: true },
      { role: 'sauce', opts: ['yogurt', 'skyr', 'kefir'], g: 100, req: true },
      { role: 'veg', opts: ['tomato', 'spinach', 'cucumber', 'pepper', 'zucchini', 'greens'], g: 180, req: true, pick: 2 },
      { role: 'base', opts: ['tortilla', 'wholemeal_bread', 'bulgur', 'buckwheat'], g: 60 },
    ],
    methods: [
      { equip: 'stove', total: 15, active: 10, pots: 1, steps: ['Абсмажце цяцерыцу з часныком і спецыямі 5 хвілін.', 'Дадайце шпінат ці памідоры на 2 хвіліны.', 'Падайце з ёгуртам, соллю і цытрынай.'] },
      { equip: 'none', total: 8, active: 8, pots: 1, steps: ['Цяцерыцу прамыйце, змяшайце з гароднінай.', 'Зверху ёгурт з часныком і соллю.'] },
    ],
    portable: true,
  },
  {
    id: 'd-shakshuka', meal: ['dinner', 'breakfast'], title: 'Шакшука',
    slots: [
      { role: 'protein', opts: ['eggs'], g: 120, req: true },
      { role: 'veg', opts: ['tomato', 'tomato_passata'], g: 200, req: true },
      { role: 'veg', opts: ['pepper', 'onion', 'spinach', 'zucchini'], g: 100, pick: 2 },
      { role: 'base', opts: BREAD, g: 60 },
      { role: 'texture', opts: ['feta', 'greens'], g: 20 },
    ],
    methods: [{ equip: 'stove', total: 20, active: 10, pots: 1, steps: ['Абсмажце перац і цыбулю, дадайце памідоры, тушыце 8 хвілін.', 'Зрабіце паглыбленні, разбіце яйкі, пад накрыўкай 5 хвілін.', 'Падайце з хлебам.'] }],
  },
  {
    id: 'd-stirfry', meal: ['dinner', 'lunch'], title: 'Гародніна з птушкай на патэльні',
    slots: [
      { role: 'protein', opts: ['turkey', 'chicken_breast', 'chicken_marinated', 'eggs'], g: 140, req: true },
      { role: 'veg', opts: ['frozen_veg', 'pepper', 'broccoli', 'zucchini', 'carrot', 'cabbage', 'mushrooms'], g: 250, req: true, pick: 2 },
      { role: 'base', opts: ['buckwheat', 'brown_rice', 'rice', 'wholemeal_pasta'], g: 60 },
      { role: 'texture', opts: ['seeds', 'peanuts'], g: 15 },
    ],
    methods: [{ equip: 'stove', total: 20, active: 15, pots: 2, steps: ['Мяса тонкімі палоскамі на гарачую патэльню, 5 хвілін.', 'Гародніна на моцным агні яшчэ 6–7 хвілін.', 'Соевы соус ці часнок, зверху насенне.'] }],
    portable: true,
  },
  {
    id: 'd-quesadilla', meal: ['dinner'], title: 'Цёплая тартыля з фасоляй і сырам',
    slots: [
      { role: 'base', opts: ['tortilla'], g: 60, req: true },
      { role: 'protein', opts: ['beans', 'chickpeas', 'hummus', 'beans_sauce'], g: 120, req: true },
      { role: 'texture', opts: ['hard_cheese', 'feta'], g: 30, req: true },
      { role: 'veg', opts: ['pepper', 'tomato', 'spinach', 'lettuce', 'avocado', 'onion'], g: 120, req: true, pick: 2 },
    ],
    methods: [
      { equip: 'stove', total: 10, active: 8, pots: 1, steps: ['На палову тартылі — фасоля, гародніна, сыр.', 'Складзіце, па 2–3 хвіліны з кожнага боку на сухой патэльні.'] },
      { equip: 'oven', total: 12, active: 5, pots: 1, steps: ['Складзеныя тартылі на бляху, 8 хвілін пры 200°.'] },
    ],
  },
  {
    id: 'd-quark-potato', meal: ['dinner'], title: 'Тварог з зелянінай і бульбай',
    slots: [
      { role: 'protein', opts: ['quark', 'cottage', 'cream_cheese'], g: 150, req: true },
      { role: 'base', opts: ['potato'], g: 250, req: true },
      { role: 'veg', opts: ['greens', 'radish', 'cucumber', 'tomato'], g: 150, req: true, pick: 2 },
    ],
    methods: [{ equip: 'microwave', total: 10, active: 3, pots: 1, steps: ['Бульба ў мундзіры ў мікрахвалёўцы, 8 хвілін.', 'Тварог з дробна нарэзанай зелянінай і радыскай, соль.'] }],
  },
  {
    id: 'd-mackerel-potato', meal: ['dinner'], title: 'Скумбрыя з бульбай у духоўцы',
    slots: [
      { role: 'protein', opts: ['mackerel', 'salmon', 'cod'], g: 150, req: true },
      { role: 'base', opts: ['potato'], g: 250, req: true },
      { role: 'veg', opts: ['beet', 'cucumber', 'lettuce', 'carrot', 'cabbage', 'greens'], g: 150, req: true, pick: 2 },
    ],
    methods: [{ equip: 'oven', total: 35, active: 8, pots: 1, steps: ['Бульбу дзелькамі на бляху, 15 хвілін пры 200°.', 'Дадайце рыбу, яшчэ 15–18 хвілін.', 'Падайце з салатай.'] }],
  },
  {
    id: 'd-roast-veg-legume', meal: ['dinner', 'lunch'], title: 'Печаная гародніна з бабовымі і сырам',
    slots: [
      { role: 'veg', opts: ['zucchini', 'pepper', 'beet', 'carrot', 'broccoli', 'onion', 'cauliflower'], g: 280, req: true, pick: 3 },
      { role: 'protein', opts: ['chickpeas', 'beans', 'lentils'], g: 130, req: true },
      { role: 'texture', opts: ['feta', 'goat_cheese', 'seeds', 'walnut'], g: 30 },
      { role: 'sauce', opts: ['yogurt', 'hummus'], g: 50 },
    ],
    methods: [{ equip: 'oven', total: 35, active: 8, pots: 1, steps: ['Гародніну і цяцерыцу на бляху, алей, спецыі.', '30 хвілін пры 200°.', 'Зверху сыр ці насенне, побач ёгурт.'] }],
    portable: true, batch: true,
  },
  {
    id: 'd-lentil-egg', meal: ['dinner'], title: 'Сачавіца з гароднінай і яйкам',
    slots: [
      { role: 'protein', opts: ['lentils'], g: 120, req: true },
      { role: 'extra', opts: ['eggs'], g: 60, req: true },
      { role: 'veg', opts: ['spinach', 'tomato', 'carrot', 'onion', 'tomato_passata', 'frozen_veg'], g: 200, req: true, pick: 2 },
    ],
    methods: [{ equip: 'stove', total: 25, active: 10, pots: 2, steps: ['Зварыце сачавіцу (чырвоная — 12 хвілін).', 'Абсмажце гародніну, змяшайце з сачавіцай.', 'Зверху яйка ў мяшэчак ці яечня.'] }],
  },
  {
    id: 'd-cold-plate', meal: ['dinner', 'lunch'], title: 'Халодная талерка: рыба, сыр, гародніна',
    slots: [
      { role: 'protein', opts: ['smoked_salmon', 'smoked_trout', 'herring', 'eggs', 'goat_cheese', 'feta'], g: 100, req: true },
      { role: 'veg', opts: VEG_RAW, g: 200, req: true, pick: 3 },
      { role: 'base', opts: ['wholemeal_bread', 'tortilla'], g: 70, req: true },
      { role: 'sauce', opts: ['hummus', 'cream_cheese'], g: 40 },
    ],
    methods: [{ equip: 'none', total: 7, active: 7, pots: 0, steps: ['Нарэжце гародніну і хлеб.', 'Выкладзіце ўсё на адну талерку — палова талеркі гародніна.'] }],
  },
];

export const BY_TEMPLATE = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
