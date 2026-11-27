'use strict';
// «O Eco do Vale», the weekly edition in Portuguese (paper.js is the engine; the shape is at the top of paper_es.js; the corner
// store's day paper has the same masthead, townlife.js). Brazilian Portuguese; B1 for editions 1–2, B2 for 3–4; Alba's own town
// life only, with threads from week to week (the community garden, Lourdinha's slide, the early rooster, the square's lights,
// the school owl). The reader is never gendered.

PAPER.add('pt', {
  mast: ['O Eco do Vale', 'The Valley Echo'], sub: ['Edição semanal', 'Weekly edition'], start: 3,
  labels: { lead: ['Capa', 'Front page'], news: ['Notícias de Alba', 'Alba news'], letter: ['Cartas dos leitores', 'Letters to the editor'], column: ['Coluna', 'Column'],
    ads: ['Classificados', 'Small ads'], weather: ['O tempo', 'The weather'], no: ['Nº', 'No.'], town: ['Alba', 'Alba'] },
  desk: { title: ['Da redação da Rádio Alba', 'From Radio Alba’s newsroom: your items for the six o’clock news'],
    empty: ['Em breve, nesta página: as notícias das seis da Rádio Alba.', 'Coming soon on this page: Radio Alba’s six o’clock items.'] },
  weather: { tags: ['warm', 'wet'], row: ['{d.name^}: {s.say}. {s.tip}', '{d.en}: {s.en}. {s.tipEn}'], rowT: ['{d.name^}: {s.say}, {s.n} graus. {s.tip}', '{d.en}: {s.en}, {s.n} degrees. {s.tipEn}'],
    ask: ['Segundo o jornal, como está o tempo {d.na}?', 'According to the paper, what’s the weather on {d.en}?'] },
  found: { ad: ['Perdeu {i.t} {p.em}? {i.def^} {i.esta} na biblioteca, com o Seu Benedito.', 'Lost {i.en} {p.enAt}? Ask Seu Benedito at the library.'],
    ask: ['Segundo os classificados, o que alguém perdeu {p.em}?', 'According to the ads, what did someone lose {p.enAt}?'] },
  tf: [['Verdadeiro', 'True'], ['Falso', 'False'], ['Não diz', 'It doesn’t say']],
  editions: [
    // ============================================================ Nº 1 (B1): the empty lot, books by bike, a letter about a slide
    { id: 'pt.p1', n: 1, band: 3,
      lead: { head: ['Terreno vazio vai virar horta comunitária', 'An empty lot will become a community vegetable garden'], by: ['Por Edgar Ramos', 'By Edgar Ramos'], text: [
        ['O terreno vazio atrás do mercado de Alba, que há anos só tinha mato e lixo, vai virar uma horta comunitária. A ideia foi aprovada pelos vizinhos na segunda-feira, e o trabalho começa no próximo sábado.', 'The empty lot behind Alba’s market, which for years held nothing but weeds and rubbish, is going to become a community vegetable garden. The neighbors approved the idea on Monday, and work starts next Saturday.'],
        ['O projeto é do Seu Arnaldo, um agricultor aposentado que mora em frente ao terreno. «Todo dia eu olhava para aquele mato e pensava: aqui cabe muita alface», contou ele, rindo.', 'The project is Seu Arnaldo’s, a retired farmer who lives across from the lot. “Every day I looked at those weeds and thought: there’s room for a lot of lettuce here,” he said, laughing.'],
        ['Cada família pode cuidar de um canteiro. As ferramentas ficam numa casinha de madeira, e a água vem de uma caixa que recolhe a chuva do telhado do mercado.', 'Each family can look after a bed. The tools are kept in a little wooden shed, and the water comes from a tank that collects the rain from the market’s roof.'],
        ['Quem não tem experiência não precisa se preocupar: aos sábados de manhã, o Seu Arnaldo vai dar aulas grátis de plantio. Ele só pede uma coisa: «Tragam chapéu e paciência».', 'Nobody without experience needs to worry: on Saturday mornings, Seu Arnaldo will give free planting lessons. He asks only one thing: “Bring a hat and patience.”'],
      ] },
      news: { head: ['Livros sobre duas rodas', 'Books on two wheels'], text: [
        ['Toda quarta-feira, o Seu Benedito, o bibliotecário de Alba, sai de bicicleta com uma cesta cheia de livros. Ele leva os livros até a casa das pessoas que não conseguem ir à biblioteca.', 'Every Wednesday, Seu Benedito, Alba’s librarian, sets off by bike with a basket full of books. He takes them to the homes of people who can’t get to the library.'],
        ['«Tem gente que mora sozinha e quase não sai de casa», explicou ele. «Um livro é uma visita que fica a semana inteira».', '“Some people live alone and hardly ever go out,” he explained. “A book is a visitor that stays all week.”'],
        ['Para receber a visita da bicicleta, basta deixar o nome e o endereço no balcão da biblioteca.', 'To get a visit from the bike, just leave your name and address at the library desk.'],
      ] },
      letter: { head: ['Um escorregador, por favor!', 'A slide, please!'], by: ['Lourdinha, 9 anos', 'Lourdinha, age 9'], text: [
        ['Querido jornal: eu tenho nove anos e moro perto do parque. O parque é muito bonito, tem árvores e um lago com patos, mas não tem escorregador.', 'Dear newspaper: I’m nine and I live near the park. The park is very pretty, it has trees and a pond with ducks, but it doesn’t have a slide.'],
        ['Na cidade da minha prima tem três escorregadores! Eu acho que as crianças de Alba também merecem um. Eu prometo dividir com todo mundo, até com o meu irmão chato.', 'In my cousin’s town there are three slides! I think Alba’s children deserve one too. I promise to share it with everyone, even with my annoying brother.'],
      ] },
      column: { head: ['Pergunte à veterinária', 'Ask the vet'], by: ['Dra. Zuleide Campos, veterinária', 'Dr. Zuleide Campos, vet'], text: [
        ['Uma leitora escreve: «Doutora, a minha gata me traz presentes toda manhã: folhas, gravetos e, uma vez, uma meia do vizinho. Por que ela faz isso?».', 'A reader writes: “Doctor, my cat brings me presents every morning: leaves, twigs and, once, a sock from next door. Why does she do that?”'],
        ['Querida leitora: é um sinal de carinho! Na natureza, os gatos levam comida para a família. A sua gata acha que você faz parte da família dela e quer ajudar. Agradeça com calma e, quando ela não estiver olhando, devolva a meia ao vizinho.', 'Dear reader: it’s a sign of affection! In the wild, cats bring food to their family. Your cat thinks you’re part of her family and wants to help. Thank her calmly and, when she isn’t looking, give the sock back to your neighbor.'],
      ] },
      ads: [
        ['Aulas de violão para iniciantes, terças e quintas à tarde. Falar com a Cidinha na pousada. A primeira aula é grátis.', 'Guitar lessons for beginners, Tuesday and Thursday afternoons. Talk to Cidinha at the inn. The first lesson is free.'],
        ['Vende-se bicicleta azul com cestinha, quase nova. Trinta moedas. Rua do mercado, número 4.', 'For sale: a blue bicycle with a little basket, almost new. Thirty coins. Market street, number 4.'],
        ['Procura-se ajuda para pintar o muro da escola no sábado. Pagamento: bolo de fubá para todo mundo e muito obrigado.', 'Help wanted to paint the school wall on Saturday. Payment: cornmeal cake for everyone and many thanks.'],
      ],
      items: [
        { type: 'short', ask: ['O que vai ter no terreno atrás do mercado?', 'What will there be on the lot behind the market?'], want: { lemmas: ['horta'] }, model: ['Vai ter uma horta comunitária.', 'There will be a community vegetable garden.'], at: 0 },
        { type: 'tfn', ask: ['O Seu Arnaldo vai cobrar pelas aulas de plantio.', 'Seu Arnaldo will charge for the planting lessons.'], key: false, at: 3 },
        { type: 'mc', ask: ['Por que o Seu Benedito leva livros de bicicleta?', 'Why does Seu Benedito deliver books by bike?'], opts: [['Para quem não consegue ir à biblioteca', 'For people who can’t get to the library'], ['Para vender livros velhos', 'To sell old books'], ['Para treinar para uma corrida', 'To train for a race']], key: 0, at: 4 },
        { type: 'mc', ask: ['O que a Lourdinha pede na carta?', 'What does Lourdinha ask for in her letter?'], opts: [['Um escorregador no parque', 'A slide in the park'], ['Um lago com patos', 'A pond with ducks'], ['Uma bicicleta nova', 'A new bike']], key: 0, at: 7 },
      ] },
    // ============================================================ Nº 2 (B1): the first harvest, the slide, the early rooster
    { id: 'pt.p2', n: 2, band: 3,
      lead: { head: ['A horta já deu a primeira colheita', 'The garden has given its first harvest'], by: ['Por Edgar Ramos', 'By Edgar Ramos'], text: [
        ['Seis semanas depois do primeiro dia de trabalho, a horta comunitária de Alba já deu a primeira colheita: alfaces, rabanetes e um monte de cheiro-verde.', 'Six weeks after the first day of work, Alba’s community garden has given its first harvest: lettuces, radishes and loads of fresh herbs.'],
        ['No sábado, as crianças que ajudaram montaram uma barraquinha no mercado e venderam tudo em menos de duas horas. Com o dinheiro, elas vão comprar sementes de tomate e de abóbora.', 'On Saturday, the children who helped set up a little stall at the market and sold everything in under two hours. With the money, they’ll buy tomato and pumpkin seeds.'],
        ['«O rabanete é rápido: fica pronto em um mês. Por isso a gente começou com ele, porque criança não gosta de esperar», explicou o Seu Arnaldo.', '“Radishes are quick: they’re ready in a month. That’s why we started with them, because kids don’t like waiting,” Seu Arnaldo explained.'],
        ['Nem tudo deu certo: as lesmas comeram metade das couves. Agora, à noite, alguns voluntários passam pela horta com lanternas para tirar as lesmas, uma por uma.', 'Not everything went well: the slugs ate half the kale. Now, at night, some volunteers go round the garden with flashlights to pick the slugs off, one by one.'],
      ] },
      news: { head: ['O parque ganhou um escorregador', 'The park got a slide'], text: [
        ['A carta da Lourdinha, de nove anos, publicada neste jornal, teve resposta. O Seu Inácio, carpinteiro, leu a carta e construiu um escorregador de madeira para o parque.', 'Nine-year-old Lourdinha’s letter, published in this paper, got an answer. Seu Inácio, a carpenter, read it and built a wooden slide for the park.'],
        ['Na inauguração, a Lourdinha foi a primeira a escorregar, como era justo. Logo depois desceu o irmão dela, aquele que ela chamou de chato. Ele riu e disse que vai perdoar.', 'At the opening, Lourdinha was the first to slide, as was only fair. Right after her came her brother, the one she called annoying. He laughed and said he’ll forgive her.'],
        ['O Seu Inácio pediu que os adultos não usem o escorregador. «Ele aguenta criança, não aguenta adulto com saudade da infância», brincou.', 'Seu Inácio asked grown-ups not to use the slide. “It can take children, not grown-ups missing their childhood,” he joked.'],
      ] },
      letter: { head: ['O galo que acorda a rua', 'The rooster that wakes the street'], by: ['Edite M., vizinha da rua do mercado', 'Edite M., who lives on the market street'], text: [
        ['Senhores do Eco: o galo do meu vizinho começa a cantar às quatro da manhã. Não às seis, como um galo educado: às quatro! E canta até as seis, sem parar.', 'Dear Echo: my neighbor’s rooster starts crowing at four in the morning. Not at six, like a well-mannered rooster: at four! And it crows until six, nonstop.'],
        ['Eu gosto de animais e não quero briga com ninguém. Só peço uma solução, porque a rua inteira está com olheiras. Alguém tem uma ideia?', 'I like animals and I don’t want to fall out with anyone. I’m just asking for a solution, because the whole street has bags under its eyes. Does anyone have an idea?'],
      ] },
      column: { head: ['A dica do Seu Benedito', 'Seu Benedito’s pick'], by: ['Benedito Arruda, bibliotecário', 'Benedito Arruda, librarian'], text: [
        ['Muitas famílias me perguntam qual livro ler com crianças pequenas. A minha resposta é sempre a mesma: um livro curto, com uma história que faz rir.', 'Lots of families ask me what book to read with small children. My answer is always the same: a short book, with a story that makes you laugh.'],
        ['Esta semana, eu recomendo «O Saci e os óculos da vovó», na estante dos primeiros passos. É uma lenda que eu mesmo recontei, com frases curtinhas. Leiam em voz alta, de preferência pulando num pé só, como o Saci.', 'This week I recommend «The Saci and Grandma’s glasses», on the first-steps shelf. It’s a legend I retold myself, in nice short sentences. Read it out loud, ideally hopping on one foot, like the Saci.'],
      ] },
      ads: [
        ['Aulas de culinária para iniciantes, aos sábados às dez, na pousada. Tragam avental e muita vontade.', 'Cooking classes for beginners, Saturdays at ten, at the inn. Bring an apron and lots of enthusiasm.'],
        ['O Seu Haroldo procura parceiros para jogar xadrez à tarde. Ele fica no banco grande da praça.', 'Seu Haroldo is looking for people to play chess with in the afternoons. He sits on the big bench in the square.'],
        ['Ofereço ajuda com a lição de matemática para crianças. Falar com a Zilda, na casa verde perto do lago.', 'I offer help with math homework for children. Talk to Zilda, in the green house by the pond.'],
      ],
      items: [
        { type: 'mc', ask: ['O que a horta deu na primeira colheita?', 'What did the garden give in its first harvest?'], opts: [['Alfaces, rabanetes e cheiro-verde', 'Lettuces, radishes and fresh herbs'], ['Tomates e abóboras', 'Tomatoes and pumpkins'], ['Batatas e cenouras', 'Potatoes and carrots']], key: 0, at: 0 },
        { type: 'short', ask: ['O que as crianças vão comprar com o dinheiro?', 'What will the children buy with the money?'], want: { lemmas: ['semente'] }, model: ['Elas vão comprar sementes de tomate e de abóbora.', 'They’ll buy tomato and pumpkin seeds.'], at: 1 },
        { type: 'tfn', ask: ['O escorregador do parque é de metal.', 'The park’s slide is made of metal.'], key: false, at: 4 },
        { type: 'mc', ask: ['A que horas o galo começa a cantar?', 'What time does the rooster start crowing?'], opts: [['Às quatro da manhã', 'At four in the morning'], ['Às seis da manhã', 'At six in the morning'], ['À meia-noite', 'At midnight']], key: 0, at: 7 },
      ] },
    // ============================================================ Nº 3 (B2): the square's lights, the school owl, the rooster's owner
    { id: 'pt.p3', n: 3, band: 4,
      lead: { head: ['As luzes da praça devem ficar acesas a noite toda? Alba discute', 'Should the square’s lights stay on all night? Alba debates'], by: ['Por Edgar Ramos', 'By Edgar Ramos'], text: [
        ['A prefeitura de Alba quer economizar energia e propôs apagar as luzes da praça à meia-noite. A proposta vai ser discutida na quinta-feira, numa reunião aberta, e já divide a cidade.', 'Alba’s town hall wants to save energy and has proposed turning off the square’s lights at midnight. The proposal will be discussed on Thursday at an open meeting, and it already divides the town.'],
        ['Quem é a favor lembra que a conta de luz da cidade subiu muito, e que a essa hora quase ninguém passa pela praça. O clube de astronomia da escola também gostou da ideia: «Com a praça escura, dá para ver a Via Láctea», disse uma das alunas, animada.', 'Those in favor point out that the town’s electricity bill has gone up a lot, and that at that hour hardly anyone crosses the square. The school’s astronomy club liked the idea too: “With the square dark, you can see the Milky Way,” one of the students said excitedly.'],
        ['Outros não estão tão convencidos. A dona da padaria, que começa a trabalhar às quatro da manhã, diz que tem medo de atravessar a praça no escuro. «Não sou contra economizar», explicou, «mas ninguém deveria ter medo de ir trabalhar».', 'Others aren’t so sure. The bakery’s owner, who starts work at four in the morning, says she’s afraid of crossing the square in the dark. “I’m not against saving,” she explained, “but nobody should be afraid of going to work.”'],
        ['A reunião vai ser na quinta-feira, às sete da noite, no salão da prefeitura. Qualquer morador pode falar, desde que peça a palavra e respeite o tempo dos outros.', 'The meeting will be on Thursday at seven in the evening, in the town hall. Any resident can speak, as long as they ask for the floor and respect everyone else’s time.'],
      ] },
      news: { head: ['Uma coruja na quadra da escola', 'An owl on the school’s sports field'], text: [
        ['Os alunos da escola de Alba têm uma vizinha nova: uma coruja-buraqueira fez um ninho num canto da quadra de esportes. A ave passa o dia na porta do buraco, olhando tudo com os olhos amarelos.', 'The students at Alba’s school have a new neighbor: a burrowing owl has made a nest in a corner of the sports field. The bird spends the day at the entrance of its burrow, watching everything with its yellow eyes.'],
        ['Para proteger o ninho, a turma do quinto ano cercou o canto com uma cordinha e fez uma placa: «Devagar: coruja em casa». Agora, as partidas de futebol acontecem do outro lado da quadra.', 'To protect the nest, the fifth graders roped off the corner and made a sign: “Slow down: owl at home.” Now the soccer games happen on the other side of the field.'],
        ['A veterinária da cidade explicou que a coruja-buraqueira é tranquila e ajuda a controlar os insetos. «O melhor presente que vocês podem dar para ela é distância», disse.', 'The town vet explained that the burrowing owl is calm and helps keep insects down. “The best present you can give her is distance,” she said.'],
      ] },
      letter: { head: ['Resposta sobre o galo', 'A reply about the rooster'], by: ['Gerôncio S., o dono do galo', 'Gerôncio S., the rooster’s owner'], text: [
        ['Senhores do Eco: eu li a carta da minha vizinha sobre o meu galo, e ela tem toda a razão. Peço desculpas à rua inteira. O galo é novo e ainda não aprendeu a hora certa.', 'Dear Echo: I read my neighbor’s letter about my rooster, and she’s absolutely right. I apologize to the whole street. The rooster is young and hasn’t learned the right time yet.'],
        ['Conversei com um criador de galinhas, que me deu uma ideia simples: cobrir o galinheiro com um pano escuro à noite e só tirar o pano às seis. Já faz três dias, e agora o galo canta às seis em ponto. A rua dorme, e eu também.', 'I talked to a chicken farmer, who gave me a simple idea: cover the coop with a dark cloth at night and only take it off at six. It’s been three days, and now the rooster crows at six on the dot. The street sleeps, and so do I.'],
      ] },
      column: { head: ['Pergunte à veterinária', 'Ask the vet'], by: ['Dra. Zuleide Campos, veterinária', 'Dr. Zuleide Campos, vet'], text: [
        ['Um leitor escreve: «Doutora, o meu cachorro morre de medo de trovão. Quando chove, ele se esconde debaixo da cama e treme a noite inteira. O que eu posso fazer?».', 'A reader writes: “Doctor, my dog is terrified of thunder. When it rains, he hides under the bed and shakes all night. What can I do?”'],
        ['Querido leitor: muitos cachorros sentem a mesma coisa. Prepare um cantinho escuro e tranquilo, com a caminha dele e uma roupa velha com o seu cheiro. Durante a tempestade, fique por perto e fale com calma, mas sem exagerar no carinho: assim ele entende que não tem perigo. E, se o medo continuar, venha me ver no consultório.', 'Dear reader: lots of dogs feel the same. Set up a dark, quiet corner with his bed and an old piece of clothing that smells of you. During the storm, stay close and talk calmly, but don’t overdo the cuddles: that way he understands there’s no danger. And if the fear goes on, come and see me at the clinic.'],
      ] },
      ads: [
        ['O coral de Alba procura vozes novas, principalmente graves. Ensaios às quartas, às seis, no pátio da escola. Não precisa saber ler partitura.', 'Alba’s choir is looking for new voices, especially low ones. Rehearsals on Wednesdays at six, in the school courtyard. No need to read music.'],
        ['Troca de sementes na horta comunitária, aos domingos. Traga as suas e leve outras. Tem de tomate, de pimenta e de abóbora.', 'Seed swap at the community garden, on Sundays. Bring yours and take others home. There are tomato, pepper and pumpkin seeds.'],
        ['Aluga-se quarto ensolarado para uma pessoa, com café da manhã. Perto da praça. Informações na vendinha da esquina.', 'Sunny room for rent for one person, breakfast included. Near the square. Ask at the corner store.'],
      ],
      items: [
        { type: 'mc', ask: ['O que a prefeitura propõe?', 'What does the town hall propose?'], opts: [['Apagar as luzes da praça à meia-noite', 'Turning off the square’s lights at midnight'], ['Fechar a praça à noite', 'Closing the square at night'], ['Colocar mais luzes na praça', 'Putting more lights in the square']], key: 0, at: 0 },
        { type: 'mc', ask: ['Por que a dona da padaria não gosta da proposta?', 'Why doesn’t the bakery’s owner like the proposal?'], opts: [['Tem medo de atravessar a praça no escuro', 'She’s afraid of crossing the square in the dark'], ['Quer vender pão à noite', 'She wants to sell bread at night'], ['Gosta de olhar as luzes', 'She likes looking at the lights']], key: 0, at: 2 },
        { type: 'tfn', ask: ['A turma do quinto ano cercou o ninho com uma cordinha.', 'The fifth graders roped off the nest.'], key: true, at: 5 },
        { type: 'short', ask: ['O que o criador de galinhas sugeriu?', 'What did the chicken farmer suggest?'], want: { lemmas: ['pano', 'cobrir', 'escuro', 'galinheiro'] }, model: ['Ele sugeriu cobrir o galinheiro com um pano escuro à noite.', 'He suggested covering the coop with a dark cloth at night.'], at: 8 },
      ] },
    // ============================================================ Nº 4 (B2): the decision, the owl's chicks, Lourdinha again
    { id: 'pt.p4', n: 4, band: 4,
      lead: { head: ['Decisão: luz mais fraca depois da meia-noite e uma Noite das Estrelas por mês', 'Decision: dimmer lights after midnight and a Star Night every month'], by: ['Por Edgar Ramos', 'By Edgar Ramos'], text: [
        ['Depois de quase três horas de conversa, a reunião de quinta-feira chegou a um acordo: a partir do mês que vem, as luzes da praça vão ficar mais fracas depois da meia-noite, mas não vão apagar de vez.', 'After almost three hours of talk, Thursday’s meeting reached an agreement: from next month, the square’s lights will be dimmer after midnight, but they won’t go out completely.'],
        ['A solução veio de um aluno do clube de astronomia, que tinha pesquisado o assunto: lâmpadas que ficam mais fortes quando alguém passa. Assim, a padeira atravessa a praça com luz, e o resto da noite fica escurinho.', 'The solution came from a student in the astronomy club, who had looked into it: lamps that get brighter when someone walks by. That way, the baker crosses the square with light, and the rest of the night stays nice and dark.'],
        ['E tem mais: uma vez por mês, as luzes vão ser apagadas por completo, das nove às onze, para a primeira Noite das Estrelas de Alba, com telescópio, cobertores e chocolate quente.', 'And there’s more: once a month, the lights will be turned off completely, from nine to eleven, for Alba’s first Star Night, with a telescope, blankets and hot chocolate.'],
        ['«Ninguém ganhou sozinho, e ninguém perdeu», resumiu a padeira, sorrindo. «Agora eu vou trabalhar com luz e ainda ganho um céu estrelado uma vez por mês».', '“Nobody won on their own, and nobody lost,” the baker summed up, smiling. “Now I go to work with light, and I get a starry sky once a month too.”'],
      ] },
      news: { head: ['A coruja da escola teve filhotes', 'The school owl has chicks'], text: [
        ['A coruja-buraqueira que fez o ninho na quadra da escola teve três filhotes. Os alunos deram o nome de Dona Fofoca para a mãe, porque ela vira a cabeça para todos os lados, como quem quer saber de tudo.', 'The burrowing owl that nested on the school’s sports field has had three chicks. The students named the mother Dona Fofoca, because she turns her head every which way, like someone who wants to know everything.'],
        ['Os filhotes ainda não voam, mas já saem do buraco no fim da tarde para treinar as asas. As crianças observam de longe, com binóculos emprestados pelo clube de astronomia.', 'The chicks can’t fly yet, but they already come out of the burrow in the late afternoon to practice with their wings. The children watch from a distance, with binoculars lent by the astronomy club.'],
        ['A diretora da escola contou que as notas de ciências do quinto ano nunca foram tão boas. «Agora todo mundo quer saber o que as corujas comem», disse.', 'The school’s principal said the fifth graders’ science grades have never been so good. “Now everyone wants to know what owls eat,” she said.'],
      ] },
      letter: { head: ['Obrigada pelo escorregador!', 'Thank you for the slide!'], by: ['Lourdinha, 9 anos', 'Lourdinha, age 9'], text: [
        ['Querido jornal: sou eu de novo, a Lourdinha. Eu quero agradecer ao Seu Inácio pelo escorregador. Todo dia tem fila, e ninguém briga, porque a gente combinou: três descidas e depois é a vez do próximo.', 'Dear newspaper: it’s me again, Lourdinha. I want to thank Seu Inácio for the slide. Every day there’s a line, and nobody fights, because we agreed: three goes and then it’s the next person’s turn.'],
        ['Agora eu tenho outra ideia. Na minha opinião, um balanço também seria muito bom, porque assim as crianças que não gostam de escorregar teriam com o que brincar. O meu irmão disse que ajuda a pintar. Eu também!', 'Now I have another idea. In my opinion, a swing would be really good too, because then the children who don’t like sliding would have something to play on. My brother said he’ll help paint it. Me too!'],
      ] },
      column: { head: ['A dica do Seu Benedito', 'Seu Benedito’s pick'], by: ['Benedito Arruda, bibliotecário', 'Benedito Arruda, librarian'], text: [
        ['Com a primeira Noite das Estrelas chegando, separei na biblioteca uma mesa só com livros sobre o céu: constelações, lendas da lua e até um atlas antigo do meu avô.', 'With the first Star Night coming up, I’ve set aside a table at the library just for books about the sky: constellations, moon legends and even an old atlas that belonged to my grandfather.'],
        ['Para quem nunca leu sobre o assunto, recomendo começar pelas lendas, porque cada povo inventou uma história diferente para as mesmas estrelas. E uma sugestão de bibliotecário: levem um livro para a praça. Ler poesia em voz alta debaixo do céu é uma das melhores coisas da vida.', 'For anyone who has never read about it, I recommend starting with the legends, because every people invented a different story for the same stars. And a librarian’s tip: bring a book to the square. Reading poetry aloud under the sky is one of the best things in life.'],
      ] },
      ads: [
        ['Aulas de xadrez grátis para jovens, terças à tarde, debaixo da árvore grande da praça. Falar com o Seu Haroldo.', 'Free chess lessons for young people, Tuesday afternoons, under the big tree in the square. Talk to Seu Haroldo.'],
        ['Vende-se mesa de madeira feita à mão, com quatro cadeiras. Ideal para família grande. Rua da escola, número 9.', 'For sale: a handmade wooden table with four chairs. Perfect for a big family. School street, number 9.'],
        ['Empresta-se telescópio para a Noite das Estrelas, com aula grátis de como usar. Procurar o clube de astronomia na escola.', 'Telescope to lend for Star Night, with a free lesson on how to use it. Ask for the astronomy club at the school.'],
      ],
      items: [
        { type: 'short', ask: ['Depois da meia-noite, como vão ficar as luzes da praça?', 'After midnight, what will the square’s lights be like?'], want: { lemmas: ['fraco', 'fraca'] }, model: ['Elas vão ficar mais fracas.', 'They’ll be dimmer.'], at: 0 },
        { type: 'mc', ask: ['Quem deu a ideia das lâmpadas que ficam mais fortes quando alguém passa?', 'Whose idea were the lamps that brighten when someone walks by?'], opts: [['Um aluno do clube de astronomia', 'A student from the astronomy club'], ['A padeira', 'The baker'], ['O prefeito', 'The mayor']], key: 0, at: 1 },
        { type: 'tfn', ask: ['A coruja teve três filhotes.', 'The owl had three chicks.'], key: true, at: 4 },
        { type: 'mc', ask: ['Qual é a nova ideia da Lourdinha?', 'What is Lourdinha’s new idea?'], opts: [['Um balanço no parque', 'A swing in the park'], ['Um segundo escorregador', 'A second slide'], ['Uma piscina', 'A swimming pool']], key: 0, at: 8 },
      ] },
  ],
});
