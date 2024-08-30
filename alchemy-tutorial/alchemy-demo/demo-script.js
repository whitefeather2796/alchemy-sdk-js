curl --request POST \
     --url https://eth-mainnet.g.alchemy.com/v2/U4bP6Gi1i7Ck_ZiwHxGmTACV4Q-XGgPq \
          --header 'accept: application/json' \
               --header 'content-type: application/json' \
                    --data '
                    {
                      "id": 1,
                        "jsonrpc": "2.0",
                          "method": "alchemy_getTokenBalances",
                            "params": [
                                "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                                    "erc20"
                                      ]
                                      }
                                      '