import { EggLogger } from "egg";
import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
} from "@eggjs/tegg";
import { ComponentNg2Vue } from "app/parse";

@HTTPController({
  path: "/",
})
export class HomeController {
  @Inject()
  logger: EggLogger;

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "/",
  })
  async index() {
    this.logger.info("hello egg logger");
    const ng2Vue = new ComponentNg2Vue();
    const content = await ng2Vue.exec(
      "D:/code/icc-web-view/frontkit/icc-admin/projects/aim/src/app/routes/template-library/create/target-click",
      "D:/code/icc-web-view/frontkit/vue-admin/projects/aim/src/views/template-library/create/target-click.vue",
      // "E:/icc/v5.4.0/frontkit/icc-admin/projects/standard/src/app/routes/business/material/common-material/common/quote-record/quote-record.component.ts",
      // "E:/icc/v5.4.0/frontkit/vue-admin/projects/standard/src/views/business/material/components/quote-record.vue"
      // {
      //   props: ["tplList"],
      // }
    );
    return content;
  }
}
