const ipfs = require("ipfs-http-client");

const projectId = proccess.env.IPFS_ID;
const projectSecret = proccess.env.IPFS_SECRET;

const auth = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString(
  "base64"
)}`;

const ipfsClient = ipfs.create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

class IpfsProvider {
  async uploadImg(file) {
    try {
      const result = await ipfsClient.add(file);
      return `https://ipfs.infura.io/ipfs/${result.path}`;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async uploadSBTMetadata(name, image) {
    try {
      const metadata = {
        name,
        description: `Soul Bound Token For [${name}]`,
        image,
      };

      const result = await ipfsClient.add(JSON.stringify(metadata));
      return `https://ipfs.infura.io/ipfs/${result.path}`;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async uploadSocialTokenMetadata(name, image) {
    try {
      const metadata = {
        name,
        description: `Social Token By Handlit`,
        image,
      };

      const result = await ipfsClient.add(JSON.stringify(metadata));
      return `https://ipfs.infura.io/ipfs/${result.path}`;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

module.exports = IpfsProvider;