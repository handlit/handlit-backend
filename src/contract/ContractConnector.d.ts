import "./ContractConnector.js";

declare module "contract/ContractConnector" {
  export default class ContractConnector {
    constructor();
    async mintCard(to, uri): any;
    async mintSocialToken(cardOwner, to, uri?): any;
  }
}
