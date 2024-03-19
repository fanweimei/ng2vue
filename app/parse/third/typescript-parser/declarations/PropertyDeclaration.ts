import {
  CallExpression,
  Decorator,
  ModifierLike,
  NodeArray,
  SyntaxKind,
} from "typescript";
import {
  OptionalDeclaration,
  ScopedDeclaration,
  StaticDeclaration,
  TypedDeclaration,
} from "./Declaration";
import { DeclarationVisibility } from "./DeclarationVisibility";

/**
 * Property declaration that contains its visibility.
 *
 * @export
 * @class PropertyDeclaration
 * @implements {ScopedDeclaration}
 * @implements {TypedDeclaration}
 */
export class PropertyDeclaration
  implements
    OptionalDeclaration,
    ScopedDeclaration,
    StaticDeclaration,
    TypedDeclaration
{
  public isOutput?: boolean | undefined;
  public isInput?: boolean | undefined;
  public viewChild?: string | boolean | undefined;
  public viewChildren?: string | boolean | undefined;

  constructor(
    public name: string,
    public value: any,
    public visibility: DeclarationVisibility | undefined,
    public type: string | undefined,
    public isOptional: boolean,
    public isStatic: boolean,
    public start?: number,
    public end?: number
  ) {}

  setModifiers(modifiers: NodeArray<ModifierLike>) {
    const node = modifiers.find(
      (m) => m.kind == SyntaxKind.Decorator
    ) as Decorator;
    if (!node) {
      return;
    }
    const expr = node.expression as CallExpression;
    const name = expr.expression.getText();
    switch (name) {
      case "Input":
        this.isInput = true;
        break;
      case "Output":
        this.isOutput = true;
        break;
      case "ViewChild":
      case "ViewChildren":
        const arg = expr.arguments.find(
          (n) => n.kind == SyntaxKind.StringLiteral
        );
        if (arg) {
          this[name[0].toLowerCase() + name.slice(1)] = arg
            .getText()
            .replace(new RegExp(`"`, "g"), "");
        } else {
          this[name[0].toLowerCase() + name.slice(1)] = true;
        }
        break;
    }
  }
}
