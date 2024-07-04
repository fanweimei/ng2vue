// export function generateStCode(
//   fnName: string,
//   url: string,
//   method: string = "post",
//   params: string
// ) {
//   let paramsStr = "";
//   if (params) {
//     params = params.endsWith(",") ? params : `${params},`;
//     paramsStr = `
//       params: {
//         ${params},
//         ...(rest?.params || {})
//       }
//     `;
//   } else {
//     paramsStr = `
//       params: {
//         ...(rest?.params || {})
//       }
//     `;
//   }
//   return `
//     function ${fnName}(params?: LoadDataParams, onChangeParams?: OnChangeCallbackParams) {
//       const { pi, ps, ...rest } = params || {};
//       console.log(99, rest)
//       console.log(st.value)
//       return http.${method}(${url}, {
//         ps,
//         pi,
//         ${paramsStr.trim()}
//       });
//     }
//   `;
// }
export function replaceSt() {
  return (blockSource: string) => {
    this.varParser.vSt.forEach((name) => {
      blockSource = blockSource.replace(
        new RegExp(`this.${name}._data`, "g"),
        `this.${name}.tableData`
      );
      blockSource = blockSource.replace(
        new RegExp(`this.${name}.el.nativeElement`, "g"),
        `this.${name}.el.value`
      );
      blockSource = blockSource.replace(
        new RegExp(`this.${name}.pi`, "g"),
        `this.${name}.pi`
      );
      blockSource = blockSource.replace(
        new RegExp(`this.${name}.ps`, "g"),
        `this.${name}.ps`
      );
    });
    return blockSource;
  };
}
