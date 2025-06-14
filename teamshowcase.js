// teamshowcase.js

const teamShowcase = [
  { name: "ANNlLlATION", shinies: [ { name: "larvesta" } ] },
  { name: "ashash", shinies: [ { name: "rattata" }, { name: "magikarp" }, { name: "rhydon" } ] },
  { name: "BlistiK", shinies: [
    { name: "electabuzz" }, { name: "electabuzz" }, { name: "electabuzz" }, { name: "electabuzz" },
    { name: "pikachu" }, { name: "dratini" }, { name: "magikarp" }, { name: "raticate" },
    { name: "slowbro" }, { name: "durant" }, { name: "seel" }, { name: "cottonee" }
  ] },
  { name: "BojanglesisHere", shinies: [
    { name: "duskull" }, { name: "floatzel-f" }, { name: "rapidash" }, { name: "cubchoo" },
    { name: "smeargle" }, { name: "abra" }, { name: "golett" }, { name: "poliwhirl" },
    { name: "poliwhirl" }, { name: "koffing" }, { name: "parasect" }, { name: "kecleon" }, { name: "combee" }
  ] },
  { name: "Brokencycles", shinies: [ { name: "lanturn" }, { name: "bellossom" } ] },
  { name: "Bulkanator", shinies: [
    { name: "wurmple" }, { name: "golduck" }, { name: "graveler" }, { name: "mankey" },
    { name: "rapidash" }, { name: "rattata" }, { name: "machoke" }, { name: "sunkern" },
    { name: "deino" }, { name: "metapod" }
  ] },
  { name: "casethecase", shinies: [
    { name: "tentacruel" }, { name: "nidorino" }, { name: "axew" }, { name: "growlithe" }, { name: "marill" }
  ] },
  { name: "cgrtmlk", shinies: [ { name: "altaria" }, { name: "mienfoo" } ] },
  { name: "CheesasaurusRex", shinies: [
    { name: "dragonair" }, { name: "lopunny" }, { name: "vespiquen" }, { name: "vanilluxe" }, { name: "onix" }, { name: "onix" }
  ] },
  { name: "ChimpExc", shinies: [ { name: "tentacool" }, { name: "gastly" } ] },
  { name: "Chucklesworth", shinies: [ { name: "krookodile" }, { name: "krokorok" } ] },
  { name: "clairofan", shinies: [
    { name: "smeargle" }, { name: "lanturn" }, { name: "stoutland" }, { name: "pachirisu" },
    { name: "floatzel" }, { name: "camerupt" }, { name: "quagsire" }, { name: "taillow" },
    { name: "breloom" }, { name: "psyduck", lost: true }, { name: "psyduck" },
    { name: "weezing" }, { name: "petilil" }, { name: "sandslash" }, { name: "aipom" }, { name: "wailord" }
  ] },
  { name: "Cometsan", shinies: [
    { name: "geodude" }, { name: "pelipper" }, { name: "horsea" }, { name: "ditto" }, { name: "palpitoad" }, { name: "klink" }
  ] },
  { name: "CraazyHorse", shinies: [
    { name: "mightyena" }, { name: "victreebel" }, { name: "gastly" }, { name: "mankey" },
    { name: "gyarados" }, { name: "smeargle" }, { name: "magikarp" }, { name: "horsea" },
    { name: "zigzagoon" }, { name: "rapidash" }
  ] },
  { name: "DaddyMolo", shinies: [
    { name: "pidgeot" }, { name: "koffing" }, { name: "tangela" }, { name: "ditto" }, { name: "swablu" },
    { name: "ekans" }, { name: "ferroseed" }, { name: "basculin-red-striped" }, { name: "mareep" }, { name: "poliwhirl" },
    { name: "bouffalant" }, { name: "nidoran-m" }, { name: "slowbro" }, { name: "ducklett" }, { name: "vanilluxe" },
    { name: "raticate" }, { name: "noctowl" }, { name: "miltank" }, { name: "wooper" }, { name: "zigzagoon" }, { name: "pikachu" }, { name: "marill" }
  ] },
  { name: "DamoNll", shinies: [
    { name: "tentacruel" }, { name: "ditto" }, { name: "rapidash" }, { name: "ponyta" }, { name: "rapidash" }, { name: "beautifly" }, { name: "zigzagoon" }
  ] },
  { name: "Difoolioo", shinies: [
    { name: "gloom-f" }, { name: "ponyta" }, { name: "rapidash" }, { name: "heatmor" }
  ] },
  { name: "Draind", shinies: [
    { name: "smeargle" }, { name: "raticate-f", lost: true }, { name: "politoed" }, { name: "weezing" }, { name: "typhlosion" },
    { name: "weavile" }, { name: "graveler" }, { name: "gliscor" }, { name: "vanilluxe" }, { name: "donphan" },
    { name: "aerodactyl" }, { name: "bibarel" }, { name: "gallade" }, { name: "chansey" }, { name: "excadrill" }, { name: "blastoise" }, { name: "floatzel" }
  ] },
  { name: "Eerie", shinies: [
    { name: "slowpoke" }, { name: "lanturn" }, { name: "girafarig" }, { name: "staravia" }, { name: "pelipper" },
    { name: "golbat-f" }, { name: "claydol" }, { name: "parasect" }, { name: "koffing" }, { name: "togetic" },
    { name: "floatzel-f", lost: true }, { name: "gabite" }, { name: "buneary" }, { name: "ekans" }
  ] },
  { name: "ElMannun", shinies: [ { name: "seedot" }, { name: "nidorino" }, { name: "pidgey" } ] },
  { name: "FrostyIceScream", shinies: [
    { name: "shroomish" }, { name: "sneasel" }, { name: "magikarp" }, { name: "woobat" }, { name: "swoobat" },
    { name: "haxorus" }, { name: "politoed" }, { name: "camerupt" }, { name: "gliscor" }, { name: "roselia" },
    { name: "accelgor" }, { name: "spinda" }, { name: "gothorita" }
  ] },
  { name: "Geranxx", shinies: [
    { name: "rapidash" }, { name: "swellow" }, { name: "heatmor" }, { name: "rhydon" }
  ] },
  { name: "Glizcor", shinies: [
    { name: "camerupt" }, { name: "golduck" }, { name: "gliscor" }, { name: "breloom" }, { name: "accelgor" },
    { name: "weezing" }, { name: "pikachu" }, { name: "smeargle" }, { name: "parasect" }, { name: "alakazam" },
    { name: "bibarel" }, { name: "dugtrio" }, { name: "snorlax" }
  ] },
  { name: "Grayzxv", shinies: [ { name: "camerupt-f" }, { name: "fearow" } ] },
  { name: "Grrzzly", shinies: [
    { name: "mankey" }, { name: "minccino" }, { name: "phanpy" }, { name: "poochyena" }, { name: "cryogonal" },
    { name: "graveler" }, { name: "cottonee" }, { name: "koffing" }, { name: "zigzagoon" }
  ] },
  { name: "GTGxR", shinies: [
    { name: "haxorus" }, { name: "rapidash" }, { name: "swoobat" }, { name: "tentacruel" }, { name: "golett" },
    { name: "magikarp" }, { name: "vulpix" }, { name: "ralts" }, { name: "smeargle" }, { name: "poliwhirl" },
    { name: "poliwrath" }, { name: "paras" }, { name: "donphan" }
  ] },
  { name: "Gumbasketball", shinies: [
    { name: "duskull" }, { name: "magcargo" }, { name: "miltank" }, { name: "smeargle" }, { name: "spinda" },
    { name: "misdreavus" }, { name: "bibarel" }, { name: "cubchoo" }, { name: "golbat" }, { name: "raticate" },
    { name: "tentacruel" }, { name: "slakoth" }
  ] },
  { name: "Highschoolme", shinies: [ { name: "gardevoir" }, { name: "ninetales" } ] },
  { name: "Hjordi", shinies: [
    { name: "graveler", lost: true }, { name: "persian" }, { name: "nidoking" }, { name: "camerupt-f" }, { name: "spinda" },
    { name: "teddiursa" }, { name: "shinx" }, { name: "poliwrath" }, { name: "vibrava" }, { name: "pinsir" },
    { name: "nidoqueen" }, { name: "jigglypuff" }, { name: "mantine" }, { name: "rapidash" }, { name: "bibarel" },
    { name: "ralts" }, { name: "bellossom" }
  ] },
  { name: "iMonchi", shinies: [ { name: "rapidash" } ] },
  { name: "Instintooo", shinies: [ { name: "ditto" } ] },
  { name: "itsEasy", shinies: [
    { name: "tentacruel" }, { name: "hoppip" }, { name: "banette" }, { name: "woobat" }, { name: "swoobat" }, { name: "woobat" }
  ] },
  { name: "ItsKitas", shinies: [
    { name: "dodrio" }, { name: "donphan-f" }, { name: "vanillish" }, { name: "pidgey" }, { name: "donphan-f", lost: true }, { name: "tranquill" }
  ] },
  { name: "Jaspn", shinies: [
    { name: "whirlipede" }, { name: "galvantula" }, { name: "tentacruel" }, { name: "tentacruel" }, { name: "hydreigon" },
    { name: "zigzagoon" }, { name: "taillow" }, { name: "shuppet" }, { name: "azumarill" }, { name: "heatmor" },
    { name: "weezing" }, { name: "poochyena" }, { name: "linoone" }, { name: "donphan-f" }, { name: "dusclops" }, { name: "aron" }
  ] },
  { name: "Jayyxxi", shinies: [ { name: "mienfoo" }, { name: "deino" } ] },
  { name: "Jeakama", shinies: [
    { name: "chandelure" }, { name: "haxorus" }, { name: "wurmple" }, { name: "deino" }, { name: "treecko" },
    { name: "poliwhirl" }, { name: "girafarig" }
  ] },
  { name: "JGrenade", shinies: [ { name: "crobat" }, { name: "rapidash" }, { name: "tentacruel" }, { name: "wailord" } ] },
  { name: "Johnerrr", shinies: [
    { name: "victreebel" }, { name: "gyarados" }, { name: "ditto" }, { name: "rapidash" }, { name: "loudred" },
    { name: "bibarel-f" }, { name: "duskull" }, { name: "chandelure" }, { name: "cryogonal" }, { name: "magikarp" },
    { name: "smeargle" }, { name: "dratini" }
  ] },
  { name: "JulieJewel", shinies: [
    { name: "sandshrew" }, { name: "vanillite" }, { name: "tranquill" }, { name: "lanturn" }, { name: "koffing" },
    { name: "venipede" }, { name: "venipede" }, { name: "magcargo" }, { name: "donphan" }, { name: "spinda" },
    { name: "paras" }, { name: "amoonguss" }, { name: "whismur" }
  ] },
  { name: "Jutskaa", shinies: [
    { name: "miltank" }, { name: "gyarados" }, { name: "pidgeot" }, { name: "tentacruel" }, { name: "weezing" },
    { name: "lanturn" }, { name: "swellow" }, { name: "butterfree" }, { name: "golurk" }, { name: "marill" },
    { name: "slowbro" }, { name: "sealeo" }, { name: "quagsire" }, { name: "golbat" }, { name: "lillipup" },
    { name: "parasect" }, { name: "wingull" }, { name: "poochyena" }, { name: "watchog" }, { name: "magikarp" },
    { name: "machamp" }, { name: "beautifly" }, { name: "venipede" }, { name: "jigglypuff" }
  ] },
   { name: "KBritoBM", shinies: [
    { name: "koffing" }, { name: "geodude" }, { name: "dodrio" }
  ] },
  { name: "kitsucupid", shinies: [
    { name: "vulpix" }, { name: "munna" }, { name: "magikarp" }, { name: "poliwag" }, { name: "smeargle" }
  ] },
  { name: "KrikaDoce", shinies: [
    { name: "marill" }, { name: "dodrio" }, { name: "dodrio" }, { name: "paras" }, { name: "mudkip" }, { name: "banette" }
  ] },
  { name: "LoDarko", shinies: [
    { name: "cacnea" }, { name: "slugma" }, { name: "sneasel" }, { name: "abomasnow" }, { name: "roserade" }
  ] },
  { name: "LordGangis", shinies: [
    { name: "slugma" }, { name: "duskull" }, { name: "duosion" }, { name: "lanturn" }, { name: "torkoal" },
    { name: "bronzong" }, { name: "gurdurr" }, { name: "corphish" }, { name: "cofagrigus" }, { name: "poliwag" },
    { name: "magikarp" }, { name: "magikarp" }, { name: "magikarp" }, { name: "magikarp" }, { name: "dratini" },
    { name: "litwick" }, { name: "litwick" }, { name: "metapod" }, { name: "koffing" }, { name: "cubchoo" }
  ] },
  { name: "Loundemon", shinies: [
    { name: "linoone" }, { name: "seaking" }, { name: "chandelure" }, { name: "golem" }, { name: "dusknoir" },
    { name: "alakazam" }, { name: "rapidash" }, { name: "gyarados" }, { name: "tentacruel" }
  ] },
  { name: "lucaswatko", shinies: [
    { name: "pidgey", lost: true }, { name: "bellossom" }, { name: "crobat" }, { name: "rattata" }, { name: "snorunt" }
  ] },
  { name: "LunaLost", shinies: [
    { name: "plusle" }, { name: "kingdra" }, { name: "nidoking" }, { name: "sandslash" }, { name: "sandslash" },
    { name: "durant" }, { name: "altaria" }, { name: "lotad" }, { name: "pachirisu" }, { name: "hydreigon" },
    { name: "cacnea" }, { name: "golbat" }, { name: "solrock" }, { name: "crobat" }, { name: "sandshrew" },
    { name: "flygon" }, { name: "druddigon" }, { name: "solrock" }, { name: "nidoran-m" }, { name: "rattata" },
    { name: "magikarp" }, { name: "salamence" }, { name: "woobat" }, { name: "axew" }, { name: "magikarp" },
    { name: "dragonair" }, { name: "paras" }, { name: "amoonguss" }, { name: "floatzel" }, { name: "gabite" }
  ] },
  { name: "Macarene", shinies: [
    { name: "frillish-f" }
  ] },
  { name: "maknaez", shinies: [
    { name: "gyarados-f" }, { name: "durant", lost: true }, { name: "durant", lost: true }, { name: "hydreigon" }, { name: "meowth", lost: true },
    { name: "ferroseed", lost: true }, { name: "graveler", lost: true }, { name: "gliscor" }, { name: "amoonguss", lost: true }, { name: "amoonguss" },
    { name: "conkeldurr" }, { name: "ledian-f" }, { name: "smeargle" }, { name: "torkoal" }, { name: "bibarel-f" }, { name: "ninetales" },
    { name: "banette" }, { name: "sneasel-f" }, { name: "miltank" }, { name: "luxray-f" }, { name: "chandelure" }, { name: "fraxure" },
    { name: "weezing" }, { name: "poliwhirl" }, { name: "floatzel", lost: true }, { name: "floatzel" }, { name: "floatzel" }, { name: "floatzel" },
    { name: "gabite" }, { name: "onix" }, { name: "steelix-f" }, { name: "kingdra" }, { name: "spinda" }, { name: "haunter" }, { name: "bibarel" },
    { name: "poliwhirl" }, { name: "onix" }, { name: "magikarp" }, { name: "dragonair" }, { name: "onix" }, { name: "onix" }, { name: "rapidash" },
    { name: "solrock" }, { name: "dugtrio" }, { name: "onix" }, { name: "larvitar" }, { name: "shelgon" }
  ] },
  { name: "mbarren", shinies: [
    { name: "fearow" }, { name: "rapidash" }, { name: "rattata" }, { name: "nidorina" }, { name: "nidorina" }, { name: "ducklett" },
    { name: "sandslash" }, { name: "magikarp" }, { name: "scraggy" }, { name: "mienfoo" }, { name: "cubchoo" }, { name: "onix" },
    { name: "graveler" }, { name: "gloom" }, { name: "weepinbell" }, { name: "wurmple" }
  ] },
  { name: "MechanicalHippo", shinies: [
    { name: "magnemite" }, { name: "tentacruel" }, { name: "poliwag" }, { name: "mienfoo" }, { name: "mienfoo" },
    { name: "deino" }, { name: "heatmor" }, { name: "wurmple" }
  ] },
  { name: "MELVZZY", shinies: [
    { name: "marowak" }, { name: "golduck" }, { name: "meowth" }, { name: "geodude" }, { name: "slugma" }, { name: "gyarados" }, { name: "politoed-f" },
    { name: "venomoth" }, { name: "vanillish" }, { name: "charizard" }, { name: "reuniclus" }, { name: "smeargle" }, { name: "zigzagoon" },
    { name: "onix" }, { name: "pikachu" }, { name: "vulpix" }
  ] },
  { name: "MikeRunkZz", shinies: [
    { name: "rapidash" }, { name: "gyarados" }, { name: "litwick" }, { name: "politoed" }, { name: "golduck" }, { name: "quagsire" },
    { name: "machamp" }, { name: "walrein" }, { name: "azumarill" }, { name: "bibarel" }, { name: "altaria" }, { name: "dusclops" },
    { name: "stantler", lost: true }, { name: "ampharos" }, { name: "goldeen" }, { name: "weezing" }, { name: "dustox" }, { name: "pidgeotto" }, { name: "girafarig" }
  ] },
  { name: "Minatoway", shinies: [
    { name: "petilil" }, { name: "spearow" }, { name: "arbok" }, { name: "gyarados" }, { name: "machoke" }
  ] },
  { name: "MitchOsu", shinies: [
    { name: "litwick" }, { name: "meowth" }, { name: "rhyperior" }
  ] },
  { name: "mossballetje", shinies: [
    { name: "machoke" }, { name: "rapidash" }
  ] },
  { name: "MrChooch", shinies: [
    { name: "ditto" }, { name: "tentacool" }, { name: "smeargle" }
  ] },
  { name: "MrJawster", shinies: [
    { name: "nidoking" }, { name: "amoonguss" }
  ] },
  { name: "MrsJawster", shinies: [
    { name: "sandile" }, { name: "scolipede" }, { name: "natu" }, { name: "smeargle" }, { name: "petilil" }, { name: "amoonguss" }
  ] },
  { name: "nerfviands", shinies: [
    { name: "mantine" }
  ] },
  { name: "Nercylla", shinies: [
    { name: "silcoon" }, { name: "mareep" }, { name: "gligar" }, { name: "girafarig" }, { name: "gyarados" }, { name: "litwick" }
  ] },
  { name: "NSxPRODIGY", shinies: [
    { name: "horsea" }, { name: "lombre" }, { name: "frillish" }
  ] },
  { name: "OrllandoV", shinies: [
    { name: "donphan-f" }, { name: "seaking" }, { name: "golduck" }, { name: "poliwhirl" }, { name: "silcoon" }, { name: "zigzagoon" },
    { name: "phanpy" }, { name: "spinda" }, { name: "camerupt" }, { name: "golett" }, { name: "duskull" }, { name: "onix" },
    { name: "onix" }, { name: "paras" }, { name: "amoonguss" }, { name: "shroomish" }, { name: "axew" }, { name: "onix" },
    { name: "larvitar" }, { name: "pikachu" }, { name: "misdreavus" }
  ] },
  { name: "PaulusTFT", shinies: [
    { name: "mightyena" }, { name: "linoone" }, { name: "typhlosion" }, { name: "smeargle" }, { name: "camerupt" }, { name: "bellsprout" },
    { name: "rapidash" }, { name: "miltank" }, { name: "swablu" }, { name: "scolipede" }, { name: "drilbur" }, { name: "cubchoo" },
    { name: "cryogonal" }, { name: "metapod" }, { name: "donphan" }, { name: "slowbro" }, { name: "rattata" }, { name: "dodrio" },
    { name: "paras" }, { name: "voltorb" }, { name: "weezing" }, { name: "gligar" }, { name: "amoonguss" }, { name: "koffing" }, { name: "golurk" }, { name: "stunky" }
  ] },
  { name: "peachhteaa", shinies: [
    { name: "psyduck" }
  ] },
  { name: "pearishx", shinies: [
    { name: "drifblim" }, { name: "hypno" }, { name: "lopunny" }, { name: "carvanha" }, { name: "cubchoo" }, { name: "shedinja" }, { name: "cottonee" }, { name: "spiritomb" }
  ] },
  { name: "pitcheronly", shinies: [
    { name: "aggron" }, { name: "smeargle" }
  ] },
  { name: "PokeBodega", shinies: [
    { name: "haxorus" }, { name: "smeargle" }, { name: "mienfoo" }, { name: "jigglypuff" }, { name: "spinda" }, { name: "spinarak" }, { name: "rattata" }, { name: "koffing" }, { name: "venipede" }, { name: "meowth" }, { name: "paras" }
  ] },
  { name: "Prttyflxcko", shinies: [
    { name: "arbok" }, { name: "persian" }, { name: "treecko" }, { name: "smeargle" }
  ] },
  { name: "qtAlice", shinies: [
    { name: "abra" }, { name: "kadabra" }, { name: "alakazam" }, { name: "shuckle" }, { name: "tauros" }, { name: "meowth" }, { name: "vanillish" }, { name: "surskit" }, { name: "masquerain" }, { name: "psyduck" }, { name: "duskull" }, { name: "tentacruel" }, { name: "gloom" }, { name: "bellossom" }, { name: "dustox-f" }, { name: "poochyena" }, { name: "zigzagoon" }, { name: "linoone" }, { name: "taillow" }, { name: "swellow" }, { name: "zigzagoon" }
  ] },
  { name: "Qubuu", shinies: [
    { name: "dratini" }, { name: "ditto" }, { name: "smeargle" }, { name: "tentacruel" }, { name: "poochyena" }, { name: "cascoon" }, { name: "silcoon" }, { name: "onix" }, { name: "onix" }
  ] },
  { name: "QuinJay", shinies: [
    { name: "ursaring" }
  ] },
  { name: "realjuckpop", shinies: [
    { name: "psyduck" }, { name: "rattata" }, { name: "koffing", lost: true }
  ] },
  { name: "RicRiley", shinies: [
    { name: "poliwhirl" }
  ] },
  { name: "Rintuu", shinies: [
    { name: "pelipper" }
  ] },
  { name: "RuthlessZ", shinies: [
    { name: "caterpie" }, { name: "rapidash" }, { name: "magikarp" }, { name: "alakazam" }, { name: "magikarp" }, { name: "teddiursa" }, { name: "rapidash" }, { name: "magikarp" }, { name: "ponyta" }, { name: "beedrill" }, { name: "magikarp" }
  ] },
  { name: "SecretSlowshiny", shinies: [
    { name: "raticate" }, { name: "woobat" }, { name: "axew" }, { name: "bellsprout" }, { name: "woobat" }
  ] },
  { name: "Serako", shinies: [
    { name: "smeargle" }, { name: "tentacruel" }, { name: "fearow" }, { name: "larvitar" }, { name: "donphan" }, { name: "magikarp" }, { name: "durant" }, { name: "paras" }, { name: "growlithe" }
  ] },
  { name: "ShakeyEy", shinies: [
    { name: "gyarados" }, { name: "tentacruel" }, { name: "mareep" }, { name: "skarmory" }, { name: "koffing" }, { name: "trapinch" }, { name: "cubchoo" }, { name: "magmar" }, { name: "gastly" }, { name: "rapidash" }, { name: "bellsprout" }, { name: "woobat" }
  ] },
  { name: "ShinishilE", shinies: [
    { name: "wurmple" }
  ] },
  { name: "SilverGale", shinies: [
    { name: "meowth" }, { name: "gyarados" }, { name: "ninetales" }, { name: "nidoking" }
  ] },
  { name: "Sirbeyy", shinies: [
    { name: "growlithe", lost: true }, { name: "altaria" }, { name: "rhydon" }, { name: "houndour" }, { name: "crawdaunt" }, { name: "silcoon" }, { name: "whimsicott" }, { name: "tropius" }, { name: "heracross-f" }
  ] },
  { name: "SmiigZ", shinies: [
    { name: "tentacruel" }, { name: "golduck" }, { name: "lanturn" }, { name: "meowth" }, { name: "sandshrew" }, { name: "parasect" }, { name: "surskit" }, { name: "smeargle" }, { name: "swadloon" }, { name: "litwick" }, { name: "krokorok" }
  ] },
  { name: "SplaxxLIVE", shinies: [
    { name: "wurmple" }
  ] },
  { name: "Splinterbrained", shinies: [
    { name: "chandelure" }, { name: "pidgeot" }, { name: "altaria" }, { name: "graveler" }, { name: "ponyta" }, { name: "murkrow" }
  ] },
  { name: "srysu", shinies: [
    { name: "piloswine-f" }, { name: "clamperl" }, { name: "meowth" }, { name: "pelipper" }, { name: "sableye" }, { name: "dewgong" }, { name: "bibarel-f" }, { name: "heatmor" }, { name: "accelgor" }, { name: "octillery-f" }, { name: "hypno-f" }, { name: "scolipede" }, { name: "linoone" }, { name: "gloom-f" }, { name: "venipede" }, { name: "geodude", lost: true }, { name: "graveler", lost: true }, { name: "graveler" }, { name: "beedrill" }, { name: "rapidash" }, { name: "rapidash" }, { name: "cubchoo" }, { name: "cubchoo" }, { name: "roselia-f" }, { name: "purugly" }, { name: "roselia-f" }, { name: "pachirisu-f" }, { name: "lopunny" }, { name: "paras" }, { name: "donphan" }, { name: "vulpix" }, { name: "graveler" }, { name: "poliwrath" }
  ] },
  { name: "SubSpacePet", shinies: [
    { name: "tentacruel" }, { name: "bidoof" }, { name: "feebas" }, { name: "milotic-f" }
  ] },
  { name: "SushiWhopperK", shinies: [
    { name: "smeargle" }, { name: "conkeldurr" }, { name: "heatmor" }, { name: "pidgeotto" }, { name: "swoobat" }, { name: "fearow" }
  ] },
  { name: "tardigreat", shinies: [
    { name: "lotad" }, { name: "seedot" }
  ] },
  { name: "TerminusDT", shinies: [
    { name: "mankey" }, { name: "jigglypuff" }, { name: "rattata" }, { name: "mareep" }, { name: "pikachu" }, { name: "slugma" }, { name: "mareep" }
  ] },
  { name: "TheJuanNonly", shinies: [
    { name: "beldum" }, { name: "tentacool" }, { name: "deino" }, { name: "nidoran-f" }, { name: "woobat" }, { name: "growlithe" }, { name: "vulpix" }, { name: "axew" }, { name: "duskull" }, { name: "sneasel" }, { name: "misdreavus" }
  ] },
  { name: "TheStahlBayBay", shinies: [
    { name: "psyduck" }, { name: "sealeo" }
  ] },
  { name: "TorontoKid", shinies: [
    { name: "poliwag" }, { name: "golduck" }, { name: "lanturn" }, { name: "magikarp" }, { name: "slowbro" }, { name: "smeargle" }, { name: "litwick" }, { name: "rapidash" }, { name: "spinda" }, { name: "koffing" }, { name: "slugma" }, { name: "vanillite" }, { name: "minccino" }, { name: "raticate" }, { name: "parasect" }, { name: "cubchoo" }, { name: "duskull" }, { name: "camerupt" }, { name: "banette" }, { name: "swablu" }, { name: "trapinch" }, { name: "sealeo" }
  ] },
  { name: "Tortuponchy", shinies: [
    { name: "beedrill" }, { name: "amoonguss" }, { name: "donphan", lost: true }, { name: "pelipper" }
  ] },
  { name: "TTVxSenseiNESS", shinies: [
    { name: "basculin-red-striped", lost: true }, { name: "donphan-f" }, { name: "haxorus" }, { name: "mienshao" }, { name: "chandelure" }, { name: "smeargle" },
    { name: "primeape" }, { name: "noctowl" }, { name: "jellicent" }, { name: "weezing" }, { name: "whimsicott" }, { name: "scolipede" },
    { name: "whirlipede" }, { name: "gastrodon-east" }, { name: "lilligant" }, { name: "venipede" }, { name: "golem" }, { name: "ninetales" },
    { name: "spinda" }, { name: "floatzel", lost: true }, { name: "woobat", lost: true }, { name: "tentacruel", lost: true }
  ] },
  { name: "tulicreme", shinies: [
    { name: "onix" }, { name: "onix" }, { name: "tangela" }, { name: "tentacool" }, { name: "carvanha" }
  ] },
  { name: "TzKalZuk", shinies: [
    { name: "fearow" }, { name: "tentacruel" }, { name: "geodude", lost: true }
  ] },
  { name: "UltraKingRom", shinies: [
    { name: "floatzel", lost: true }, { name: "woobat", lost: true }, { name: "tentacruel", lost: true }, { name: "magikarp" }
  ] },
  { name: "Unesha", shinies: [
    { name: "marill" }
  ] },
  { name: "WhosWill", shinies: [
    { name: "golduck" }, { name: "tentacruel" }, { name: "magikarp" }, { name: "vulpix" }, { name: "litwick" }, { name: "krokorok" }
  ] },
  { name: "WillyPS", shinies: [
    { name: "muk" }, { name: "ditto", lost: true }, { name: "ditto" }, { name: "poliwag" }, { name: "nidorino" }, { name: "magikarp" }, { name: "pikachu-f" }, { name: "wooper-f" },
    { name: "butterfree" }, { name: "hoppip", lost: true }, { name: "ponyta" }, { name: "vulpix" }, { name: "sealeo" }, { name: "lombre" }, { name: "swablu" }, { name: "lairon" },
    { name: "psyduck" }, { name: "snorunt" }, { name: "mareep" }, { name: "ekans" }, { name: "tentacool" }, { name: "growlithe" }, { name: "charmander" }, { name: "raticate" },
    { name: "raticate" }, { name: "psyduck" }, { name: "squirtle" }, { name: "phanpy" }, { name: "bulbasaur" }, { name: "eevee" }, { name: "eevee" }, { name: "golbat" },
    { name: "tangela" }, { name: "krabby" }, { name: "shroomish" }, { name: "paras" }, { name: "vulpix" }, { name: "aipom" }
  ] },
  { name: "WinterIvy", shinies: [
    { name: "poochyena" }
  ] },
  { name: "Wisqi", shinies: [
    { name: "baltoy" }, { name: "stunfisk" }, { name: "muk" }, { name: "rapidash" }, { name: "tentacruel" }, { name: "beheeyem" }, { name: "golduck" }, { name: "machoke" }, { name: "piloswine" }, { name: "camerupt" }
  ] },
  { name: "xMileage", shinies: [
    { name: "absol" }, { name: "poliwhirl" }
  ] },
  { name: "xRaiketsu", shinies: [
    { name: "nidorino" }, { name: "pidgey" }, { name: "woobat" }, { name: "magikarp" }, { name: "machoke" }
  ] },
  { name: "XxEmperiorxX", shinies: [
    { name: "rapidash" }, { name: "zubat" }, { name: "haxorus" }, { name: "torkoal" }, { name: "raticate" }, { name: "eelektross" }, { name: "nidoqueen" }, { name: "persian" }, { name: "magmar" }, { name: "geodude" }, { name: "golurk" }, { name: "pidgey" }, { name: "kingdra" }, { name: "dodrio" }, { name: "aggron" }, { name: "gigalith" }, { name: "steelix" }, { name: "sandslash" }, { name: "carvanha" }, { name: "bibarel" }, { name: "lilligant" }, { name: "donphan" }, { name: "tentacruel" }, { name: "dodrio" }, { name: "dewgong" }, { name: "gyarados" }, { name: "magikarp", lost: true }, { name: "bibarel", lost: true }, { name: "fearow" }
  ] },
  { name: "Yoyoyoshie", shinies: [
    { name: "shuppet" }, { name: "krokorok" }, { name: "diglett" }
  ] },
  { name: "ZiaStitch", shinies: [
    { name: "gyarados" }, { name: "swablu" }, { name: "rapidash" }, { name: "rhydon" }, { name: "politoed" }, { name: "accelgor" }, { name: "graveler" }, { name: "zigzagoon" }
  ] }
];
// Make globally available for browser scripts
window.teamShowcase = teamShowcase;
