import { ethers } from 'ethers'
import { config } from 'dotenv'

export const UNIREP_ADDRESS = '0x4D137bb44553d55AE6B28B5391c6f537b06C9cc3'
export const APP_ADDRESS = '0x9A676e781A523b5d0C0e43731313A708CB607508'
export const ETH_PROVIDER_URL = 'http://127.0.0.1:8545'
export const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'


export const SERVER = 'http://localhost:8000'
// export const SERVER = 'https://relay.demo.unirep.io'
export const KEY_SERVER = 'http://localhost:8000/build/'
// export const KEY_SERVER = 'https://keys.unirep.io/2-beta-1/'

config()


export const DB_PATH = process.env.DB_PATH ?? ':memory:'

export const provider = ETH_PROVIDER_URL.startsWith('http')
  ? new ethers.providers.JsonRpcProvider(ETH_PROVIDER_URL)
  : new ethers.providers.WebSocketProvider(ETH_PROVIDER_URL)
