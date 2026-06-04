import { readFileSync, writeFileSync } from "fs";

function setVal(obj, path, val) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function getVal(obj, path) {
  return path.split(".").reduce((o, k) => o && o[k], obj);
}

// [keyPath, fr, rw, sw]
const keys = [
  ["notifications.deleteSuccess", "Notification supprimée", "Ubutumwa bwasibwe", "Arifa imefutwa"],
  ["dashboard.kyc.verificationRequired", "Vérification requise", "Imenyekanisha Rirakenewe", "Uthibitishaji Unahitajika"],
  ["dashboard.kyc.verificationDesc", "Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité.", "Kugira ngo ubone ibikorwa byose nka kwandikisha ibintu, emeza indangamuntu yawe.", "Ili kupata vipengele vyote kama usajili wa bidhaa, thibitisha utambulisho wako."],
  ["dashboard.kyc.completeButton", "Terminer la vérification", "Sooza Imenyekanisha", "Kamilisha Uthibitishaji"],
  ["dashboard.kyc.verifiedTooltip", "Identité vérifiée", "Umwirondoro Wemejwe", "Utambulisho Uliothibitishwa"],
  ["dashboard.action.verifyTitle", "Complétez votre vérification", "Sooza Imenyekanisha Ryawe", "Kamilisha Uthibitishaji Wako"],
  ["dashboard.action.verifyDesc", "Pour sécuriser vos articles et accéder aux fonctionnalités de récupération, vérifiez votre identité.", "Kugira ngo urinde neza ibintu byawe, sooza imenyekanisha ry'ubunga bwawe.", "Ili kulinda vitu vyako na kupata vipengele vyote, kamilisha uthibitishaji wa utambulisho."],
  ["dashboard.action.verifyAction", "Vérifier maintenant", "Emeza Ubu", "Thibitisha Sasa"],
  ["dashboard.admin.pendingActions", "Actions en attente", "Ibikorwa Bitegereje", "Vitendo Vinavyosubiri"],
  ["dashboard.admin.pendingVerifications", "Vérifications en attente", "Imenyekanisha Ritegeye", "Uthibitishaji Unasubiri"],
  ["dashboard.admin.commandCenter", "Centre de commande Admin", "Icyicaro cy'Ubuyobozi", "Kituo cha Amri cha Msimamizi"],
  ["dashboard.agent.handover", "Transfert sécurisé", "Igurura Rifite Umutekano", "Ukabidhi Salama"],
  ["dashboard.agent.handoverInitiate", "Initiez le transfert sécurisé d'un article à son propriétaire.", "Tangira igurura ry'ibintu ku nyir'ibyo bintu cyangwa uwabibonye.", "Anzisha ukabidhi salama wa kitu kwa mmiliki au aliyekipata."],
  ["dashboard.agent.handoverVerify", "Vérifiez le code envoyé au {{channel}} du destinataire.", "Suzuma kode yoherejwe kuri {{channel}} y'uwakiriye.", "Thibitisha nambari iliyotumwa kwa {{channel}} ya mpokeaji."],
  ["dashboard.agent.handoverSuccess", "Transfert de garde effectué avec succès.", "Ihererekanya ry'ibintu ryasohotse neza.", "Uhamisho wa umiliki umekamilika kwa mafanikio."],
  ["dashboard.agent.assistedCreation", "Inscription assistée", "Kwiyandikisha Gufashwe", "Usajili wa Kusaidiwa"],
  ["dashboard.agent.assistedCreationDesc", "Créez un nouveau compte KIZERE pour un abonné sur le terrain.", "Fungura konti nshya ya KIZERE ku mwandikwa mu gasozi.", "Unda akaunti mpya ya KIZERE kwa mwanachama shambani."],
  ["dashboard.agent.unauthorized", "Accès non autorisé", "Kwinjira Bidakuye", "Ufikiaji Usioidhinishwa"],
  ["dashboard.agent.unauthorizedDesc", "Vous n'avez pas la permission d'accéder à la console Agent.", "Ntufite uburenganzira bwo kureba Aho Abakozi Bakorera.", "Huna ruhusa ya kuona Dashibodi ya Wakala."],
  ["dashboard.identityProtection.status", "Statut de vérification", "Imimerere y'Imenyekanisha", "Hali ya Uthibitishaji"],
  ["dashboard.identityProtection.status_unverified", "Non vérifié", "Ntiremejwe", "Haijathibitishwa"],
  ["dashboard.identityProtection.status_pending", "En attente de révision", "Itegereje Isuzumwa", "Inasubiri Ukaguzi"],
  ["dashboard.identityProtection.status_approved", "Identité vérifiée", "Umwirondoro Wemejwe", "Utambulisho Uliothibitishwa"],
  ["dashboard.identityProtection.status_rejected", "Action requise", "Hakenewe Igikorwa", "Hatua Inahitajika"],
  ["dashboard.identityProtection.pending_msg", "Notre équipe examine vos documents. Cela prend généralement 24 heures.", "Itsinda ryacu riri gusuzuma impapuro zawe. Ibi kenshi bikora mu masaha 24.", "Timu yetu inakagua nyaraka zako. Hii kawaida inachukua masaa 24."],
  ["dashboard.identityProtection.approved_msg", "Votre identité est vérifiée. Vous avez maintenant accès à toutes les fonctionnalités.", "Umwirondoro wawe wemejwe. Ubu ufite uburenganzira bwuzuye kuri ibikorwa byose.", "Utambulisho wako umethibitishwa. Sasa una ufikiaji kamili wa vipengele vyote."],
  ["dashboard.identityProtection.rejected_msg", "La vérification a échoué. Veuillez vérifier la raison et réessayer.", "Imenyekanisha ntirikunze. Reba impamvu maze ugerageze nanone.", "Uthibitishaji haukufanikiwa. Tafadhali angalia sababu na ujaribu tena."],
  ["dashboard.identityProtection.unverified_msg", "Vérifiez votre identité pour augmenter votre score de confiance et sécuriser vos articles.", "Emeza indangamuntu yawe kugira ngo wongere amanota y'icizere no kurinda ibintu byawe.", "Thibitisha utambulisho wako ili kuongeza alama yako ya uaminifu na kulinda vitu vyako."],
  ["ocr.kyc_helper", "Assistant ID", "Umufasha wa Indangamuntu", "Msaidizi wa Kitambulisho"],
  ["ocr.kyc_name_match", "Nom correspondant", "Izina Ryahuye", "Jina Limelingana"],
  ["ocr.kyc_name_mismatch", "Avertissement de non-correspondance du nom", "Ijambo ry'Izina Ryinyuranya", "Onyo la Kutofanana kwa Jina"],
  ["ocr.kyc_low_confidence", "Qualité d'image faible", "Ubwiza bw'Ifoto Buke", "Ubora wa Picha ni Mdogo"],
  ["ocr.kyc_mismatch_desc", "Le nom sur la pièce d'identité ne correspond pas parfaitement au nom de votre profil.", "Izina riri ku ndangamuntu ntirishoboka ko ryuhuye neza n'izina rya konti yawe.", "Jina kwenye kitambulisho halilingani na jina la akaunti yako."],
  ["ocr.kyc_low_conf_desc", "Le texte est difficile à lire. Une photo nette accélère l'approbation manuelle.", "Inyandiko nzigama gusobanuka. Ifoto nziza yihuta kwemezwa.", "Maandishi ni magumu kusoma. Picha wazi inaharakisha idhini ya mkono."],
  ["ocr.kyc_success_desc", "L'IA a vérifié avec succès le nom sur votre document.", "AI yemeje neza izina riri ku nyandiko zawe.", "AI imethibitisha kwa mafanikio jina kwenye hati yako."],
  ["searchPage.featured", "À la une", "Ifeatured", "Iliyoangaziwa"],
  ["searchPage.verifiedMatch", "Correspondance vérifiée", "Guhuza Kwemejwe", "Mechi Iliyothibitishwa"],
  ["searchPage.privacyProtected", "Confidentialité protégée", "Ubuzima bw'Amakuru Burindwa", "Faragha Inalindwa"],
  ["searchPage.privacyHintShort", "Certains détails généralisés", "Amakuru amwe yageneraliye", "Maelezo fulani yamefupishwa"],
  ["searchPage.privacyHintLong", "Les détails sensibles sont masqués dans la recherche publique et révélés après vérification.", "Amakuru y'ibanga ayubitswe mu gushakisha rusange kandi akerekwa gusa nyuma y'imenyekanisha.", "Maelezo nyeti yamefichwa katika utafutaji wa umma na yanafunuliwa tu baada ya uthibitishaji."],
  ["pos.transactions", "Historique des transactions", "Amateka y'Ibikorwa", "Historia ya Miamala"],
  ["pos.transactionsDesc", "Voir toutes les inscriptions et ventes traitées par votre magasin.", "Reba iyandikwa n'ubucuruzi bwose bwakoze iduka ryawe.", "Angalia usajili wote na mauzo yaliyochakatwa na duka lako."],
  ["pos.export", "Exporter CSV", "Sohora CSV", "Hamisha CSV"],
  ["pos.customers", "Annuaire des clients", "Ububiko bw'Abakiriya", "Saraka ya Wateja"],
  ["pos.customersDesc", "Gérez les relations et consultez les historiques d'achat.", "Gucunga imishyikirano no kureba amateka y'ibicuruzwa byaguriwe.", "Simamia mahusiano na angalia historia za ununuzi."],
  ["pos.addCustomer", "Ajouter un nouveau client", "Ongeraho Umukiriya Mushya", "Ongeza Mteja Mpya"],
  ["pos.addCustomerDesc", "Enregistrez un nouveau client ou trouvez un client existant par son identifiant national.", "Andikisha umukiriya mushya cyangwa shakisha uwasanzemo ukoresheje indangamuntu.", "Sajili mteja mpya au tafuta aliyepo kwa kutumia kitambulisho chake cha kitaifa."],
  ["pos.settings", "Paramètres du terminal", "Igenamiterere ry'Urwego", "Mipangilio ya Terminali"],
  ["pos.settingsDesc", "Configurez votre accès API et les identifiants de votre magasin.", "Shiraho iyinjira rya API n'ibibonabona by'iduka ryawe.", "Sanidi ufikiaji wako wa API na vitambulisho vya duka."],
  ["pos.inventory.addTitle", "Ajouter à l'inventaire", "Ongeraho mu Bubiko", "Ongeza kwenye Hesabu"],
  ["pos.inventory.addDesc", "Ajoutez directement un nouveau produit à votre stock.", "Ongeraho igicuruzwa gishya mu bubiko bwawe.", "Ongeza moja kwa moja bidhaa mpya kwenye hifadhi yako."],
  ["pos.inventory.productNameLabel", "Nom du produit", "Izina ry'Igicuruzwa", "Jina la Bidhaa"],
  ["pos.inventory.skuLabel", "SKU (Optionnel)", "SKU (Si bisabwa)", "SKU (Hiari)"],
  ["pos.inventory.skuPlaceholder", "Unité de gestion des stocks", "Inomero y'Ububiko", "Kitengo cha Kuhifadhi Hifadhi"],
  ["pos.inventory.brandLabel", "Marque", "Icyapa", "Chapa"],
  ["pos.inventory.brandPlaceholder", "ex. Samsung, Apple", "nk'urugero Samsung, Apple", "mf. Samsung, Apple"],
  ["pos.inventory.modelLabel", "Modèle", "Modeli", "Mfano"],
  ["pos.inventory.modelPlaceholder", "ex. Galaxy S24, iPhone 15", "nk'urugero Galaxy S24, iPhone 15", "mf. Galaxy S24, iPhone 15"],
  ["pos.inventory.serialPlaceholder", "Entrez le numéro de série ou IMEI", "Injiza Numero ya Seri cyangwa IMEI", "Weka Nambari ya Serial au IMEI"],
  ["pos.inventory.addProduct", "Ajouter à l'inventaire", "Ongeraho mu Bubiko", "Ongeza kwenye Hesabu"],
  ["pos.stockIn", "Entrée en stock", "Injiza mu Bubiko", "Ingizo la Hifadhi"],
  ["pos.shiftSummary.title", "Résumé du quart de travail", "Incamake y'Akazi k'Umunsi", "Muhtasari wa Zamu ya Kila Siku"],
  ["pos.shiftSummary.subtitle", "Aperçu en temps réel de l'activité commerciale du jour.", "Incamake y'igihe nyacyo y'ibikorwa by'ubucuruzi bw'uyu munsi.", "Muhtasari wa wakati halisi wa shughuli za biashara ya leo."],
  ["pos.printSummary", "Imprimer le bilan EOD", "Shyira ku Mpapuro Incamake", "Chapisha Muhtasari wa Mwisho wa Siku"],
  ["pos.registrations", "Inscriptions", "Iyandikwa", "Usajili"],
  ["pos.transfers", "Transferts", "Irsimburana ry'Ubuzimagatozi", "Uhamisho"],
  ["pos.returns", "Retours", "Gusubiza", "Marejesho"],
  ["fields.fullName", "Nom complet", "Amazina Yuzuye", "Jina Kamili"],
  ["fields.nationalId", "Carte nationale d'identité / Passeport", "Indangamuntu / Pasiporo", "Kitambulisho cha Taifa / Pasipoti"],
  ["fields.phone", "Numéro de téléphone", "Nimero ya Telefoni", "Nambari ya Simu"],
  ["fields.email", "Adresse e-mail", "Imeli", "Anwani ya Barua Pepe"],
];

const paths = {
  fr: "client/src/lib/i18n/locales/fr.json",
  rw: "client/src/lib/i18n/locales/rw.json",
  sw: "client/src/lib/i18n/locales/sw.json",
};

const locales = {};
for (const [code, p] of Object.entries(paths)) {
  locales[code] = JSON.parse(readFileSync(p, "utf8"));
}

const counts = { fr: 0, rw: 0, sw: 0 };
for (const [keyPath, fr, rw, sw] of keys) {
  if (!getVal(locales.fr, keyPath)) { setVal(locales.fr, keyPath, fr); counts.fr++; }
  if (!getVal(locales.rw, keyPath)) { setVal(locales.rw, keyPath, rw); counts.rw++; }
  if (!getVal(locales.sw, keyPath)) { setVal(locales.sw, keyPath, sw); counts.sw++; }
}

for (const [code, p] of Object.entries(paths)) {
  writeFileSync(p, JSON.stringify(locales[code], null, 2) + "\n");
}

console.log("Added keys — fr:", counts.fr, "rw:", counts.rw, "sw:", counts.sw);
