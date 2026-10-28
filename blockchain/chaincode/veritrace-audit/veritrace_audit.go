// VeriTrace-X audit chaincode (sketch).
//
// A minimal Hyperledger Fabric smart contract that anchors audit-event hashes and
// verifies them. Only hashes are stored on-chain — never sensitive payloads.
//
// This is a reference implementation for the production path (BLOCKCHAIN_MODE=fabric).
// Build/deploy it with the Fabric toolchain (see ../../README.md). It is intentionally
// not compiled or run as part of the default dev setup, which uses a local hash-chain.
package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// AuditContract anchors and verifies audit-event hashes.
type AuditContract struct {
	contractapi.Contract
}

// AuditRecord is the on-chain record: an event id and its hash (no sensitive data).
type AuditRecord struct {
	EventID string `json:"eventId"`
	Hash    string `json:"hash"`
	TxTime  string `json:"txTime"`
}

// RecordHash writes an event's hash to the ledger (idempotent per eventId).
func (c *AuditContract) RecordHash(ctx contractapi.TransactionContextInterface, eventID string, hash string) error {
	existing, err := ctx.GetStub().GetState(eventID)
	if err != nil {
		return fmt.Errorf("read failed: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("event %s already anchored", eventID)
	}
	ts, _ := ctx.GetStub().GetTxTimestamp()
	rec := AuditRecord{EventID: eventID, Hash: hash, TxTime: ts.String()}
	b, _ := json.Marshal(rec)
	return ctx.GetStub().PutState(eventID, b)
}

// VerifyHash returns true iff the stored hash for eventID equals the supplied hash.
func (c *AuditContract) VerifyHash(ctx contractapi.TransactionContextInterface, eventID string, hash string) (bool, error) {
	b, err := ctx.GetStub().GetState(eventID)
	if err != nil {
		return false, fmt.Errorf("read failed: %w", err)
	}
	if b == nil {
		return false, nil // not anchored
	}
	var rec AuditRecord
	if err := json.Unmarshal(b, &rec); err != nil {
		return false, err
	}
	return rec.Hash == hash, nil
}

func main() {
	cc, err := contractapi.NewChaincode(&AuditContract{})
	if err != nil {
		panic(fmt.Sprintf("create chaincode: %v", err))
	}
	if err := cc.Start(); err != nil {
		panic(fmt.Sprintf("start chaincode: %v", err))
	}
}
