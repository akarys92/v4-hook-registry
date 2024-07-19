const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');

// Load hooks.json
const hooks = JSON.parse(fs.readFileSync('hooks.json', 'utf8'));

// Etherscan API key
const apiKey = process.env.ETHERSCAN_API_KEY;

async function getTransactionHash(contractAddress, apiKey) {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;
  const response = await axios.get(url);

  if (response.data.status !== "1") {
    throw new Error('Failed to fetch transactions');
  }

  const transactions = response.data.result;

  for (const tx of transactions) {
    if (tx.to === "") {
      return tx.hash;
    }
  }

  throw new Error('Contract creation transaction not found');
}

async function getDeployerAddressByTxHash(txHash, apiKey) {
  const url = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`;
  const response = await axios.get(url);

  if (response.data.result) {
    return response.data.result.from;
  } else {
    throw new Error('Failed to fetch transaction details');
  }
}

// Verify each hook metadata
(async () => {
  for (const hook of hooks) {
    try {
      const { metadata, signature } = hook;
      const contractAddress = metadata.address;

      // Fetch deployer address
      const txHash = await getTransactionHash(contractAddress, apiKey);
      const deployerAddress = await getDeployerAddressByTxHash(txHash, apiKey);

      // Verify the signature
      const recoveredAddress = ethers.utils.verifyMessage(JSON.stringify(metadata), signature);

      if (recoveredAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error(`Signature verification failed for contract: ${contractAddress}`);
      }

      console.log(`Signature verification succeeded for contract: ${contractAddress}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  process.exit(0);
})();
