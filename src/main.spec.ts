import { readFile, getStartInfo } from './main';

const exampleA = {
  nbBooks: 6,
  nbLibraries: 2,
  nbDays: 7,
  bookScores: [1, 2, 3, 6, 5, 4],
  libraries: [
    {
      nbBooks: 5,
      signUp: 2,
      scanPerDay: 2,
      bookIds: ['0', '1', '2', '3', '4'],
    },
    {
      nbBooks: 4,
      signUp: 3,
      scanPerDay: 1,
      bookIds: ['0', '2', '3', '5'],
    },
  ],
};

describe('getStartInfo', () => {
  test('A', async () => {
    const fileData = await readFile('a_example.txt');
    expect(getStartInfo(fileData)).toEqual(exampleA);
  });
});
