const errorDisabled: nkruntime.Error = {
	message: "Function is disabled",
	code: nkruntime.Codes.UNIMPLEMENTED
}

const canOnlyBeCalledByServer: nkruntime.Error = {
	message: "RPC is only callable from server to server.",
	code: nkruntime.Codes.PERMISSION_DENIED
}

const invalidVersion: nkruntime.Error = {
	message: "Provided version or hash is incorrect.",
	code: nkruntime.Codes.PERMISSION_DENIED
}

const noMatches: nkruntime.Error = {
	message: "No matches found with criteria.",
	code: nkruntime.Codes.NOT_FOUND
}

const noServers: nkruntime.Error = {
	message: "No registered server could be found on your ip.",
	code: nkruntime.Codes.NOT_FOUND
}

const invalidUUID: nkruntime.Error = {
	message: "UUID was not expected.",
	code: nkruntime.Codes.PERMISSION_DENIED
}

const CurrentHash = 2708603976
const CurrentVersion = "1.0rc1"

let InitModule: nkruntime.InitModule =
	function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
		initializer.registerStorageIndex("MatchesIx", "matches_collection", "", ["location"], 5000, true)

		// Disable a whole bunch of features
		initializer.registerBeforeCreateGroup(beforeDisabled)
		initializer.registerBeforeUpdateGroup(beforeDisabled)
		initializer.registerBeforeJoinTournament(beforeDisabled)
		initializer.registerBeforeAuthenticateApple(beforeDisabled)
		initializer.registerBeforeAuthenticateCustom(beforeDisabled)
		initializer.registerBeforeAuthenticateDevice(beforeDisabled)
		initializer.registerBeforeAuthenticateFacebook(beforeDisabled)
		initializer.registerBeforeAuthenticateFacebookInstantGame(beforeDisabled)
		initializer.registerBeforeAuthenticateGameCenter(beforeDisabled)
		initializer.registerBeforeAuthenticateGoogle(beforeDisabled)
		initializer.registerBeforeImportFacebookFriends(beforeDisabled)
		initializer.registerBeforeLinkApple(beforeDisabled)
		initializer.registerBeforeLinkCustom(beforeDisabled)
		initializer.registerBeforeLinkEmail(beforeDisabled)
		initializer.registerBeforeLinkDevice(beforeDisabled)
		initializer.registerBeforeLinkFacebook(beforeDisabled)
		initializer.registerBeforeLinkFacebookInstantGame(beforeDisabled)
		initializer.registerBeforeLinkGameCenter(beforeDisabled)
		initializer.registerBeforeLinkGoogle(beforeDisabled)
		initializer.registerBeforeListMatches(beforeDisabled)
		initializer.registerBeforeValidatePurchaseApple(beforeDisabled)
		initializer.registerBeforeValidatePurchaseGoogle(beforeDisabled)
		initializer.registerBeforeValidatePurchaseHuawei(beforeDisabled)
		initializer.registerBeforeValidateSubscriptionApple(beforeDisabled)
		initializer.registerBeforeWriteLeaderboardRecord(beforeDisabled)

		// Server RPC
		initializer.registerRpc("register_server", serverRegister)
		initializer.registerRpc("unregister_server", serverUnregister)

		// Client RPC
		initializer.registerRpc("client_find_match", clientFindMatch)
		initializer.registerRpc("client_get_match_info", clientGetMatchInfo)
	}

let beforeDisabled: nkruntime.BeforeHookFunction<any> =
	function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: any): any {
		logger.error("Tried to use disabled function.")
		throw errorDisabled;
	}

let serverRegister: nkruntime.RpcFunction =
	function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
		logger.debug("Received RPC with payload " + payload)

		if (ctx.userId != null)
		{
			logger.error("RPC was called by a user.")
			throw canOnlyBeCalledByServer
		}

		let message = JSON.parse(payload);

		/*if (message.Hash != CurrentHash) {
			logger.error("Server registering has invalid hash.")
			throw invalidVersion;
		}*/

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

		let matchInfo = {
			"location": message.Location,
			"ip": ctx.clientIp,
			"gamePort": message.GamePort,
			"statusPort": message.StatusPort
		}

		const matchId = nk.uuidv4()

		const write: nkruntime.StorageWriteRequest = {
			collection:"matches_collection",
			key: matchId,
			value: matchInfo,
			permissionRead: 1,
			permissionWrite: 0,
			userId: undefined
		}

		nk.storageWrite([write])

		const registerServerResponse = {
			ServerId: matchId,
			AdminIpAddressRanges: undefined
		}

		return JSON.stringify(registerServerResponse);
	}

let serverUnregister: nkruntime.RpcFunction =
	function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
		logger.debug("Received RPC with payload " + payload)

		if (ctx.userId != null)
		{
			logger.error("RPC was called by a user.")
			throw canOnlyBeCalledByServer
		}

		let message = JSON.parse(payload);

		let objectIds: nkruntime.StorageReadRequest = {
			collection: 'matches_collection',
			key: message.ServerId,
			userId: "00000000-0000-0000-0000-000000000000"
		}

		const servers: nkruntime.StorageObject[] = nk.storageRead([objectIds])
		const result = servers.filter(server => server.value.ip == ctx.clientIp && server.value.gamePort == message.GamePort && server.value.statusPort == message.StatusPort)

		if (result.length == 0)
		{
			logger.error("Error proccessing unregister server request; server not found.")
			throw noServers;
		}
		else
		{
			nk.storageDelete([message.ServerId])
			return "success";
		}
	}

let clientFindMatch: nkruntime.RpcFunction =
	function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
		logger.debug("Received RPC with payload " + payload)

		let message = JSON.parse(payload);

		if (message.Version != CurrentVersion)
		{
			logger.error("Client connecting has invalid version.")
			throw invalidVersion;
		}

		/*if (message.Hash != CurrentHash) {
			logger.error("Client connecting has invalid hash.")
			throw invalidVersion;
		}*/

		const joinQuery = "+value.location:" + message.Location // TODO: Sanitize this

		const matches: nkruntime.StorageObject[] = nk.storageIndexList("MatchesIx", joinQuery, 10)

		if (matches.length == 0)
		{
			logger.error("No matches found with query" + joinQuery)
			throw noMatches;
		}

		const findMatchesResponse = {
			MatchesId: matches.map(match => match.key)
		}

		return JSON.stringify(findMatchesResponse);
	}

let clientGetMatchInfo: nkruntime.RpcFunction =
	function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
		logger.debug("Received RPC with payload " + payload)

		// TODO: Validate payload (matchId).

		const storageRead: nkruntime.StorageReadRequest = {
			collection: "matches_collection",
			key: payload,
			userId: "00000000-0000-0000-0000-000000000000"
		}

		const results = nk.storageRead([storageRead])

		if (results.length == 0)
		{
			logger.error("Found no matches with id " + payload)
			throw noMatches;
		}

		if (results.length > 1)
		{
			logger.warn("Found several matches with id " + payload)
		}

		return JSON.stringify(results[0].value);
	}
