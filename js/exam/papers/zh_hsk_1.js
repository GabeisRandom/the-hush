'use strict';
// A practice paper in the format of HSK level 1 (EX2, DESIGN.md 21.2 C; formats.js FORMATS.hsk). Our own sentences and
// questions, in CJK.md's notation ([字|pīn yīn], one syllable per character), with HSK 1's words. 听力 (4 parts, 20 items:
// a phrase against a picture, pick the picture, dialogues to pictures A–F, a sentence and a question) and 阅读 (4 parts,
// 20 items: a word against a picture, sentences to pictures, questions to answers, a word bank). No speaking or writing:
// the cover says so. Shapes: exam.js (EXAM.add).
(() => {
  if (typeof MOCK === 'undefined') return;
  const YN = [['✓', 'right'], ['✗', 'wrong']];
  const pj = (icon, key, ask, words) => Object.assign({ type: 'tf', icon, key, labels: YN, words: words || [] }, ask ? { ask } : {});
  const mc = (ask, opts, words, icons, picsOnly) => Object.assign({ type: 'mc', ask, opts, key: 0, words: words || [] }, icons ? { icons } : {}, picsOnly ? { picsOnly: true } : {});
  const LET = n => 'ABCDEF'.slice(0, n).split('').map(c => [c, c]);
  const id = s => 'zh.hsk.1.' + s;
  const V = { nan: { name: '[男|nán]', pitch: 0.88 }, nv: { name: '[女|nǚ]', pitch: 1.16 } };

  MOCK.add('zh', 'hsk', '1', {
    sections: { tingli: [id('t1'), id('t2'), id('t3'), id('t4')], yuedu: [id('y1'), id('y2'), id('y3'), id('y4')] },
    tasks: [
      // ================================================================ 听力 (about 15 min, 20 items, each recording twice)
      { id: id('t1'), part: 'listen', tarea: 1, title: ['[听|tīng] [词语|cí yǔ] ， [看|kàn] [图片|tú piàn]', 'Listen to the words, look at the pictures'],
        intro: ['[听|tīng] [录音|lù yīn] ， [判断|pàn duàn] [对|duì] [错|cuò] 。 [和|hé] [图片|tú piàn] [一样|yī yàng] [的|de] [选|xuǎn] ✓ ， [不|bù] [一样|yī yàng] [的|de] [选|xuǎn] ✗ （ 1–5 ） 。', 'Listen and judge: ✓ if it matches the picture, ✗ if it doesn’t (1–5).'],
        voices: V,
        clips: [{ label: ['1', '1'], lines: [{ who: 'nv', text: '[看|kàn] [书|shū]', en: 'read a book' }] },
          { label: ['2', '2'], lines: [{ who: 'nan', text: '[喝|hē] [茶|chá]', en: 'drink tea' }] },
          { label: ['3', '3'], lines: [{ who: 'nv', text: '[开|kāi] [车|chē]', en: 'drive a car' }] },
          { label: ['4', '4'], lines: [{ who: 'nan', text: '[下雨|xià yǔ]', en: 'it’s raining' }] },
          { label: ['5', '5'], lines: [{ who: 'nv', text: '[小|xiǎo] [猫|māo]', en: 'a kitten' }] }],
        items: [pj('book', true, null, ['[书|shū]']), pj('coffee', false, null, ['[茶|chá]']), pj('sc_car', true, null, ['[车|chē]']), pj('sc_sun', false, null, ['[下雨|xià yǔ]']), pj('cat', true, null, ['[猫|māo]'])] },

      { id: id('t2'), part: 'listen', tarea: 2, title: ['[听|tīng] [句子|jù zi] ， [选|xuǎn] [图片|tú piàn]', 'Listen to the sentences, choose the pictures'],
        intro: ['[听|tīng] [录音|lù yīn] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [图片|tú piàn] （ 6–10 ） 。', 'Listen and choose the right picture (6–10).'],
        voices: V,
        clips: [{ label: ['6', '6'], lines: [{ who: 'nan', text: '[我|wǒ] [想|xiǎng] [喝|hē] [水|shuǐ] 。', en: 'I’d like to drink some water.' }] },
          { label: ['7', '7'], lines: [{ who: 'nv', text: '[他|tā] [在|zài] [打|dǎ] [电话|diàn huà] 。', en: 'He’s making a phone call.' }] },
          { label: ['8', '8'], lines: [{ who: 'nan', text: '[这|zhè] [是|shì] [我|wǒ] [的|de] [猫|māo] 。', en: 'This is my cat.' }] },
          { label: ['9', '9'], lines: [{ who: 'nv', text: '[我|wǒ] [女儿|nǚ ér] [爱|ài] [吃|chī] [苹果|píng guǒ] 。', en: 'My daughter loves eating apples.' }] },
          { label: ['10', '10'], lines: [{ who: 'nan', text: '[今天|jīn tiān] [很|hěn] [热|rè] 。', en: 'It’s very hot today.' }] }],
        items: [mc(null, [['[水|shuǐ]', 'water'], ['[茶|chá]', 'tea'], ['[苹果|píng guǒ]', 'apple']], ['[水|shuǐ]'], ['water', 'gm_tea', 'apple'], true),
          mc(null, [['[打|dǎ] [电话|diàn huà]', 'phoning'], ['[看|kàn] [书|shū]', 'reading'], ['[睡觉|shuì jiào]', 'sleeping']], ['[电话|diàn huà]'], ['fmPhone', 'book', 'bed'], true),
          mc(null, [['[猫|māo]', 'cat'], ['[鱼|yú]', 'fish'], ['[鸟|niǎo]', 'bird']], ['[猫|māo]'], ['cat', 'fish', 'bird'], true),
          mc(null, [['[苹果|píng guǒ]', 'apples'], ['[米饭|mǐ fàn]', 'rice'], ['[面条|miàn tiáo]', 'noodles']], ['[苹果|píng guǒ]'], ['apple', 'gm_bowl', 'gm_noodles'], true),
          mc(null, [['[热|rè]', 'hot'], ['[冷|lěng]', 'cold'], ['[下雨|xià yǔ]', 'raining']], ['[热|rè]'], ['sc_sun', 'snow', 'sc_rain'], true)] },

      { id: id('t3'), part: 'listen', tarea: 3, title: ['[听|tīng] [对话|duì huà] ， [选|xuǎn] [图片|tú piàn]', 'Listen to the dialogues, choose the pictures'],
        intro: ['[听|tīng] [对话|duì huà] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [图片|tú piàn] （ A–F ） 。 [有|yǒu] [一|yī] [张|zhāng] [图片|tú piàn] [不用|bù yòng] （ 11–15 ） 。', 'Listen to the dialogues and choose the right picture (A–F). One picture isn’t used (11–15).'],
        voices: V,
        clips: [{ label: ['11', '11'], lines: [{ who: 'nan', text: '[你|nǐ] [在|zài] [哪|nǎ] [儿|r] ？', en: 'Where are you?' }, { who: 'nv', text: '[我|wǒ] [在|zài] [火车站|huǒ chē zhàn] 。', en: 'I’m at the train station.' }] },
          { label: ['12', '12'], lines: [{ who: 'nv', text: '[你|nǐ] [想|xiǎng] [吃|chī] [什么|shén me] ？', en: 'What would you like to eat?' }, { who: 'nan', text: '[我|wǒ] [想|xiǎng] [吃|chī] [米饭|mǐ fàn] 。', en: 'I’d like some rice.' }] },
          { label: ['13', '13'], lines: [{ who: 'nan', text: '[这|zhè] [本|běn] [书|shū] [多少|duō shao] [钱|qián] ？', en: 'How much is this book?' }, { who: 'nv', text: '[十|shí] [块|kuài] [钱|qián] 。', en: 'Ten kuai.' }] },
          { label: ['14', '14'], lines: [{ who: 'nv', text: '[现在|xiàn zài] [几|jǐ] [点|diǎn] ？', en: 'What time is it now?' }, { who: 'nan', text: '[三|sān] [点|diǎn] 。', en: 'Three o’clock.' }] },
          { label: ['15', '15'], lines: [{ who: 'nan', text: '[喂|wéi] ， [你好|nǐ hǎo] ！ [李|Lǐ] [老师|lǎo shī] [在|zài] [吗|ma] ？', en: 'Hello? Hi! Is Teacher Li there?' }, { who: 'nv', text: '[在|zài] ， [请|qǐng] [等|děng] [一下|yī xià] 。', en: 'Yes, one moment please.' }] }],
        items: [{ type: 'match', letters: true, ask: ['[每|měi] [个|gè] [对话|duì huà] [是|shì] [哪|nǎ] [张|zhāng] [图片|tú piàn] ？', 'Which picture goes with each dialogue?'], labels: LET(6), icons: ['train', 'clock', 'gm_bowl', 'cat', 'book', 'fmPhone'], words: ['[火车站|huǒ chē zhàn]', '[米饭|mǐ fàn]'],
          pairs: [[['11', '11'], 0], [['12', '12'], 2], [['13', '13'], 4], [['14', '14'], 1], [['15', '15'], 5]] }] },

      { id: id('t4'), part: 'listen', tarea: 4, title: ['[听|tīng] [句子|jù zi] ， [回答|huí dá] [问题|wèn tí]', 'Listen to the sentences, answer the questions'],
        intro: ['[听|tīng] [句子|jù zi] [和|hé] [问题|wèn tí] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [答案|dá àn] （ 16–20 ） 。', 'Listen to the sentence and the question, and choose the right answer (16–20).'],
        voices: V,
        clips: [{ label: ['16', '16'], lines: [{ who: 'nv', text: '[下午|xià wǔ] [我|wǒ] [去|qù] [商店|shāng diàn] [买|mǎi] [衣服|yī fu] 。', en: 'This afternoon I’m going to the shop to buy clothes.' }, { who: 'nan', text: '[问|wèn] ： [她|tā] [下午|xià wǔ] [去|qù] [哪|nǎ] [儿|r] ？', en: 'Question: where is she going this afternoon?' }] },
          { label: ['17', '17'], lines: [{ who: 'nan', text: '[我|wǒ] [的|de] [女儿|nǚ ér] [今年|jīn nián] [七|qī] [岁|suì] 。', en: 'My daughter is seven this year.' }, { who: 'nv', text: '[问|wèn] ： [他|tā] [的|de] [女儿|nǚ ér] [几|jǐ] [岁|suì] ？', en: 'Question: how old is his daughter?' }] },
          { label: ['18', '18'], lines: [{ who: 'nv', text: '[明天|míng tiān] [是|shì] [星期六|xīng qī liù] ， [我|wǒ] [不|bù] [工作|gōng zuò] 。', en: 'Tomorrow is Saturday, I’m not working.' }, { who: 'nan', text: '[问|wèn] ： [明天|míng tiān] [星期|xīng qī] [几|jǐ] ？', en: 'Question: what day is it tomorrow?' }] },
          { label: ['19', '19'], lines: [{ who: 'nan', text: '[王|Wáng] [先生|xiān sheng] [坐|zuò] [出租车|chū zū chē] [去|qù] [医院|yī yuàn] 。', en: 'Mr. Wang takes a taxi to the hospital.' }, { who: 'nv', text: '[问|wèn] ： [王|Wáng] [先生|xiān sheng] [怎么|zěn me] [去|qù] [医院|yī yuàn] ？', en: 'Question: how does Mr. Wang get to the hospital?' }] },
          { label: ['20', '20'], lines: [{ who: 'nv', text: '[我|wǒ] [爸爸|bà ba] [很|hěn] [喜欢|xǐ huan] [喝|hē] [茶|chá] 。', en: 'My dad really likes drinking tea.' }, { who: 'nan', text: '[问|wèn] ： [爸爸|bà ba] [喜欢|xǐ huan] [喝|hē] [什么|shén me] ？', en: 'Question: what does Dad like to drink?' }] }],
        items: [mc(['[她|tā] [下午|xià wǔ] [去|qù] [哪|nǎ] [儿|r] ？', 'Where is she going this afternoon?'], [['[商店|shāng diàn]', 'the shop'], ['[学校|xué xiào]', 'school'], ['[医院|yī yuàn]', 'the hospital']], ['[商店|shāng diàn]']),
          mc(['[他|tā] [的|de] [女儿|nǚ ér] [几|jǐ] [岁|suì] ？', 'How old is his daughter?'], [['[七|qī] [岁|suì]', 'seven'], ['[八|bā] [岁|suì]', 'eight'], ['[十|shí] [岁|suì]', 'ten']], ['[岁|suì]']),
          mc(['[明天|míng tiān] [星期|xīng qī] [几|jǐ] ？', 'What day is it tomorrow?'], [['[星期六|xīng qī liù]', 'Saturday'], ['[星期五|xīng qī wǔ]', 'Friday'], ['[星期日|xīng qī rì]', 'Sunday']], ['[星期六|xīng qī liù]']),
          mc(['[王|Wáng] [先生|xiān sheng] [怎么|zěn me] [去|qù] [医院|yī yuàn] ？', 'How does Mr. Wang get to the hospital?'], [['[坐|zuò] [出租车|chū zū chē]', 'by taxi'], ['[坐|zuò] [飞机|fēi jī]', 'by plane'], ['[坐|zuò] [火车|huǒ chē]', 'by train']], ['[出租车|chū zū chē]']),
          mc(['[爸爸|bà ba] [喜欢|xǐ huan] [喝|hē] [什么|shén me] ？', 'What does Dad like to drink?'], [['[茶|chá]', 'tea'], ['[水|shuǐ]', 'water'], ['[咖啡|kā fēi]', 'coffee']], ['[茶|chá]'])] },

      // ================================================================ 阅读 (17 min, 20 items)
      { id: id('y1'), part: 'read', tarea: 1, title: ['[看|kàn] [图片|tú piàn] [和|hé] [词语|cí yǔ]', 'Look at the pictures and the words'],
        intro: ['[看|kàn] [图片|tú piàn] [和|hé] [词语|cí yǔ] ， [判断|pàn duàn] [对|duì] [错|cuò] （ 21–25 ） 。', 'Look at the picture and the word: right or wrong (21–25)?'],
        text: [['[看|kàn] [每|měi] [张|zhāng] [图片|tú piàn] ： [词语|cí yǔ] [和|hé] [图片|tú piàn] [一样|yī yàng] [吗|ma] ？', 'Look at each picture: do the word and the picture match?']],
        items: [pj('cat', true, ['[猫|māo]', 'cat'], ['[猫|māo]']), pj('apple', false, ['[杯子|bēi zi]', 'cup'], ['[杯子|bēi zi]']), pj('chair', true, ['[椅子|yǐ zi]', 'chair'], ['[椅子|yǐ zi]']),
          pj('water', false, ['[米饭|mǐ fàn]', 'rice'], ['[米饭|mǐ fàn]']), pj('sc_rain', true, ['[下雨|xià yǔ]', 'rain'], ['[下雨|xià yǔ]'])] },

      { id: id('y2'), part: 'read', tarea: 2, title: ['[看|kàn] [句子|jù zi] ， [选|xuǎn] [图片|tú piàn]', 'Read the sentences, choose the pictures'],
        intro: ['[每|měi] [个|gè] [句子|jù zi] [是|shì] [哪|nǎ] [张|zhāng] [图片|tú piàn] （ A–F ） ？ [有|yǒu] [一|yī] [张|zhāng] [图片|tú piàn] [不用|bù yòng] （ 26–30 ） 。', 'Which picture (A–F) goes with each sentence? One picture isn’t used (26–30).'],
        text: [['[每|měi] [个|gè] [句子|jù zi] [选|xuǎn] [一|yī] [张|zhāng] [图片|tú piàn] 。', 'Choose one picture for each sentence.']],
        items: [{ type: 'match', letters: true, ask: ['[选|xuǎn] [图片|tú piàn] ：', 'Choose the picture:'], labels: LET(6), icons: ['bed', 'cup', 'sc_rain', 'train', 'apple', 'book'], words: ['[杯子|bēi zi]', '[睡觉|shuì jiào]'],
          pairs: [[['26. [我|wǒ] [很|hěn] [喜欢|xǐ huan] [这个|zhè ge] [杯子|bēi zi] 。', '26. I really like this cup.'], 1],
            [['27. [她|tā] [在|zài] [看|kàn] [书|shū] 。', '27. She’s reading.'], 5],
            [['28. [桌子|zhuō zi] [上|shang] [有|yǒu] [很|hěn] [多|duō] [苹果|píng guǒ] 。', '28. There are lots of apples on the table.'], 4],
            [['29. [儿子|ér zi] [在|zài] [床|chuáng] [上|shang] [睡觉|shuì jiào] 。', '29. My son is sleeping in bed.'], 0],
            [['30. [今天|jīn tiān] [下雨|xià yǔ] [了|le] 。', '30. It’s raining today.'], 2]] }] },

      { id: id('y3'), part: 'read', tarea: 3, title: ['[问题|wèn tí] [和|hé] [回答|huí dá]', 'Questions and answers'],
        intro: ['[每|měi] [个|gè] [问题|wèn tí] [的|de] [回答|huí dá] [是|shì] [哪|nǎ] [一|yī] [个|gè] （ A–F ） ？ [有|yǒu] [一|yī] [个|gè] [回答|huí dá] [不用|bù yòng] （ 31–35 ） 。', 'Which answer (A–F) goes with each question? One answer isn’t used (31–35).'],
        text: [['[读|dú] [问题|wèn tí] ， [找|zhǎo] [回答|huí dá] 。', 'Read the questions and find the answers.']],
        items: [{ type: 'match', ask: ['[选|xuǎn] [回答|huí dá] ：', 'Choose the answer:'], words: ['[名字|míng zi]', '[客气|kè qi]'],
          pairs: [[['31. [你|nǐ] [叫|jiào] [什么|shén me] [名字|míng zi] ？', '31. What’s your name?'], ['[我|wǒ] [叫|jiào] [李|Lǐ] [月|Yuè] 。', 'My name is Li Yue.']],
            [['32. [你|nǐ] [是|shì] [哪|nǎ] [国|guó] [人|rén] ？', '32. Where are you from?'], ['[我|wǒ] [是|shì] [中国|Zhōng guó] [人|rén] 。', 'I’m Chinese.']],
            [['33. [你|nǐ] [家|jiā] [有|yǒu] [几|jǐ] [个|gè] [人|rén] ？', '33. How many people are in your family?'], ['[四|sì] [个|gè] [人|rén] 。', 'Four.']],
            [['34. [你|nǐ] [什么|shén me] [时候|shí hou] [回来|huí lái] ？', '34. When are you coming back?'], ['[明天|míng tiān] [下午|xià wǔ] 。', 'Tomorrow afternoon.']],
            [['35. [谢谢|xiè xie] [你|nǐ] ！', '35. Thank you!'], ['[不|bù] [客气|kè qi] 。', 'You’re welcome.']]],
          extra: [['[我|wǒ] [会|huì] [做|zuò] [饭|fàn] 。', 'I can cook.']] }] },

      { id: id('y4'), part: 'read', tarea: 4, title: ['[选|xuǎn] [词|cí] [填空|tián kòng]', 'Fill in the blanks'],
        intro: ['[选|xuǎn] [词语|cí yǔ] （ A–F ） [填|tián] [空|kòng] 。 [有|yǒu] [一|yī] [个|gè] [词语|cí yǔ] [不用|bù yòng] （ 36–40 ） 。', 'Choose a word (A–F) for each blank. One word isn’t used (36–40).'],
        text: [['A [商店|shāng diàn] · B [坐|zuò] · C [名字|míng zi] · D [好|hǎo] · E [时候|shí hou] · F [喜欢|xǐ huan]', 'A shop · B sit · C name · D good · E time (when) · F like']],
        items: [{ type: 'match', letters: true, ask: ['[每|měi] [个|gè] [空|kòng] [填|tián] [哪|nǎ] [个|gè] [词|cí] ？', 'Which word goes in each blank?'], words: ['[商店|shāng diàn]', '[时候|shí hou]'],
          labels: [['A [商店|shāng diàn]', 'A shop'], ['B [坐|zuò]', 'B sit'], ['C [名字|míng zi]', 'C name'], ['D [好|hǎo]', 'D good'], ['E [时候|shí hou]', 'E time'], ['F [喜欢|xǐ huan]', 'F like']],
          pairs: [[['36. [我|wǒ] [想|xiǎng] [去|qù] （ ） [买|mǎi] [一些|yī xiē] [水果|shuǐ guǒ] 。', '36. I want to go to the ( ) to buy some fruit.'], 0],
            [['37. [请|qǐng] （ ） ， [喝|hē] [杯|bēi] [茶|chá] [吧|ba] 。', '37. Please ( ) down and have a cup of tea.'], 1],
            [['38. [她|tā] [的|de] （ ） [叫|jiào] [王|Wáng] [方|Fāng] 。', '38. Her ( ) is Wang Fang.'], 2],
            [['39. [今天|jīn tiān] [天气|tiān qì] [很|hěn] （ ） 。', '39. The weather is very ( ) today.'], 3],
            [['40. [你|nǐ] [什么|shén me] （ ） [去|qù] [北京|Běi jīng] ？', '40. ( ) are you going to Beijing?'], 4]] }] },
    ],
  });
})();
