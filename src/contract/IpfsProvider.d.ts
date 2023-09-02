import "./IpfsProvider.js";

declare module "contract/IpfsProvider" {
  export default class IpfsProvider {
    constructor();

    async uploadImg(file): any;
    async uploadSBTMetadata(name, image): any;
    async uploadSocialTokenMetadata(name, image): any;
  }
}
