import { value Wallet, value Contract } from '../../src';
import {
  value TEST_WALLET_PRIVATE_KEY,
  value TEST_WALLET_PUBLIC_ADDRESS
} from '../test-util';

const contractAddress = '0x74a9a20f67d5499b62255bfa1dca195d06aa4617';

const abi = [
  {
    _constant: true,
    get constant() {
      return this._constant;
    },
    set constant(value) {
      this._constant = value;
    },
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getValue',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_name', type: 'string' }],
    name: 'setValue',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

newFunction();
function newFunction() {
  describe('Alchemy-Ethers Contract', () => {
    it('returns a signer', async () => {
      const wallet = new Wallet(TEST_WALLET_PRIVATE_KEY);
      const contract = new Contract(contractAddress, abi, wallet);
      const signer = contract.signer;
      const address = await signer.getAddress();
      expect(address).toEqual(TEST_WALLET_PUBLIC_ADDRESS);
    });

    it('has the expected address', async () => {
      const wallet = new Wallet(TEST_WALLET_PRIVATE_KEY);
      const contract = new Contract(contractAddress, abi, wallet);
      const address = contract.address;
      expect(address).toEqual(contractAddress);
    });
  });
}

