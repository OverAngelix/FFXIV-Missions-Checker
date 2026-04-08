import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://fr.finalfantasyxiv.com';
const START_URL = `${BASE_URL}/lodestone/playguide/db/duty/?page=`;
const DATA_FILE = path.join(__dirname, '../src/assets/duties.json');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchHtml(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) {
    console.error("Erreur fetch:", e);
    return null;
  }
}

async function scrapeAll() {
  console.log("Lecture du fichier duties.json...");
  if (!fs.existsSync(DATA_FILE)) {
    console.error("Fichier introuvable :", DATA_FILE);
    return;
  }

  let duties = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const lodestoneUrls = {};

  // Vérifier si un donjon manque d'URL. S'ils ont tous un lodestone_info, on peut sauter l'étape longue.
  const needsIndexScrape = duties.some(d => !d.lodestone_info);

  if (needsIndexScrape) {
    console.log("Des données sont manquantes, parcours de The Lodestone pour référencer les URLs...");

    let page = 1;
    let maxPage = 1;

    while (page <= maxPage) {
    console.log(`Lecture index Lodestone : Page ${page}/${maxPage}...`);
    const html = await fetchHtml(START_URL + page);
    if (!html) break;

    const $ = cheerio.load(html);

    // Au premier passage, déterminer le nombre max de pages "Page 1 of 65"
    if (page === 1) {
      const pagerText = $('.btn__pager__current').text();
      const match = pagerText.match(/of (\d+)/);
      if (match) {
        maxPage = parseInt(match[1], 10);
      } else {
        // Fallback sécurisé : on s'arrête si on ne capte pas le max, ou on met à 1 pour ne récupérer que la 1ère page (pour éviter l'infini)
        const lis = $('li.next_all a').attr('href'); // parfois 'href' ="?page=65"
        if (lis) {
          const m = lis.match(/page=(\d+)/);
          if (m) maxPage = parseInt(m[1], 10);
        }
      }
      if (maxPage === 1) maxPage = 65; // Estimation si l'html diffère, évitons le bug
    }

    let foundLinks = 0;
    $('.db-table__txt--detail_link').each((i, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href');
      if (name && href) {
        lodestoneUrls[name.toLowerCase()] = BASE_URL + href;
        foundLinks++;
      }
    });

    if (foundLinks === 0) break; // Fin des résultats

      page++;
      await delay(1000); // 1 seconde de répit pour le serveur
    }

    console.log(`\nTrouvé ${Object.keys(lodestoneUrls).length} donjons dans l'index.`);
  } else {
    console.log("Tous les donjons ont déjà commencé à être renseignés (lodestone_info présent) ! On ignore le scan de l'index.");
  }

  console.log("Démarrage de l'enrichissement des donjons manquants...\n");

  let updatedCount = 0;

  for (let i = 0; i < duties.length; i++) {
    let d = duties[i];

    // 1. Mettre à jour l'URL si trouvé et s'il n'existe pas déjà
    const lowerName = d.name.toLowerCase();
    if (!d.lodestone_info && lodestoneUrls[lowerName]) {
      d.lodestone_info = lodestoneUrls[lowerName];
    }

    // 2. Remplir les blancs si besoin (on passe s'il a déjà une desc et image)
    const hasMissingData = !d.description || !d.lodestone_image || !d.bosses;

    // Si on a l'URL et qu'il manque des choses
    if (hasMissingData && d.lodestone_info && d.lodestone_info.includes('lodestone')) {
      console.log(`[${i + 1}/${duties.length}] Extraction : ${d.name} ...`);
      const html = await fetchHtml(d.lodestone_info);
      if (!html) {
        await delay(1000);
        continue;
      }

      const $ = cheerio.load(html);

      // Image
      if (!d.lodestone_image) {
        const imgSrc = $('.db-view__detail__visual img').attr('src');
        if (imgSrc) d.lodestone_image = imgSrc;
      }

      // Description
      if (!d.description) {
        let desc = '';
        $('.db-view__data__title_content_info').each((idx, el) => {
          if ($(el).text().trim().toLowerCase().includes('description')) {
            desc = $(el).next('.db-view__data__content_info').text().replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
          }
        });
        
        if (desc) d.description = desc;
      }

      // Bosses
      if (!d.bosses) {
        const bosses = [];
        // On cible les div ayant la classe "boss"
        $('.boss').each((idx, el) => {
          // Extraction du nom (selon la structure lodestone, ça peut être le texte direct ou un span)
          // On nettoie les espaces inutiles.
          let bName = $(el).text().replace(/\n+/g, '').replace(/\s{2,}/g, ' ').trim();
          if (bName) {
            bosses.push({ name: bName });
          }
        });

        if (bosses.length > 0) {
          d.bosses = bosses;
        }
      }

      updatedCount++;

      // Sauvegarde régulière
      fs.writeFileSync(DATA_FILE, JSON.stringify(duties, null, 2));

      // Pause de 1.5s requise pour épargner le Lodestone
      await delay(1500);
    }
  }

  console.log(`\nOpération terminée avec succès. ${updatedCount} missions enrichies/mises à jour.`);
}

scrapeAll();
