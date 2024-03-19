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
      // "D:/code/icc-web-view/frontkit/icc-admin/plugins/rcs5g-lib/src/lib/component/5g-editor/g5-editor.component.ts",
      "D:/code/icc-web-view/frontkit/icc-admin/projects/standard/src/app/routes/sys/config",
      "D:/code/icc-web-view/frontkit/vue-admin/projects/standard/src/views/sys/config"
      // "D:/code/icc-web-view/frontkit/vue-admin/projects/icc-msgs/packages/rcs5g/components/rscs5g-editor",
      // {
      //   props: ["tplList"],
      // }
    );
    return content;
  }
}
