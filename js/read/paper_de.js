'use strict';
// «Das Talblatt», the weekly edition in German (paper.js is the engine; the shape is at the top of paper_es.js; the corner
// store's day paper has the same masthead, townlife.js). Standard German; B1 for editions 1–2, B2 for 3–4; Alba's own town life
// only, with threads from week to week (the open book cabinet, the kids' bike workshop, the playground bin and the crows, the
// evening market and Tilda's band, the school hedgehogs). Readers are «Sie» or «Leserinnen und Leser»: never gendered.

PAPER.add('de', {
  mast: ['Das Talblatt', 'The Valley Paper'], sub: ['Wochenausgabe', 'Weekly edition'], start: 3,
  labels: { lead: ['Titelseite', 'Front page'], news: ['Aus Alba', 'Alba news'], letter: ['Leserbriefe', 'Letters to the editor'], column: ['Kolumne', 'Column'],
    ads: ['Kleinanzeigen', 'Small ads'], weather: ['Das Wetter', 'The weather'], no: ['Nr.', 'No.'], town: ['Alba', 'Alba'] },
  desk: { title: ['Aus der Redaktion von Radio Alba', 'From Radio Alba’s newsroom: your items for the six o’clock news'],
    empty: ['Bald auf dieser Seite: die Meldungen aus den Sechs-Uhr-Nachrichten von Radio Alba.', 'Coming soon on this page: the items from Radio Alba’s six o’clock news.'] },
  weather: { tags: ['warm', 'wet'], row: ['{d.name}: {s.full}. {s.tip}', '{d.en}: {s.en}. {s.tipEn}'], rowT: ['{d.name}: {s.full}, {s.n} Grad. {s.tip}', '{d.en}: {s.en}, {s.n} degrees. {s.tipEn}'],
    ask: ['Laut der Zeitung: Wie ist das Wetter {d.am}?', 'According to the paper, what’s the weather like on {d.en}?'] },
  found: { ad: ['Gefunden {p.in}: {i.t}. {i.def^} {i.ist} jetzt in der Bibliothek, bei Herrn Buchholz.', 'Found {p.enAt}: {i.en}. Ask Herr Buchholz at the library.'],
    ask: ['Laut den Anzeigen: Was wurde {p.in} gefunden?', 'According to the ads, what was found {p.enAt}?'] },
  tf: [['Richtig', 'True'], ['Falsch', 'False'], ['Steht nicht im Text', 'Not in the text']],
  editions: [
    // ============================================================ Nr. 1 (B1): a book cabinet, a bike workshop, a letter about a bin
    { id: 'de.p1', n: 1, band: 3,
      lead: { head: ['Ein Bücherschrank für den Platz', 'A book cabinet for the square'], by: ['Von Wiebke Harms', 'By Wiebke Harms'], text: [
        ['Ab nächster Woche steht auf dem Platz von Alba ein offener Bücherschrank. Jeder kann dort ein Buch herausnehmen, lesen und behalten. Wer möchte, stellt dafür ein anderes Buch hinein.', 'From next week there’ll be an open book cabinet in Alba’s square. Anyone can take a book out, read it and keep it. Those who want to can put another book in its place.'],
        ['Die Idee kommt von der Klasse 4b der Grundschule. «Bei uns zu Hause stehen so viele Bücher, die niemand mehr liest», erklärt eine Schülerin. «Im Schrank finden sie neue Leserinnen und Leser.»', 'The idea comes from class 4b at the primary school. “At home we have so many books that nobody reads anymore,” one pupil explains. “In the cabinet they’ll find new readers.”'],
        ['Gebaut hat den Schrank Herr Hobel, ein Schreiner aus Alba. Er hat dafür eine alte Telefonzelle rot gestrichen und Regale hineingesetzt. Eine kleine Lampe gibt es auch, damit man abends stöbern kann.', 'The cabinet was built by Herr Hobel, a carpenter from Alba. He painted an old phone booth red and fitted shelves inside. There’s a little lamp too, so you can browse in the evening.'],
        ['Herr Buchholz von der Bibliothek freut sich über die Idee. «Ein Buch ist erst glücklich, wenn jemand es liest», sagt er. Die Eröffnung ist am Samstag um zehn Uhr, mit Kakao für alle Kinder.', 'Herr Buchholz from the library is delighted with the idea. “A book is only happy when someone reads it,” he says. The opening is on Saturday at ten, with cocoa for all the children.'],
      ] },
      news: { head: ['Kinder reparieren ihre Fahrräder selbst', 'Children fix their own bikes'], text: [
        ['Jeden Samstagvormittag ist die alte Garage hinter dem Rathaus eine Fahrradwerkstatt für Kinder. Herr Mattes, ein Mechaniker in Rente, zeigt dort, wie man einen Reifen flickt oder eine Kette ölt.', 'Every Saturday morning, the old garage behind the town hall is a bike workshop for children. Herr Mattes, a retired mechanic, shows them how to patch a tire or oil a chain.'],
        ['«Am Anfang hatten manche Kinder Angst vor dem Werkzeug», erzählt er. «Jetzt reparieren sie sogar die Fahrräder ihrer Eltern.»', '“At first some children were scared of the tools,” he says. “Now they even fix their parents’ bikes.”'],
        ['Die Werkstatt ist kostenlos. Man muss nur sein Fahrrad und gute Laune mitbringen.', 'The workshop is free. You just have to bring your bike and a good mood.'],
      ] },
      letter: { head: ['Kein Mülleimer am Spielplatz', 'No bin at the playground'], by: ['Stine K., Mutter von zwei Kindern', 'Stine K., mother of two'], text: [
        ['Liebe Redaktion, ich gehe fast jeden Tag mit meinen Kindern auf den Spielplatz am Park. Der Spielplatz ist schön, aber es gibt dort keinen einzigen Mülleimer.', 'Dear editors, I go to the playground by the park with my children almost every day. The playground is nice, but there isn’t a single bin there.'],
        ['Deshalb liegen überall Papier und Flaschen herum. Könnte die Gemeinde nicht einen Mülleimer neben die Schaukeln stellen? Ich verspreche, dass meine Kinder ihn fleißig benutzen werden.', 'That’s why paper and bottles are lying around everywhere. Couldn’t the town put a bin next to the swings? I promise my children will use it diligently.'],
      ] },
      column: { head: ['Gartentipps von Herrn Kümmel', 'Herr Kümmel’s garden tips'], by: ['K. Kümmel, Gärtner im Ruhestand', 'K. Kümmel, retired gardener'], text: [
        ['Viele Leserinnen und Leser fragen mich: Wie bekomme ich mehr Schmetterlinge in den Garten? Die Antwort ist einfacher, als Sie denken.', 'Lots of readers ask me: how do I get more butterflies into my garden? The answer is simpler than you think.'],
        ['Lassen Sie eine kleine Ecke im Garten wild wachsen und mähen Sie dort nicht. Pflanzen Sie Lavendel und Klee, und stellen Sie eine flache Schale mit Wasser hin. Nach ein paar Wochen kommen die ersten Schmetterlinge, ganz von allein.', 'Let a small corner of the garden grow wild and don’t mow there. Plant lavender and clover, and put out a shallow dish of water. After a few weeks the first butterflies arrive, all by themselves.'],
      ] },
      ads: [
        ['Gitarrenunterricht für Anfänger, dienstags und donnerstags am Nachmittag. Fragen Sie im Gasthaus nach Frau Lerche. Die erste Stunde ist kostenlos.', 'Guitar lessons for beginners, Tuesday and Thursday afternoons. Ask for Frau Lerche at the inn. The first lesson is free.'],
        ['Verkaufe blaues Fahrrad mit Korb, fast neu. Dreißig Münzen. Marktstraße 4.', 'For sale: a blue bike with a basket, almost new. Thirty coins. Market Street 4.'],
        ['Hilfe gesucht: Am Samstag streichen wir den Zaun der Schule. Lohn: Kuchen für alle und ein großes Dankeschön.', 'Help wanted: on Saturday we’re painting the school fence. Pay: cake for everyone and a big thank-you.'],
      ],
      items: [
        { type: 'short', ask: ['Was steht ab nächster Woche auf dem Platz?', 'What will be in the square from next week?'], want: { lemmas: ['Bücherschrank', 'Schrank'] }, model: ['Dort steht ein offener Bücherschrank.', 'An open book cabinet.'], at: 0 },
        { type: 'mc', ask: ['Woraus hat Herr Hobel den Bücherschrank gebaut?', 'What did Herr Hobel build the book cabinet from?'], opts: [['Aus einer alten Telefonzelle', 'From an old phone booth'], ['Aus einem alten Boot', 'From an old boat'], ['Aus einem Kleiderschrank', 'From a wardrobe']], key: 0, at: 2 },
        { type: 'tfn', ask: ['Die Fahrradwerkstatt kostet zwei Münzen.', 'The bike workshop costs two coins.'], key: false, at: 6 },
        { type: 'mc', ask: ['Was wünscht sich Stine K.?', 'What does Stine K. want?'], opts: [['Einen Mülleimer am Spielplatz', 'A bin at the playground'], ['Eine neue Schaukel', 'A new swing'], ['Einen größeren Park', 'A bigger park']], key: 0, at: 8 },
      ] },
    // ============================================================ Nr. 2 (B1): the cabinet's success, Emmi's grandfather, the crows
    { id: 'de.p2', n: 2, band: 3,
      lead: { head: ['Der Bücherschrank ist ein Erfolg', 'The book cabinet is a hit'], by: ['Von Wiebke Harms', 'By Wiebke Harms'], text: [
        ['Seit einer Woche steht der rote Bücherschrank auf dem Platz, und er ist schon fast leer. «Die Leute nehmen die Bücher schneller mit, als wir neue bringen können», lacht Herr Hobel.', 'The red book cabinet has been in the square for a week, and it’s already almost empty. “People take the books faster than we can bring new ones,” laughs Herr Hobel.'],
        ['Am beliebtesten sind Kinderbücher und Krimis. Ein Herr hat sogar ein Kochbuch aus dem Jahr 1950 gefunden und am nächsten Tag ein Rezept daraus nachgekocht: Apfelpfannkuchen.', 'The most popular are children’s books and crime novels. One gentleman even found a cookbook from 1950 and made a recipe from it the very next day: apple pancakes.'],
        ['Damit der Schrank voll bleibt, bittet die Klasse 4b um Spenden. Bücher können in der Bibliothek abgegeben werden, bei Herrn Buchholz.', 'So that the cabinet stays full, class 4b is asking for donations. Books can be handed in at the library, to Herr Buchholz.'],
        ['Eine Regel gibt es aber: Bitte keine kaputten Bücher hineinstellen. «Ein Buch ohne letzte Seite macht niemanden glücklich», sagen die Kinder.', 'There is one rule, though: please don’t put in damaged books. “A book without its last page makes nobody happy,” the children say.'],
      ] },
      news: { head: ['Ein Großvater fährt wieder Rad', 'A grandfather rides again'], text: [
        ['In der Fahrradwerkstatt von Herrn Mattes hat die elfjährige Emmi etwas Besonderes geschafft: Sie hat das alte Fahrrad ihres Großvaters repariert, das seit dreißig Jahren im Keller stand.', 'At Herr Mattes’s bike workshop, eleven-year-old Emmi has done something special: she repaired her grandfather’s old bike, which had been standing in the cellar for thirty years.'],
        ['Sie hat neue Reifen aufgezogen, die Bremsen eingestellt und die Klingel geputzt. Am Sonntag ist ihr Großvater zum ersten Mal seit Jahren wieder durch Alba gefahren, ganz langsam und sehr stolz.', 'She fitted new tires, adjusted the brakes and polished the bell. On Sunday her grandfather rode through Alba for the first time in years, very slowly and very proudly.'],
        ['«Das Beste war sein Gesicht», sagt Emmi. «Er hat die ganze Zeit geklingelt.»', '“The best part was his face,” says Emmi. “He rang the bell the whole time.”'],
      ] },
      letter: { head: ['Der Mülleimer ist da – und die Krähen auch', 'The bin is here – and so are the crows'], by: ['Stine K., Mutter von zwei Kindern', 'Stine K., mother of two'], text: [
        ['Liebe Redaktion, vielen Dank! Zwei Tage nach meinem Brief stand neben den Schaukeln ein neuer Mülleimer. Meine Kinder werfen jetzt sogar fremdes Papier hinein.', 'Dear editors, thank you so much! Two days after my letter there was a new bin next to the swings. My children even throw other people’s paper into it now.'],
        ['Leider haben auch die Krähen den Mülleimer entdeckt. Jeden Morgen holen sie die Brotreste heraus und verteilen sie auf dem Rasen. Vielleicht braucht der Eimer einen Deckel?', 'Unfortunately the crows have discovered the bin too. Every morning they pull out the bread scraps and scatter them over the grass. Maybe the bin needs a lid?'],
      ] },
      column: { head: ['Der Buchtipp von Herrn Buchholz', 'Herr Buchholz’s book tip'], by: ['Heinrich Buchholz, Bibliothekar', 'Heinrich Buchholz, librarian'], text: [
        ['Viele Familien fragen mich, welches Buch sie mit kleinen Kindern lesen sollen. Meine Antwort ist immer dieselbe: ein kurzes Buch mit Tieren, die zusammenhalten.', 'Lots of families ask me which book to read with small children. My answer is always the same: a short book about animals that stick together.'],
        ['Diese Woche empfehle ich «Die Bremer Stadtmusikanten», im Regal für die ersten Schritte. Ich habe das alte Märchen selbst nacherzählt, in kurzen Sätzen. Lesen Sie es laut vor und lassen Sie die Kinder die Tiere spielen: Esel, Hund, Katze und Hahn.', 'This week I recommend «The Town Musicians of Bremen», on the first-steps shelf. I retold the old fairy tale myself, in short sentences. Read it aloud and let the children play the animals: donkey, dog, cat and rooster.'],
      ] },
      ads: [
        ['Kochkurs für Anfänger, samstags um zehn Uhr im Gasthaus. Bitte eine Schürze und gute Laune mitbringen.', 'Cooking class for beginners, Saturdays at ten at the inn. Please bring an apron and a good mood.'],
        ['Herr Lindemann sucht Mitspieler für Schach am Nachmittag. Sie finden ihn auf der großen Bank am Platz.', 'Herr Lindemann is looking for people to play chess with in the afternoons. You’ll find him on the big bench in the square.'],
        ['Biete Hilfe bei den Mathe-Hausaufgaben für Grundschulkinder. Fragen Sie nach Ottokar, im grünen Haus am Teich.', 'Help offered with math homework for primary school children. Ask for Ottokar, in the green house by the pond.'],
      ],
      items: [
        { type: 'mc', ask: ['Wie sieht der Bücherschrank nach einer Woche aus?', 'What does the book cabinet look like after a week?'], opts: [['Er ist fast leer', 'It’s almost empty'], ['Er ist kaputt', 'It’s broken'], ['Er ist zu voll', 'It’s too full']], key: 0, at: 0 },
        { type: 'short', ask: ['Was hat der Herr mit dem alten Kochbuch gekocht?', 'What did the man with the old cookbook make?'], want: { lemmas: ['Apfelpfannkuchen', 'Pfannkuchen'] }, model: ['Er hat Apfelpfannkuchen gemacht.', 'He made apple pancakes.'], at: 1 },
        { type: 'tfn', ask: ['Emmi hat das Fahrrad ihres Großvaters repariert.', 'Emmi repaired her grandfather’s bike.'], key: true, at: 4 },
        { type: 'mc', ask: ['Welches neue Problem gibt es mit dem Mülleimer?', 'What new problem is there with the bin?'], opts: [['Die Krähen holen die Brotreste heraus', 'The crows pull out the bread scraps'], ['Er ist zu klein', 'It’s too small'], ['Niemand benutzt ihn', 'Nobody uses it']], key: 0, at: 8 },
      ] },
    // ============================================================ Nr. 3 (B2): the evening market debate, the hedgehogs, Tilda's letter
    { id: 'de.p3', n: 3, band: 4,
      lead: { head: ['Ein Markt am Abend? Alba diskutiert', 'An evening market? Alba debates'], by: ['Von Wiebke Harms', 'By Wiebke Harms'], text: [
        ['Der Gemeinderat von Alba schlägt vor, am Donnerstag einen Abendmarkt einzuführen: von fünf bis neun Uhr, mit Essensständen, Gemüse und Musik. Am Montag wird der Vorschlag in einer offenen Versammlung besprochen.', 'Alba’s council is proposing a Thursday evening market: from five to nine, with food stalls, vegetables and music. On Monday the proposal will be discussed at an open meeting.'],
        ['Die Befürworter sagen, dass viele Berufstätige morgens keine Zeit für den Markt haben. «Ich komme erst um sechs nach Hause, und dann ist alles zu», sagt ein junger Vater. «Ein Abendmarkt wäre für uns ein Geschenk.»', 'Supporters say that many working people have no time for the market in the morning. “I only get home at six, and then everything’s closed,” says a young father. “An evening market would be a gift for us.”'],
        ['Nicht alle sind begeistert. Die Anwohner rund um den Platz fürchten Lärm bis in die Nacht, und einige Händler sagen, dass sie schon morgens um sechs anfangen. «Noch ein Markttag ist für uns kein Spaß, sondern Arbeit», sagt eine Gemüsehändlerin.', 'Not everyone is thrilled. Residents around the square fear noise late into the night, and some stallholders say they already start at six in the morning. “Another market day isn’t fun for us, it’s work,” says a woman who sells vegetables.'],
        ['Die Versammlung findet am Montag um sieben Uhr abends im Rathaus statt. Alle Bürgerinnen und Bürger dürfen sprechen, wenn sie sich vorher melden.', 'The meeting takes place on Monday at seven in the evening at the town hall. All residents may speak if they sign up beforehand.'],
      ] },
      news: { head: ['Eine Igelfamilie im Schulgarten', 'A hedgehog family in the school garden'], text: [
        ['Im Schulgarten von Alba wohnt seit Kurzem eine Igelfamilie: eine Mutter und vier Junge. Die Kinder haben sie unter einem Haufen Laub entdeckt, als sie die Beete aufräumen wollten.', 'A hedgehog family has recently moved into Alba’s school garden: a mother and four young. The children discovered them under a pile of leaves when they were about to tidy the beds.'],
        ['Die Klasse 3a hat sofort ein Igelhaus aus Holz gebaut und es in eine ruhige Ecke gestellt. Jetzt ist der Laubhaufen tabu, und die Kinder beobachten die Igel nur noch aus der Ferne.', 'Class 3a immediately built a wooden hedgehog house and put it in a quiet corner. Now the leaf pile is off limits, and the children only watch the hedgehogs from a distance.'],
        ['Der Tierarzt erinnert daran, dass Igel keine Milch trinken dürfen. «Sie bekommen davon Bauchschmerzen. Wasser und Ruhe sind das Beste», sagt er.', 'The vet reminds everyone that hedgehogs mustn’t drink milk. “It gives them a stomachache. Water and peace and quiet are best,” he says.'],
      ] },
      letter: { head: ['Eine Bühne für junge Bands', 'A stage for young bands'], by: ['Tilda, 15 Jahre', 'Tilda, 15'], text: [
        ['Liebe Redaktion, ich spiele Schlagzeug in einer Schülerband, und wir haben noch nie vor Publikum gespielt. In Alba gibt es einfach keinen Ort dafür.', 'Dear editors, I play drums in a school band, and we’ve never played in front of an audience. There’s simply nowhere in Alba to do it.'],
        ['Wenn es einen Abendmarkt gibt, dann bitte mit einer kleinen Bühne für junge Bands! Wir würden nicht zu laut spielen, versprochen, und um acht Uhr hören wir auf. Ich glaube, die Musik würde die Leute auf den Platz locken.', 'If there’s going to be an evening market, then please with a small stage for young bands! We wouldn’t play too loudly, promise, and we’d stop at eight. I think the music would draw people to the square.'],
      ] },
      column: { head: ['Gartentipps von Herrn Kümmel', 'Herr Kümmel’s garden tips'], by: ['K. Kümmel, Gärtner im Ruhestand', 'K. Kümmel, retired gardener'], text: [
        ['Nach der Geschichte mit den Igeln in der Schule haben mir viele Leserinnen und Leser geschrieben: Wie kann ich Igeln im eigenen Garten helfen?', 'After the story of the hedgehogs at the school, lots of readers wrote to me: how can I help hedgehogs in my own garden?'],
        ['Ganz einfach: Räumen Sie im Herbst nicht alles auf. Ein Haufen Laub oder Holz in einer ruhigen Ecke ist für einen Igel ein perfektes Winterquartier. Stellen Sie eine flache Schale mit Wasser hin, aber niemals Milch. Und schauen Sie vor dem Rasenmähen nach, ob jemand im hohen Gras schläft.', 'It’s simple: don’t tidy everything up in autumn. A pile of leaves or wood in a quiet corner is perfect winter quarters for a hedgehog. Put out a shallow dish of water, but never milk. And before mowing the lawn, check whether someone is asleep in the long grass.'],
      ] },
      ads: [
        ['Der Chor von Alba sucht neue Stimmen, vor allem Bässe und Tenöre. Proben mittwochs um sechs Uhr in der Aula der Schule. Noten lesen ist keine Voraussetzung.', 'Alba’s choir is looking for new voices, especially basses and tenors. Rehearsals on Wednesdays at six in the school hall. Reading music isn’t required.'],
        ['Saatguttausch im Gemeinschaftsgarten, jeden Sonntag. Bringen Sie Ihre Samen mit und nehmen Sie andere mit nach Hause.', 'Seed swap at the community garden, every Sunday. Bring your seeds along and take others home.'],
        ['Sonniges Zimmer für eine Person zu vermieten, mit Frühstück. In der Nähe vom Platz. Fragen Sie im Laden an der Ecke.', 'Sunny room for one person to rent, with breakfast. Near the square. Ask at the corner shop.'],
      ],
      items: [
        { type: 'mc', ask: ['Was schlägt der Gemeinderat vor?', 'What is the council proposing?'], opts: [['Einen Abendmarkt am Donnerstag', 'An evening market on Thursdays'], ['Den Markt zu schließen', 'Closing the market'], ['Einen neuen Platz zu bauen', 'Building a new square']], key: 0, at: 0 },
        { type: 'mc', ask: ['Warum ist die Gemüsehändlerin dagegen?', 'Why is the vegetable seller against it?'], opts: [['Sie fängt schon morgens um sechs an zu arbeiten', 'She already starts work at six in the morning'], ['Sie mag keine Musik', 'She doesn’t like music'], ['Sie verkauft nur Obst', 'She only sells fruit']], key: 0, at: 2 },
        { type: 'tfn', ask: ['Man darf Igeln Milch geben.', 'You may give hedgehogs milk.'], key: false, at: 6 },
        { type: 'short', ask: ['Was wünscht sich Tilda für den Abendmarkt?', 'What does Tilda want for the evening market?'], want: { lemmas: ['Bühne', 'Band'] }, model: ['Sie wünscht sich eine kleine Bühne für junge Bands.', 'She wants a small stage for young bands.'], at: 8 },
      ] },
    // ============================================================ Nr. 4 (B2): the compromise, hedgehog sponsors, Herr Lindemann danced
    { id: 'de.p4', n: 4, band: 4,
      lead: { head: ['Entscheidung: Abendmarkt jeden zweiten Donnerstag', 'Decision: an evening market every other Thursday'], by: ['Von Wiebke Harms', 'By Wiebke Harms'], text: [
        ['Nach fast drei Stunden Diskussion hat die Versammlung am Montag einen Kompromiss gefunden: Der Abendmarkt findet jetzt jeden zweiten Donnerstag statt, von fünf bis neun Uhr. Der erste war schon gestern.', 'After almost three hours of discussion, Monday’s meeting found a compromise: the evening market now takes place every other Thursday, from five to nine. The first one was yesterday.'],
        ['Damit die Anwohner ihre Ruhe haben, endet die Musik schon um acht Uhr. Und für die Händler gibt es eine Erleichterung: Wer beim Abendmarkt mitmacht, darf am Freitagmorgen eine Stunde später aufmachen.', 'So that residents get their peace, the music ends at eight. And there’s some relief for the stallholders: anyone who takes part in the evening market may open an hour later on Friday morning.'],
        ['Auch die Idee aus dem Leserbrief von Tilda wurde angenommen: Es gibt eine kleine Bühne für junge Bands. Die erste Band, die dort gespielt hat, war ihre eigene.', 'The idea from Tilda’s letter was accepted too: there’s a small stage for young bands. The first band to play there was her own.'],
        ['«Am Ende haben alle ein bisschen nachgegeben, und alle haben etwas gewonnen», sagte die Gemüsehändlerin nach der Abstimmung. Danach gab es für alle Kuchen.', '“In the end everyone gave a little, and everyone won something,” the vegetable seller said after the vote. Then there was cake for everyone.'],
      ] },
      news: { head: ['Igel-Patenschaften in der Schule', 'Hedgehog sponsors at school'], text: [
        ['Die Igelfamilie im Schulgarten hat jetzt zwölf Paten: Jedes Kind der Klasse 3a kümmert sich eine Woche lang um das Wasser und schreibt ins Igel-Tagebuch, was es beobachtet hat.', 'The hedgehog family in the school garden now has twelve sponsors: every child in class 3a looks after the water for a week and writes in the hedgehog diary what they’ve observed.'],
        ['Die Jungen sind schon fast so groß wie die Mutter. Bald ziehen sich alle fünf zum Winterschlaf in das Igelhaus zurück.', 'The young are already almost as big as their mother. Soon all five will retreat into the hedgehog house to hibernate.'],
        ['Die Lehrerin ist begeistert: «Noch nie haben die Kinder so gern geschrieben. Das Igel-Tagebuch hat schon dreißig Seiten.» Die Klasse 3b möchte jetzt im Frühling ein Vogelhaus bauen, damit auch die Meisen im Schulgarten ein eigenes Tagebuch bekommen.', 'The teacher is delighted: “The children have never enjoyed writing so much. The hedgehog diary already has thirty pages.” Class 3b now wants to build a birdhouse in spring, so that the school garden’s blue tits get a diary of their own too.'],
      ] },
      letter: { head: ['Ich habe getanzt', 'I danced'], by: ['Herr Lindemann, Anwohner am Platz', 'Herr Lindemann, who lives on the square'], text: [
        ['Liebe Redaktion, ich gebe zu: Ich war gegen den Abendmarkt. Ich wohne direkt am Platz und hatte Angst vor Lärm bis Mitternacht.', 'Dear editors, I admit it: I was against the evening market. I live right on the square and was afraid of noise until midnight.'],
        ['Gestern war der erste Abendmarkt, und ich muss ehrlich sein: Ich habe zum ersten Mal seit Jahren getanzt. Die junge Band hat gut gespielt, und um acht Uhr war Schluss, wie versprochen. Ich habe mich sogar bei Tilda für die Musik bedankt.', 'Yesterday was the first evening market, and I have to be honest: I danced for the first time in years. The young band played well, and at eight o’clock it was over, as promised. I even thanked Tilda for the music.'],
      ] },
      column: { head: ['Gartentipps von Herrn Kümmel', 'Herr Kümmel’s garden tips'], by: ['K. Kümmel, Gärtner im Ruhestand', 'K. Kümmel, retired gardener'], text: [
        ['Der Winter kommt, und viele fragen mich, was jetzt im Garten zu tun ist. Mein wichtigster Tipp: Schneiden Sie nicht alle Pflanzen ab.', 'Winter is coming, and lots of people ask me what needs doing in the garden now. My most important tip: don’t cut all your plants down.'],
        ['Die trockenen Stängel sehen vielleicht nicht schön aus, aber in ihnen überwintern Marienkäfer und andere nützliche Insekten. Im Frühling danken sie es Ihnen, denn sie fressen die Blattläuse. Und vergessen Sie die Vögel nicht: Eine Futterstelle mit Körnern hilft ihnen durch die kalten Wochen.', 'The dry stems might not look pretty, but ladybugs and other useful insects spend the winter inside them. In spring they’ll thank you, because they eat the aphids. And don’t forget the birds: a feeding spot with seeds helps them through the cold weeks.'],
      ] },
      ads: [
        ['Kostenloser Schachunterricht für Jugendliche, dienstags am Nachmittag, unter dem großen Baum am Platz. Fragen Sie nach Herrn Lindemann.', 'Free chess lessons for teenagers, Tuesday afternoons, under the big tree in the square. Ask for Herr Lindemann.'],
        ['Verkaufe handgemachten Holztisch mit vier Stühlen. Ideal für große Familien. Schulstraße 9.', 'For sale: a handmade wooden table with four chairs. Ideal for big families. School Street 9.'],
        ['Junge Band sucht jemanden am Bass. Proben samstags in der Garage hinter dem Rathaus. Bitte bei Tilda melden.', 'Young band looking for a bass player. Rehearsals on Saturdays in the garage behind the town hall. Please contact Tilda.'],
      ],
      items: [
        { type: 'short', ask: ['Wie oft findet der Abendmarkt jetzt statt?', 'How often does the evening market take place now?'], want: { lemmas: ['zweite', 'Donnerstag'] }, model: ['Er findet jeden zweiten Donnerstag statt.', 'Every other Thursday.'], at: 0 },
        { type: 'mc', ask: ['Bis wann darf beim Abendmarkt Musik gespielt werden?', 'Until when can music be played at the evening market?'], opts: [['Bis acht Uhr', 'Until eight'], ['Bis Mitternacht', 'Until midnight'], ['Bis neun Uhr', 'Until nine']], key: 0, at: 1 },
        { type: 'tfn', ask: ['Die erste Band auf der Bühne war die Band von Tilda.', 'The first band on the stage was Tilda’s band.'], key: true, at: 2 },
        { type: 'mc', ask: ['Was hat Herr Lindemann auf dem ersten Abendmarkt gemacht?', 'What did Herr Lindemann do at the first evening market?'], opts: [['Er hat zum ersten Mal seit Jahren getanzt', 'He danced for the first time in years'], ['Er hat sich über den Lärm beschwert', 'He complained about the noise'], ['Er hat Gemüse verkauft', 'He sold vegetables']], key: 0, at: 8 },
      ] },
  ],
});
