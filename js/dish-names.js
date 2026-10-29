// Назва і крокі стравы з тым, што ў яе рэальна трапіла.
// У шаблоне name — узор назвы, title — агульная назва (для густаў і спісаў, дзе напаўнення няма).
// У ўзоры {key} — складнік са слота з гэтым key (назоўны склон), {key:ins} — творны («ласосем»),
// {key:gen} — родны («індычкі»), {key:with} і {key:of} — тое ж з прыназоўнікам «з»/«са».
// [ … ] — частка, якая паказваецца, толькі калі ўсе слоты ўнутры запоўненыя; [ … | … ] — інакш другая.
// Слот з key — адзін складнік (pick 1), каб назва не пералічвала ўсё запар. Тое ж працуе ў кроках.

// Формы для складнікаў, што трапляюць у назвы страў.
export const FORMS = {
  // Рыба
  salmon: { nom: 'ласось', ins: 'ласосем', gen: 'ласося' },
  smoked_salmon: { nom: 'вэнджаны ласось', ins: 'вэнджаным ласосем', gen: 'вэнджанага ласося' },
  smoked_trout: { nom: 'вэнджаная стронга', ins: 'вэнджанай стронгай', gen: 'вэнджанай стронгі' },
  mackerel: { nom: 'скумбрыя', ins: 'скумбрыяй', gen: 'скумбрыі' },
  cod: { nom: 'трэска', ins: 'трэскай', gen: 'трэскі' },
  tuna: { nom: 'тунец', ins: 'тунцом', gen: 'тунца' },
  sprats: { nom: 'шпроты', ins: 'шпротамі', gen: 'шпротаў' },
  herring: { nom: 'селядзец', ins: 'селядцом', gen: 'селядца' },
  // Птушка і мяса
  chicken_breast: { nom: 'курыца', ins: 'курыцай', gen: 'курыцы' },
  chicken_thigh: { nom: 'курыныя сцёгны', ins: 'курынымі сцёгнамі', gen: 'курыных сцёгнаў' },
  chicken_marinated: { nom: 'курыца ў марынадзе', ins: 'курыцай у марынадзе', gen: 'курыцы ў марынадзе' },
  turkey: { nom: 'індычка', ins: 'індычкай', gen: 'індычкі' },
  minced_meat: { nom: 'фарш', ins: 'фаршам', gen: 'фаршу' },
  pork: { nom: 'свініна', ins: 'свінінай', gen: 'свініны' },
  beef: { nom: 'ялавічына', ins: 'ялавічынай', gen: 'ялавічыны' },
  // Бабовыя
  chickpeas: { nom: 'нут', ins: 'нутам', gen: 'нуту' },
  beans: { nom: 'фасоля', ins: 'фасоляй', gen: 'фасолі' },
  lentils: { nom: 'сачавіца', ins: 'сачавіцай', gen: 'сачавіцы' },
  hummus: { nom: 'хумус', ins: 'хумусам', gen: 'хумусу' },
  beans_sauce: { nom: 'фасоля ў соусе', ins: 'фасоляй у соусе', gen: 'фасолі ў соусе' },
  // Малочка і яйкі
  eggs: { nom: 'яйкі', ins: 'яйкам', gen: 'яек' },
  quark: { nom: 'тварог', ins: 'тварагом', gen: 'тварагу' },
  cottage: { nom: 'вясковы сырок', ins: 'вясковым сырком', gen: 'вясковага сырку' },
  cream_cheese: { nom: 'тварожны сырок', ins: 'тварожным сырком', gen: 'тварожнага сырку' },
  skyr: { nom: 'скір', ins: 'скірам', gen: 'скіру' },
  yogurt: { nom: 'ёгурт', ins: 'ёгуртам', gen: 'ёгурту' },
  kefir: { nom: 'кефір', ins: 'кефірам', gen: 'кефіру' },
  milk: { nom: 'малако', ins: 'малаком', gen: 'малака' },
  feta: { nom: 'брынза', ins: 'брынзай', gen: 'брынзы' },
  goat_cheese: { nom: 'казіны сыр', ins: 'казіным сырам', gen: 'казінага сыру' },
  hard_cheese: { nom: 'цвёрды сыр', ins: 'цвёрдым сырам', gen: 'цвёрдага сыру' },
  // Крупы, хлеб, бульба
  buckwheat: { nom: 'грэчка', ins: 'грэчкай', gen: 'грэчкі' },
  barley: { nom: 'пярлоўка', ins: 'пярлоўкай', gen: 'пярлоўкі' },
  brown_rice: { nom: 'цёмны рыс', ins: 'цёмным рысам', gen: 'цёмнага рысу' },
  rice: { nom: 'рыс', ins: 'рысам', gen: 'рысу' },
  millet: { nom: 'пшано', ins: 'пшаном', gen: 'пшана' },
  bulgur: { nom: 'булгур', ins: 'булгурам', gen: 'булгуру' },
  oats: { nom: 'аўсянка', ins: 'аўсянкай', gen: 'аўсянкі' },
  wholemeal_pasta: { nom: 'цэльназерневы макарон', ins: 'цэльназерневым макаронам', gen: 'цэльназерневага макарону' },
  pasta: { nom: 'макарон', ins: 'макаронам', gen: 'макарону' },
  potato: { nom: 'бульба', ins: 'бульбай', gen: 'бульбы' },
  wholemeal_bread: { nom: 'цёмны хлеб', ins: 'цёмным хлебам', gen: 'цёмнага хлеба' },
  tortilla: { nom: 'тартыля', ins: 'тартыляй', gen: 'тартылі' },
  // Гародніна
  spinach: { nom: 'шпінат', ins: 'шпінатам', gen: 'шпінату' },
  broccoli: { nom: 'брокалі', ins: 'брокалі', gen: 'брокалі' },
  cauliflower: { nom: 'каляровая капуста', ins: 'каляровай капустай', gen: 'каляровай капусты' },
  mushrooms: { nom: 'грыбы', ins: 'грыбамі', gen: 'грыбоў' },
  pumpkin: { nom: 'гарбуз', ins: 'гарбузом', gen: 'гарбуза' },
  carrot: { nom: 'морква', ins: 'морквай', gen: 'морквы' },
  zucchini: { nom: 'цукіні', ins: 'цукіні', gen: 'цукіні' },
  leek: { nom: 'парэй', ins: 'парэем', gen: 'парэю' },
  frozen_veg: { nom: 'марожаная гародніна', ins: 'марожанай гароднінай', gen: 'марожанай гародніны' },
  sauerkraut: { nom: 'квашаная капуста', ins: 'квашанай капустай', gen: 'квашанай капусты' },
  cabbage: { nom: 'капуста', ins: 'капустай', gen: 'капусты' },
  tomato: { nom: 'памідоры', ins: 'памідорамі', gen: 'памідораў' },
  tomato_passata: { nom: 'таматная паста', ins: 'таматнай пастай', gen: 'таматнай пасты' },
  radish: { nom: 'радыска', ins: 'радыскай', gen: 'радыскі' },
  cucumber: { nom: 'агурок', ins: 'агурком', gen: 'агурка' },
  pepper: { nom: 'перац', ins: 'перцам', gen: 'перцу' },
  rocket: { nom: 'рукала', ins: 'рукалай', gen: 'рукалы' },
  lettuce: { nom: 'салата', ins: 'лістамі салаты', gen: 'лістоў салаты' },
  greens: { nom: 'зеляніна', ins: 'зелянінай', gen: 'зеляніны' },
  // Арэхі і насенне
  walnut: { nom: 'грэцкія арэхі', ins: 'грэцкімі арэхамі', gen: 'грэцкіх арэхаў' },
  pistachio: { nom: 'фісташкі', ins: 'фісташкамі', gen: 'фісташак' },
  seeds: { nom: 'насенне', ins: 'насеннем', gen: 'насення' },
  peanuts: { nom: 'арахіс', ins: 'арахісам', gen: 'арахісу' },
  peanut_butter: { nom: 'арахісавая паста', ins: 'арахісавай пастай', gen: 'арахісавай пасты' },
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// «са» перад с, з, ш, ж, ч з зычным пасля: «са скумбрыяй», «са шпінатам»; інакш «з».
const prep = (word) => (/^[сзшжч][^аеёіоуыэюяў]/i.test(word) ? 'са' : 'з');

function form(id, kind) {
  const f = FORMS[id];
  if (!f) throw new Error(`няма формаў для ${id}`);
  if (kind === 'with') return `${prep(f.ins)} ${f.ins}`;
  if (kind === 'of') return `${prep(f.gen)} ${f.gen}`;
  return f[kind];
}

// Узор → тэкст. picked: key слота → id складніка ці undefined, калі слот пусты.
export function renderPattern(pattern, picked) {
  const one = (text) => text.replace(/\{(\w+)(?::(\w+))?\}/g, (_, key, kind = 'nom') => form(picked[key], kind));
  const filled = (text) => [...text.matchAll(/\{(\w+)/g)].every((m) => picked[m[1]]);
  const out = pattern.replace(/\[([^\]|]*)(?:\|([^\]]*))?\]/g, (_, when, other = '') => (filled(when) ? when : other));
  return cap(shortU(one(out)));
}

// «у» пасля галоснай становіцца «ў» і наадварот: «тэфтэлі з індычкі ў соусе», «нут у соусе».
const shortU = (text) => text.replace(/([а-яёіў])([,]?) [уў] /g, (_, c, comma) => `${c}${comma} ${!comma && /[аеёіоуыэюя]/.test(c) ? 'ў' : 'у'} `);

// Які складнік стаіць у кожным слоце з key.
export function pickedByKey(dish) {
  const out = {};
  for (const { slot, ids } of [...dish.chosen, ...(dish.missing ?? [])]) if (slot.key) out[slot.key] = ids[0];
  return out;
}

export function dishTitle(dish) {
  const t = dish.template;
  return t.name ? renderPattern(t.name, pickedByKey(dish)) : t.title;
}

export function dishSteps(dish) {
  const picked = pickedByKey(dish);
  return dish.method.steps.map((s) => (s.includes('{') || s.includes('[') ? renderPattern(s, picked) : s));
}
