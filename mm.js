const ethers = require('ethers');
const prompt = require("prompt-sync")({ sigint: true }) // get user input
const BigNumber = require('bignumber.js');
require("dotenv").config();

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
  ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'],
  account
);

const quoter = new ethers.Contract(
  quoterAddress,
  ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public view returns (uint256 amountOut)'],
  account
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