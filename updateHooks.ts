import { ethers } from 'ethers';
import fs from 'fs';
import readline from 'readline';

// Function to read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

// Load existing hooks.json
const loadHooks = () => {
  if (fs.existsSync('hooks.json')) {
    const data = fs.readFileSync('hooks.json', 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Save updated hooks.json
const saveHooks = (hooks: any) => {
  fs.writeFileSync('hooks.json', JSON.stringify(hooks, null, 2), 'utf8');
};

// Main function
const main = async () => {
  const hooks = loadHooks();

  // Collect metadata input
  const address = await question('Enter the hook address: ');
  const chainId = await question('Enter the chain ID: ');
  const description = await question('Enter the hook description: ');
  const contact = await question('Enter the contact information: ');
  const docs = await question('Enter the docs URL: ');
  const privateKey = await question('Enter your private key: ');

  rl.close();

  // Create metadata object
  const metadata = {
    address,
    chainId,
    description,
    contact,
    docs
  };

  // Create a wallet instance
  const wallet = new ethers.Wallet(privateKey);

  // Sign the metadata
  const signature = await wallet.signMessage(JSON.stringify(metadata));

  // Create the signed metadata object
  const signedMetadata = {
    metadata,
    signature
  };

  // Append the signed metadata to the hooks array
  hooks.push(signedMetadata);

  // Save the updated hooks.json
  saveHooks(hooks);

  console.log('Metadata updated successfully!');
};

// Run the main function
main().catch(console.error);
