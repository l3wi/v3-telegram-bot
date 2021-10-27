const { Pool } = require('@uniswap/v3-sdk')
const { Token } = require('@uniswap/sdk-core')
const ethers = require('ethers')
const abis = require('./abis.js')

const positions = '0xc36442b4a4522e871399cd717abdd847ab11fe88'

const web3 = new ethers.providers.AlchemyProvider('homestead', process.env.API)

const getPool = (t1, t2, fee) => {
  const token0 = new Token(1, t1, 18)
  const token1 = new Token(1, t2, 18)
  return Pool.getAddress(token0, token1, fee)
}

const getPosition = async (id) => {
  const contract = new ethers.Contract(positions, abis.positions, web3)
  const data = await contract.positions(id)

  const pool = getPool(data.token0, data.token1, data.fee)
  const poolCont = new ethers.Contract(pool, abis.pool, web3)
  const slot0 = await poolCont.slot0()

  if (data.tickLower < slot0.tick && data.tickUpper > slot0.tick) {
    return true
  } else {
    return false
  }
}

module.exports = { getPool, getPosition }
