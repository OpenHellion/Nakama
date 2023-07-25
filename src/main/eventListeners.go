// eventListeners.go
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

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
)

func RegisterEventListeners(logger runtime.Logger, initializer runtime.Initializer) error {
	if err := initializer.RegisterBeforeCreateGroup(BeforeCreateGroup); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	return nil
}

func BeforeCreateGroup(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, in *api.CreateGroupRequest) (*api.CreateGroupRequest, error) {
	return nil, runtime.NewError("Creating groups has been disabled.", UNIMPLEMENTED)
}
