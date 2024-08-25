export type Dice = number | number[] | string[]

export function rollDice<T extends Dice>(faces: Dice = 6, dieCount: number = 1): T | T[] {
  if (dieCount < 1) {
    throw new Error('Invalid die count')
  }

  const dieFaces = getFaces(faces)

  if (dieCount === 1) {
    return rollDie(dieFaces) as T
  }

  const results: T[] = new Array<T>(dieCount)

  for (let i = 0; i < dieCount; i++) {
    results[i] = rollDie(dieFaces) as T
  }

  return results
}

function getFaces<T extends Dice>(faces: Dice): T[] {
  if (isNumberDie(faces)) {
    const dieFaces: number[] = new Array<number>(faces)
    for (let i = 0; i < faces; i++) {
      dieFaces[i] = i + 1
    }
    return dieFaces as T[]
  }
  return faces as T[]
}

function isNumberDie(faces: Dice): faces is number {
  return typeof faces === 'number'
}

function rollDie<T>(faces: T[]): T {
  const faceIndex = Math.floor(Math.random() * faces.length)
  return faces[faceIndex]
}
