#!/usr/bin/env node
// Generate secure admin token for Phase 2 admin endpoints

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function generateToken() {
  return crypto.randomBytes(32).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function updateEnvFile(envPath, key, value) {
  let content = '';
  
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      console.log(`✓ Updated ${key} in .env file`);
    } else {
      content += `\n${key}=${value}\n`;
      console.log(`✓ Added ${key} to .env file`);
    }
  } else {
    // Try to copy from .env.example
    const examplePath = path.join(path.dirname(envPath), '.env.example');
    if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, 'utf8');
      content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
      console.log(`✓ Created .env file from .env.example`);
    } else {
      content = `${key}=${value}\n`;
      console.log(`✓ Created .env file with ${key}`);
    }
  }
  
  fs.writeFileSync(envPath, content, 'utf8');
}

async function promptYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${question} (Y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

async function main() {
  console.log('\n🔐 Generating secure ADMIN_TOKEN...\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  const adminToken = generateToken();
  
  updateEnvFile(envPath, 'ADMIN_TOKEN', adminToken);
  
  console.log('\n📝 Your ADMIN_TOKEN:');
  console.log(`   ${adminToken}`);
  console.log('\n✓ Token has been saved to .env file');
  console.log('  Use this token in the "x-admin-token" header for admin endpoints\n');
  
  // Optional: Generate webhook secret
  console.log('---');
  const generateWebhook = await promptYesNo('\n🔗 Generate WEBHOOK_SECRET too?');
  
  if (generateWebhook) {
    const webhookSecret = generateToken();
    updateEnvFile(envPath, 'WEBHOOK_SECRET', webhookSecret);
    
    console.log('\n📝 Your WEBHOOK_SECRET:');
    console.log(`   ${webhookSecret}`);
  }
  
  console.log('\n✅ Done! You can now start the services:');
  console.log('   npm run start-proxy');
  console.log('   npm run start:webhooks');
  console.log('   npm run start:sync\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
