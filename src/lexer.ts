import { List } from "./list";
import { NumberFormat } from "./numberFormat";

type TokenType =
  | "identifier"
  | "number"
  | "operator"
  | "unit"
  | "("
  | ")"
  | "assignment"
  | "comment"
  | "aggregator";

export interface Token {
  type: TokenType;
  value: string;
}

export type Tokens = List<Token>;

export type LexerResult =
  | { type: "success"; tokens: Tokens }
  | { type: "error"; description: string; tokens: Tokens };

type Scanner = (input: string) => [Token, string] | null;

export class Lexer {
  /**
   *
   * Some regex scanners could also be converted to nameScanners:
   *
   * scanners = [
   *   regexScanner(/^(#.*)(.*)$/, "comment"),
   *   nameScanner([":", "="], "assignment", startsWith),
   *   nameScanner(["("], "(", startsWith),
   *   nameScanner([")"], ")", startsWith),
   *   regexScanner(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/, "number"),
   *   nameScanner(operatorNames(), "operator", startsWith),
   *   nameScanner(aggregatorNames(), "aggregator", startsWithFollowedBySeparator),
   *   nameScanner(unitNames(), "unit", startsWithFollowedBySeparator),
   *   nameScanner(["to", "as"], "conversion", startsWithFollowedBySeparator),
   *   // https://stackoverflow.com/questions/20690499
   *   regexScanner(/^([a-zA-Z\u00C0-\u024F_]+)\s*(.*)$/, "identifier"),
   * ];
   *
   * The regex version is faster (~1400 vs ~1700 ms in chrome 65 for the following benchmark)
   *
   * const iterations = 100000;
   * console.time('Function #1');
   * for (let i = 0; i < iterations; i++) {
   *   lex("a : (0.1 cm - x in) to m");
   * };
   * console.timeEnd('Function #1')
   *
   */
  private scanners: Scanner[];

  constructor(
    operatorNames: string[],
    unitNames: string[],
    aggregatorNames: string[],
    numberFormat: NumberFormat,
  ) {
    this.scanners = [
      regexScanner(/^(#.*)(.*)$/, "comment"),
      regexScanner(/^([:=])\s*(.*)$/, "assignment"),
      regexScanner(/^([\(])\s*(.*)$/, "("),
      regexScanner(/^([\)])\s*(.*)$/, ")"),
      regexScanner(numberFormat.getRegExp(), "number"),
      nameScanner(operatorNames, "operator", startsWith(operatorNames)),
      nameScanner(aggregatorNames, "aggregator", startsWith(operatorNames)),
      nameScanner(unitNames, "unit", startsWith(operatorNames)),
      // https://stackoverflow.com/questions/20690499
      regexScanner(/^([a-zA-Z\u00C0-\u024F_]+)\s*(.*)$/, "identifier"),
    ];
  }

  public lex(line: string): LexerResult {
    const tokens: Token[] = [];
    while (line.trim().length > 0) {
      const result = this.tryScanners(line.trim());
      if (result) {
        tokens.push(result[0]);
        line = result[1];
      } else {
        return {
          type: "error",
          description: `Cannot lex "${line}"`,
          tokens: new List(tokens),
        };
      }
    }

    return {
      type: "success",
      tokens: new List(tokens),
    };
  }

  private tryScanners(line: string): [Token, string] | null {
    for (const scanner of this.scanners) {
      const result = scanner(line);
      if (result) {
        return result;
      }
    }
    return null;
  }
}

function startsWith(separators: string[]): (name: string, input: string) => boolean {
  return (haytack: string, needle: string) => {
    if (haytack.toLowerCase().indexOf(needle.toLowerCase()) !== 0) {
      return false;
    }
    if (needle.match(/^[a-z]+$/i)) {
      const remaining = haytack.substr(needle.length);
      return (
        remaining === "" ||
        remaining[0] === " " ||
        remaining[0] === ")" ||
        separators.indexOf(remaining[0]) !== -1
      );
    }
    return true;
  };
}

function nameScanner(
  names: string[],
  type: TokenType,
  condition: (name: string, input: string) => boolean,
): Scanner {
  return (input: string) => {
    for (const name of names) {
      if (condition(input, name)) {
        return [
          {
            type,
            value: name,
          },
          input.substr(name.length),
        ];
      }
    }
    return null;
  };
}

function regexScanner(regex: RegExp, type: TokenType): Scanner {
  return (input: string) => {
    const matched = input.match(regex);
    if (matched !== null) {
      return [
        {
          type,
          value: matched[1],
        },
        matched[2],
      ];
    }
    return null;
  };
}
