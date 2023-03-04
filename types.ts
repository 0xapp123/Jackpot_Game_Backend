export type Approve = {
  "version": "0.1.0",
  "name": "approve",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "chageUpdaterRole",
      "docs": [
        "* Change the wallet's role as updater or not\n     * @param is_updater = 1: the wallet will be updater and if 0, not"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRoleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAddr",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isUpdater",
          "type": "u64"
        }
      ]
    },
    {
      "name": "operatePda",
      "docs": [
        "* Operate the PDA by the updater\n     * @param operation = 0: deny the operation\n     * @param operation = 1: accept the operation"
      ],
      "accounts": [
        {
          "name": "updater",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRoleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "operatorPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "vaultBump",
          "type": "u8"
        },
        {
          "name": "operation",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createOperation",
      "docs": [
        "* Create the operation by caller\n     * @param amount: this is the amount of assets\n     * @param msg: the msg to send to the operator"
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "operatorPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "assets",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "srcAssetAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destAssetAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "msg",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "roleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "operation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "userAddress",
            "type": "publicKey"
          },
          {
            "name": "assets",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "u64"
          },
          {
            "name": "operationMsg",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAdmin",
      "msg": "Invalid Admin Address"
    },
    {
      "code": 6001,
      "name": "InvalidInputData",
      "msg": "Invalid Input Data for Updater"
    },
    {
      "code": 6002,
      "name": "InvalidAssetsAddr",
      "msg": "Invalid Assets Address for Creating PDA"
    },
    {
      "code": 6003,
      "name": "InvalidAccAmount",
      "msg": "Invalid Remaining Accounts Amount"
    },
    {
      "code": 6004,
      "name": "InvalidDenyDestAddr",
      "msg": "Invalid Dest Address when Deny"
    },
    {
      "code": 6005,
      "name": "InvalidAcceptDestAddr",
      "msg": "Invalid Dest Address when Accept"
    },
    {
      "code": 6006,
      "name": "InvalidSrcAta",
      "msg": "Invalid Source ATA Address"
    },
    {
      "code": 6007,
      "name": "InvalidDestAta",
      "msg": "Invalid Destination ATA Address"
    }
  ]
};

export const IDL: Approve = {
  "version": "0.1.0",
  "name": "approve",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "chageUpdaterRole",
      "docs": [
        "* Change the wallet's role as updater or not\n     * @param is_updater = 1: the wallet will be updater and if 0, not"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRoleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAddr",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isUpdater",
          "type": "u64"
        }
      ]
    },
    {
      "name": "operatePda",
      "docs": [
        "* Operate the PDA by the updater\n     * @param operation = 0: deny the operation\n     * @param operation = 1: accept the operation"
      ],
      "accounts": [
        {
          "name": "updater",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRoleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "operatorPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "vaultBump",
          "type": "u8"
        },
        {
          "name": "operation",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createOperation",
      "docs": [
        "* Create the operation by caller\n     * @param amount: this is the amount of assets\n     * @param msg: the msg to send to the operator"
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "operatorPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "assets",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "srcAssetAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destAssetAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "msg",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "roleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "operation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "userAddress",
            "type": "publicKey"
          },
          {
            "name": "assets",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "u64"
          },
          {
            "name": "operationMsg",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAdmin",
      "msg": "Invalid Admin Address"
    },
    {
      "code": 6001,
      "name": "InvalidInputData",
      "msg": "Invalid Input Data for Updater"
    },
    {
      "code": 6002,
      "name": "InvalidAssetsAddr",
      "msg": "Invalid Assets Address for Creating PDA"
    },
    {
      "code": 6003,
      "name": "InvalidAccAmount",
      "msg": "Invalid Remaining Accounts Amount"
    },
    {
      "code": 6004,
      "name": "InvalidDenyDestAddr",
      "msg": "Invalid Dest Address when Deny"
    },
    {
      "code": 6005,
      "name": "InvalidAcceptDestAddr",
      "msg": "Invalid Dest Address when Accept"
    },
    {
      "code": 6006,
      "name": "InvalidSrcAta",
      "msg": "Invalid Source ATA Address"
    },
    {
      "code": 6007,
      "name": "InvalidDestAta",
      "msg": "Invalid Destination ATA Address"
    }
  ]
};
