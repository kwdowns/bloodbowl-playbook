enum BlockResult {
  Pow = 'Pow',
  Stumble = 'Stumble',
  Push = 'Push',
  BothDown = 'BothDown',
  Skull = 'Skull'
}

type DiceSides<T extends readonly (number | (number | string)[])> = T

function isNumberDie(dice: DiceSides): dice is number {
  return typeof dice === 'number'
}

function isCustomDie(dice: DiceSides): dice is (number | string)[] {
  return Array.isArray(dice)
}

function rollDice<T extends DiceSides = DiceSides<6>>(
  dieCount?: number = 1
): DiceSides | DiceSides[] {}

function rollNumberDie()
