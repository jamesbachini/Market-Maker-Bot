import { Contract, ethers } from "ethers";
import promptSync from 'prompt-sync';
const prompt = promptSync();
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'
import cheerio from "cheerio";  
import Web3 from 'web3'
import { combinations, cos } from "mathjs";
import axios from 'axios'
import readline from 'readline'
import chalk from 'chalk'

dotenv.config()
readline.emitKeypressEvents(process.stdin)
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}



var ctx = new chalk.constructor({level: 3});
var web3Provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
var web3 = new Web3(web3Provider);
var arrayHashResultGetOnBlockChain = []
var arrayContractAddressGetByHashResult = []
var counterNewContract = 0
var exitVar = false
var getWithAddress = 0
var responseEtherscan = 0

const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Uniswap Router
const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // Uniswap Quoter
var wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
var provider = new ethers.JsonRpcProvider(`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
var ethQuantity = '0.001'
var buyAmount = ethers.parseUnits(ethQuantity, 'ether');// montant d'eth a swap
const fee = 3000; 
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);
var deadline 
var tx
var token
var sellAmount 

const router = new ethers.Contract(
  routerAddress,
  [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
  ],account
);

const quoter = new ethers.Contract(
  quoterAddress,
  [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public view returns (uint256 amountOut)'
  ],account
);



console.log(ctx.rgb(224, 49, 49)("Press 'SUPPR' to stop terminal"))
console.log(ctx.rgb(68, 192, 230)("Press 'Q' to exit selection \nPress 'A' to get contrat with address \nPress 'C' to scan blockchain \nPress 'B' to buy token \nPress 'S' to sell token"))



/** GLOBAL FUNCTION */

function resetVariable() {
  arrayHashResultGetOnBlockChain = []
  arrayContractAddressGetByHashResult = []
  counterNewContract = 0
  getWithAddress = 0
  responseEtherscan = 0
}

/** --------------- */



/** FUNCTION FOR GET ADDRESS ON BLOCKCHAIN */

function getContractInBlock() {
  /** permet de voir si de nouveaux contract on etait ajouter sur la blockchain */
  web3.eth.getBlock("latest").then((response) => {
    (response.transactions).forEach(element => {
      web3.eth.getTransaction(element)
        .then((response2) => {
          if ('to' in response2) {
            if (response2.to == null) {
              getContractAddressByHash(response2.hash)
              counterNewContract++
            }
          }
        });
    });
  });

 
  if (exitVar == true) {
    console.log("EXIT BLOCK EXPLORE")
    exitVar = false
  } else if (counterNewContract >= 0 ) {
    if (counterNewContract >= 1 ) {
      tradeToken()

       //console.log("number contract : " + counterNewContract)
      console.log("------------------------------------------------------")
      for (let i = 0; i < arrayContractAddressGetByHashResult.length; i++) {
        console.log(arrayContractAddressGetByHashResult[i].contract)
      }
      console.log("------------------------------------------------------")
    }
    setTimeout(() => {
      getContractInBlock()
    }, 13000);
  } 
  
}

async function getContractAddressByHash(hash) {
  /*** permet de recupérer l'adresse du contract d'un token a partir d'un hash de transaction */
  var responseContractAddress = await web3.eth.getTransactionReceipt(hash).then((responde) => {
    return responde.contractAddress
  });
  if (responseContractAddress != undefined) {
    arrayContractAddressGetByHashResult.push({contract: responseContractAddress, timeCreate: Date.now()})
  }
}

function tradeToken() {
  
}

/** ----------------- */



/** FUNCTION GET ADDRESS ON WALLET */

async function getContractAddressByHashArray() {
  /*** permet de recupérer l'adresse du contract d'un token a partir d'un tableau de hash de transaction */
  for (let i = 0; i < arrayHashResultGetOnBlockChain.length; i++) {
    var responseContractAddress = await web3.eth.getTransactionReceipt(arrayHashResultGetOnBlockChain[i])
      .then((responde) => {
        if (responde.logs.length != 0) {
          return responde.logs[2].address
        }
      });
      if (responseContractAddress != undefined) {
        arrayContractAddressGetByHashResult.push(responseContractAddress)
      }
  }
  console.log(arrayContractAddressGetByHashResult)
}

async function GetHashByAddress() {
  /** permet de recuperer d'historique des transaction d'une adresse de wallet sur etherscan */
  responseEtherscan =  await axios('https://etherscan.io/address/0x52349Cc33b14B7ED72696f1d7FC8B17A1117E7d6')
  const $ = cheerio.load(responseEtherscan.data);
  const allRows = $('table.table > tbody > tr');

  allRows.slice(0,25).each((index, element) => {
    const tds = $(element).find('td');
    if ($(tds[2]).text() == 'Swap ETH For Exa...') {
      if ($(tds[1]).text().includes(' ')) {
        arrayHashResultGetOnBlockChain.push($(tds[1]).text().substring(1))
        counterNewContract++
      } else {
        arrayHashResultGetOnBlockChain.push($(tds[1]).text())
        counterNewContract++
      }
    }
  })

  if (exitVar == true) {
    console.log("EXIT ADDRESS EXPLORE")
    exitVar = false
  } else if (counterNewContract >= 0) { 
    if (arrayHashResultGetOnBlockChain != []) {
      await getContractAddressByHashArray()
    }
    setTimeout(() => {
      arrayHashResultGetOnBlockChain = []
      responseEtherscan = 0
      counterNewContract = 0
      arrayContractAddressGetByHashResult = []
      GetHashByAddress()
    }, 10000);
  } 
}

/** ------------------ */



/** MANUEL TRADE */
var tebtestaddress= ['0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', '0x07865c6e87b9f70255377e024ace6630c1eaa37f']

var arrayHistoriBuyToken = []

function executeBuyRequestEth(contrat) {
  return new Promise(async result => {
    console.log('Buying Tokens')
    deadline = Math.floor(Date.now() / 1000) + 600;
    tx = await router.exactInputSingle([wethAddress, contrat, fee, wallet.address, deadline, buyAmount, 0, 0], {value: buyAmount});
    await tx.wait()/* .then((e) => {console.log(e)}); */
    var amountOut = await quoter.quoteExactInputSingle(wethAddress, contrat, fee, buyAmount, 0);
    var countBuyToken = (BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)

    //console.log(`Current Exchange Rate: ${amountOut.toString()}`);
    //console.log(`Current Exchange Rate: ${((BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)).toString()}`);
    //console.log('Quantity buy : ' + countBuyToken)
    //console.log(tx.hash);

    var callback = {
      contrat: contrat,
      quantityBuyInGwei: amountOut,
      quantityBuyForToken: countBuyToken,
      time: Date.now(),
      hashTransaction: tx.hash
    }
    result(callback)
  })
}

async function test() {
  for (let i = 0; i < tebtestaddress.length; i++) {
    const result = await executeBuyRequestEth(tebtestaddress[i])
    arrayHistoriBuyToken.push(result)
  }
  console.log(arrayHistoriBuyToken)
  console.log(ctx.bold('---------PURCHASE COMPLETE---------'))
  console.log(ctx.rgb(68, 192, 230)("Press 'SUPPR' to stop terminal or 'S' to sell token"))
}


function executeSellRequestEth(contrat) {
  return new Promise(async result => {
    console.log('Selling Tokens')
    token = new ethers.Contract(
      contrat.contrat,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
      ],account
    );

    sellAmount = BigNumber(contrat.quantityBuyInGwei).toString()

    const allowance = await token.allowance(wallet.address, routerAddress);
    console.log(`Current allowance: ${allowance}`);
    /**aurosiration contract */
    if (allowance < sellAmount) {
      console.log('Approving Spend (bulk approve in production)');
      const atx = await token.approve(routerAddress, sellAmount);
      await atx.wait();
    }

    deadline = Math.floor(Date.now() / 1000) + 600;
    const tx = await router.exactInputSingle([contrat.contrat, wethAddress, fee, wallet.address, deadline, sellAmount, 0, 0]);
    await tx.wait();
    //console.log(tx.hash);

    var callback = {
      contrat: contrat.contrat,
      quantitySellInGwei: BigNumber(contrat.quantityBuyInGwei),
      quantitySellForToken: contrat.quantityBuyForToken,
      time: Date.now(),
      hashTransaction: tx.hash
    }
    result(callback)
  })
}

async function testSell() {
  for (let i = 0; i < arrayHistoriBuyToken.length; i++) {
    const result = await executeSellRequestEth(arrayHistoriBuyToken[i])
    console.log(result)
  }
}







function buyTokens() {
  tebtestaddress.forEach(async element => {
    console.log('Buying Tokens')
    const test = element
    tx = await router.exactInputSingle([wethAddress, test, fee, wallet.address, deadline, buyAmount, 0, 0], {value: buyAmount});
    await tx.wait().then((e) => {console.log(e)});
    amountOut = await quoter.quoteExactInputSingle(wethAddress, test, fee, buyAmount, 0);
  
    console.log(`Current Exchange Rate: ${amountOut.toString()}`);
    //console.log(`Current Exchange Rate: ${((BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)).toString()}`);
    countBuyToken = (BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)
    console.log('Quantity buy : ' + countBuyToken)
    console.log(tx.hash);
  });
}

const sellTokens = async () => {
  console.log('Selling Tokens')
  const allowance = await token.allowance(wallet.address, routerAddress);
  console.log(`Current allowance: ${allowance}`);
  if (allowance < sellAmount) {
    console.log('Approving Spend (bulk approve in production)');
    const atx = await token.approve(routerAddress, sellAmount);
    await atx.wait();
  }
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const tx = await router.exactInputSingle([tokenAddress, wethAddress, fee, wallet.address, deadline, sellAmount, 0, 0]);
  await tx.wait();
  console.log(tx.hash);
}



/** ------------ */


function start() {
  process.stdin.on('keypress', async (chunk, key) => {
    /* permet de changer la detection des touches pour intéragir avec le script*/
    if (key && key.name == 'q'){
      exitVar = true
      start()
      resetVariable()
    }
    if (key && key.name == 'delete'){
      process.exit()
    }
    if (key && key.name == 'a') {
      await GetHashByAddress()
    }
    if (key && key.name == 'c') {
      console.log(ctx.bold('---------START GET ADDRESS ON BLOCKCHAIN---------'))
      resetVariable()
      getContractInBlock()
    }
    if (key && key.name == 'b') {
      test()
    }
    if (key && key.name == 's') {
      testSell()
    }
  });
}

start()
  
/*
const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Uniswap Router
const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // Uniswap Quoter
var wethAddress = ''
var provider = ''
var ethQuantity = ''
var countBuyToken = ''
var sellAmount = '';
var buyAmount = ''

var typeChain = prompt("Ethereum (e) or Goerli (g) :  ");
var tokenAddress = prompt("Token adress : ");
if (typeChain == 'e') {
  wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // mainnet eth
  provider = new ethers.JsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`);//eth rpc
} else if (typeChain == 'g') {
  wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'; // goerli weth
  provider = new ethers.JsonRpcProvider(`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);//goerli rpc
}
const fee = 3000; // Uniswap pool fee bps 500, 3000, 10000
var typeTrade = prompt("Selle (s) or Buy (b) :  ");
if (typeTrade == 's') {
  sellAmount = prompt("Token quantity :  ");
  buyAmount = 0
} else if (typeTrade == 'b') {
  ethQuantity = prompt("Eth quantity :  ");
  buyAmount = ethers.parseUnits(ethQuantity, 'ether');// montant d'eth a swap
}

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);




//const targetPrice = BigInt(35); // target exchange rate
//const targetAmountOut = buyAmount * targetPrice;
//const tradeFrequency = 3600 * 1000; // ms (once per hour)


//const wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'; // goerli weth
//const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // mainnet eth
//const tokenAddress = '0xF5081b106AbbE443FC62384b3724620Fc9599c46'; // goerli uni
// `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
//const provider = new ethers.JsonRpcProvider(`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);



const token = new ethers.Contract(
  tokenAddress,
  [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) public view returns (uint256)',
  ],account
);

const router = new ethers.Contract(
  routerAddress,
  [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
  ],account
);

const quoter = new ethers.Contract(
  quoterAddress,
  [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public view returns (uint256 amountOut)'
  ],account
);

const buyTokens = async () => {
  console.log('Buying Tokens')
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const tx = await router.exactInputSingle([wethAddress, tokenAddress, fee, wallet.address, deadline, buyAmount, 0, 0], {value: buyAmount});
  await tx.wait();
  const amountOut = await quoter.quoteExactInputSingle(wethAddress, tokenAddress, fee, buyAmount, 0);

  console.log(`Current Exchange Rate: ${amountOut.toString()}`);
  //console.log(`Current Exchange Rate: ${((BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)).toString()}`);
  countBuyToken = (BigNumber(amountOut) * BigNumber(0.000000000000000001)).toPrecision(6)
  console.log('Quantity buy : ' + countBuyToken)
  console.log(tx.hash);
}

const sellTokens = async () => {
  console.log('Selling Tokens')
  const allowance = await token.allowance(wallet.address, routerAddress);
  console.log(`Current allowance: ${allowance}`);
  if (allowance < sellAmount) {
    console.log('Approving Spend (bulk approve in production)');
    const atx = await token.approve(routerAddress, sellAmount);
    await atx.wait();
  }
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const tx = await router.exactInputSingle([tokenAddress, wethAddress, fee, wallet.address, deadline, sellAmount, 0, 0]);
  await tx.wait();
  console.log(tx.hash);
}

if (typeTrade == 's') {
  sellTokens()
} else if (typeTrade == 'b') {
  buyTokens()  
}

*/









//buyTokens()
//sellTokens()

/*const checkPrice = async () => {
  const amountOut = await quoter.quoteExactInputSingle(wethAddress, tokenAddress, fee, buyAmount, 0);
  console.log(`Current Exchange Rate: ${amountOut.toString()}`);
  console.log(`Target Exchange Rate: ${targetAmountOut.toString()}`);
  if (amountOut < targetAmountOut) buyTokens();
  if (amountOut > targetAmountOut) sellTokens();
}

checkPrice();
setInterval(() => {
  checkPrice();
}, tradeFrequency)*/