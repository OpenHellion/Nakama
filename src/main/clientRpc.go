// clientRpc.go
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

	"github.com/heroiclabs/nakama-common/runtime"
)

const (
	CurrentVersion = "0.6.0"
	CurrentHash    = 2001426978
)

type FindMatchesRequest struct {
	Version  string
	Location string
	Hash     uint
}

type FindMatchesResponse struct {
	MatchesId []string
}

type MatchInfo struct {
	Id         string
	Ip         string
	GamePort   int
	StatusPort int
}

func ClientFindMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	logger.Debug("Received RPC with payload" + payload)

	var message FindMatchesRequest
	if err := json.Unmarshal([]byte(payload), &message); err != nil {
		logger.Error("Unmarshaling failed. " + err.Error())
		return "", err
	}

	if message.Version != CurrentVersion {
		return "", runtime.NewError("Client is out of date with current version.", UNAVAILABLE)
	}

	/*if message.Hash != CurrentHash {
		return "", runtime.NewError("Client has invalid hash.", UNAVAILABLE)
	}*/

	searchCount := 5
	minSize := 0
	maxSize := 500
	joinQuery := "+label.location:" + message.Location
	matches, err := nk.MatchList(ctx, searchCount, true, "", &minSize, &maxSize, joinQuery)

	if err != nil {
		logger.Error("RPC failed to execute matchlist. " + err.Error())
		return "", err
	}

	matchIds := make([]string, searchCount)
	for i, element := range matches {
		matchIds[i] = element.MatchId
	}

	matchInfo := &FindMatchesResponse{
		MatchesId: matchIds,
	}

	out, err := json.Marshal(matchInfo)
	if err != nil {
		logger.Error("Marshaling failed. " + err.Error())
		return "", err
	}

	return string(out), nil
}

// Get match info stored in the MatchState struct.
func GetMatchInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	logger.Debug("Received RPC with payload" + payload)

	result, err := nk.MatchSignal(ctx, payload, "")

	if err != nil || result == "" {
		logger.WithField("err", err).Error("Match signal error.")
		return "", err
	} else {
		return result, nil
	}
}
