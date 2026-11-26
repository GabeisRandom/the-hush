'use strict';
// The world vocabulary of the slice, in Latin American Spanish, Brazilian Portuguese and
// standard German. g = grammatical gender per language; art = a special article (el agua).
// alt = other forms accepted when you teach Mimo.
// zh (Mandarin, Simplified) and ja are written in the CJK.md notation: [汉字|pīn yīn] / [漢字|かんじ] with
// okurigana outside, tokens split by single spaces. cl = the usual measure word (zh) or counter (ja), in
// the same notation; a ja counter shows its bare reading (本 ほん, 匹 ひき), which changes after some
// numbers (一本 いっぽん, 三本 さんぼん, 三匹 さんびき). zh/ja have no plural forms, so pl.zh / pl.ja repeat
// the word ({w.key:pl} must still work), and they need no g or art.

const WORDS = [
  { id: 'w.hello', es: 'hola', pt: 'oi', de: 'hallo', en: 'hello', zh: '[你好|nǐ hǎo]', ja: 'こんにちは', icon: 'wave', alt: { pt: ['olá'], zh: ['[您好|nín hǎo]'] } },
  { id: 'w.tree', es: 'árbol', pt: 'árvore', de: 'Baum', en: 'tree', zh: '[树|shù]', ja: '[木|き]', g: { es: 'm', pt: 'f', de: 'm' }, cl: { zh: '[棵|kē]', ja: '[本|ほん]' }, icon: 'tree' },
  { id: 'w.flower', es: 'flor', pt: 'flor', de: 'Blume', en: 'flower', zh: '[花|huā]', ja: '[花|はな]', g: { es: 'f', pt: 'f', de: 'f' }, cl: { zh: '[朵|duǒ]', ja: '[本|ほん]' }, icon: 'flower' },
  { id: 'w.water', es: 'agua', pt: 'água', de: 'Wasser', en: 'water', zh: '[水|shuǐ]', ja: '[水|みず]', g: { es: 'f', pt: 'f', de: 'n' }, art: { es: 'el' }, cl: { zh: '[杯|bēi]', ja: '[杯|はい]' }, icon: 'water', alt: { ja: ['お[水|みず]'] } },
  { id: 'w.train', es: 'tren', pt: 'trem', de: 'Zug', en: 'train', zh: '[火车|huǒ chē]', ja: '[電車|でんしゃ]', g: { es: 'm', pt: 'm', de: 'm' }, cl: { zh: '[列|liè]' }, icon: 'train', alt: { ja: ['[汽車|きしゃ]', '[列車|れっしゃ]'] } },
  { id: 'w.stone', es: 'piedra', pt: 'pedra', de: 'Stein', en: 'stone', zh: '[石头|shí tou]', ja: '[石|いし]', g: { es: 'f', pt: 'f', de: 'm' }, cl: { zh: '[块|kuài]', ja: '[個|こ]' }, icon: 'stone' },
  { id: 'w.mushroom', es: 'hongo', pt: 'cogumelo', de: 'Pilz', en: 'mushroom', zh: '[蘑菇|mó gu]', ja: 'きのこ', g: { es: 'm', pt: 'm', de: 'm' }, cl: { zh: '[个|gè]', ja: '[本|ほん]' }, icon: 'mushroom', alt: { es: ['seta'] },
    pl: { es: 'hongos', pt: 'cogumelos', de: 'Pilze', zh: '[蘑菇|mó gu]', ja: 'きのこ' } },
  { id: 'w.fox', es: 'zorro', pt: 'raposa', de: 'Fuchs', en: 'fox', zh: '[狐狸|hú li]', ja: 'きつね', g: { es: 'm', pt: 'f', de: 'm' }, cl: { zh: '[只|zhī]', ja: '[匹|ひき]' }, icon: 'fox' },
  { id: 'w.bird', es: 'pájaro', pt: 'pássaro', de: 'Vogel', en: 'bird', zh: '[鸟|niǎo]', ja: '[鳥|とり]', g: { es: 'm', pt: 'm', de: 'm' }, cl: { zh: '[只|zhī]', ja: '[羽|わ]' }, icon: 'bird', alt: { pt: ['passarinho'], zh: ['[小鸟|xiǎo niǎo]'], ja: ['[小鳥|ことり]'] } },
  { id: 'w.bridge', es: 'puente', pt: 'ponte', de: 'Brücke', en: 'bridge', zh: '[桥|qiáo]', ja: '[橋|はし]', g: { es: 'm', pt: 'f', de: 'f' }, cl: { zh: '[座|zuò]' }, icon: 'bridge' },
  { id: 'w.star', es: 'estrella', pt: 'estrela', de: 'Stern', en: 'star', zh: '[星星|xīng xing]', ja: '[星|ほし]', g: { es: 'f', pt: 'f', de: 'm' }, cl: { zh: '[颗|kē]' }, icon: 'star' },
  { id: 'w.apple', es: 'manzana', pt: 'maçã', de: 'Apfel', en: 'apple', zh: '[苹果|píng guǒ]', ja: 'りんご', g: { es: 'f', pt: 'f', de: 'm' }, cl: { zh: '[个|gè]', ja: '[個|こ]' }, icon: 'apple', pl: { es: 'manzanas', pt: 'maçãs', de: 'Äpfel', zh: '[苹果|píng guǒ]', ja: 'りんご' } },
  { id: 'w.house', es: 'casa', pt: 'casa', de: 'Haus', en: 'house', zh: '[房子|fáng zi]', ja: '[家|いえ]', g: { es: 'f', pt: 'f', de: 'n' }, cl: { zh: '[座|zuò]', ja: '[軒|けん]' }, icon: 'house', alt: { zh: ['[家|jiā]'], ja: ['うち'] } },
  { id: 'w.letter', es: 'carta', pt: 'carta', de: 'Brief', en: 'letter', zh: '[信|xìn]', ja: '[手紙|てがみ]', g: { es: 'f', pt: 'f', de: 'm' }, cl: { zh: '[封|fēng]', ja: '[通|つう]' }, icon: 'letter' },
  { id: 'w.bread', es: 'pan', pt: 'pão', de: 'Brot', en: 'bread', zh: '[面包|miàn bāo]', ja: 'パン', g: { es: 'm', pt: 'm', de: 'n' }, cl: { zh: '[个|gè]', ja: '[個|こ]' }, icon: 'bread', pl: { es: 'panes', pt: 'pães', de: 'Brote', zh: '[面包|miàn bāo]', ja: 'パン' } },
  { id: 'w.tower', es: 'torre', pt: 'torre', de: 'Turm', en: 'tower', zh: '[塔|tǎ]', ja: '[塔|とう]', g: { es: 'f', pt: 'f', de: 'm' }, cl: { zh: '[座|zuò]' }, icon: 'tower' },
];
LEX.register(WORDS.map(w => Object.assign({ kind: 'word' }, w)));

// Everyday words people use around you. You don't teach these to Mimo: they come into what
// people say a few at a time, in this order, sooner if you're learning fast (the weave,
// DESIGN.md 12.4). f = the form a woman uses or the feminine form, where it differs.
const CHUNKS = [
  { id: 'c.yes', es: 'sí', pt: 'sim', de: 'ja', en: 'yes', zh: '[对|duì]', ja: 'はい' },
  { id: 'c.thanks', es: 'gracias', pt: 'obrigado', de: 'danke', en: 'thank you', zh: '[谢谢|xiè xie]', ja: 'ありがとう', f: { pt: 'obrigada' } },
  { id: 'c.please', es: 'por favor', pt: 'por favor', de: 'bitte', en: 'please', zh: '[请|qǐng]', ja: 'お[願|ねが]い します' },
  { id: 'c.verygood', es: 'muy bien', pt: 'muito bem', de: 'sehr gut', en: 'very good', zh: '[很|hěn] [好|hǎo]', ja: 'とても いい' },
  { id: 'c.friend', es: 'amigo', pt: 'amigo', de: 'Freund', en: 'friend', zh: '[朋友|péng you]', ja: '[友達|ともだち]', f: { es: 'amiga', pt: 'amiga', de: 'Freundin' } },
  { id: 'c.three', es: 'tres', pt: 'três', de: 'drei', en: 'three', zh: '[三|sān]', ja: '[三|さん]' },
  { id: 'c.forest', es: 'bosque', pt: 'floresta', de: 'Wald', en: 'forest', zh: '[森林|sēn lín]', ja: '[森|もり]' },
  { id: 'c.north', es: 'norte', pt: 'norte', de: 'Norden', en: 'north', zh: '[北边|běi biān]', ja: '[北|きた]' },
  { id: 'c.village', es: 'pueblo', pt: 'vila', de: 'Dorf', en: 'village', zh: '[村子|cūn zi]', ja: '[村|むら]' },
  { id: 'c.silence', es: 'silencio', pt: 'silêncio', de: 'Stille', en: 'silence', zh: '[寂静|jì jìng]', ja: '[静寂|せいじゃく]' },
  { id: 'c.look', es: 'mira', pt: 'olha', de: 'schau', en: 'look', zh: '[看|kàn]', ja: '[見|み]て' },
  { id: 'c.wait', es: 'espera', pt: 'espera', de: 'warte', en: 'wait', zh: '[等等|děng deng]', ja: '[待|ま]って' },
  { id: 'c.letsgo', es: 'vamos', pt: 'bora', de: 'los', en: "let's go", zh: '[走|zǒu] [吧|ba]', ja: '[行|い]こう' },
  { id: 'c.field', es: 'campo', pt: 'campo', de: 'Feld', en: 'field', zh: '[田野|tián yě]', ja: '[野原|のはら]' },
  { id: 'c.hill', es: 'colina', pt: 'morro', de: 'Hügel', en: 'hill', zh: '[山坡|shān pō]', ja: '[丘|おか]' },
];
LEX.register(CHUNKS.map((c, i) => Object.assign({ kind: 'chunk', rank: i }, c)));
