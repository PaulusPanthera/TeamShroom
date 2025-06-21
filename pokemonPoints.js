// pokemonPoints.js
// Points mapping for all Pokémon families based on tier
// Tier 6: 2 Points, Tier 5: 3 Points, Tier 4: 6 Points, Tier 3: 10 Points, Tier 2: 15 Points, Tier 1: 25 Points, Tier 0: 30 Points

window.TIER_POINTS = {
  "Tier 6": 2,
  "Tier 5": 3,
  "Tier 4": 6,
  "Tier 3": 10,
  "Tier 2": 15,
  "Tier 1": 25,
  "Tier 0": 30
};

window.TIER_FAMILIES = {
  "Tier 6": [
    "Abra","Aron","Baltoy","Basculin","Bidoof","Blitzle","Bouffalant","Bronzor",
    "Buizel","Chinchou","Clamperl","Cubchoo","Cubone","Deerling","Diglett","Drowzee","Druddigon",
    "Dunsparce","Durant","Duskull","Dwebble","Elgyem","Foongus","Frillish","Gastly","Geodude",
    "Goldeen","Golett","Gothita","Grimer","Heatmor","Hoppip","Horsea","Jigglypuff","Jynx",
    "Koffing","Krabby","Lickitung","Lillipup","Litwick","Lotad","Lunatone","Machop","Magikarp",
    "Magnemite","Makuhita","Mantine","Marill","Meowth","Mienfoo","Nidoran-f","Nidoran-m","Numel","Oddish",
    "Onix","Paras","Patrat","Pidgey","Pidove","Pikachu","Poliwag","Ponyta","Poochyena","Psyduck",
    "Purrloin","Rattata","Rhyhorn","Roggenrola","Roselia","Sandile","Sandshrew","Seel","Sewaddle","Shellos",
    "Shelmet","Shuppet","Slowpoke","Slugma","Smeargle","Sneasel","Snover","Solosis","Solrock","Spearow",
    "Spheal","Stunfisk","Surskit","Swablu","Swinub","Taillow","Tangela","Tentacool","Timburr","Torkoal",
    "Tympole","Voltorb","Whismur","Wingull","Wobbuffet","Woobat","Wooper","Yamask","Zigzagoon","Zubat"
  ],
  "Tier 5": [
    "Axew","Caterpie","Deino","Delibird","Ditto","Doduo","Ekans","Electrike","Ferroseed","Gible","Girafarig",
    "Glameow","Gligar","Growlithe","Hoothoot","Joltik","Klink","Kricketot","Mankey","Mareep","Mawile","Meditite",
    "Minccino","Murkrow","Natu","Phanpy","Rufflet","Sableye","Scraggy","Seedot","Shinx","Snorunt","Spinarak",
    "Teddiursa","Vanillite","Vullaby","Vulpix","Weedle"
  ],
  "Tier 4": [
    "Bellsprout","Buneary","Chimecho","Clefairy","Cottonee","Darumaka","Dratini","Drifloon","Electabuzz","Hippopotas",
    "Karrablast","Larvitar","Ledyba","Magmar","Miltank","Minun","Pachirisu","Petilil","Sawk","Snubbull","Spoink", "Spinda",
    "Stantler","Starly","Stunky","Sunkern","Tauros","Throh","Trapinch","Trubbish","Tynamo","Venipede","Venonat","Wurmple"
  ],
  "Tier 3": [
    "Bagon","Barboach","Cacnea","Carvanha","Chatot","Corsola","Cryogonal","Drifloon","Finneon","Houndour",
    "Illumise","Luvdisc","Maractus","Munna","Nincada","Pawniard","Ralts","Remoraid","Seviper",
    "Shellder","Sigilyph","Staryu","Unown","Volbeat","Wailmer","Zangoose"
  ],
  "Tier 2": [
    "Aipom","Combee","Croagunk","Exeggcute","Farfetch'd","Gulpin","Heracross","Kangaskhan","Lapras","Mr. Mime",
    "Pineco","Plusle","Qwilfish","Relicanth","Shroomish","Tropius","Yanma"
  ],
  "Tier 1": [
    "Absol","Aerodactyl","Anorith","Archen","Beldum","Burmy","Carnivine","Castform","Chansey","Cherubi","Cranidos",
    "Eevee","Feebas","Kabuto","Kecleon","Larvesta","Lileep","Omanyte","Panpour","Pansage","Pansear","Pinsir",
    "Scyther","Shieldon","Skarmory","Skitty","Slakoth","Snorlax","Sudowoodo","Tirtouga", "Zorua"
  ],
  "Tier 0": [
    "Alomomola","Audino","Bulbasaur","Charmander","Chikorita","Chimchar","Cyndaquil",
    "Drilbur","Ducklett","Emolga","Mudkip","Oshawott","Piplup","Porygon","Riolu","Rotom","Shedinja","Snivy",
    "Spiritomb","Squirtle","Tepig","Togepi","Torchic","Totodile","Treecko","Turtwig","Tyrogue"
  ]
};

// Build the points map at runtime, after pokemonFamilies.js is loaded
window.buildPokemonPoints = function() {
  const points = {};
  Object.entries(window.TIER_FAMILIES).forEach(([tier, list]) => {
    const pointVal = window.TIER_POINTS[tier];
    list.forEach(mon => {
      let familyBase = mon
        .toLowerCase()
        .replace(/\[.*\]/g,"")
        .replace(/♀/g,"-f")
        .replace(/♂/g,"-m")
        .replace(/[- '\.’]/g,"")
        .trim();
      // Add all known aliases for this family
      if(window.pokemonFamilies && window.pokemonFamilies[familyBase]) {
        // Add all aliases (keys) that point to this family array
        Object.keys(window.pokemonFamilies).forEach(famKey => {
          if (
            window.pokemonFamilies[famKey] === window.pokemonFamilies[familyBase] ||
            (
              Array.isArray(window.pokemonFamilies[famKey]) &&
              Array.isArray(window.pokemonFamilies[familyBase]) &&
              window.pokemonFamilies[famKey].join() === window.pokemonFamilies[familyBase].join()
            )
          ) {
            points[famKey] = pointVal;
          }
        });
        // Also add all the listed family members (as in your code)
        window.pokemonFamilies[familyBase].forEach(famName => {
          let key = famName
            .toLowerCase()
            .replace(/♀/g,"-f")
            .replace(/♂/g,"-m")
            .replace(/[- '\.’]/g,"")
            .trim();
          points[key] = pointVal;
        });
      } else {
        points[familyBase] = pointVal;
      }
    });
  });
  window.POKEMON_POINTS = points;
};

// If families already loaded, build immediately
if (window.pokemonFamilies) window.buildPokemonPoints();
