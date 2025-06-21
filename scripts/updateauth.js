// 抑制 punycode 废弃警告，避免干扰交互式输入
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // 忽略 punycode 废弃警告
  }
  console.warn(warning.message);
});

const { Api, JsonRpc, RpcError } = require('eosjs');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const { SignatureProvider } = require('../src/sig');
const { chains } = require('../config');
const { privateToPublic } = require('../src/utils');

async function updateAuth(chainName, accountName, accountPrivateKey){
  const chain = chains.find(chain => chain.name === chainName);
  
  if (!chain) {
    throw new Error(`Chain '${chainName}' not found in configuration`);
  }
  
  const {chainId, rpcUrl, keyPrefix, systemAccount} = chain;
  const claimPrivateKey = process.env.PRIVATE_KEY;
  const claimPublicKey = claimPrivateKey ? privateToPublic(claimPrivateKey, keyPrefix) : process.env.PUBLIC_KEY;
  if (!claimPublicKey) {
    throw new Error('Claim public key not found, please set PUBLIC_KEY in environment variables');
  }
  const signatureProvider = SignatureProvider([accountPrivateKey], keyPrefix);

  const rpc = new JsonRpc(rpcUrl, { fetch });

  const api = new Api({ chainId, rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  try {
    const result = await api.transact({
      actions: [{
        account: systemAccount,
        name: 'updateauth',
        authorization: [{
          actor: accountName,
          permission: 'owner',
        }],
        data: {
          account:accountName,
          permission: 'claim',
          parent: 'active',
          auth: {
            threshold: 1,
            keys: [{
              key: claimPublicKey,
              weight: 1
            }],
            accounts: [],
            waits: []
          }
        },
      },{
        account: systemAccount,
        name: 'linkauth',
        authorization: [{
          actor: accountName,
          permission: 'owner',
        }],
        data: {
          account:accountName,
          code: systemAccount,
          type: 'claimrewards',
          requirement: 'claim'
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });
    console.log('Transaction successful:');
    console.dir(result);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// 获取用户输入的函数
function getUserInput(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    
    let input = '';
    const onData = (chunk) => {
      const data = chunk.toString();
      if (data.includes('\n')) {
        process.stdin.removeListener('data', onData);
        process.stdin.pause();
        resolve(input + data.replace('\n', '').replace('\r', ''));
      } else {
        input += data;
      }
    };
    
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
  });
}

// 交互式获取参数
async function getInteractiveInput() {
  try {
    console.log('Please provide the following information:');
    
    const chainNames = chains.map(chain => chain.name).join(', ');
    const chainName = await getUserInput(`Chain Name (${chainNames}): `);
    const accountName = await getUserInput('Account Name: ');
    const accountPrivateKey = await getUserInput('Account Private Key: ');
    
    return { 
      chainName: chainName.trim(), 
      accountName: accountName.trim(), 
      accountPrivateKey: accountPrivateKey.trim() 
    };
  } catch (error) {
    console.error('Error getting user input:', error);
    process.exit(1);
  }
}

// 解析命令行参数
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 3) {
    return {
      chainName: args[0],
      accountName: args[1],
      accountPrivateKey: args[2]
    };
  }
  
  return null;
}

// 显示使用说明
function showUsage() {
  console.log('Usage:');
  console.log('  node updateauth.js <chainName> <accountName> <accountPrivateKey>');
  console.log('  or run without arguments for interactive mode');
  console.log('');
  console.log('Example:');
  console.log('  node updateauth.js eos myaccount 5KQwrPbwxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
}

// 主函数
async function main() {
  try {
    let params;
    
    // 尝试从命令行参数获取
    params = parseCommandLineArgs();
    
    if (!params) {
      // 如果没有提供足够的命令行参数，使用交互式输入
      if (process.argv.length > 2) {
        console.error('Error: Invalid number of arguments.');
        showUsage();
        process.exit(1);
      }
      
      // 给一个小延时确保警告消息不会干扰交互
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('No command line arguments provided. Starting interactive mode...\n');
      params = await getInteractiveInput();
    }
    
    const { chainName, accountName, accountPrivateKey } = params;
    
    // 验证参数
    if (!chainName || !accountName || !accountPrivateKey) {
      console.error('Error: All parameters are required.');
      process.exit(1);
    }
    
    console.log(`\nExecuting updateAuth for:`);
    console.log(`  Chain: ${chainName}`);
    console.log(`  Account: ${accountName}`);
    console.log(`  Private Key: ${accountPrivateKey.substring(0, 10)}...`);
    console.log('');
    
    // 执行 updateAuth
    await updateAuth(chainName, accountName, accountPrivateKey);
    
    console.log('\nUpdate auth completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// 如果这个文件被直接运行，则执行主函数
if (require.main === module) {
  main();
}

module.exports = { updateAuth };

