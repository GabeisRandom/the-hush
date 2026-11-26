'use strict';
// A practice paper in the format of the Goethe-Zertifikat A1: Start Deutsch 1 (EX2, DESIGN.md 21.2 C; formats.js
// FORMATS.goethe). Our own texts and questions, natively written, set in the valley (Alba, Molinar, Remanso, the lake);
// the examiner, Dr. Morgenroth, with «Sie». Never the player's gender. Hören first, as in the real exam (3 Teile, 15 items:
// Teil 2 plays once), Lesen (3 Teile, 15 items), Schreiben (a form for a friend, a short email), Sprechen (3 Teile).
(() => {
  if (typeof MOCK === 'undefined') return;
  const mc = (ask, opts, words, icons) => Object.assign({ type: 'mc', ask, opts, key: 0, words: words || [] }, icons ? { icons } : {});
  const RF = [['Richtig', 'True'], ['Falsch', 'False']];
  const rf = (ask, key, words) => ({ type: 'tf', ask, key, labels: RF, words: words || [] });
  const ab = (ask, key, words) => ({ type: 'tf', ask, key, labels: [['a', 'a'], ['b', 'b']], words: words || [] });
  const id = s => 'de.goethe.a1.' + s;
  const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  MOCK.add('de', 'goethe', 'A1', {
    sections: {
      hoeren: [id('h1'), id('h2'), id('h3')],
      lesen: [id('l1'), id('l2'), id('l3')],
      schreiben: [id('s1'), id('s2')],
      sprechen: [id('sp1a'), id('sp1b'), id('sp2a'), id('sp2b'), id('sp2c'), id('sp3a'), id('sp3b')],
    },
    tasks: [
      // ================================================================ Hören (about 20 min, 15 items)
      { id: id('h1'), part: 'listen', tarea: 1, title: ['Sechs kurze Gespräche', 'Six short conversations'],
        intro: ['Sie hören sechs kurze Gespräche. Sie hören jeden Text zweimal. Kreuzen Sie an: a, b oder c (1–6).', 'You’ll hear six short conversations, each one twice. Choose a, b or c (1–6).'],
        voices: { kundin: { name: 'Kundin', pitch: 1.12 }, verk: { name: 'Verkäufer', pitch: 0.9 }, jan: { name: 'Jan', pitch: 0.95 }, ute: { name: 'Ute', pitch: 1.16 }, rezeption: { name: 'Rezeption', pitch: 1.08 }, gast: { name: 'Gast', pitch: 0.86 },
          ben: { name: 'Ben', pitch: 0.98 }, mia: { name: 'Mia', pitch: 1.2 }, aerztin: { name: 'Ärztin', pitch: 1.05 }, patient: { name: 'Patient', pitch: 0.84 }, mutter: { name: 'Mutter', pitch: 1.04 }, sohn: { name: 'Sohn', pitch: 1.3, rate: 1.05 } },
        clips: [
          { label: ['Gespräch 1', 'Conversation 1'], lines: [{ who: 'kundin', text: 'Entschuldigung, was kostet das Brot hier?', en: 'Excuse me, how much is this bread?' }, { who: 'verk', text: 'Das Vollkornbrot? Drei Münzen.', en: 'The wholemeal bread? Three coins.' }, { who: 'kundin', text: 'Gut, dann nehme ich eins.', en: 'Good, then I’ll take one.' }] },
          { label: ['Gespräch 2', 'Conversation 2'], lines: [{ who: 'jan', text: 'Wann treffen wir uns morgen? Um halb zehn am Bahnhof?', en: 'When shall we meet tomorrow? At half past nine at the station?' }, { who: 'ute', text: 'Lieber um zehn. Ich muss vorher noch einkaufen.', en: 'Better at ten. I have to do some shopping first.' }, { who: 'jan', text: 'Okay, dann um zehn.', en: 'OK, at ten then.' }] },
          { label: ['Gespräch 3', 'Conversation 3'], lines: [{ who: 'rezeption', text: 'Guten Abend. Ihr Zimmer ist im dritten Stock, Zimmer 312.', en: 'Good evening. Your room is on the third floor, room 312.' }, { who: 'gast', text: 'Gibt es einen Aufzug?', en: 'Is there an elevator?' }, { who: 'rezeption', text: 'Ja, gleich hier links.', en: 'Yes, just here on the left.' }] },
          { label: ['Gespräch 4', 'Conversation 4'], lines: [{ who: 'ben', text: 'Was machst du am Wochenende?', en: 'What are you doing this weekend?' }, { who: 'mia', text: 'Ich fahre mit dem Zug nach Molinar. Meine Oma hat Geburtstag.', en: 'I’m taking the train to Molinar. It’s my grandma’s birthday.' }] },
          { label: ['Gespräch 5', 'Conversation 5'], lines: [{ who: 'aerztin', text: 'Guten Tag, Herr Lenz. Was fehlt Ihnen denn?', en: 'Good afternoon, Mr. Lenz. What seems to be the problem?' }, { who: 'patient', text: 'Ich habe seit gestern Kopfschmerzen und ein bisschen Fieber.', en: 'I’ve had a headache since yesterday and a slight fever.' }] },
          { label: ['Gespräch 6', 'Conversation 6'], lines: [{ who: 'mutter', text: 'Nimm bitte deinen Regenschirm mit! Heute Nachmittag regnet es.', en: 'Please take your umbrella! It’s going to rain this afternoon.' }, { who: 'sohn', text: 'Okay, Mama.', en: 'OK, Mom.' }] }],
        items: [mc(['Wie viel kostet das Brot?', 'How much is the bread?'], [['3 Münzen', '3 coins'], ['13 Münzen', '13 coins'], ['30 Münzen', '30 coins']], ['kosten']),
          mc(['Wann treffen sich Jan und Ute?', 'When are Jan and Ute meeting?'], [['um 10 Uhr', 'at 10'], ['um 9.30 Uhr', 'at 9:30'], ['um 9 Uhr', 'at 9']], ['treffen']),
          mc(['In welchem Stock ist das Zimmer?', 'Which floor is the room on?'], [['im dritten Stock', 'on the third floor'], ['im ersten Stock', 'on the first floor'], ['im zweiten Stock', 'on the second floor']], ['Stock']),
          mc(['Wie fährt Mia nach Molinar?', 'How is Mia going to Molinar?'], [['mit dem Zug', 'by train'], ['mit dem Auto', 'by car'], ['mit dem Fahrrad', 'by bike']], ['Zug'], ['train', 'sc_car', '']),
          mc(['Was hat Herr Lenz?', 'What’s wrong with Mr. Lenz?'], [['Kopfschmerzen', 'a headache'], ['Bauchschmerzen', 'a stomachache'], ['Zahnschmerzen', 'a toothache']], ['Kopfschmerzen']),
          mc(['Wie ist das Wetter heute Nachmittag?', 'What’s the weather like this afternoon?'], [['Es regnet.', 'It’s raining.'], ['Die Sonne scheint.', 'It’s sunny.'], ['Es schneit.', 'It’s snowing.']], ['regnen'], ['sc_rain', 'sc_sun', 'snow'])] },

      { id: id('h2'), part: 'listen', tarea: 2, title: ['Vier Durchsagen', 'Four announcements'],
        intro: ['Sie hören vier Durchsagen. Sie hören jeden Text nur einmal. Kreuzen Sie an: Richtig oder Falsch (7–10)?', 'You’ll hear four announcements, each one only once. True or false (7–10)?'],
        voices: { bahn: { name: 'Bahnhof', pitch: 0.95, rate: 0.96 }, markt: { name: 'Supermarkt', pitch: 1.1 }, hafen: { name: 'Hafen', pitch: 0.88, rate: 0.96 }, kaufhaus: { name: 'Kaufhaus', pitch: 1.14 } },
        clips: [
          { label: ['Durchsage 7', 'Announcement 7'], lines: [{ who: 'bahn', text: 'Achtung an Gleis vier: Der Zug nach Remanso hat zehn Minuten Verspätung.', en: 'Attention on platform four: the train to Remanso is ten minutes late.' }] },
          { label: ['Durchsage 8', 'Announcement 8'], lines: [{ who: 'markt', text: 'Liebe Kunden, heute sind alle Äpfel im Angebot: das Kilo nur zwei Münzen!', en: 'Dear customers, all apples are on offer today: only two coins a kilo!' }] },
          { label: ['Durchsage 9', 'Announcement 9'], lines: [{ who: 'hafen', text: 'Das Schiff über den See fährt heute leider nicht. Bitte nehmen Sie den Bus um vierzehn Uhr.', en: 'Unfortunately the boat across the lake isn’t running today. Please take the bus at two p.m.' }] },
          { label: ['Durchsage 10', 'Announcement 10'], lines: [{ who: 'kaufhaus', text: 'Unser Café im zweiten Stock schließt heute schon um siebzehn Uhr.', en: 'Our café on the second floor closes early today, at five p.m.' }] }],
        items: [rf(['Der Zug nach Remanso kommt pünktlich.', 'The train to Remanso is on time.'], false, ['pünktlich']),
          rf(['Äpfel sind heute billiger.', 'Apples are cheaper today.'], true, ['Angebot']),
          rf(['Heute fährt ein Bus.', 'A bus is running today.'], true, ['Bus']),
          rf(['Das Café ist heute bis 19 Uhr offen.', 'The café is open until 7 p.m. today.'], false, ['schließen'])] },

      { id: id('h3'), part: 'listen', tarea: 3, title: ['Fünf Nachrichten', 'Five messages'],
        intro: ['Sie hören fünf Nachrichten am Telefon. Sie hören jeden Text zweimal. Kreuzen Sie an: a, b oder c (11–15).', 'You’ll hear five phone messages, each one twice. Choose a, b or c (11–15).'],
        voices: { tom: { name: 'Tom', pitch: 0.96 }, bib: { name: 'Bibliothek', pitch: 1.1, rate: 0.96 }, mama: { name: 'Mama', pitch: 1.04 }, klein: { name: 'Frau Klein', pitch: 1.12 }, sara: { name: 'Sara', pitch: 1.2 } },
        clips: [
          { label: ['Nachricht 11', 'Message 11'], lines: [{ who: 'tom', text: 'Hallo Lena, hier ist Tom. Der Film heute Abend fängt um acht Uhr an, nicht um sieben. Bis später!', en: 'Hi Lena, it’s Tom. The film tonight starts at eight, not seven. See you later!' }] },
          { label: ['Nachricht 12', 'Message 12'], lines: [{ who: 'bib', text: 'Guten Tag, hier ist die Bibliothek Alba. Ihr Buch ist da. Sie können es ab Mittwoch abholen. Bitte bringen Sie Ihren Ausweis mit.', en: 'Good afternoon, this is the Alba library. Your book has arrived. You can pick it up from Wednesday. Please bring your ID.' }] },
          { label: ['Nachricht 13', 'Message 13'], lines: [{ who: 'mama', text: 'Hallo, hier ist Mama. Kannst du bitte noch Milch und Eier kaufen? Brot haben wir schon. Danke!', en: 'Hi, it’s Mom. Can you please buy some milk and eggs? We already have bread. Thanks!' }] },
          { label: ['Nachricht 14', 'Message 14'], lines: [{ who: 'klein', text: 'Guten Tag, Herr Braun, hier ist Frau Klein. Unser Termin am Dienstag geht leider nicht. Geht es auch am Donnerstag?', en: 'Good afternoon, Mr. Braun, this is Ms. Klein. Unfortunately our appointment on Tuesday won’t work. Could you do Thursday?' }] },
          { label: ['Nachricht 15', 'Message 15'], lines: [{ who: 'sara', text: 'Hallo, ich bin’s, Sara. Ich bin jetzt im Café am Markt, aber du bist nicht da. Ich warte noch zehn Minuten.', en: 'Hi, it’s me, Sara. I’m at the café by the market now, but you’re not here. I’ll wait ten more minutes.' }] }],
        items: [mc(['Wann beginnt der Film?', 'When does the film start?'], [['um 20 Uhr', 'at 8 p.m.'], ['um 19 Uhr', 'at 7 p.m.'], ['um 18 Uhr', 'at 6 p.m.']], ['anfangen']),
          mc(['Was soll die Person mitbringen?', 'What should the person bring?'], [['den Ausweis', 'their ID'], ['ein Buch', 'a book'], ['zwei Münzen', 'two coins']], ['Ausweis']),
          mc(['Was soll die Person kaufen?', 'What should the person buy?'], [['Milch und Eier', 'milk and eggs'], ['Brot und Milch', 'bread and milk'], ['Eier und Brot', 'eggs and bread']], ['Ei']),
          mc(['Wann möchte Frau Klein Herrn Braun treffen?', 'When does Ms. Klein want to meet Mr. Braun?'], [['am Donnerstag', 'on Thursday'], ['am Dienstag', 'on Tuesday'], ['am Mittwoch', 'on Wednesday']], ['Termin']),
          mc(['Wo ist Sara?', 'Where is Sara?'], [['im Café', 'at the café'], ['auf dem Markt', 'at the market'], ['zu Hause', 'at home']], ['warten'])] },

      // ================================================================ Lesen (25 min, 15 items)
      { id: id('l1'), part: 'read', tarea: 1, title: ['Zwei Texte', 'Two texts'],
        intro: ['Lesen Sie die zwei Texte. Sind die Aussagen 1–5 richtig oder falsch?', 'Read the two texts. Are statements 1–5 true or false?'],
        blocks: [
          { label: ['Text A', 'Text A'], kind: 'email', head: [['Von: Clara', 'From: Clara'], ['An: Ben', 'To: Ben']], text: [['Lieber Ben,', 'Dear Ben,'], ['vielen Dank für deine Einladung! Leider kann ich am Samstag nicht kommen. Meine Schwester heiratet in Remanso, und ich fahre schon am Freitag hin.', 'thanks a lot for your invitation! Unfortunately I can’t come on Saturday. My sister is getting married in Remanso, and I’m going there on Friday already.'], ['Aber nächste Woche habe ich Zeit. Gehen wir am Mittwoch zusammen ins Kino?', 'But I have time next week. Shall we go to the movies together on Wednesday?'], ['Liebe Grüße, Clara', 'Love, Clara']] },
          { label: ['Text B', 'Text B'], kind: 'note', text: [['Liebe Frau Bauer,', 'Dear Ms. Bauer,'], ['ich bin vom 3. bis 10. Mai im Urlaub. Können Sie bitte meine Blumen gießen? Der Schlüssel ist bei Familie Peters im ersten Stock.', 'I’m on vacation from May 3 to 10. Could you please water my flowers? The key is with the Peters family on the first floor.'], ['Vielen Dank! Ihr Karl Hahn', 'Many thanks! Yours, Karl Hahn']] }],
        items: [rf(['Text A: Clara kommt am Samstag zu Bens Fest.', 'Text A: Clara is coming to Ben’s party on Saturday.'], false, ['Einladung']),
          rf(['Text A: Claras Schwester heiratet.', 'Text A: Clara’s sister is getting married.'], true, ['heiraten']),
          rf(['Text A: Clara möchte mit Ben ins Kino gehen.', 'Text A: Clara wants to go to the movies with Ben.'], true, ['Kino']),
          rf(['Text B: Herr Hahn ist eine Woche nicht zu Hause.', 'Text B: Mr. Hahn is away from home for a week.'], true, ['Urlaub']),
          rf(['Text B: Frau Bauer hat den Schlüssel.', 'Text B: Ms. Bauer has the key.'], false, ['Schlüssel'])] },

      { id: id('l2'), part: 'read', tarea: 2, title: ['Wo finden Sie Informationen?', 'Where do you find information?'],
        intro: ['Lesen Sie die Texte und die Aufgaben 6–10. Wo finden Sie Informationen? Kreuzen Sie an: a oder b.', 'Read the texts and tasks 6–10. Where do you find the information? Choose a or b.'],
        blocks: [
          { label: ['6a', '6a'], kind: 'ad', text: [['Hallenbad Alba: Montag bis Samstag, 8–20 Uhr', 'Alba indoor pool: Monday to Saturday, 8 a.m.–8 p.m.']] },
          { label: ['6b', '6b'], kind: 'ad', text: [['Seebad Remanso: täglich 9–19 Uhr', 'Remanso lake baths: daily, 9 a.m.–7 p.m.']] },
          { label: ['7a', '7a'], kind: 'ad', text: [['2-Zimmer-Wohnung, 3. Stock, mit Balkon, 450 Münzen', '2-room apartment, 3rd floor, with balcony, 450 coins']] },
          { label: ['7b', '7b'], kind: 'ad', text: [['Zimmer im Studentenheim, ohne Küche, 200 Münzen', 'Room in a student dorm, no kitchen, 200 coins']] },
          { label: ['8a', '8a'], kind: 'ad', text: [['Sprachschule Lingua: Deutschkurse am Vormittag, 9–12 Uhr', 'Lingua language school: German courses in the morning, 9 a.m.–noon']] },
          { label: ['8b', '8b'], kind: 'ad', text: [['Volkshochschule Alba: Deutsch für Anfänger, Dienstag und Donnerstag, 18–20 Uhr', 'Alba adult education center: German for beginners, Tuesday and Thursday, 6–8 p.m.']] },
          { label: ['9a', '9a'], kind: 'ad', text: [['www.bahn-tal.de: Fahrkarten und Fahrpläne für alle Züge im Tal', 'www.bahn-tal.de: tickets and timetables for all trains in the valley']] },
          { label: ['9b', '9b'], kind: 'ad', text: [['www.stadtbus-alba.de: Busse in Alba – Linien und Preise', 'www.stadtbus-alba.de: buses in Alba – routes and prices']] },
          { label: ['10a', '10a'], kind: 'ad', text: [['Radladen Speiche: Reparatur in 24 Stunden', 'Speiche bike shop: repairs within 24 hours']] },
          { label: ['10b', '10b'], kind: 'ad', text: [['Autowerkstatt Müller: Reparatur für alle Automarken', 'Müller garage: repairs for all car makes']] }],
        items: [ab(['6. Sie möchten am Sonntag schwimmen gehen.', '6. You want to go swimming on Sunday.'], false, ['schwimmen']),
          ab(['7. Sie suchen eine Wohnung mit Balkon.', '7. You’re looking for an apartment with a balcony.'], true, ['Wohnung']),
          ab(['8. Sie möchten Deutsch lernen. Sie haben nur am Abend Zeit.', '8. You want to learn German. You only have time in the evening.'], false, ['Abend']),
          ab(['9. Sie möchten mit dem Zug von Alba nach Molinar fahren.', '9. You want to take the train from Alba to Molinar.'], true, ['Fahrkarte']),
          ab(['10. Ihr Fahrrad ist kaputt.', '10. Your bike is broken.'], true, ['kaputt'])] },

      { id: id('l3'), part: 'read', tarea: 3, title: ['Schilder und Aushänge', 'Signs and notices'],
        intro: ['Lesen Sie die Texte. Sind die Aussagen 11–15 richtig oder falsch?', 'Read the texts. Are statements 11–15 true or false?'],
        blocks: [
          { label: ['11', '11'], kind: 'sign', text: [['Praxis Dr. Lang', 'Dr. Lang’s practice'], ['Sprechstunde: Mo–Fr 8–12 Uhr, Mo, Di, Do 15–18 Uhr', 'Office hours: Mon–Fri 8–12, Mon, Tue, Thu 3–6 p.m.'], ['Mittwochnachmittag geschlossen', 'Closed Wednesday afternoon']] },
          { label: ['12', '12'], kind: 'note', text: [['Wir suchen eine Aushilfe für samstags! Bitte im Laden fragen. Bäckerei Marta', 'We’re looking for a temp for Saturdays! Please ask in the shop. Marta’s Bakery']] },
          { label: ['13', '13'], kind: 'sign', text: [['Bibliothek: Bitte leise sein!', 'Library: please be quiet!'], ['Handys bitte ausschalten.', 'Please switch off your phones.']] },
          { label: ['14', '14'], kind: 'note', text: [['Elternabend: Donnerstag, 19 Uhr, Raum 12', 'Parents’ evening: Thursday, 7 p.m., room 12']] },
          { label: ['15', '15'], kind: 'sign', text: [['Heimatmuseum Alba', 'Alba local museum'], ['Heute Eintritt frei! Führung um 15 Uhr.', 'Free entry today! Guided tour at 3 p.m.']] }],
        items: [rf(['11. Sie können am Mittwoch um 16 Uhr zum Arzt gehen.', '11. You can go to the doctor at 4 p.m. on Wednesday.'], false, ['Sprechstunde']),
          rf(['12. Die Bäckerei sucht eine Person für das Wochenende.', '12. The bakery is looking for someone for the weekend.'], true, ['suchen']),
          rf(['13. In der Bibliothek darf man telefonieren.', '13. You may make phone calls in the library.'], false, ['leise']),
          rf(['14. Der Elternabend ist am Abend.', '14. The parents’ evening is in the evening.'], true, ['Abend']),
          rf(['15. Sie müssen heute für das Museum bezahlen.', '15. You have to pay for the museum today.'], false, ['Eintritt'])] },

      // ================================================================ Schreiben (20 min)
      { id: id('s1'), part: 'write', tarea: 1, title: ['Ein Formular für Eva', 'A form for Eva'], min: 5, max: 20,
        intro: ['Ihre Freundin Eva Kowalski möchte im Sportverein Alba schwimmen. Eva hat keine Zeit. Sie füllen das Formular für Eva aus.', 'Your friend Eva Kowalski wants to swim at the Alba sports club. Eva has no time, so you fill in the form for her.'],
        prompt: [['Eva ist 24 Jahre alt und kommt aus Polen. Sie wohnt in der Lindenstraße 5 in Alba. Sie möchte am Abend schwimmen und mit Karte bezahlen.', 'Eva is 24 and comes from Poland. She lives at Lindenstraße 5 in Alba. She wants to swim in the evening and pay by card.']],
        form: [{ label: ['Alter:', 'Age:'], want: { number: 24, numberWords: ['vierundzwanzig'] } }, { label: ['Herkunftsland:', 'Country of origin:'], want: { lemmas: ['Polen'] } },
          { label: ['Straße, Hausnummer:', 'Street, house number:'], want: { lemmas: ['Lindenstraße', 'Lindenstrasse', 'Linden'] } },
          { label: ['Kurszeit (Vormittag, Nachmittag oder Abend):', 'Time (morning, afternoon or evening):'], want: { lemmas: ['Abend', 'abends'] } },
          { label: ['Zahlung (bar oder Karte):', 'Payment (cash or card):'], want: { lemmas: ['Karte', 'Kreditkarte', 'EC-Karte'] } }],
        model: '24\nPolen\nLindenstraße 5\nAbend\nKarte',
        weak: '24' },
      { id: id('s2'), part: 'write', tarea: 2, title: ['Eine E-Mail an Herrn Wolf', 'An email to Mr. Wolf'], min: 25, max: 40,
        intro: ['Sie können morgen nicht zum Deutschkurs kommen. Schreiben Sie Ihrem Kursleiter, Herrn Wolf, eine E-Mail (circa 30 Wörter).', 'You can’t come to the German class tomorrow. Write your teacher, Mr. Wolf, an email (about 30 words).'],
        prompt: [['Schreiben Sie zu jedem Punkt ein bis zwei Sätze:', 'Write one or two sentences for each point:']],
        points: [{ t: ['Warum kommen Sie nicht?', 'Why aren’t you coming?'], want: { lemmas: ['krank', 'Arzt', 'arbeiten', 'Termin', 'Kind', 'Besuch', 'Familie', 'Mutter', 'Vater', 'Fieber', 'Kopfschmerzen', 'müssen', 'weil', 'denn'] } },
          { t: ['Fragen Sie nach den Hausaufgaben.', 'Ask about the homework.'], want: { lemmas: ['Hausaufgabe', 'Aufgabe', 'Seite', 'Übung', 'Buch', 'Arbeitsblatt'] } },
          { t: ['Wann kommen Sie wieder?', 'When are you coming back?'], want: { lemmas: DAYS.concat(['wieder', 'nächste', 'Woche', 'Kurs', 'kommen']) } }],
        model: 'Lieber Herr Wolf, ich kann morgen leider nicht zum Kurs kommen, denn ich bin krank und muss zum Arzt gehen. Was sind die Hausaufgaben? Können Sie mir bitte schreiben? Am Montag komme ich wieder. Viele Grüße, Alex',
        weak: 'Hallo. Ich bin krank. Tschüss.' },

      // ================================================================ Sprechen (about 15 min)
      { id: id('sp1a'), part: 'speak', tarea: 1,
        card: { title: ['Teil 1: Sich vorstellen', 'Part 1: Introducing yourself'], lines: [['Sprechen Sie über sich. Die Wörter helfen.', 'Talk about yourself. The words help.']],
          list: [['Name?', 'Name?'], ['Alter?', 'Age?'], ['Land?', 'Country?'], ['Wohnort?', 'Where you live?'], ['Sprachen?', 'Languages?'], ['Beruf?', 'Job?'], ['Hobby?', 'Hobby?']] },
        ask: [['Wir fangen an. Bitte stellen Sie sich vor.', 'Let’s begin. Please introduce yourself.']],
        simpler: ['Wie heißen Sie? Woher kommen Sie? Wo wohnen Sie?', 'What’s your name? Where are you from? Where do you live?'], goal: 'Introduce yourself: name, age, country, where you live, languages, job, hobby.',
        want: { lemmas: ['heißen', 'Name', 'sein', 'Jahr', 'alt', 'kommen', 'wohnen', 'sprechen', 'arbeiten', 'Hobby', 'gern'], need: 3, min: 15 },
        model: ['Ich heiße Alex Morales. Ich bin 25 Jahre alt und komme aus Kanada. Ich wohne in Alba. Ich spreche Englisch, Französisch und ein bisschen Deutsch. Ich arbeite in einem Laden. Mein Hobby ist Lesen.', 'My name is Alex Morales. I’m 25 and I come from Canada. I live in Alba. I speak English, French and a little German. I work in a shop. My hobby is reading.'] },
      { id: id('sp1b'), part: 'speak', tarea: 1, ask: [['Danke. Und wie ist Ihre Telefonnummer?', 'Thank you. And what’s your phone number?']],
        simpler: ['Ihre Telefonnummer, bitte.', 'Your phone number, please.'], goal: 'Say your phone number (any number is fine).',
        want: { number: true, lemmas: ['Telefonnummer', 'Nummer'], min: 3 },
        model: ['Meine Telefonnummer ist 0176 3458 12.', 'My phone number is 0176 3458 12.'] },
      { id: id('sp2a'), part: 'speak', tarea: 2,
        card: { title: ['Teil 2: Thema «Essen und Trinken»', 'Part 2: Topic “Food and drink”'], lines: [['Fragen und antworten Sie. Die Wortkarten: «Frühstück», «Lieblingsessen», «Getränk».', 'Ask and answer. The word cards: “breakfast”, “favorite food”, “drink”.']] },
        ask: [['Meine Karte ist «Frühstück». Was essen Sie zum Frühstück?', 'My card is “breakfast”. What do you have for breakfast?']],
        simpler: ['Essen Sie morgens Brot? Trinken Sie Kaffee?', 'Do you eat bread in the morning? Do you drink coffee?'], goal: 'Say what you have for breakfast.',
        want: { topic: ['food', 'drink'], lemmas: ['essen', 'trinken', 'Brot', 'Kaffee', 'Tee', 'Ei', 'Müsli', 'Käse', 'Obst', 'Frühstück', 'Butter', 'Marmelade', 'Milch', 'Brötchen'], min: 4 },
        model: ['Zum Frühstück esse ich Brot mit Käse, und ich trinke einen Kaffee.', 'For breakfast I eat bread with cheese, and I drink a coffee.'] },
      { id: id('sp2b'), part: 'speak', tarea: 2, ask: [['Jetzt Sie. Ihre Karte ist «Lieblingsessen». Fragen Sie mich!', 'Now you. Your card is “favorite food”. Ask me a question!']],
        simpler: ['Fragen Sie mich: Was esse ich gern?', 'Ask me: what do I like to eat?'], goal: 'Ask the examiner a question with the word «Lieblingsessen».',
        want: { lemmas: ['Lieblingsessen', 'essen', 'gern', 'mögen', 'was', 'Essen'], min: 3 },
        model: ['Was ist Ihr Lieblingsessen?', 'What’s your favorite food?'] },
      { id: id('sp2c'), part: 'speak', tarea: 2, ask: [['Mein Lieblingsessen ist Pizza. Meine nächste Karte ist «Getränk»: Was trinken Sie gern?', 'My favorite food is pizza. My next card is “drink”: what do you like to drink?']],
        simpler: ['Trinken Sie gern Tee? Oder Saft?', 'Do you like tea? Or juice?'], goal: 'Say what you like to drink.',
        want: { topic: ['drink'], lemmas: ['trinken', 'gern', 'Wasser', 'Saft', 'Tee', 'Kaffee', 'Milch', 'Limonade', 'Kakao', 'Apfelsaft'], min: 3 },
        model: ['Ich trinke gern Apfelsaft und Tee.', 'I like drinking apple juice and tea.'] },
      { id: id('sp3a'), part: 'speak', tarea: 3,
        card: { title: ['Teil 3: Bitten', 'Part 3: Requests'], lines: [['Bitten Sie um etwas, und reagieren Sie auf eine Bitte. Die Bilder helfen.', 'Ask for something, and react to a request. The pictures help.']], icons: ['window', 'water'] },
        ask: [['Sehen Sie das Bild mit dem Fenster? Bitten Sie mich um etwas.', 'Do you see the picture with the window? Ask me for something.']],
        simpler: ['Es ist warm hier. Was soll ich machen?', 'It’s warm in here. What should I do?'], goal: 'Ask politely: open the window.',
        want: { lemmas: ['Fenster', 'aufmachen', 'öffnen', 'zumachen', 'schließen', 'können'], min: 3 },
        model: ['Können Sie bitte das Fenster aufmachen?', 'Could you please open the window?'] },
      { id: id('sp3b'), part: 'speak', tarea: 3, ask: [['Natürlich, gern. Jetzt ich: Können Sie mir bitte ein Glas Wasser geben?', 'Of course, gladly. Now me: could you please give me a glass of water?']],
        simpler: ['Ich möchte Wasser. Was sagen Sie?', 'I’d like some water. What do you say?'], goal: 'React to the request: say yes and hand it over.',
        want: { lemmas: ['ja', 'gern', 'natürlich', 'hier', 'klar', 'Wasser', 'Glas', 'sicher', 'bitte'], min: 2 },
        model: ['Ja, gern. Hier ist das Wasser.', 'Yes, of course. Here’s the water.'] },
    ],
  });
})();
