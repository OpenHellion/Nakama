// main.go
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

	"github.com/heroiclabs/nakama-common/runtime"
)

const (
	OK                  = 0
	CANCELED            = 1
	UNKNOWN             = 2
	INVALID_ARGUMENT    = 3
	DEADLINE_EXCEEDED   = 4
	NOT_FOUND           = 5
	ALREADY_EXISTS      = 6
	PERMISSION_DENIED   = 7
	RESOURCE_EXHAUSTED  = 8
	FAILED_PRECONDITION = 9
	ABORTED             = 10
	OUT_OF_RANGE        = 11
	UNIMPLEMENTED       = 12
	INTERNAL            = 13
	UNAVAILABLE         = 14
	DATA_LOSS           = 15
	UNAUTHENTICATED     = 16
)

const MAIN_MATCH_HANDLER = "main_match_handler"

// Main method.
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	if err := RegisterEventListeners(logger, initializer); err != nil {
		return err
	}

	if err := InitClientRpc(logger, initializer); err != nil {
		return err
	}

	if err := InitServerRpc(logger, initializer); err != nil {
		return err
	}

	if err := initializer.RegisterMatch(MAIN_MATCH_HANDLER, GetMatchType); err != nil {
		logger.Error("Unable to create main match handler: %v", err)
		return err
	}

	return nil
}

// Regisers all RPCs for game clients.
func InitClientRpc(logger runtime.Logger, initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("client_find_match", ClientFindMatch); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("client_get_match_info", GetMatchInfo); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	return nil
}

// Regisers all RPCs for server clients.
func InitServerRpc(logger runtime.Logger, initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("register_server", ServerRegister); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	return nil
}

func GetMatchType(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &DedicatedServerMatch{}, nil
}
