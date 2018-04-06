import { List } from "./list";
import { operatorNames } from "./operator";
import { unitNames } from "./unit";

type TokenName =
  | "identifier"
  | "number"
  | "operator"
  | "unit"
  | "("
  | ")"
  | "assignment"
  | "comment";

export interface Token {
  name: TokenName;
  value: string;
}

export type Tokens = List<Token>;

export type LexerResult =
  | { type: "success"; tokens: Tokens }
  | { type: "error"; description: string; tokens: Tokens };

function scanComment(input: string): [Token, string] | null {
  if (input[0] === "#") {
    return [
      {
        name: "comment",
        value: input,
      },
      "",
    ];
  }
  return null;
}

function scanParenthesis(input: string): [Token, string] | null {
  const firstChar = input[0];
  if (firstChar === "(" || firstChar === ")") {
    return [
      {
        name: firstChar,
        value: firstChar,
      },
      input.substr(1),
    ];
  }
  return null;
}

function scanAssignment(input: string): [Token, string] | null {
  const firstChar = input[0];
  if (firstChar === ":" || firstChar === "=") {
    return [
      {
        name: "assignment",
        value: firstChar,
      },
      input.substr(1),
    ];
  }
  return null;
}

function scanNumber(input: string): [Token, string] | null {
  const matched = input.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  if (matched !== null) {
    return [
      {
        name: "number",
        value: matched[1],
      },
      matched[2],
    ];
  }
  return null;
}

function scanOperator(input: string): [Token, string] | null {
  for (const operator of operatorNames()) {
    if (input.indexOf(operator) === 0) {
      return [
        {
          name: "operator",
          value: operator,
        },
        input.substr(operator.length),
      ];
    }
  }
  return null;
}

function scanUnit(input: string): [Token, string] | null {
  for (const unit of unitNames()) {
    if (input.indexOf(unit) === 0) {
      return [
        {
          name: "unit",
          value: unit,
        },
        input.substr(unit.length),
      ];
    }
  }
  return null;
}

function scanIdentifier(input: string): [Token, string] | null {
  const matched = input.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*(.*)$/);
  if (matched !== null) {
    return [
      {
        name: "identifier",
        value: matched[1],
      },
      matched[2],
    ];
  }
  return null;
}

function tryScanners(line: string): [Token, string] | null {
  const scanners = [
    scanComment,
    scanAssignment,
    scanParenthesis,
    scanNumber,
    scanOperator,
    scanUnit,
    scanIdentifier,
  ];
  for (const scanner of scanners) {
    const result = scanner(line);
    if (result) {
      return result;
    }
  }
  return null;
}

export function lex(line: string): LexerResult {
  const tokens: Token[] = [];

  while (line.trim().length > 0) {
    const result = tryScanners(line.trim());
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
