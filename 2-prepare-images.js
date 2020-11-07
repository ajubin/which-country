#!/usr/local/bin/node
const util = require('util');
const glob = util.promisify(require('glob'));
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const writeFile = util.promisify(require('fs').writeFile);
const crypto = require('crypto');

// Note: this is also specified in makefile, it could be passed as param to the script
const OUT_DIR = './output-images';
const SRC_FOLDER = './source-images';
const ANSWER_FILE = 'answers.json';

/**
Format of the image: width x height
–––––––––––––––––––––––––––––
|country      |             |
|             |             |
|    men      |    women    |
|             |             |
–––––––––––––––––––––––––––––

First crop : width/2 x height + O (vertical offset) + height*10% (horizontal offset)
Second crop: width/2 x height + width/2 (vertical offset) + 0 (horizontal offset)
 */

async function prepareImages() {
  const files = await getFilesToProcess();
  const idGenerator = new UniqueIdGenerator();
  const associations = {};

  const allCountries = files.map((file) => path.parse(file).name);

  for (const file of files) {
    const { name, ext, base, dir } = path.parse(file);
    console.log('Processing: ', file);
    const { width, height } = await extractImageDimensions(file);

    const id = idGenerator.getNew();
    associations[id] = name;

    /**
     * C'était pas une bonne idée de couper en 2, ca sert à rien.
     * On veut maintenant:
     * - couper le titre (à 10%) ✅
     * - ajouter une zone au dessus de la photo pour écrire les réponses possibles ✅
     * - prendre 3 réponses aléatoires + la bonne réponse ✅
     * - les mélanger ✅
     * - les afficher les uns à la suite des autres ✅
     * - noter la bonne réponse ✅
     * - pour lire plus facilemnt les bonnes répoonses, les ordonner dans l'ordre alphabétique
     */
    const newFileName = path.join(OUT_DIR, base);
    await executeCmd(`convert -crop ${width}x${height}+0+${height * 0.1} ${file} ${newFileName}`);

    const LEFT_OFFSET = 20;
    const POINT_SIZE = 20;
    const HORIZONTAL_MARGIN = 40;
    const BORDER_HEIGHT = 4 * POINT_SIZE + HORIZONTAL_MARGIN;
    await executeCmd(`convert -background white -splice 0x${BORDER_HEIGHT} ${newFileName} ${newFileName}`);

    const randomAnswers = shuffle(allCountries.filter((country) => country != name)).slice(0, 3);
    const answers = shuffle([name, ...randomAnswers]);

    for (let index = 0; index < answers.length; index++) {
      const answer = answers[index];
      await executeCmd(
        `convert -pointsize ${POINT_SIZE} -fill black -draw 'text ${LEFT_OFFSET}, ${
          (index + 1) * POINT_SIZE
        } "${index} - ${answer}"' -background white ${newFileName} ${newFileName}`,
      );
    }

    // rename image and keep answer
    const obfuscatedFileName = path.join(OUT_DIR, `${id}${ext}`);
    await executeCmd(`mv ${newFileName} ${obfuscatedFileName}`);
  }

  const ordered = {};
  Object.keys(associations)
    .sort()
    .forEach(function (key) {
      ordered[key] = associations[key];
    });

  await writeFile(path.join(OUT_DIR, ANSWER_FILE), JSON.stringify(ordered, null, 2));
}
prepareImages();

class UniqueIdGenerator {
  constructor() {
    this.alreadyGenerated = new Set();
    this.length = 3;
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static getUniqueId(length) {
    return Array.from({ length })
      .map(() => UniqueIdGenerator.randomInt('a'.charCodeAt(0), 'z'.charCodeAt(0)))
      .map((charCode) => String.fromCharCode(charCode))
      .join('');
  }

  getNew() {
    let id = UniqueIdGenerator.getUniqueId(this.length);
    while (this.alreadyGenerated.has(id)) {
      id = UniqueIdGenerator.getUniqueId(this.length);
    }
    this.alreadyGenerated.add(id);
    return id;
  }
}

async function getFilesToProcess() {
  const EXTENSIONS = ['jpeg', 'jpg'];
  const GlobPatterns = EXTENSIONS.map((ext) => path.join(SRC_FOLDER, `*.${ext}`));
  const files = await Promise.all(GlobPatterns.map((search) => glob(search)));
  return files.flat();
}

async function getOneFile() {
  return ['./image-de-base.jpg'];
}

/**
 * Return stdout as an array without last line
 * @param {string} cmd the command line to execute
 */
async function executeCmd(cmd) {
  const { stdout, stderr } = await exec(cmd);

  if (stderr) {
    throw new Error(`error while executing ${cmd}: ${stderr}`);
  }
  const lines = stdout.split('\n');
  lines.pop();
  return lines;
}
async function extractImageDimensions(file) {
  const lines = await executeCmd(`magick identify ${file}`);

  const [_filename, _ext, dimensions, _rest] = lines[0].split(' ');
  const [width, height] = dimensions.split('x').map((val) => parseInt(val, 10));
  return { width, height };
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
