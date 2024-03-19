import { Pipe, PipeTransform } from "@angular/core";
import { isJsonString } from "@icc/common-lib";

@Pipe({
  name: "parser",
})
export class ParserPipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): unknown {
    return isJsonString(value) ? JSON.parse(value).content : value;
  }
}
