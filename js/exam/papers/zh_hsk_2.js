'use strict';
// A practice paper in the format of HSK level 2 (EX2, DESIGN.md 21.2 C; formats.js FORMATS.hsk). Our own sentences and
// questions in CJK.md's notation, with HSK 2's words. 听力 (4 parts, 35 items: a sentence against a picture, dialogues to
// pictures in two groups, short dialogues, longer dialogues) and 阅读 (4 parts, 25 items: sentences to pictures, a word bank,
// a sentence and its ★ statement, replies in two groups). No speaking or writing: the cover says so. Shapes: exam.js.
(() => {
  if (typeof MOCK === 'undefined') return;
  const YN = [['✓', 'right'], ['✗', 'wrong']];
  const pj = (icon, key, words) => ({ type: 'tf', icon, key, labels: YN, words: words || [] });
  const star = (ask, key, words) => ({ type: 'tf', ask, key, labels: YN, words: words || [] });
  const mc = (ask, opts, words) => ({ type: 'mc', ask, opts, key: 0, words: words || [] });
  const LET = n => 'ABCDEF'.slice(0, n).split('').map(c => [c, c]);
  const id = s => 'zh.hsk.2.' + s;
  const V = { nan: { name: '[男|nán]', pitch: 0.88 }, nv: { name: '[女|nǚ]', pitch: 1.16 } };
  const say = (who, text, en) => ({ who, text, en });
  const clip = (n, lines) => ({ label: [String(n), String(n)], lines });
  const Q = '[问|wèn] ： ';

  MOCK.add('zh', 'hsk', '2', {
    sections: { tingli: [id('t1'), id('t2'), id('t3'), id('t4')], yuedu: [id('y1'), id('y2'), id('y3'), id('y4')] },
    tasks: [
      // ================================================================ 听力 (about 25 min, 35 items, each recording twice)
      { id: id('t1'), part: 'listen', tarea: 1, title: ['[听|tīng] [句子|jù zi] ， [看|kàn] [图片|tú piàn]', 'Listen to the sentences, look at the pictures'],
        intro: ['[听|tīng] [录音|lù yīn] ， [判断|pàn duàn] [对|duì] [错|cuò] ： [和|hé] [图片|tú piàn] [一样|yī yàng] [的|de] [选|xuǎn] ✓ ， [不|bù] [一样|yī yàng] [的|de] [选|xuǎn] ✗ （ 1–10 ） 。', 'Listen and judge: ✓ if it matches the picture, ✗ if not (1–10).'],
        voices: V,
        clips: [clip(1, [say('nv', '[今天|jīn tiān] [天气|tiān qì] [很|hěn] [好|hǎo] ， [是|shì] [晴天|qíng tiān] 。', 'The weather is lovely today, it’s sunny.')]),
          clip(2, [say('nan', '[她|tā] [正在|zhèng zài] [唱歌|chàng gē] 。', 'She’s singing.')]),
          clip(3, [say('nv', '[桌子|zhuō zi] [上|shang] [有|yǒu] [两|liǎng] [个|gè] [鸡蛋|jī dàn] 。', 'There are two eggs on the table.')]),
          clip(4, [say('nan', '[外面|wài miàn] [在|zài] [下雪|xià xuě] 。', 'It’s snowing outside.')]),
          clip(5, [say('nv', '[他|tā] [在|zài] [吃|chī] [面条|miàn tiáo] 。', 'He’s eating noodles.')]),
          clip(6, [say('nan', '[我|wǒ] [喜欢|xǐ huan] [喝|hē] [牛奶|niú nǎi] 。', 'I like drinking milk.')]),
          clip(7, [say('nv', '[鱼|yú] [在|zài] [水|shuǐ] [里|lǐ] 。', 'The fish is in the water.')]),
          clip(8, [say('nan', '[这|zhè] [件|jiàn] [衣服|yī fu] [是|shì] [红色|hóng sè] [的|de] 。', 'This piece of clothing is red.')]),
          clip(9, [say('nv', '[这|zhè] [是|shì] [送|sòng] [给|gěi] [你|nǐ] [的|de] [礼物|lǐ wù] 。', 'This is a present for you.')]),
          clip(10, [say('nan', '[我们|wǒ men] [坐|zuò] [公共汽车|gōng gòng qì chē] [去|qù] [吧|ba] 。', 'Let’s take the bus.')])],
        items: [pj('sc_sun', true, ['[晴天|qíng tiān]']), pj('mic', true, ['[唱歌|chàng gē]']), pj('cake', false, ['[鸡蛋|jī dàn]']), pj('snow', true, ['[下雪|xià xuě]']), pj('gm_noodles', true, ['[面条|miàn tiáo]']),
          pj('coffee', false, ['[牛奶|niú nǎi]']), pj('fish', true, ['[鱼|yú]']), pj('hat', false, ['[衣服|yī fu]']), pj('gift', true, ['[礼物|lǐ wù]']), pj('train', false, ['[公共汽车|gōng gòng qì chē]'])] },

      { id: id('t2'), part: 'listen', tarea: 2, title: ['[听|tīng] [对话|duì huà] ， [选|xuǎn] [图片|tú piàn]', 'Listen to the dialogues, choose the pictures'],
        intro: ['[听|tīng] [对话|duì huà] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [图片|tú piàn] （ 11–20 ） 。', 'Listen to the dialogues and choose the right picture (11–20).'],
        voices: V,
        clips: [clip(11, [say('nv', '[你|nǐ] [的|de] [手机|shǒu jī] [呢|ne] ？', 'Where’s your phone?'), say('nan', '[在|zài] [桌子|zhuō zi] [上|shang] ， [你|nǐ] [看|kàn] 。', 'On the table, look.')]),
          clip(12, [say('nan', '[你|nǐ] [怎么|zěn me] [了|le] ？', 'What’s the matter?'), say('nv', '[我|wǒ] [生病|shēng bìng] [了|le] ， [今天|jīn tiān] [在|zài] [床|chuáng] [上|shang] [休息|xiū xi] 。', 'I’m ill, I’m resting in bed today.')]),
          clip(13, [say('nv', '[这|zhè] [些|xiē] [花|huā] [是|shì] [你|nǐ] [买|mǎi] [的|de] [吗|ma] ？ [真|zhēn] [漂亮|piào liang] ！', 'Did you buy these flowers? They’re beautiful!'), say('nan', '[是|shì] [送|sòng] [给|gěi] [你|nǐ] [的|de] 。', 'They’re for you.')]),
          clip(14, [say('nan', '[喂|wéi] ， [你|nǐ] [到|dào] [机场|jī chǎng] [了|le] [吗|ma] ？', 'Hello, are you at the airport yet?'), say('nv', '[还|hái] [没有|méi yǒu] ， [我|wǒ] [还|hái] [在|zài] [出租车|chū zū chē] [上|shang] 。', 'Not yet, I’m still in the taxi.')]),
          clip(15, [say('nv', '[你|nǐ] [看|kàn] ， [这|zhè] [只|zhī] [猫|māo] [在|zài] [睡觉|shuì jiào] 。', 'Look, this cat is sleeping.'), say('nan', '[它|tā] [睡|shuì] [得|de] [真|zhēn] [好|hǎo] 。', 'It’s sleeping so well.')]),
          clip(16, [say('nan', '[你|nǐ] [在|zài] [做|zuò] [什么|shén me] ？', 'What are you doing?'), say('nv', '[我|wǒ] [在|zài] [准备|zhǔn bèi] [考试|kǎo shì] ， [看|kàn] [书|shū] [呢|ne] 。', 'I’m preparing for an exam, I’m reading.')]),
          clip(17, [say('nv', '[你|nǐ] [喜欢|xǐ huan] [什么|shén me] [运动|yùn dòng] ？', 'What sport do you like?'), say('nan', '[我|wǒ] [最|zuì] [喜欢|xǐ huan] [游泳|yóu yǒng] 。', 'I like swimming best.')]),
          clip(18, [say('nan', '[快|kuài] [点|diǎn] [儿|r] ， [电影|diàn yǐng] [七|qī] [点|diǎn] [开始|kāi shǐ] 。', 'Hurry up, the film starts at seven.'), say('nv', '[现在|xiàn zài] [六|liù] [点|diǎn] [半|bàn] ， [还|hái] [有|yǒu] [半|bàn] [个|gè] [小时|xiǎo shí] 。', 'It’s half past six, there’s still half an hour.')]),
          clip(19, [say('nv', '[生日|shēng rì] [快乐|kuài lè] ！ [这|zhè] [是|shì] [给|gěi] [你|nǐ] [的|de] [蛋糕|dàn gāo] 。', 'Happy birthday! This cake is for you.'), say('nan', '[谢谢|xiè xie] ！ [我|wǒ] [很|hěn] [高兴|gāo xìng] 。', 'Thank you! I’m so happy.')]),
          clip(20, [say('nan', '[外面|wài miàn] [下雨|xià yǔ] [了|le] [吗|ma] ？', 'Is it raining outside?'), say('nv', '[是|shì] [的|de] ， [雨|yǔ] [很|hěn] [大|dà] ， [别|bié] [出去|chū qù] [了|le] 。', 'Yes, it’s pouring, don’t go out.')])],
        items: [{ type: 'match', letters: true, ask: ['11 – 15 ： [选|xuǎn] [图片|tú piàn] （ A – F ， [有|yǒu] [一|yī] [张|zhāng] [不用|bù yòng] ）', '11–15: choose the picture (A–F, one isn’t used)'], labels: LET(6), icons: ['flower', 'cat', 'fmPhone', 'apple', 'sc_car', 'bed'], words: ['[手机|shǒu jī]', '[漂亮|piào liang]'],
          pairs: [[['11', '11'], 2], [['12', '12'], 5], [['13', '13'], 0], [['14', '14'], 4], [['15', '15'], 1]] },
          { type: 'match', letters: true, ask: ['16 – 20 ： [选|xuǎn] [图片|tú piàn] （ A – E ）', '16–20: choose the picture (A–E)'], labels: LET(5), icons: ['cake', 'sc_rain', 'book', 'swim', 'clock'], words: ['[游泳|yóu yǒng]', '[蛋糕|dàn gāo]'],
            pairs: [[['16', '16'], 2], [['17', '17'], 3], [['18', '18'], 4], [['19', '19'], 0], [['20', '20'], 1]] }] },

      { id: id('t3'), part: 'listen', tarea: 3, title: ['[听|tīng] [对话|duì huà] ， [回答|huí dá] [问题|wèn tí]', 'Listen to the dialogues, answer the questions'],
        intro: ['[听|tīng] [对话|duì huà] [和|hé] [问题|wèn tí] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [答案|dá àn] （ 21–30 ） 。', 'Listen to the dialogue and the question, and choose the right answer (21–30).'],
        voices: V,
        clips: [clip(21, [say('nv', '[你|nǐ] [下午|xià wǔ] [去|qù] [哪|nǎ] [儿|r] ？', 'Where are you going this afternoon?'), say('nan', '[我|wǒ] [要|yào] [去|qù] [机场|jī chǎng] [接|jiē] [我|wǒ] [妹妹|mèi mei] 。', 'I’m going to the airport to pick up my younger sister.'), say('nv', Q + '[男|nán] [的|de] [下午|xià wǔ] [要|yào] [做|zuò] [什么|shén me] ？', 'Question: what is the man doing this afternoon?')]),
          clip(22, [say('nan', '[这|zhè] [件|jiàn] [衣服|yī fu] [多少|duō shao] [钱|qián] ？', 'How much is this piece of clothing?'), say('nv', '[三百|sān bǎi] [块|kuài] ， [太|tài] [贵|guì] [了|le] 。', 'Three hundred kuai, too expensive.'), say('nan', Q + '[女|nǚ] [的|de] [觉得|jué de] [这|zhè] [件|jiàn] [衣服|yī fu] [怎么样|zěn me yàng] ？', 'Question: what does the woman think of it?')]),
          clip(23, [say('nv', '[你|nǐ] [哥哥|gē ge] [在|zài] [哪|nǎ] [儿|r] [工作|gōng zuò] ？', 'Where does your older brother work?'), say('nan', '[他|tā] [在|zài] [医院|yī yuàn] [工作|gōng zuò] ， [是|shì] [医生|yī shēng] 。', 'He works at the hospital, he’s a doctor.'), say('nv', Q + '[哥哥|gē ge] [是|shì] [做|zuò] [什么|shén me] [的|de] ？', 'Question: what does the brother do?')]),
          clip(24, [say('nan', '[你|nǐ] [怎么|zěn me] [来|lái] [得|de] [这么|zhè me] [晚|wǎn] ？', 'Why are you so late?'), say('nv', '[路|lù] [上|shang] [车|chē] [太|tài] [多|duō] [了|le] 。', 'There was too much traffic on the road.'), say('nan', Q + '[女|nǚ] [的|de] [为什么|wèi shén me] [来|lái] [晚|wǎn] [了|le] ？', 'Question: why was the woman late?')]),
          clip(25, [say('nv', '[你|nǐ] [学|xué] [汉语|Hàn yǔ] [多|duō] [长|cháng] [时间|shí jiān] [了|le] ？', 'How long have you been learning Chinese?'), say('nan', '[两|liǎng] [年|nián] [了|le] 。', 'Two years.'), say('nv', Q + '[男|nán] [的|de] [学|xué] [了|le] [多|duō] [长|cháng] [时间|shí jiān] ？', 'Question: how long has the man been learning?')]),
          clip(26, [say('nan', '[明天|míng tiān] [我们|wǒ men] [一起|yī qǐ] [去|qù] [跑步|pǎo bù] [吧|ba] ？', 'Shall we go running together tomorrow?'), say('nv', '[好|hǎo] [啊|a] ， [早上|zǎo shang] [七|qī] [点|diǎn] [在|zài] [公园|gōng yuán] [门口|mén kǒu] [见|jiàn] 。', 'Sure, see you at seven in the morning at the park entrance.'), say('nan', Q + '[他们|tā men] [明天|míng tiān] [在|zài] [哪|nǎ] [儿|r] [见面|jiàn miàn] ？', 'Question: where are they meeting tomorrow?')]),
          clip(27, [say('nv', '[你|nǐ] [要|yào] [咖啡|kā fēi] [还是|hái shi] [茶|chá] ？', 'Would you like coffee or tea?'), say('nan', '[我|wǒ] [晚上|wǎn shang] [不|bù] [喝|hē] [咖啡|kā fēi] ， [给|gěi] [我|wǒ] [一|yī] [杯|bēi] [茶|chá] [吧|ba] 。', 'I don’t drink coffee in the evening, give me a cup of tea.'), say('nv', Q + '[男|nán] [的|de] [要|yào] [喝|hē] [什么|shén me] ？', 'Question: what does the man want to drink?')]),
          clip(28, [say('nan', '[这|zhè] [个|gè] [字|zì] [你|nǐ] [认识|rèn shi] [吗|ma] ？', 'Do you know this character?'), say('nv', '[对不起|duì bu qǐ] ， [我|wǒ] [也|yě] [不|bù] [认识|rèn shi] 。 [问|wèn] [问|wen] [老师|lǎo shī] [吧|ba] 。', 'Sorry, I don’t know it either. Let’s ask the teacher.'), say('nan', Q + '[女|nǚ] [的|de] [是|shì] [什么|shén me] [意思|yì si] ？', 'Question: what does the woman mean?')]),
          clip(29, [say('nv', '[从|cóng] [这|zhè] [儿|r] [到|dào] [火车站|huǒ chē zhàn] [远|yuǎn] [吗|ma] ？', 'Is it far from here to the train station?'), say('nan', '[不|bù] [远|yuǎn] ， [走|zǒu] [十|shí] [分钟|fēn zhōng] [就|jiù] [到|dào] [了|le] 。', 'Not far, it’s a ten-minute walk.'), say('nv', Q + '[到|dào] [火车站|huǒ chē zhàn] [要|yào] [多|duō] [长|cháng] [时间|shí jiān] ？', 'Question: how long does it take to get to the station?')]),
          clip(30, [say('nan', '[你|nǐ] [的|de] [生日|shēng rì] [是|shì] [几|jǐ] [月|yuè] [几|jǐ] [号|hào] ？', 'What’s the date of your birthday?'), say('nv', '[九|jiǔ] [月|yuè] [十|shí] [号|hào] ， [就|jiù] [是|shì] [下|xià] [个|gè] [星期|xīng qī] 。', 'September tenth, it’s next week.'), say('nan', Q + '[女|nǚ] [的|de] [生日|shēng rì] [是|shì] [哪|nǎ] [天|tiān] ？', 'Question: when is the woman’s birthday?')])],
        items: [mc(['[男|nán] [的|de] [下午|xià wǔ] [要|yào] [做|zuò] [什么|shén me] ？', 'What is the man doing this afternoon?'], [['[接|jiē] [妹妹|mèi mei]', 'picking up his sister'], ['[去|qù] [上班|shàng bān]', 'going to work'], ['[买|mǎi] [机票|jī piào]', 'buying a plane ticket']], ['[接|jiē]']),
          mc(['[女|nǚ] [的|de] [觉得|jué de] [这|zhè] [件|jiàn] [衣服|yī fu] [怎么样|zěn me yàng] ？', 'What does the woman think of it?'], [['[很|hěn] [贵|guì]', 'very expensive'], ['[很|hěn] [便宜|pián yi]', 'very cheap'], ['[很|hěn] [漂亮|piào liang]', 'very pretty']], ['[贵|guì]']),
          mc(['[哥哥|gē ge] [是|shì] [做|zuò] [什么|shén me] [的|de] ？', 'What does the brother do?'], [['[医生|yī shēng]', 'a doctor'], ['[老师|lǎo shī]', 'a teacher'], ['[服务员|fú wù yuán]', 'a waiter']], ['[医生|yī shēng]']),
          mc(['[女|nǚ] [的|de] [为什么|wèi shén me] [来|lái] [晚|wǎn] [了|le] ？', 'Why was the woman late?'], [['[路|lù] [上|shang] [车|chē] [很|hěn] [多|duō]', 'there was a lot of traffic'], ['[她|tā] [起床|qǐ chuáng] [晚|wǎn] [了|le]', 'she got up late'], ['[她|tā] [生病|shēng bìng] [了|le]', 'she was ill']], ['[晚|wǎn]']),
          mc(['[男|nán] [的|de] [学|xué] [了|le] [多|duō] [长|cháng] [时间|shí jiān] ？', 'How long has the man been learning?'], [['[两|liǎng] [年|nián]', 'two years'], ['[两|liǎng] [个|gè] [月|yuè]', 'two months'], ['[三|sān] [年|nián]', 'three years']], ['[年|nián]']),
          mc(['[他们|tā men] [明天|míng tiān] [在|zài] [哪|nǎ] [儿|r] [见面|jiàn miàn] ？', 'Where are they meeting tomorrow?'], [['[公园|gōng yuán] [门口|mén kǒu]', 'at the park entrance'], ['[学校|xué xiào] [门口|mén kǒu]', 'at the school gate'], ['[女|nǚ] [的|de] [家|jiā]', 'at the woman’s home']], ['[公园|gōng yuán]']),
          mc(['[男|nán] [的|de] [要|yào] [喝|hē] [什么|shén me] ？', 'What does the man want to drink?'], [['[茶|chá]', 'tea'], ['[咖啡|kā fēi]', 'coffee'], ['[牛奶|niú nǎi]', 'milk']], ['[茶|chá]']),
          mc(['[女|nǚ] [的|de] [是|shì] [什么|shén me] [意思|yì si] ？', 'What does the woman mean?'], [['[她|tā] [不|bù] [认识|rèn shi] [这|zhè] [个|gè] [字|zì]', 'she doesn’t know the character'], ['[她|tā] [是|shì] [老师|lǎo shī]', 'she’s a teacher'], ['[她|tā] [不|bù] [想|xiǎng] [说|shuō]', 'she doesn’t want to say']], ['[认识|rèn shi]']),
          mc(['[到|dào] [火车站|huǒ chē zhàn] [要|yào] [多|duō] [长|cháng] [时间|shí jiān] ？', 'How long does it take to get to the station?'], [['[十|shí] [分钟|fēn zhōng]', 'ten minutes'], ['[一|yī] [个|gè] [小时|xiǎo shí]', 'an hour'], ['[五|wǔ] [分钟|fēn zhōng]', 'five minutes']], ['[分钟|fēn zhōng]']),
          mc(['[女|nǚ] [的|de] [生日|shēng rì] [是|shì] [哪|nǎ] [天|tiān] ？', 'When is the woman’s birthday?'], [['[九|jiǔ] [月|yuè] [十|shí] [号|hào]', 'September 10'], ['[十|shí] [月|yuè] [九|jiǔ] [号|hào]', 'October 9'], ['[九|jiǔ] [月|yuè] [四|sì] [号|hào]', 'September 4']], ['[生日|shēng rì]'])] },

      { id: id('t4'), part: 'listen', tarea: 4, title: ['[听|tīng] [长|cháng] [一点儿|yī diǎn r] [的|de] [对话|duì huà]', 'Listen to the longer dialogues'],
        intro: ['[听|tīng] [对话|duì huà] [和|hé] [问题|wèn tí] ， [选|xuǎn] [出|chū] [对|duì] [的|de] [答案|dá àn] （ 31–35 ） 。', 'Listen to the dialogue and the question, and choose the right answer (31–35).'],
        voices: V,
        clips: [clip(31, [say('nv', '[你好|nǐ hǎo] ， [我|wǒ] [想|xiǎng] [买|mǎi] [两|liǎng] [张|zhāng] [去|qù] [磨坊镇|Mò fáng zhèn] [的|de] [火车票|huǒ chē piào] 。', 'Hello, I’d like two train tickets to Molinar.'), say('nan', '[您|nín] [要|yào] [什么|shén me] [时候|shí hou] [的|de] ？', 'For when?'), say('nv', '[明天|míng tiān] [上午|shàng wǔ] [的|de] 。', 'Tomorrow morning.'), say('nan', '[上午|shàng wǔ] [的|de] [票|piào] [没有|méi yǒu] [了|le] ， [下午|xià wǔ] [两|liǎng] [点|diǎn] [的|de] [可以|kě yǐ] [吗|ma] ？', 'The morning tickets are sold out; is two in the afternoon OK?'), say('nv', '[可以|kě yǐ] 。', 'That’s fine.'), say('nan', Q + '[女|nǚ] [的|de] [什么|shén me] [时候|shí hou] [去|qù] [磨坊镇|Mò fáng zhèn] ？', 'Question: when is the woman going to Molinar?')]),
          clip(32, [say('nan', '[小|xiǎo] [王|Wáng] ， [你|nǐ] [今天|jīn tiān] [怎么|zěn me] [没|méi] [来|lái] [上班|shàng bān] ？', 'Xiao Wang, why didn’t you come to work today?'), say('nv', '[我|wǒ] [昨天|zuó tiān] [晚上|wǎn shang] [开始|kāi shǐ] [发烧|fā shāo] 。', 'I started running a fever last night.'), say('nan', '[去|qù] [医院|yī yuàn] [了|le] [吗|ma] ？', 'Did you go to the hospital?'), say('nv', '[去|qù] [了|le] ， [医生|yī shēng] [说|shuō] [要|yào] [休息|xiū xi] [两|liǎng] [天|tiān] 。', 'I did, the doctor says I need two days’ rest.'), say('nan', Q + '[小|xiǎo] [王|Wáng] [为什么|wèi shén me] [没|méi] [来|lái] [上班|shàng bān] ？', 'Question: why didn’t Xiao Wang come to work?')]),
          clip(33, [say('nv', '[明天|míng tiān] [是|shì] [妈妈|mā ma] [的|de] [生日|shēng rì] ， [我们|wǒ men] [送|sòng] [她|tā] [什么|shén me] ？', 'Tomorrow is Mom’s birthday; what shall we give her?'), say('nan', '[送|sòng] [她|tā] [一|yī] [块|kuài] [手表|shǒu biǎo] [怎么样|zěn me yàng] ？', 'How about a watch?'), say('nv', '[她|tā] [已经|yǐ jīng] [有|yǒu] [手表|shǒu biǎo] [了|le] 。 [她|tā] [最近|zuì jìn] [喜欢|xǐ huan] [看|kàn] [书|shū] ， [我们|wǒ men] [送|sòng] [她|tā] [几|jǐ] [本|běn] [书|shū] [吧|ba] 。', 'She already has a watch. She likes reading lately; let’s give her a few books.'), say('nan', '[好|hǎo] [主意|zhǔ yi] 。', 'Good idea.'), say('nv', Q + '[他们|tā men] [要|yào] [送|sòng] [妈妈|mā ma] [什么|shén me] ？', 'Question: what will they give Mom?')]),
          clip(34, [say('nan', '[今天|jīn tiān] [比|bǐ] [昨天|zuó tiān] [冷|lěng] [多|duō] [了|le] 。', 'Today is much colder than yesterday.'), say('nv', '[是|shì] [啊|a] ， [听说|tīng shuō] [晚上|wǎn shang] [还|hái] [会|huì] [下雪|xià xuě] 。', 'Yes, I hear it might even snow tonight.'), say('nan', '[那|nà] [你|nǐ] [出去|chū qù] [的|de] [时候|shí hou] [多|duō] [穿|chuān] [点|diǎn] [儿|r] [衣服|yī fu] 。', 'Then wear more clothes when you go out.'), say('nv', Q + '[今天|jīn tiān] [天气|tiān qì] [怎么样|zěn me yàng] ？', 'Question: what’s the weather like today?')]),
          clip(35, [say('nv', '[儿子|ér zi] ， [作业|zuò yè] [做|zuò] [完|wán] [了|le] [吗|ma] ？', 'Son, have you finished your homework?'), say('nan', '[还|hái] [没有|méi yǒu] ， [还|hái] [有|yǒu] [两|liǎng] [个|gè] [题|tí] 。', 'Not yet, there are two questions left.'), say('nv', '[做|zuò] [完|wán] [作业|zuò yè] [再|zài] [看|kàn] [电视|diàn shì] 。', 'Finish your homework before you watch TV.'), say('nan', '[知道|zhī dào] [了|le] ， [妈妈|mā ma] 。', 'OK, Mom.'), say('nv', Q + '[儿子|ér zi] [现在|xiàn zài] [应该|yīng gāi] [做|zuò] [什么|shén me] ？', 'Question: what should the son do now?')])],
        items: [mc(['[女|nǚ] [的|de] [什么|shén me] [时候|shí hou] [去|qù] [磨坊镇|Mò fáng zhèn] ？', 'When is the woman going to Molinar?'], [['[明天|míng tiān] [下午|xià wǔ]', 'tomorrow afternoon'], ['[明天|míng tiān] [上午|shàng wǔ]', 'tomorrow morning'], ['[今天|jīn tiān] [下午|xià wǔ]', 'this afternoon']], ['[火车票|huǒ chē piào]']),
          mc(['[小|xiǎo] [王|Wáng] [为什么|wèi shén me] [没|méi] [来|lái] [上班|shàng bān] ？', 'Why didn’t Xiao Wang come to work?'], [['[她|tā] [生病|shēng bìng] [了|le]', 'she’s ill'], ['[她|tā] [去|qù] [旅游|lǚ yóu] [了|le]', 'she went traveling'], ['[她|tā] [在|zài] [医院|yī yuàn] [工作|gōng zuò]', 'she works at the hospital']], ['[生病|shēng bìng]']),
          mc(['[他们|tā men] [要|yào] [送|sòng] [妈妈|mā ma] [什么|shén me] ？', 'What will they give Mom?'], [['[书|shū]', 'books'], ['[手表|shǒu biǎo]', 'a watch'], ['[衣服|yī fu]', 'clothes']], ['[送|sòng]']),
          mc(['[今天|jīn tiān] [天气|tiān qì] [怎么样|zěn me yàng] ？', 'What’s the weather like today?'], [['[很|hěn] [冷|lěng]', 'very cold'], ['[很|hěn] [热|rè]', 'very hot'], ['[在|zài] [下雨|xià yǔ]', 'it’s raining']], ['[冷|lěng]']),
          mc(['[儿子|ér zi] [现在|xiàn zài] [应该|yīng gāi] [做|zuò] [什么|shén me] ？', 'What should the son do now?'], [['[做|zuò] [作业|zuò yè]', 'his homework'], ['[看|kàn] [电视|diàn shì]', 'watch TV'], ['[睡觉|shuì jiào]', 'sleep']], ['[作业|zuò yè]'])] },

      // ================================================================ 阅读 (22 min, 25 items)
      { id: id('y1'), part: 'read', tarea: 1, title: ['[看|kàn] [句子|jù zi] ， [选|xuǎn] [图片|tú piàn]', 'Read the sentences, choose the pictures'],
        intro: ['[每|měi] [个|gè] [句子|jù zi] [是|shì] [哪|nǎ] [张|zhāng] [图片|tú piàn] （ A–F ） ？ [有|yǒu] [一|yī] [张|zhāng] [图片|tú piàn] [不用|bù yòng] （ 36–40 ） 。', 'Which picture (A–F) goes with each sentence? One picture isn’t used (36–40).'],
        text: [['[每|měi] [个|gè] [句子|jù zi] [选|xuǎn] [一|yī] [张|zhāng] [图片|tú piàn] 。', 'Choose one picture for each sentence.']],
        items: [{ type: 'match', letters: true, ask: ['[选|xuǎn] [图片|tú piàn] ：', 'Choose the picture:'], labels: LET(6), icons: ['snow', 'glasses', 'swim', 'gm_tea', 'cake', 'fmPhone'], words: ['[眼镜|yǎn jìng]', '[自己|zì jǐ]'],
          pairs: [[['36. [他|tā] [每|měi] [天|tiān] [早上|zǎo shang] [都|dōu] [去|qù] [游泳|yóu yǒng] 。', '36. He goes swimming every morning.'], 2],
            [['37. [我|wǒ] [给|gěi] [你|nǐ] [打|dǎ] [电话|diàn huà] [的|de] [时候|shí hou] ， [你|nǐ] [在|zài] [做|zuò] [什么|shén me] ？', '37. What were you doing when I phoned you?'], 5],
            [['38. [这|zhè] [是|shì] [我|wǒ] [自己|zì jǐ] [做|zuò] [的|de] [蛋糕|dàn gāo] ， [你|nǐ] [吃|chī] [一|yī] [块|kuài] [吧|ba] 。', '38. I made this cake myself, have a piece.'], 4],
            [['39. [外面|wài miàn] [雪|xuě] [下|xià] [得|de] [很|hěn] [大|dà] 。', '39. It’s snowing heavily outside.'], 0],
            [['40. [她|tā] [的|de] [眼睛|yǎn jing] [不|bù] [好|hǎo] ， [看|kàn] [书|shū] [要|yào] [戴|dài] [眼镜|yǎn jìng] 。', '40. Her eyes aren’t good; she needs glasses to read.'], 1]] }] },

      { id: id('y2'), part: 'read', tarea: 2, title: ['[选|xuǎn] [词|cí] [填空|tián kòng]', 'Fill in the blanks'],
        intro: ['[选|xuǎn] [词语|cí yǔ] （ A–F ） [填|tián] [空|kòng] 。 [有|yǒu] [一|yī] [个|gè] [词语|cí yǔ] [不用|bù yòng] （ 41–45 ） 。', 'Choose a word (A–F) for each blank. One word isn’t used (41–45).'],
        text: [['A [机场|jī chǎng] · B [便宜|pián yi] · C [准备|zhǔn bèi] · D [介绍|jiè shào] · E [已经|yǐ jīng] · F [旁边|páng biān]', 'A airport · B cheap · C prepare · D introduce · E already · F next to']],
        items: [{ type: 'match', letters: true, ask: ['[每|měi] [个|gè] [空|kòng] [填|tián] [哪|nǎ] [个|gè] [词|cí] ？', 'Which word goes in each blank?'], words: ['[便宜|pián yi]', '[介绍|jiè shào]', '[已经|yǐ jīng]'],
          labels: [['A [机场|jī chǎng]', 'A airport'], ['B [便宜|pián yi]', 'B cheap'], ['C [准备|zhǔn bèi]', 'C prepare'], ['D [介绍|jiè shào]', 'D introduce'], ['E [已经|yǐ jīng]', 'E already'], ['F [旁边|páng biān]', 'F next to']],
          pairs: [[['41. [这|zhè] [家|jiā] [商店|shāng diàn] [的|de] [东西|dōng xi] [很|hěn] （ ） ， [我|wǒ] [常常|cháng cháng] [来|lái] [这|zhè] [儿|r] [买|mǎi] 。', '41. The things in this shop are very ( ); I often come here to shop.'], 1],
            [['42. [我|wǒ] [来|lái] （ ） [一下|yī xià] ， [这|zhè] [是|shì] [我|wǒ] [的|de] [朋友|péng you] [小|xiǎo] [李|Lǐ] 。', '42. Let me ( ): this is my friend Xiao Li.'], 3],
            [['43. [飞机|fēi jī] [十|shí] [点|diǎn] [起飞|qǐ fēi] ， [我们|wǒ men] [八|bā] [点|diǎn] [到|dào] （ ） [就|jiù] [可以|kě yǐ] 。', '43. The plane takes off at ten; it’s fine if we get to the ( ) at eight.'], 0],
            [['44. [他|tā] （ ） [吃|chī] [过|guo] [饭|fàn] [了|le] ， [不|bù] [用|yòng] [等|děng] [他|tā] 。', '44. He has ( ) eaten; no need to wait for him.'], 4],
            [['45. [银行|yín háng] [就|jiù] [在|zài] [学校|xué xiào] （ ） ， [很|hěn] [近|jìn] 。', '45. The bank is right ( ) the school, very close.'], 5]] }] },

      { id: id('y3'), part: 'read', tarea: 3, title: ['[读|dú] [句子|jù zi] ， [判断|pàn duàn] ★ [句|jù]', 'Read the sentences, judge the ★ sentences'],
        intro: ['[先|xiān] [读|dú] [句子|jù zi] ， [再|zài] [判断|pàn duàn] ★ [句|jù] [对|duì] [不|bù] [对|duì] （ 46–50 ） 。', 'Read each sentence, then judge whether the ★ sentence is right (46–50).'],
        text: [['[每|měi] [题|tí] [有|yǒu] [一|yī] [个|gè] [句子|jù zi] [和|hé] [一|yī] [个|gè] ★ [句|jù] 。', 'Each question has a sentence and a ★ sentence.']],
        items: [star(['46. [现在|xiàn zài] [是|shì] [十一|shí yī] [点|diǎn] [三十|sān shí] [分|fēn] ， [他|tā] [已经|yǐ jīng] [游|yóu] [了|le] [半|bàn] [个|gè] [小时|xiǎo shí] [了|le] 。 ★ [他|tā] [十一|shí yī] [点|diǎn] [开始|kāi shǐ] [游泳|yóu yǒng] 。', '46. It’s 11:30 now and he has been swimming for half an hour. ★ He started swimming at eleven.'], true, ['[小时|xiǎo shí]']),
          star(['47. [我|wǒ] [会|huì] [跳舞|tiào wǔ] ， [但|dàn] [跳|tiào] [得|de] [不|bù] [怎么样|zěn me yàng] 。 ★ [我|wǒ] [跳|tiào] [得|de] [非常|fēi cháng] [好|hǎo] 。', '47. I can dance, but not very well. ★ I dance extremely well.'], false, ['[跳舞|tiào wǔ]']),
          star(['48. [我|wǒ] [姐姐|jiě jie] [比|bǐ] [我|wǒ] [大|dà] [三|sān] [岁|suì] ， [她|tā] [今年|jīn nián] [二十五|èr shí wǔ] [岁|suì] 。 ★ [我|wǒ] [今年|jīn nián] [二十二|èr shí èr] [岁|suì] 。', '48. My older sister is three years older than me; she’s twenty-five this year. ★ I’m twenty-two this year.'], true, ['[比|bǐ]']),
          star(['49. [今天|jīn tiān] [是|shì] [星期三|xīng qī sān] ， [我|wǒ] [后天|hòu tiān] [去|qù] [阿尔巴|Ā ěr bā] 。 ★ [我|wǒ] [星期五|xīng qī wǔ] [去|qù] [阿尔巴|Ā ěr bā] 。', '49. Today is Wednesday; I’m going to Alba the day after tomorrow. ★ I’m going to Alba on Friday.'], true, ['[后天|hòu tiān]']),
          star(['50. [这|zhè] [个|gè] [房间|fáng jiān] [太|tài] [小|xiǎo] [了|le] ， [我们|wǒ men] [换|huàn] [一|yī] [个|gè] [大|dà] [一点儿|yī diǎn r] [的|de] [吧|ba] 。 ★ [他们|tā men] [觉得|jué de] [房间|fáng jiān] [很|hěn] [大|dà] 。', '50. This room is too small; let’s change to a bigger one. ★ They think the room is big.'], false, ['[房间|fáng jiān]'])] },

      { id: id('y4'), part: 'read', tarea: 4, title: ['[找|zhǎo] [回答|huí dá]', 'Find the replies'],
        intro: ['[每|měi] [句|jù] [话|huà] [的|de] [回答|huí dá] [是|shì] [哪|nǎ] [一|yī] [句|jù] ？ 51–55 [有|yǒu] [一|yī] [个|gè] [回答|huí dá] [不用|bù yòng] 。', 'Which reply goes with each sentence? In 51–55 one reply isn’t used.'],
        text: [['[读|dú] [每|měi] [句|jù] [话|huà] ， [找|zhǎo] [最|zuì] [好|hǎo] [的|de] [回答|huí dá] 。', 'Read each sentence and find the best reply.']],
        items: [{ type: 'match', ask: ['51 – 55 ： [选|xuǎn] [回答|huí dá]', '51–55: choose the reply'], words: ['[一直|yī zhí]', '[练习|liàn xí]'],
          pairs: [[['51. [你|nǐ] [怎么|zěn me] [还|hái] [不|bù] [睡觉|shuì jiào] ？ [已经|yǐ jīng] [十二|shí èr] [点|diǎn] [了|le] 。', '51. Why aren’t you asleep yet? It’s already twelve.'], ['[我|wǒ] [的|de] [作业|zuò yè] [还|hái] [没|méi] [写|xiě] [完|wán] 。', 'I haven’t finished my homework.']],
            [['52. [这|zhè] [件|jiàn] [衣服|yī fu] [你|nǐ] [穿|chuān] [很|hěn] [漂亮|piào liang] 。', '52. That outfit looks lovely on you.'], ['[真|zhēn] [的|de] [吗|ma] ？ [那|nà] [我|wǒ] [就|jiù] [买|mǎi] [这|zhè] [件|jiàn] 。', 'Really? Then I’ll buy it.']],
            [['53. [你|nǐ] [知道|zhī dào] [去|qù] [火车站|huǒ chē zhàn] [怎么|zěn me] [走|zǒu] [吗|ma] ？', '53. Do you know how to get to the train station?'], ['[一直|yī zhí] [往|wǎng] [前|qián] [走|zǒu] ， [就|jiù] [在|zài] [右边|yòu bian] 。', 'Go straight ahead; it’s on the right.']],
            [['54. [你|nǐ] [的|de] [汉语|Hàn yǔ] [说|shuō] [得|de] [真|zhēn] [好|hǎo] ！', '54. Your Chinese is really good!'], ['[谢谢|xiè xie] ， [我|wǒ] [每|měi] [天|tiān] [都|dōu] [练习|liàn xí] 。', 'Thanks, I practice every day.']],
            [['55. [我们|wǒ men] [晚上|wǎn shang] [一起|yī qǐ] [去|qù] [看|kàn] [电影|diàn yǐng] [吧|ba] ？', '55. Shall we go to see a film together tonight?'], ['[好|hǎo] [啊|a] ， [几|jǐ] [点|diǎn] [的|de] ？', 'Sure, what time is it on?']]],
          extra: [['[他|tā] [是|shì] [我|wǒ] [的|de] [同学|tóng xué] 。', 'He’s my classmate.']] },
          { type: 'match', ask: ['56 – 60 ： [选|xuǎn] [回答|huí dá]', '56–60: choose the reply'], words: ['[下面|xià mian]', '[好吃|hǎo chī]'],
            pairs: [[['56. [外面|wài miàn] [太|tài] [冷|lěng] [了|le] 。', '56. It’s too cold outside.'], ['[那|nà] [我们|wǒ men] [别|bié] [出去|chū qù] [了|le] ， [在|zài] [家|jiā] [看|kàn] [电视|diàn shì] [吧|ba] 。', 'Then let’s not go out; let’s watch TV at home.']],
              [['57. [你|nǐ] [找|zhǎo] [到|dào] [你|nǐ] [的|de] [手机|shǒu jī] [了|le] [吗|ma] ？', '57. Did you find your phone?'], ['[找|zhǎo] [到|dào] [了|le] ， [在|zài] [椅子|yǐ zi] [下面|xià mian] 。', 'Yes, it was under the chair.']],
              [['58. [这|zhè] [个|gè] [菜|cài] [是|shì] [谁|shéi] [做|zuò] [的|de] ？ [真|zhēn] [好吃|hǎo chī] ！', '58. Who made this dish? It’s delicious!'], ['[是|shì] [我|wǒ] [爸爸|bà ba] [做|zuò] [的|de] 。', 'My dad made it.']],
              [['59. [你|nǐ] [等|děng] [了|le] [多|duō] [长|cháng] [时间|shí jiān] [了|le] ？', '59. How long have you been waiting?'], ['[没|méi] [多|duō] [长|cháng] [时间|shí jiān] ， [我|wǒ] [也|yě] [刚|gāng] [到|dào] 。', 'Not long, I just got here too.']],
              [['60. [祝|zhù] [你|nǐ] [生日|shēng rì] [快乐|kuài lè] ！', '60. Happy birthday!'], ['[谢谢|xiè xie] [你|nǐ] ， [请|qǐng] [吃|chī] [蛋糕|dàn gāo] 。', 'Thank you, please have some cake.']]] }] },
    ],
  });
})();
