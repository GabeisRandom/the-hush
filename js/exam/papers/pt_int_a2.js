'use strict';
// The Academy's own integrated paper in Portuguese, level A2 (EX2, DESIGN.md 21.2 C; formats.js FORMATS.ptint), in the spirit
// of the Celpe-Bras: a writing task from a short report you watch and hear (a picture and a recording), one from a forum post
// you read, each saying who writes, to whom and what for; then an interview with a picture. Each part 0–5, the lower deciding.
// Our own bands. Brazilian Portuguese, the examiner with «você». Never the player's gender.
(() => {
  if (typeof MOCK === 'undefined') return;
  const id = s => 'pt.int.a2.' + s;
  const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

  MOCK.add('pt', 'ptint', 'A2', {
    sections: { escrita: [id('e1'), id('e2')], oral: [id('o1'), id('o2'), id('o3'), id('o4'), id('o5')] },
    tasks: [
      // ================================================================ Parte escrita (60 min): two integrated tasks
      { id: id('e1'), part: 'write', tarea: 1, title: ['Mutirão na praia do lago', 'A clean-up on the lake beach'], min: 50, max: 80,
        intro: ['Veja a imagem e ouça a reportagem da Rádio Alba (duas vezes). Depois, escreva para o seu amigo Caio.', 'Look at the picture and listen to the Radio Alba report (twice). Then write to your friend Caio.'],
        source: { pic: 'beach', voices: { reporter: { name: 'Repórter', pitch: 1.1 }, gilda: { name: 'Dona Gilda', pitch: 1.02 } },
          lines: [{ who: 'reporter', text: 'Neste sábado, às oito da manhã, tem mutirão de limpeza na praia do lago, em Remanso.', en: 'This Saturday at eight in the morning there’s a community clean-up on the lake beach in Remanso.' },
            { who: 'reporter', text: 'Os voluntários vão recolher o lixo da areia e da água. A prefeitura vai dar sacos e um almoço para todo mundo.', en: 'The volunteers will collect the rubbish from the sand and the water. The town hall will provide bags and lunch for everyone.' },
            { who: 'gilda', text: 'Quem quiser ajudar precisa trazer luvas, chapéu e uma garrafa de água. Crianças podem participar com os pais.', en: 'Anyone who wants to help needs to bring gloves, a hat and a bottle of water. Children can take part with their parents.' }] },
        frame: { genre: ['mensagem', 'a message'], from: ['você', 'you'], to: ['Caio, seu amigo', 'Caio, your friend'], purpose: ['convidar o Caio para o mutirão', 'to invite Caio to the clean-up'] },
        prompt: [['Na sua mensagem:', 'In your message:']],
        points: [{ t: ['explique o que é o mutirão;', 'explain what the clean-up is;'], want: { lemmas: ['limpar', 'limpeza', 'praia', 'lago', 'lixo', 'voluntário', 'mutirão', 'recolher', 'ajudar'] } },
          { t: ['diga quando e onde vai ser;', 'say when and where it is;'], want: { lemmas: DIAS.concat(['Remanso', 'hora', 'manhã', 'oito', 'praia']) } },
          { t: ['diga o que ele precisa levar e convide o Caio.', 'say what he needs to bring and invite Caio.'], want: { lemmas: ['levar', 'trazer', 'luva', 'chapéu', 'água', 'garrafa', 'vir', 'querer', 'juntos', 'comigo'] } }],
        model: 'Oi, Caio! Tudo bem? Neste sábado vai ter um mutirão de limpeza na praia do lago, em Remanso. Os voluntários vão recolher o lixo da areia e da água, e no final tem almoço para todo mundo. Começa às oito da manhã. Você precisa levar luvas, um chapéu e uma garrafa de água. Quer ir comigo? Eu passo na sua casa às sete e meia. Abraço!',
        weak: 'Oi Caio. Sábado praia. Tchau.' },
      { id: id('e2'), part: 'write', tarea: 2, title: ['Uma resposta no fórum', 'A reply on the forum'], min: 50, max: 80, kind: 'forum',
        intro: ['Leia a mensagem do Rafael no fórum «Vizinhos de Alba». Depois, responda a ele.', 'Read Rafael’s post on the “Alba neighbors” forum. Then reply to him.'],
        head: [['Fórum «Vizinhos de Alba» · Rafael_93', '“Alba neighbors” forum · Rafael_93']],
        text: [['Oi, pessoal! Eu me mudei para Alba há um mês, por causa do trabalho.', 'Hi, everyone! I moved to Alba a month ago for work.'],
          ['A cidade é linda, mas eu ainda não conheço ninguém e fico muito tempo sozinho em casa.', 'The town is beautiful, but I still don’t know anyone and I spend a lot of time alone at home.'],
          ['Vocês têm alguma dica para fazer amigos aqui? Eu gosto de esportes e de música.', 'Do you have any tips for making friends here? I like sport and music.']],
        frame: { genre: ['comentário no fórum', 'a forum reply'], from: ['você, que mora em Alba', 'you, a resident of Alba'], to: ['Rafael', 'Rafael'], purpose: ['dar dicas para fazer amigos', 'to give tips for making friends'] },
        prompt: [['Na sua resposta:', 'In your reply:']],
        points: [{ t: ['recomende dois lugares ou atividades;', 'recommend two places or activities;'], want: { lemmas: ['clube', 'curso', 'aula', 'time', 'grupo', 'coral', 'banda', 'feira', 'biblioteca', 'parque', 'voluntário', 'futebol', 'vôlei', 'academia', 'recomendar'] } },
          { t: ['explique por que essas ideias são boas;', 'explain why these ideas are good;'], want: { reason: true, lemmas: ['conhecer', 'gente', 'pessoa', 'amigo', 'legal', 'simpático', 'bom'] } },
          { t: ['ofereça ajuda ou convide o Rafael para alguma coisa.', 'offer help or invite Rafael to something.'], want: { lemmas: ['convidar', 'encontrar', 'tomar', 'café', 'mostrar', 'ajudar', 'juntos', 'comigo', 'querer', 'vir'] } }],
        model: 'Oi, Rafael! Bem-vindo a Alba! Como você gosta de esportes, eu recomendo o time de vôlei do parque, que joga todo domingo de manhã. Você também pode entrar no coral da praça, porque o pessoal é muito simpático e sempre sai junto depois dos ensaios. É um jeito ótimo de conhecer gente. Se você quiser, a gente pode tomar um café no sábado e eu te mostro a cidade. Abraço!',
        weak: 'Oi Rafael. Futebol. Tchau.' },

      // ================================================================ Parte oral (10 min): an interview with a picture
      { id: id('o1'), part: 'speak', tarea: 1,
        card: { title: ['Conversa: você', 'Conversation: about you'], lines: [['A examinadora faz algumas perguntas sobre a sua vida.', 'The examiner asks you a few questions about your life.']] },
        ask: [['Vamos começar. Há quanto tempo você estuda português? E por que você resolveu estudar?', 'Let’s begin. How long have you been studying Portuguese? And why did you decide to study it?']],
        simpler: ['Por que você estuda português?', 'Why do you study Portuguese?'], goal: 'Say how long you’ve studied Portuguese and why.',
        want: { reason: true, lemmas: ['estudar', 'aprender', 'português', 'ano', 'mês', 'gostar', 'querer', 'trabalho', 'viajar', 'música'], min: 10 },
        model: ['Eu comecei a estudar português há oito meses. Eu resolvi estudar porque adoro música brasileira e quero viajar pelo Brasil.', 'I started studying Portuguese eight months ago. I decided to study it because I love Brazilian music and want to travel around Brazil.'] },
      { id: id('o2'), part: 'speak', tarea: 1, ask: [['E como é um dia normal para você?', 'And what’s an ordinary day like for you?']],
        simpler: ['A que horas você acorda? O que você faz depois?', 'What time do you wake up? What do you do after that?'], goal: 'Describe an ordinary day (four or five things).',
        want: { lemmas: ['acordar', 'tomar', 'café', 'trabalhar', 'estudar', 'almoçar', 'jantar', 'dormir', 'sair', 'voltar', 'ir'], need: 2, min: 12 },
        model: ['Eu acordo às sete, tomo café e vou para o trabalho de ônibus. À tarde eu estudo português e à noite janto com a minha família.', 'I wake up at seven, have breakfast and take the bus to work. In the afternoon I study Portuguese, and in the evening I have dinner with my family.'] },
      { id: id('o3'), part: 'speak', tarea: 2,
        card: { title: ['Uma imagem: a festa na praça', 'A picture: the party in the square'], lines: [['Festa junina na praça de Alba: sábado, a partir das 18h. Comidas típicas, música e quadrilha!', 'June festival in Alba’s square: Saturday from 6 p.m. Traditional food, music and square dancing!']], pic: 'festival' },
        ask: [['Olhe a imagem e o cartaz. O que você vê? Como é essa festa?', 'Look at the picture and the poster. What do you see? What is this party like?']],
        simpler: ['Tem música? Tem comida? O que mais?', 'Is there music? Food? What else?'], goal: 'Describe the picture and say what the party is like.',
        want: { lemmas: '@pic', need: 2, min: 10 },
        model: ['É uma festa à noite, na praça. Tem lanternas, música, um bolo grande e presentes. Parece uma festa muito alegre.', 'It’s a night-time party in the square. There are lanterns, music, a big cake and presents. It looks like a very happy party.'] },
      { id: id('o4'), part: 'speak', tarea: 2, ask: [['No seu país tem festas parecidas? Como elas são?', 'Are there similar festivals in your country? What are they like?']],
        simpler: ['Tem festas na rua no seu país?', 'Are there street parties in your country?'], goal: 'Compare with festivals in your country.',
        want: { lemmas: ['festa', 'país', 'cidade', 'rua', 'música', 'comida', 'dançar', 'ter', 'parecido', 'diferente', 'igual'], min: 10 },
        model: ['Sim, no meu país tem festas de verão na rua. Elas são parecidas, porque tem música e comida, mas a gente não dança quadrilha.', 'Yes, in my country there are summer street parties. They’re similar, because there’s music and food, but we don’t do square dancing.'] },
      { id: id('o5'), part: 'speak', tarea: 2, ask: [['Conte de uma festa de que você participou. O que aconteceu?', 'Tell me about a party you went to. What happened?']],
        simpler: ['Qual foi a última festa que você foi?', 'What was the last party you went to?'], goal: 'Tell about a party you went to (in the past).',
        want: { time: 'past', any: true, min: 10 },
        model: ['No ano passado eu fui ao casamento da minha prima. A gente dançou a noite toda e comeu muito bem.', 'Last year I went to my cousin’s wedding. We danced all night and ate really well.'] },
    ],
  });
})();
