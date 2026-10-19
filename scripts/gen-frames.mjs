// Generates photobooth strip-theme art with Gemini: one seamless pattern tile
// plus two die-cut stickers (on chroma green, keyed out by gen-frames-post.py)
// per theme, into scripts/.frames-raw/. Skips files that already exist.
// usage: node --env-file=<.env with GEMINI_API_KEY> scripts/gen-frames.mjs
//    or: node scripts/gen-frames.mjs --md <file>  (writes the prompts as an
//        image-prompts.md section "Photobooth frames" for salesdesk's gemini-web.mjs)
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const THEMES = {
  sakura: ["soft pink cherry blossoms, falling petals and tiny branches", "warm cream", ["a blooming cherry blossom branch", "a pink satin ribbon bow"]],
  strawberry: ["cute glossy strawberries and tiny white daisies", "pastel red and white gingham", ["a cute smiling strawberry", "a strawberry milk carton"]],
  starry: ["tiny gold stars, sparkles and crescent moons", "deep midnight navy", ["a golden crescent moon with a star", "a shooting star with sparkles"]],
  ocean: ["seashells, starfish, little waves and bubbles", "light aqua", ["a pink scallop seashell", "a cute orange starfish"]],
  christmas: ["holly leaves, candy canes, snowflakes and tiny gifts", "deep pine green", ["a candy cane tied with a red bow", "a decorated gingerbread man cookie"]],
  y2k: ["chrome hearts, sparkles, butterflies and stars", "pastel lilac", ["a shiny chrome heart", "a holographic butterfly"]],
  cafe: ["coffee cups, croissants, macarons and little hearts", "warm latte beige", ["a latte cup with heart latte art", "a golden croissant"]],
  daisy: ["white daisies with yellow centers", "butter yellow", ["a big white daisy flower", "a little bouquet of daisies tied with ribbon"]],
  halloween: ["cute smiling pumpkins, friendly ghosts, bats and candy", "dusty orange", ["a cute smiling jack-o-lantern pumpkin", "a cute friendly ghost"]],
  tropical: ["monstera leaves, hibiscus flowers and palm leaves", "deep teal", ["a red hibiscus flower", "a pineapple wearing sunglasses"]],
  love: ["red hearts, love letters and tiny roses", "blush pink", ["a red love letter envelope with a heart seal", "a cute red heart with sparkles"]],
  groovy: ["70s groovy wavy flowers and smiley faces in orange, mustard and brown", "cream", ["a retro 70s groovy daisy flower", "a retro yellow smiley face"]],
  ramadan: ["golden crescent moons, hanging Ramadan lanterns (fanous) and little stars", "deep emerald green", ["a glowing golden Ramadan lantern", "a golden crescent moon with a small hanging star"]],
  lebaran: ["ketupat woven rice cakes, mosque domes and green-gold Islamic geometric ornaments", "soft cream", ["a green ketupat woven palm-leaf rice cake", "a mosque with a golden dome"]],
  imlek: ["red paper lanterns, gold coins, plum blossoms and gold clouds", "Chinese lucky red", ["a red Chinese lantern with a gold tassel", "a red angpao envelope with gold ornaments"]],
  merdeka: ["red and white Indonesian flags, bunting and fireworks", "white", ["a red and white festive bunting garland", "a cute bowl of krupuk crackers"]],
  batik: ["traditional Indonesian batik kawung and parang motifs", "sogan brown and indigo", ["a wayang kulit gunungan", "a white jasmine flower"]],
  birthday: ["balloons, confetti, party hats and slices of cake", "pastel mint", ["a birthday cake with lit candles", "a bunch of colorful balloons"]],
  newyear: ["fireworks, gold confetti, champagne glasses and clocks", "midnight navy", ["a colorful fireworks burst", "two clinking champagne glasses"]],
  graduation: ["graduation caps, diplomas and gold stars", "navy blue", ["a black graduation cap with gold tassel", "a rolled diploma tied with a red ribbon"]],
  wedding: ["white roses, eucalyptus leaves and tiny gold rings", "blush pink", ["two gold wedding rings", "a white rose bouquet with ribbon"]],
  rose: ["deep red roses and petals", "black velvet", ["a single red rose", "a gold heart padlock love lock"]],
  cyber: ["neon pink and cyan lightning bolts, glitch shapes and grid lines", "pure black", ["a neon pink lightning bolt", "a cool smiley face wearing futuristic visor sunglasses"]],
  street: ["graffiti tags, spray cans, crowns and sneakers", "concrete grey", ["a graffiti spray paint can", "a cool high-top sneaker"]],
  pixel: ["retro 8-bit pixel art hearts, coins, stars and game controllers", "purple", ["a pixel art retro game controller", "a pixel art red heart"]],
  galaxy: ["planets, nebulae, tiny astronauts and rockets", "deep cosmic purple", ["a cute astronaut floating", "a ringed planet like Saturn"]],
  racing: ["black and white checkered flags and orange flames", "charcoal black", ["a crossed pair of checkered racing flags", "a racing helmet with flames"]],
  kpop: ["light sticks, finger hearts, sparkles and stars", "pastel pink and lavender", ["a glowing K-pop light stick", "a hand making a finger heart"]],
  kitty: ["cute cat faces, paw prints and little fish", "pastel peach", ["a cute chubby cat face", "a pink paw print"]],
  dino: ["cute friendly dinosaurs, leaves and footprints", "soft sage green", ["a cute baby T-rex dinosaur", "a cracked dinosaur egg"]],
  football: ["soccer balls, goal nets, boots and trophies in bold flat style", "pitch green with faint white field lines", ["a classic black and white soccer ball", "a golden trophy cup"]],
  basketball: ["basketballs, hoops, sneakers and court lines in bold flat style", "burnt orange", ["a basketball swishing through a hoop", "a pair of high-top basketball sneakers"]],
  skate: ["skateboards, wheels, flames and stars, bold skate-graphic style", "off-white", ["a skateboard with a flame graphic", "a cool skull wearing a backwards cap, friendly cartoon style"]],
  esports: ["gaming headsets, mechanical keyboards, controllers and RGB lightning", "dark graphite", ["a gaming headset with RGB glow", "a glowing gaming mouse"]],
  comic: ["pop-art comic speech bubbles saying POW, BAM, BOOM with halftone dots", "bright yellow", ["a comic POW explosion speech bubble", "a comic BOOM burst bubble"]],
  rock: ["electric guitars, lightning bolts, amps and stars, bold tattoo flash style", "black", ["an electric guitar with lightning bolt", "a rock and roll hand sign with a star"]],
  hiphop: ["boomboxes, cassette tapes, microphones, gold chains and crowns", "dark denim blue", ["a retro boombox", "a gold microphone"]],
  adventure: ["mountains, pine trees, compasses, tents and campfires, vintage badge style", "forest green", ["a vintage compass", "a mountain adventure badge with pine trees"]],
  garage: ["vintage motorcycles, wrenches, spark plugs and pistons, retro garage style", "oil-stained khaki", ["a vintage cafe racer motorcycle", "a crossed wrench and spanner badge"]],
  japan: ["ukiyo-e great waves, koi fish and clouds in traditional Japanese style", "navy indigo", ["a red and white koi fish", "a traditional Japanese great wave"]],
  circuit: ["glowing circuit board traces, chips and blueprint grid lines", "deep blueprint blue", ["a glowing microchip", "a robot head, friendly retro style"]],
  mono: ["minimal black and white geometric shapes, lines and dots, Bauhaus style", "white", ["a bold black and white Bauhaus geometric badge", "a black lightning bolt with a white outline"]],
  // Hero/anime-inspired moods only: generic motifs, no existing characters, logos or names.
  webcity: ["spider webs, city skyscraper silhouettes and comic action lines in red and blue", "comic red", ["a stylized spider web in a comic burst", "a city skyline at night with a full moon"]],
  nightcity: ["dark gothic city rooftops, full moons, rain and searchlight beams", "near-black charcoal", ["a full moon behind gothic rooftops", "a glowing searchlight beam in the night sky"]],
  ninja: ["shuriken, kunai, swirling leaves, scrolls and ramen bowls in anime style", "warm orange", ["a steel ninja shuriken throwing star", "a steaming bowl of ramen with naruto fish cake"]],
  pirate: ["pirate ships, treasure maps, compasses, straw hats and ocean waves in anime adventure style", "sea blue", ["a treasure chest overflowing with gold", "a pirate ship with full sails"]],
  slayer: ["katanas, wisteria flowers, swirling water waves and flame swirls in Taisho-era Japanese anime style", "dark green and black checkered", ["a katana with an ornate guard", "a cluster of purple wisteria flowers"]],
  cursed: ["purple and blue energy swirls, paper talisman seals and cracked glowing runes in dark anime style", "deep violet black", ["a paper talisman seal with glowing runes", "a swirling purple energy orb"]],
  bengkel: ["wrenches, screwdrivers, motorbike tires, oil cans, gears and spark plugs, workshop style", "workshop yellow", ["a motorbike tire with a wrench", "a red oil can"]],
  it: ["servers, cloud icons, wifi signals, laptops, routers and network cables", "light tech blue", ["a cute server rack with blinking lights", "a cloud with a wifi signal"]],
  coding: ["code brackets, terminal windows, curly braces, little bugs, git branches and coffee mugs", "dark editor navy", ["a laptop showing colorful code", "a coffee mug with code brackets on it"]],
  k3: ["yellow safety helmets, orange safety vests, traffic cones, safety boots and hazard stripes", "safety green", ["a yellow construction safety helmet", "an orange traffic cone"]],
  bucin: ["pink hearts, chat bubbles with hearts, teddy bears holding hearts and love-struck smileys", "soft pink", ["a teddy bear hugging a big red heart", "a chat bubble with a heart inside"]],
  nature: ["mountains, pine forests, rivers, ferns and wildflowers in soft botanical illustration", "sage green", ["a mountain landscape badge with a river", "a fern and wildflower bouquet"]],
  fruits: ["tropical fruits: mangoes, watermelon slices, rambutans, mangosteens, pineapples and durians", "fresh lime green", ["a juicy watermelon slice", "a cute ripe mango"]],
  animals: ["cute animals: cats, puppies, bunnies, pandas, bears and little birds", "light sky blue", ["a cute panda hugging bamboo", "a happy puppy with floppy ears"]],
  koran: ["vintage newspaper collage: torn newsprint columns, headline blocks, halftone photos and stamps, black ink on aged paper", "aged newsprint beige", ["a folded vintage newspaper", "a red EXTRA rubber stamp"]],
  nihongo: ["Japanese hiragana, katakana and kanji characters in brush calligraphy and bold type, with small red hanko seals", "washi paper cream", ["a red Japanese hanko seal stamp", "a Japanese calligraphy brush with an ink stroke"]],
  alphabet: ["colorful playful alphabet letters A to Z in chunky rounded type", "white", ["colorful wooden ABC alphabet blocks", "a big rainbow letter A"]],
  // Generic social-media look only: no real app logos or brand marks.
  sosmed: ["generic social media icons: like hearts, notification badges, chat bubbles, play buttons, camera icons, hashtags, @ symbols, share arrows and thumbs up, flat app-icon style, no brand logos", "gradient-free soft white", ["a red notification badge heart with a number 99+", "a chat bubble with three typing dots"]],
  creator: ["content creator gear: ring lights, phones on tripods, microphones, LIVE badges, play buttons and sparkles, no brand logos", "hot pink", ["a red LIVE broadcast badge", "a ring light with a smartphone on a tripod"]],
  math: ["chalk-style math: equations, pi symbols, geometry shapes, graphs, protractors and rulers", "chalkboard green", ["a pi symbol made of chalk", "a geometry set with protractor, ruler and compass"]],
  physics: ["physics doodles: atoms, E=mc² formulas, magnets, light prisms, planets orbits, pendulums and lightning", "blueprint navy", ["a glowing atom model", "a glass prism splitting light into a rainbow"]],
  kekinian: ["trendy Indonesian food mix: dim sum in bamboo steamers, spicy seblak bowls, mie ayam noodles, pizza slices, hot dogs, Dubai chocolate bars with green pistachio filling, boba milk tea, martabak manis and Korean corn dogs", "warm butter yellow", ["a Dubai chocolate bar broken in half with green pistachio filling", "a bamboo steamer with dim sum dumplings"]],
  gunung: ["mountain hiking life: volcano summits above a sea of clouds at sunrise, big hiking backpacks, dome tents, trekking poles, camping stoves with coffee, hammocks and edelweiss flowers", "misty sky blue", ["a big hiking backpack with trekking poles and a rolled sleeping mat", "a white edelweiss flower"]],
  kopi: ["specialty coffee shop: espresso machines, V60 pour-over drippers, coffee beans, latte art cups, iced kopi susu gula aren in plastic cups and moka pots", "roasted coffee brown", ["an iced palm sugar coffee with milk in a takeaway cup", "a V60 pour-over coffee dripper with a gooseneck kettle"]],
  graffiti: ["vibrant wildstyle graffiti throw-ups, abstract bubble-letter shapes (no readable words), paint drips, arrows and spray splatters", "red brick wall", ["a graffiti crown with paint drips", "a colorful spray paint splash with drips"]],
};

const prompts = Object.entries(THEMES).flatMap(([id, [motifs, bg, stickers]]) => [
  {
    file: `${id}-tile.png`,
    text: `Seamless repeating surface pattern tile, flat cute vector illustration, ${motifs}, scattered evenly with small-to-medium motifs on a solid ${bg} background. Edge to edge, no border, no frame, no text, no watermark. Cute stationery / scrapbook aesthetic, soft harmonious colors.`,
  },
  ...stickers.map((s, i) => ({
    file: `${id}-sticker${i + 1}.png`,
    text: `A single cute die-cut sticker of ${s}, flat vector illustration with a thick clean white outline border around the whole shape. Centered, filling most of the frame, isolated on a solid flat pure chroma green (#00FF00) background. No shadow, no text, no other objects.`,
  })),
]);

const mdAt = process.argv.indexOf("--md");
if (mdAt > 0) {
  writeFileSync(process.argv[mdAt + 1], `## Photobooth frames\n\n${prompts.map((p, i) => `${i + 1}. \`${p.file}\` (1:1)\n${p.text}`).join("\n\n")}\n`);
  process.exit(0);
}

const outDir = "scripts/.frames-raw";
const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-image";
if (!keys.length) {
  console.error("GEMINI_API_KEY missing (pass --env-file)");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const todo = prompts.filter((p) => !existsSync(join(outDir, p.file)));
console.log(`${todo.length} to generate with ${model}`);

let k = 0;
async function generate(p) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": keys[k % keys.length], "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: p.text }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
      }),
    });
    if (res.status === 429 || res.status === 403 || res.status >= 500) {
      k++;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`${p.file}: ${res.status} ${await res.text()}`);
    const img = (await res.json()).candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
    if (!img) throw new Error(`${p.file}: no image in response`);
    writeFileSync(join(outDir, p.file), Buffer.from(img.inlineData.data, "base64"));
    console.log("saved", p.file);
    return;
  }
  throw new Error(`${p.file}: gave up after retries`);
}

const queue = [...todo];
let failed = 0;
await Promise.all(
  Array.from({ length: 3 }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) await generate(p).catch((e) => (failed++, console.error(String(e).slice(0, 300))));
  }),
);
if (failed) process.exitCode = 1;
