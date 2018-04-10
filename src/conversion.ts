import { BigNumber } from "bignumber.js";
import { errorValue, numericValue, NumericValue, Value } from "./evaluate";

export type UnitName = string;

type BigNumberable = BigNumber | string | number;

export interface Unit {
  base: UnitName;
  name: UnitName;
  multiplier: BigNumber;
}

const unitTable: { [key: string]: Unit } = {
  unitless: { base: "unitless", name: "unitless", multiplier: new BigNumber(0) },
};

function toBigNumber(value: BigNumberable) {
  if (typeof value === "string") {
    return new BigNumber(value);
  }
  if (typeof value === "number") {
    return new BigNumber(value);
  }
  return value;
}

export function addUnit(base: UnitName, multiplier: BigNumberable, ...names: UnitName[]) {
  for (const name of names) {
    unitTable[name] = { base, name, multiplier: toBigNumber(multiplier) };
  }
}

export function convert(value: NumericValue, to: Unit): NumericValue | null {
  if (value.unit === unitless) {
    return numericValue(value.value, to);
  }
  if (value.unit.base !== to.base) {
    return null;
  }
  return numericValue(value.value.times(value.unit.multiplier.dividedBy(to.multiplier)), to);
}

addUnit("mm", "1", "mm");
addUnit("mm", "10", "cm");
addUnit("mm", "100", "dm");
addUnit("mm", "1000", "m");
addUnit("mm", "1000000", "km");
addUnit("mm", "304.8", "ft", "foot", "feet");
addUnit("mm", "25.4", "in", "inch");
addUnit("%", "1", "%");
addUnit("€", "1", "€");
addUnit("g", "1", "g", "gram", "grams");
addUnit("g", "10", "dkg");
addUnit("g", "1000", "kg");
addUnit("g", "28.3495", "oz");

export const unitless = unitTable.unitless;

export function getUnit(name: string): Unit | undefined {
  return unitTable[name];
}

export function unitNames(): string[] {
  const names = [];
  for (const name in unitTable) {
    if (unitTable.hasOwnProperty(name)) {
      names.push(name);
    }
  }
  return names;
}
