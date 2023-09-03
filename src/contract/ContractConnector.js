const ethers = require("ethers");

const cardSBTAddress = "0xB3CF48b4e5be979cF33F7E34d14145A9843e1723";
const socialTokenAddress = "0x40c445218419e176e8c974e1bB3a1983625A37Cc";
const sbtABI = require("./SBTABI.js");
const socialTokenABI = require("./SocialTokenABI.js");

const walletObj = new ethers.Wallet(process.env.WALLET_SECRET);
const provider = new ethers.getDefaultProvider("https://rpc.test.taiko.xyz");
const wallet = walletObj.connect(provider);

class ContractConnector {
  async mintCard(to, uri) {
    try {
      const sbt = this.sbtContract();
      const tx = await sbt.connect(wallet).mint(to, uri);
      await tx.wait();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  //   async burnCard(from, id) {}
  async mintSocialToken(cardOwner, to, uri = "") {
    try {
      let [tokenId, isInit] = await this.isInit(cardOwner);
      if (!isInit) {
        // const uri = "";
        const isSuccess = await this.initSocialToken(cardOwner, uri);
        if (!isSuccess) {
          return false;
        } else {
          tokenId = tokenId + 1;
        }
      }

      const socialToken = this.socialTokenContract();
      const tx = await socialToken.connect(wallet).mint(tokenId, to);
      await tx.wait();

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  async initSocialToken(cardOwner, uri) {
    try {
      const socialToken = this.socialTokenContract();
      const tx = await socialToken.connect(wallet).initMint(cardOwner, uri);
      await tx.wait();
      aa;

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async isInit(cardOwner) {
    try {
      const socialToken = this.socialTokenContract();
      const tokenOfOwner = await socialToken.connect(wallet).tokenOfowner(cardOwner);

      const isInit = tokenOfOwner.length > 0;
      return [tokenOfOwner[tokenOfOwner.length - 1], isInit];
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  //   async burnSocialToken(address) {}

  sbtContract() {
    return new ethers.Contract(cardSBTAddress, sbtABI, provider);
  }

  socialTokenContract() {
    return new ethers.Contract(socialTokenAddress, socialTokenABI, provider);
  }
}

module.exports = { ContractConnector };
