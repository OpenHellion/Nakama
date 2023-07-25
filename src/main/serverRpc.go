// serverRpc.go
//
// Copyright (C) 2023, OpenHellion contributors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"

	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/proto"
)

type RegisterServerRequest struct {
	AuthToken  string
	Location   string
	GamePort   int
	StatusPort int
	Hash       uint
}

type RegisterServerResponse struct {
	ServerId             string
	AdminIpAddressRanges []IpAddressRange
}

type IpAddressRange struct {
	StartAddress string
	EndAddress   string
}

// Called every time a server starts.
func ServerRegister(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	logger.Debug("Received RPC with payload" + payload)

	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if ok && userId != "" {
		logger.Error("rpc was called by a user")
		return "", runtime.NewError("rpc is only callable via server to server", PERMISSION_DENIED)
	}

	clientIp, ok := ctx.Value(runtime.RUNTIME_CTX_CLIENT_IP).(string)
	if !ok || clientIp == "" {
		logger.Error("rpc message sent had no client ip.")
		return "", runtime.NewError("IP was not provided", PERMISSION_DENIED)
	}

	var message RegisterServerRequest
	if err := json.Unmarshal([]byte(payload), &message); err != nil {
		logger.Error("Unmarshaling failed. " + err.Error())
		return "", err
	}

	if message.Hash != CurrentHash {
		return "", runtime.NewError("Server has invalid hash.", UNAVAILABLE)
	}

	// TODO: Cant get this to find the file
	// Decode whitelist.
	/*file, err := nk.ReadFile("nakama/data/serverWhitelist.json")
	if err != nil {
		return "", runtime.NewError("Main server could not read whitelist file.", NOT_FOUND)
	}

	result := map[string]interface{}{}
	json.NewDecoder(file).Decode(&result)

	defer file.Close()

	// Check if server is whitelisted.
	if _, isMapContainsKey := result[message.AuthToken]; !isMapContainsKey {
		return "", runtime.NewError("Server is not whitelisted.", PERMISSION_DENIED)
	}*/

	// Actually create the match.
	matchInfo := map[string]interface{}{
		"location":   message.Location,
		"ip":         clientIp,
		"gamePort":   message.GamePort,
		"statusPort": message.StatusPort,
	}
	matchId, err := nk.MatchCreate(ctx, MAIN_MATCH_HANDLER, matchInfo)
	if err != nil {
		logger.Error("Failed when attempting to create new match. " + err.Error())
		return "", err
	}

	// Write a response.
	response, err := json.Marshal(RegisterServerResponse{
		ServerId: matchId,
	})
	if err != nil {
		logger.Error("Marshaling failed. " + err.Error())
		return "", err
	}

	return string(response), nil
}

// Not used.
func ServerSendMessage(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)

	if ok && userId != "" {
		logger.Error("rpc was called by a user")
		return "", runtime.NewError("rpc is only callable via server to server", 7)
	}

	message := &DataMessage{}
	if err := proto.Unmarshal([]byte(payload), message); err != nil {
		return "", err
	}

	// Decode whitelist.
	file, _ := os.Open("serverWhitelist.json")
	defer file.Close()
	result := map[string]interface{}{}
	json.NewDecoder(file).Decode(&result)

	// Check if server is whitelisted.
	if _, isMapContainsKey := result[message.AuthToken]; !isMapContainsKey {
		return "", runtime.NewError("Server is not whitelisted.", PERMISSION_DENIED)
	}

	return "", nil
}
