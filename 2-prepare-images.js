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

  for (const file of files) {
    const { name, ext } = path.parse(file);
    console.log('Processing: ', file);
    const { width, height } = await extractImageDimensions(file);

    const id = idGenerator.getNew();
    associations[id] = name;

    await executeCmd(
      `convert -crop ${width / 2}x${height}+0+${height * 0.1} ${file} ${path.join(OUT_DIR, `men.${id}${ext}`)}`,
    );
    await executeCmd(
      `convert -crop ${width / 2}x${height}+${width / 2}+0 ${file} ${path.join(OUT_DIR, `women.${id}${ext}`)}`,
    );
  }
  await writeFile(path.join(OUT_DIR, ANSWER_FILE), JSON.stringify(associations, null, 2));
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
