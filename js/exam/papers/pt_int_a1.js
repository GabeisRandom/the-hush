'use strict';
// The Academy's own integrated paper in Portuguese, level A1 (EX2, DESIGN.md 21.2 C; formats.js FORMATS.ptint), in the spirit
// of the Celpe-Bras: each writing task starts from something you hear or read and says who writes, to whom and what for; the
// oral part is a short interview with a picture to talk about. Each part is marked 0–5 and the lower one decides the band.
// Our own bands, not an official exam's. Brazilian Portuguese, the examiner with «você». Never the player's gender.
(() => {
  if (typeof MOCK === 'undefined') return;
  const id = s => 'pt.int.a1.' + s;

  MOCK.add('pt', 'ptint', 'A1', {
    sections: { escrita: [id('e1'), id('e2')], oral: [id('o1'), id('o2'), id('o3'), id('o4')] },
    tasks: [
      // ================================================================ Parte escrita (45 min): two integrated tasks
      { id: id('e1'), part: 'write', tarea: 1, title: ['Um convite da Bia', 'An invitation from Bia'], min: 25, max: 50,
        intro: ['Ouça a mensagem de voz da sua amiga Bia (duas vezes). Depois, responda à mensagem.', 'Listen to your friend Bia’s voice message (twice). Then reply to it.'],
        source: { voices: { bia: { name: 'Bia', pitch: 1.18 } },
          lines: [{ who: 'bia', text: 'Oi! Tudo bem? Sábado é o aniversário do meu irmão, o Davi.', en: 'Hi! How are you? Saturday is my brother Davi’s birthday.' },
            { who: 'bia', text: 'A festa é na minha casa, às sete da noite. Você pode vir?', en: 'The party is at my house, at seven in the evening. Can you come?' },
            { who: 'bia', text: 'Ah, e você pode levar um bolo ou um refrigerante? Me responde, tá? Beijo!', en: 'Oh, and could you bring a cake or a soda? Get back to me, OK? Love!' }] },
        frame: { genre: ['mensagem', 'a text message'], from: ['você', 'you'], to: ['Bia, sua amiga', 'Bia, your friend'], purpose: ['responder ao convite', 'to answer the invitation'] },
        prompt: [['Na sua mensagem:', 'In your message:']],
        points: [{ t: ['diga se você vai à festa;', 'say whether you’re going to the party;'], want: { lemmas: ['ir', 'poder', 'festa', 'claro', 'adorar', 'aniversário', 'sábado'] } },
          { t: ['diga o que você vai levar;', 'say what you’ll bring;'], want: { lemmas: ['levar', 'bolo', 'refrigerante', 'suco', 'doce', 'torta', 'pão'] } },
          { t: ['pergunte uma coisa sobre a festa.', 'ask something about the party.'], want: { lemmas: ['onde', 'qual', 'quando', 'que', 'endereço', 'presente', 'precisar', 'quem', 'hora'] } }],
        model: 'Oi, Bia! Valeu pelo convite! Claro que eu vou à festa do Davi no sábado. Eu posso levar um bolo de chocolate. Qual é o endereço da sua casa? E o que o Davi gosta de ganhar de presente? Beijo!',
        weak: 'Oi Bia. Bolo. Tchau.' },
      { id: id('e2'), part: 'write', tarea: 2, title: ['O clube de leitura', 'The book club'], min: 25, max: 50, kind: 'sign',
        intro: ['Leia o cartaz da biblioteca. Depois, escreva um e-mail para participar do clube.', 'Read the library poster. Then write an email to join the club.'],
        head: [['Biblioteca de Alba', 'Alba Library']],
        text: [['Clube de Leitura: toda quarta-feira, às 18h.', 'Book club: every Wednesday at 6 p.m.'], ['Este mês: livros sobre viagens.', 'This month: books about travel.'],
          ['Inscrição grátis por e-mail com a bibliotecária, Dona Lúcia.', 'Free sign-up by email with the librarian, Dona Lúcia.'], ['Traga um lanche para dividir!', 'Bring a snack to share!']],
        frame: { genre: ['e-mail', 'an email'], from: ['você', 'you'], to: ['Dona Lúcia, a bibliotecária', 'Dona Lúcia, the librarian'], purpose: ['se inscrever no clube de leitura', 'to sign up for the book club'] },
        prompt: [['No seu e-mail:', 'In your email:']],
        points: [{ t: ['apresente-se;', 'introduce yourself;'], want: { lemmas: ['chamar', 'nome', 'ser', 'morar', 'estudar', 'trabalhar'] } },
          { t: ['diga por que você quer participar;', 'say why you want to join;'], want: { reason: true, lemmas: ['gostar', 'adorar', 'ler', 'livro', 'viagem', 'viajar', 'querer', 'participar'] } },
          { t: ['faça uma pergunta sobre o clube.', 'ask a question about the club.'], want: { lemmas: ['precisar', 'comprar', 'livro', 'qual', 'onde', 'quanto', 'poder', 'trazer'] } }],
        model: 'Olá, Dona Lúcia! Meu nome é Alex e eu moro em Alba. Eu quero participar do clube de leitura porque eu adoro ler e gosto muito de viagens. Eu preciso comprar o livro do mês? Até quarta-feira!',
        weak: 'Olá. Eu quero clube. Tchau.' },

      // ================================================================ Parte oral (10 min): a short interview
      { id: id('o1'), part: 'speak', tarea: 1,
        card: { title: ['Conversa: você', 'Conversation: about you'], lines: [['A examinadora faz algumas perguntas sobre você.', 'The examiner asks you a few questions about yourself.']] },
        ask: [['Para começar, me fale um pouco de você: como você se chama, de onde você é e onde você mora?', 'To start, tell me a little about yourself: what’s your name, where are you from and where do you live?']],
        simpler: ['Qual é o seu nome? Onde você mora?', 'What’s your name? Where do you live?'], goal: 'Say your name, where you’re from and where you live.',
        want: { lemmas: ['chamar', 'nome', 'ser', 'morar', 'vir', 'país', 'cidade'], need: 2, min: 8 },
        model: ['Eu me chamo Alex. Eu sou do Canadá e moro em Alba, perto da praça.', 'My name is Alex. I’m from Canada and I live in Alba, near the square.'] },
      { id: id('o2'), part: 'speak', tarea: 1, ask: [['E o que você gosta de fazer no fim de semana?', 'And what do you like to do at the weekend?']],
        simpler: ['Você gosta de passear? De ler?', 'Do you like going out? Reading?'], goal: 'Say what you like doing at the weekend.',
        want: { lemmas: ['gostar', 'adorar', 'passear', 'ler', 'jogar', 'cozinhar', 'dormir', 'ver', 'sair', 'ir', 'nadar', 'correr', 'visitar'], min: 6 },
        model: ['No fim de semana eu gosto de passear no parque e de cozinhar com os meus amigos.', 'At the weekend I like walking in the park and cooking with my friends.'] },
      { id: id('o3'), part: 'speak', tarea: 2,
        card: { title: ['Uma imagem: a feira', 'A picture: the market'], lines: [['Feira de Alba: todo domingo, frutas, legumes e flores.', 'Alba market: every Sunday, fruit, vegetables and flowers.']], pic: 'market' },
        ask: [['Olhe a imagem. O que tem nessa feira?', 'Look at the picture. What is there at this market?']],
        simpler: ['Você vê frutas? O que mais?', 'Do you see fruit? What else?'], goal: 'Say what you see at the market (three things or more).',
        want: { lemmas: '@pic', need: 2, min: 6 },
        model: ['Na feira tem maçãs, peras, laranjas, pão e queijo. Também tem flores e um gato.', 'At the market there are apples, pears, oranges, bread and cheese. There are also flowers and a cat.'] },
      { id: id('o4'), part: 'speak', tarea: 2, ask: [['Você gosta de ir à feira? O que você compra?', 'Do you like going to the market? What do you buy?']],
        simpler: ['Você compra frutas na feira?', 'Do you buy fruit at the market?'], goal: 'Say whether you like markets and what you buy.',
        want: { lemmas: ['gostar', 'comprar', 'fruta', 'feira', 'mercado', 'ir', 'legume', 'pão', 'queijo', 'flor', 'maçã', 'banana'], min: 6 },
        model: ['Sim, eu gosto muito. Eu sempre compro frutas, pão e às vezes flores para a minha casa.', 'Yes, I like it a lot. I always buy fruit and bread, and sometimes flowers for my home.'] },
    ],
  });
})();
