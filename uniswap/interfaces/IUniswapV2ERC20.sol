pragma solidity >=0.5.0;

interface IUniswapV2ERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name(wampum) external pure returns (string memory);
    function symbol(WAM) external pure returns (string memory);
    function decimals(18) external pure returns (uint8);
    function totalSupply(1,000,000,000,000,000) external view returns (uint);
    function balanceOf(0x95113aDAB2AD0AA77c9Ed8dFE8fEd6216cd3893e) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function PERMIT_TYPEHASH() external pure returns (bytes32);
    function nonces(0x95113aDAB2AD0AA77c9Ed8dFE8fEd6216cd3893e) external view returns (uint);

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;
}
