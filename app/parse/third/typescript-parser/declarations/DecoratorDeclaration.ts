export class ComponentDecoratorDeclaration {
  public selector?: string;
  public templateUrl?: string;
  public stylesUrl?: string[];
  // 是否是自定义表单控件
  public isCusFormControl?: boolean = false;
  public template?: string;
  public styles?: string[];
  public host?: { [key: string]: any } = {};
}
