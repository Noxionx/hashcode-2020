import 'dotenv/config';
import fs from 'fs';
import { uniq } from 'lodash';

interface StartInfo {
  nbBooks: number;
  nbLibraries: number;
  nbDays: number;
  bookScores: number[];
  libraries: Library[];
}

interface Output {
  nbLibraries: number;
  libraries: Library[];
}

interface Library {
  id: number;
  nbBooks: number;
  signUp: number;
  scanPerDay: number;
  bookIds: string[];
  score?: number;
}

export function getStartInfo(data: string): StartInfo {
  console.time('getStartInfo');
  // read file
  const lines = data.split('\n');
  lines.splice(-1, 1);
  const [nbBooks, nbLibraries, nbDays] = lines[0]
    .split(' ')
    .map(n => parseInt(n, 10));
  const bookScores = lines[1].split(' ').map(n => parseInt(n, 10));
  const [, , ...librariesLines] = lines;
  const libraries: Library[] = [];
  librariesLines.forEach((line, index) => {
    const libId = Math.floor(index / 2);
    if (index % 2 === 0) {
      const [nbBooks, signUp, scanPerDay] = line
        .split(' ')
        .map(n => parseInt(n, 10));
      if (nbBooks && signUp && scanPerDay) {
        libraries.push({ nbBooks, signUp, scanPerDay, id: libId, bookIds: [] });
      }
    } else {
      libraries[libId].bookIds = line.split(' ');
    }
  });
  console.timeEnd('getStartInfo');
  return {
    nbBooks,
    nbLibraries,
    nbDays,
    bookScores,
    libraries,
  };
}

function getLibraryScore({
  library,
  bookScores,
  nbDays,
}: {
  library: Library;
  bookScores: number[];
  nbDays: number;
}): number {
  //console.time('getLibraryScore');

  let score;
  if (library.signUp >= nbDays) {
    score = -Infinity;
  } else {
    let libraryBookScore = 0;
    library.bookIds.forEach(id => {
      libraryBookScore += bookScores[id];
    });
    score = libraryBookScore;
  }

  //console.timeEnd('getLibraryScore');
  return score;
}

export async function readFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(
      `/mnt/d/TAF/HASHCODE/hashcode-2020/src/datasets/${filename}`,
      'utf8',
      (err, data) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(data);
        }
      },
    );
  });
}

export async function writeFile(
  filename: string,
  output: Output,
): Promise<void> {
  const fullFilename = `/mnt/d/TAF/HASHCODE/hashcode-2020/out/${filename}`;
  return new Promise((resolve, reject) => {
    let str: string = `${output.nbLibraries}\n`;
    output.libraries.forEach(l => {
      str += `${l.id} ${l.nbBooks}\n`;
      str += `${l.bookIds.join(' ')}\n`;
    });
    fs.writeFile(fullFilename, str, 'utf8', err => {
      if (err) {
        reject(err.message);
      } else {
        resolve();
      }
    });
  });
}

function filterLibrariesBooks(libraries: Library[]): Library[] {
  const existingBooks: Set<string> = new Set();
  const librariesOut: Library[] = [];
  libraries.forEach(library => {
    const filteredBooks: string[] = [];
    library.bookIds.forEach(book => {
      if (!existingBooks.has(book)) {
        existingBooks.add(book);
        filteredBooks.push(book);
      }
    });
    library.bookIds = filteredBooks;
    library.nbBooks = filteredBooks.length;
    if (library.nbBooks > 0) {
      librariesOut.push(library);
    }
  });
  return librariesOut;
}

async function exec(filename: string) {
  console.time('exec');
  const fileData = await readFile(filename);
  const startInfo: StartInfo = getStartInfo(fileData);
  const { bookScores, nbDays } = startInfo;
  startInfo.libraries.forEach(library => {
    library.score = getLibraryScore({
      library,
      bookScores,
      nbDays,
    });
    library.bookIds = library.bookIds.sort(
      (b1, b2) => bookScores[b1] - bookScores[b2],
    );
  });
  startInfo.libraries = startInfo.libraries.sort(
    (l1, l2) => l1.score - l2.score,
  );

  startInfo.libraries = filterLibrariesBooks(startInfo.libraries);
  const output: Output = {
    nbLibraries: startInfo.libraries.length,
    libraries: startInfo.libraries,
  };

  await writeFile(filename, output);

  console.timeEnd('exec');
  //
}

const datasetsNames = [
  'a_example.txt',
  'b_read_on.txt',
  'c_incunabula.txt',
  'd_tough_choices.txt',
  'e_so_many_books.txt',
  'f_libraries_of_the_world.txt',
];

datasetsNames.forEach(async name => await exec(name));
