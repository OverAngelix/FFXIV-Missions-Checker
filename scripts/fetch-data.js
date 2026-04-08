import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function fetchDungeons() {
  console.log('Fetching datamined CSV...');
  const res = await fetch('https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/fr/ContentFinderCondition.csv');
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.statusText}`);
  }
  const text = await res.text();
  
  console.log('Parsing CSV...');
  const records = parse(text, {
    columns: (header) => header,
    skip_empty_lines: true
  });
  
  const expansions = {
    0: 'A Realm Reborn',
    1: 'Heavensward',
    2: 'Stormblood',
    3: 'Shadowbringers',
    4: 'Endwalker',
    5: 'Dawntrail'
  };

  const allowedContentTypes = ['2', '4', '5', '21', '26', '28', '30', '37'];

  console.log('Loading existing local data for persistency...');
  const outPath = path.resolve('src/assets/duties.json');
  const existingMap = new Map();
  if (fs.existsSync(outPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      existingData.forEach(duty => {
        const preserved = {};
        if (duty.lodestone_info && duty.lodestone_info.trim() !== '') preserved.lodestone_info = duty.lodestone_info;
        if (duty.lodestone_image && duty.lodestone_image.trim() !== '') preserved.lodestone_image = duty.lodestone_image;
        if (duty.guide && duty.guide.trim() !== '') preserved.guide = duty.guide;
        if (duty.description) preserved.description = duty.description;
        if (duty.prerequis) preserved.prerequis = duty.prerequis;
        if (duty.bosses) preserved.bosses = duty.bosses;
        
        if (Object.keys(preserved).length > 0) {
          existingMap.set(duty.id, preserved);
        }
      });
      console.log(`Preserved custom metadata for ${existingMap.size} duties.`);
    } catch (e) {
      console.warn('Could not parse existing duties.json, proceeding to fresh installation.');
    }
  }

  let duties = records
    .filter(row => allowedContentTypes.includes(row.ContentType) && row.Name && row.Name.trim() !== '')
    .map(row => {
      let exVersion = parseInt(row.RequiredExVersion, 10) || 0;
      const name = row.Name.trim();
      const nameLower = name.toLowerCase();
      
      let baseType = 'Unknown';
      let objDifficulty = 'NORMAUX';

      if (row.ContentType === '2') {
        baseType = 'Dungeon';
      } else if (row.ContentType === '4') {
        baseType = 'Trial';
      } else if (['5', '28', '37'].includes(row.ContentType)) {
        if (row.ContentMemberType === '4' || row.AllianceRoulette === 'True' || row.ContentType === '37') {
          baseType = 'Raid24';
        } else {
          baseType = 'Raid8';
        }
      } else if (['21', '26', '30'].includes(row.ContentType)) {
        baseType = 'Extra';
      }

      if (baseType === 'Dungeon') {
        if (nameLower.includes('(brutal)')) {
          objDifficulty = 'BRUTAL';
        } else {
          objDifficulty = 'NORMAUX';
        }
      } else if (row.ContentType === '28') {
        objDifficulty = 'FATAL';
      } else if (row.ContentType === '37') {
        objDifficulty = 'CHAOS';
      } else if (nameLower.includes('(sadique)')) {
        objDifficulty = 'SADIQUE';
      } else if (nameLower.includes('(extrême)') || nameLower.includes('extrême')) {
        objDifficulty = 'EXTRÊME';
      } else if (nameLower.includes('(brutal)')) {
        objDifficulty = 'BRUTAL';
      } else if (row.ContentType === '21') {
        objDifficulty = 'Donjons sans fond';
        // Correct exVersion specifically for Orthos which drops in EW
        if (nameLower.includes('orthos')) exVersion = 4;
        else if (nameLower.includes('pilier')) exVersion = 2; // Stormblood
        else exVersion = 1; // HW/ARR for Palais
      } else if (row.ContentType === '26') {
        objDifficulty = "Missions d'exploration";
        if (nameLower.includes('eurêka')) exVersion = 2;
        if (nameLower.includes('garde-la-reine') || nameLower.includes('bozja')) exVersion = 3;
      } else if (row.ContentType === '30') {
        if (nameLower.includes('alternatif')) {
          objDifficulty = 'Donjons alternatifs';
        } else {
          objDifficulty = 'Donjons à embranchements';
        }
        exVersion = 4; // Variant dungeons are EW, wait Aloalo is EW? Yes.
      } else {
        objDifficulty = 'NORMAUX';
      }

      return {
        id: parseInt(row['#'], 10),
        name: name,
        level: parseInt(row.ClassJobLevelRequired, 10) || 0,
        expansionId: exVersion,
        expansionName: expansions[exVersion] || expansions[0],
        type: baseType,
        difficulty: objDifficulty,
        lodestone_info: existingMap.get(parseInt(row['#'], 10))?.lodestone_info || '',
        ...(existingMap.get(parseInt(row['#'], 10))?.lodestone_image ? { lodestone_image: existingMap.get(parseInt(row['#'], 10)).lodestone_image } : {}),
        ...(existingMap.get(parseInt(row['#'], 10))?.guide ? { guide: existingMap.get(parseInt(row['#'], 10)).guide } : {}),
        ...(existingMap.get(parseInt(row['#'], 10))?.description ? { description: existingMap.get(parseInt(row['#'], 10)).description } : {}),
        ...(existingMap.get(parseInt(row['#'], 10))?.prerequis ? { prerequis: existingMap.get(parseInt(row['#'], 10)).prerequis } : {}),
        ...(existingMap.get(parseInt(row['#'], 10))?.bosses ? { bosses: existingMap.get(parseInt(row['#'], 10)).bosses } : {})
      };
    });

  // Inject Static Guides
  const guidesPath = path.resolve('src/assets/guides.json');
  if (fs.existsSync(guidesPath)) {
    const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf8'));
    const formattedGuides = guides.map(g => ({
       ...g,
       expansionName: expansions[g.expansionId],
       lodestone_info: existingMap.get(g.id)?.lodestone_info || g.lodestone_info || '',
       ...(existingMap.get(g.id)?.lodestone_image || g.lodestone_image ? { lodestone_image: existingMap.get(g.id)?.lodestone_image || g.lodestone_image } : {}),
       ...(existingMap.get(g.id)?.guide || g.guide ? { guide: existingMap.get(g.id)?.guide || g.guide } : {}),
       ...(existingMap.get(g.id)?.description || g.description ? { description: existingMap.get(g.id)?.description || g.description } : {}),
       ...(existingMap.get(g.id)?.prerequis || g.prerequis ? { prerequis: existingMap.get(g.id)?.prerequis || g.prerequis } : {}),
       ...(existingMap.get(g.id)?.bosses || g.bosses ? { bosses: existingMap.get(g.id)?.bosses || g.bosses } : {})
    }));
    duties = duties.concat(formattedGuides);
  }

  // Final sort
  duties = duties.sort((a, b) => {
    if (a.expansionId !== b.expansionId) return a.expansionId - b.expansionId;
    return a.level - b.level;
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(duties, null, 2));
  console.log(`Saved ${duties.length} duties to ${outPath}`);
}

fetchDungeons().catch(console.error);
