// Каталог складнікаў. p і f — бялок і валакно, г на 100 г у тым выглядзе, як ядуць.
// pl — рэгулярны выраз для назваў з польскіх чэкаў; aka — як можна напісаць рукамі.
// Парадак важны: больш дакладныя шаблоны (вэнджаны ласось) стаяць перад агульнымі (ласось).

export const GROUPS = {
  veg: 'Гародніна',
  starch: 'Бульба',
  fruit: 'Садавіна',
  grain_whole: 'Цэльнае зерне',
  grain_refined: 'Белае зерне',
  legume: 'Бабовыя',
  fish: 'Рыба',
  poultry: 'Птушка',
  meat: 'Мяса',
  processed: 'Каўбасы',
  eggs: 'Яйкі',
  dairy: 'Малочка',
  nuts: 'Арэхі і насенне',
  sauce: 'Соусы і спецыі',
};

export const PRODUCTS = [
  // Гародніна
  { id: 'pepper', name: 'перац', group: 'veg', p: 1, f: 2, plant: true, pl: 'papryk', aka: ['перац', 'перец', 'papryka'] },
  { id: 'cucumber', name: 'агурок', group: 'veg', p: 0.7, f: 0.5, plant: true, pl: 'ogór', aka: ['агурок', 'агуркі', 'огурец', 'огурцы'] },
  { id: 'tomato', name: 'памідоры', group: 'veg', p: 0.9, f: 1.2, plant: true, pl: '(?<!sosie )pomid|pom\\.', aka: ['памідор', 'памідоры', 'помидор', 'помидоры'] },
  { id: 'rocket', name: 'рукала', group: 'veg', p: 2.6, f: 1.6, plant: true, pl: 'rukol', aka: ['рукала', 'рукола', 'руккола'] },
  { id: 'lettuce', name: 'салата', group: 'veg', p: 1.2, f: 1.3, plant: true, pl: 'sałat', aka: ['салата', 'салат', 'латук'] },
  { id: 'zucchini', name: 'цукіні', group: 'veg', p: 1.2, f: 1, plant: true, pl: 'cukini', aka: ['цукіні', 'цукиня', 'цукіня', 'кабачок'] },
  { id: 'spinach', name: 'шпінат', group: 'veg', p: 2.9, f: 2.2, plant: true, pl: 'szpinak', aka: ['шпінат', 'шпинат'] },
  { id: 'carrot', name: 'морква', group: 'veg', p: 0.9, f: 2.8, plant: true, pl: 'marchew', aka: ['морква', 'морковь'] },
  { id: 'onion', name: 'цыбуля', group: 'veg', p: 1.1, f: 1.7, plant: true, pl: 'cebul', aka: ['цыбуля', 'лук'] },
  { id: 'garlic', name: 'часнок', group: 'veg', p: 6, f: 2, plant: true, pl: 'czosn', aka: ['часнок', 'чеснок'] },
  { id: 'beet', name: 'буракі', group: 'veg', p: 1.6, f: 2.8, plant: true, pl: 'burak', aka: ['буракі', 'бурак', 'свекла', 'свёкла'] },
  { id: 'radish', name: 'радыска', group: 'veg', p: 0.7, f: 1.6, plant: true, pl: 'rzodkiew', aka: ['радыска', 'рэдыска', 'редиска'] },
  { id: 'celery', name: 'салера', group: 'veg', p: 0.7, f: 1.6, plant: true, pl: 'seler', aka: ['салера', 'сельдерей'] },
  { id: 'greens', name: 'зеляніна', group: 'veg', p: 3, f: 3, plant: true, pl: 'natka|zielenin|koper|szczypior', aka: ['зеляніна', 'пятрушка', 'кроп', 'зелень', 'укроп'] },
  { id: 'frozen_veg', name: 'марожаная гародніна', group: 'veg', p: 2.5, f: 3, plant: true, pl: 'warzywa? (na patel|mro)|mieszanka warz|mrożon', aka: ['марожаная гародніна', 'марожаная', 'замороженные овощи', 'мароз'] },
  { id: 'broccoli', name: 'брокалі', group: 'veg', p: 2.8, f: 2.6, plant: true, pl: 'brokuł', aka: ['брокалі', 'брокколи', 'брокалі марожаныя'] },
  { id: 'cabbage', name: 'капуста', group: 'veg', p: 1.3, f: 2.5, plant: true, pl: 'kapust', aka: ['капуста'] },
  { id: 'cauliflower', name: 'каляровая капуста', group: 'veg', p: 1.9, f: 2, plant: true, pl: 'kalafior', aka: ['каляровая капуста', 'цветная капуста'] },
  { id: 'mushrooms', name: 'грыбы', group: 'veg', p: 3, f: 1, plant: true, pl: 'pieczark|grzyb', aka: ['грыбы', 'шампіньёны', 'грибы', 'шампиньоны'] },
  { id: 'avocado', name: 'авакада', group: 'veg', p: 2, f: 6.7, plant: true, pl: 'awokado', aka: ['авакада', 'авокадо'] },
  { id: 'potato', name: 'бульба', group: 'starch', p: 2, f: 2.2, plant: true, pl: 'ziemn', aka: ['бульба', 'картофель', 'картошка'] },

  // Садавіна
  { id: 'banana', name: 'банан', group: 'fruit', p: 1.1, f: 2.6, plant: true, pl: 'banan', aka: ['банан', 'бананы'] },
  { id: 'apple', name: 'яблык', group: 'fruit', p: 0.3, f: 2.4, plant: true, pl: 'jabłk', aka: ['яблык', 'яблыкі', 'яблоко', 'яблоки'] },
  { id: 'blueberries', name: 'чарніцы', group: 'fruit', p: 0.7, f: 2.4, plant: true, pl: 'borów|jagod', aka: ['чарніцы', 'буякі', 'голубика', 'черника'] },
  { id: 'mandarin', name: 'мандарыны', group: 'fruit', p: 0.8, f: 1.8, plant: true, pl: 'mandaryn|pomarańcz', aka: ['мандарын', 'мандарыны', 'мандарины', 'апельсін'] },
  { id: 'grapes', name: 'вінаград', group: 'fruit', p: 0.7, f: 0.9, plant: true, pl: 'winogr', aka: ['вінаград', 'виноград'] },
  { id: 'pear', name: 'груша', group: 'fruit', p: 0.4, f: 3.1, plant: true, pl: 'grusz', aka: ['груша', 'грушы', 'груши'] },
  { id: 'nectarine', name: 'нектарыны', group: 'fruit', p: 1, f: 1.7, plant: true, pl: 'nektaryn|brzoskw', aka: ['нектарын', 'персік', 'персик'] },
  { id: 'mango', name: 'манга', group: 'fruit', p: 0.8, f: 1.6, plant: true, pl: 'mango', aka: ['манга', 'манго'] },
  { id: 'lemon', name: 'цытрына', group: 'fruit', p: 1.1, f: 2.8, plant: true, pl: 'cytryn', aka: ['цытрына', 'лимон'] },
  { id: 'apricots_dried', name: 'курага', group: 'fruit', p: 3.4, f: 7.3, plant: true, pl: 'morele susz', aka: ['курага'] },
  { id: 'prunes', name: 'чарнасліў', group: 'fruit', p: 2.2, f: 7.1, plant: true, pl: 'śliwki susz', aka: ['чарнасліў', 'чернослив'] },
  { id: 'berries_fresh', name: 'ягады і сезонная садавіна', group: 'fruit', p: 0.8, f: 2, plant: true, pl: 'morele|czereś|truskaw|malin|arbuz', aka: ['ягады', 'клубніцы', 'малiна', 'ягоды'] },

  // Цэльнае зерне
  { id: 'buckwheat', name: 'грэчка', group: 'grain_whole', p: 4.5, f: 3, plant: true, pl: 'gryczan', aka: ['грэчка', 'гречка'] },
  { id: 'oats', name: 'аўсянка', group: 'grain_whole', p: 13, f: 10, plant: true, pl: 'owsian|płatki ow', aka: ['аўсянка', 'аўсяныя шматкі', 'овсянка', 'геркулес'] },
  { id: 'barley', name: 'пярлоўка', group: 'grain_whole', p: 3.5, f: 4, plant: true, pl: 'pęczak|jęczmien', aka: ['пярлоўка', 'перловка'] },
  { id: 'brown_rice', name: 'цёмны рыс', group: 'grain_whole', p: 2.6, f: 1.8, plant: true, pl: 'ryż (brąz|pełnoz|dzik)', aka: ['цёмны рыс', 'бурый рис'] },
  { id: 'bulgur', name: 'булгур', group: 'grain_whole', p: 3.1, f: 4.5, plant: true, pl: 'bulgur', aka: ['булгур'] },
  { id: 'tortilla', name: 'цэльназерневая тартыля', group: 'grain_whole', p: 9, f: 6, plant: true, pl: 'tortilla pełn', aka: ['тартыля', 'тортилья', 'лаваш'] },
  { id: 'wholemeal_bread', name: 'цёмны хлеб', group: 'grain_whole', p: 8, f: 6, plant: true, pl: 'chleb (żyt|raz|pełn|graham)', aka: ['цёмны хлеб', 'хлеб', 'чёрный хлеб'] },
  { id: 'wholemeal_pasta', name: 'цэльназерневы макарон', group: 'grain_whole', p: 5.5, f: 4, plant: true, pl: 'makaron pełn', aka: ['цэльназерневы макарон'] },

  // Белае зерне (для аналізу; у шаблонах — як запасны варыянт)
  { id: 'pasta', name: 'макарон', group: 'grain_refined', p: 5, f: 1.8, plant: true, pl: 'makaron|barilla|spaghet', aka: ['макарон', 'макароны', 'паста'] },
  { id: 'rice', name: 'белы рыс', group: 'grain_refined', p: 2.7, f: 0.4, plant: true, pl: 'ryż', aka: ['рыс', 'рис'] },

  // Бабовыя
  { id: 'hummus', name: 'хумус', group: 'legume', p: 7, f: 6, plant: true, pl: 'hummus', aka: ['хумус'] },
  { id: 'chickpeas', name: 'цяцерыца', group: 'legume', p: 7, f: 6, plant: true, pl: 'ciecierz', aka: ['цяцерыца', 'нут'] },
  { id: 'beans', name: 'фасоля', group: 'legume', p: 8, f: 6, plant: true, pl: 'fasol(?!ka w sos)|kidney', aka: ['фасоля', 'фасоль'] },
  { id: 'lentils', name: 'сачавіца', group: 'legume', p: 9, f: 8, plant: true, pl: 'soczew', aka: ['сачавіца', 'чечевица'] },
  { id: 'peas', name: 'гарошак', group: 'legume', p: 5, f: 5, plant: true, pl: 'groszek', aka: ['гарошак', 'зялёны гарошак', 'горошек'] },
  { id: 'beans_sauce', name: 'фасоля ў соусе', group: 'legume', p: 5, f: 5, plant: true, pl: 'fasolka w sos', aka: ['фасоля ў соусе'] },

  // Рыба
  { id: 'smoked_salmon', name: 'вэнджаны ласось', group: 'fish', p: 18, f: 0, pl: 'łosoś wędz', aka: ['вэнджаны ласось', 'копченый лосось'] },
  { id: 'smoked_trout', name: 'вэнджаны стронга', group: 'fish', p: 21, f: 0, pl: 'pstrąg', aka: ['стронга', 'форель'] },
  { id: 'salmon', name: 'ласось', group: 'fish', p: 20, f: 0, pl: 'łoso', aka: ['ласось', 'лосось', 'сёмга'] },
  { id: 'mackerel', name: 'скумбрыя', group: 'fish', p: 19, f: 0, pl: 'makrel|skumbr', aka: ['скумбрыя', 'скумбрия', 'макрэль'] },
  { id: 'sprats', name: 'шпроты ў таматах', group: 'fish', p: 15, f: 0, pl: 'szprot', aka: ['шпроты', 'кільку'] },
  { id: 'tuna', name: 'тунец', group: 'fish', p: 24, f: 0, pl: 'tuńczyk', aka: ['тунец'] },
  { id: 'herring', name: 'селядзец', group: 'fish', p: 17, f: 0, pl: 'śledź|śledzi', aka: ['селядзец', 'сельдь', 'селедка'] },
  { id: 'cod', name: 'трэска', group: 'fish', p: 18, f: 0, pl: 'dorsz|mintaj|miruna', aka: ['трэска', 'треска', 'минтай'] },

  // Птушка і мяса. Каўбасы правяраюцца першымі: «Parówki z fil. indyka» — гэта сасіскі, а не індычка.
  { id: 'ham', name: 'вяндліна', group: 'processed', p: 17, f: 0, pl: 'szynk|polędw|boczek|salami', aka: ['вяндліна', 'ветчина', 'шынка'] },
  { id: 'sausages', name: 'сасіскі', group: 'processed', p: 12, f: 0, pl: 'parów|kiełb', aka: ['сасіскі', 'сосиски', 'каўбаса', 'колбаса'] },
  { id: 'chicken_marinated', name: 'курыца ў марынадзе', group: 'poultry', p: 18, f: 0, pl: 'kurczak w marynac', aka: ['курыца ў марынадзе'] },
  { id: 'chicken_thigh', name: 'курыныя сцёгны', group: 'poultry', p: 17, f: 0, pl: 'udo|podudz|ćwiartk|skrzyd', aka: ['сцёгны', 'галёнкі', 'бедра', 'голени'] },
  { id: 'turkey', name: 'індычка', group: 'poultry', p: 22, f: 0, pl: 'indyk', aka: ['індычка', 'индейка'] },
  { id: 'chicken_breast', name: 'курыная грудка', group: 'poultry', p: 23, f: 0, pl: 'pier\\S* z kurcz|filet z pier\\S* kurcz|filet z kurcz|kurczak', aka: ['курыца', 'курыная грудка', 'курица', 'филе'] },
  { id: 'minced_meat', name: 'фарш', group: 'meat', p: 17, f: 0, pl: 'mięso miel', aka: ['фарш'] },
  { id: 'pork', name: 'свініна', group: 'meat', p: 20, f: 0, pl: 'schab|karków|łopatk', aka: ['свініна', 'свинина'] },
  { id: 'beef', name: 'ялавічына', group: 'meat', p: 20, f: 0, pl: 'wołow', aka: ['ялавічына', 'говядина'] },


  // Яйкі і малочка
  { id: 'eggs', name: 'яйкі', group: 'eggs', p: 13, f: 0, pl: 'jaj', aka: ['яйкі', 'яйкa', 'яйца', 'яйцо'] },
  { id: 'cottage', name: 'вясковы сырок', group: 'dairy', p: 11, f: 0, pl: 'serek wiejsk', aka: ['вясковы сырок', 'зярністы сыр', 'зернёный творог', 'сырок'] },
  { id: 'quark', name: 'тварог', group: 'dairy', p: 17, f: 0, pl: 'twaróg|twarog(?!\\.)', aka: ['тварог', 'творог'] },
  { id: 'cream_cheese', name: 'тварожны сырок', group: 'dairy', p: 8, f: 0, pl: 'serek (natur|homo|styl)|piątnica|łaciaty', aka: ['тварожны сырок', 'сыр для бутэрбродаў'] },
  { id: 'skyr', name: 'скір', group: 'dairy', p: 11, f: 0, pl: 'skyr', aka: ['скір', 'скыр'] },
  { id: 'yogurt', name: 'натуральны ёгурт', group: 'dairy', p: 4.3, f: 0, pl: 'jogurt natur', aka: ['ёгурт', 'йогурт'] },
  { id: 'kefir', name: 'кефір', group: 'dairy', p: 3.4, f: 0, pl: 'kefir', aka: ['кефір', 'кефир'] },
  { id: 'milk', name: 'малако', group: 'dairy', p: 3.3, f: 0, pl: 'mleko\\b', aka: ['малако', 'молоко'] },
  { id: 'goat_cheese', name: 'казіны сыр', group: 'dairy', p: 20, f: 0, pl: 'kozi|kozier', aka: ['казіны сыр', 'козий сыр'] },
  { id: 'feta', name: 'брынза', group: 'dairy', p: 17, f: 0, pl: 'favita|feta|sałatkow', aka: ['брынза', 'фета'] },
  { id: 'hard_cheese', name: 'цвёрды сыр', group: 'dairy', p: 25, f: 0, pl: 'gouda|cheddar|emment|ser żółt|edam|ser .*plastr', aka: ['сыр', 'цвёрды сыр', 'гауда'] },

  // Арэхі
  { id: 'pistachio', name: 'фісташкі', group: 'nuts', p: 20, f: 10, plant: true, pl: 'pistacj', aka: ['фісташкі', 'фисташки'] },
  { id: 'walnut', name: 'грэцкія арэхі', group: 'nuts', p: 15, f: 7, plant: true, pl: 'orzechy w(łos|\\b)|orzech włosk', aka: ['арэхі', 'грэцкія арэхі', 'орехи'] },
  { id: 'peanuts', name: 'арахіс', group: 'nuts', p: 26, f: 8, plant: true, pl: 'orzeszk|arachid', aka: ['арахіс', 'арахис'] },
  { id: 'peanut_butter', name: 'арахісавая паста', group: 'nuts', p: 25, f: 6, plant: true, pl: 'peanut butter|masło orzech', aka: ['арахісавая паста', 'арахисовая паста'] },
  { id: 'seeds', name: 'насенне', group: 'nuts', p: 21, f: 9, plant: true, pl: 'pestk|słonecz|siemi|chia|sezam', aka: ['насенне', 'семечки', 'семена'] },

  // Соусы
  { id: 'mustard', name: 'гарчыца', group: 'sauce', p: 6, f: 3, pl: 'musztard', aka: ['гарчыца', 'горчица'] },
  { id: 'tomato_passata', name: 'таматная паста', group: 'sauce', p: 1.5, f: 1.5, plant: true, pl: 'passat|przecier|koncentrat pomid|pomidory w puszc', aka: ['таматная паста', 'пасата', 'томаты в собственном соку'] },
];

export const BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

const compiled = PRODUCTS.map((p) => ({ p, re: new RegExp(p.pl, 'i') }));

// Польская назва з чэка → складнік ці null. Салодкае, напоі і не-ежа сюды не трапляюць наўмысна.
const NOT_FOOD_HINT = /czekol|kinder|cukier|żelk|pianki|prali|lody|baton|tic tac|jelly|deser(?!ow)|babka|piw|wino\b|likier|sok |nektar|karma|ręcznik|szczot|past[ay] |sensod|torba|reklam|kaucj|tulip|goździk|chips|wafl|star mix|serniczek/i;

export function matchReceiptName(name) {
  if (NOT_FOOD_HINT.test(name)) return null;
  const hit = compiled.find(({ re }) => re.test(name));
  return hit ? hit.p : null;
}

// Слова, набранае рукамі → складнік ці null.
export function matchTypedName(word) {
  const w = word.trim().toLowerCase();
  if (!w) return null;
  const exact = PRODUCTS.find((p) => p.name === w || p.aka.includes(w));
  if (exact) return exact;
  // Беларускія канчаткі мяняюцца, таму параўноўваем па пачатку слова.
  const stem = w.length > 4 ? w.slice(0, -1) : w;
  return PRODUCTS.find((p) => [p.name, ...p.aka].some((a) => a.startsWith(stem) || stem.startsWith(a))) || null;
}
